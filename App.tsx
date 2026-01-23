
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Gun from 'gun';
import 'gun/lib/then';
import 'gun/lib/open';
import { UserRole, MenuItem, CartItem, BillSettings, SaleRecord, PaymentMethod, OrderStatus, UserSession, PrinterStatus } from './types';
import { INITIAL_MENU, DEFAULT_SETTINGS, OWNER_EMAIL } from './constants';
import OrderMenu from './components/OrderMenu';
import ManageItems from './components/ManageItems';
import BillSettingsView from './components/BillSettings';
import SalesReport from './components/SalesReport';
import BillManagement from './components/BillManagement';
import OrderMonitor from './components/OrderMonitor';

/**
 * ENHANCED RELAY MESH
 * Using a broader set of public relays to bypass local network restrictions.
 */
const gun = Gun({
  peers: [
    'https://gun-manhattan.herokuapp.com/gun',
    'https://relay.peer.ooo/gun',
    'https://gun-us.herokuapp.com/gun',
    'https://peer.wall.gl/gun'
  ],
  localStorage: true // Enable local storage backup for Gun
});

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  // Printer & Device Identity
  const activeDeviceRef = useRef<any>(null);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(PrinterStatus.OFFLINE);
  const [connectedPrinterName, setConnectedPrinterName] = useState<string>('RETSOL READY');

  const [terminalName, setTerminalName] = useState(() => {
    const saved = localStorage.getItem('kapi_terminal_name');
    if (saved) return saved;
    const randomId = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `TERM-${randomId}`;
  });

  const [activeTab, setActiveTab] = useState<string>('Order Menu');
  const [inventory, setInventory] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('kapi_inventory');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<BillSettings>(() => {
    const saved = localStorage.getItem('kapi_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  // Sales state managed as a record for fast O(1) merging during sync
  const [salesMap, setSalesMap] = useState<Record<string, SaleRecord>>({});
  const [openingCash, setOpeningCash] = useState<number>(1000);

  // Derived sorted sales array for components
  const sales = useMemo(() => 
    Object.values(salesMap).sort((a, b) => a.timestamp - b.timestamp),
  [salesMap]);

  const navigationTabs = useMemo(() => {
    if (!session) return [];
    const base = ['Order Menu', 'Token Monitor'];
    const admin = ['Bill Management', 'Manage Items', 'Bill Settings', 'Sales Report'];
    return session.role === UserRole.ADMIN ? [...base, ...admin] : base;
  }, [session]);

  const syncChannel = useMemo(() => 
    `kapi_v7_${settings.stallName.trim().replace(/\s+/g, '_').toLowerCase()}`, 
    [settings.stallName]
  );

  /**
   * ESC/POS PRINTER COMMANDS (RETSOL COMPATIBLE)
   */
  const executePhysicalPrint = useCallback(async (sale: SaleRecord) => {
    if (!settings.printerEnabled || !activeDeviceRef.current) return;
    const device = activeDeviceRef.current;
    
    const encode = (s: SaleRecord) => {
      const enc = new TextEncoder();
      const esc = {
        init: [0x1b, 0x40],
        center: [0x1b, 0x61, 0x01],
        left: [0x1b, 0x61, 0x00],
        bold: [0x1b, 0x45, 0x01],
        normal: [0x1b, 0x45, 0x00],
        big: [0x1d, 0x21, 0x11],
        std: [0x1d, 0x21, 0x00],
        cut: [0x1d, 0x56, 0x41, 0x00]
      };

      const chunks: Uint8Array[] = [
        new Uint8Array(esc.init),
        new Uint8Array(esc.center),
        new Uint8Array(esc.bold),
        enc.encode(`${settings.stallName.toUpperCase()}\n`),
        new Uint8Array(esc.normal),
        enc.encode(`${new Date(s.timestamp).toLocaleDateString()} ${new Date(s.timestamp).toLocaleTimeString()}\n`),
        enc.encode(`--------------------------------\n`),
        enc.encode(`TOKEN NUMBER\n`),
        new Uint8Array(esc.big),
        enc.encode(`#${s.tokenNumber}\n`),
        new Uint8Array(esc.std),
        enc.encode(`--------------------------------\n`),
        new Uint8Array(esc.left)
      ];

      s.items.forEach(i => {
        chunks.push(enc.encode(`${i.quantity}x ${i.name.padEnd(18).substring(0,18)} Rs.${(i.price * i.quantity).toFixed(0)}\n`));
      });

      chunks.push(new Uint8Array(esc.center));
      chunks.push(enc.encode(`--------------------------------\n`));
      chunks.push(new Uint8Array(esc.bold), enc.encode(`TOTAL: Rs.${s.total.toFixed(0)}\n`), new Uint8Array(esc.normal));
      chunks.push(enc.encode(`${settings.footerMessage}\n\n\n\n`));
      chunks.push(new Uint8Array(esc.cut));
      
      const totalLen = chunks.reduce((a, b) => a + b.length, 0);
      const res = new Uint8Array(totalLen);
      let offset = 0;
      chunks.forEach(c => { res.set(c, offset); offset += c.length; });
      return res;
    };

    try {
      const data = encode(sale);
      if (device.gatt) {
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
        await characteristic.writeValue(data);
      } else if (device.transferOut) {
        if (!device.opened) await device.open();
        await device.selectConfiguration(1);
        await device.claimInterface(0);
        await device.transferOut(1, data);
      }
    } catch (e) { console.error("Print Failed:", e); }
  }, [settings]);

  /**
   * MASTER SYNC ENGINE
   * Listens for changes and performs deep merges to ensure all devices match.
   */
  useEffect(() => {
    const db = gun.get(syncChannel);
    
    // Connectivity Monitoring
    const heartbeat = setInterval(() => {
      const mesh = (gun as any)._?.opt?.mesh;
      if (mesh) setPeerCount(Object.keys(mesh).length);
    }, 4000);

    // Sync Sales (Real-time stream)
    db.get('sales').map().on((data: any, id: string) => {
      if (!data) return;
      
      try {
        const parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
        const incomingSale: SaleRecord = { ...data, items: parsedItems, id: data.id || id };

        setSalesMap(prev => {
          const existing = prev[incomingSale.id];
          // Only update if it's new OR status changed
          if (existing && existing.status === incomingSale.status) return prev;
          
          // Trigger print ONLY if this is the hub AND it's a new pending order from another terminal
          if (settings.isPrintHub && !existing && incomingSale.terminalId !== terminalName && incomingSale.status === OrderStatus.PENDING) {
             executePhysicalPrint(incomingSale);
          }

          return { ...prev, [incomingSale.id]: incomingSale };
        });
      } catch (e) { /* corrupted chunk, skip */ }
    });

    // Sync Inventory & Settings
    db.get('inventory').on((val: any) => val && setInventory(JSON.parse(val)));
    db.get('settings').on((val: any) => {
      if (val) {
        const parsed = JSON.parse(val);
        // Only update local settings if name changed (to keep channel alignment)
        setSettings(prev => ({ ...prev, ...parsed, isPrintHub: prev.isPrintHub }));
      }
    });

    return () => {
      clearInterval(heartbeat);
      db.get('sales').off();
      db.get('inventory').off();
      db.get('settings').off();
    };
  }, [syncChannel, settings.isPrintHub, terminalName, executePhysicalPrint]);

  const broadcastSale = (sale: SaleRecord) => {
    gun.get(syncChannel).get('sales').get(sale.id).put({
      ...sale,
      items: JSON.stringify(sale.items)
    });
  };

  const updateSaleStatus = (id: string, status: OrderStatus) => {
    // Optimistic local update
    setSalesMap(prev => prev[id] ? { ...prev, [id]: { ...prev[id], status } } : prev);
    // Cloud sync
    gun.get(syncChannel).get('sales').get(id).get('status').put(status);
  };

  const completeSale = useCallback((total: number, paymentMethod: PaymentMethod, cashDetails?: { received: number, change: number }) => {
    if (!session) return;
    
    const nextToken = sales.length > 0 ? (sales[sales.length - 1].tokenNumber % 999) + 1 : 1;
    const record: SaleRecord = {
      id: `KC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      tokenNumber: nextToken,
      timestamp: Date.now(),
      items: [...cart],
      total,
      paymentMethod,
      cashReceived: cashDetails?.received,
      cashChange: cashDetails?.change,
      status: OrderStatus.PENDING,
      settledBy: session.name,
      terminalId: terminalName
    };
    
    // Update local immediately (Heart of the app)
    setSalesMap(prev => ({ ...prev, [record.id]: record }));
    
    // Broadcast to other phones
    broadcastSale(record);

    // Print if this is the Hub
    if (settings.isPrintHub) executePhysicalPrint(record);

    setCart([]);
    setActiveTab('Token Monitor');
  }, [cart, sales, session, settings, terminalName, executePhysicalPrint]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#090909] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-2xl rotate-6">
              <span className="text-4xl font-black text-black">KC</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Kapi Coast POS</h1>
            <div className="inline-flex items-center gap-3 bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-800">
               <div className={`w-2 h-2 rounded-full ${peerCount > 0 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                 {peerCount > 0 ? `Synced with ${peerCount} Devices` : 'Mesh: Connecting...'}
               </span>
            </div>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const email = loginEmail.toLowerCase().trim();
            if (email === OWNER_EMAIL.toLowerCase()) setSession({ email, role: UserRole.ADMIN, name: 'Owner' });
            else {
              const worker = settings.workerAccounts.find(w => w.email.toLowerCase() === email);
              if (worker) setSession({ email, role: UserRole.WORKER, name: worker.name });
              else setLoginError('Invalid Staff Credentials.');
            }
          }} className="bg-[#141414] p-10 rounded-[3rem] border border-zinc-800 shadow-2xl space-y-8">
            <input 
              type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Staff Email"
              className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none font-bold"
            />
            {loginError && <p className="text-red-500 text-[10px] font-black uppercase text-center">{loginError}</p>}
            <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-sm active:scale-95 shadow-xl">Join Network</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#090909] text-zinc-100 overflow-hidden relative font-sans">
      <header className="bg-[#0f0f0f] border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tight uppercase leading-none">{settings.stallName}</h1>
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Multi-Sync Channel v7.0</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-4 px-5 py-2.5 rounded-2xl border transition-all ${settings.isPrintHub ? 'bg-blue-500/10 border-blue-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
            <div className="flex flex-col items-end">
               <span className={`text-[8px] font-black uppercase leading-none mb-1 ${settings.isPrintHub ? 'text-blue-400' : 'text-zinc-500'}`}>
                 {settings.isPrintHub ? 'HUB TERMINAL' : 'NODE TERMINAL'}
               </span>
               <div className="flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${peerCount > 0 ? 'bg-green-500 shadow-[0_0_5px_green]' : 'bg-red-500 animate-pulse'}`}></div>
                 <span className="text-[10px] font-black text-white">{terminalName}</span>
               </div>
            </div>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
      <aside className={`fixed top-0 left-0 h-full w-[300px] bg-[#111] border-r border-zinc-800 z-[110] transition-transform duration-500 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 border-b border-zinc-800 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-black text-2xl shadow-2xl">KC</div>
          <div className="text-center">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Network Connected</p>
            <p className="text-[10px] font-black text-green-500 uppercase">{peerCount} Peers Online</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navigationTabs.map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }} className={`w-full text-left px-8 py-5 rounded-2xl text-[11px] font-black uppercase transition-all ${activeTab === tab ? 'bg-yellow-500 text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-zinc-800">
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">Disconnect Terminal</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'Order Menu' && <OrderMenu items={inventory} onAdd={item => setCart([...cart, {...item, quantity: 1}])} cart={cart} onRemoveFromCart={id => setCart(cart.filter(i => i.id !== id))} onUpdateCartQty={(id, delta) => setCart(cart.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + delta)} : i))} onCompleteSale={completeSale} settings={settings} nextTokenNumber={sales.length > 0 ? (sales[sales.length - 1].tokenNumber % 999) + 1 : 1} printerStatus={printerStatus} connectedPrinterName={connectedPrinterName} />}
          {activeTab === 'Token Monitor' && <OrderMonitor sales={sales} onUpdateStatus={updateSaleStatus} />}
          {activeTab === 'Bill Management' && <BillManagement sales={sales} setSales={() => {}} settings={settings} />}
          {activeTab === 'Manage Items' && <ManageItems items={inventory} setItems={(val) => {
            const nextInv = typeof val === 'function' ? val(inventory) : val;
            setInventory(nextInv);
            gun.get(syncChannel).get('inventory').put(JSON.stringify(nextInv));
          }} />}
          {activeTab === 'Bill Settings' && <BillSettingsView settings={settings} setSettings={(val) => {
            setSettings(val);
            gun.get(syncChannel).get('settings').put(JSON.stringify(val));
          }} openingCash={openingCash} setOpeningCash={setOpeningCash} connectedPrinterName={connectedPrinterName} printerStatus={printerStatus} currentTerminalName={terminalName} onUpdateTerminalName={setTerminalName} onUpdatePrinter={(d, n, s) => {
            activeDeviceRef.current = d;
            setConnectedPrinterName(n);
            setPrinterStatus(s);
          }} />}
          {activeTab === 'Sales Report' && <SalesReport sales={sales} openingCash={openingCash} onUpdateOpeningCash={setOpeningCash} />}
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-zinc-800 w-full max-w-sm rounded-[3rem] p-10 text-center space-y-8 shadow-2xl">
            <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Exit Network?</h3>
            <p className="text-zinc-500 text-xs font-black uppercase">Local data is synced. Other phones will remain active.</p>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => { setSession(null); setShowLogoutConfirm(false); }} className="w-full bg-red-500 text-white py-5 rounded-2xl font-black uppercase text-sm active:scale-95 shadow-xl transition-all">Yes, Disconnect</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black uppercase text-xs hover:text-white transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
