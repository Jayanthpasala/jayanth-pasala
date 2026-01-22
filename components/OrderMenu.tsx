
import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, CartItem, BillSettings, PaymentMethod, PrinterStatus } from '../types';
import CurrentCart from './CurrentCart';

interface OrderMenuProps {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
  cart: CartItem[];
  onRemoveFromCart: (id: string) => void;
  onUpdateCartQty: (id: string, delta: number) => void;
  onCompleteSale: (total: number, paymentMethod: PaymentMethod, cashDetails?: { received: number, change: number }) => void;
  settings: BillSettings;
  nextTokenNumber: number;
  printerStatus: PrinterStatus;
  connectedPrinterName?: string;
}

const OrderMenu: React.FC<OrderMenuProps> = ({ 
  items, 
  onAdd, 
  cart, 
  onRemoveFromCart, 
  onUpdateCartQty, 
  onCompleteSale, 
  settings, 
  nextTokenNumber,
  printerStatus,
  connectedPrinterName
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [lastTokenCompleted, setLastTokenCompleted] = useState<number | null>(null);

  const cartCount = useMemo(() => cart.reduce((acc, i) => acc + i.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.quantity), 0), [cart]);

  const categories = useMemo(() => {
    const cats = new Set(items.map(item => item.category));
    return ['All', ...Array.from(cats)].sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const handleAddClick = (item: MenuItem) => {
    if (item.isAvailable === false) return; 
    onAdd(item);
    setLastAdded(item.name);
    setClickedId(item.id);
    setTimeout(() => setClickedId(null), 300);
  };

  const handleSaleComplete = (total: number, method: PaymentMethod, cashDetails?: { received: number, change: number }) => {
    const token = nextTokenNumber;
    onCompleteSale(total, method, cashDetails);
    setShowCart(false);
    setLastTokenCompleted(token);
    setTimeout(() => setLastTokenCompleted(null), 5000);
  };

  useEffect(() => {
    if (lastAdded) {
      const timer = setTimeout(() => setLastAdded(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastAdded]);

  return (
    <div className="space-y-8 relative min-h-full pb-20">
      {/* Success Token Notification */}
      <div className={`fixed inset-0 z-[120] flex items-center justify-center pointer-events-none transition-all duration-700 ${
        lastTokenCompleted ? 'opacity-100 backdrop-blur-md' : 'opacity-0 scale-90 pointer-events-none'
      }`}>
        <div className="bg-white text-black p-12 rounded-[4rem] shadow-[0_0_150px_rgba(255,255,255,0.2)] border-8 border-black flex flex-col items-center gap-6 animate-in zoom-in-50 duration-500">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-2">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-widest opacity-60">Customer Token</span>
            <div className="text-[10rem] font-black tracking-tighter leading-none">#{lastTokenCompleted}</div>
          </div>
          <span className="text-sm font-black uppercase tracking-widest bg-black text-white px-6 py-2 rounded-2xl">Bill Confirmed</span>
        </div>
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="bg-[#111] w-full max-w-6xl h-[95vh] sm:h-[90vh] rounded-t-[3rem] sm:rounded-[3rem] border-t sm:border border-zinc-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-20 duration-500">
            <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center bg-[#1a1a1a]">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Current Order</h2>
                <div className="bg-white text-black px-4 py-1 rounded-xl">
                  <span className="text-[10px] font-black uppercase">Token #{nextTokenNumber}</span>
                </div>
                <div className={`px-3 py-1 rounded-lg flex items-center gap-2 border ${
                  printerStatus === PrinterStatus.CONNECTED 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${printerStatus === PrinterStatus.CONNECTED ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${printerStatus === PrinterStatus.CONNECTED ? 'text-green-500' : 'text-red-500'}`}>
                    {printerStatus === PrinterStatus.CONNECTED ? connectedPrinterName : 'Printer Offline'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowCart(false)}
                className="w-12 h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-white transition-all active:scale-90"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <CurrentCart 
                items={cart}
                onRemove={onRemoveFromCart}
                onUpdateQty={onUpdateCartQty}
                onComplete={handleSaleComplete}
                settings={settings}
                orderNo={nextTokenNumber}
                printerStatus={printerStatus}
              />
            </div>
          </div>
        </div>
      )}

      {/* Item Added Toast */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 pointer-events-none ${
        lastAdded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="bg-white text-black px-8 py-4 rounded-3xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-4 border-2 border-zinc-200">
          <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          {lastAdded} added to order
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
             <h2 className="text-4xl font-black text-white uppercase tracking-tighter">What's Cooking?</h2>
             <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Select items to start token #{nextTokenNumber}</p>
          </div>
          
          <div className="flex flex-1 flex-col sm:flex-row max-w-3xl gap-4">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 bg-[#1a1a1a] border border-zinc-800 rounded-3xl py-3 pl-16 pr-6 text-white placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500/50 transition-all font-bold"
              />
            </div>

            <button
              onClick={() => cartCount > 0 && setShowCart(true)}
              className={`group flex items-center gap-6 px-8 h-16 rounded-[2rem] font-black uppercase tracking-widest transition-all ${
                cartCount > 0 
                ? 'bg-yellow-500 text-black shadow-2xl hover:bg-yellow-400 active:scale-95' 
                : 'bg-zinc-900 text-zinc-700 border border-zinc-800 cursor-not-allowed grayscale'
              }`}
            >
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] uppercase font-black opacity-60">Review Order</span>
                <span className="text-xl">₹{cartTotal.toFixed(0)}</span>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all ${cartCount > 0 ? 'bg-black text-white group-hover:scale-110' : 'bg-zinc-800 text-zinc-700'}`}>
                {cartCount}
              </div>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`h-12 px-8 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap ${
                selectedCategory === cat
                ? 'bg-white border-white text-black shadow-xl shadow-white/5'
                : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {filteredItems.map(item => {
          const isClicked = clickedId === item.id;
          const isOutOfStock = item.isAvailable === false;
          return (
            <div key={item.id} className="relative">
              <button
                disabled={isOutOfStock}
                onClick={() => handleAddClick(item)}
                className={`w-full group aspect-[4/5] flex flex-col items-center justify-between rounded-[2.5rem] p-6 transition-all duration-300 active:scale-90 shadow-xl overflow-hidden relative border-2 ${
                  isOutOfStock
                    ? 'bg-zinc-950/50 border-zinc-900 grayscale opacity-40 cursor-not-allowed'
                    : isClicked 
                      ? 'bg-yellow-500 border-yellow-300 scale-[1.05] z-10' 
                      : 'bg-[#1a1a1a] border-zinc-800/80 hover:border-yellow-500/50 hover:bg-[#222]'
                }`}
              >
                {isOutOfStock && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                    <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg tracking-widest border border-white transform -rotate-12">Closed</span>
                  </div>
                )}
                {isClicked && (
                  <span className="absolute inset-0 bg-white/20 animate-ping rounded-[2.5rem] pointer-events-none"></span>
                )}
                <div className={`text-[9px] font-black uppercase tracking-widest py-1 px-3 rounded-full mb-2 self-start ${
                  isClicked ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {item.category}
                </div>
                <div className={`text-lg font-black text-center leading-tight mb-4 flex-1 flex items-center transition-colors uppercase tracking-tight px-1 ${
                  isClicked ? 'text-black' : 'text-white'
                }`}>
                  {item.name}
                </div>
                <div className={`w-full py-3 rounded-2xl font-black text-base flex items-center justify-center gap-1 transition-all ${
                  isClicked ? 'bg-black/10 text-black' : 'bg-[#0d0d0d] text-yellow-500 group-hover:bg-black group-hover:text-yellow-400'
                }`}>
                  <span className="text-[10px] opacity-60">₹</span>
                  {item.price.toFixed(0)}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderMenu;
