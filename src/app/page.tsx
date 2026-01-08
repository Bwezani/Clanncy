
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import OrderForm from '@/components/OrderForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, Loader2 } from 'lucide-react';
import { ContactCard } from '@/components/ContactCard';

const defaultContent = {
  title: 'The Best Chicken on Campus',
  subtitle: 'Preorder now and pay when your chicken is delivered!',
};

export default function Home() {
  const [content, setContent] = useState(defaultContent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'homepage');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data() as typeof defaultContent);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Could not fetch homepage content:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6 text-center">
        {isLoading ? (
          <div className="space-y-4 pt-4">
             <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
              {content.title}
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 px-4">
              {content.subtitle}
            </p>
          </div>
        )}

        <Card className="shadow-lg text-left">
            <CardHeader>
                <CardTitle className="font-headline text-2xl md:text-3xl font-bold tracking-tighter text-primary flex items-center justify-center gap-3">
                    Fill in order details here <ArrowDown className="h-8 w-8" />
                </CardTitle>
            </CardHeader>
          <CardContent className="p-0">
            <OrderForm />
          </CardContent>
        </Card>
        <div className="pt-8">
            <ContactCard />
        </div>
      </div>
    </div>
  );
}
