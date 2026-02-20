'use client';

import { useAdmin } from "@/context/AdminContext";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DeliveryRecord, AdminOrder } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Phone, Plus, RefreshCw, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "../ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import OrderForm from '../OrderForm';
import type { OrderInput } from "@/lib/schema";
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


function PlaceOrderDialog({ open, onOpenChange, record }: { open: boolean, onOpenChange: (open: boolean) => void, record: DeliveryRecord }) {
    const { deleteRecord } = useAdmin();
    const { toast } = useToast();

    const handleSuccess = async (result: { success: boolean; orderId: string | null; message: string; }) => {
        if (result.success && result.orderId) {
            try {
                await deleteRecord(record.id);
                toast({
                    title: 'Order Placed & Record Removed!',
                    description: `A new order has been placed for ${record.name} and their old record was removed.`,
                });
                onOpenChange(false);
            } catch (e) {
                // deleteRecord will show its own error toast.
                console.error(e);
            }
        }
    };
    
    const initialData: Partial<OrderInput> = {
        name: record.name,
        phone: record.phone,
        deliveryLocationType: record.deliveryLocationType,
        school: record.school as any,
        block: record.block,
        room: record.room,
        area: record.area as any,
        street: record.street,
        houseNumber: record.houseNumber,
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Place New Order for {record.name}</DialogTitle>
                    <DialogDescription>
                        Placing an order on behalf of a customer. Device ID: <span className="font-mono text-xs">{record.id}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[calc(80vh-10rem)] overflow-y-auto p-1">
                    <OrderForm overrideDeviceId={record.id} onSuccess={handleSuccess} formLayout="stacked" initialData={initialData} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function getDeliveryLocationString(record: DeliveryRecord): string {
    if (record.deliveryLocationType === 'school') {
        return [record.school, record.block, record.room ? `Room ${record.room}` : ''].filter(Boolean).join(', ');
    }
    return [record.area, record.street, record.houseNumber].filter(Boolean).join(', ');
}


function RecordList({ records, type, orders }: { records: DeliveryRecord[], type: 'delivered' | 'dropped', orders: AdminOrder[] }) {
    const isMobile = useIsMobile();
    const actionDateLabel = type === 'delivered' ? 'Last Delivered' : 'Last Dropped';
    const { toast } = useToast();
    const [isChecking, setIsChecking] = useState<string | null>(null);

    const [selectedRecord, setSelectedRecord] = useState<DeliveryRecord | null>(null);
    const [isPlaceOrderDialogOpen, setIsPlaceOrderDialogOpen] = useState(false);

    const handleOpenOrderClick = (record: DeliveryRecord) => {
        setSelectedRecord(record);
        setIsPlaceOrderDialogOpen(true);
    }


    const handleCheckOpenOrders = (deviceId: string) => {
        setIsChecking(deviceId);
        
        setTimeout(() => {
            const openOrder = orders.find(order => 
                order.fullOrder.deviceId === deviceId && order.status !== 'Delivered'
            );

            if (openOrder) {
                toast({
                    title: "Open Order Found!",
                    description: `This device has an open order: #${openOrder.id} (${openOrder.status}).`,
                });
            } else {
                toast({
                    title: "No Open Orders",
                    description: `No open orders found for this device.`,
                });
            }
            setIsChecking(null);
        }, 500);
    };

    if (records.length === 0) {
        return (
            <p className="text-center text-muted-foreground py-8">
                No {type} records found.
            </p>
        );
    }
    
    if (isMobile) {
        return (
            <div className="space-y-4">
                {records.map(record => (
                    <Card key={record.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle className="text-base">{record.name}</CardTitle>
                                    <CardDescription>{record.phone}</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleOpenOrderClick(record)}>
                                    <Plus className="mr-2 h-4 w-4" /> Open Order
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div>
                                <p className="font-semibold">Location:</p>
                                <p className="text-muted-foreground">{getDeliveryLocationString(record)}</p>
                            </div>
                             <div>
                                <p className="font-semibold">{actionDateLabel}:</p>
                                <p className="text-muted-foreground">{record.formattedLastActionAt}</p>
                            </div>
                             <div>
                                <p className="font-semibold">Device ID:</p>
                                <p className="font-mono text-xs text-muted-foreground break-all">{record.id}</p>
                            </div>
                        </CardContent>
                         <CardFooter className="flex flex-col gap-2">
                             <div className="flex gap-2 w-full">
                                <Button asChild size="sm" variant="outline" className="flex-1">
                                    <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(record.phone)}`} target="_blank" rel="noopener noreferrer">
                                        <WhatsAppIcon className="mr-2 h-4 w-4" /> WhatsApp
                                    </a>
                                </Button>
                                <Button asChild size="sm" className="flex-1">
                                    <a href={`tel:${record.phone}`}>
                                        <Phone className="mr-2 h-4 w-4" /> Call
                                    </a>
                                </Button>
                            </div>
                            <Button 
                                size="sm" 
                                variant="secondary"
                                className="w-full"
                                onClick={() => handleCheckOpenOrders(record.id)}
                                disabled={isChecking === record.id}
                            >
                                {isChecking === record.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Check for Open Orders
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                 {selectedRecord && (
                    <PlaceOrderDialog
                        open={isPlaceOrderDialogOpen}
                        onOpenChange={setIsPlaceOrderDialogOpen}
                        record={selectedRecord}
                    />
                )}
            </div>
        );
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>{actionDateLabel}</TableHead>
                        <TableHead>Device ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map(record => (
                        <TableRow key={record.id}>
                            <TableCell>{record.name}</TableCell>
                            <TableCell>{record.phone}</TableCell>
                            <TableCell>{getDeliveryLocationString(record)}</TableCell>
                            <TableCell>{record.formattedLastActionAt}</TableCell>
                            <TableCell className="font-mono text-xs max-w-[150px] truncate">{record.id}</TableCell>
                            <TableCell className="text-right">
                                <TooltipProvider>
                                    <div className="flex items-center justify-end gap-2">
                                    <Button size="sm" onClick={() => handleOpenOrderClick(record)}>
                                        <Plus className="mr-2 h-4 w-4" /> New Order
                                    </Button>
                                    <Button asChild size="sm" variant="outline">
                                            <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(record.phone)}`} target="_blank" rel="noopener noreferrer">
                                                <WhatsAppIcon className="mr-2 h-4 w-4" /> WhatsApp
                                            </a>
                                        </Button>
                                        <Button asChild size="sm">
                                            <a href={`tel:${record.phone}`}>
                                                <Phone className="mr-2 h-4 w-4" /> Call
                                            </a>
                                        </Button>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost"
                                                    onClick={() => handleCheckOpenOrders(record.id)}
                                                    disabled={isChecking === record.id}
                                                >
                                                    {isChecking === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                                    <span className="sr-only">Check for open orders</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Check for open orders</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TooltipProvider>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {selectedRecord && (
                <PlaceOrderDialog
                    open={isPlaceOrderDialogOpen}
                    onOpenChange={setIsPlaceOrderDialogOpen}
                    record={selectedRecord}
                />
            )}
        </>
    );
}

export default function RecordsDashboard() {
    const { deliveredRecords, droppedRecords, isLoading, orders } = useAdmin();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader />
            </div>
        );
    }
    
    return (
        <Tabs defaultValue="delivered" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="delivered">Delivered Records</TabsTrigger>
                <TabsTrigger value="dropped">Dropped Records</TabsTrigger>
            </TabsList>
            <TabsContent value="delivered" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Delivered Records</CardTitle>
                        <CardDescription>
                            Unique devices for orders that were successfully delivered. The record is updated on each new delivery.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecordList records={deliveredRecords} type="delivered" orders={orders} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="dropped" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Dropped Records</CardTitle>
                        <CardDescription>
                            Unique devices for orders that were dropped/cancelled. The record is updated if another order from the same device is dropped.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecordList records={droppedRecords} type="dropped" orders={orders} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
