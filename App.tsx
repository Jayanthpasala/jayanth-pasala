
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { UserRole, MenuItem, CartItem, BillSettings, SaleRecord, PaymentMethod, OrderStatus, UserSession, PrinterStatus } from './types';
import { INITIAL_MENU, DEFAULT_SETTINGS, OWNER_EMAIL } from './constants';
import OrderMenu from './components/OrderMenu';
import ManageItems from './components/ManageItems';
import BillSettingsView from './components/BillSettings';
import SalesReport from './components/SalesReport';
import BillManagement from './components/BillManagement';
import OrderMonitor from './components/OrderMonitor';

const networkSync = new BroadcastChannel('kapi_coast_cloud_sync');

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Printer Device References (kept out of state to prevent re-renders on hardware activity)
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
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('kapi_sales');
    return saved ? JSON.parse(saved) : [];
  });
  const [openingCash, setOpeningCash] = useState<number>(1000);

  // ESC/POS Encoder for Retsol 82 UB
  const encodeReceipt = (sale: SaleRecord) => {
    const encoder = new TextEncoder();
    const esc = {
      init: [0x1b, 0x40],
      center: [0x1b, 0x61, 0x01],
      left: [0x1b, 0x61, 0x00],
      boldOn: [0x1b, 0x45, 0x01],
      boldOff: [0x1b, 0x45, 0x00],
      bigOn: [0x1d, 0x21, 0x11],
      bigOff: [0x1d, 0x21, 0x00],
      feed: [0x1b, 0x64, 0x05],
      cut: [0x1d, 0x56, 0x41, 0x00]
    };

    let chunks: Uint8Array[] = [];
    const addText = (text: string) => chunks.push(encoder.encode(text + '\n'));
    const addCommand = (cmd: number[]) => chunks.push(new Uint8Array(cmd));

    addCommand(esc.init);
    addCommand(esc.center);
    addCommand(esc.boldOn);
    addText(settings.stallName.toUpperCase());
    addCommand(esc.boldOff);
    addText("--------------------------------");
    addText("TOKEN NUMBER");
    addCommand(esc.bigOn);
    addText(`#${sale.tokenNumber}`);
    addCommand(esc.bigOff);
    addText(new Date(sale.timestamp).toLocaleString());
    addText("--------------------------------");
    addCommand(esc.left);
    
    sale.items.forEach(item => {
      const line = `${item.quantity}x ${item.name.substring(0, 20)}`.padEnd(24) + `₹${(item.price * item.quantity).toFixed(0)}`.padStart(8);
      addText(line);
      if (item.instructions) addText(` * ${item.instructions}`);
    });

    addText("--------------------------------");
    addCommand(esc.boldOn);
    addText(`TOTAL PAID: ₹${sale.total.toFixed(0)}`.padStart(32));
    addCommand(esc.boldOff);
    addText(`MODE: ${sale.paymentMethod}`);
    addText("--------------------------------");
    addCommand(esc.center);
    addText(settings.footerMessage);
    addCommand(esc.feed);
    addCommand(esc.cut);

    // Combine all chunks
    let totalLength = chunks.reduce((acc, curr) => acc + curr.length, 0);
    let result = new Uint8Array(totalLength);
    let offset = 0;
    for (let chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  };

  const handleUpdatePrinter = (device: any, name: string, status: PrinterStatus) => {
    activeDeviceRef.current = device;
    setConnectedPrinterName(name);
    setPrinterStatus(status);
  };

  const executePhysicalPrint = useCallback(async (sale: SaleRecord) => {
    if (!settings.printerEnabled) return;

    // TRY DIRECT ESC/POS PRINTING FIRST
    const device = activeDeviceRef.current;
    if (device && printerStatus === PrinterStatus.CONNECTED) {
      try {
        const data = encodeReceipt(sale);
        if (device.gatt) { // Bluetooth
          const server = await device.gatt.connect();
          const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
          const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
          await characteristic.writeValue(data);
        } else if (device.transferOut) { // USB
          await device.open();
          await device.selectConfiguration(1);
          await device.claimInterface(0);
          await device.transferOut(1, data);
        }
        return; // Success, exit
      } catch (err) {
        console.error('Direct Print Failed, falling back to window:', err);
      }
    }

    // FALLBACK TO WINDOW PRINT (if no direct device is linked)
    const timestamp = new Date(sale.timestamp).toLocaleString();
    const itemsHtml = sale.items.map(item => `
      <div style="display:flex; justify-content:space-between; margin-bottom:2px; font-weight:bold;">
        <span style="flex:1;">${item.quantity}x ${item.name.toUpperCase()}</span>
        <span style="width:20mm; text-align:right;">₹${(item.price * item.quantity).toFixed(0)}</span>
      </div>
    `).join('');

    const receiptHtml = `
      <html>
        <body onload="window.print(); window.close();" style="font-family:monospace; width:72mm; margin:0 auto; text-align:center;">
          <h3>${settings.stallName}</h3>
          <h1>#${sale.tokenNumber}</h1>
          <p>${timestamp}</p>
          <hr/>
          ${itemsHtml}
          <hr/>
          <h3>TOTAL: ₹${sale.total.toFixed(0)}</h3>
          <p>${settings.footerMessage}</p>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=350,height=500');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    }
  }, [settings, printerStatus]);

  // PERSISTENCE
  useEffect(() => {
    localStorage.setItem('kapi_inventory', JSON.stringify(inventory));
    localStorage.setItem('kapi_sales', JSON.stringify(sales));
    localStorage.setItem('kapi_settings', JSON.stringify(settings));
  }, [inventory, sales, settings]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'REMOTE_PRINT_REQUEST' && settings.isPrintHub) {
        executePhysicalPrint(payload);
      }
      switch (type) {
        case 'SYNC_SALES': setSales(payload); break;
        case 'SYNC_INVENTORY': setInventory(payload); break;
        case 'SYNC_SETTINGS': setSettings(payload); break;
      }
    };
    networkSync.addEventListener('message', handleMessage);
    return () => networkSync.removeEventListener('message', handleMessage);
  }, [settings, executePhysicalPrint]);

  const broadcastSales = (val: SaleRecord[]) => {
    setSales(val);
    networkSync.postMessage({ type: 'SYNC_SALES', payload: val });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.toLowerCase().trim();
    if (email === OWNER_EMAIL.toLowerCase()) {
      setSession({ email, role: UserRole.ADMIN, name: 'Owner' });
    } else {
      const worker = settings.workerAccounts.find(w => w.email.toLowerCase() === email);
      if (worker) setSession({ email, role: UserRole.WORKER, name: worker.name });
      else setLoginError('Invalid Staff Credentials.');
    }
  };

  const confirmLogout = () => {
    setSession(null);
    setShowLogoutConfirm(false);
  };

  const completeSale = useCallback((total: number, paymentMethod: PaymentMethod, cashDetails?: { received: number, change: number }) => {
    if (!session) return;
    const nextToken = sales.length > 0 ? (sales[sales.length - 1].tokenNumber % 999) + 1 : 1;
    const record: SaleRecord = {
      id: `KC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
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
    
    broadcastSales([...sales, record]);

    if (settings.printerEnabled) {
      if (settings.isPrintHub) executePhysicalPrint(record);
      else networkSync.postMessage({ type: 'REMOTE_PRINT_REQUEST', payload: record });
    }

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
            <div className="inline-flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Local Mode Active</span>
            </div>
          </div>
          <form onSubmit={handleLogin} className="bg-[#141414] p-10 rounded-[3rem] border border-zinc-800 shadow-2xl space-y-8">
            <input 
              type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Staff Email"
              className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none font-bold"
            />
            {loginError && <p className="text-red-500 text-[10px] font-black uppercase text-center">{loginError}</p>}
            <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-sm active:scale-95 shadow-xl">Start Session</button>
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
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Stall POS v3.0</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${settings.isPrintHub ? 'bg-blue-500/10 border-blue-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
            <div className="flex flex-col items-start">
               <span className={`text-[8px] font-black uppercase leading-none ${settings.isPrintHub ? 'text-blue-400' : 'text-zinc-500'}`}>
                 {settings.isPrintHub ? 'MASTER PRINTER' : 'REMOTE TERM'}
               </span>
               <span className="text-[10px] font-black text-white">{terminalName}</span>
            </div>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
      <aside className={`fixed top-0 left-0 h-full w-[300px] bg-[#111] border-r border-zinc-800 z-[110] transition-transform duration-500 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 border-b border-zinc-800 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-black text-2xl">KC</div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {useMemo(() => session.role === UserRole.ADMIN ? ['Order Menu', 'Token Monitor', 'Bill Management', 'Manage Items', 'Bill Settings', 'Sales Report'] : ['Order Menu', 'Token Monitor'], [session]).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }} className={`w-full text-left px-8 py-5 rounded-2xl text-[11px] font-black uppercase transition-all ${activeTab === tab ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-zinc-800">
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">End Shift</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'Order Menu' && <OrderMenu items={inventory} onAdd={item => setCart([...cart, {...item, quantity: 1}])} cart={cart} onRemoveFromCart={id => setCart(cart.filter(i => i.id !== id))} onUpdateCartQty={(id, delta) => setCart(cart.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + delta)} : i))} onCompleteSale={completeSale} settings={settings} nextTokenNumber={sales.length > 0 ? (sales[sales.length - 1].tokenNumber % 999) + 1 : 1} printerStatus={printerStatus} connectedPrinterName={connectedPrinterName} />}
          {activeTab === 'Token Monitor' && <OrderMonitor sales={sales} onUpdateStatus={(id, status) => broadcastSales(sales.map(s => s.id === id ? {...s, status} : s))} />}
          {activeTab === 'Bill Management' && <BillManagement sales={sales} setSales={broadcastSales} settings={settings} />}
          {activeTab === 'Manage Items' && <ManageItems items={inventory} setItems={setInventory} />}
          {activeTab === 'Bill Settings' && <BillSettingsView settings={settings} setSettings={setSettings} openingCash={openingCash} setOpeningCash={setOpeningCash} connectedPrinterName={connectedPrinterName} printerStatus={printerStatus} currentTerminalName={terminalName} onUpdateTerminalName={setTerminalName} onUpdatePrinter={handleUpdatePrinter} />}
          {activeTab === 'Sales Report' && <SalesReport sales={sales} openingCash={openingCash} onUpdateOpeningCash={setOpeningCash} />}
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-zinc-800 w-full max-w-sm rounded-[3rem] p-10 text-center space-y-8 shadow-2xl">
            <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Close Terminal?</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={confirmLogout} className="w-full bg-red-500 text-white py-5 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all">Yes, Sign Out</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black uppercase text-xs hover:text-white transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
