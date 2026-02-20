
"use client";

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, setDoc, Timestamp, deleteDoc, writeBatch, getDocs, where, runTransaction, increment, serverTimestamp, addDoc } from 'firebase/firestore';
import type { FirestoreOrder, FirestoreDevice, Prices, ContactSettings, HomepageSettings, AdminOrder, AdminDevice, GoalsSettings, DeliverySettings, AdminUser, UserRole, DeliveryRecord, FirestoreDeliveryRecord, AdminExpense, FirestoreExpense, Product, FirestoreProduct } from '@/lib/types';
import { useUser } from '@/hooks/use-user';

function formatOrderItems(order: FirestoreOrder): string {
    if (order.productType === 'generic') {
        const parts = [];
        if (order.variationName && order.variationName !== 'Default') {
            parts.push(`${order.quantity}x ${order.optionName} (${order.variationName})`);
        } else {
            parts.push(`${order.quantity}x ${order.optionName}`);
        }
        return parts.join(' ') + ` [${order.productName}]`;
    }

    const quantity = order.quantity;
    if (order.chickenType === 'whole') {
        return `${quantity}x Whole Chicken${quantity > 1 ? 's' : ''}`;
    }
    
    if (order.chickenType === 'pieces' && order.piecesType === 'custom' && order.pieceDetails) {
        const details = Object.entries(order.pieceDetails)
            .filter(([, qty]) => qty > 0)
            .map(([piece, qty]) => `${qty}x ${piece.charAt(0).toUpperCase() + piece.slice(1)}`)
            .join(', ');
        return details || `${quantity}x Mixed Piece${quantity > 1 ? 's' : ''}`;
    }

    return `${quantity}x Mixed Piece${quantity > 1 ? 's' : ''}`;
}

const defaultPrices: Prices = {
    whole: 150.00,
    mixedPiece: 15.00,
    isChoosePiecesEnabled: true,
    pieces: { breasts: 30.0, thighs: 20.0, drumsticks: 15.0, wings: 10.0 },
    profit_whole: 0,
    profit_mixedPiece: 0,
    profit_breasts: 0,
    profit_thighs: 0,
    profit_drumsticks: 0,
    profit_wings: 0,
};

const defaultContact: ContactSettings = { callNumber: '+260975565291', whatsappNumber: '+260975565291' };
const defaultHomepage: HomepageSettings = { 
    storefrontTitle: 'FarmFresh Store',
    storefrontSubtitle: 'The best farm-to-table products, delivered right to your campus.',
    title: 'The Best on Campus', 
    subtitle: 'Preorder now and pay when your product is delivered!', 
    isBounceAnimationEnabled: true, 
    formLayout: 'continuous', 
    wholeChickenImageUrl: 'https://i.postimg.cc/JhFDRd2m/359635-removebg-preview.png', 
    piecesImageUrl: 'https://i.postimg.cc/G2Zc5WS4/359689-removebg-preview.png' 
};
const defaultDelivery: DeliverySettings = { totalSlots: 50, disableWhenSlotsFull: true, slotsFullMessage: "We're fully booked! Check back later.", nextDeliveryDate: undefined, isSlotsEnabled: true };
const defaultGoals: GoalsSettings = { salesTarget: 0, reservationsTarget: 0, devicesTarget: 0, startDate: undefined, endDate: undefined };

interface AdminContextType {
    orders: AdminOrder[];
    devices: AdminDevice[];
    users: AdminUser[];
    expenses: AdminExpense[];
    products: Product[];
    deliveredRecords: DeliveryRecord[];
    droppedRecords: DeliveryRecord[];
    userRole: UserRole | null;
    confirmDelivery: (orderId: string) => void;
    markAsDelivered: (orderId: string) => void;
    cancelOrder: (orderId: string) => void;
    restoreOrder: (orderId: string) => void;
    dropOrder: (orderId: string) => void;
    addExpense: (expenseData: Omit<AdminExpense, 'id' | 'createdAt' | 'formattedDate'>) => void;
    deleteExpense: (expenseId: string) => void;
    saveProduct: (productData: Partial<Product>) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    deleteRecord: (recordId: string) => Promise<void>;
    clearAllOrders: () => void;
    resetSlots: () => void;
    deliverySettings: DeliverySettings;
    setDeliverySettings: (settings: DeliverySettings) => void;
    prices: Prices;
    setPrices: (prices: Prices) => void;
    contact: ContactSettings;
    setContact: (contact: ContactSettings) => void;
    homepage: HomepageSettings;
    setHomepage: (homepage: HomepageSettings) => void;
    goals: GoalsSettings;
    setGoals: (goals: GoalsSettings) => void;
    clearGoals: () => void;
    updateUserRole: (userId: string, role: UserRole) => void;
    isLoading: boolean;
    isSaving: boolean;
    saveAllSettings: () => void;
    processingOrder: string | null;
    financials: {
        totalSales: number;
        totalProfit: number;
        totalCapitalExpenses: number;
        totalOperationalExpenses: number;
        netOperatingProfit: number;
    }
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [devices, setDevices] = useState<AdminDevice[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [expenses, setExpenses] = useState<AdminExpense[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(defaultDelivery);
    const [prices, setPrices] = useState<Prices>(defaultPrices);
    const [contact, setContact] = useState<ContactSettings>(defaultContact);
    const [homepage, setHomepage] = useState<HomepageSettings>(defaultHomepage);
    const [goals, setGoals] = useState<GoalsSettings>(defaultGoals);
    const [deliveredRecords, setDeliveredRecords] = useState<DeliveryRecord[]>([]);
    const [droppedRecords, setDroppedRecords] = useState<DeliveryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [processingOrder, setProcessingOrder] = useState<string | null>(null);
    const { toast } = useToast();
    const { userRole } = useUser();

     const financials = useMemo(() => {
        const deliveredOrders = orders.filter(o => o.status === 'Delivered');
        const totalSales = deliveredOrders.reduce((sum, order) => sum + order.price, 0);

        const totalProfit = deliveredOrders.reduce((sum, order) => {
            let orderProfit = 0;
            const fullOrder = order.fullOrder;
            if (fullOrder.productType === 'generic') {
                const product = products.find(p => p.id === fullOrder.productId);
                const variation = product?.variations?.find(v => v.name === fullOrder.variationName);
                const option = variation?.options?.find(o => o.name === fullOrder.optionName);
                orderProfit = (option?.profit || 0) * fullOrder.quantity;
            } else {
                if (fullOrder.chickenType === 'whole') {
                    orderProfit = (prices.profit_whole || 0) * fullOrder.quantity;
                } else if (fullOrder.chickenType === 'pieces') {
                    if (fullOrder.piecesType === 'mixed') {
                        orderProfit = (prices.profit_mixedPiece || 0) * fullOrder.quantity;
                    } else if (fullOrder.piecesType === 'custom' && fullOrder.pieceDetails) {
                        orderProfit += (fullOrder.pieceDetails.breasts || 0) * (prices.profit_breasts || 0);
                        orderProfit += (fullOrder.pieceDetails.thighs || 0) * (prices.profit_thighs || 0);
                        orderProfit += (fullOrder.pieceDetails.drumsticks || 0) * (prices.profit_drumsticks || 0);
                        orderProfit += (fullOrder.pieceDetails.wings || 0) * (prices.profit_wings || 0);
                    }
                }
            }
            return sum + orderProfit;
        }, 0);
        
        const totalCapitalExpenses = expenses.filter(e => e.expenseType === 'capital').reduce((sum, expense) => sum + expense.amount, 0);
        const totalOperationalExpenses = expenses.filter(e => e.expenseType === 'operational').reduce((sum, expense) => sum + expense.amount, 0);

        return { 
            totalSales, totalProfit, totalCapitalExpenses, totalOperationalExpenses,
            netOperatingProfit: totalProfit - totalOperationalExpenses
        };
    }, [orders, prices, expenses, products]);

    useEffect(() => {
        if (!userRole) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const subscriptions: (() => void)[] = [];

        if (userRole === 'admin' || userRole === 'assistant') {
            const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
            subscriptions.push(onSnapshot(q, (querySnapshot) => {
                const fetchedOrders: AdminOrder[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data() as Omit<FirestoreOrder, 'id'>;
                    const firestoreOrder = { id: doc.id, ...data } as FirestoreOrder;
                    fetchedOrders.push({
                        id: doc.id,
                        date: data.createdAt?.toDate() || new Date(),
                        formattedDate: data.createdAt ? format(data.createdAt.toDate(), 'do MMMM, yyyy') : 'Pending',
                        items: formatOrderItems(firestoreOrder),
                        price: data.price, status: data.status, name: data.name, phone: data.phone,
                        deliveryLocationType: data.deliveryLocationType, school: data.school, block: data.block, room: data.room,
                        area: data.area, street: data.street, houseNumber: data.houseNumber, fullOrder: firestoreOrder,
                    });
                });
                setOrders(fetchedOrders);
            }));

            subscriptions.push(onSnapshot(query(collection(db, "deliveredRecords"), orderBy("lastActionAt", "desc")), (snapshot) => {
                setDeliveredRecords(snapshot.docs.map(doc => {
                    const data = doc.data() as FirestoreDeliveryRecord;
                    return {
                        id: doc.id, name: data.name, phone: data.phone, deliveryLocationType: data.deliveryLocationType,
                        school: data.school, block: data.block, room: data.room, area: data.area, street: data.street,
                        houseNumber: data.houseNumber, lastActionAt: data.lastActionAt?.toDate() || new Date(),
                        formattedLastActionAt: data.lastActionAt ? format(data.lastActionAt.toDate(), 'do MMMM, yyyy, hh:mm a') : 'Pending',
                    };
                }));
            }));

            subscriptions.push(onSnapshot(query(collection(db, "droppedRecords"), orderBy("lastActionAt", "desc")), (snapshot) => {
                setDroppedRecords(snapshot.docs.map(doc => {
                    const data = doc.data() as FirestoreDeliveryRecord;
                    return {
                        id: doc.id, name: data.name, phone: data.phone, deliveryLocationType: data.deliveryLocationType,
                        school: data.school, block: data.block, room: data.room, area: data.area, street: data.street,
                        houseNumber: data.houseNumber, lastActionAt: data.lastActionAt?.toDate() || new Date(),
                        formattedLastActionAt: data.lastActionAt ? format(data.lastActionAt.toDate(), 'do MMMM, yyyy, hh:mm a') : 'Pending',
                    };
                }));
            }));
        }
        
        if (userRole === 'admin') {
            subscriptions.push(onSnapshot(query(collection(db, "devices"), orderBy("lastSeenAt", "desc")), (querySnapshot) => {
                const fetchedDevices: AdminDevice[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data() as FirestoreDevice;
                    if (data.createdAt && data.lastSeenAt) {
                        fetchedDevices.push({
                            id: doc.id, createdAt: data.createdAt.toDate(),
                            formattedCreatedAt: format(data.createdAt.toDate(), 'do MMMM, yyyy'),
                            formattedLastSeenAt: formatDistanceToNow(data.lastSeenAt.toDate(), { addSuffix: true }),
                            userAgent: data.userAgent,
                        });
                    }
                });
                setDevices(fetchedDevices);
            }));

            subscriptions.push(onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), (querySnapshot) => {
                setUsers(querySnapshot.docs.map(doc => ({
                    id: doc.id, email: doc.data().email, role: doc.data().role || 'customer',
                    createdAt: doc.data().createdAt ? format(doc.data().createdAt.toDate(), 'do MMMM, yyyy') : 'N/A',
                })));
            }));

            subscriptions.push(onSnapshot(query(collection(db, 'expenses'), orderBy('createdAt', 'desc')), (snapshot) => {
                setExpenses(snapshot.docs.map(doc => {
                    const data = doc.data() as FirestoreExpense;
                    return {
                        id: doc.id, description: data.description, amount: data.amount, category: data.category,
                        expenseType: data.expenseType || 'operational', createdAt: data.createdAt?.toDate() || new Date(),
                        formattedDate: data.createdAt ? format(data.createdAt.toDate(), 'do MMM, yyyy') : 'Pending'
                    };
                }));
            }));

            // Handle Product Sorting with index fallback
            const productsRef = collection(db, 'products');
            const primaryQuery = query(productsRef, orderBy('displayOrder', 'asc'), orderBy('createdAt', 'desc'));
            
            const unsubProducts = onSnapshot(primaryQuery, (snapshot) => {
                setProducts(snapshot.docs.map(doc => {
                    const data = doc.data() as FirestoreProduct;
                    return { id: doc.id, ...data, createdAt: data.createdAt?.toDate() || new Date() } as Product;
                }));
            }, (error) => {
                console.warn("Missing index for primary product sort, falling back:", error);
                const fallbackQuery = query(productsRef, orderBy('createdAt', 'desc'));
                onSnapshot(fallbackQuery, (snapshot) => {
                    setProducts(snapshot.docs.map(doc => {
                        const data = doc.data() as FirestoreProduct;
                        return { id: doc.id, ...data, createdAt: data.createdAt?.toDate() || new Date() } as Product;
                    }));
                });
            });
            subscriptions.push(unsubProducts);

            const fetchSettings = async () => {
                try {
                    const deliveryDocSnap = await getDoc(doc(db, 'settings', 'delivery'));
                    if (deliveryDocSnap.exists()) {
                        const data = deliveryDocSnap.data();
                        setDeliverySettings({
                            nextDeliveryDate: data.nextDeliveryDate?.toDate(),
                            totalSlots: data.totalSlots ?? defaultDelivery.totalSlots,
                            disableWhenSlotsFull: data.disableWhenSlotsFull ?? defaultDelivery.disableWhenSlotsFull,
                            slotsFullMessage: data.slotsFullMessage ?? defaultDelivery.slotsFullMessage,
                            isSlotsEnabled: typeof data.isSlotsEnabled === 'boolean' ? data.isSlotsEnabled : defaultDelivery.isSlotsEnabled,
                        });
                    }
                    const pricesDocSnap = await getDoc(doc(db, 'settings', 'pricing'));
                    if (pricesDocSnap.exists()) setPrices({ ...defaultPrices, ...pricesDocSnap.data() } as Prices);
                    const contactDocSnap = await getDoc(doc(db, 'settings', 'contact'));
                    if (contactDocSnap.exists()) setContact(contactDocSnap.data() as ContactSettings);
                    const homepageDocSnap = await getDoc(doc(db, 'settings', 'homepage'));
                    if (homepageDocSnap.exists()) {
                        const data = homepageDocSnap.data();
                        setHomepage({
                            storefrontTitle: data.storefrontTitle || defaultHomepage.storefrontTitle,
                            storefrontSubtitle: data.storefrontSubtitle || defaultHomepage.storefrontSubtitle,
                            title: data.title || defaultHomepage.title,
                            subtitle: data.subtitle || defaultHomepage.subtitle,
                            isBounceAnimationEnabled: typeof data.isBounceAnimationEnabled === 'boolean' ? data.isBounceAnimationEnabled : defaultHomepage.isBounceAnimationEnabled,
                            formLayout: data.formLayout || defaultHomepage.formLayout,
                            wholeChickenImageUrl: data.wholeChickenImageUrl || defaultHomepage.wholeChickenImageUrl,
                            piecesImageUrl: data.piecesImageUrl || defaultHomepage.piecesImageUrl,
                        });
                    }
                    const goalsDocSnap = await getDoc(doc(db, 'settings', 'goals'));
                    if (goalsDocSnap.exists()) {
                        const gData = goalsDocSnap.data();
                        setGoals({ salesTarget: gData.salesTarget || 0, reservationsTarget: gData.reservationsTarget || 0, devicesTarget: gData.devicesTarget || 0, startDate: gData.startDate?.toDate(), endDate: gData.endDate?.toDate() });
                    }
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSettings();
        } else {
            setIsLoading(false);
        }

        return () => subscriptions.forEach(sub => sub());
    }, [toast, userRole]);

