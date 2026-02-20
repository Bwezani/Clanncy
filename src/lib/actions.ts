
'use server';

import { orderSchema, genericOrderSchema, type OrderInput, type GenericOrderInput } from '@/lib/schema';
import { db } from './firebase/config';
import { collection, doc, serverTimestamp, runTransaction, increment } from 'firebase/firestore';

async function performOrderSubmission(data: any, schema: any, productType: 'chicken' | 'generic') {
  const validation = schema.safeParse(data);

  if (!validation.success) {
    console.error('Validation failed:', validation.error.flatten().fieldErrors);
    return { success: false, message: 'Invalid data provided. Please check the form.' };
  }
  
  try {
    let newOrderId: string | null = null;
    const deliverySettingsRef = doc(db, "settings", "delivery");
    const slotsCounterRef = doc(db, "slots", "live_counter");

    await runTransaction(db, async (transaction) => {
        const deliverySettingsDoc = await transaction.get(deliverySettingsRef);
        if (!deliverySettingsDoc.exists()) {
            throw new Error("Delivery settings not found.");
        }

        const settings = deliverySettingsDoc.data();
        const isSlotsEnabled = settings.isSlotsEnabled ?? true;

        let slotsCounterDoc;
        if (isSlotsEnabled) {
            slotsCounterDoc = await transaction.get(slotsCounterRef);
            const totalSlots = settings.totalSlots ?? 0;
            const takenSlots = slotsCounterDoc.exists() ? slotsCounterDoc.data().count : 0;
            const disableWhenFull = settings.disableWhenSlotsFull ?? true;
            if (disableWhenFull && takenSlots >= totalSlots) {
                throw new Error(settings.slotsFullMessage || "We're fully booked! Please check back later.");
            }
        }

        const newOrderRef = doc(collection(db, "orders"));
        newOrderId = newOrderRef.id;

        const orderData: any = {
            ...validation.data,
            productType,
            createdAt: serverTimestamp(),
            status: 'Pending',
        };
        if (data.userId) {
            orderData.userId = data.userId;
        }

        transaction.set(newOrderRef, orderData);

        if (isSlotsEnabled) {
            if (slotsCounterDoc && slotsCounterDoc.exists()) {
                transaction.update(slotsCounterRef, { count: increment(1) });
            } else {
                transaction.set(slotsCounterRef, { count: 1 });
            }
        }
    });
    
    return { success: true, message: 'Your order has been placed successfully!', orderId: newOrderId };

  } catch(error) {
    console.error("Error submitting order to Firestore:", error);
    let errorMessage = "An unexpected error occurred."
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, message: `Failed to place order. ${errorMessage}` };
  }
}

export async function submitOrder(data: OrderInput & { userId?: string }) {
    return performOrderSubmission(data, orderSchema, 'chicken');
}

export async function submitGenericOrder(data: GenericOrderInput & { userId?: string }) {
    return performOrderSubmission(data, genericOrderSchema, 'generic');
}
