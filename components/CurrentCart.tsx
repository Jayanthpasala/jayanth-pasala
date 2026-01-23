
import React, { useMemo, useState } from 'react';
import { CartItem, BillSettings, PaymentMethod, PrinterStatus } from '../types';

interface CurrentCartProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, delta: number, instructions?: string) => void;
  onComplete: (total: number, paymentMethod: PaymentMethod, cashDetails?: { received: number, change: number }) => void;
  settings: BillSettings;
  orderNo: number; 
  printerStatus: PrinterStatus;
}

const CurrentCart: React.FC<CurrentCartProps> = ({ 
  items, onRemove, onUpdateQty, onComplete, settings, orderNo, printerStatus 
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [instructionEditId, setInstructionEditId] = useState<string | null>(null);
  const [tempInstruction, setTempInstruction] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  const subtotal = useMemo(() => items.reduce((acc, i) => acc + (i.price * i.quantity), 0), [items]);
  const discountAmount = useMemo(() => {
    if (discountType === 'percent') return subtotal * (discountValue / 100);
    return Math.min(discountValue, subtotal);
  }, [subtotal, discountValue, discountType]);

  const total = useMemo(() => (subtotal - discountAmount) * (1 + settings.taxRate / 100), [subtotal, discountAmount, settings.taxRate]);
  const cashChange = useMemo(() => (paymentMethod === PaymentMethod.CASH && typeof cashReceived === 'number') ? Math.max(0, cashReceived - total) : 0, [paymentMethod, cashReceived, total]);

  const executeFinalPrint = () => {
    const timestamp = new Date().toLocaleString();
    const itemsHtml = items.map(item => `
      <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
        <span style="flex:1;">${item.quantity}x ${item.name.toUpperCase()}</span>
        <span style="width:20mm; text-align:right;">₹${(item.price * item.quantity).toFixed(0)}</span>
      </div>
      ${item.instructions ? `<div style="font-size:10px; font-style:italic; margin-bottom:4px; padding-left:10px;">>> ${item.instructions.toUpperCase()}</div>` : ''}
    `).join('');

    const receiptHtml = `
      <html>
        <head>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { font-family: 'Courier New', monospace; width: 72mm; margin: 4mm auto; font-size: 13px; line-height: 1.1; color: #000; background: #fff; }
            .center { text-align: center; }
            .token { font-size: 48px; font-weight: 900; border: 3px solid #000; margin: 8px 0; padding: 5px; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .total { font-weight: bold; font-size: 16px; margin-top: 5px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="center" style="font-weight:bold; font-size:18px;">${settings.stallName.toUpperCase()}</div>
          <div class="center token">#${orderNo}</div>
          <div class="center">${timestamp}</div>
          <div class="divider"></div>
          ${itemsHtml}
          <div class="divider"></div>
          <div class="total center">TOTAL: ₹${total.toFixed(0)}</div>
          <div class="center" style="font-size:11px; margin-top:2px;">Paid via: ${paymentMethod}</div>
          <div class="divider"></div>
          <div class="center" style="font-size:10px;">${settings.footerMessage}</div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=350,height=500');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      onComplete(total, paymentMethod, paymentMethod === PaymentMethod.CASH ? { received: Number(cashReceived), change: cashChange } : undefined);
      setShowConfirmModal(false);
      setDiscountValue(0);
      setCashReceived('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-2xl font-black text-white uppercase flex items-center gap-2">
          <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
          Checkout Review
        </h2>
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500">Item</th>
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500 text-center">Qty</th>
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="p-4 font-bold text-white uppercase text-sm">{item.name}</td>
                  <td className="p-4 text-center font-mono">{item.quantity}</td>
                  <td className="p-4 text-right font-mono text-yellow-500">₹{(item.price * item.quantity).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-6">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block">Payment Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(PaymentMethod).map((method) => (
              <button key={method} onClick={() => setPaymentMethod(method)} className={`py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${paymentMethod === method ? 'bg-yellow-500 border-white text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>{method}</button>
            ))}
          </div>
        </div>

        {paymentMethod === PaymentMethod.CASH && (
          <input type="number" value={cashReceived} onChange={(e) => setCashReceived(parseFloat(e.target.value) || '')} placeholder="Cash Tendered..." className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-white text-xl font-mono" />
        )}

        <div className="pt-4 border-t border-zinc-800 space-y-2">
          <div className="flex justify-between text-2xl font-black uppercase">
            <span>Total</span>
            <span className="text-yellow-500">₹{total.toFixed(0)}</span>
          </div>
          {paymentMethod === PaymentMethod.CASH && cashReceived >= total && (
            <div className="flex justify-between text-green-500 text-sm font-black uppercase">
              <span>Change</span>
              <span>₹{cashChange.toFixed(0)}</span>
            </div>
          )}
        </div>

        <button 
          onClick={() => setShowConfirmModal(true)}
          disabled={items.length === 0 || (paymentMethod === PaymentMethod.CASH && (!cashReceived || cashReceived < total))}
          className="w-full py-5 rounded-2xl bg-yellow-500 text-black font-black uppercase text-xl disabled:bg-zinc-800 disabled:text-zinc-600"
        >
          Print Token
        </button>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-zinc-800 w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6">
             <h3 className="text-2xl font-black uppercase text-white">Finalize Order?</h3>
             <p className="text-zinc-500 font-bold uppercase text-xs">Token #{orderNo} • ₹{total.toFixed(0)}</p>
             <div className="grid grid-cols-1 gap-3">
                <button onClick={executeFinalPrint} className="w-full bg-green-500 text-black py-5 rounded-2xl font-black uppercase text-sm">Yes, Print & Save</button>
                <button onClick={() => setShowConfirmModal(false)} className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black uppercase text-xs">Go Back</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentCart;
