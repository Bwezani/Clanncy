
import type { Timestamp } from 'firebase/firestore';
import type { OrderInput } from './schema';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';

export type UserRole = 'admin' | 'assistant' | 'customer';

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
  // Add full order details for receipt
  fullOrder: FirestoreOrder;
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
  fullOrder: FirestoreOrder;
}

export interface FirestoreOrder {
  id: string;
  createdAt: Timestamp;
  status: OrderStatus;
  chickenType: 'whole' | 'pieces';
  piecesType?: 'mixed' | 'custom';
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
    isBounceAnimationEnabled?: boolean;
    formLayout?: 'continuous' | 'stacked';
    wholeChickenImageUrl?: string;
    piecesImageUrl?: string;
}

export interface DeliverySettings {
    nextDeliveryDate?: Date;
    totalSlots: number;
    disableWhenSlotsFull: boolean;
    slotsFullMessage: string;
    isSlotsEnabled: boolean;
}

export interface GoalsSettings {
    salesTarget: number;
    reservationsTarget: number;
    devicesTarget: number;
    startDate?: Date;
    endDate?: Date;
}

export type FirestoreUser = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Timestamp;
};

export type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type DeliveryRecord = {
  id: string; // This will be the deviceId
  name: string;
  phone: string;
  deliveryLocationType: 'school' | 'off-campus';
  school?: string;
  block?: string;
  room?: string;
  area?: string;
  street?: string;
  houseNumber?: string;
  lastActionAt: Date;
  formattedLastActionAt: string;
};

export type FirestoreDeliveryRecord = {
  name: string;
  phone: string;
  deliveryLocationType: 'school' | 'off-campus';
  school?: string;
  block?: string;
  room?: string;
  area?: string;
  street?: string;
  houseNumber?: string;
  lastActionAt: Timestamp;
};
