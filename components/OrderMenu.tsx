
import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, CartItem, BillSettings, PaymentMethod } from '../types';
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
}

const OrderMenu: React.FC<OrderMenuProps> = ({ 
  items, 
  onAdd, 
  cart, 
  onRemoveFromCart, 
  onUpdateCartQty, 
  onCompleteSale, 
  settings, 
  nextTokenNumber
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
    if (item.isAvailable === false) return; // Prevent adding if out of stock
    onAdd(item);
    setLastAdded(item.name);
    setClickedId(item.id);
    setTimeout(() => setClickedId(null), 400);
  };

  const handleSaleComplete = (total: number, method: PaymentMethod, cashDetails?: { received: number, change: number }) => {
    const token = nextTokenNumber;
    onCompleteSale(total, method, cashDetails);
    setShowCart(false);
    setLastTokenCompleted(token);
    setTimeout(() => setLastTokenCompleted(null), 4000);
  };

  useEffect(() => {
    if (lastAdded) {
      const timer = setTimeout(() => setLastAdded(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastAdded]);

  return (
    <div className="space-y-6 relative min-h-full">
      {/* Success Token Notification */}
      <div className={`fixed inset-0 z-[120] flex items-center justify-center pointer-events-none transition-all duration-500 ${
        lastTokenCompleted ? 'opacity-100' : 'opacity-0 scale-95'
      }`}>
        <div className="bg-green-600 text-white p-8 rounded-3xl shadow-[0_0_100px_rgba(22,163,74,0.5)] border-4 border-white flex flex-col items-center gap-4 animate-bounce">
          <span className="text-xl font-black uppercase tracking-widest">ORDER SUCCESS!</span>
          <div className="text-8xl font-black tracking-tighter">#{lastTokenCompleted}</div>
          <span className="text-sm font-bold uppercase opacity-80 italic">Customer Token Number</span>
        </div>
      </div>

      {/* Cart Overlay */}
      {showCart && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 w-full max-w-6xl max-h-[90vh] rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Order Summary</h2>
                <div className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-lg">
                  <span className="text-[10px] font-black text-yellow-500 uppercase">NEXT TOKEN: #{nextTokenNumber}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowCart(false)}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <CurrentCart 
                items={cart}
                onRemove={onRemoveFromCart}
                onUpdateQty={onUpdateCartQty}
                onComplete={handleSaleComplete}
                settings={settings}
                orderNo={nextTokenNumber}
              />
            </div>
          </div>
        </div>
      )}

      {/* Item Added Toast */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 pointer-events-none ${
        lastAdded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="bg-yellow-500 text-black px-6 py-3 rounded-full font-black uppercase tracking-tighter shadow-2xl flex items-center gap-3 border-2 border-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
          {lastAdded} Added!
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Order Menu</h2>
             <span className="bg-zinc-800 text-zinc-500 text-[10px] px-3 py-1 rounded-full font-black uppercase">Token Queue: #{nextTokenNumber}</span>
          </div>
          
          <div className="flex flex-1 flex-col sm:flex-row max-w-2xl gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
              />
            </div>

            <button
              onClick={() => cartCount > 0 && setShowCart(true)}
              className={`flex items-center gap-4 px-6 py-3 rounded-xl font-black uppercase tracking-tighter transition-all border-2 ${
                cartCount > 0 
                ? 'bg-yellow-500 text-black border-white shadow-[0_4px_20px_rgba(234,179,8,0.3)] hover:scale-[1.02] active:scale-95' 
                : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] uppercase font-black opacity-70">Checkout</span>
                <span className="text-lg">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${cartCount > 0 ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-600'}`}>
                {cartCount}
              </div>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 overflow-x-auto pb-4 no-scrollbar min-h-[64px]">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`transition-all duration-300 transform font-black uppercase tracking-widest border-2 whitespace-nowrap ${
                selectedCategory === cat
                ? 'px-8 py-4 text-sm bg-white border-yellow-500 text-black scale-110 shadow-[0_0_25px_rgba(234,179,8,0.5)] z-10 rounded-2xl ring-2 ring-yellow-500'
                : 'px-5 py-2 text-[10px] bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 rounded-xl'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredItems.map(item => {
          const isClicked = clickedId === item.id;
          const isOutOfStock = item.isAvailable === false;
          return (
            <div key={item.id} className="relative group">
              <button
                disabled={isOutOfStock}
                onClick={() => handleAddClick(item)}
                className={`w-full h-36 flex flex-col items-center justify-center rounded-2xl p-4 transition-all duration-300 active:scale-90 shadow-xl overflow-hidden relative ${
                  isOutOfStock
                    ? 'bg-zinc-950 border-zinc-900 grayscale opacity-60 cursor-not-allowed'
                    : isClicked 
                      ? 'border-4 border-yellow-400 bg-yellow-400/10 scale-105 ring-4 ring-yellow-400/20' 
                      : 'bg-zinc-900 border-2 border-zinc-800 hover:border-yellow-500 hover:shadow-yellow-500/10'
                }`}
              >
                {isOutOfStock && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                    <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded tracking-tighter transform -rotate-12 border border-white">SOLD OUT</span>
                  </div>
                )}
                <div className={`absolute inset-0 bg-yellow-400 transition-opacity duration-300 pointer-events-none ${isClicked ? 'opacity-20' : 'opacity-0'}`} />
                <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1 relative z-10">{item.category}</div>
                <div className={`text-lg font-black text-center leading-tight mb-2 transition-colors line-clamp-2 px-1 relative z-10 ${
                  isClicked ? 'text-yellow-400' : 'text-white group-hover:text-yellow-500'
                }`}>
                  {item.name}
                </div>
                {!isOutOfStock && (
                  <div className={`px-3 py-1 rounded-lg font-bold text-sm relative z-10 transition-colors ${
                    isClicked ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-yellow-500'
                  }`}>
                    ₹{item.price.toFixed(2)}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderMenu;
