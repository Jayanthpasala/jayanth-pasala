import React, { useMemo, useState } from 'react';
import { CartItem, BillSettings, PaymentMethod, PrinterStatus } from '../types.ts';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isFinishing, setIsFinishing] = useState(false);

  const subtotal = useMemo(() => items.reduce((acc, i) => acc + (i.price * i.quantity), 0), [items]);
  const total = useMemo(() => subtotal * (1 + settings.taxRate / 100), [subtotal, settings.taxRate]);
  
  const cashReceivedNum = useMemo(() => parseFloat(cashReceived) || 0, [cashReceived]);

  const cashChange = useMemo(() => {
    if (paymentMethod === PaymentMethod.CASH) {
      return Math.max(0, cashReceivedNum - total);
    }
    return 0;
  }, [paymentMethod, cashReceivedNum, total]);

  const finalizeOrder = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    
    // STRICT SANITIZATION: Ensure everything is a clean number
    const finalTotal = Number(total);
    const finalReceived = Number(cashReceivedNum);
    const finalChange = Number(cashChange);
    
    onComplete(
      finalTotal, 
      paymentMethod, 
      paymentMethod === PaymentMethod.CASH ? { received: finalReceived, change: finalChange } : undefined
    );

    // Reset local state
    setTimeout(() => {
      setShowConfirmModal(false);
      setCashReceived('');
      setIsFinishing(false);
    }, 150);
  };

  const isCompleteDisabled = useMemo(() => {
    if (items.length === 0) return true;
    if (paymentMethod === PaymentMethod.CASH) {
      if (!cashReceived || cashReceivedNum < total - 0.01) return true;
    }
    return false;
  }, [items.length, paymentMethod, cashReceived, cashReceivedNum, total]);

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
                      <span className="text-white font-black">{item.quantity}</span>
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

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(PaymentMethod).map((method) => (
                <button 
                  key={method} 
                  onClick={() => {
                    setPaymentMethod(method);
                    if (method !== PaymentMethod.CASH) setCashReceived('');
                  }} 
                  className={`py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${paymentMethod === method ? 'bg-yellow-500 border-white text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === PaymentMethod.CASH && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Cash Received</label>
              <input 
                type="number" 
                value={cashReceived} 
                onChange={(e) => setCashReceived(e.target.value)} 
                placeholder="Enter Cash..." 
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-white text-xl font-mono focus:border-yellow-500 outline-none transition-all shadow-inner" 
              />
            </div>
          )}

          <div className="pt-6 border-t border-zinc-800 space-y-3">
            <div className="flex justify-between items-center">
               <span className="text-[10px] font-black uppercase text-zinc-500">Subtotal</span>
               <span className="font-mono text-zinc-400">₹{subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-2xl font-black uppercase">
              <span>Payable</span>
              <span className="text-yellow-500">₹{total.toFixed(0)}</span>
            </div>
            {paymentMethod === PaymentMethod.CASH && cashReceived !== '' && cashReceivedNum >= total && (
              <div className="flex justify-between text-green-500 text-sm font-black uppercase bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                <span>Change to Return</span>
                <span>₹{cashChange.toFixed(0)}</span>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => setShowConfirmModal(true)}
          disabled={isCompleteDisabled}
          className={`w-full py-5 rounded-2xl font-black uppercase text-xl transition-all shadow-xl active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed ${
            settings.printerEnabled ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-white text-black hover:bg-zinc-200'
          }`}
        >
          {settings.printerEnabled ? 'Print Token' : 'Complete Order'}
        </button>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-zinc-800 w-full max-sm:max-w-xs max-w-sm rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-yellow-500/10 text-yellow-500">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
               </svg>
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Finalize Order?</h3>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                  Token #{orderNo} • Total ₹{total.toFixed(0)}
                </p>
             </div>
             
             <div className="grid grid-cols-1 gap-3">
                <button 
                  disabled={isFinishing}
                  onClick={finalizeOrder} 
                  className={`w-full py-5 rounded-2xl font-black uppercase text-sm shadow-xl transition-all bg-yellow-500 text-black hover:bg-yellow-400 ${isFinishing ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isFinishing ? 'Processing...' : 'Confirm & Finalize'}
                </button>
                <button 
                  disabled={isFinishing}
                  onClick={() => setShowConfirmModal(false)} 
                  className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black uppercase text-xs hover:text-white transition-all border border-zinc-700"
                >
                  Go Back
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentCart;