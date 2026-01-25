import React, { useState, useEffect, useMemo, useCallback } from 'https://esm.sh/react@19.0.0';
import { createRoot } from 'https://esm.sh/react-dom@19.0.0/client';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-analytics.js';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  User
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyAwps0sHc_Ys1Aj5ABWGxJQRhA0VrUjIuA",
  authDomain: "aestrytfyguh.firebaseapp.com",
  projectId: "aestrytfyguh",
  storageBucket: "aestrytfyguh.firebasestorage.app",
  messagingSenderId: "240522717377",
  appId: "1:240522717377:web:0d9ce23d3e0cb98ea74c40",
  measurementId: "G-2VC20N36FN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics asynchronously
isSupported().then(supported => {
  if (supported) getAnalytics(app);
});

// --- POS TYPES ---
enum OrderStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  SERVED = 'SERVED',
  VOIDED = 'VOIDED'
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
  id: number;
  order_number: string;
  items: CartItem[];
  total_amount: string | number;
  status: OrderStatus;
  printed: boolean;
  created_at: string;
}

const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Classic Burger', price: 85, category: 'Food', isAvailable: true },
  { id: '2', name: 'Cheese Fries', price: 40, category: 'Sides', isAvailable: true },
  { id: '3', name: 'Hot Dog', price: 50, category: 'Food', isAvailable: true },
  { id: '4', name: 'Iced Tea', price: 25, category: 'Drinks', isAvailable: true },
  { id: '5', name: 'Lemonade', price: 30, category: 'Drinks', isAvailable: true },
  { id: '6', name: 'Tacos (3pcs)', price: 90, category: 'Food', isAvailable: true },
  { id: '7', name: 'Onion Rings', price: 45, category: 'Sides', isAvailable: true },
  { id: '8', name: 'Cold Coffee', price: 55, category: 'Drinks', isAvailable: true },
];

