
"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, setDoc, Timestamp, deleteDoc, writeBatch, getDocs, where, runTransaction, increment, serverTimestamp } from 'firebase/firestore';
import type { FirestoreOrder, FirestoreDevice, Prices, ContactSettings, HomepageSettings, AdminOrder, AdminDevice, GoalsSettings, DeliverySettings, AdminUser, UserRole, DeliveryRecord, FirestoreDeliveryRecord } from '@/lib/types';
import { useUser } from '@/hooks/use-user';

function formatOrderItems(order: FirestoreOrder): string {
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
    pieces: {
        breasts: 30.0,
        thighs: 20.0,
        drumsticks: 15.0,
        wings: 10.0,
    }
};

const defaultContact: ContactSettings = {
    callNumber: '+260975565291',
    whatsappNumber: '+260975565291'
}

const defaultHomepage: HomepageSettings = {
    title: 'The Best Chicken on Campus',
    subtitle: 'Preorder now and pay when your chicken is delivered!',
    isBounceAnimationEnabled: true,
    formLayout: 'continuous',
    wholeChickenImageUrl: 'https://i.postimg.cc/JhFDRd2m/359635-removebg-preview.png',
    piecesImageUrl: 'https://i.postimg.cc/G2Zc5WS4/359689-removebg-preview.png',
}

const defaultDelivery: DeliverySettings = {
    totalSlots: 50,
    disableWhenSlotsFull: true,
    slotsFullMessage: "We're fully booked! Check back later.",
    nextDeliveryDate: undefined,
    isSlotsEnabled: true,
};


const defaultGoals: GoalsSettings = {
    salesTarget: 0,
    reservationsTarget: 0,
    devicesTarget: 0,
    startDate: undefined,
    endDate: undefined,
}

