
'use client'

import { useState } from 'react';
import Image from 'next/image';
import { BarChart, Home, Menu, Package, Settings, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "../ThemeToggle";
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';


export const navLinks = [
    {
        href: '/admin',
        label: 'Analytics',
        icon: BarChart
    },
    {
        href: '/admin/orders',
        label: 'Orders',
        icon: Package
    },
    {
        href: '/admin/settings',
        label: 'Settings',
        icon: Settings
    }
]

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
                    <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle>
                                <Link href="/" className="flex items-center gap-2 font-headline" onClick={handleLinkClick}>
                                    <Image src="https://i.postimg.cc/yN0HGxfT/388466-removebg-preview.png" alt="Curbside Logo" width={28} height={28} />
                                    <span className="text-xl font-bold tracking-tight text-foreground">
                                        Curbside
                                    </span>
                                </Link>
                            </SheetTitle>
                        </SheetHeader>
                        <nav className="grid gap-6 text-lg font-medium mt-8">
                             {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={handleLinkClick}
                                        className={cn(
                                            "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                                            isActive && "text-foreground"
                                        )}
                                    >
                                        <link.icon className="h-5 w-5" />
                                        {link.label}
                                    </Link>
                                )
                            })}
                            <div className="border-t pt-6 mt-6 grid gap-6">
                                <Link
                                    href="/"
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Home className="h-5 w-5" />
                                    Back to Storefront
                                </Link>
                            </div>
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    )
}