const AuthTerminal = ({ onAuthSuccess }: { onAuthSuccess: (u: User) => void }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{code: string, message: string} | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentHostname = window.location.hostname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (authMode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else if (authMode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('Recovery link dispatched to ' + email);
      }
    } catch (err: any) {
      setError({ code: err.code, message: err.message.replace('Firebase:', '').trim() });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError({ code: err.code, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(30,30,30,1)_0%,rgba(5,5,5,1)_100%)] overflow-hidden">
      <div className="w-full max-w-md space-y-12 animate-fade-in relative z-10">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-yellow-500 rounded-3xl mx-auto flex items-center justify-center font-black text-black text-3xl shadow-[0_0_50px_rgba(234,179,8,0.3)]">KC</div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
              {authMode === 'reset' ? 'Security Recovery' : 'Cloud Terminal'}
            </h1>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Security Protocol v2.5</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {loading && <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="font-black uppercase tracking-[0.2em] text-[10px]">Processing...</span>
          </div>}
          
          {authMode !== 'reset' && (
            <div className="space-y-4">
              <button 
                onClick={handleGoogleLogin}
                className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-xl flex items-center justify-center gap-4 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-white/5 flex-1"></div>
                <span className="text-[9px] font-black uppercase text-zinc-700 tracking-widest">secure login</span>
                <div className="h-px bg-white/5 flex-1"></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Registered Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-500/50 transition-all text-sm"
                placeholder="staff@kapicoast.com"
              />
            </div>

            {authMode !== 'reset' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Access Token</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-500/50 transition-all text-sm"
                  placeholder="••••••••"
                />
                <div className="flex justify-end px-1 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('reset')}
                    className="text-[10px] font-black text-yellow-500/60 hover:text-yellow-500 transition-colors uppercase tracking-widest bg-yellow-500/5 px-3 py-1 rounded-lg"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl text-green-500 text-[10px] font-black uppercase tracking-widest text-center animate-fade-in shadow-xl shadow-green-500/5">
                {successMsg}
              </div>
            )}

            {error && (
              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-[2rem] space-y-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">
                    {error.code === 'auth/unauthorized-domain' ? 'Domain Rejected' : 'Security Alert'}
                  </p>
                </div>
                
                {error.code === 'auth/unauthorized-domain' ? (
                  <div className="space-y-4">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider leading-relaxed">
                      Domain not whitelisted. Add this to Firebase "Authorized Domains":
                    </p>
                    <div className="bg-black p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                      <code className="text-yellow-500 text-xs font-mono select-all">{currentHostname}</code>
                      <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-white transition-colors">Copy</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider leading-relaxed">{error.message}</p>
                )}
              </div>
            )}

            <div className="space-y-4 pt-2">
              <button 
                type="submit"
                className="w-full bg-zinc-800 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-700 transition-all active:scale-95 border border-white/5 shadow-xl"
              >
                {authMode === 'login' ? 'Initialize' : authMode === 'register' ? 'Create Account' : 'Request Reset Link'}
              </button>

              <div className="flex flex-col gap-3">
                {authMode !== 'reset' ? (
                  <button 
                    type="button"
                    onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                    className="w-full text-zinc-600 font-black uppercase text-[9px] tracking-[0.3em] hover:text-white transition-all py-2"
                  >
                    {authMode === 'login' ? 'Request New Account' : 'Return to Login'}
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }}
                    className="w-full text-zinc-600 font-black uppercase text-[9px] tracking-[0.3em] hover:text-white transition-all py-2"
                  >
                    ← Back to Login
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 blur-[120px] rounded-full -z-10"></div>
      </div>
    </div>
  );
};

const POSApp = ({ user }: { user: User }) => {
  const [activeTab, setActiveTab] = useState('Menu');
  const [activeCategory, setActiveCategory] = useState('All');
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'syncing'>('syncing');
  const [inventory, setInventory] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('pos_inventory');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  const categories = useMemo(() => ['All', ...new Set(inventory.map(i => i.category))], [inventory]);

  useEffect(() => {
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
  }, [inventory]);

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const orders = await response.json();
        setSales(orders);
        setDbStatus('connected');
      } else {
        setDbStatus('error');
      }
    } catch (error) {
      setDbStatus('error');
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 2000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const updateOrderStatus = async (id: number, updates: Partial<SaleRecord>) => {
    setIsProcessing(id);
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      if (response.ok) {
        const updated = await response.json();
        setSales(prev => prev.map(s => s.id === id ? updated : s));
      }
    } finally {
      setIsProcessing(null);
    }
  };

  const finalizeSale = async () => {
    if (cart.length === 0) return;
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.created_at).toDateString() === today);
    const nextTokenNum = (todaySales.length + 1).toString().padStart(2, '0');
    const totalAmount = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: nextTokenNum, items: cart, totalAmount })
      });
      if (response.ok) {
        const newOrder = await response.json();
        setCart([]);
        setShowCart(false);
        setLastToken(newOrder.order_number);
        setActiveTab('Kitchen');
        setTimeout(() => setLastToken(null), 3500);
      }
    } catch (error) {
      alert("Cloud Sync Failure.");
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = sales.filter(s => new Date(s.created_at).toDateString() === today && s.status !== OrderStatus.VOIDED);
    return {
      revenue: todayOrders.reduce((acc, s) => acc + Number(s.total_amount), 0),
      count: todayOrders.length
    };
  }, [sales]);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-yellow-500/30">
      <header className="px-8 py-5 bg-[#0a0a0a] border-b border-white/5 flex justify-between items-center shrink-0 z-10 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center font-black text-black shadow-[0_0_30px_rgba(234,179,8,0.2)] text-xl tracking-tighter">KC</div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Kapi Coast</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{user.displayName || user.email?.split('@')[0]} (Cloud POS)</p>
            </div>
          </div>
        </div>

        <nav className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
          {['Menu', 'Kitchen', 'History', 'Inventory'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab ? 'bg-white text-black shadow-2xl' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
          <div className="w-px h-6 bg-white/5 mx-2 my-auto"></div>
          <button 
            onClick={() => signOut(auth)}
            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
          >
            Logout
          </button>
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-8 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,20,1)_0%,rgba(5,5,5,1)_100%)]">
        {activeTab === 'Menu' && (
          <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
              <div className="lg:col-span-2">
                <h2 className="text-7xl font-black uppercase tracking-tighter leading-none">New Order</h2>
                <p className="text-zinc-600 font-bold uppercase tracking-[0.4em] text-[10px] mt-4">Counter Terminal</p>
              </div>
              <div className="bg-[#0a0a0a] p-6 rounded-[2.5rem] border border-white/5 flex flex-col justify-center shadow-lg">
                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Revenue Today</span>
                <p className="text-4xl font-black text-yellow-500 mt-1">₹{stats.revenue.toLocaleString()}</p>
              </div>
              <div className="bg-[#0a0a0a] p-6 rounded-[2.5rem] border border-white/5 flex flex-col justify-center shadow-lg">
                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Tokens issued</span>
                <p className="text-4xl font-black text-white mt-1">{stats.count}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-8 pt-4">
              <div className="flex bg-zinc-900/30 p-1 rounded-[1.5rem] border border-white/5 overflow-x-auto no-scrollbar backdrop-blur-sm">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                      activeCategory === cat ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Find item..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-zinc-900/30 border border-white/5 rounded-3xl px-8 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 w-full md:w-80 transition-all placeholder:text-zinc-700"
                />
                <button 
                  onClick={() => setShowCart(true)}
                  className="bg-white text-black px-10 py-4 rounded-3xl font-black uppercase text-xs flex items-center gap-4 active:scale-95 transition-all shadow-2xl hover:bg-zinc-100"
                >
                  Checkout <span className="bg-black text-white px-3 py-1 rounded-lg text-[10px]">{cart.length}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 pb-24">
              {filteredInventory.map(item => (
                <button
                  key={item.id}
                  onClick={() => item.isAvailable && setCart(prev => {
                    const ex = prev.find(i => i.id === item.id);
                    if (ex) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
                    return [...prev, { ...item, quantity: 1 }];
                  })}
                  className={`group relative aspect-[4/5] bg-zinc-900/20 border border-white/5 rounded-[2.8rem] p-8 flex flex-col justify-between transition-all duration-500 overflow-hidden ${!item.isAvailable ? 'opacity-10 grayscale cursor-not-allowed' : 'hover:bg-zinc-900 hover:border-yellow-500/40 hover:-translate-y-2'}`}
                >
                  <div className="flex justify-between items-start relative z-10">
                    <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">{item.category}</span>
                  </div>
                  <div className="relative z-10">
                    <span className="text-2xl font-black uppercase leading-[1.1] text-left block mb-4 group-hover:text-yellow-500 transition-colors">{item.name}</span>
                    <div className="w-full py-3 bg-black/50 backdrop-blur-md rounded-2xl text-white font-black text-sm text-center border border-white/5">₹{item.price}</div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-500/5 blur-[50px] group-hover:bg-yellow-500/10 transition-all rounded-full"></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Kitchen' && (
          <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
             <h2 className="text-7xl font-black uppercase tracking-tighter leading-none">Kitchen</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
              {sales.filter(s => s.status === OrderStatus.PENDING || s.status === OrderStatus.READY).map(order => (
                <div key={order.id} className={`bg-[#0a0a0a] rounded-[3.5rem] border-2 p-12 flex flex-col transition-all duration-700 ${order.status === OrderStatus.READY ? 'border-green-500' : 'border-white/5'}`}>
                  <h3 className="text-[6rem] font-black leading-none tracking-tighter mb-10">#{order.order_number}</h3>
                  <div className="flex-1 space-y-5 mb-12">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-3xl font-black uppercase tracking-tight">{item.name}</span>
                        <span className="bg-zinc-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => updateOrderStatus(order.id, { status: order.status === OrderStatus.PENDING ? OrderStatus.READY : OrderStatus.SERVED })}
                    className={`py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all ${order.status === OrderStatus.PENDING ? 'bg-white text-black' : 'bg-green-500 text-black'}`}
                  >
                    {order.status === OrderStatus.PENDING ? 'MARK READY' : 'SERVE'}
                  </button>
                </div>
              ))}
             </div>
          </div>
        )}

        {activeTab === 'History' && (
          <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-24">
             <h2 className="text-7xl font-black uppercase tracking-tighter leading-none">Journal</h2>
             <div className="bg-[#0a0a0a] rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <tbody className="divide-y divide-white/5">
                  {sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-zinc-900/20">
                      <td className="p-10 font-black text-4xl tracking-tighter">#{sale.order_number}</td>
                      <td className="p-10 text-xs font-mono text-zinc-500">{new Date(sale.created_at).toLocaleTimeString()}</td>
                      <td className="p-10 text-right font-black text-white text-4xl tracking-tighter">₹{sale.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
          </div>
        )}

        {activeTab === 'Inventory' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-24">
            <h2 className="text-7xl font-black uppercase tracking-tighter leading-none">Stock</h2>
            <div className="bg-[#0a0a0a] rounded-[3.5rem] border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                <tbody className="divide-y divide-white/5">
                  {inventory.map(item => (
                    <tr key={item.id} className="hover:bg-zinc-900/20">
                      <td className="p-10 font-black uppercase tracking-tight text-2xl">{item.name}</td>
                      <td className="p-10">
                        <button 
                          onClick={() => setInventory(prev => prev.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i))}
                          className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${item.isAvailable ? 'bg-green-500 text-black' : 'bg-red-500 text-black'}`}
                        >
                          {item.isAvailable ? 'IN STOCK' : 'SOLD OUT'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* --- CART OVERLAY --- */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-end sm:items-center justify-center p-6">
          <div className="bg-[#0a0a0a] w-full max-w-2xl rounded-[4rem] border border-white/10 overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-12 border-b border-white/5 flex justify-between items-center bg-zinc-900/20">
              <h3 className="text-5xl font-black uppercase tracking-tighter">Review Tray</h3>
              <button onClick={() => setShowCart(false)} className="w-14 h-14 bg-zinc-900 rounded-full border border-white/5 text-zinc-500">✕</button>
            </div>
            <div className="p-12 space-y-6 max-h-[45vh] overflow-y-auto no-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="bg-zinc-900/30 p-8 rounded-[3rem] flex justify-between items-center border border-white/5">
                  <h4 className="font-black uppercase text-2xl tracking-tight leading-none">{item.name}</h4>
                  <div className="flex items-center gap-6">
                    <span className="font-black text-xl">x{item.quantity}</span>
                    <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-red-500 font-black uppercase text-[10px]">Void</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-12 bg-zinc-900/40 border-t border-white/5 space-y-10 backdrop-blur-md">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Payable</span>
                <p className="text-7xl font-black text-yellow-500 tracking-tighter">₹{cart.reduce((acc, i) => acc + (i.price * i.quantity), 0)}</p>
              </div>
              <button onClick={finalizeSale} className="w-full bg-white text-black py-8 rounded-[2.5rem] font-black uppercase text-2xl shadow-white/5">ISSUE TOKEN</button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUCCESS OVERLAY --- */}
      {lastToken && (
        <div className="fixed inset-0 z-[100] bg-black/99 backdrop-blur-3xl flex items-center justify-center animate-fade-in overflow-hidden">
          <div className="text-center space-y-12">
            <div className="w-32 h-32 bg-green-500 rounded-full mx-auto flex items-center justify-center text-black text-5xl font-bold animate-bounce shadow-[0_0_100px_rgba(34,197,94,0.3)]">✓</div>
            <h3 className="text-[18rem] font-black text-white leading-none tracking-tighter">#{lastToken}</h3>
            <p className="text-lg font-bold text-yellow-500 uppercase tracking-[0.5em] animate-pulse">Synced to Neon Cloud</p>
          </div>
        </div>
      )}
    </div>
  );
};

const Main = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
  }, []);

  if (initializing) return (
    <div className="h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-white font-black uppercase tracking-[1em] text-[10px] animate-pulse">Initializing Terminal...</div>
    </div>
  );

  return user ? <POSApp user={user} /> : <AuthTerminal onAuthSuccess={setUser} />;
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<Main />);
}