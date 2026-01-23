import React, { useState, useEffect, useMemo } from 'react';
import { SaleRecord, OrderStatus, CartItem } from '../types.ts';

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
        ? 'border-green-500 shadow-green-500/10' 
        : isLate ? 'border-red-500/50 shadow-red-500/10' 
        : isUrgent ? 'border-yellow-500/50 shadow-yellow-500/10'
        : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
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

      <div className="flex-1 px-8 py-6 overflow-y-auto">
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
                <div className="ml-14 relative bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4">
                  <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-1 block">Note:</span>
                  <p className="text-xs font-bold text-yellow-400 uppercase italic">{item.instructions}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-black/40 border-t border-zinc-800/50 space-y-3">
        {order.status === OrderStatus.PENDING ? (
          <button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
            className="w-full py-5 rounded-[1.5rem] bg-white text-black font-black uppercase text-sm tracking-[0.15em] hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            Ready to Serve
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
            onClick={() => confirm(`VOID TOKEN #${order.tokenNumber}?`) && onUpdateStatus(order.id, OrderStatus.VOIDED)}
            className="py-3.5 rounded-xl bg-zinc-900 text-red-500/80 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-all border border-zinc-800"
          >
            Void
          </button>
          <button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.PENDING)}
            className="py-3.5 rounded-xl bg-zinc-900 text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all border border-zinc-800"
          >
            Back to Prep
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderMonitor: React.FC<OrderMonitorProps> = ({ sales, onUpdateStatus }) => {
  const activeOrders = useMemo(() => 
    sales.filter(s => s.status !== OrderStatus.SERVED && s.status !== OrderStatus.VOIDED)
  , [sales]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Kitchen Dashboard</h2>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mt-2">
            {activeOrders.length} Orders in Queue
          </p>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="bg-[#0c0c0c] border-4 border-dashed border-zinc-900 rounded-[3.5rem] p-32 text-center flex flex-col items-center">
          <p className="text-zinc-700 font-black uppercase tracking-[0.4em] text-lg">Kitchen Standby</p>
          <p className="text-zinc-800 text-xs mt-4 font-bold uppercase tracking-widest">Awaiting incoming tokens...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
          {activeOrders.map(order => (
            <TokenCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderMonitor;