import type { Timestamp } from 'firebase/firestore';

export type OrderStatus = 'Ready for Pickup' | 'Delivered' | 'Pending';

export type Order = {
  id: string;
  date: string;
  items: string;
  price: number;
  status: OrderStatus;
};

export interface FirestoreOrder {
  id: string;
  createdAt: Timestamp;
  status: OrderStatus;
  chickenType: 'whole' | 'pieces';
  quantity: number;
  price: number;
  name: string;
  phone: string;
  deliveryLocationType: 'school' | 'off-campus';
  school?: string;
  block?: string;
  room?: string;
  area?: string;
  street?: string;
  houseNumber?: string;
  deviceId?: string;
  userId?: string;
}
