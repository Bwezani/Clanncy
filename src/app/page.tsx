'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import OrderForm from '@/components/OrderForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, Loader2, ChevronsUpDown } from 'lucide-react';
import { ContactCard } from '@/components/ContactCard';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { HomepageSettings } from '@/lib/types';


const defaultContent: Omit<HomepageSettings, 'isBounceAnimationEnabled' | 'wholeChickenImageUrl' | 'piecesImageUrl'> & { formLayout: 'continuous' | 'stacked' } = {
  title: 'The Best Chicken on Campus',
  subtitle: 'Preorder now and pay when your chicken is delivered!',
  formLayout: 'continuous',
};

export default function Home() {
  const [content, setContent] = useState(defaultContent);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeroOpen, setIsHeroOpen] = useState(false); // Default to collapsed
  const [isButtonFlashing, setIsButtonFlashing] = useState(true); // For flashing effect
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'homepage');
    let expandTimer: NodeJS.Timeout | null = null;
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (expandTimer) clearTimeout(expandTimer);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const animationSetting = typeof data.isBounceAnimationEnabled === 'boolean' ? data.isBounceAnimationEnabled : true;
        
        setContent({
            title: data.title || defaultContent.title,
            subtitle: data.subtitle || defaultContent.subtitle,
            formLayout: (data.formLayout as 'continuous' | 'stacked') || defaultContent.formLayout,
        });
        setIsAnimationEnabled(animationSetting);

        if (animationSetting) {
          setIsHeroOpen(false);
          setIsButtonFlashing(true);
          expandTimer = setTimeout(() => {
              setIsHeroOpen(true);
          }, 5000);
        } else {
          setIsHeroOpen(true);
          setIsButtonFlashing(false);
        }
      } else {
        setContent(defaultContent);
        setIsAnimationEnabled(true);
        expandTimer = setTimeout(() => {
            setIsHeroOpen(true);
        }, 5000);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Could not fetch homepage content:", error);
      setIsLoading(false);
      setIsHeroOpen(true); // Failsafe
    });

    return () => {
        unsubscribe();
        if (expandTimer) clearTimeout(expandTimer);
    };
  }, []);

  useEffect(() => {
    if (!isAnimationEnabled) return;

    let collapseTimer: NodeJS.Timeout | null = null;
    if (isHeroOpen && isButtonFlashing) {
        collapseTimer = setTimeout(() => {
            setIsHeroOpen(false);
            setIsButtonFlashing(false); // End of sequence
        }, 15000);
    }
    return () => {
        if (collapseTimer) clearTimeout(collapseTimer);
    };
  }, [isHeroOpen, isButtonFlashing, isAnimationEnabled]);
  
  const handleOpenChange = (open: boolean) => {
    setIsHeroOpen(open);
    setIsButtonFlashing(false); // Stop flashing on any user interaction with the toggle
  };


  return (
    <div className="max-w-2xl mx-auto space-y-3">
        <Card>
            <Collapsible
                open={isHeroOpen}
                onOpenChange={handleOpenChange}
                className="w-full"
            >
                <CardContent className="p-6 cursor-pointer" onClick={() => handleOpenChange(!isHeroOpen)}>
                    {isLoading ? (
                        <div className="space-y-4 py-4">
                            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                        </div>
                        ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between relative">
                                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary text-left">
                                    {content.title}
                                </h1>
                                <div className={cn(
                                    "absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground",
                                    isButtonFlashing && "animate-pulse"
                                )}>
                                    <ChevronsUpDown className="h-5 w-5" />
                                    <span className="sr-only">Toggle subtitle</span>
                                </div>
                            </div>
                             <CollapsibleContent className="space-y-4 overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up" onClick={(e) => e.stopPropagation()}>
                                <p className="text-lg md:text-xl text-foreground/80">
                                {content.subtitle}
                                </p>
                            </CollapsibleContent>
                        </div>
                    )}
                </CardContent>
            </Collapsible>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl md:text-3xl font-bold tracking-tighter text-primary flex items-center justify-center gap-3 text-center">
                    Fill in order details here <ArrowDown className="h-8 w-8" />
                </CardTitle>
            </CardHeader>
          <CardContent className="p-0">
            <OrderForm formLayout={content.formLayout} />
          </CardContent>
        </Card>
        
        <ContactCard />
    </div>
  );
}
