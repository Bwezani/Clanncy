'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ContactSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Phone, Headset, Loader2, ChevronRight } from 'lucide-react';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12.04 2.004c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.42 1.29 4.88L2 22l5.25-1.38c1.41.81 3.02 1.29 4.7 1.29h.01c5.46 0 9.91-4.45 9.91-9.91s-4.45-9.91-9.91-9.91zM17.23 15.25c-.2-.11-.73-.36-1.04-.42-.32-.06-.55-.1-.78.1-.23.2-.88.75-1.08.9-.2.15-.4.16-.58.05-.18-.1-.73-.27-1.4-1.12-.52-.63-.87-1.12-1-1.32-.1-.2-.02-.3.07-.4.08-.08.2-.21.28-.31.08-.1.12-.18.18-.3.06-.12.03-.23-.02-.33-.05-.1-.49-.97-1.17-1.34-.14-.08-.28-.1-.42-.1-.14 0-.3 0-.44.02-.14.02-.36.1-.55.28-.19.18-.73.7-1.02 1.33-.29.63-.58 1.48.05 2.58.63 1.1 1.04 1.48 2.28 2.53 1.96 1.69 2.53 1.61 3.48 1.61.95 0 1.7-.13 2.1-.26.4-.13 1.04-.42 1.18-.83.14-.4.14-.78.1-.88-.05-.1-.18-.16-.38-.26z"/>
    </svg>
);


const defaultSettings: ContactSettings = {
    callNumber: '+260975565291',
    whatsappNumber: '+260975565291'
}

export function CustomerServiceDialog({ isMobile = false }: { isMobile?: boolean }) {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && isLoading) { 
        const fetchContactSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'contact');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSettings(docSnap.data() as ContactSettings);
                }
            } catch (error) {
                console.error("Could not fetch contact settings, using defaults.", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchContactSettings();
    }
  }, [open, isLoading]);
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
        setIsLoading(true); // Reset loading state when opening
    }
  }

  const TriggerButton = isMobile ? (
        <div className="flex items-center gap-3 rounded-lg px-3 py-3 text-card-foreground transition-all hover:bg-secondary">
            <Headset className="h-6 w-6 text-muted-foreground"/>
            <div className="flex-1 text-left">
                <span className="font-medium">Customer Service</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
    ) : (
        <div className="flex items-center gap-4 rounded-lg px-3 py-3 text-card-foreground transition-all hover:bg-secondary">
            <Headset className="h-6 w-6 text-muted-foreground" />
            <div className="flex-1">
                <span className="font-medium">Customer Service</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
    );


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="cursor-pointer w-full">
            {TriggerButton}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Customer Service</DialogTitle>
          <DialogDescription>
            Have a question? We're here to help.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            {isLoading ? (
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <Button asChild size="lg">
                        <a href={`tel:${settings.callNumber}`}>
                            <Phone className="mr-2 h-5 w-5" /> Call Us
                        </a>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon className="mr-2 h-5 w-5" /> WhatsApp
                        </a>
                    </Button>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
