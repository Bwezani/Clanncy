"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import type { Order, FirestoreOrder, OrderStatus } from '@/lib/types';

function formatOrderItems(order: FirestoreOrder): string {
    const quantity = order.quantity;
    if (order.chickenType === 'whole') {
        return `${quantity}x Whole Chicken${quantity > 1 ? 's' : ''}`;
    }
    return `${quantity}x Chicken Piece${quantity > 1 ? 's' : ''}`;
}

interface AdminContextType {
    orders: Order[];
    markAsDelivered: (orderId: string) => void;
    nextDeliveryDate: Date | undefined;
    setNextDeliveryDate: (date: Date | undefined) => void;
    isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [nextDeliveryDate, setNextDeliveryDateState] = useState<Date | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedOrders: Order[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as FirestoreOrder;
                fetchedOrders.push({
                    id: doc.id,
                    date: format(data.createdAt.toDate(), 'yyyy-MM-dd'),
                    items: formatOrderItems(data),
                    price: data.price,
                    status: data.status,
                });
            });
            setOrders(fetchedOrders);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching orders: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch orders.'
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);
    
    useEffect(() => {
        const fetchDeliveryDate = async () => {
            const settingsDocRef = doc(db, 'settings', 'delivery');
            const docSnap = await getDoc(settingsDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.nextDeliveryDate && data.nextDeliveryDate instanceof Timestamp) {
                   setNextDeliveryDateState(data.nextDeliveryDate.toDate());
                }
            } else {
                // If not set, maybe initialize with a default
                const defaultDate = new Date();
                setNextDeliveryDateState(defaultDate);
            }
        };

        fetchDeliveryDate();
    }, []);

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

    const handleSetNextDeliveryDate = async (date: Date | undefined) => {
        setNextDeliveryDateState(date);
        const settingsDocRef = doc(db, 'settings', 'delivery');
        try {
            if (date) {
                await setDoc(settingsDocRef, { nextDeliveryDate: date });
                toast({
                    title: 'Success!',
                    description: `Next delivery date set to ${format(date, 'PPP')}`,
                });
                localStorage.setItem('nextDeliveryDate', date.toISOString());
            } else {
                 await setDoc(settingsDocRef, { nextDeliveryDate: null });
                 localStorage.removeItem('nextDeliveryDate');
                 toast({
                    title: 'Date cleared',
                    description: 'Next delivery date has been cleared.',
                });
            }
        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Update Failed",
                description: `Could not save the delivery date.`
            });
        }
    }

    return (
        <AdminContext.Provider value={{ orders, markAsDelivered, nextDeliveryDate, setNextDeliveryDate: handleSetNextDeliveryDate, isLoading }}>
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
