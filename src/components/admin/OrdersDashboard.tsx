
"use client";

import React, { useState } from 'react';
import type { AdminOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { Check, Loader2, Info } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdmin } from '@/context/AdminContext';


function OrderDetailsDialog({ order }: { order: AdminOrder }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Info className="mr-2 h-4 w-4" />
                    More Details
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                    <DialogDescription className="break-all">
                        Full details for order ID: <span className="font-mono text-xs">{order.id}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
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
            </DialogContent>
        </Dialog>
    )
}

function OrderCard({ order, onMarkAsDelivered }: { order: AdminOrder, onMarkAsDelivered?: (orderId: string) => void }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{order.name}</CardTitle>
                <CardDescription>{order.phone}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p><span className="font-semibold">Items:</span> {order.items}</p>
                <p><span className="font-semibold">Status:</span> {order.status}</p>
                <p className="text-lg font-bold text-primary">K{order.price.toFixed(2)}</p>
                 <OrderDetailsDialog order={order} />
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

function OrderTable({ orders, onMarkAsDelivered, showStatus }: { orders: AdminOrder[], onMarkAsDelivered?: (orderId: string) => void, showStatus?: boolean }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    {showStatus && <TableHead>Status</TableHead>}
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Details</TableHead>
                    {onMarkAsDelivered && <TableHead className="text-center">Action</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => (
                    <TableRow key={order.id}>
                        <TableCell>
                            <div className="font-medium">{order.name}</div>
                            <div className="text-sm text-muted-foreground">{order.phone}</div>
                        </TableCell>
                        <TableCell>{order.items}</TableCell>
                        {showStatus && <TableCell>{order.status}</TableCell>}
                        <TableCell className="text-right">K{order.price.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                            <OrderDetailsDialog order={order} />
                        </TableCell>
                        {onMarkAsDelivered && (
                             <TableCell className="text-center">
                                {order.status !== 'Delivered' ? (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => onMarkAsDelivered(order.id)}
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Mark Delivered
                                    </Button>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Completed</span>
                                )}
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
                                <OrderCard key={order.id} order={order} onMarkAsDelivered={markAsDelivered} />
                            ))}
                        </div>
                    ) : (
                        <OrderTable orders={orders} onMarkAsDelivered={markAsDelivered} showStatus />
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

    