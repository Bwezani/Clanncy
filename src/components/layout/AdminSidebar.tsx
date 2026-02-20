
'use client'

import { Home, ChevronRight, Landmark } from "lucide-react";
import Image from 'next/image';
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "../ThemeToggle";
import { adminNavGroups } from "./AdminMobileHeader";
import { Separator } from "../ui/separator";
import { CustomerServiceDialog } from "../CustomerServiceDialog";


export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col w-72 p-4 border-r bg-background sticky top-0 h-screen">
            <div className="p-2">
                <Link href="/" className="flex items-center gap-2 font-headline mb-4">
                    <Image src="https://i.postimg.cc/yN0HGxfT/388466-removebg-preview.png" alt="Curbside Logo" width={32} height={32} />
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                        Curbside
                    </span>
                </Link>
            </div>

            <nav className="flex flex-col gap-4 flex-grow">
                 {adminNavGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="bg-card rounded-xl shadow-sm p-2 space-y-1 border">
                        {group.links.map((link, linkIndex) => {
                            const { href, label, icon: Icon, subtitle } = link;
                            const isActive = pathname === href;
                            return (
                                <React.Fragment key={href}>
                                    <Link
                                        href={href}
                                        className={cn(
                                            "flex items-center gap-4 rounded-lg px-3 py-3 text-card-foreground transition-all hover:bg-secondary",
                                            isActive && "bg-primary/10 text-primary"
                                        )}
                                    >
                                        {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
                                        <div className="flex-1">
                                            <span className={cn("font-medium", isActive && "font-semibold")}>{label}</span>
                                            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </Link>
                                    {linkIndex < group.links.length - 1 && <Separator className="mx-3 my-0 bg-border/60" />}
                                </React.Fragment>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="mt-auto flex flex-col gap-4">
                 <div className="bg-card rounded-xl shadow-sm p-2 border">
                    <CustomerServiceDialog />
                </div>
                <div className="bg-card rounded-xl shadow-sm p-2 border">
                     <Link
                        href="/"
                        className="flex items-center gap-4 rounded-lg px-3 py-3 text-card-foreground transition-all hover:bg-secondary"
                    >
                        <Home className="h-6 w-6 text-muted-foreground" />
                        <div className="flex-1">
                            <span className="font-medium">Back to Storefront</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                </div>
                 <div className="bg-card rounded-xl p-2 flex justify-between items-center shadow-sm border">
                    <p className="px-3 font-medium">Theme</p>
                    <ThemeToggle />
                 </div>
            </div>
        </aside>
    )
}
