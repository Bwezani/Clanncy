
import type { Timestamp } from 'firebase/firestore';

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
  fullOrder: FirestoreOrder;
};

export type AdminOrder = {
  id: string;
  date: Date;
  formattedDate: string;
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
  productType: 'chicken' | 'generic';
  chickenType?: 'whole' | 'pieces';
  piecesType?: 'mixed' | 'custom';
  pieceDetails?: PieceDetails;
  productId?: string;
  productName?: string;
  variationName?: string;
  optionName?: string;
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

export type AdminDevice = {
    id: string;
    createdAt: Date;
    formattedCreatedAt: string;
    formattedLastSeenAt: string;
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
    profit_whole?: number;
    profit_mixedPiece?: number;
    profit_breasts?: number;
    profit_thighs?: number;
    profit_drumsticks?: number;
    profit_wings?: number;
}

export interface ContactSettings {
    callNumber: string;
    whatsappNumber: string;
}

export interface HomepageSettings {
    // New Homepage (Storefront)
    storefrontTitle: string;
    storefrontSubtitle: string;
    
    // Old Homepage Header (now Chicken/Order Form Header)
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

export type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type DeliveryRecord = {
  id: string;
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

export interface FirestoreExpense {
  description: string;
  amount: number;
  category: string;
  expenseType: 'capital' | 'operational';
  createdAt: Timestamp;
}

export interface AdminExpense extends Omit<FirestoreExpense, 'createdAt'> {
  id: string;
  createdAt: Date;
  formattedDate: string;
}

export interface ProductOption {
  name: string;
  price: number;
  profit: number;
}

export interface ProductVariation {
  name: string;
  options: ProductOption[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  productType: 'chicken' | 'generic';
  variations?: ProductVariation[];
  isActive: boolean;
  displayOrder: number;
  createdAt?: Date;
}

export interface FirestoreProduct extends Omit<Product, 'id' | 'createdAt'> {
  createdAt: Timestamp;
}
