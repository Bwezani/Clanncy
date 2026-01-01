import type { Order } from '@/lib/types';
import { subDays, format } from 'date-fns';

export const mockOrders: Order[] = [
    { id: 'ORD001', date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), items: '1x Whole Chicken', price: 150.00, status: 'Delivered' },
    { id: 'ORD002', date: format(subDays(new Date(), 5), 'yyyy-MM-dd'), items: '6x Chicken Pieces', price: 150.00, status: 'Delivered' },
    { id: 'ORD003', date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), items: '1x Whole Chicken', price: 150.00, status: 'Pending' },
    { id: 'ORD004', date: format(new Date(), 'yyyy-MM-dd'), items: '2x Whole Chicken', price: 300.00, status: 'Ready for Pickup' },
    { id: 'ORD005', date: format(subDays(new Date(), 10), 'yyyy-MM-dd'), items: '3x Chicken Pieces', price: 75.00, status: 'Delivered' },
    { id: 'ORD006', date: format(subDays(new Date(), 15), 'yyyy-MM-dd'), items: '1x Whole Chicken', price: 150.00, status: 'Delivered' },
    { id: 'ORD007', date: format(subDays(new Date(), 4), 'yyyy-MM-dd'), items: '12x Chicken Pieces', price: 300.00, status: 'Pending' },
    { id: 'ORD008', date: format(subDays(new Date(), 22), 'yyyy-MM-dd'), items: '1x Whole Chicken', price: 150.00, status: 'Delivered' },
];
