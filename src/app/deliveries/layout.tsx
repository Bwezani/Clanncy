
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Loader2 } from 'lucide-react';
import { AdminProvider } from "@/context/AdminContext";

export default function DeliveriesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, userRole, isLoading } = useUser();
    const router = useRouter();

    const isAuthorized = userRole === 'admin' || userRole === 'assistant';

    useEffect(() => {
        if (!isLoading && !isAuthorized) {
            router.push('/');
        }
    }, [user, userRole, isLoading, router, isAuthorized]);

    if (isLoading || !isAuthorized) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <AdminProvider>
            {children}
        </AdminProvider>
    );
}
