'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import OrderForm from '@/components/OrderForm';
import GenericOrderForm from '@/components/GenericOrderForm';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ShoppingBag, ChevronDown } from 'lucide-react';
import { ContactCard } from '@/components/ContactCard';
import type { HomepageSettings, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import Link from 'next/link';

type OrderPageContent = Pick<HomepageSettings, 'title' | 'subtitle' | 'formLayout'>;

const defaultContent: OrderPageContent = {
  title: 'The Best on Campus',
  subtitle: 'Preorder now and pay when your product is delivered!',
  formLayout: 'continuous',
};

const HARDCODED_CHICKEN: Product = {
  id: 'fresh-chicken',
  name: 'Fresh Chicken',
  description: 'The best farm-to-table chicken, delivered fresh to your campus.',
  imageUrl: 'https://i.postimg.cc/JhFDRd2m/359635-removebg-preview.png',
  category: 'Poultry',
  productType: 'chicken',
  isActive: true,
  displayOrder: 1,
};

export default function OrderPage() {
  const params = useParams();
  const productId = params.productId as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [content, setContent] = useState<OrderPageContent>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch product details
    const fetchProduct = async () => {
        // Special case for hardcoded chicken
        if (productId === 'fresh-chicken') {
            setProduct(HARDCODED_CHICKEN);
            return;
        }

        try {
            const productSnap = await getDoc(doc(db, 'products', productId));
            if (productSnap.exists()) {
                setProduct({ id: productSnap.id, ...productSnap.data() } as Product);
            } else {
                setError("Product not found");
            }
        } catch (e) {
            console.error(e);
            setError("Could not load product details");
        }
    };
    fetchProduct();

    const docRef = doc(db, 'settings', 'homepage');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setContent({
            title: data.title || defaultContent.title,
            subtitle: data.subtitle || defaultContent.subtitle,
            formLayout: (data.formLayout as 'continuous' | 'stacked') || defaultContent.formLayout,
        });
      } else {
        setContent(defaultContent);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Could not fetch settings:", error);
      setIsLoading(false);
    });

    return () => {
        unsubscribe();
    };
  }, [productId]);

  if (error) {
      return (
          <div className="max-w-2xl mx-auto py-24 text-center space-y-6">
              <AlertCircle className="h-16 w-16 mx-auto text-destructive opacity-50" />
              <h2 className="text-3xl font-bold text-primary">Oops! {error}</h2>
              <Button asChild size="lg">
                  <Link href="/"><ShoppingBag className="mr-2 h-5 w-5" /> Back to Store</Link>
              </Button>
          </div>
      )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 px-4 py-4 pt-0">
        {/* Animated angle down arrow as requested - reduced padding */}
        <div className="flex justify-center py-2">
            <ChevronDown className="h-12 w-12 text-primary animate-bounce opacity-50" />
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-0 pb-6">
            {isLoading || !product ? (
                <div className="py-24 flex justify-center">
                  <Loader />
                </div>
            ) : product.productType === 'chicken' ? (
                <OrderForm formLayout={content.formLayout} />
            ) : (
                <GenericOrderForm product={product} formLayout={content.formLayout} />
            )}
          </CardContent>
        </Card>
        
        <div className="pt-6">
          <ContactCard />
        </div>
    </div>
  );
}
