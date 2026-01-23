
import { MenuItem, BillSettings } from './types';

export const OWNER_EMAIL = "jayanthpasala10@gmail.com"; 

export const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Classic Burger', price: 85, category: 'Food', isAvailable: true },
  { id: '2', name: 'Cheese Fries', price: 40, category: 'Sides', isAvailable: true },
  { id: '3', name: 'Hot Dog', price: 50, category: 'Food', isAvailable: true },
  { id: '4', name: 'Iced Tea', price: 25, category: 'Drinks', isAvailable: true },
  { id: '5', name: 'Lemonade', price: 30, category: 'Drinks', isAvailable: true },
  { id: '6', name: 'Tacos (3pcs)', price: 90, category: 'Food', isAvailable: true },
];

export const DEFAULT_SETTINGS: BillSettings = {
  stallName: 'KAPI COAST',
  footerMessage: 'Thank you for eating with us! Visit again.',
  taxRate: 5,
  workerAccounts: [
    { email: 'worker1@kapi.com', name: 'Staff A' }
  ],
  printerEnabled: true,
  isPrintHub: false
};
