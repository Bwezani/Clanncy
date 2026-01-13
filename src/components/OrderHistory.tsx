
'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '@/lib/firebase/config';
import type { Order as OrderType } from '@/lib/types';
import type { FirestoreOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { List, Loader2, Receipt, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/hooks/use-user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import OrderReceipt from './OrderReceipt';
import html2canvas from 'html2canvas';


function formatOrderItems(order: FirestoreOrder): string {
    const quantity = order.quantity;
    if (order.chickenType === 'whole') {
        return `${quantity}x Whole Chicken${quantity > 1 ? 's' : ''}`;
    }
    
    if (order.chickenType === 'pieces' && order.piecesType === 'custom' && order.pieceDetails) {
        const totalPieces = Object.values(order.pieceDetails).reduce((sum, val) => sum + (val || 0), 0);
        return `${totalPieces}x Custom Pieces`;
    }

    return `${quantity}x Mixed Piece${quantity > 1 ? 's' : ''}`;
}


function OrderList({ orders, emptyState, isLoading }: { orders: OrderType[], emptyState: React.ReactNode, isLoading: boolean }) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<FirestoreOrder | null>(null);

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(receiptRef.current, {
                useCORS: true,
                scale: 2,
            });
            const link = document.createElement('a');
            if (selectedOrderForReceipt) {
                link.download = `receipt-${selectedOrderForReceipt.id}.png`;
            }
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error("Failed to download receipt:", error);
        } finally {
            setIsDownloading(false);
        }
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    if (orders.length === 0) {
        return emptyState;
    }

    // Sort orders by date descending before rendering
    const sortedOrders = [...orders].sort((a, b) => b.fullOrder.createdAt.toMillis() - a.fullOrder.createdAt.toMillis());

    return (
        <div className="space-y-4">
          {sortedOrders.map(order => (
            <Card key={order.id} className="shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg font-bold truncate" style={{ maxWidth: '150px' }}>{order.id}</CardTitle>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                    </div>
                     <Badge variant={
                        order.status === 'Delivered' ? 'outline' :
                        order.status === 'Pending' ? 'secondary' :
                        'default'
                    } className={cn(order.status === 'Ready for Pickup' && 'bg-accent text-accent-foreground')}>
                        {order.status}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="font-semibold">{order.items}</p>
                        </div>
                        <p className="text-xl font-bold text-primary">K{order.price.toFixed(2)}</p>
                    </div>
                </CardContent>
                {order.status === 'Delivered' && (
                     <CardFooter className="pt-4">
                         <Dialog onOpenChange={(open) => { if (open) { setSelectedOrderForReceipt(order.fullOrder) } else { setSelectedOrderForReceipt(null) }}}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="ml-auto">
                                    <Receipt className="mr-2 h-4 w-4" />
                                    View Receipt
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="p-0 bg-transparent border-none shadow-none max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                     <DialogTitle className="sr-only">Order Receipt for {selectedOrderForReceipt?.id}</DialogTitle>
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
                    </CardFooter>
                )}
            </Card>
          ))}
        </div>
    )
}

export function OrderHistory() {
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs once to get the deviceId from localStorage.
    const storedDeviceId = localStorage.getItem('deviceId');
    if (storedDeviceId) {
        setDeviceId(storedDeviceId);
    } else {
        // If there's no deviceId and no user, we can stop loading.
        if (!user) setIsLoading(false);
    }
  }, [user]);


  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      
      if (!user && !deviceId) {
        setIsLoading(false);
        return;
      }

      let allOrders: FirestoreOrder[] = [];

      try {
        const orderColl = collection(db, 'orders');
        
        let queries = [];
        // Always query by deviceId if it exists.
        if (deviceId) {
             queries.push(query(orderColl, where('deviceId', '==', deviceId)));
        }
        // If the user is logged in, also query by their userId.
        if (user) {
            queries.push(query(orderColl, where('userId', '==', user.uid)));
        }

        if (queries.length === 0) {
            setIsLoading(false);
            return;
        }

        const querySnapshots = await Promise.all(queries.map(q => getDocs(q)));
        
        querySnapshots.forEach(snapshot => {
            snapshot.forEach((doc) => {
                allOrders.push({ id: doc.id, ...doc.data() } as FirestoreOrder);
            });
        })
        
        // Remove duplicates if a user is logged in (orders might have both userId and deviceId)
        const uniqueOrders = Array.from(new Map(allOrders.map(order => [order.id, order])).values());
        
        // Sort by creation date descending
        uniqueOrders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        setOrders(uniqueOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // We depend on deviceId being set, OR a user being logged in before fetching.
    if (deviceId || user) {
        fetchOrders();
    }
  }, [user, deviceId]);

  const formattedOrders: OrderType[] = orders.map(order => ({
      id: order.id,
      date: format(order.createdAt.toDate(), 'do MMMM, yyyy'),
      items: formatOrderItems(order),
      price: order.price,
      status: order.status,
      fullOrder: order,
  }));

  const pendingOrders = formattedOrders.filter(o => o.status === 'Pending' || o.status === 'Ready for Pickup');
  const completedOrders = formattedOrders.filter(o => o.status === 'Delivered');

  return (
    <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending Reservations</TabsTrigger>
            <TabsTrigger value="history">Reservation History</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
            <OrderList
                orders={pendingOrders}
                isLoading={isLoading}
                emptyState={
                    <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card">
                        <List className="mx-auto h-12 w-12 text-foreground/30" />
                        <h3 className="mt-4 text-lg font-medium">No pending orders</h3>
                        <p className="mt-1 text-sm text-foreground/60">
                            You have no pending reservations. Start by ordering some chicken!
                        </p>
                    </div>
                }
            />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
            <OrderList
                orders={completedOrders}
                isLoading={isLoading}
                emptyState={
                    <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card">
                        <List className="mx-auto h-12 w-12 text-foreground/30" />
                        <h3 className="mt-4 text-lg font-medium">No completed orders</h3>
                        <p className="mt-1 text-sm text-foreground/60">
                           Your past orders will appear here.
                        </p>
                    </div>
                }
            />
        </TabsContent>
    </Tabs>
  );
}
