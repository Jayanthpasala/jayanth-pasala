
import React, { useState, useMemo, useCallback } from 'react';
import { UserRole, MenuItem, CartItem, BillSettings, SaleRecord, PaymentMethod, OrderStatus, UserSession } from './types';
import { INITIAL_MENU, DEFAULT_SETTINGS, OWNER_EMAIL } from './constants';
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
  const [session, setSession] = useState<UserSession | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<string>('Order Menu');
  const [inventory, setInventory] = useState<MenuItem[]>(INITIAL_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<BillSettings>(DEFAULT_SETTINGS);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [openingCash, setOpeningCash] = useState<number>(1000);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.toLowerCase().trim();
    
    if (email === OWNER_EMAIL.toLowerCase()) {
      setSession({ email, role: UserRole.ADMIN, name: 'Owner' });
      setLoginError('');
    } else {
      const worker = settings.workerAccounts.find(w => w.email.toLowerCase() === email);
      if (worker) {
        setSession({ email, role: UserRole.WORKER, name: worker.name });
        setLoginError('');
      } else {
        setLoginError('Invalid Email ID. Please contact Admin.');
      }
    }
  };

  const handleLogout = () => {
    setSession(null);
    setLoginEmail('');
    setCart([]);
  };

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
    setActiveTab('Token Monitor');
  }, [cart, sales]);

  const updateTokenStatus = useCallback((saleId: string, newStatus: OrderStatus) => {
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: newStatus } : s));
  }, []);

  const tabs = useMemo(() => {
    if (!session) return [];
    const workerTabs = ['Order Menu', 'Token Monitor'];
    const adminTabs = ['Bill Management', 'Manage Items', 'Bill Settings', 'Sales Report'];
    return session.role === UserRole.ADMIN ? [...workerTabs, ...adminTabs] : workerTabs;
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center p-3 shadow-2xl border-4 border-yellow-500">
              <img 
                src="https://raw.githubusercontent.com/ant-design/ant-design-icons/master/packages/icons-svg/svg/filled/coffee.svg" 
                alt="Logo" 
                className="w-full h-full object-contain"
                style={{ filter: 'sepia(1) saturate(5) hue-rotate(340deg)' }}
              />
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">KAPI COAST</h1>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Employee Portal Login</p>
          </div>

          <form onSubmit={handleLogin} className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Email Identifier</label>
              <input 
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="enter your@email.com"
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-yellow-500 transition-all text-lg"
              />
              {loginError && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{loginError}</p>}
            </div>

            <button 
              type="submit"
              className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-lg hover:bg-yellow-400 active:scale-95 transition-all shadow-xl shadow-yellow-500/10"
            >
              Enter Dashboard
            </button>
          </form>

          <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest">
            KAPI COAST POS v3.0 &bull; SECURE SESSION
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950 font-sans selection:bg-yellow-500 text-zinc-100">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 border border-zinc-700">
            <img 
              src="https://raw.githubusercontent.com/ant-design/ant-design-icons/master/packages/icons-svg/svg/filled/coffee.svg" 
              className="w-full h-full"
              style={{ filter: 'sepia(1) saturate(5) hue-rotate(340deg)' }}
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tighter text-white uppercase leading-none">{settings.stallName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${session.role === UserRole.ADMIN ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                {session.name} ({session.role === UserRole.ADMIN ? 'ADMIN' : 'MANAGER'})
              </span>
            </div>
          </div>
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
            </button>
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-zinc-800 hover:bg-red-500/10 hover:text-red-500 text-zinc-400 rounded-xl text-xs font-black uppercase tracking-widest border border-zinc-700 transition-all"
        >
          Logout
        </button>
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
          {activeTab === 'Token Monitor' && <OrderMonitor sales={sales} onUpdateStatus={updateTokenStatus} />}
          {activeTab === 'Bill Management' && <BillManagement sales={sales} setSales={setSales} settings={settings} />}
          {activeTab === 'Manage Items' && <ManageItems items={inventory} setItems={setInventory} />}
          {activeTab === 'Bill Settings' && (
            <BillSettingsView 
              settings={settings} 
              setSettings={setSettings} 
              openingCash={openingCash} 
              setOpeningCash={setOpeningCash} 
            />
          )}
          {activeTab === 'Sales Report' && <SalesReport sales={sales} openingCash={openingCash} onUpdateOpeningCash={setOpeningCash} />}
        </div>
      </main>
    </div>
  );
};

export default App;