    const confirmDelivery = async (orderId: string) => {
        setProcessingOrder(orderId);
        try {
            await updateDoc(doc(db, 'orders', orderId), { status: 'Confirmed' });
            toast({ title: "Order Updated", description: `Order ${orderId} has been confirmed.` });
        } finally {
            setProcessingOrder(null);
        }
    };

    const markAsDelivered = async (orderId: string) => {
        setProcessingOrder(orderId);
        try {
            await runTransaction(db, async (transaction) => {
                const orderDoc = await transaction.get(doc(db, 'orders', orderId));
                if (!orderDoc.exists() || orderDoc.data().status === 'Delivered') return;
                const orderData = orderDoc.data() as FirestoreOrder;
                transaction.update(doc(db, 'orders', orderId), { status: 'Delivered' });
                if (['Pending', 'Confirmed'].includes(orderData.status)) transaction.update(doc(db, 'slots', 'live_counter'), { count: increment(-1) });
                if (orderData.deviceId) {
                    transaction.set(doc(db, 'deliveredRecords', orderData.deviceId), { ...orderData, lastActionAt: serverTimestamp() });
                }
            });
            toast({ title: "Order Updated", description: `Order ${orderId} has been marked as delivered.` });
        } finally {
            setProcessingOrder(null);
        }
    };
    
