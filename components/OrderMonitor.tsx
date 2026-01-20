
import React, { useState, useEffect } from 'react';
import { SaleRecord, OrderStatus } from '../types';

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
      className={`bg-[#1a1a1a] rounded-[2rem] border-2 transition-all duration-500 shadow-2xl flex flex-col h-full ${
        order.status === OrderStatus.READY 
        ? 'border-green-500/50 shadow-green-500/10' 
        : isLate ? 'border-red-500/50 shadow-red-500/10' 
        : isUrgent ? 'border-yellow-500/50 shadow-yellow-500/10'
        : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Header */}
      <div className={`px-6 py-5 flex justify-between items-start rounded-t-[2rem] ${
        order.status === OrderStatus.READY ? 'bg-green-500/10' : 'bg-zinc-800/20'
      }`}>
        <div>
          <span className={`text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1 ${
             order.status === OrderStatus.READY ? 'text-green-400' : 'text-zinc-400'
          }`}>Token Number</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-white">#{order.tokenNumber}</h3>
            {order.status === OrderStatus.READY && (
              <span className="bg-green-500 text-black text-[9px] font-black px-2 py-0.5 rounded-lg uppercase">Ready</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xl font-black ${isLate ? 'text-red-500' : isUrgent ? 'text-yellow-500' : 'text-zinc-500'}`}>
            {minutesElapsed}m
          </div>
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">Wait Time</span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 px-6 py-5 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1 border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-xl text-xs font-black text-white">
                    {item.quantity}
                  </span>
                  <span className="text-sm font-black text-zinc-200 uppercase tracking-tight">{item.name}</span>
                </div>
              </div>
              {item.instructions && (
                <div className="ml-11 text-[11px] font-bold text-yellow-500 italic bg-yellow-500/5 px-3 py-2 rounded-xl border border-yellow-500/10 uppercase">
                   {item.instructions}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-black/30 rounded-b-[2rem] border-t border-zinc-800/50 grid grid-cols-2 gap-2">
        {order.status === OrderStatus.PENDING ? (
          <button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
            className="col-span-2 py-4 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-xl"
          >
            Mark Ready
          </button>
        ) : (
          <button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.SERVED)}
            className="col-span-2 py-4 rounded-2xl bg-green-500 text-black font-black uppercase text-xs tracking-widest hover:bg-green-400 transition-all active:scale-95"
          >
            Hand Over (Served)
          </button>
        )}
        
        <button 
          onClick={() => {
            if(confirm(`VOID TOKEN #${order.tokenNumber}?\n\nThis will remove it from all sales reports.`)) {
              onUpdateStatus(order.id, OrderStatus.VOIDED);
            }
          }}
          className="py-3 rounded-xl bg-zinc-900 text-red-500/60 font-black uppercase text-[9px] tracking-widest hover:text-red-500 transition-all border border-zinc-800"
        >
          Void Order
        </button>

        <button 
          onClick={() => onUpdateStatus(order.id, order.status === OrderStatus.READY ? OrderStatus.PENDING : OrderStatus.READY)}
          className="py-3 rounded-xl bg-zinc-900 text-zinc-600 font-black uppercase text-[9px] tracking-widest hover:text-white transition-all border border-zinc-800"
        >
          {order.status === OrderStatus.READY ? 'Re-Process' : 'Reprint KOT'}
        </button>
      </div>
    </div>
  );
};

const OrderMonitor: React.FC<OrderMonitorProps> = ({ sales, onUpdateStatus }) => {
  const activeOrders = sales.filter(s => s.status !== OrderStatus.SERVED && s.status !== OrderStatus.VOIDED);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Kitchen Dashboard</h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Live Management of Customer Tokens</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-zinc-900/50 px-5 py-3 rounded-2xl border border-zinc-800 flex items-center gap-3">
            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
            <div className="flex flex-col">
              <span className="text-white text-sm font-black leading-none">{activeOrders.filter(o => o.status === OrderStatus.PENDING).length}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">In Kitchen</span>
            </div>
          </div>
          <div className="bg-zinc-900/50 px-5 py-3 rounded-2xl border border-zinc-800 flex items-center gap-3">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <div className="flex flex-col">
              <span className="text-white text-sm font-black leading-none">{activeOrders.filter(o => o.status === OrderStatus.READY).length}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Ready/Counter</span>
            </div>
          </div>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="bg-[#111] border-2 border-dashed border-zinc-800/50 rounded-[3rem] p-24 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 text-zinc-700">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-zinc-600 font-black uppercase tracking-widest text-lg">Waiting for new orders</p>
          <p className="text-zinc-700 text-xs mt-2 font-bold uppercase tracking-tight">Active customer tokens will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeOrders.map(order => (
            <TokenCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
          ))}
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default OrderMonitor;
