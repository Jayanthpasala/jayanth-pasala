// Unified types for the Kapi Coast POS application

export enum OrderStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  SERVED = 'SERVED',
  VOIDED = 'VOIDED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI'
}

export enum PrinterStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  isAvailable?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  instructions?: string;
}

export interface BillSettings {
  stallName: string;
  taxRate: number;
  printerEnabled?: boolean;
}

export interface SaleRecord {
  id: string;
  tokenNumber: number;
  timestamp: number;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  settledBy?: string;
  cashReceived?: number;
  cashChange?: number;
}
