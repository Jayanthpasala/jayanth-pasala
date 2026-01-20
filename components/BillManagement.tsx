
import React, { useState } from 'react';
import { SaleRecord, BillSettings } from '../types';

interface BillManagementProps {
  sales: SaleRecord[];
  setSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
  settings: BillSettings;
}

const BillManagement: React.FC<BillManagementProps> = ({ sales, setSales, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);

  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.tokenNumber.toString().includes(searchTerm) ||
    s.settledBy?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.timestamp - a.timestamp);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to void this bill? This will affect sales reports.')) {
      setSales(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleReprint = (sale: SaleRecord) => {
    const currencySymbol = "₹";
    const itemsHtml = sale.items.map(item => `
      <div class="item-row">
        <div class="item-name">
          <span>${item.quantity}x ${item.name}</span>
          ${item.instructions ? `<div class="item-note">Note: ${item.instructions}</div>` : ''}
        </div>
        <span class="item-total">${currencySymbol}${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { font-family: 'Courier New', Courier, monospace; width: 72mm; margin: 4mm auto; font-size: 12px; line-height: 1.2; color: #000; background: #fff; }
            .center { text-align: center; }
            .header { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
            .token-area { border: 3px solid #000; margin: 10px 0; padding: 10px; text-align: center; }
            .token-label { font-size: 14px; font-weight: bold; text-transform: uppercase; }
            .token-number { font-size: 48px; font-weight: 900; line-height: 1; margin: 5px 0; }
            .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .item-name { flex: 1; display: flex; flex-direction: column; }
            .item-note { font-size: 10px; font-style: italic; margin-left: 10px; }
            .item-total { width: 25mm; text-align: right; }
            .totals { font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; }
            .footer { margin-top: 20px; font-style: italic; font-size: 10px; }
            .copy-tag { margin-top: 5px; background: #eee; display: inline-block; padding: 2px 5px; font-size: 8px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center header">${settings.stallName.toUpperCase()}</div>
          <div class="center copy-tag">DUPLICATE RECEIPT</div>
          
          <div class="token-area">
            <div class="token-label">Token Number</div>
            <div class="token-number">#${sale.tokenNumber}</div>
          </div>

          <div class="center">Order #${sale.id}</div>
          <div class="center">Staff: ${sale.settledBy}</div>
          <div class="center">${new Date(sale.timestamp).toLocaleString()}</div>
          <div class="divider"></div>
          ${itemsHtml}
          <div class="divider"></div>
          <div class="item-row totals">
            <span>TOTAL PAID:</span>
            <span>${currencySymbol}${sale.total.toFixed(2)}</span>
          </div>
          <div class="item-row" style="margin-top: 5px;">
            <span>Payment Mode:</span>
            <span>${sale.paymentMethod}</span>
          </div>
          <div class="divider"></div>
          <div class="center footer">${settings.footerMessage}</div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

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
                      onClick={() => handleReprint(sale)}
                      className="text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-colors"
                    >
                      Print
                    </button>
                    <button 
                      onClick={() => handleDelete(sale.id)}
                      className="text-[10px] font-black uppercase text-red-500/50 hover:text-red-500 transition-colors"
                    >
                      Void
                    </button>
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
               <button 
                onClick={() => { handleReprint(selectedSale); setSelectedSale(null); }}
                className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-yellow-500 transition-colors active:scale-95 shadow-lg"
               >
                 Reprint Receipt
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillManagement;
