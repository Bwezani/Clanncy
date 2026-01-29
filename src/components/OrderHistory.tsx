
'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import type { Order as OrderType } from '@/lib/types';
import type { FirestoreOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, List, Loader2, Receipt, Download, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/hooks/use-user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import OrderReceipt from './OrderReceipt';
import html2canvas from 'html2canvas';
import OrderStatusProgress from './OrderStatusProgress';
import { Separator } from './ui/separator';
import { submitOrder } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { OrderInput } from '@/lib/schema';


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
    const [reorderingId, setReorderingId] = useState<string | null>(null);
    
    const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    const { toast } = useToast();
    const { user } = useUser();

    const handleDownload = async () => {
        if (!receiptRef.current || !selectedOrder) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(receiptRef.current, {
                useCORS: true,
                scale: 2,
            });
            const link = document.createElement('a');
            link.download = `receipt-${selectedOrder.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error("Failed to download receipt:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleOrderClick = (order: OrderType) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const handleOrderAgain = async (orderToCopy: OrderType | null) => {
        if (!orderToCopy || reorderingId) return;

        setReorderingId(orderToCopy.id);

        const originalOrder = orderToCopy.fullOrder;

        const newOrderData: OrderInput = {
            chickenType: originalOrder.chickenType,
            piecesType: originalOrder.piecesType,
            quantity: originalOrder.quantity,
            price: originalOrder.price,
            pieceDetails: originalOrder.pieceDetails,
            name: originalOrder.name,
            phone: originalOrder.phone,
            deliveryLocationType: originalOrder.deliveryLocationType,
            school: originalOrder.school as any,
            block: originalOrder.block,
            room: originalOrder.room,
            area: originalOrder.area as any,
            street: originalOrder.street,
            houseNumber: originalOrder.houseNumber,
        };
        
        const deviceId = localStorage.getItem('deviceId');
        const submissionData: OrderInput & { userId?: string, deviceId?: string } = {
            ...newOrderData,
            deviceId: deviceId || undefined,
            userId: user?.uid,
        };

        const result = await submitOrder(submissionData);

        if (result.success && result.orderId) {
            toast({
              title: 'Success!',
              description: 'A new order has been placed based on your previous one.',
            });

            if (!user) {
                const anonymousOrderIds = JSON.parse(localStorage.getItem('anonymousOrderIds') || '[]');
                anonymousOrderIds.push(result.orderId);
                localStorage.setItem('anonymousOrderIds', JSON.stringify(anonymousOrderIds));
            }
            setIsDetailsOpen(false);
        } else {
            toast({
              variant: 'destructive',
              title: 'Order Failed',
              description: result.message || 'Could not place the new order.',
            });
        }
        setReorderingId(null);
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
        <>
            <div className="space-y-4">
            {sortedOrders.map(order => {
                const isThisOrderReordering = reorderingId === order.id;
                return (
                    <Card key={order.id} onClick={() => handleOrderClick(order)} className="shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            {order.status === 'Delivered' ? (
                                <div>
                                    <Button
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOrderAgain(order);
                                        }}
                                        disabled={reorderingId !== null}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {isThisOrderReordering ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <RotateCw className="mr-2 h-4 w-4" />
                                        )}
                                        Order Again
                                    </Button>
                                    <p className="text-sm text-muted-foreground mt-2">{order.date}</p>
                                </div>
                            ) : (
                                <div>
                                    <CardTitle className="text-lg font-bold truncate" style={{ maxWidth: '150px' }}>{order.id}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{order.date}</p>
                                </div>
                            )}
                            <Badge variant={
                                order.status === 'Delivered' ? 'outline' :
                                order.status === 'Pending' ? 'secondary' :
                                'default'
                            } className={cn(order.status === 'Confirmed' && 'bg-accent text-accent-foreground')}>
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
                    </Card>
                )
            })}
            </div>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-md">
                    {selectedOrder && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Order Status</DialogTitle>
                                <DialogDescription>
                                    Order ID: <span className="font-mono text-xs">{selectedOrder.id}</span>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-6">
                                <OrderStatusProgress currentStatus={selectedOrder.status} />
                                <Separator />
                                <div className="space-y-2 text-sm">
                                    <h4 className="font-semibold">Order Summary</h4>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Items</span>
                                        <span className="font-medium">{selectedOrder.items}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="font-bold text-lg text-primary">K{selectedOrder.price.toFixed(2)}</span>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2 text-sm">
                                    <h4 className="font-semibold">Delivery To</h4>
                                    <p className="font-medium">{selectedOrder.fullOrder.name}</p>
                                    <p className="text-muted-foreground">
                                        {selectedOrder.fullOrder.deliveryLocationType === 'school'
                                            ? `${selectedOrder.fullOrder.school || ''}, ${selectedOrder.fullOrder.block || ''}, Room ${selectedOrder.fullOrder.room || ''}`
                                            : `${selectedOrder.fullOrder.area || ''}, ${selectedOrder.fullOrder.street || ''}, ${selectedOrder.fullOrder.houseNumber || ''}`}
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                {selectedOrder.status === 'Delivered' && (
                                    <>
                                        <Button variant="outline" onClick={() => { setIsDetailsOpen(false); setIsReceiptOpen(true); }}>
                                            <Receipt className="mr-2 h-4 w-4" />
                                            View Receipt
                                        </Button>
                                        <Button onClick={() => handleOrderAgain(selectedOrder)} disabled={reorderingId !== null}>
                                            {reorderingId === selectedOrder.id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <RotateCw className="mr-2 h-4 w-4" />
                                            )}
                                            Order Again
                                        </Button>
                                    </>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isReceiptOpen} onOpenChange={(open) => {
                setIsReceiptOpen(open);
                // If we are closing the receipt, we don't want to keep the order selected.
                if (!open) {
                    setSelectedOrder(null);
                }
            }}>
                <DialogContent className="p-0 bg-transparent border-none shadow-none max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="sr-only">Order Receipt for {selectedOrder?.id}</DialogTitle>
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
                    {selectedOrder && <OrderReceipt order={selectedOrder.fullOrder} ref={receiptRef} />}
                </DialogContent>
            </Dialog>
        </>
    )
}

export function OrderHistory() {
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const { user } = useUser();

  useEffect(() => {
    const deviceId = localStorage.getItem('deviceId');
    const orderColl = collection(db, 'orders');
    let unsubscribe: (() => void) | null = null;

    setIsLoading(true);

    if (user) {
        // User is logged in, fetch their orders
        const userQuery = query(orderColl, where('userId', '==', user.uid));
        unsubscribe = onSnapshot(userQuery, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreOrder));
            setOrders(fetchedOrders);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching user orders:", error);
            setOrders([]);
            setIsLoading(false);
        });
    } else if (deviceId) {
        // User is logged out, fetch orders for this device that are anonymous
        const deviceQuery = query(orderColl, where('deviceId', '==', deviceId));
        unsubscribe = onSnapshot(deviceQuery, (snapshot) => {
            const fetchedOrders = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreOrder))
                .filter(order => !order.userId); // Ensure we only show orders placed anonymously
            setOrders(fetchedOrders);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching device orders:", error);
            setOrders([]);
            setIsLoading(false);
        });
    } else {
        // No user and no device ID, so no orders to show
        setOrders([]);
        setIsLoading(false);
    }

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [user]);

  const formattedOrders: OrderType[] = orders.map(order => ({
      id: order.id,
      date: format(order.createdAt.toDate(), 'do MMMM, yyyy'),
      items: formatOrderItems(order),
      price: order.price,
      status: order.status,
      fullOrder: order,
  }));

  const pendingOrders = formattedOrders.filter(o => o.status === 'Pending' || o.status === 'Confirmed');
  const completedOrders = formattedOrders.filter(o => o.status === 'Delivered');

  // On initial load, if pending is empty but history has items, switch to history.
  useEffect(() => {
    if (!isLoading && activeTab === 'pending' && pendingOrders.length === 0 && completedOrders.length > 0) {
      setActiveTab('history');
    }
  }, [isLoading, activeTab, pendingOrders.length, completedOrders.length]);

  // If user is on an empty pending tab, switch back to history after a minute.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTab === 'pending' && !isLoading && pendingOrders.length === 0 && completedOrders.length > 0) {
        timer = setTimeout(() => {
            setActiveTab('history');
        }, 60000); // 1 minute
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [activeTab, isLoading, pendingOrders.length, completedOrders.length]);

  return (
    <>
      <div className="mb-4">
        <Button asChild size="lg" className="w-full">
          <Link href="/">
            <Plus className="mr-2 h-5 w-5" />
            Make a New Order
          </Link>
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'history')} className="w-full">
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
    </>
  );
}
