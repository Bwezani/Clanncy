'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import AdminMobileHeader from "@/components/layout/AdminMobileHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { AdminProvider } from "@/context/AdminContext";
import { Loader2 } from 'lucide-react';

const ADMIN_EMAIL = 'bwezanijuma@gmail.com';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user || user.email !== ADMIN_EMAIL) {
                router.push('/');
            }
        }
    }, [user, isLoading, router]);

    if (isLoading || !user || user.email !== ADMIN_EMAIL) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <AdminProvider>
            <div className="flex min-h-screen">
                <AdminSidebar />
                <div className="flex flex-col flex-1">
                    <AdminMobileHeader />
                    <main className="flex-1 p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </AdminProvider>
    );
}