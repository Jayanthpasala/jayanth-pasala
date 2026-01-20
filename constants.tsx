
import { MenuItem, BillSettings } from './types';

export const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Classic Burger', price: 85, category: 'Food' },
  { id: '2', name: 'Cheese Fries', price: 40, category: 'Sides' },
  { id: '3', name: 'Hot Dog', price: 50, category: 'Food' },
  { id: '4', name: 'Iced Tea', price: 25, category: 'Drinks' },
  { id: '5', name: 'Lemonade', price: 30, category: 'Drinks' },
  { id: '6', name: 'Tacos (3pcs)', price: 90, category: 'Food' },
];

export const DEFAULT_SETTINGS: BillSettings = {
  stallName: 'KC HIGH',
  footerMessage: 'Thank you for eating with us! Visit again.',
  taxRate: 5
};
