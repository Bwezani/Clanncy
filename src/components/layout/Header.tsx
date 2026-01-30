
'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useMemo } from 'react';
import { Menu, LayoutDashboard, LogOut, Package, ChevronRight, ShoppingBag, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '../ThemeToggle';
import { usePathname } from 'next/navigation';
import { LoginSignUpDialog } from '../auth/LoginSignUpDialog';
import { useUser } from '@/hooks/use-user';
import { signOut } from '@/lib/firebase/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { CustomerServiceDialog } from '../CustomerServiceDialog';

const allNavLinks = [
    { href: '/', label: 'Order Now', icon: ShoppingBag },
    { href: '/order-history', label: 'Order History', icon: History },
    { href: '/deliveries', label: 'Deliveries', icon: Package, for: ['assistant', 'admin'] },
    { href: '/admin', label: 'Admin', icon: LayoutDashboard, for: ['admin'] },
]

export default function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();
  const { user, userRole } = useUser();

  const navLinks = useMemo(() => {
    return allNavLinks.filter(link => {
        if (!link.for) return true; // Public links
        return userRole && link.for.includes(userRole);
    })
  }, [userRole]);

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return '';
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-x border-b rounded-b-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-headline" onClick={handleLinkClick}>
          <Image src="https://i.postimg.cc/yN0HGxfT/388466-removebg-preview.png" alt="Curbside Logo" width={28} height={28} />
          <span className="text-xl font-bold tracking-tight text-foreground">
            FarmFresh
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            {navLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                    <Link 
                        key={link.href} 
                        href={link.href} 
                        className={cn(
                            "flex items-center gap-2 transition-colors",
                            isActive ? "text-primary" : "text-foreground/70 hover:text-foreground"
                        )}
                    >
                        {link.icon && <link.icon className="h-4 w-4" />}
                        {link.label}
                    </Link>
                )
            })}
            {user ? (
                <>
                    <Avatar>
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                     <Button variant="ghost" onClick={signOut} className="text-foreground/70 hover:text-foreground">
                        <LogOut className="mr-2 h-4 w-4"/>
                        Logout
                    </Button>
                </>
            ) : (
                <LoginSignUpDialog onAuthSuccess={handleLinkClick}/>
            )}
            <ThemeToggle />
        </nav>
        <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-sm p-0 flex flex-col bg-background">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>
                           <Link href="/" className="flex items-center gap-2 font-headline" onClick={handleLinkClick}>
                                <Image src="https://i.postimg.cc/yN0HGxfT/388466-removebg-preview.png" alt="Curbside Logo" width={28} height={28} />
                                <span className="text-xl font-bold tracking-tight text-foreground">
                                    FarmFresh
                                </span>
                            </Link>
                        </SheetTitle>
                    </SheetHeader>
                    <nav className="flex-grow p-4 space-y-3 overflow-y-auto">
                        <div className="bg-card rounded-xl p-2 space-y-1 shadow-sm border">
                            {navLinks.map((link, index) => {
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
                                            {Icon ? <Icon className="h-6 w-6 text-muted-foreground" /> : <div className="h-6 w-6" />}
                                            <div className="flex-1">
                                                <span className={cn("font-medium", isActive && "font-semibold")}>{link.label}</span>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </Link>
                                        {index < navLinks.length - 1 && <Separator className="mx-3 my-0 bg-border/60" />}
                                    </React.Fragment>
                                )
                            })}
                        </div>
                    </nav>
                    <div className="border-t p-4 mt-auto space-y-4">
                        <div className="bg-card rounded-xl p-2 shadow-sm border">
                           <CustomerServiceDialog isMobile={true} />
                        </div>
                        <div className="bg-card rounded-xl p-2 shadow-sm border">
                            {user ? (
                                <Button variant="ghost" onClick={() => { signOut(); handleLinkClick(); }} className="w-full flex items-center justify-start gap-3 rounded-lg px-3 py-3 text-card-foreground transition-all hover:bg-secondary">
                                    <LogOut className="h-6 w-6 text-muted-foreground"/>
                                    <div className="flex-1 text-left">
                                        <span className="font-medium">Logout</span>
                                    </div>
                                     <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            ) : (
                                <LoginSignUpDialog isMobile={true} onAuthSuccess={handleLinkClick} />
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
