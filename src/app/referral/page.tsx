
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Share2, Copy, Check, Loader2, Sparkles, ShoppingBag, TrendingUp, Ban, Phone, Edit2, Wallet, HandCoins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoginSignUpDialog } from '@/components/auth/LoginSignUpDialog';
import { Loader } from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function ReferralPage() {
  const { user, isLoading: isAuthLoading } = useUser();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [momoNumber, setMomoNumber] = useState('');
  const [paidCount, setPaidCount] = useState(0);
  const [isEditingMomo, setIsEditingMomo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(true);
  const [earningsPerSale, setEarningsPerSale] = useState(50);
  const [stats, setStats] = useState({ totalReferrals: 0, completedSales: 0 });
  const { toast } = useToast();

  useEffect(() => {
    const ref = doc(db, 'settings', 'referral');
    const unsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            setIsFeatureEnabled(data.isEnabled ?? true);
            setEarningsPerSale(data.earningsPerSale ?? 50);
        }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsDataLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setReferralCode(data.referralCode || null);
        setMomoNumber(data.momoNumber || '');
        setPaidCount(data.paidReferralsCount || 0);
      }
      setIsDataLoading(false);
    }, (error) => {
      console.error("Error fetching referral code:", error);
      setIsDataLoading(false);
    });

    return () => unsubscribeUser();
  }, [user]);

  useEffect(() => {
    if (!referralCode) return;

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('referralCode', '==', referralCode));

    const unsubscribeStats = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => doc.data());
      const completed = allOrders.filter(o => o.status === 'Delivered').length;
      
      setStats({
        totalReferrals: allOrders.length,
        completedSales: completed
      });
    });

    return () => unsubscribeStats();
  }, [referralCode]);

  const handleGenerateCode = async () => {
    if (!user) return;
    if (!momoNumber || momoNumber.length < 10) {
        toast({
            variant: "destructive",
            title: "Required",
            description: "Please enter a valid Airtel Money / MoMo phone number.",
        });
        return;
    }

    setIsSaving(true);
    const newCode = generateCode();
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        referralCode: newCode,
        momoNumber: momoNumber,
        paidReferralsCount: 0
      });
      toast({
        title: "Setup Complete!",
        description: "Your referral code and payment number are ready.",
      });
    } catch (error) {
      console.error("Failed to save code:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate code. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMomo = async () => {
    if (!user || !referralCode) return;
    if (!momoNumber || momoNumber.length < 10) {
        toast({
            variant: "destructive",
            title: "Invalid Number",
            description: "Please enter a valid Airtel Money / MoMo phone number.",
        });
        return;
    }

    setIsSaving(true);
    try {
        await updateDoc(doc(db, 'users', user.uid), {
            momoNumber: momoNumber
        });
        setIsEditingMomo(false);
        toast({
            title: "Updated!",
            description: "Your payout number has been updated.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not update number.",
        });
    } finally {
        setIsSaving(false);
    }
  }

  const shareLink = typeof window !== 'undefined' 
    ? `${window.location.origin}?ref=${referralCode}` 
    : '';

  const handleShare = async () => {
    if (!referralCode) return;

    const shareData = {
      title: 'FarmFresh Referral',
      text: `Hey! Use my code ${referralCode} to get the best products delivered right to your campus.`,
      url: shareLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setIsCopied(true);
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader />
      </div>
    );
  }

  if (!isFeatureEnabled) {
    return (
        <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
            <Ban className="h-20 w-20 mx-auto text-muted-foreground opacity-20" />
            <h1 className="text-3xl font-bold font-headline text-primary">Feature Unavailable</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
                The referral program is currently taking a break. Check back soon for exciting rewards!
            </p>
            <Button asChild variant="outline" size="lg">
                <Link href="/">Back to Shop</Link>
            </Button>
        </div>
    );
  }

  const pendingPayout = Math.max(0, stats.completedSales - paidCount) * earningsPerSale;
  const alreadyPaid = paidCount * earningsPerSale;
  const totalEarned = stats.completedSales * earningsPerSale;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center space-y-4 mb-10">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
          Spread the Freshness
        </h1>
        <p className="text-lg text-foreground/80">
          Invite your friends to FarmFresh and earn rewards for every successful order.
        </p>
      </div>

      {!user ? (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardHeader className="text-center">
            <Gift className="h-16 w-16 mx-auto text-primary/40 mb-2" />
            <CardTitle>Join the Referral Program</CardTitle>
            <CardDescription>Log in to generate your unique referral code and start sharing.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <LoginSignUpDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="shadow-xl overflow-hidden border-none bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="text-center pt-10">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <Sparkles className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <CardTitle className="text-2xl">Your Referral Link</CardTitle>
              <CardDescription>Share this link with your friends. When they order, we'll know they came from you!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 sm:px-10 pb-10">
              {referralCode ? (
                <div className="space-y-6">
                  <div className="bg-background border-2 border-primary/20 rounded-2xl p-6 text-center group transition-all hover:border-primary/40 shadow-inner">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Your 5-Digit Code</p>
                    <p className="text-5xl font-black font-headline text-primary tracking-[0.2em]">{referralCode}</p>
                  </div>
                  
                  <div className="bg-white/50 rounded-xl p-4 border border-primary/10">
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                            <Phone className="h-3 w-3" /> Payout Airtel Money / MoMo Number
                        </Label>
                        {!isEditingMomo && (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase font-bold" onClick={() => setIsEditingMomo(true)}>
                                <Edit2 className="h-3 w-3 mr-1" /> Edit
                            </Button>
                        )}
                    </div>
                    {isEditingMomo ? (
                        <div className="flex gap-2">
                            <Input 
                                value={momoNumber} 
                                onChange={(e) => setMomoNumber(e.target.value)} 
                                placeholder="097..." 
                                className="h-10 bg-background"
                            />
                            <Button size="sm" onClick={handleUpdateMomo} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-lg font-mono font-bold text-foreground/80">{momoNumber || "Not set"}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button size="lg" className="h-14 text-lg rounded-xl" onClick={handleShare}>
                      <Share2 className="mr-2 h-5 w-5" /> Share Link
                    </Button>
                    <Button size="lg" variant="outline" className="h-14 text-lg rounded-xl border-2" onClick={handleCopy}>
                      {isCopied ? <Check className="mr-2 h-5 w-5 text-green-500" /> : <Copy className="mr-2 h-5 w-5" />}
                      {isCopied ? "Copied!" : "Copy Link"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-sm mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="momo-setup" className="font-bold">Enter Your Airtel Money / MoMo Number</Label>
                    <p className="text-xs text-muted-foreground mb-4">This is where your referral earnings will be sent.</p>
                    <Input 
                        id="momo-setup"
                        placeholder="e.g. 0975 123 456" 
                        value={momoNumber}
                        onChange={(e) => setMomoNumber(e.target.value)}
                        className="h-12 text-lg text-center font-mono"
                    />
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full h-16 text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all" 
                    onClick={handleGenerateCode} 
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    ) : (
                      "Generate My Code"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {referralCode && (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="border-primary/10">
                        <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase">Total Referrals</CardDescription>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-primary/60" />
                            {stats.totalReferrals}
                        </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-green-500/20 bg-green-500/5">
                        <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase text-green-600">Total Earned</CardDescription>
                        <CardTitle className="text-2xl text-green-600 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            K{totalEarned.toFixed(2)}
                        </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase text-primary">Pending Payout</CardDescription>
                        <CardTitle className="text-2xl text-primary flex items-center gap-2">
                            <HandCoins className="h-4 w-4" />
                            K{pendingPayout.toFixed(2)}
                        </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <p className="text-[9px] text-muted-foreground italic">Commissions for {stats.completedSales - paidCount} new sales.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-muted bg-muted/10">
                        <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase">Already Paid</CardDescription>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            K{alreadyPaid.toFixed(2)}
                        </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <p className="text-[9px] text-muted-foreground italic">Earnings already sent to your phone.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
          )}

          <Card className="bg-muted/20 border-t">
            <CardFooter className="p-6">
              <div className="flex items-start gap-3 text-sm text-muted-foreground italic">
                <Gift className="h-5 w-5 shrink-0 text-primary/60" />
                <p>Track your earnings and payouts here. Every referral you make today is being recorded and will be paid to your provided Airtel Money / MoMo number as soon as the order is delivered.</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
