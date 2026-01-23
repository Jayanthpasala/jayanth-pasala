import React, { useState, useEffect, useMemo } from 'https://esm.sh/react@19.0.0';
import { createRoot } from 'https://esm.sh/react-dom@19.0.0/client';

// --- TYPES & ENUMS ---
enum OrderStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  SERVED = 'SERVED'
}

enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI'
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface SaleRecord {
  id: string;
  tokenNumber: number;
  timestamp: number;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
}

// --- INITIAL DATA ---
const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Classic Burger', price: 85, category: 'Food', isAvailable: true },
  { id: '2', name: 'Cheese Fries', price: 40, category: 'Sides', isAvailable: true },
  { id: '3', name: 'Hot Dog', price: 50, category: 'Food', isAvailable: true },
  { id: '4', name: 'Iced Tea', price: 25, category: 'Drinks', isAvailable: true },
  { id: '5', name: 'Lemonade', price: 30, category: 'Drinks', isAvailable: true },
  { id: '6', name: 'Tacos (3pcs)', price: 90, category: 'Food', isAvailable: true },
];

// --- COMPONENTS ---

const App = () => {
  const [activeTab, setActiveTab] = useState('Menu');
  const [inventory, setInventory] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('pos_inventory');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('pos_sales');
    return saved ? JSON.parse(saved) : [];
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [lastToken, setLastToken] = useState<number | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
    localStorage.setItem('pos_sales', JSON.stringify(sales));
  }, [inventory, sales]);

  // Derived State
  const todayTokenCount = useMemo(() => {
    const today = new Date().toDateString();
    return sales.filter(s => new Date(s.timestamp).toDateString() === today).length;
  }, [sales]);

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Actions
  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const finalizeSale = () => {
    if (cart.length === 0) return;
    const newToken = todayTokenCount + 1;
    const newSale: SaleRecord = {
      id: `TXN-${Date.now()}`,
      tokenNumber: newToken,
      timestamp: Date.now(),
      items: [...cart],
      total: cartTotal,
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.CASH
    };
    setSales(prev => [newSale, ...prev]);
    setCart([]);
    setShowCart(false);
    setCashReceived('');
    setLastToken(newToken);
    setActiveTab('Kitchen');
    setTimeout(() => setLastToken(null), 3000);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  // Views
  return (
    <div className="flex flex-col h-screen bg-[#090909] text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="px-6 py-4 bg-[#111] border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center font-black text-black">KC</div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tighter">Kapi Coast POS</h1>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Active Terminal</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['Menu', 'Kitchen', 'History', 'Inventory'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {activeTab === 'Menu' && (
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Store Menu</h2>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Search items..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-3 text-sm focus:outline-none focus:border-yellow-500 w-64"
                />
                <button 
                  onClick={() => setShowCart(true)}
                  className="bg-white text-black px-8 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-3 active:scale-95 transition-all"
                >
                  Order Tray <span className="bg-black text-white px-2 py-0.5 rounded-lg">{cart.length}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {inventory.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`aspect-[4/5] bg-[#1a1a1a] border border-zinc-800 rounded-[2.5rem] p-6 flex flex-col justify-between hover:border-yellow-500 transition-all ${!item.isAvailable && 'opacity-30 grayscale'}`}
                >
                  <span className="text-[9px] font-black uppercase text-zinc-600">{item.category}</span>
                  <span className="text-xl font-black uppercase leading-tight text-left">{item.name}</span>
                  <div className="w-full py-2 bg-black rounded-xl text-yellow-500 font-bold">₹{item.price}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Kitchen' && (
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Kitchen Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sales.filter(s => s.status !== OrderStatus.SERVED).map(order => (
                <div key={order.id} className={`bg-[#1a1a1a] rounded-[2.5rem] border-2 p-8 flex flex-col ${order.status === OrderStatus.READY ? 'border-green-500' : 'border-zinc-800'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-black uppercase text-zinc-500">Token</span>
                      <h3 className="text-5xl font-black">#{order.tokenNumber}</h3>
                    </div>
                    <span className="text-zinc-500 font-bold">{Math.floor((Date.now() - order.timestamp) / 60000)}m ago</span>
                  </div>
                  <div className="flex-1 space-y-4 mb-8">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-lg font-black uppercase">{item.quantity}x {item.name}</div>
                    ))}
                  </div>
                  <button 
                    onClick={() => updateOrderStatus(order.id, order.status === OrderStatus.PENDING ? OrderStatus.READY : OrderStatus.SERVED)}
                    className={`w-full py-4 rounded-2xl font-black uppercase text-xs ${order.status === OrderStatus.PENDING ? 'bg-white text-black' : 'bg-green-500 text-black'}`}
                  >
                    {order.status === OrderStatus.PENDING ? 'Mark Ready' : 'Order Handover'}
                  </button>
                </div>
              ))}
              {sales.filter(s => s.status !== OrderStatus.SERVED).length === 0 && (
                <div className="col-span-full py-32 text-center text-zinc-700 font-black uppercase tracking-widest border-4 border-dashed border-zinc-900 rounded-[3rem]">
                  No active tokens
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'History' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Recent Sales</h2>
            <div className="bg-[#111] rounded-[2.5rem] border border-zinc-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-900/50">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase text-zinc-500">Token</th>
                    <th className="p-6 text-[10px] font-black uppercase text-zinc-500">TXN ID</th>
                    <th className="p-6 text-[10px] font-black uppercase text-zinc-500 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {sales.map(sale => (
                    <tr key={sale.id}>
                      <td className="p-6 font-black text-xl">#{sale.tokenNumber}</td>
                      <td className="p-6 text-xs font-mono text-zinc-500">{sale.id}</td>
                      <td className="p-6 text-right font-black text-yellow-500 text-lg">₹{sale.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Inventory' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Inventory Control</h2>
            <div className="bg-[#111] rounded-[2.5rem] border border-zinc-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-900/50">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase text-zinc-500">Status</th>
                    <th className="p-6 text-[10px] font-black uppercase text-zinc-500">Product</th>
                    <th className="p-6 text-[10px] font-black uppercase text-zinc-500 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {inventory.map(item => (
                    <tr key={item.id}>
                      <td className="p-6">
                        <button 
                          onClick={() => setInventory(prev => prev.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i))}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${item.isAvailable ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                        >
                          {item.isAvailable ? 'Live' : 'Out'}
                        </button>
                      </td>
                      <td className="p-6 font-black uppercase">{item.name}</td>
                      <td className="p-6 text-right font-bold">₹{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#111] w-full max-w-2xl rounded-[3rem] border border-zinc-800 overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Review Order Tray</h3>
              <button onClick={() => setShowCart(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div className="p-8 space-y-4 max-h-[50vh] overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="bg-[#1a1a1a] p-4 rounded-2xl flex justify-between items-center border border-zinc-800">
                  <div>
                    <h4 className="font-black uppercase">{item.name}</h4>
                    <p className="text-xs text-zinc-500">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => updateCartQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-zinc-800 text-white">-</button>
                    <span className="font-black">{item.quantity}</span>
                    <button onClick={() => updateCartQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-zinc-800 text-white">+</button>
                    <button onClick={() => removeFromCart(item.id)} className="ml-2 text-red-500 text-xs font-bold">Delete</button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center text-zinc-600 uppercase font-black py-10">Tray is empty</p>}
            </div>
            <div className="p-8 bg-zinc-900/50 border-t border-zinc-800 space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase text-zinc-500">Order Summary</span>
                <span className="text-4xl font-black text-yellow-500">₹{cartTotal}</span>
              </div>
              <button 
                onClick={finalizeSale}
                className="w-full bg-yellow-500 text-black py-5 rounded-[2rem] font-black uppercase text-xl transition-all active:scale-95 shadow-xl shadow-yellow-500/10"
              >
                Confirm Token issuance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {lastToken && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center animate-fade-in">
          <div className="text-center space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Issue Successful</h4>
            <h3 className="text-9xl font-black text-white">#{lastToken}</h3>
            <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Kitchen notified</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MOUNT APP ---
const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}