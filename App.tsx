
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        setLoginError('Access denied. Please check your email or contact admin.');
      }
    }
  };

  const confirmLogout = () => {
    setSession(null);
    setLoginEmail('');
    setCart([]);
    setShowLogoutConfirm(false);
    setIsSidebarOpen(false);
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
    if (!session) return;
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
      status: OrderStatus.PENDING,
      settledBy: session.name
    };
    setSales(prev => [...prev, record]);
    setCart([]);
    setActiveTab('Token Monitor');
  }, [cart, sales, session]);

  const updateTokenStatus = useCallback((saleId: string, newStatus: OrderStatus) => {
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: newStatus } : s));
  }, []);

  const tabs = useMemo(() => {
    if (!session) return [];
    const workerTabs = ['Order Menu', 'Token Monitor'];
    const adminTabs = ['Bill Management', 'Manage Items', 'Bill Settings', 'Sales Report'];
    return session.role === UserRole.ADMIN ? [...workerTabs, ...adminTabs] : workerTabs;
  }, [session]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-6 transform rotate-3">
              <span className="text-3xl font-black text-black">KC</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Kapi Coast</h1>
            <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase mt-2">Partner & Staff Login</p>
          </div>

          <form onSubmit={handleLogin} className="bg-[#1a1a1a] p-10 rounded-[2.5rem] border border-zinc-800/50 shadow-2xl space-y-8">
            <div className="space-y-4">
              <div className="relative">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 mb-2 block">Registered Email Address</label>
                <input 
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@kapicoast.com"
                  className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all text-sm font-bold"
                />
              </div>
              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                  <p className="text-red-500 text-[10px] font-black uppercase text-center">{loginError}</p>
                </div>
              )}
            </div>

            <button 
              type="submit"
              className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-zinc-200 active:scale-95 transition-all shadow-xl"
            >
              Sign In to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#090909] text-zinc-100 overflow-hidden relative">
      
      {/* Sidebar Drawer */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/80 backdrop-blur-md transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />
      
      <aside 
        className={`fixed top-0 left-0 h-full w-[280px] bg-[#111] border-r border-zinc-800/50 z-[110] transition-transform duration-500 ease-in-out shadow-2xl flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-8 border-b border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black text-lg shadow-xl shadow-white/5">KC</div>
            <span className="font-black text-lg uppercase tracking-tighter">Navigation</span>
          </div>
          <button onClick={toggleSidebar} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="px-4 mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Main Menu</p>
          </div>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-4 ${
                activeTab === tab 
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/10' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === tab ? 'bg-black' : 'bg-zinc-800'}`}></span>
              {tab}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-zinc-800/50 space-y-4 bg-black/20">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-black text-white border border-zinc-700">
              {session.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-black uppercase text-white leading-none">{session.name}</p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{session.role}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout Session
          </button>
        </div>
      </aside>

      {/* Top Header */}
      <header className="bg-[#111] border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-black text-sm">KC</div>
            <h1 className="text-lg font-black tracking-tighter uppercase">{settings.stallName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-700 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{activeTab}</span>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{session.role} MODE</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-zinc-800 w-full max-sm:max-w-xs max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-black uppercase text-white tracking-tight">End Session?</h3>
              <p className="text-zinc-500 text-sm font-medium">Are you sure you want to log out of the POS system? Unsaved carts will be cleared.</p>
            </div>
            <div className="mt-8 space-y-3">
              <button 
                onClick={confirmLogout}
                className="w-full bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Yes, Sign Out
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:text-white transition-all"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
