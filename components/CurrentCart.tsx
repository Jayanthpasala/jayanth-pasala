
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  const subtotal = useMemo(() => items.reduce((acc, i) => acc + (i.price * i.quantity), 0), [items]);
  const discountAmount = useMemo(() => {
    if (discountType === 'percent') return subtotal * (discountValue / 100);
    return Math.min(discountValue, subtotal);
  }, [subtotal, discountValue, discountType]);

  const total = useMemo(() => (subtotal - discountAmount) * (1 + settings.taxRate / 100), [subtotal, discountAmount, settings.taxRate]);
  const cashChange = useMemo(() => (paymentMethod === PaymentMethod.CASH && typeof cashReceived === 'number') ? Math.max(0, cashReceived - total) : 0, [paymentMethod, cashReceived, total]);

  const finalizeOrder = () => {
    onComplete(total, paymentMethod, paymentMethod === PaymentMethod.CASH ? { received: Number(cashReceived), change: cashChange } : undefined);
    setShowConfirmModal(false);
    setDiscountValue(0);
    setCashReceived('');
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
                  <td className="p-4 text-center font-mono">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => onUpdateQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-all">-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-all">+</button>
                    </div>
                  </td>
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
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Cash Received</label>
            <input type="number" value={cashReceived} onChange={(e) => setCashReceived(parseFloat(e.target.value) || '')} placeholder="₹ 0.00" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-white text-xl font-mono focus:border-yellow-500 outline-none transition-all" />
          </div>
        )}

        <div className="pt-4 border-t border-zinc-800 space-y-2">
          <div className="flex justify-between text-2xl font-black uppercase">
            <span>Total</span>
            <span className="text-yellow-500">₹{total.toFixed(0)}</span>
          </div>
          {paymentMethod === PaymentMethod.CASH && cashReceived >= total && (
            <div className="flex justify-between text-green-500 text-sm font-black uppercase">
              <span>Change Due</span>
              <span>₹{cashChange.toFixed(0)}</span>
            </div>
          )}
        </div>

        <button 
          onClick={() => setShowConfirmModal(true)}
          disabled={items.length === 0 || (paymentMethod === PaymentMethod.CASH && (!cashReceived || cashReceived < total))}
          className={`w-full py-5 rounded-2xl font-black uppercase text-xl transition-all shadow-xl active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-600 ${
            settings.printerEnabled ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-white text-black hover:bg-zinc-200'
          }`}
        >
          {settings.printerEnabled ? (settings.isPrintHub ? 'Print Local Token' : 'Send to Retsol Hub') : 'Complete Order'}
        </button>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-zinc-800 w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6">
             <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${settings.printerEnabled ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 {settings.printerEnabled 
                   ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                   : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                 }
               </svg>
             </div>
             <h3 className="text-2xl font-black uppercase text-white">
               {settings.printerEnabled ? 'Print & Complete?' : 'Confirm Order?'}
             </h3>
             <p className="text-zinc-500 font-bold uppercase text-xs">
               Token #{orderNo} • Total ₹{total.toFixed(0)}
               {!settings.isPrintHub && settings.printerEnabled && <span className="block mt-1 text-blue-500">(Sending to Hub Terminal)</span>}
             </p>
             <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={finalizeOrder} 
                  className={`w-full py-5 rounded-2xl font-black uppercase text-sm shadow-xl transition-all ${
                    settings.printerEnabled ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-green-500 text-black hover:bg-green-400'
                  }`}
                >
                  Confirm & Finalize
                </button>
                <button onClick={() => setShowConfirmModal(false)} className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black uppercase text-xs hover:text-white transition-all">Cancel</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentCart;
