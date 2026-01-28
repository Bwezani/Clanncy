'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

const steps: OrderStatus[] = ['Pending', 'Confirmed', 'Delivered'];

const OrderStatusProgress = ({ currentStatus }: { currentStatus: OrderStatus }) => {
    const currentIndex = steps.indexOf(currentStatus);

    return (
        <div className="flex items-start w-full px-2">
            {steps.map((step, index) => (
                <React.Fragment key={step}>
                    <div className="flex flex-col items-center text-center" style={{ flexBasis: '25%' }}>
                        <div
                            className={cn(
                                'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-500',
                                index <= currentIndex
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'bg-card border-border text-muted-foreground'
                            )}
                        >
                            {index < currentIndex ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <span className="font-bold text-sm">{index + 1}</span>
                            )}
                        </div>
                        <p
                            className={cn(
                                'mt-2 text-xs font-medium transition-colors duration-500',
                                index <= currentIndex ? 'text-primary' : 'text-muted-foreground'
                            )}
                        >
                            {step}
                        </p>
                    </div>
                    {index < steps.length - 1 && (
                        <div className="flex-1 mt-4 h-1 relative" style={{ flexBasis: '25%' }}>
                            <div className="h-full bg-border rounded-full" />
                            <div
                                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: index < currentIndex ? '100%' : '0%' }}
                            />
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default OrderStatusProgress;
