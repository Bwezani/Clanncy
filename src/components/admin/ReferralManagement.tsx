
'use client';

import React, { useMemo, useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Gift, Users, ShoppingBag, TrendingUp, DollarSign, Search, ExternalLink, Phone, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/loader';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ReferralManagement() {
    const { users, orders, referralSettings, isLoading, markReferrerAsPaid, isSaving } = useAdmin();
    const isMobile = useIsMobile();
    const [searchTerm, setSearchTerm] = React.useState('');

    const referrerStats = useMemo(() => {
        const referringUsers = users.filter(u => !!u.referralCode);

        return referringUsers.map(user => {
            const attributedOrders = orders.filter(o => o.fullOrder.referralCode === user.referralCode);
            const completedSales = attributedOrders.filter(o => o.status === 'Delivered');
            
            const paidCount = user.paidReferralsCount || 0;
            const unpaidCount = Math.max(0, completedSales.length - paidCount);
            
            const pendingPayout = unpaidCount * referralSettings.earningsPerSale;
            const totalEarned = completedSales.length * referralSettings.earningsPerSale;
            const totalPaid = paidCount * referralSettings.earningsPerSale;

            return {
                ...user,
                totalReferrals: attributedOrders.length,
                completedSales: completedSales.length,
                paidCount,
                unpaidCount,
                pendingPayout,
                totalEarned,
                totalPaid
            };
        }).sort((a, b) => b.pendingPayout - a.pendingPayout || b.completedSales - a.completedSales);
    }, [users, orders, referralSettings]);

    const filteredStats = useMemo(() => {
        if (!searchTerm) return referrerStats;
        const lowTerm = searchTerm.toLowerCase();
        return referrerStats.filter(s => 
            s.email?.toLowerCase().includes(lowTerm) || 
            s.referralCode?.toLowerCase().includes(lowTerm) ||
            s.momoNumber?.toLowerCase().includes(lowTerm)
        );
    }, [referrerStats, searchTerm]);

    const globalStats = useMemo(() => {
        const totalReferralOrders = orders.filter(o => !!o.fullOrder.referralCode).length;
        const totalCompletedSales = orders.filter(o => !!o.fullOrder.referralCode && o.status === 'Delivered').length;
        const totalPendingPayout = referrerStats.reduce((sum, s) => sum + s.pendingPayout, 0);

        return {
            activeReferrers: referrerStats.length,
            totalReferralOrders,
            totalCompletedSales,
            totalPendingPayout
        };
    }, [orders, referrerStats]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Referrers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{globalStats.activeReferrers}</div>
                        <p className="text-xs text-muted-foreground">Users with generated codes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Referral Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{globalStats.totalReferralOrders}</div>
                        <p className="text-xs text-muted-foreground">Orders using any code</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{globalStats.totalCompletedSales}</div>
                        <p className="text-xs text-muted-foreground">Successfully delivered</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/50 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pending Payouts</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">K{globalStats.totalPendingPayout.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Owed to referrers</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Referrer Performance</CardTitle>
                            <CardDescription>Monitor earnings and process payouts.</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search email, code or number..." 
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isMobile ? (
                        <div className="space-y-4">
                            {filteredStats.length > 0 ? filteredStats.map(stat => (
                                <Card key={stat.id} className={cn("p-4 transition-colors", stat.pendingPayout > 0 ? "bg-primary/5 border-primary/20" : "bg-muted/10")}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm truncate max-w-[200px]">{stat.email}</p>
                                            <div className="flex gap-2 flex-wrap">
                                                <Badge variant="outline" className="font-mono text-[10px]">{stat.referralCode}</Badge>
                                                {stat.momoNumber && (
                                                    <Badge variant="secondary" className="font-mono text-[10px] flex items-center gap-1">
                                                        <Phone className="h-2 w-2" /> {stat.momoNumber}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-primary">K{stat.pendingPayout.toFixed(2)}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 py-2 border-y text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Total Earned:</span>
                                            <span className="ml-1 font-bold">K{stat.totalEarned.toFixed(2)}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-muted-foreground">Already Paid:</span>
                                            <span className="ml-1 font-bold text-green-600">K{stat.totalPaid.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        {stat.pendingPayout > 0 ? (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" className="h-8 text-xs">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Paid
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Process Payout?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Confirm that you have sent **K{stat.pendingPayout.toFixed(2)}** to **{stat.momoNumber}** for user **{stat.email}**. This will clear their pending balance.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => markReferrerAsPaid(stat.id, stat.completedSales)}>
                                                            Confirm Payment
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] uppercase opacity-50">Setted</Badge>
                                        )}
                                    </div>
                                </Card>
                            )) : (
                                <p className="text-center text-muted-foreground py-8">No referrers found.</p>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email / Code</TableHead>
                                    <TableHead>Airtel Money / MoMo</TableHead>
                                    <TableHead className="text-center">Sales (Paid/Total)</TableHead>
                                    <TableHead className="text-right">Total Earned</TableHead>
                                    <TableHead className="text-right">Paid</TableHead>
                                    <TableHead className="text-right text-primary font-bold">Pending</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStats.length > 0 ? filteredStats.map(stat => (
                                    <TableRow key={stat.id} className={cn(stat.pendingPayout > 0 && "bg-primary/[0.02]")}>
                                        <TableCell>
                                            <div className="font-medium text-sm">{stat.email}</div>
                                            <div className="font-mono text-[10px] text-primary font-bold">{stat.referralCode}</div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                                            {stat.momoNumber || "—"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-green-600 font-bold">{stat.paidCount}</span>
                                            <span className="text-muted-foreground mx-1">/</span>
                                            <span className="font-bold">{stat.completedSales}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">K{stat.totalEarned.toFixed(2)}</TableCell>
                                        <TableCell className="text-right text-green-600">K{stat.totalPaid.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-black text-primary">K{stat.pendingPayout.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            {stat.pendingPayout > 0 ? (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="outline" className="h-8 border-primary/20 hover:bg-primary/5">
                                                            Mark Paid
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Confirm Payout</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Mark **K{stat.pendingPayout.toFixed(2)}** as paid to **{stat.email}** ({stat.momoNumber}).
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => markReferrerAsPaid(stat.id, stat.completedSales)}>
                                                                Confirm
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : (
                                                <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">No referrers found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
