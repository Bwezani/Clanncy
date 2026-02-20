'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { UserRole } from '@/lib/types';
import { Loader } from '@/components/ui/loader';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const claimAnonymousOrders = async (userId: string, deviceId: string) => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('deviceId', '==', deviceId));

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return; // No orders for this device
        }

        const batch = writeBatch(db);
        let updatesMade = false;

        querySnapshot.forEach((document) => {
            const order = document.data();
            // If the order is anonymous, claim it for the current user
            if (!order.userId) { 
                batch.update(document.ref, { userId: userId });
                updatesMade = true;
            }
        });

        if (updatesMade) {
            await batch.commit();
            console.log(`Associated anonymous orders with user ${userId}`);
        }
    } catch (error) {
        // This may fail silently if rules are not permissive, which is acceptable.
        // It's a best-effort operation.
        console.error("Error attempting to claim anonymous orders:", error);
    }
};


export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let roleUnsubscribe: (() => void) | null = null;
    
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (roleUnsubscribe) {
        roleUnsubscribe();
        roleUnsubscribe = null;
      }
      
      setUser(user);

      if (user) {
        const deviceId = localStorage.getItem('deviceId');
        if (deviceId) {
            await claimAnonymousOrders(user.uid, deviceId);
        }

        const userDocRef = doc(db, 'users', user.uid);
        roleUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const role = data.role || 'customer';
                // This ensures the main admin email always has the 'admin' role in the DB
                if (user.email === 'bwezanijuma@gmail.com' && role !== 'admin') {
                    setDoc(userDocRef, { role: 'admin' }, { merge: true });
                    setUserRole('admin');
                } else {
                    setUserRole(role);
                }
            } else {
                 setUserRole('customer');
            }
            setIsLoading(false);
        }, () => {
            setIsLoading(false);
        });
      } else {
        setUserRole(null);
        setIsLoading(false);
      }
    });

    return () => authUnsubscribe();
  }, []);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader />
        </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, userRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
