
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { Menu, LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '../ThemeToggle';
import { usePathname } from 'next/navigation';
import { LoginSignUpDialog } from '../auth/LoginSignUpDialog';
import { useUser } from '@/hooks/use-user';
import { signOut } from '@/lib/firebase/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const allNavLinks = [
    { href: '/', label: 'Order Now' },
    { href: '/order-history', label: 'Order History' },
    { href: '/admin', label: 'Admin', icon: LayoutDashboard, adminOnly: true },
]

const ADMIN_EMAIL = 'bwezanijuma@gmail.com';

export default function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  const navLinks = useMemo(() => {
    return allNavLinks.filter(link => {
        if (link.adminOnly) {
            return user?.email === ADMIN_EMAIL;
        }
        return true;
    })
  }, [user]);

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
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
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
                <SheetContent side="right" className="w-full max-w-sm">
                    <SheetHeader>
                        <SheetTitle>
                           <Link href="/" className="flex items-center gap-2 font-headline" onClick={handleLinkClick}>
                                <Image src="https://i.postimg.cc/yN0HGxfT/388466-removebg-preview.png" alt="Curbside Logo" width={28} height={28} />
                                <span className="text-xl font-bold tracking-tight text-foreground">
                                    FarmFresh
                                </span>
                            </Link>
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 pt-10">
                    {navLinks.map(link => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={handleLinkClick}
                                className={cn(
                                    "text-lg font-medium transition-colors flex items-center gap-3 p-2 rounded-md",
                                    isActive ? "bg-muted text-primary" : "text-foreground/80 hover:text-foreground hover:bg-muted"
                                )}
                            >
                                {link.icon && <link.icon className="h-5 w-5" />}
                                {link.label}
                            </Link>
                        )
                    })}
                    <div className="border-t pt-4 mt-4">
                        {user ? (
                             <Button variant="outline" onClick={() => { signOut(); handleLinkClick(); }} className="w-full text-lg justify-start p-2 h-auto">
                                <LogOut className="mr-3 h-5 w-5"/>
                                Logout
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
