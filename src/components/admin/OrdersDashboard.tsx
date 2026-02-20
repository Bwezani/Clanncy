'use client';

import React, { useState, useMemo, useRef } from 'react';
import type { AdminOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button, buttonVariants } from '@/components/ui/button';
import { Check, Info, Trash2, Phone, Receipt, Download, Ban, RotateCcw, Package, List, BookMarked, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdmin } from '@/context/AdminContext';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { universitySchema, lusakaTownsSchema } from '@/lib/schema';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import OrderReceipt from '../OrderReceipt';
import Link from 'next/link';
import { Loader } from '@/components/ui/loader';

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <img
      src="https://i.postimg.cc/bvHwVtkZ/Whatsapp-Icon-Whatsapp-Logo-PNG-Images-Whatsapp-Icon-Whatsapp-Whatsapp-Logo-PNG-Transparent-Back.png"
      alt="WhatsApp"
      className={className}
    />
);

const formatPhoneNumberForWhatsApp = (phone: string): string => {
    // Removes spaces, pluses, and replaces leading 0 with 260 for Zambian numbers
    let cleaned = phone.replace(/\s/g, ''); // remove spaces
    cleaned = cleaned.replace(/^\+/, ''); // remove leading plus
    if (cleaned.startsWith('0')) {
        cleaned = '260' + cleaned.substring(1);
    }
    return cleaned;
};


function OrderDetailsDialog({ order, isCardVersion = false }: { order: AdminOrder, isCardVersion?: boolean }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant={isCardVersion ? "ghost" : "outline"} size={isCardVersion ? "icon" : "sm"}>
                    <Info className={cn(!isCardVersion && "mr-2", "h-4 w-4")} />
                    {!isCardVersion && "Details"}
                    <span className="sr-only">Order Details</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                    <DialogDescription className="break-all">
                        Full details for order ID: <span className="font-mono text-xs">{order.id}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <h4 className="font-semibold">Customer</h4>
                        <p>{order.name} - {order.phone}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Delivery Address</h4>
                        {order.deliveryLocationType === 'school' ? (
                            <p>{order.school}, {order.block}, Room {order.room}</p>
                        ) : (
                            <p>{order.area}, {order.street}, {order.houseNumber}</p>
                        )}
                    </div>
                     <div>
                        <h4 className="font-semibold">Order Date</h4>
                        <p>{order.formattedDate}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Items</h4>
                        <p>{order.items}</p>
                    </div>
                     <div className="text-right">
                        <p className="font-bold text-lg text-primary">K{order.price.toFixed(2)}</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button asChild variant="outline">
                        <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(order.phone)}`} target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon className="mr-2 h-5 w-5" /> WhatsApp
                        </a>
                    </Button>
                    <Button asChild>
                        <a href={`tel:${order.phone}`}>
                            <Phone className="mr-2 h-4 w-4" />
                            Call {order.name.split(' ')[0]}
                        </a>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function OrderReceiptAction({ order }: { order: AdminOrder }) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(receiptRef.current, { useCORS: true, scale: 2 });
            const link = document.createElement('a');
            link.download = `receipt-${order.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error("Failed to download receipt:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Receipt className="mr-2 h-4 w-4" />
                    Receipt
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0 bg-transparent border-none shadow-none max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                     <DialogTitle className="sr-only">Order Receipt for {order.id}</DialogTitle>
                </DialogHeader>
                <div className="p-4 bg-transparent flex justify-center">
                     <Button onClick={handleDownload} disabled={isDownloading} className="w-full sm:w-auto">
                        {isDownloading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Receipt
                            </>
                        )}
                    </Button>
                </div>
                <OrderReceipt order={order.fullOrder} ref={receiptRef} />
            </DialogContent>
        </Dialog>
    );
}

