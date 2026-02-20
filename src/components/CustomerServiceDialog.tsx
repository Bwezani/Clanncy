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

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <img
      src="https://i.postimg.cc/bvHwVtkZ/Whatsapp-Icon-Whatsapp-Logo-PNG-Images-Whatsapp-Icon-Whatsapp-Whatsapp-Logo-PNG-Transparent-Back.png"
      alt="WhatsApp"
      className={className}
    />
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
