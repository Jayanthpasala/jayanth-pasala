
import React, { useState, useMemo, useCallback } from 'react';
import { UserRole, MenuItem, CartItem, BillSettings, SaleRecord, PaymentMethod, OrderStatus } from './types';
import { INITIAL_MENU, DEFAULT_SETTINGS } from './constants';
import OrderMenu from './components/OrderMenu';
import ManageItems from './components/ManageItems';
import BillSettingsView from './components/BillSettings';
import SalesReport from './components/SalesReport';
import BillManagement from './components/BillManagement';
import OrderMonitor from './components/OrderMonitor';

const generateBillCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BILL-${result}`;
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [activeTab, setActiveTab] = useState<string>('Order Menu');
  const [inventory, setInventory] = useState<MenuItem[]>(INITIAL_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<BillSettings>(DEFAULT_SETTINGS);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [openingCash, setOpeningCash] = useState<number>(1000);

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, instructions: '' }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number, instructions?: string) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { 
          ...i, 
          quantity: newQty, 
          instructions: instructions !== undefined ? instructions : i.instructions 
        };
      }
      return i;
    }));
  }, []);

  const completeSale = useCallback((total: number, paymentMethod: PaymentMethod, cashDetails?: { received: number, change: number }) => {
    const nextToken = sales.length > 0 ? (sales[sales.length - 1].tokenNumber % 999) + 1 : 1;
    const record: SaleRecord = {
      id: generateBillCode(),
      tokenNumber: nextToken,
      timestamp: Date.now(),
      items: [...cart],
      total,
      paymentMethod,
      cashReceived: cashDetails?.received,
      cashChange: cashDetails?.change,
      status: OrderStatus.PENDING
    };
    setSales(prev => [...prev, record]);
    setCart([]);
    // Switch to monitor to see the new token
    setActiveTab('Token Monitor');
  }, [cart, sales]);

  const updateTokenStatus = useCallback((saleId: string, newStatus: OrderStatus) => {
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: newStatus } : s));
  }, []);

  const tabs = useMemo(() => {
    const workerTabs = ['Order Menu', 'Token Monitor'];
    const adminTabs = ['Bill Management', 'Manage Items', 'Bill Settings', 'Sales Report'];
    return role === UserRole.ADMIN ? [...workerTabs, ...adminTabs] : workerTabs;
  }, [role]);

  React.useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab('Order Menu');
    }
  }, [role, tabs, activeTab]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950 font-sans selection:bg-yellow-500 text-zinc-100">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-black font-black text-xl shadow-lg shadow-yellow-500/20">
            $
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">{settings.stallName}</h1>
        </div>

        <nav className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab 
                ? 'bg-yellow-500 text-black shadow-lg' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab}
              {tab === 'Token Monitor' && sales.filter(s => s.status === OrderStatus.PENDING || s.status === OrderStatus.READY).length > 0 && (
                <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                  {sales.filter(s => s.status === OrderStatus.PENDING || s.status === OrderStatus.READY).length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 bg-zinc-800/50 p-1 rounded-lg border border-zinc-700">
          <button 
            onClick={() => setRole(UserRole.WORKER)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${role === UserRole.WORKER ? 'bg-zinc-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            WORKER
          </button>
          <button 
            onClick={() => setRole(UserRole.ADMIN)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${role === UserRole.ADMIN ? 'bg-yellow-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            ADMIN
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-black/20">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'Order Menu' && (
            <OrderMenu 
              items={inventory} 
              onAdd={addToCart} 
              cart={cart}
              onRemoveFromCart={removeFromCart}
              onUpdateCartQty={updateQuantity}
              onCompleteSale={completeSale}
              settings={settings}
              nextTokenNumber={sales.length > 0 ? (sales[sales.length - 1].tokenNumber % 999) + 1 : 1}
            />
          )}
          {activeTab === 'Token Monitor' && (
            <OrderMonitor 
              sales={sales}
              onUpdateStatus={updateTokenStatus}
            />
          )}
          {activeTab === 'Bill Management' && (
            <BillManagement 
              sales={sales} 
              setSales={setSales}
              settings={settings}
            />
          )}
          {activeTab === 'Manage Items' && (
            <ManageItems items={inventory} setItems={setInventory} />
          )}
          {activeTab === 'Bill Settings' && (
            <BillSettingsView settings={settings} setSettings={setSettings} openingCash={openingCash} setOpeningCash={setOpeningCash} />
          )}
          {activeTab === 'Sales Report' && (
            <SalesReport sales={sales} openingCash={openingCash} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
