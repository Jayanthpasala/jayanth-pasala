import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { UserRole, MenuItem, CartItem, BillSettings, SaleRecord, PaymentMethod, OrderStatus, UserSession, PrinterStatus } from './types.ts';
import { INITIAL_MENU, DEFAULT_SETTINGS, OWNER_EMAIL } from './constants.tsx';
import OrderMenu from './components/OrderMenu.tsx';
import ManageItems from './components/ManageItems.tsx';
import BillSettingsView from './components/BillSettings.tsx';
import SalesReport from './components/SalesReport.tsx';
import BillManagement from './components/BillManagement.tsx';
import OrderMonitor from './components/OrderMonitor.tsx';

const App: React.FC = () => {
  const [session] = useState<UserSession | null>({
    email: OWNER_EMAIL,
    role: UserRole.ADMIN,
    name: 'Owner'
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Order Menu');
  const [lastTokenCompleted, setLastTokenCompleted] = useState<number | null>(null);
  const [printQueue, setPrintQueue] = useState<SaleRecord | null>(null);
  
  // Local storage keys
  const KEYS = {
    INVENTORY: 'kapi_inventory_v1',
    SETTINGS: 'kapi_settings_v1',
    SALES: 'kapi_sales_v1',
    TERMINAL: 'kapi_terminal_name_v1',
    CASH: 'kapi_opening_cash_v1'
  };

  const [terminalName, setTerminalName] = useState(() => {
    const saved = localStorage.getItem(KEYS.TERMINAL);
    if (saved) return saved;
    const randomId = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `TERM-${randomId}`;
  });

  const [inventory, setInventory] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem(KEYS.INVENTORY);
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  const [settings, setSettings] = useState<BillSettings>(() => {
    const saved = localStorage.getItem(KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem(KEYS.SALES);
    return saved ? JSON.parse(saved) : [];
  });

  const [openingCash, setOpeningCash] = useState<number>(() => {
    const saved = localStorage.getItem(KEYS.CASH);
    return saved ? parseFloat(saved) : 1000;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(PrinterStatus.OFFLINE);
  const [connectedPrinterName, setConnectedPrinterName] = useState<string>('NO PRINTER');
  const activeDeviceRef = useRef<any>(null);

  // Persistence Effects
  useEffect(() => { localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(KEYS.SALES, JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem(KEYS.TERMINAL, terminalName); }, [terminalName]);
  useEffect(() => { localStorage.setItem(KEYS.CASH, openingCash.toString()); }, [openingCash]);

  const pushInventory = useCallback((items: MenuItem[]) => {
    setInventory(items);
  }, []);

  const pushSettings = useCallback((newSettings: BillSettings) => {
    setSettings(newSettings);
  }, []);

  const navigationTabs = useMemo(() => {
    if (!session) return [];
    const base = ['Order Menu', 'Token Monitor'];
    const admin = ['Bill Management', 'Manage Items', 'Bill Settings', 'Sales Report'];
    return session.role === UserRole.ADMIN ? [...base, ...admin] : base;
  }, [session]);

  const executePhysicalPrint = useCallback(async (sale: SaleRecord) => {
    if (!settings.printerEnabled || !activeDeviceRef.current) return;
    console.log("Printing to physical device:", sale);
  }, [settings]);

  const handleBrowserPrint = (sale: SaleRecord) => {
    setPrintQueue(sale);
    setTimeout(() => { window.print(); setPrintQueue(null); }, 150);
  };

  const updateSaleStatus = useCallback((id: string, status: OrderStatus) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  }, []);

  const completeSale = useCallback((total: number, paymentMethod: PaymentMethod, cashDetails?: { received: number, change: number }) => {
    if (!session) return;
    
    const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString());
    const nextToken = todaySales.length > 0 ? (todaySales[0].tokenNumber % 999) + 1 : 1;
    
    const saleId = `KC-${Date.now()}`;
    const record: SaleRecord = {
      id: saleId,
      tokenNumber: Number(nextToken),
      timestamp: Date.now(),
      items: cart.map(item => ({...item})),
      total: Number(total),
      paymentMethod,
      status: OrderStatus.PENDING,
      settledBy: session.name,
      terminalId: terminalName,
      ...(paymentMethod === PaymentMethod.CASH && cashDetails ? {
        cashReceived: Number(cashDetails.received),
        cashChange: Number(cashDetails.change)
      } : {})
    };

    setSales(prev => [record, ...prev]);
    setLastTokenCompleted(nextToken);
    setTimeout(() => setLastTokenCompleted(null), 2500);
    setCart([]);
    setActiveTab('Token Monitor');
    
    if (settings.isPrintHub || settings.printerEnabled) executePhysicalPrint(record);
  }, [cart, sales, session, settings, terminalName, executePhysicalPrint]);

  return (
    <div className="flex flex-col h-screen bg-[#090909] text-zinc-100 overflow-hidden relative font-sans">
      {/* Token Success Overlay */}
      <div className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-300 ${lastTokenCompleted ? 'opacity-100 backdrop-blur-md pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`} onClick={(e) => { if (e.target === e.currentTarget) setLastTokenCompleted(null); }}>
        <div className="bg-white text-black p-10 rounded-[3rem] shadow-[0_0_100px_rgba(255,255,255,0.15)] border-4 border-black flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200 w-full max-w-sm mx-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mb-1"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div>
          <div className="text-center"><span className="text-[10px] font-black uppercase tracking-widest opacity-40">Token Issued</span><div className="text-8xl font-black tracking-tighter leading-none">#{lastTokenCompleted}</div></div>
          <div className="flex flex-col gap-2 w-full mt-4">
            <button onClick={() => { setActiveTab('Order Menu'); setLastTokenCompleted(null); }} className="w-full bg-yellow-500 text-black py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-yellow-400 active:scale-95 transition-all">Next Order</button>
            <button onClick={() => { setActiveTab('Token Monitor'); setLastTokenCompleted(null); }} className="w-full bg-zinc-100 text-black py-4 rounded-2xl font-black uppercase text-xs tracking-widest border border-zinc-200 hover:bg-zinc-200 active:scale-95 transition-all">Monitor Screen</button>
          </div>
        </div>
      </div>

      <header className="bg-[#0f0f0f] border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tight uppercase leading-none">{settings.stallName}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                Local Mode
              </span>
            </div>
          </div>
        </div>
        <div className="px-5 py-2.5 rounded-2xl border bg-zinc-900 border-zinc-800">
          <div className="flex flex-col items-end">
             <span className="text-[8px] font-black uppercase leading-none mb-1 text-zinc-500">{terminalName}</span>
             <div className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${printerStatus === PrinterStatus.CONNECTED ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
               <span className="text-[10px] font-black text-white">POS TERMINAL</span>
             </div>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm transition-opacity ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
      <aside className={`fixed top-0 left-0 h-full w-[300px] bg-[#111] border-r border-zinc-800 z-[110] transition-transform duration-500 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 border-b border-zinc-800 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-black text-2xl shadow-2xl">KC</div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navigationTabs.map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }} className={`w-full text-left px-8 py-5 rounded-2xl text-[11px] font-black uppercase transition-all ${activeTab === tab ? 'bg-yellow-500 text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'Order Menu' && <OrderMenu items={inventory} onAdd={item => setCart([...cart, {...item, quantity: 1}])} cart={cart} onRemoveFromCart={id => setCart(cart.filter(i => i.id !== id))} onUpdateCartQty={(id, delta) => setCart(cart.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + delta)} : i))} onCompleteSale={completeSale} settings={settings} nextTokenNumber={sales.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString()).length + 1} printerStatus={printerStatus} connectedPrinterName={connectedPrinterName} />}
          {activeTab === 'Token Monitor' && <OrderMonitor sales={sales} onUpdateStatus={updateSaleStatus} />}
          {activeTab === 'Bill Management' && <BillManagement sales={sales} settings={settings} onReprint={handleBrowserPrint} onPhysicalPrint={executePhysicalPrint} />}
          {activeTab === 'Manage Items' && <ManageItems items={inventory} setItems={(val) => { const newInv = typeof val === 'function' ? val(inventory) : val; pushInventory(newInv); }} />}
          {activeTab === 'Bill Settings' && <BillSettingsView settings={settings} setSettings={(s) => { pushSettings(s); }} openingCash={openingCash} setOpeningCash={setOpeningCash} connectedPrinterName={connectedPrinterName} printerStatus={printerStatus} currentTerminalName={terminalName} onUpdateTerminalName={setTerminalName} onUpdatePrinter={(d, n, s) => { activeDeviceRef.current = d; setConnectedPrinterName(n); setPrinterStatus(s); }} onTestPrint={() => { executePhysicalPrint({ id: 'TEST', tokenNumber: 0, timestamp: Date.now(), items: [], total: 0, paymentMethod: PaymentMethod.CASH, status: OrderStatus.SERVED, settledBy: 'Owner' }); }} onResetData={() => { if(confirm('Wipe ALL data?')) { localStorage.clear(); window.location.reload(); } }} />}
          {activeTab === 'Sales Report' && <SalesReport sales={sales} openingCash={openingCash} onUpdateOpeningCash={setOpeningCash} />}
        </div>
      </main>
    </div>
  );
};

export default App;