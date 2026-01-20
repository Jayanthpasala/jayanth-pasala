
import React from 'react';
import { SaleRecord, OrderStatus } from '../types';

interface OrderMonitorProps {
  sales: SaleRecord[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}

const OrderMonitor: React.FC<OrderMonitorProps> = ({ sales, onUpdateStatus }) => {
  // Only show orders that are not served and not voided
  const activeOrders = sales.filter(s => s.status !== OrderStatus.SERVED && s.status !== OrderStatus.VOIDED);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <span className="w-2 h-8 bg-red-500 rounded-full"></span>
          Live Token Monitor
        </h2>
        <div className="flex gap-4 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400">
            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span>
            Pending ({activeOrders.filter(o => o.status === OrderStatus.PENDING).length})
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400">
            <span className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
            Ready ({activeOrders.filter(o => o.status === OrderStatus.READY).length})
          </div>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-3xl p-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-600">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <p className="text-zinc-500 font-black uppercase tracking-widest text-lg">No Active Orders</p>
          <p className="text-zinc-600 text-xs mt-1">Tokens will appear here once payment is confirmed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeOrders.map(order => (
            <div 
              key={order.id} 
              className={`bg-zinc-900 rounded-3xl border-2 overflow-hidden transition-all duration-300 shadow-2xl flex flex-col group ${
                order.status === OrderStatus.READY 
                ? 'border-green-500 shadow-green-500/10 scale-[1.02]' 
                : 'border-zinc-800'
              }`}
            >
              {/* Header */}
              <div className={`p-4 flex justify-between items-center ${
                order.status === OrderStatus.READY ? 'bg-green-500 text-black' : 'bg-zinc-800 text-white'
              }`}>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-tighter opacity-70`}>TOKEN</span>
                  <span className="text-4xl font-black leading-none">#{order.tokenNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase block opacity-70">{order.paymentMethod}</span>
                  <span className="text-xs font-mono font-bold">
                    {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 p-5 space-y-3 min-h-[120px] max-h-64 overflow-y-auto custom-scrollbar">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <div className="text-sm font-black text-zinc-100 uppercase tracking-tight">
                        <span className="text-yellow-500 text-base mr-2">{item.quantity}×</span> {item.name}
                      </div>
                      {item.instructions && (
                        <div className="text-[10px] text-yellow-500/70 font-bold italic mt-1 bg-yellow-500/5 px-2 py-1 rounded border border-yellow-500/10">
                          NOTE: {item.instructions}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-black/40 border-t border-zinc-800 grid grid-cols-2 gap-2">
                {order.status === OrderStatus.PENDING ? (
                  <button 
                    onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
                    className="col-span-2 py-4 rounded-xl bg-yellow-500 text-black font-black uppercase text-xs tracking-widest hover:bg-yellow-400 transition-all active:scale-95 shadow-lg shadow-yellow-500/10"
                  >
                    Mark as Ready
                  </button>
                ) : (
                  <button 
                    onClick={() => onUpdateStatus(order.id, OrderStatus.SERVED)}
                    className="col-span-2 py-4 rounded-xl bg-green-500 text-black font-black uppercase text-xs tracking-widest hover:bg-green-400 transition-all active:scale-95 shadow-lg shadow-green-500/10"
                  >
                    Served & Clear
                  </button>
                )}
                
                {/* Void Button - Specifically for payment issues or cancellations */}
                <button 
                  onClick={() => {
                    if(confirm(`VOID TOKEN #${order.tokenNumber}?\n\nUse this only if payment failed or the order was cancelled. This will remove the record from active sales totals.`)) {
                      onUpdateStatus(order.id, OrderStatus.VOIDED);
                    }
                  }}
                  className="py-2.5 rounded-xl bg-zinc-800 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-500/10 border border-zinc-700 transition-all"
                >
                  Void Token
                </button>

                <button 
                  onClick={() => onUpdateStatus(order.id, order.status === OrderStatus.READY ? OrderStatus.PENDING : OrderStatus.READY)}
                  className="py-2.5 rounded-xl bg-zinc-800 text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:text-white border border-zinc-700 transition-all"
                >
                  {order.status === OrderStatus.READY ? 'Undo Ready' : 'Recall'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Styles for scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default OrderMonitor;
