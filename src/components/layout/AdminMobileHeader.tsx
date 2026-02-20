
'use client'

import { useState } from 'react';
import Image from 'next/image';
import { BarChart, Home, Menu, Package, Settings, Smartphone, Users, ChevronRight, Landmark, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from 'react';

import { cn } from "@/lib/utils";
import { ThemeToggle } from "../ThemeToggle";
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Separator } from '../ui/separator';
import { CustomerServiceDialog } from '../CustomerServiceDialog';

export const adminNavGroups = [
    {
        links: [
            {
                href: '/admin',
                label: 'Analytics',
                icon: BarChart,
                subtitle: 'View sales and trends'
            },
            {
                href: '/admin/finance',
                label: 'Finance',
                icon: Landmark,
                subtitle: 'Track expenses and profit'
            },
        ]
    },
    {
        links: [
            {
                href: '/admin/orders',
                label: 'Orders',
                icon: Package,
                subtitle: 'Manage and fulfill orders'
            },
            {
                href: '/admin/products',
                label: 'Products',
                icon: Tag,
                subtitle: 'Manage store catalog'
            },
        ]
    },
    {
        links: [
             {
                href: '/admin/users',
                label: 'Users',
                icon: Users,
            },
            {
                href: '/admin/settings',
                label: 'Settings',
                icon: Settings,
            },
            {
                href: '/admin/devices',
                label: 'Devices',
                icon: Smartphone,
            }
        ]
    }
];


export default function AdminMobileHeader() {
    const pathname = usePathname();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    const handleLinkClick = () => {
        setIsSheetOpen(false);
    };

    return (
        <header className="md:hidden flex items-center justify-between h-16 px-4 border-b bg-background sticky top-0 z-50">
             <Link href="/" className="flex items-center gap-2 font-headline">
                <Image src="https://i.postimg.cc/yN0HGxfT/388466-removebg-preview.png" alt="Curbside Logo" width={28} height={28} />
                <span className="text-xl font-bold tracking-tight text-foreground">
                    Curbside
                </span>
            </Link>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Open Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="bg-background flex flex-col p-0">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle>
                                <Link href="/" className="flex items-center gap-2 font-headline" onClick={handleLinkClick}>
                                    <Image src="https://i.postimg.cc/yN0HGxfT/388466-removebg-preview.png" alt="Curbside Logo" width={28} height={28} />
                                    <span className="text-xl font-bold tracking-tight text-foreground">
                                        Curbside
                                    </span>
                                </Link>
                            </SheetTitle>
                        </SheetHeader>
                        <nav className="flex flex-col gap-3 flex-grow p-4 overflow-y-auto">
                             {adminNavGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="bg-card rounded-xl p-2 space-y-1 shadow-sm border">
                                    {group.links.map((link, linkIndex) => {
                                        const isActive = pathname === link.href;
                                        const Icon = link.icon;
                                        return (
                                            <React.Fragment key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    onClick={handleLinkClick}
                                                    className={cn(
                                                        "flex items-center gap-3 rounded-lg px-3 py-3 text-card-foreground transition-all hover:bg-secondary",
                                                        isActive && "bg-primary/10 text-primary"
                                                    )}
                                                >
                                                    {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
                                                    <div className="flex-1">
                                                        <span className={cn("font-medium", isActive && "font-semibold")}>{link.label}</span>
                                                        {link.subtitle && <p className="text-sm text-muted-foreground">{link.subtitle}</p>}
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                </Link>
                                                {linkIndex < group.links.length - 1 && <Separator className="mx-3 my-0 bg-border/60" />}
                                            </React.Fragment>
                                        )
                                    })}
                                </div>
                            ))}
                        </nav>
                        <div className="border-t p-4 mt-auto space-y-4">
                           <div className="bg-card rounded-xl p-2 space-y-1 shadow-sm border">
                               <CustomerServiceDialog isMobile={true} />
                           </div>
                           <div className="bg-card rounded-xl p-2 space-y-1 shadow-sm border">
                               <Link
                                    href="/"
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-card-foreground transition-all hover:bg-secondary"
                                >
                                    <Home className="h-6 w-6 text-muted-foreground" />
                                    <div className="flex-1">
                                        <span className="font-medium">Back to Storefront</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </Link>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    )
}
