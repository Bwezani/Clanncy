'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ProductCard } from '@/components/ProductCard';
import { ContactCard } from '@/components/ContactCard';
import type { Product, FirestoreProduct, HomepageSettings } from '@/lib/types';
import { PackageOpen } from 'lucide-react';
import { Loader } from '@/components/ui/loader';

// Hardcoded chicken product to ensure it's always available and at the top
const HARDCODED_CHICKEN: Product = {
  id: 'fresh-chicken',
  name: 'Fresh Chicken',
  description: 'The best farm-to-table chicken, delivered fresh to your campus. Choose between whole chickens or custom pieces.',
  imageUrl: 'https://i.postimg.cc/JhFDRd2m/359635-removebg-preview.png',
  category: 'Poultry',
  productType: 'chicken',
  isActive: true,
  displayOrder: 1,
};

const defaultSettings: Pick<HomepageSettings, 'storefrontTitle' | 'storefrontSubtitle'> = {
    storefrontTitle: 'FarmFresh Store',
    storefrontSubtitle: 'The best farm-to-table products, delivered right to your campus.'
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([HARDCODED_CHICKEN]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    // Fetch homepage settings
    const settingsRef = doc(db, 'settings', 'homepage');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setSettings({
                storefrontTitle: data.storefrontTitle || defaultSettings.storefrontTitle,
                storefrontSubtitle: data.storefrontSubtitle || defaultSettings.storefrontSubtitle,
            });
        }
    });

    // Fetch dynamic products from Firestore
    const q = query(collection(db, 'products'), orderBy('displayOrder', 'asc'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts = snapshot.docs
        .map(doc => {
          const data = doc.data() as FirestoreProduct;
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
          } as Product;
        })
        .filter(product => product.isActive !== false && product.productType !== 'chicken');
      
      // Combine with hardcoded chicken and ensure stable sort
      const allProducts = [HARDCODED_CHICKEN, ...fetchedProducts].sort((a, b) => {
        return (a.displayOrder || 10) - (b.displayOrder || 10);
      });

      setProducts(allProducts);
      setIsLoading(false);
    }, (error) => {
      console.warn("Index not ready for primary sort, falling back to client-side sort:", error);
      
      const fallbackQ = query(collection(db, 'products'));
      const unsubscribeFallback = onSnapshot(fallbackQ, (snapshot) => {
          const fetchedProducts = snapshot.docs
            .map(doc => {
              const data = doc.data() as FirestoreProduct;
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
              } as Product;
            })
            .filter(product => product.isActive !== false && product.productType !== 'chicken');
          
          const allProducts = [HARDCODED_CHICKEN, ...fetchedProducts].sort((a, b) => {
            return (a.displayOrder || 10) - (b.displayOrder || 10);
          });

          setProducts(allProducts);
          setIsLoading(false);
      });
      
      return () => unsubscribeFallback();
    });

    return () => {
        unsubscribe();
        unsubscribeSettings();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 py-2 sm:py-6 px-4">
      {/* Hero Section */}
      <div className="bg-[#c46a28] text-white rounded-[2rem] py-8 px-6 sm:py-14 sm:px-12 text-center shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 space-y-3">
          <h1 className="text-4xl sm:text-6xl font-bold font-headline tracking-tighter leading-tight">
            {settings.storefrontTitle}
          </h1>
          <p className="text-base sm:text-xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
            {settings.storefrontSubtitle}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-headline text-primary">
            Our Products
          </h2>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full" />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader />
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed">
            <PackageOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
            <p className="text-lg text-muted-foreground font-medium">No products available at the moment.</p>
            <p className="text-xs text-muted-foreground/60">Please check back later or contact customer support.</p>
          </div>
        )}
      </div>

      <div className="pt-4">
        <ContactCard />
      </div>
    </div>
  );
}
