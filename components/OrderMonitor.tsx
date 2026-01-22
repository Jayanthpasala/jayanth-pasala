
import React, { useState, useEffect, useMemo } from 'react';
import { SaleRecord, OrderStatus, CartItem } from '../types';

interface OrderMonitorProps {
  sales: SaleRecord[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}

const TokenCard: React.FC<{ order: SaleRecord, onUpdateStatus: (id: string, status: OrderStatus) => void }> = ({ order, onUpdateStatus }) => {
  const [minutesElapsed, setMinutesElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesElapsed(Math.floor((Date.now() - order.timestamp) / 60000));
    }, 10000);
    setMinutesElapsed(Math.floor((Date.now() - order.timestamp) / 60000));
    return () => clearInterval(timer);
  }, [order.timestamp]);

  const isLate = minutesElapsed >= 15 && order.status === OrderStatus.PENDING;
  const isUrgent = minutesElapsed >= 10 && order.status === OrderStatus.PENDING;

  return (
    <div 
      className={`bg-[#1a1a1a] rounded-[2.5rem] border-2 transition-all duration-500 shadow-2xl flex flex-col h-full overflow-hidden ${
        order.status === OrderStatus.READY 
        ? 'border-green-500/50 shadow-green-500/10' 
        : isLate ? 'border-red-500/50 shadow-red-500/10' 
        : isUrgent ? 'border-yellow-500/50 shadow-yellow-500/10'
        : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Header Section */}
      <div className={`px-8 py-6 flex justify-between items-start ${
        order.status === OrderStatus.READY ? 'bg-green-500/10' : 'bg-zinc-800/20'
      }`}>
        <div>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] block mb-1.5 ${
             order.status === OrderStatus.READY ? 'text-green-400' : 'text-zinc-500'
          }`}>TOKEN</span>
          <div className="flex items-center gap-3">
            <h3 className="text-5xl font-black text-white leading-none tracking-tighter">#{order.tokenNumber}</h3>
            {order.status === OrderStatus.READY && (
              <span className="bg-green-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-green-500/20">Ready</span>
            )}
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className={`text-2xl font-black tracking-tighter leading-none ${isLate ? 'text-red-500' : isUrgent ? 'text-yellow-500' : 'text-zinc-400'}`}>
            {minutesElapsed}m
          </div>
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Wait Time</span>
        </div>
      </div>

      {/* Items Section */}
      <div className="flex-1 px-8 py-6 overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-3 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-zinc-800 border border-zinc-700 rounded-2xl text-lg font-black text-yellow-500 shadow-inner">
                    {item.quantity}
                  </span>
                  <span className="text-base font-black text-zinc-100 uppercase tracking-tight leading-snug">
                    {item.name}
                  </span>
                </div>
              </div>
              
              {item.instructions && (
                <div className="ml-14 relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-yellow-500 rounded-full"></div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 shadow-lg shadow-yellow-500/5">
                    <span className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-1.5 block">Prep Note:</span>
                    <p className="text-xs font-bold text-yellow-400 leading-relaxed uppercase italic">
                      {item.instructions}
                    </p>
                  </div>
                </div>
              )}
              
              {idx !== order.items.length - 1 && (
                <div className="h-[1px] w-full bg-zinc-800/50 mt-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-black/40 border-t border-zinc-800/50 space-y-3">
        {order.status === OrderStatus.PENDING ? (
          <button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
            className="w-full py-5 rounded-[1.5rem] bg-white text-black font-black uppercase text-sm tracking-[0.15em] hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            Complete Preparation
          </button>
        ) : (
          <button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.SERVED)}
            className="w-full py-5 rounded-[1.5rem] bg-green-500 text-black font-black uppercase text-sm tracking-[0.15em] hover:bg-green-400 transition-all active:scale-[0.98] shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Hand Over (Served)
          </button>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => {
              if(confirm(`VOID TOKEN #${order.tokenNumber}?\n\nThis will remove it from all sales reports.`)) {
                onUpdateStatus(order.id, OrderStatus.VOIDED);
              }
            }}
            className="py-3.5 rounded-xl bg-zinc-900 text-red-500/80 font-black uppercase text-[10px] tracking-widest hover:text-red-500 hover:bg-red-500/5 transition-all border border-zinc-800"
          >
            Void
          </button>

          <button 
            onClick={() => onUpdateStatus(order.id, order.status === OrderStatus.READY ? OrderStatus.PENDING : OrderStatus.READY)}
            className="py-3.5 rounded-xl bg-zinc-900 text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:text-white hover:bg-zinc-800 transition-all border border-zinc-800"
          >
            {order.status === OrderStatus.READY ? 'Back to Prep' : 'Reprint KOT'}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderMonitor: React.FC<OrderMonitorProps> = ({ sales, onUpdateStatus }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const activeOrders = useMemo(() => 
    sales.filter(s => s.status !== OrderStatus.SERVED && s.status !== OrderStatus.VOIDED)
  , [sales]);

  // Aggregate pending items for batch cooking summary
  const prepSummary = useMemo(() => {
    const summary: Record<string, { name: string, qty: number, category: string }> = {};
    activeOrders.filter(o => o.status === OrderStatus.PENDING).forEach(order => {
      order.items.forEach(item => {
        if (!summary[item.id]) {
          summary[item.id] = { name: item.name, qty: 0, category: item.category };
        }
        summary[item.id].qty += item.quantity;
      });
    });
    return Object.values(summary).sort((a, b) => b.qty - a.qty);
  }, [activeOrders]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    activeOrders.forEach(o => o.items.forEach(i => cats.add(i.category)));
    return ['All', ...Array.from(cats)].sort();
  }, [activeOrders]);

  const filteredOrders = useMemo(() => {
    return activeOrders.filter(order => {
      const matchesSearch = order.tokenNumber.toString().includes(searchQuery) || 
                          order.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'All' || order.items.some(i => i.category === filterCategory);
      return matchesSearch && matchesCategory;
    });
  }, [activeOrders, searchQuery, filterCategory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        
        {/* Main Dashboard Area */}
        <div className="flex-1 w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Kitchen Dashboard</h2>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mt-2">Real-time Order Processing</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="relative w-full md:w-72">
                <input 
                  type="text"
                  placeholder="Filter by token or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111] border-2 border-zinc-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                />
              </div>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-[#111] border-2 border-zinc-800 rounded-2xl px-5 py-4 text-[11px] text-zinc-400 font-black uppercase tracking-widest focus:outline-none focus:border-yellow-500 transition-all appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-[#0c0c0c] border-4 border-dashed border-zinc-900 rounded-[3.5rem] p-32 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-8 text-zinc-800">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-zinc-700 font-black uppercase tracking-[0.4em] text-lg">Kitchen Standby</p>
              <p className="text-zinc-800 text-xs mt-4 font-bold uppercase tracking-widest">Awaiting incoming tokens...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
              {filteredOrders.map(order => (
                <TokenCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
              ))}
            </div>
          )}
        </div>

        {/* Prep Summary Sidebar */}
        <div className="w-full xl:w-96 space-y-6">
          <div className="bg-[#111] border border-zinc-800/50 rounded-[3rem] p-8 shadow-2xl sticky top-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Batch Summary</h3>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Total pending units</p>
              </div>
              <div className="bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Live</span>
              </div>
            </div>

            <div className="space-y-4">
              {prepSummary.length > 0 ? prepSummary.map(item => (
                <div key={item.name} className="flex items-center justify-between p-5 bg-zinc-900/50 border border-zinc-800 rounded-3xl group hover:border-yellow-500/30 transition-all">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.15em] mb-1">{item.category}</span>
                    <span className="text-sm font-black text-zinc-200 uppercase tracking-tight">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black border border-zinc-800 rounded-2xl flex items-center justify-center text-xl font-black text-yellow-500 shadow-xl group-hover:scale-110 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                      {item.qty}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-black/20 rounded-[2rem] border border-dashed border-zinc-800/50">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">No prep needed</p>
                </div>
              )}
            </div>

            {prepSummary.length > 0 && (
              <div className="mt-10 pt-8 border-t border-zinc-800 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 p-5 rounded-2xl border border-zinc-800/50 flex flex-col gap-1">
                      <span className="text-2xl font-black text-white">{activeOrders.filter(o => o.status === OrderStatus.PENDING).length}</span>
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tokens Pending</span>
                    </div>
                    <div className="bg-black/30 p-5 rounded-2xl border border-zinc-800/50 flex flex-col gap-1">
                      <span className="text-2xl font-black text-green-500">{activeOrders.filter(o => o.status === OrderStatus.READY).length}</span>
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tokens Ready</span>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
};

export default OrderMonitor;
