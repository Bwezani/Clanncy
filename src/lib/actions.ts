'use server';

import { orderSchema, type OrderInput } from '@/lib/schema';
import { db } from './firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function submitOrder(data: OrderInput) {
  const validation = orderSchema.safeParse(data);

  if (!validation.success) {
    console.error('Validation failed:', validation.error.flatten().fieldErrors);
    return { success: false, message: 'Invalid data provided. Please check the form.' };
  }
  
  try {
    const orderData = {
      ...validation.data,
      createdAt: serverTimestamp(),
      status: 'Pending',
    }
    await addDoc(collection(db, 'orders'), orderData);
    
    console.log('New Order Submitted:', validation.data);
    return { success: true, message: 'Your order has been placed successfully!' };

  } catch(error) {
    console.error("Error submitting order to Firestore:", error);
    let errorMessage = "An unexpected error occurred."
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, message: `Failed to place order. ${errorMessage}` };
  }
}
