
import type { Timestamp } from 'firebase/firestore';

export type OrderStatus = 'Ready for Pickup' | 'Delivered' | 'Pending';

export type PieceDetails = {
  breasts: number;
  thighs: number;
  drumsticks: number;
  wings: number;
}

export type Order = {
  id: string;
  date: string;
  items: string;
  price: number;
  status: OrderStatus;
};

// Type for data used within the Admin Dashboard context
export type AdminOrder = {
  id: string;
  date: Date; // Raw Date object for charting
  formattedDate: string; // Formatted string for display
  items: string;
  price: number;
  status: OrderStatus;
  name: string;
  phone: string;
  deliveryLocationType: 'school' | 'off-campus';
  school?: string;
  block?: string;
  room?: string;
  area?: string;
  street?: string;
  houseNumber?: string;
}

export interface FirestoreOrder {
  id: string;
  createdAt: Timestamp;
  status: OrderStatus;
  chickenType: 'whole' | 'pieces';
  quantity: number;
  price: number;
  pieceDetails?: PieceDetails;
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

// Type for data used in the public Device list in Admin
export type Device = {
    id: string;
    createdAt: string;
    lastSeenAt: string;
    userAgent: string;
}

// Type for data used within the Admin Dashboard context
export type AdminDevice = {
    id: string;
    createdAt: Date; // Raw Date object for charting
    formattedCreatedAt: string; // Formatted string for display
    formattedLastSeenAt: string; // Formatted string for display
    userAgent: string;
}


export interface FirestoreDevice {
    createdAt: Timestamp;
    lastSeenAt: Timestamp;
    userAgent: string;
}

export interface Prices {
    whole: number;
    mixedPiece: number;
    isChoosePiecesEnabled: boolean;
    pieces: PieceDetails;
}

export interface ContactSettings {
    callNumber: string;
    whatsappNumber: string;
}

export interface HomepageSettings {
    title: string;
    subtitle: string;
}
    
