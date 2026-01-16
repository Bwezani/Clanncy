
"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, setDoc, Timestamp, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import type { Order, FirestoreOrder, Device, FirestoreDevice, Prices, ContactSettings, HomepageSettings, AdminOrder, AdminDevice } from '@/lib/types';

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
}

interface AdminContextType {
    orders: AdminOrder[];
    devices: AdminDevice[];
    markAsDelivered: (orderId: string) => void;
    deleteOrder: (orderId: string) => void;
    clearAllOrders: () => void;
    nextDeliveryDate: Date | undefined;
    setNextDeliveryDate: (date: Date | undefined) => void;
    prices: Prices;
    setPrices: (prices: Prices) => void;
    contact: ContactSettings;
    setContact: (contact: ContactSettings) => void;
    homepage: HomepageSettings;
    setHomepage: (homepage: HomepageSettings) => void;
    isLoading: boolean;
    isSaving: boolean;
    saveAllSettings: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [devices, setDevices] = useState<AdminDevice[]>([]);
    const [nextDeliveryDate, setNextDeliveryDate] = useState<Date | undefined>();
    const [prices, setPrices] = useState<Prices>(defaultPrices);
    const [contact, setContact] = useState<ContactSettings>(defaultContact);
    const [homepage, setHomepage] = useState<HomepageSettings>(defaultHomepage);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        const subscriptions: (() => void)[] = [];

        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const unsubscribeOrders = onSnapshot(q, (querySnapshot) => {
            const fetchedOrders: AdminOrder[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as FirestoreOrder;
                fetchedOrders.push({
                    id: doc.id,
                    date: data.createdAt.toDate(), // Keep as Date object
                    formattedDate: format(data.createdAt.toDate(), 'do MMMM, yyyy'),
                    items: formatOrderItems(data),
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

        const fetchSettings = async () => {
            try {
                // Fetch Delivery Date
                const deliveryDocRef = doc(db, 'settings', 'delivery');
                const deliveryDocSnap = await getDoc(deliveryDocRef);
                if (deliveryDocSnap.exists()) {
                    const data = deliveryDocSnap.data();
                    if (data.nextDeliveryDate && data.nextDeliveryDate instanceof Timestamp) {
                       setNextDeliveryDate(data.nextDeliveryDate.toDate());
                    }
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
                    if (typeof fetchedHomepage.isBounceAnimationEnabled === 'undefined') {
                        fetchedHomepage.isBounceAnimationEnabled = true; // Default to true
                    }
                    setHomepage(fetchedHomepage);
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

        return () => {
            subscriptions.forEach(sub => sub());
        };
    }, [toast]);

    const markAsDelivered = async (orderId: string) => {
        const orderDocRef = doc(db, 'orders', orderId);
        try {
            await updateDoc(orderDocRef, { status: 'Delivered' });
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
        }
    };
    
    const deleteOrder = async (orderId: string) => {
        const orderDocRef = doc(db, 'orders', orderId);
        try {
            await deleteDoc(orderDocRef);
            toast({
                title: "Order Dropped",
                description: `Order ${orderId} has been successfully deleted.`
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Delete Failed",
                description: `Could not delete order ${orderId}.`
            });
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
            
            await batch.commit();

            toast({
                title: "Success",
                description: "All order data has been cleared."
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

    const saveAllSettings = async () => {
        setIsSaving(true);
        try {
            // Save delivery date
            const deliveryDocRef = doc(db, 'settings', 'delivery');
            if (nextDeliveryDate) {
                await setDoc(deliveryDocRef, { nextDeliveryDate });
                localStorage.setItem('nextDeliveryDate', nextDeliveryDate.toISOString());
            } else {
                await setDoc(deliveryDocRef, { nextDeliveryDate: null });
                localStorage.removeItem('nextDeliveryDate');
            }

            // Save prices
            const pricesDocRef = doc(db, 'settings', 'pricing');
            await setDoc(pricesDocRef, prices, { merge: true });
            localStorage.setItem('curbsidePrices', JSON.stringify(prices));

            // Save contact settings
            const contactDocRef = doc(db, 'settings', 'contact');
            await setDoc(contactDocRef, contact, { merge: true });
            
            // Save homepage settings
            const homepageDocRef = doc(db, 'settings', 'homepage');
            await setDoc(homepageDocRef, homepage, { merge: true });


            toast({
                title: 'Success!',
                description: 'All settings have been saved.',
            });

        } catch (error) {
            console.error("Error saving settings:", error);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save all settings.',
            });
        } finally {
            setIsSaving(false);
        }
    }


    return (
        <AdminContext.Provider value={{ 
            orders, 
            devices, 
            markAsDelivered, 
            deleteOrder,
            clearAllOrders,
            nextDeliveryDate, 
            setNextDeliveryDate,
            prices,
            setPrices,
            contact,
            setContact,
            homepage,
            setHomepage,
            isLoading,
            isSaving,
            saveAllSettings,
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
