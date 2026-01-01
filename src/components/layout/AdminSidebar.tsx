
'use client'

import { Home, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "../ThemeToggle";
import { navLinks } from "./AdminMobileHeader";


export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col gap-4 w-64 p-4 border-r bg-background sticky top-0 h-screen">
            <Link href="/" className="flex items-center gap-2 font-headline mb-4">
                <Utensils className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold tracking-tight text-foreground">
                    Curbside
                </span>
            </Link>

            <nav className="flex flex-col gap-2 flex-grow">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                isActive && "bg-muted text-primary"
                            )}
                        >
                            <link.icon className="h-5 w-5" />
                            <span>{link.label}</span>
                        </Link>
                    )
                })}

                <div className="mt-auto flex flex-col gap-2">
                    <Link
                        href="/"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <Home className="h-5 w-5" />
                        <span>Back to Storefront</span>
                    </Link>
                </div>
            </nav>


            <div className="mt-auto">
                <ThemeToggle />
            </div>
        </aside>
    )
}
