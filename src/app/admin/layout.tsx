'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import AdminMobileHeader from "@/components/layout/AdminMobileHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { AdminProvider } from "@/context/AdminContext";
import { Loader } from '@/components/ui/loader';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, userRole, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (userRole !== 'admin') {
                router.push('/');
            }
        }
    }, [user, userRole, isLoading, router]);

    if (isLoading || userRole !== 'admin') {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
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
