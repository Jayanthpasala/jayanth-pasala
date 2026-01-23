
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { UserRole, MenuItem, CartItem, BillSettings, SaleRecord, PaymentMethod, OrderStatus, UserSession, PrinterStatus } from './types';
import { INITIAL_MENU, DEFAULT_SETTINGS, OWNER_EMAIL } from './constants';
import OrderMenu from './components/OrderMenu';
import ManageItems from './components/ManageItems';
import BillSettingsView from './components/BillSettings';
import SalesReport from './components/SalesReport';
import BillManagement from './components/BillManagement';
import OrderMonitor from './components/OrderMonitor';

// Sync Channel for Multi-Tab Business Operations
const syncChannel = new BroadcastChannel('kapi_coast_pos_sync');

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Persistent Terminal Identity Logic
  const [terminalName, setTerminalName] = useState(() => {
    const saved = localStorage.getItem('kapi_terminal_name');
    if (saved) return saved;
    const randomId = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `TERM-${randomId}`;
  });

  const handleUpdateTerminalName = (newName: string) => {
    const formatted = newName.toUpperCase().trim() || 'UNNAMED';
    setTerminalName(formatted);
    localStorage.setItem('kapi_terminal_name', formatted);
  };

  const [activeTab, setActiveTab] = useState<string>('Order Menu');
  const [inventory, setInventory] = useState<MenuItem[]>(INITIAL_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<BillSettings>(DEFAULT_SETTINGS);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [openingCash, setOpeningCash] = useState<number>(1000);
  
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(PrinterStatus.OFFLINE);
  const [connectedPrinterName, setConnectedPrinterName] = useState<string>('RETSOL READY');

  const handleUpdatePrinter = (name: string, status: PrinterStatus) => {
    setConnectedPrinterName(name);
    setPrinterStatus(status);
  };

  // Multi-Device / Multi-Tab Sync Logic
  useEffect(() => {
    const handleSync = (event: MessageEvent) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'UPDATE_SALES': setSales(payload); break;
        case 'UPDATE_INVENTORY': setInventory(payload); break;
        case 'UPDATE_SETTINGS': setSettings(payload); break;
        case 'UPDATE_OPENING_CASH': setOpeningCash(payload); break;
      }
    };
    syncChannel.addEventListener('message', handleSync);
    return () => syncChannel.removeEventListener('message', handleSync);
  }, []);

  const broadcastSales = (newSales: SaleRecord[]) => {
    setSales(newSales);
    syncChannel.postMessage({ type: 'UPDATE_SALES', payload: newSales });
  };

  const broadcastInventory = (newInventory: MenuItem[]) => {
    setInventory(newInventory);
    syncChannel.postMessage({ type: 'UPDATE_INVENTORY', payload: newInventory });
  };

  const broadcastSettings = (newSettings: BillSettings) => {
    setSettings(newSettings);
    syncChannel.postMessage({ type: 'UPDATE_SETTINGS', payload: newSettings });
  };

  const broadcastOpeningCash = (val: number) => {
    setOpeningCash(val);
    syncChannel.postMessage({ type: 'UPDATE_OPENING_CASH', payload: val });
  };

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
        setLoginError('Access denied. Please check your email.');
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
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1, instructions: '' }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => setCart(prev => prev.filter(i => i.id !== id)), []);

  const updateQuantity = useCallback((id: string, delta: number, instructions?: string) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty, instructions: instructions !== undefined ? instructions : i.instructions };
      }
      return i;
    }));
  }, []);

  const completeSale = useCallback((total: number, paymentMethod: PaymentMethod, cashDetails?: { received: number, change: number }) => {
    if (!session) return;
    const nextToken = sales.length > 0 ? (sales[sales.length - 1].tokenNumber % 999) + 1 : 1;
    const record: SaleRecord = {
      id: `BILL-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
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
    broadcastSales([...sales, record]);
    setCart([]);
    setActiveTab('Token Monitor');
  }, [cart, sales, session]);

  const updateTokenStatus = useCallback((saleId: string, newStatus: OrderStatus) => {
    broadcastSales(sales.map(s => s.id === saleId ? { ...s, status: newStatus } : s));
  }, [sales]);

  const tabs = useMemo(() => {
    if (!session) return [];
    const workerTabs = ['Order Menu', 'Token Monitor'];
    const adminTabs = ['Bill Management', 'Manage Items', 'Bill Settings', 'Sales Report'];
    return session.role === UserRole.ADMIN ? [...workerTabs, ...adminTabs] : workerTabs;
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-xl mb-6 transform rotate-3">
              <span className="text-3xl font-black text-black">KC</span>
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Kapi Coast</h1>
            <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase mt-2">Login to {terminalName}</p>
          </div>
          <form onSubmit={handleLogin} className="bg-[#1a1a1a] p-10 rounded-[2.5rem] border border-zinc-800 shadow-2xl space-y-8">
            <div className="space-y-4">
              <div className="relative">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 mb-2 block">Staff Email</label>
                <input 
                  type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@kapicoast.com"
                  className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 text-sm font-bold"
                />
              </div>
              {loginError && <p className="text-red-500 text-[10px] font-black uppercase text-center">{loginError}</p>}
            </div>
            <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-sm hover:bg-zinc-200 shadow-xl transition-all">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#090909] text-zinc-100 overflow-hidden relative">
      <header className="bg-[#111] border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-black text-sm">KC</div>
            <h1 className="text-lg font-black tracking-tighter uppercase">{settings.stallName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-zinc-800/30 px-4 py-2 rounded-xl border border-zinc-800">
             <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">ID:</span>
             <span className="text-[10px] font-black text-yellow-500">{terminalName}</span>
          </div>
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 ${settings.printerEnabled && printerStatus === PrinterStatus.CONNECTED ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-800 border-zinc-700 opacity-50'}`}>
            <svg className={`w-3 h-3 ${settings.printerEnabled && printerStatus === PrinterStatus.CONNECTED ? 'text-green-500 animate-pulse' : 'text-zinc-600'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.5-7.5 7.5 7.5" opacity=".3"/>
              <path d="M4.93 4.93c-3.9 3.9-3.9 10.24 0 14.14l1.41-1.41c-3.12-3.12-3.12-8.19 0-11.31L4.93 4.93zm14.14 0l-1.41 1.41c3.12 3.12 3.12 8.19 0 11.31l1.41 1.41c3.9-3.9 3.9-10.24 0-14.14zM7.76 7.76c-2.34 2.34-2.34 6.14 0 8.48l1.41-1.41c-1.56-1.56-1.56-4.09 0-5.66L7.76 7.76zm8.48 0l-1.41 1.41c1.56 1.56 1.56-4.09 0-5.66l1.41 1.41c2.34-2.34 2.34-6.14 0-8.48zM12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            <span className={`text-[9px] font-black uppercase tracking-widest ${settings.printerEnabled && printerStatus === PrinterStatus.CONNECTED ? 'text-green-500' : 'text-zinc-600'}`}>
              {settings.printerEnabled ? connectedPrinterName : 'PRINTER OFF'}
            </span>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-[100] bg-black/80 backdrop-blur-md transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
      <aside className={`fixed top-0 left-0 h-full w-[280px] bg-[#111] border-r border-zinc-800/50 z-[110] transition-transform duration-500 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black text-lg">KC</div>
            <span className="font-black text-lg uppercase tracking-tighter">POS MENU</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {tabs.map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }} className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-4 ${activeTab === tab ? 'bg-yellow-500 text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
              <span className={`w-2 h-2 rounded-full ${activeTab === tab ? 'bg-black' : 'bg-zinc-800'}`} />
              {tab}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-zinc-800/50 bg-black/20">
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'Order Menu' && <OrderMenu items={inventory} onAdd={addToCart} cart={cart} onRemoveFromCart={removeFromCart} onUpdateCartQty={updateQuantity} onCompleteSale={completeSale} settings={settings} nextTokenNumber={sales.length > 0 ? (sales[sales.length - 1].tokenNumber % 999) + 1 : 1} printerStatus={printerStatus} connectedPrinterName={connectedPrinterName} />}
          {activeTab === 'Token Monitor' && <OrderMonitor sales={sales} onUpdateStatus={updateTokenStatus} />}
          {activeTab === 'Bill Management' && <BillManagement sales={sales} setSales={broadcastSales} settings={settings} />}
          {activeTab === 'Manage Items' && <ManageItems items={inventory} setItems={broadcastInventory} />}
          {activeTab === 'Bill Settings' && <BillSettingsView settings={settings} setSettings={broadcastSettings} openingCash={openingCash} setOpeningCash={broadcastOpeningCash} connectedPrinterName={connectedPrinterName} printerStatus={printerStatus} currentTerminalName={terminalName} onUpdateTerminalName={handleUpdateTerminalName} onUpdatePrinter={handleUpdatePrinter} />}
          {activeTab === 'Sales Report' && <SalesReport sales={sales} openingCash={openingCash} onUpdateOpeningCash={broadcastOpeningCash} />}
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-zinc-800 w-full max-sm:max-w-xs max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-xl font-black uppercase text-white text-center">Logout?</h3>
            <div className="mt-8 space-y-3">
              <button onClick={confirmLogout} className="w-full bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-xs">Yes, End Session</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black uppercase text-xs">Stay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
