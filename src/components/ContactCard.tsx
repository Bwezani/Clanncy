'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ContactSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Loader2 } from 'lucide-react';

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

export function ContactCard() {
    const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                    Have questions about your order? Contact customer service.
                </p>
                {isLoading ? (
                    <div className="flex justify-center items-center h-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex flex-row gap-4 justify-center">
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
            </CardContent>
        </Card>
    );
}
