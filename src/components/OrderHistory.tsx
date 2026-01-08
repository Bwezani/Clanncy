
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '@/lib/firebase/config';
import type { Order as OrderType } from '@/lib/types';
import type { OrderInput } from '@/lib/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { List, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/hooks/use-user';

// Extended Order type to include what we get from Firestore
type FetchedOrder = OrderInput & {
    id: string;
    createdAt: Timestamp;
    status: 'Pending' | 'Ready for Pickup' | 'Delivered';
    userId?: string;
};

function formatOrderItems(order: FetchedOrder): string {
    const quantity = order.quantity;
    if (order.chickenType === 'whole') {
        return `${quantity}x Whole Chicken${quantity > 1 ? 's' : ''}`;
    }
    return `${quantity}x Chicken Piece${quantity > 1 ? 's' : ''}`;
}


function OrderList({ orders, emptyState, isLoading }: { orders: OrderType[], emptyState: React.ReactNode, isLoading: boolean }) {
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
    const sortedOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-4">
          {sortedOrders.map(order => (
            <Card key={order.id} className="shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-bold truncate" style={{ maxWidth: '150px' }}>{order.id}</CardTitle>
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
                            <p className="text-sm text-muted-foreground">{order.date}</p>
                            <p className="font-semibold">{order.items}</p>
                        </div>
                        <p className="text-xl font-bold text-primary">K{order.price.toFixed(2)}</p>
                    </div>
                </CardContent>
            </Card>
          ))}
        </div>
    )
}

export function OrderHistory() {
  const [orders, setOrders] = useState<FetchedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs once to get the deviceId from localStorage.
    const storedDeviceId = localStorage.getItem('deviceId');
    if (storedDeviceId) {
        setDeviceId(storedDeviceId);
    }
  }, []);


  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      
      if (!user && !deviceId) {
        setIsLoading(false);
        return;
      }

      let allOrders: FetchedOrder[] = [];

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

        const querySnapshots = await Promise.all(queries.map(q => getDocs(q)));
        
        querySnapshots.forEach(snapshot => {
            snapshot.forEach((doc) => {
                allOrders.push({ id: doc.id, ...doc.data() } as FetchedOrder);
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
      status: order.status
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