    const cancelOrder = async (orderId: string) => {
        setProcessingOrder(orderId);
        try {
            await updateDoc(doc(db, 'orders', orderId), { status: 'Cancelled' });
            toast({ title: "Order Cancelled", description: `Order ${orderId} has been cancelled.` });
        } finally {
            setProcessingOrder(null);
        }
    };

    const restoreOrder = async (orderId: string) => {
        setProcessingOrder(orderId);
        try {
            await updateDoc(doc(db, 'orders', orderId), { status: 'Pending' });
            toast({ title: "Order Restored", description: `Order ${orderId} has been restored to Pending.` });
        } finally {
            setProcessingOrder(null);
        }
    };
    
    const dropOrder = async (orderId: string) => {
        setProcessingOrder(orderId);
        try {
            await runTransaction(db, async (transaction) => {
                const orderDoc = await transaction.get(doc(db, 'orders', orderId));
                if (!orderDoc.exists()) return;
                const orderData = orderDoc.data() as FirestoreOrder;
                if (orderData.deviceId) {
                    transaction.set(doc(db, 'droppedRecords', orderData.deviceId), { ...orderData, lastActionAt: serverTimestamp() });
                }
                transaction.delete(doc(db, 'orders', orderId));
                if (orderData.status !== 'Delivered') transaction.update(doc(db, 'slots', 'live_counter'), { count: increment(-1) });
            });
            toast({ title: "Order Dropped", description: `Order ${orderId} has been permanently deleted.` });
        } finally {
            setProcessingOrder(null);
        }
    };