interface AdminContextType {
    orders: AdminOrder[];
    devices: AdminDevice[];
    users: AdminUser[];
    deliveredRecords: DeliveryRecord[];
    droppedRecords: DeliveryRecord[];
    userRole: UserRole | null;
    confirmDelivery: (orderId: string) => void;
    markAsDelivered: (orderId: string) => void;
    cancelOrder: (orderId: string) => void;
    restoreOrder: (orderId: string) => void;
    dropOrder: (orderId: string) => void;
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
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [devices, setDevices] = useState<AdminDevice[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
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

    useEffect(() => {
        if (!userRole) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const subscriptions: (() => void)[] = [];

        if (userRole === 'admin' || userRole === 'assistant') {
            const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
            const unsubscribeOrders = onSnapshot(q, (querySnapshot) => {
                const fetchedOrders: AdminOrder[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data() as Omit<FirestoreOrder, 'id'>;
                    const firestoreOrder = { id: doc.id, ...data } as FirestoreOrder;
                    fetchedOrders.push({
                        id: doc.id,
                        date: data.createdAt.toDate(), // Keep as Date object
                        formattedDate: format(data.createdAt.toDate(), 'do MMMM, yyyy'),
                        items: formatOrderItems(firestoreOrder),
                        price: data.price,
                        status: data.status,
                        name: data.name,
                        phone: data.phone,
                        deliveryLocationType: data.deliveryLocationType,
                        school: data.school,
                        block: data.block,
                        room: data.room,
                        area: data.area,
                        street: data.street,
                        houseNumber: data.houseNumber,
                        fullOrder: firestoreOrder,
                    });
                });
                setOrders(fetchedOrders);
            }, (error) => {
                console.error("Error fetching orders: ", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch orders.'
                });
            });
            subscriptions.push(unsubscribeOrders);

            const deliveredQuery = query(collection(db, "deliveredRecords"), orderBy("lastActionAt", "desc"));
            const unsubscribeDelivered = onSnapshot(deliveredQuery, (snapshot) => {
                const fetchedRecords: DeliveryRecord[] = snapshot.docs.map(doc => {
                    const data = doc.data() as FirestoreDeliveryRecord;
                    return {
                        id: doc.id,
                        name: data.name,
                        phone: data.phone,
                        deliveryLocationType: data.deliveryLocationType,
                        school: data.school,
                        block: data.block,
                        room: data.room,
                        area: data.area,
                        street: data.street,
                        houseNumber: data.houseNumber,
                        lastActionAt: data.lastActionAt.toDate(),
                        formattedLastActionAt: format(data.lastActionAt.toDate(), 'do MMMM, yyyy, hh:mm a'),
                    };
                });
                setDeliveredRecords(fetchedRecords);
            }, (error) => {
                console.error("Error fetching delivered records:", error);
            });
            subscriptions.push(unsubscribeDelivered);

            const droppedQuery = query(collection(db, "droppedRecords"), orderBy("lastActionAt", "desc"));
            const unsubscribeDropped = onSnapshot(droppedQuery, (snapshot) => {
                const fetchedRecords: DeliveryRecord[] = snapshot.docs.map(doc => {
                    const data = doc.data() as FirestoreDeliveryRecord;
                    return {
                        id: doc.id,
                        name: data.name,
                        phone: data.phone,
                        deliveryLocationType: data.deliveryLocationType,
                        school: data.school,
                        block: data.block,
                        room: data.room,
                        area: data.area,
                        street: data.street,
                        houseNumber: data.houseNumber,
                        lastActionAt: data.lastActionAt.toDate(),
                        formattedLastActionAt: format(data.lastActionAt.toDate(), 'do MMMM, yyyy, hh:mm a'),
                    };
                });
                setDroppedRecords(fetchedRecords);
            }, (error) => {
                console.error("Error fetching dropped records:", error);
            });
            subscriptions.push(unsubscribeDropped);
        }
        
        if (userRole === 'admin') {
            const devicesQuery = query(collection(db, "devices"), orderBy("lastSeenAt", "desc"));
            const unsubscribeDevices = onSnapshot(devicesQuery, (querySnapshot) => {
                const fetchedDevices: AdminDevice[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data() as FirestoreDevice;
                    if (data.createdAt && data.lastSeenAt) {
                        fetchedDevices.push({
                            id: doc.id,
                            createdAt: data.createdAt.toDate(), // Keep as Date object
                            formattedCreatedAt: format(data.createdAt.toDate(), 'do MMMM, yyyy'),
                            formattedLastSeenAt: formatDistanceToNow(data.lastSeenAt.toDate(), { addSuffix: true }),
                            userAgent: data.userAgent,
                        });
                    }
                });
                setDevices(fetchedDevices);
            }, (error) => {
                console.error("Error fetching devices: ", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch devices.'
                });
            });
            subscriptions.push(unsubscribeDevices);

