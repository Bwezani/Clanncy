'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Mail, KeyRound, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signInWithEmail, signUpWithEmail } from '@/lib/firebase/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginSignUpDialog({ isMobile = false, onAuthSuccess }: { isMobile?: boolean, onAuthSuccess?: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      setOpen(false); // Close dialog on success
      onAuthSuccess?.();
    } catch (err: any) {
       switch (err.code) {
        case 'auth/user-not-found':
            setError('No account found with this email address.');
            break;
        case 'auth/wrong-password':
            setError('Incorrect password. Please try again.');
            break;
        case 'auth/email-already-in-use':
            setError('This email address is already in use.');
            break;
        case 'auth/weak-password':
            setError('The password must be at least 6 characters long.');
            break;
        case 'auth/invalid-email':
            setError('Please enter a valid email address.');
            break;
        default:
            setError('An unexpected error occurred. Please try again.');
            break;
       }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        // Reset state when closing
        setError(null);
        setEmail('');
        setPassword('');
        setIsLogin(true);
    }
  }


    const TriggerButton = isMobile ? (
        <Button variant="ghost" className="w-full flex items-center justify-start gap-3 rounded-lg px-3 py-3 text-card-foreground transition-all hover:bg-secondary">
            <LogIn className="h-6 w-6 text-muted-foreground"/>
            <div className="flex-1 text-left">
                <span className="font-medium">Login / Sign Up</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Button>
    ) : (
        <Button
            variant="ghost"
            className="text-foreground/70 hover:text-foreground"
        >
            <LogIn className="h-5 w-5 mr-2" />
            Login / Sign Up
        </Button>
    );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isLogin ? 'Welcome Back!' : 'Create an Account'}
          </DialogTitle>
          <DialogDescription>
            {isLogin
              ? "Sign in to access your account and order history."
              : 'Sign up to start ordering your favorite chicken.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAuthAction}>
            <div className="grid gap-4 py-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
            </div>
            </div>
            <div className="flex flex-col gap-4">
            <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isLogin ? 'Login' : 'Sign Up'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <Button
                variant="link"
                className="px-1"
                type="button"
                onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                }}
                >
                {isLogin ? 'Sign Up' : 'Login'}
                </Button>
            </p>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