    const addExpense = async (expenseData: any) => {
        try {
            await addDoc(collection(db, 'expenses'), { ...expenseData, createdAt: serverTimestamp() });
            toast({ title: 'Success', description: 'Expense has been added.' });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add expense.' });
        }
    }

    const deleteExpense = async (expenseId: string) => {
        try {
            await deleteDoc(doc(db, 'expenses', expenseId));
            toast({ title: 'Success', description: 'Expense has been deleted.' });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete expense.' });
        }
    }

    const saveProduct = async (productData: Partial<Product>) => {
        setIsSaving(true);
        try {
            const { id, ...data } = productData;
            const finalData = {
                ...data,
                displayOrder: Number(data.displayOrder || 10),
                isActive: data.isActive ?? true,
            };

            if (id) {
                await setDoc(doc(db, 'products', id), { ...finalData, updatedAt: serverTimestamp() }, { merge: true });
                toast({ title: 'Product Updated', description: 'The product has been successfully updated.' });
            } else {
                await addDoc(collection(db, 'products'), { ...finalData, createdAt: serverTimestamp() });
                toast({ title: 'Product Created', description: 'New product has been added to your catalog.' });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save product.' });
        } finally {
            setIsSaving(false);
        }
    };

    const deleteProduct = async (productId: string) => {
        setIsSaving(true);
        try {
            await deleteDoc(doc(db, 'products', productId));
            toast({ title: 'Product Deleted', description: 'The product has been removed.' });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete product.' });
        } finally {
            setIsSaving(false);
        }
    };

    const deleteRecord = async (recordId: string) => {
        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'deliveredRecords', recordId));
            batch.delete(doc(db, 'droppedRecords', recordId));
            await batch.commit();
        } catch (error) {
            toast({ variant: 'destructive', title: "Deletion Failed", description: "Could not remove record." });
            throw error;
        }
    };
    
    const clearAllOrders = async () => {
        setIsSaving(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'orders'));
            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => batch.delete(doc.ref));
            batch.set(doc(db, 'slots', 'live_counter'), { count: 0 });
            await batch.commit();
            toast({ title: "Success", description: "All order data has been cleared." });
        } finally {
            setIsSaving(false);
        }
    };

    const resetSlots = async () => {
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'slots', 'live_counter'), { count: 0 });
            toast({ title: "Success", description: "Slot count has been reset to 0." });
        } finally {
            setIsSaving(false);
        }
    };

    const saveAllSettings = async () => {
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            batch.set(doc(db, 'settings', 'delivery'), { ...deliverySettings, nextDeliveryDate: deliverySettings.nextDeliveryDate ? Timestamp.fromDate(deliverySettings.nextDeliveryDate) : null }, { merge: true });
            batch.set(doc(db, 'settings', 'pricing'), prices, { merge: true });
            batch.set(doc(db, 'settings', 'contact'), contact, { merge: true });
            batch.set(doc(db, 'settings', 'homepage'), homepage, { merge: true });
            batch.set(doc(db, 'settings', 'goals'), { ...goals, startDate: goals.startDate ? Timestamp.fromDate(goals.startDate) : null, endDate: goals.endDate ? Timestamp.fromDate(goals.endDate) : null }, { merge: true });
            await batch.commit();
            localStorage.setItem('curbsidePrices', JSON.stringify(prices));
            toast({ title: 'Success!', description: 'All settings have been saved.' });
        } finally {
            setIsSaving(false);
        }
    }
    
    const clearGoals = () => setGoals(defaultGoals);

    const updateUserRole = async (userId: string, role: UserRole) => {
        if (userRole !== 'admin') return;
        try {
            await updateDoc(doc(db, 'users', userId), { role });
            toast({ title: "User Role Updated", description: `User role has been successfully updated to ${role}.` });
        } catch {
            toast({ variant: 'destructive', title: "Update Failed", description: `Could not update user role.` });
        }
    };


    return (
        <AdminContext.Provider value={{ 
            orders, devices, users, expenses, products, deliveredRecords, droppedRecords, userRole,
            confirmDelivery, markAsDelivered, cancelOrder, restoreOrder, dropOrder,
            addExpense, deleteExpense, saveProduct, deleteProduct, deleteRecord, clearAllOrders, resetSlots,
            deliverySettings, setDeliverySettings, prices, setPrices,
            contact, setContact, homepage, setHomepage, goals, setGoals, clearGoals,
            updateUserRole, isLoading, isSaving, saveAllSettings, processingOrder, financials,
         }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) throw new Error('useAdmin must be used within an AdminProvider');
    return context;
}