function OrderActions({ order }: { order: AdminOrder }) {
    const { confirmDelivery, markAsDelivered, cancelOrder, processingOrder } = useAdmin();
    const isProcessing = processingOrder === order.id;

    return (
        <div className="flex items-center justify-start gap-2">
            <OrderDetailsDialog order={order} />

            {order.status === 'Pending' && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="sm" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Confirm Delivery
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Delivery</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will change the order for <span className="font-bold">{order.name}</span> to 'Confirmed'.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                         <div className="space-y-2 rounded-lg border p-4">
                            <p className="font-semibold">{order.items}</p>
                            <p className="text-muted-foreground">{order.name} - {order.phone}</p>
                            <p className="font-bold text-lg text-primary">K{order.price.toFixed(2)}</p>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => confirmDelivery(order.id)}>
                                Confirm
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {order.status === 'Confirmed' && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Mark Delivered
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Mark as Delivered</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will mark the order for <span className="font-bold">{order.name}</span> as delivered. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                         <div className="space-y-2 rounded-lg border p-4">
                            <p className="font-semibold">{order.items}</p>
                            <p className="text-muted-foreground">{order.name} - {order.phone}</p>
                            <p className="font-bold text-lg text-primary">K{order.price.toFixed(2)}</p>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => markAsDelivered(order.id)}>
                                Confirm
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" disabled={order.status === 'Delivered' || order.status === 'Cancelled' || isProcessing}>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                        <span className="sr-only">Cancel Order</span>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will move the order for <span className="font-bold">{order.name}</span> to the cancelled list. An admin can restore it or drop it later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Back</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(buttonVariants({ variant: "destructive" }))}
                            onClick={() => cancelOrder(order.id)}
                        >
                            Cancel Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {order.status === 'Delivered' && <OrderReceiptAction order={order} />}
        </div>
    )
}

function CancelledOrderActions({ order }: { order: AdminOrder }) {
    const { restoreOrder, dropOrder, processingOrder } = useAdmin();
    const isProcessing = processingOrder === order.id;

    return (
        <div className="flex items-center justify-start gap-2">
            <OrderDetailsDialog order={order} />
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                        Restore
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore this order?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will move the order for <span className="font-bold">{order.name}</span> back to 'Pending'.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => restoreOrder(order.id)}
                        >
                            Restore Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Drop Order
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Drop this order permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This action cannot be undone and will permanently delete the order for <span className="font-bold">{order.name}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(buttonVariants({ variant: "destructive" }))}
                            onClick={() => dropOrder(order.id)}
                        >
                            Drop Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}


function OrderCard({ order }: { order: AdminOrder }) {
    const { confirmDelivery, markAsDelivered, cancelOrder, processingOrder } = useAdmin();
    const isProcessing = processingOrder === order.id;

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start pb-4">
                <div>
                    <CardTitle className="text-lg">{order.name}</CardTitle>
                    <CardDescription>{order.phone}</CardDescription>
                </div>
                <OrderDetailsDialog order={order} isCardVersion={true} />
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                 <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold">Items:</p>
                        <p>{order.items}</p>
                    </div>
                     <Badge variant={
                        order.status === 'Delivered' ? 'outline' :
                        order.status === 'Cancelled' ? 'destructive' :
                        order.status === 'Pending' ? 'secondary' :
                        'default'
                    } className={cn(order.status === 'Confirmed' && 'bg-accent text-accent-foreground', "h-fit")}>
                        {order.status}
                    </Badge>
                </div>
                <p className="text-lg font-bold text-primary">K{order.price.toFixed(2)}</p>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2 p-1 pt-0">
                {order.status === 'Pending' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Confirm Delivery
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Delivery</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will change the order for <span className="font-bold">{order.name}</span> to 'Confirmed'.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-2 rounded-lg border p-4">
                                <p className="font-semibold">{order.items}</p>
                                <p className="text-muted-foreground">{order.name} - {order.phone}</p>
                                <p className="font-bold text-lg text-primary">K{order.price.toFixed(2)}</p>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => confirmDelivery(order.id)}>
                                    Confirm
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                 {order.status === 'Confirmed' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Mark Delivered
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Mark as Delivered</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will mark the order for <span className="font-bold">{order.name}</span> as delivered. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-2 rounded-lg border p-4">
                                <p className="font-semibold">{order.items}</p>
                                <p className="text-muted-foreground">{order.name} - {order.phone}</p>
                                <p className="font-bold text-lg text-primary">K{order.price.toFixed(2)}</p>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => markAsDelivered(order.id)}>
                                    Confirm
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="icon" disabled={order.status === 'Delivered' || order.status === 'Cancelled' || isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                            <span className="sr-only">Cancel Order</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                            <AlertDialogDescription>
                           This will move the order for <span className="font-bold">{order.name}</span> to the cancelled list. An admin can restore it or drop it later.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Back</AlertDialogCancel>
                            <AlertDialogAction
                                className={cn(buttonVariants({ variant: "destructive" }))}
                                onClick={() => cancelOrder(order.id)}
                            >
                                Cancel Order
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                {order.status === 'Delivered' && <OrderReceiptAction order={order} />}
            </CardFooter>
        </Card>
    );
}