            const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
                const fetchedUsers: AdminUser[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedUsers.push({
                        id: doc.id,
                        email: data.email,
                        role: data.role || 'customer',
                        createdAt: data.createdAt ? format(data.createdAt.toDate(), 'do MMMM, yyyy') : 'N/A',
                    });
                });
                setUsers(fetchedUsers);
            }, (error) => {
                console.error("Error fetching users: ", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch users.' });
            });
            subscriptions.push(unsubscribeUsers);

            const fetchSettings = async () => {
                try {
                    // Fetch Delivery Settings
                    const deliveryDocRef = doc(db, 'settings', 'delivery');
                    const deliveryDocSnap = await getDoc(deliveryDocRef);
                    if (deliveryDocSnap.exists()) {
                        const data = deliveryDocSnap.data();
                        setDeliverySettings({
                            nextDeliveryDate: data.nextDeliveryDate?.toDate(),
                            totalSlots: data.totalSlots ?? defaultDelivery.totalSlots,
                            disableWhenSlotsFull: data.disableWhenSlotsFull ?? defaultDelivery.disableWhenSlotsFull,
                            slotsFullMessage: data.slotsFullMessage ?? defaultDelivery.slotsFullMessage,
                            isSlotsEnabled: typeof data.isSlotsEnabled === 'boolean' ? data.isSlotsEnabled : defaultDelivery.isSlotsEnabled,
                        });
                    } else {
                        setDeliverySettings(defaultDelivery);
                    }

                    // Fetch Prices
                    const pricesDocRef = doc(db, 'settings', 'pricing');
                    const pricesDocSnap = await getDoc(pricesDocRef);
                    if (pricesDocSnap.exists()) {
                        const fetchedPrices = pricesDocSnap.data() as Prices;
                        if (typeof fetchedPrices.isChoosePiecesEnabled === 'undefined') {
                            fetchedPrices.isChoosePiecesEnabled = true;
                        }
                        setPrices(fetchedPrices);
                    }

                    // Fetch Contact
                    const contactDocRef = doc(db, 'settings', 'contact');
                    const contactDocSnap = await getDoc(contactDocRef);
                    if (contactDocSnap.exists()) {
                        setContact(contactDocSnap.data() as ContactSettings);
                    }

                    // Fetch Homepage
                    const homepageDocRef = doc(db, 'settings', 'homepage');
                    const homepageDocSnap = await getDoc(homepageDocRef);
                    if (homepageDocSnap.exists()) {
                        const fetchedHomepage = homepageDocSnap.data() as HomepageSettings;
                        setHomepage({
                            title: fetchedHomepage.title || defaultHomepage.title,
                            subtitle: fetchedHomepage.subtitle || defaultHomepage.subtitle,
                            isBounceAnimationEnabled: typeof fetchedHomepage.isBounceAnimationEnabled === 'boolean' ? fetchedHomepage.isBounceAnimationEnabled : defaultHomepage.isBounceAnimationEnabled,
                            formLayout: fetchedHomepage.formLayout || defaultHomepage.formLayout,
                            wholeChickenImageUrl: fetchedHomepage.wholeChickenImageUrl || defaultHomepage.wholeChickenImageUrl,
                            piecesImageUrl: fetchedHomepage.piecesImageUrl || defaultHomepage.piecesImageUrl,
                        });
                    } else {
                        setHomepage(defaultHomepage);
                    }
                    
                    // Fetch Goals
                    const goalsDocRef = doc(db, 'settings', 'goals');
                    const goalsDocSnap = await getDoc(goalsDocRef);
                    if (goalsDocSnap.exists()) {
                        const data = goalsDocSnap.data() as {
                            salesTarget: number;
                            reservationsTarget: number;
                            devicesTarget: number;
                            startDate?: Timestamp;
                            endDate?: Timestamp;
                        };
                        const fetchedGoals: GoalsSettings = {
                            salesTarget: data.salesTarget || 0,
                            reservationsTarget: data.reservationsTarget || 0,
                            devicesTarget: data.devicesTarget || 0,
                            startDate: data.startDate?.toDate(),
                            endDate: data.endDate?.toDate(),
                        };
                        setGoals(fetchedGoals);
                    } else {
                        setGoals(defaultGoals);
                    }


                } catch (error) {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Could not fetch settings.'
                    });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSettings();
        } else {
            setIsLoading(false);
        }

        return () => {
            subscriptions.forEach(sub => sub());
        };
    }, [toast, userRole]);

    const confirmDelivery = async (orderId: string) => {
        setProcessingOrder(orderId);
        const orderDocRef = doc(db, 'orders', orderId);
        try {
            await updateDoc(orderDocRef, { status: 'Confirmed' });
            toast({
                title: "Order Updated",
                description: `Order ${orderId} has been confirmed.`
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Update Failed",
                description: `Could not confirm order ${orderId}.`
            });
        } finally {
            setProcessingOrder(null);
        }
    };

    const markAsDelivered = async (orderId: string) => {
        setProcessingOrder(orderId);
        const orderDocRef = doc(db, 'orders', orderId);
        const slotsCounterRef = doc(db, 'slots', 'live_counter');
        try {
            await runTransaction(db, async (transaction) => {
                const orderDoc = await transaction.get(orderDocRef);
                if (!orderDoc.exists() || orderDoc.data().status === 'Delivered') {
                    return;
                }

                const orderData = orderDoc.data() as FirestoreOrder;

                transaction.update(orderDocRef, { status: 'Delivered' });

                if (['Pending', 'Confirmed'].includes(orderDoc.data().status)) {
                    transaction.update(slotsCounterRef, { count: increment(-1) });
                }

                if (orderData.deviceId) {
                    const recordRef = doc(db, 'deliveredRecords', orderData.deviceId);
                    transaction.set(recordRef, {
                        name: orderData.name,
                        phone: orderData.phone,
                        deliveryLocationType: orderData.deliveryLocationType,
                        school: orderData.school || null,
                        block: orderData.block || null,
                        room: orderData.room || null,
                        area: orderData.area || null,
                        street: orderData.street || null,
                        houseNumber: orderData.houseNumber || null,
                        lastActionAt: serverTimestamp(),
                    });
                }
            });
            toast({
                title: "Order Updated",
                description: `Order ${orderId} has been marked as delivered.`
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Update Failed",
                description: `Could not update order ${orderId}.`
            });
        } finally {
            setProcessingOrder(null);
        }
    };
    
    const cancelOrder = async (orderId: string) => {
        setProcessingOrder(orderId);
        const orderDocRef = doc(db, 'orders', orderId);
        try {
            await updateDoc(orderDocRef, { status: 'Cancelled' });
            toast({
                title: "Order Cancelled",
                description: `Order ${orderId} has been cancelled.`
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Update Failed",
                description: `Could not cancel order ${orderId}.`
            });
        } finally {
            setProcessingOrder(null);
        }
    };

    const restoreOrder = async (orderId: string) => {
        setProcessingOrder(orderId);
        const orderDocRef = doc(db, 'orders', orderId);
        try {
            await updateDoc(orderDocRef, { status: 'Pending' });
            toast({
                title: "Order Restored",
                description: `Order ${orderId} has been restored to Pending.`
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Update Failed",
                description: `Could not restore order ${orderId}.`
            });
        } finally {
            setProcessingOrder(null);
        }
    };
    
    const dropOrder = async (orderId: string) => {
        setProcessingOrder(orderId);
        const orderDocRef = doc(db, 'orders', orderId);
        const slotsCounterRef = doc(db, 'slots', 'live_counter');
        try {
            await runTransaction(db, async (transaction) => {
                const orderDoc = await transaction.get(orderDocRef);
                if (!orderDoc.exists()) {
                    return;
                }

                const orderData = orderDoc.data() as FirestoreOrder;
                
                if (orderData.deviceId) {
                    const recordRef = doc(db, 'droppedRecords', orderData.deviceId);
                    transaction.set(recordRef, {
                        name: orderData.name,
                        phone: orderData.phone,
                        deliveryLocationType: orderData.deliveryLocationType,
                        school: orderData.school || null,
                        block: orderData.block || null,
                        room: orderData.room || null,
                        area: orderData.area || null,
                        street: orderData.street || null,
                        houseNumber: orderData.houseNumber || null,
                        lastActionAt: serverTimestamp(),
                    });
                }

                transaction.delete(orderDocRef);

                // A slot was taken and now needs to be freed, unless it was already delivered.
                if (orderData.status !== 'Delivered') {
                    transaction.update(slotsCounterRef, { count: increment(-1) });
                }
            });
            toast({
                title: "Order Dropped",
                description: `Order ${orderId} has been permanently deleted.`
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Drop Failed",
                description: `Could not drop order ${orderId}.`
            });
        } finally {
            setProcessingOrder(null);
        }
    };

    const deleteRecord = async (recordId: string) => {
        const deliveredRecordRef = doc(db, 'deliveredRecords', recordId);
        const droppedRecordRef = doc(db, 'droppedRecords', recordId);
        try {
            const batch = writeBatch(db);
            batch.delete(deliveredRecordRef);
            batch.delete(droppedRecordRef);
            await batch.commit();
        } catch (error) {
            console.error(`Error deleting record ${recordId} from collections:`, error);
            toast({
                variant: 'destructive',
                title: "Deletion Failed",
                description: "Could not remove the customer record(s).",
            });
            throw error;
        }
    };
    
    const clearAllOrders = async () => {
        setIsSaving(true);
        try {
            const ordersQuery = query(collection(db, 'orders'));
            const querySnapshot = await getDocs(ordersQuery);
            const batch = writeBatch(db);
            
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            const slotsCounterRef = doc(db, 'slots', 'live_counter');
            batch.set(slotsCounterRef, { count: 0 });
            
            await batch.commit();

            toast({
                title: "Success",
                description: "All order data has been cleared and slots have been reset."
            });
        } catch (error) {
            console.error("Error clearing orders:", error);
            toast({
                variant: 'destructive',
                title: "Clear Failed",
                description: "Could not clear all order data."
            });
        } finally {
            setIsSaving(false);
        }
    };

    const resetSlots = async () => {
        setIsSaving(true);
        const slotsCounterRef = doc(db, 'slots', 'live_counter');
        try {
            await setDoc(slotsCounterRef, { count: 0 });
            toast({
                title: "Success",
                description: "Slot count has been reset to 0."
            });
        } catch (error) {
            console.error("Error resetting slots:", error);
            toast({
                variant: 'destructive',
                title: "Reset Failed",
                description: "Could not reset the slot count."
            });
        } finally {
            setIsSaving(false);
        }
    };

    const saveAllSettings = async () => {
        setIsSaving(true);
        try {
            const deliveryDocRef = doc(db, 'settings', 'delivery');
            const deliveryDataToSave = {
                ...deliverySettings,
                nextDeliveryDate: deliverySettings.nextDeliveryDate ? Timestamp.fromDate(deliverySettings.nextDeliveryDate) : null,
            };
            await setDoc(deliveryDocRef, deliveryDataToSave, { merge: true });
            if (deliverySettings.nextDeliveryDate) {
                localStorage.setItem('nextDeliveryDate', deliverySettings.nextDeliveryDate.toISOString());
            } else {
                 localStorage.removeItem('nextDeliveryDate');
            }


            const pricesDocRef = doc(db, 'settings', 'pricing');
            await setDoc(pricesDocRef, prices, { merge: true });
            localStorage.setItem('curbsidePrices', JSON.stringify(prices));

            const contactDocRef = doc(db, 'settings', 'contact');
            await setDoc(contactDocRef, contact, { merge: true });
            
            const homepageDocRef = doc(db, 'settings', 'homepage');
            await setDoc(homepageDocRef, homepage, { merge: true });

            const goalsDocRef = doc(db, 'settings', 'goals');
            const goalsToSave = {
                salesTarget: goals.salesTarget,
                reservationsTarget: goals.reservationsTarget,
                devicesTarget: goals.devicesTarget,
                startDate: goals.startDate ? Timestamp.fromDate(goals.startDate) : null,
                endDate: goals.endDate ? Timestamp.fromDate(goals.endDate) : null,
            };
            await setDoc(goalsDocRef, goalsToSave, { merge: true });


            toast({
                title: 'Success!',
                description: 'All settings have been saved.',
            });

        } catch (error) {
            console.error("Error saving settings:", error);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: `Could not save all settings. ${error instanceof Error ? error.message : ''}`.trim(),
            });
        } finally {
            setIsSaving(false);
        }
    }
    
    const clearGoals = () => {
        setGoals(defaultGoals);
    };

    const updateUserRole = async (userId: string, role: UserRole) => {
        if (userRole !== 'admin') {
            toast({ variant: 'destructive', title: "Permission Denied", description: "You are not authorized to change user roles." });
            return;
        }
        const userDocRef = doc(db, 'users', userId);
        try {
            await updateDoc(userDocRef, { role: role });
            toast({
                title: "User Role Updated",
                description: `User role has been successfully updated to ${role}.`
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: `Could not update user role.`
            });
        }
    };


    return (
        <AdminContext.Provider value={{ 
            orders, 
            devices,
            users,
            deliveredRecords,
            droppedRecords,
            userRole,
            confirmDelivery,
            markAsDelivered,
            cancelOrder,
            restoreOrder,
            dropOrder,
            deleteRecord,
            clearAllOrders,
            resetSlots,
            deliverySettings,
            setDeliverySettings,
            prices,
            setPrices,
            contact,
            setContact,
            homepage,
            setHomepage,
            goals,
            setGoals,
            clearGoals,
            updateUserRole,
            isLoading,
            isSaving,
            saveAllSettings,
            processingOrder,
         }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}
