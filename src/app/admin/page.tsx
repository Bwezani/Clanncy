
'use client';

import { useState, useEffect } from 'react';
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { Loader2 } from 'lucide-react';

export default function AdminAnalyticsPage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div>
            <div className="space-y-4 mb-8">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                    Analytics
                </h1>
                <p className="text-lg text-foreground/80">
                    A summary of your sales over the selected period.
                </p>
            </div>
            {isClient ? (
                <AnalyticsDashboard />
            ) : (
                <div className="flex justify-center items-center h-[450px] w-full bg-card rounded-lg">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            )}
        </div>
    );
}
