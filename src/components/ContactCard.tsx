
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ContactSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Loader2 } from 'lucide-react';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16.75 13.96c.25.13.43.2.5.28.07.08.1.18.13.28.03.1.02.23 0 .38-.03.15-.23.3-.5.45-.25.18-.58.35-1 .48-.43.13-1.05.2-1.88.13-.83-.07-1.6-.28-2.26-.6-.67-.32-1.25-.75-1.73-1.28-.48-.53-.88-1.13-1.2-1.8-.3-.6-.4-1.2-.3-1.7.1-.6.3-1.1.55-1.5.25-.4.6-.7.9-.9s.5-.3.7-.3c.2-.02.4 0 .5.05.1 0 .2.03.3.05s.2.06.3.1c.1 0 .2.02.3.05.1.03.2.07.2.1.1.05.1.1.1.15.03.1.02.2 0 .3-.02.1-.05.2-.1.25-.03.07-.1.15-.15.25-.05.08-.1.14-.15.2-.05.05-.1.1-.15.15l-.1.1c-.05.05-.1.1-.1.15s0 .1.05.15c.03.05.08.1.1.15s.1.1.15.15c.05.05.1.1.15.15s.1.1.15.15c.05.05.1.1.15.15s.1.1.1.15c.05.05.1.1.1.15s.05.1.1.15c.05.05.1.1.15.15s.1.1.1.15c.3.2.5.4.7.6.2.2.4.3.5.4.1.1.2.2.2.3.02.1.02.2 0 .3-.02.1-.05.2-.1.25s-.1.1-.15.1h-.1c.05.02.1.02.15.02s.1 0 .15.03c.05.03.1.05.15.08.05.03.1.06.1.1.03.03.07.06.1.1.03.03.07.06.1.1.03.03.06.07.1.1.03.03.06.07.1.1.03.03.06.06.1.1l.1.1c.03.03.06.06.08.1.03.03.06.06.08.1.2.2.4.3.6.5.2.2.4.3.5.4.1.1.2.2.2.3.02.1.02.2 0 .3-.02.1-.05.2-.1.25s-.1.1-.15.1h-.1z m-2.9-15.6c-3.3 0-6.4 1.4-8.6 3.6-2.2 2.2-3.6 5.3-3.6 8.6 0 3.5 1.5 6.7 4 9.1l-2.4 7.9 8.1-2.3c2.4 1.3 5.1 2 7.9 2h.1c6.6 0 12-5.4 12-12s-5.4-12-12-12z" />
    </svg>
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
                                <WhatsAppIcon className="mr-2 h-5 w-5 fill-current" /> WhatsApp
                            </a>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
