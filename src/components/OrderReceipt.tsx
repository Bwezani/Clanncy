
'use client';

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import type { FirestoreOrder } from '@/lib/types';
import { Separator } from './ui/separator';

function formatOrderItems(order: FirestoreOrder): { name: string, quantity: number, price: number }[] {
    if (order.productType === 'generic') {
        const displayName = order.variationName && order.variationName !== 'Default' 
            ? `${order.optionName} (${order.variationName})`
            : `${order.optionName} (${order.productName})`;
        return [{ name: displayName, quantity: order.quantity, price: order.price }];
    }

    if (order.chickenType === 'whole') {
        return [{ name: 'Whole Chicken', quantity: order.quantity, price: order.price }];
    }

    if (order.chickenType === 'pieces') {
        if (order.piecesType === 'mixed') {
            return [{ name: 'Mixed Pieces', quantity: order.quantity, price: order.price }];
        }
        if (order.piecesType === 'custom' && order.pieceDetails) {
            const items = Object.entries(order.pieceDetails)
                .filter(([, qty]) => qty > 0)
                .map(([name, quantity]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), quantity: quantity || 0, price: 0 }));
            if (items.length > 0) return items;
        }
    }
    
    return [{ name: `Product Item`, quantity: order.quantity, price: order.price }];
}

const OrderReceipt = forwardRef<HTMLDivElement, { order: FirestoreOrder }>(({ order }, ref) => {
    const items = formatOrderItems(order);
    const siteUrl = 'https://curbside-farms.netlify.app/';

    return (
        <div className="max-w-sm mx-auto p-4 sm:p-0">
            <div ref={ref} className="font-mono bg-white text-black p-6 rounded-lg shadow-lg">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">FarmFresh</h2>
                    <p className="text-xs">Your Campus Product Source</p>
                    <p className="text-xs">Order Receipt</p>
                </div>

                <Separator className="my-4 bg-gray-400" />

                <div className="text-xs space-y-1">
                    <p>Order ID: {order.id}</p>
                    <p>Date: {format(order.createdAt.toDate(), 'do MMMM, yyyy, hh:mm a')}</p>
                </div>

                <Separator className="my-4 bg-gray-400" />
                
                <div className="text-xs space-y-1">
                    <p className="font-bold">Billed To:</p>
                    <p>{order.name}</p>
                    <p>{order.phone}</p>
                    {order.deliveryLocationType === 'school' ? (
                        <p>{order.school}, {order.block}, Room {order.room}</p>
                    ) : (
                        <p>{order.area}, {order.street}, {order.houseNumber}</p>
                    )}
                </div>

                <Separator className="my-4 bg-gray-400" />

                <div className="space-y-2">
                    <div className="flex justify-between font-bold text-xs">
                        <p>DESCRIPTION</p>
                        <p>TOTAL</p>
                    </div>
                    {items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                            <p>{item.quantity}x {item.name}</p>
                            {items.length === 1 && <p>K{item.price.toFixed(2)}</p>}
                        </div>
                    ))}
                </div>

                <Separator className="my-4 bg-gray-400" />

                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <p>Subtotal</p>
                        <p>K{order.price.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between font-bold text-sm">
                        <p>TOTAL</p>
                        <p>K{order.price.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between">
                        <p>Payment Method</p>
                        <p>Pay on Delivery</p>
                    </div>
                </div>

                <Separator className="my-4 bg-gray-400" />
                
                <div className="flex flex-col items-center justify-center space-y-2 mt-4">
                    <QRCode
                        value={siteUrl}
                        size={80}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="L"
                    />
                     <p className="text-center text-xs">{siteUrl}</p>
                </div>

                <p className="text-center text-xs mt-4">Thank you for your order!</p>
            </div>
        </div>
    );
});

OrderReceipt.displayName = 'OrderReceipt';
export default OrderReceipt;
