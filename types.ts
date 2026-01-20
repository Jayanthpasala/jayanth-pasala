
export enum UserRole {
  ADMIN = 'ADMIN',
  WORKER = 'WORKER'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  SERVED = 'SERVED',
  VOIDED = 'VOIDED'
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
  instructions?: string;
}

export interface BillSettings {
  stallName: string;
  footerMessage: string;
  taxRate: number; // percentage
}

export interface SaleRecord {
  id: string;
  tokenNumber: number;
  timestamp: number;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  cashChange?: number;
  status: OrderStatus;
}
