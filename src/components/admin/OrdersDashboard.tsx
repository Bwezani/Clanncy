"use client";

import React from 'react';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdmin } from '@/context/AdminContext';


function OrderCard({ order, onMarkAsDelivered }: { order: Order, onMarkAsDelivered?: (orderId: string) => void }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg truncate" style={{ maxWidth: '200px' }}>{order.id}</CardTitle>
                <CardDescription>{order.date}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <p><span className="font-semibold">Items:</span> {order.items}</p>
                <p><span className="font-semibold">Status:</span> {order.status}</p>
                <p className="text-lg font-bold text-primary">K{order.price.toFixed(2)}</p>
            </CardContent>
            {onMarkAsDelivered && order.status !== 'Delivered' && (
                <CardFooter>
                     <Button
                        onClick={() => onMarkAsDelivered(order.id)}
                        disabled={order.status === 'Delivered'}
                        className="w-full"
                        variant="default"
                    >
                        <Check className="mr-2 h-4 w-4" />
                        Mark as Delivered
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

function OrderTable({ orders, onMarkAsDelivered, showStatus }: { orders: Order[], onMarkAsDelivered?: (orderId: string) => void, showStatus?: boolean }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    {showStatus && <TableHead>Status</TableHead>}
                    <TableHead className="text-right">Price</TableHead>
                    {onMarkAsDelivered && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => (
                    <TableRow key={order.id}>
                        <TableCell className="font-medium truncate" style={{ maxWidth: '150px' }}>{order.id}</TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell>{order.items}</TableCell>
                        {showStatus && <TableCell>{order.status}</TableCell>}
                        <TableCell className="text-right">K{order.price.toFixed(2)}</TableCell>
                        {onMarkAsDelivered && order.status !== 'Delivered' && (
                             <TableCell className="text-right">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => onMarkAsDelivered(order.id)}
                                    disabled={order.status === 'Delivered'}
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    Mark as Delivered
                                </Button>
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}


export default function OrdersDashboard() {
  const { orders, markAsDelivered, isLoading } = useAdmin();
  const isMobile = useIsMobile();
  
  const openOrders = orders.filter(o => o.status !== 'Delivered');

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
            <TabsTrigger value="open-orders">Open Orders</TabsTrigger>
            <TabsTrigger value="all-orders">All Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="open-orders">
             <Card>
                <CardHeader>
                <CardTitle>Open Orders</CardTitle>
                <CardDescription>Manage and fulfill pending and ready for pickup orders.</CardDescription>
                </CardHeader>
                <CardContent>
                {openOrders.length > 0 ? (
                    isMobile ? (
                        <div className="space-y-4">
                            {openOrders.map(order => (
                                <OrderCard key={order.id} order={order} onMarkAsDelivered={markAsDelivered} />
                            ))}
                        </div>
                    ) : (
                        <OrderTable orders={openOrders} onMarkAsDelivered={markAsDelivered} showStatus />
                    )
                ) : (
                    <p className="text-center text-muted-foreground py-8">No open orders.</p>
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
                 {orders.length > 0 ? (
                    isMobile ? (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    ) : (
                        <OrderTable orders={orders} showStatus />
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
