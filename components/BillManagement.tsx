
import React, { useState } from 'react';
import { SaleRecord, BillSettings } from '../types';

interface BillManagementProps {
  sales: SaleRecord[];
  settings: BillSettings;
  onReprint: (sale: SaleRecord) => void;
  onPhysicalPrint: (sale: SaleRecord) => void;
}

const BillManagement: React.FC<BillManagementProps> = ({ sales, settings, onReprint, onPhysicalPrint }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);

  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.tokenNumber.toString().includes(searchTerm) ||
    s.settledBy?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Bill Ledger</h2>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search Token, Bill ID or Staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-4 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden flex flex-col shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-800/50 border-b border-zinc-800">
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500">Token</th>
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500">Staff</th>
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500">Bill Code</th>
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500">Method</th>
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500 text-right">Amount</th>
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="bg-yellow-500 text-black w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-yellow-500/10">
                      #{sale.tokenNumber}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-bold text-white uppercase tracking-tight">{sale.settledBy}</div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      {new Date(sale.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-zinc-300 tracking-wider text-sm">{sale.id}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-[9px] font-black bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 uppercase">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-yellow-500">
                    ₹{sale.total.toFixed(2)}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => setSelectedSale(sale)}
                      className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Details
                    </button>
                    <button 
                      onClick={() => onReprint(sale)}
                      className="text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-colors"
                    >
                      Print
                    </button>
                    {settings.printerEnabled && (
                      <button 
                        onClick={() => onPhysicalPrint(sale)}
                        className="text-[10px] font-black uppercase text-yellow-500/50 hover:text-yellow-500 transition-colors"
                      >
                        Physical
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="text-zinc-700 font-black uppercase tracking-widest italic">No matching bills found</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/30">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-black font-black text-2xl shadow-xl shadow-yellow-500/10">
                   #{selectedSale.tokenNumber}
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-widest">{selectedSale.id}</h3>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-zinc-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedSale.items.map((item, idx) => (
                <div key={idx} className="flex flex-col py-3 border-b border-zinc-800/50">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm uppercase text-white">{item.name}</span>
                    <span className="font-mono text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Qty: {item.quantity} × ₹{item.price}</span>
                  </div>
                  {item.instructions && (
                    <div className="mt-2 text-[11px] text-yellow-500/80 italic bg-yellow-500/5 p-2 rounded-lg border border-yellow-500/10">
                      Note: {item.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-6 bg-black/20 space-y-4 border-t border-zinc-800">
               <div className="flex justify-between text-zinc-500 uppercase font-black text-[10px] tracking-widest">
                  <span>Settled By</span>
                  <span className="text-white">{selectedSale.settledBy}</span>
               </div>
               <div className="flex justify-between text-zinc-500 uppercase font-black text-[10px] tracking-widest">
                  <span>Payment Type</span>
                  <span>{selectedSale.paymentMethod}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xl font-black uppercase">Final Total</span>
                  <span className="text-2xl font-black text-yellow-500">₹{selectedSale.total.toFixed(2)}</span>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => { onReprint(selectedSale); setSelectedSale(null); }}
                  className="bg-white text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-colors shadow-lg"
                 >
                   Browser Print
                 </button>
                 {settings.printerEnabled && (
                   <button 
                    onClick={() => { onPhysicalPrint(selectedSale); setSelectedSale(null); }}
                    className="bg-yellow-500 text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-yellow-400 transition-colors shadow-lg"
                   >
                     Physical Print
                   </button>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillManagement;
