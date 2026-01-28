
'use client';

import React, { useState, useMemo, useRef } from 'react';
import type { AdminOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button, buttonVariants } from '@/components/ui/button';
import { Check, Loader2, Info, Trash2, Phone, Receipt, Download } from 'lucide-react';
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

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12.04 2.004c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.42 1.29 4.88L2 22l5.25-1.38c1.41.81 3.02 1.29 4.7 1.29h.01c5.46 0 9.91-4.45 9.91-9.91s-4.45-9.91-9.91-9.91zM17.23 15.25c-.2-.11-.73-.36-1.04-.42-.32-.06-.55-.1-.78.1-.23.2-.88.75-1.08.9-.2.15-.4.16-.58.05-.18-.1-.73-.27-1.4-1.12-.52-.63-.87-1.12-1-1.32-.1-.2-.02-.3.07-.4.08-.08.2-.21.28-.31.08-.1.12-.18.18-.3.06-.12.03-.23-.02-.33-.05-.1-.49-.97-1.17-1.34-.14-.08-.28-.1-.42-.1-.14 0-.3 0-.44.02-.14.02-.36.1-.55.28-.19.18-.73.7-1.02 1.33-.29.63-.58 1.48.05 2.58.63 1.1 1.04 1.48 2.28 2.53 1.96 1.69 2.53 1.61 3.48 1.61.95 0 1.7-.13 2.1-.26.4-.13 1.04-.42 1.18-.83.14-.4.14-.78.1-.88-.05-.1-.18-.16-.38-.26z" />
    </svg>
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
                <Button variant="outline" size="sm" className="flex-1 md:flex-none">
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
    const { confirmDelivery, markAsDelivered, deleteOrder } = useAdmin();
    return (
        <div className="flex items-center justify-start gap-2">
            <OrderDetailsDialog order={order} />

            {order.status === 'Pending' && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="sm">
                            <Check className="mr-2 h-4 w-4" /> Confirm Delivery
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
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <Check className="mr-2 h-4 w-4" /> Mark Delivered
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
                    <Button variant="destructive" size="sm" disabled={order.status === 'Delivered'}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Drop Order
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Drop this order?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will permanently delete the order for <span className="font-bold">{order.name}</span>. This is for cancellations and cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(buttonVariants({ variant: "destructive" }))}
                            onClick={() => deleteOrder(order.id)}
                        >
                            Drop Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {order.status === 'Delivered' && <OrderReceiptAction order={order} />}
        </div>
    )
}


function OrderCard({ order }: { order: AdminOrder }) {
    const { confirmDelivery, markAsDelivered, deleteOrder } = useAdmin();
    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="text-lg">{order.name}</CardTitle>
                    <CardDescription>{order.phone}</CardDescription>
                </div>
                <OrderDetailsDialog order={order} isCardVersion={true} />
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold">Items:</p>
                        <p>{order.items}</p>
                    </div>
                     <Badge variant={
                        order.status === 'Delivered' ? 'outline' :
                        order.status === 'Pending' ? 'secondary' :
                        'default'
                    } className={cn(order.status === 'Confirmed' && 'bg-accent text-accent-foreground', "h-fit")}>
                        {order.status}
                    </Badge>
                </div>
                <p className="text-lg font-bold text-primary">K{order.price.toFixed(2)}</p>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2">
                {order.status === 'Pending' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" className="flex-1">
                                <Check className="mr-2 h-4 w-4" /> Confirm Delivery
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
                            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                                <Check className="mr-2 h-4 w-4" /> Mark Delivered
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
                        <Button variant="destructive" size="sm" className="flex-1" disabled={order.status === 'Delivered'}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Drop Order
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Drop this order?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This will permanently delete the order for <span className="font-bold">{order.name}</span>. This is for cancellations and cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className={cn(buttonVariants({ variant: "destructive" }))}
                                onClick={() => deleteOrder(order.id)}
                            >
                                Drop Order
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                {order.status === 'Delivered' && <OrderReceiptAction order={order} />}
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


export default function OrdersDashboard() {
  const { orders, isLoading } = useAdmin();
  const isMobile = useIsMobile();
  const [campusTypeFilter, setCampusTypeFilter] = useState('all'); // 'all', 'school', 'off-campus'
  const [locationFilter, setLocationFilter] = useState('all');

  const openOrders = useMemo(() => orders.filter(o => o.status !== 'Delivered'), [orders]);
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
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <Tabs defaultValue="open-orders" className="w-full space-y-8">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open-orders">
                Open Orders
                {openOrders.length > 0 && (
                    <Badge className="ml-2 h-5">{openOrders.length}</Badge>
                )}
            </TabsTrigger>
            <TabsTrigger value="all-orders">All Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="open-orders">
             <Card>
                <CardHeader>
                    <CardTitle>Open Orders</CardTitle>
                    <CardDescription>Manage and fulfill pending and confirmed orders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
         <TabsContent value="all-orders">
             <Card>
                <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>View all orders that have ever been placed.</CardDescription>
                </CardHeader>
                <CardContent>
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