function CancelledOrderCard({ order }: { order: AdminOrder }) {
    const { restoreOrder, dropOrder, processingOrder } = useAdmin();
    const isProcessing = processingOrder === order.id;

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start pb-4">
                <div>
                    <CardTitle className="text-lg">{order.name}</CardTitle>
                    <CardDescription>{order.phone}</CardDescription>
                </div>
                <OrderDetailsDialog order={order} isCardVersion={true} />
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                 <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold">Items:</p>
                        <p>{order.items}</p>
                    </div>
                     <Badge variant="destructive" className="h-fit">
                        {order.status}
                    </Badge>
                </div>
                <p className="text-lg font-bold text-primary">K{order.price.toFixed(2)}</p>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2 p-1 pt-0">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="flex-1" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                            Restore
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Restore this order?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This will move the order for <span className="font-bold">{order.name}</span> back to 'Pending'.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => restoreOrder(order.id)}>
                                Restore Order
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex-1" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Drop Order
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Drop this order permanently?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone and will permanently delete the order for <span className="font-bold">{order.name}</span>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className={cn(buttonVariants({ variant: "destructive" }))}
                                onClick={() => dropOrder(order.id)}
                            >
                                Drop Permanently
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}

function OrderTable({ orders, showStatus }: { orders: AdminOrder[], showStatus?: boolean }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Items</TableHead>
                    {showStatus && <TableHead>Status</TableHead>}
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => (
                    <TableRow key={order.id}>
                        <TableCell>
                            <div className="font-medium">{order.name}</div>
                            <div className="text-sm text-muted-foreground">{order.phone}</div>
                        </TableCell>
                        <TableCell>
                            {order.deliveryLocationType === 'school' ? order.school : order.area}
                        </TableCell>
                        <TableCell>{order.items}</TableCell>
                        {showStatus && (
                            <TableCell>
                                <Badge variant={
                                    order.status === 'Delivered' ? 'outline' :
                                    order.status === 'Cancelled' ? 'destructive' :
                                    order.status === 'Pending' ? 'secondary' :
                                    'default'
                                } className={cn(order.status === 'Confirmed' && 'bg-accent text-accent-foreground')}>
                                    {order.status}
                                </Badge>
                            </TableCell>
                        )}
                        <TableCell className="text-right font-mono">K{order.price.toFixed(2)}</TableCell>
                        <TableCell>
                            <OrderActions order={order} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function CancelledOrderTable({ orders }: { orders: AdminOrder[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => (
                    <TableRow key={order.id}>
                        <TableCell>
                            <div className="font-medium">{order.name}</div>
                            <div className="text-sm text-muted-foreground">{order.phone}</div>
                        </TableCell>
                        <TableCell>
                            {order.deliveryLocationType === 'school' ? order.school : order.area}
                        </TableCell>
                        <TableCell>{order.items}</TableCell>
                        <TableCell>
                            <Badge variant="destructive">
                                {order.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">K{order.price.toFixed(2)}</TableCell>
                        <TableCell>
                            <CancelledOrderActions order={order} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default function OrdersDashboard() {
  const { orders, isLoading, userRole } = useAdmin();
  const isMobile = useIsMobile();
  const [campusTypeFilter, setCampusTypeFilter] = useState('all'); // 'all', 'school', 'off-campus'
  const [locationFilter, setLocationFilter] = useState('all');

  const openOrders = useMemo(() => orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed'), [orders]);
  const cancelledOrders = useMemo(() => orders.filter(o => o.status === 'Cancelled'), [orders]);
  const allOrdersSorted = useMemo(() => [...orders].sort((a,b) => b.date.getTime() - a.date.getTime()), [orders]);

  const filteredOpenOrders = useMemo(() => {
    let filtered = openOrders;

    if (campusTypeFilter !== 'all') {
      filtered = filtered.filter(order => order.deliveryLocationType === campusTypeFilter);
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter(order => {
        if (order.deliveryLocationType === 'school') {
          return order.school === locationFilter;
        }
        if (order.deliveryLocationType === 'off-campus') {
          return order.area === locationFilter;
        }
        return false; // Should not happen if campusType is not selected
      });
    }

    return filtered;
  }, [openOrders, campusTypeFilter, locationFilter]);
  
  const handleCampusTypeChange = (value: string) => {
    setLocationFilter('all'); // Reset specific location filter when campus type changes
    setCampusTypeFilter(value);
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <Loader />
        </div>
    )
  }

  return (
    <Tabs defaultValue="open-orders" className="w-full space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="open-orders">
                    {isMobile ? <Package className="h-5 w-5" /> : 'Open Orders'}
                    {openOrders.length > 0 && (
                        <Badge className="ml-2 h-5">{openOrders.length}</Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="cancelled-orders">
                    {isMobile ? <Ban className="h-5 w-5" /> : 'Cancelled'}
                    {cancelledOrders.length > 0 && (
                        <Badge variant="destructive" className="ml-2">{cancelledOrders.length}</Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="all-orders">{isMobile ? <List className="h-5 w-5" /> : 'All Orders'}</TabsTrigger>
            </TabsList>
             <Button asChild variant="outline" className="w-full sm:w-auto shrink-0">
                <Link href="/deliveries/records">
                    <BookMarked className="mr-2 h-4 w-4" />
                    View Records
                </Link>
            </Button>
        </div>
        <TabsContent value="open-orders">
             <Card>
                <CardHeader>
                    <CardTitle>Open Orders</CardTitle>
                    <CardDescription>Manage and fulfill pending and confirmed orders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="campus-type-filter">Filter by Type</Label>
                            <Select value={campusTypeFilter} onValueChange={handleCampusTypeChange}>
                                <SelectTrigger id="campus-type-filter">
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="school">On-Campus</SelectItem>
                                    <SelectItem value="off-campus">Off-Campus</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {campusTypeFilter !== 'all' && (
                            <div>
                                <Label htmlFor="location-filter">Filter by Location</Label>
                                <Select value={locationFilter} onValueChange={setLocationFilter}>
                                    <SelectTrigger id="location-filter">
                                        <SelectValue placeholder="Select specific location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {campusTypeFilter === 'school' ? 'All Schools' : 'All Areas'}
                                        </SelectItem>
                                        {(campusTypeFilter === 'school' ? universitySchema.options : lusakaTownsSchema.options).map(loc => (
                                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    {filteredOpenOrders.length > 0 ? (
                        isMobile ? (
                            <div className="space-y-4">
                                {filteredOpenOrders.map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        ) : (
                            <OrderTable orders={filteredOpenOrders} showStatus />
                        )
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            {openOrders.length > 0 ? 'No open orders match your filter.' : 'No open orders.'}
                        </p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="cancelled-orders">
             <Card>
                <CardHeader>
                    <CardTitle>Cancelled Orders</CardTitle>
                    <CardDescription>Manage cancelled orders. Only admins can restore or permanently drop these orders.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                 {userRole === 'admin' ? (
                    cancelledOrders.length > 0 ? (
                        isMobile ? (
                            <div className="space-y-4">
                                {cancelledOrders.map(order => (
                                    <CancelledOrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        ) : (
                            <CancelledOrderTable orders={cancelledOrders} />
                        )
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No cancelled orders found.</p>
                    )
                 ) : (
                    <p className="text-center text-muted-foreground py-8">Only admins can view this section.</p>
                 )}
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="all-orders">
             <Card>
                <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>View all orders that have ever been placed.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                 {allOrdersSorted.length > 0 ? (
                    isMobile ? (
                        <div className="space-y-4">
                            {allOrdersSorted.map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    ) : (
                        <OrderTable orders={allOrdersSorted} showStatus />
                    )
                 ) : (
                    <p className="text-center text-muted-foreground py-8">No orders found.</p>
                 )}
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
}
