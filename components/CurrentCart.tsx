
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
    if (discountType === 'percent') {
      return subtotal * (discountValue / 100);
    }
    return Math.min(discountValue, subtotal);
  }, [subtotal, discountValue, discountType]);

  const discountedSubtotal = subtotal - discountAmount;
  const tax = useMemo(() => discountedSubtotal * (settings.taxRate / 100), [discountedSubtotal, settings.taxRate]);
  const total = useMemo(() => discountedSubtotal + tax, [discountedSubtotal, tax]);

  const cashChange = useMemo(() => {
    if (paymentMethod === PaymentMethod.CASH && typeof cashReceived === 'number') {
      return Math.max(0, cashReceived - total);
    }
    return 0;
  }, [paymentMethod, cashReceived, total]);

  const handleOpenInstructions = (item: CartItem) => {
    setInstructionEditId(item.id);
    setTempInstruction(item.instructions || '');
  };

  const handleSaveInstructions = () => {
    if (instructionEditId) {
      onUpdateQty(instructionEditId, 0, tempInstruction);
      setInstructionEditId(null);
    }
  };

  const handleProcessOrder = () => {
    if (items.length === 0) return;
    if (paymentMethod === PaymentMethod.CASH && (cashReceived === '' || cashReceived < total)) {
      return;
    }
    setShowConfirmModal(true);
  };

  const executeFinalPrint = () => {
    const currencySymbol = "₹";
    const timestamp = new Date().toLocaleString();

    const customerItemsHtml = items.map(item => `
      <div class="item-row">
        <div class="item-name">
          <span>${item.quantity}x ${item.name}</span>
          ${item.instructions ? `<div class="item-note">Note: ${item.instructions}</div>` : ''}
        </div>
        <span class="item-total">${currencySymbol}${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    const kitchenItemsHtml = items.map(item => `
      <div class="item-row" style="font-size: 16px; font-weight: bold; border-bottom: 1px dashed #ccc; padding: 6px 0;">
        <span>${item.quantity} x ${item.name}</span>
      </div>
      ${item.instructions ? `<div style="font-size: 14px; font-weight: bold; margin: 4px 0 10px 10px; color: #000; border-left: 3px solid #000; padding-left: 5px;">>>> ${item.instructions.toUpperCase()}</div>` : ''}
    `).join('');

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 72mm; 
              margin: 4mm auto; 
              font-size: 12px; 
              line-height: 1.2;
              color: #000;
              background: #fff;
            }
            .center { text-align: center; }
            .header { font-weight: bold; font-size: 18px; margin-bottom: 2px; }
            .token-container {
              border: 4px solid #000;
              margin: 10px 0;
              padding: 10px;
              text-align: center;
            }
            .token-label { font-size: 14px; font-weight: bold; text-transform: uppercase; }
            .token-number { font-size: 64px; font-weight: 900; line-height: 1; margin: 5px 0; }
            .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .item-name { flex: 1; display: flex; flex-direction: column; }
            .item-note { font-size: 10px; font-style: italic; margin-left: 10px; }
            .item-total { width: 25mm; text-align: right; }
            .totals { font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; }
            .footer { margin-top: 20px; font-style: italic; font-size: 10px; }
            .page-break { page-break-after: always; border-bottom: 2px double #000; margin: 30px 0; padding-bottom: 10px; }
            .kot-header { background: #000; color: #fff; padding: 8px; font-size: 22px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="center kot-header">KITCHEN KOT</div>
          <div class="center header">${settings.stallName.toUpperCase()}</div>
          <div class="token-container">
            <div class="token-label">TOKEN NUMBER</div>
            <div class="token-number">#${orderNo}</div>
          </div>
          <div class="center">${timestamp}</div>
          <div class="divider"></div>
          <div style="margin-bottom: 10px;">${kitchenItemsHtml}</div>
          <div class="divider"></div>
          <div class="center" style="font-weight: bold; font-size: 14px;">*** KITCHEN COPY ***</div>
          
          <div class="page-break"></div>

          <div class="center header">${settings.stallName.toUpperCase()}</div>
          <div class="center" style="font-weight: bold;">CUSTOMER RECEIPT</div>
          <div class="token-container">
            <div class="token-label">TOKEN NUMBER</div>
            <div class="token-number">#${orderNo}</div>
          </div>
          <div class="center">${timestamp}</div>
          <div class="divider"></div>
          ${customerItemsHtml}
          <div class="divider"></div>
          <div class="item-row">
            <span>Subtotal:</span>
            <span>${currencySymbol}${subtotal.toFixed(2)}</span>
          </div>
          ${discountAmount > 0 ? `
          <div class="item-row">
            <span>Discount:</span>
            <span>-${currencySymbol}${discountAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="item-row totals">
            <span>GRAND TOTAL:</span>
            <span>${currencySymbol}${total.toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <div class="item-row" style="font-weight: bold;">
            <span>PAYMENT:</span>
            <span>${paymentMethod}</span>
          </div>
          ${paymentMethod === PaymentMethod.CASH && typeof cashReceived === 'number' ? `
          <div class="item-row">
            <span>Received:</span>
            <span>${currencySymbol}${cashReceived.toFixed(2)}</span>
          </div>
          <div class="item-row">
            <span>Change:</span>
            <span>${currencySymbol}${cashChange.toFixed(2)}</span>
          </div>
          ` : ''}
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
        onComplete(total, paymentMethod, paymentMethod === PaymentMethod.CASH ? { received: Number(cashReceived), change: cashChange } : undefined);
        setDiscountValue(0);
        setCashReceived('');
        setShowConfirmModal(false);
      }, 750);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
            Items In Order
          </h2>
          <div className="bg-yellow-500/10 border-2 border-yellow-500/50 px-6 py-2 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">ASSIGNED TOKEN</span>
            <span className="text-3xl font-black text-white">#{orderNo}</span>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-800/50 border-b border-zinc-800">
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500">Food Item</th>
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500 text-center">Qty</th>
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500 text-right">Price</th>
                <th className="p-4 text-[10px] font-black uppercase text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white uppercase text-sm tracking-tight">{item.name}</div>
                    {item.instructions && (
                       <div className="mt-1 text-[11px] text-yellow-500 italic bg-yellow-500/10 px-2 py-0.5 rounded-md w-fit">
                         Note: {item.instructions}
                       </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => onUpdateQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-bold">-</button>
                      <span className="font-mono text-lg w-6 text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-bold">+</button>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-yellow-500 font-bold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenInstructions(item)}
                        className="p-2 rounded-xl bg-zinc-800 hover:text-yellow-500 border border-zinc-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => onRemove(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
          <span className="w-2 h-8 bg-green-500 rounded-full"></span>
          Checkout
        </h2>
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-5 shadow-2xl">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block">Apply Discount</label>
            <div className="flex bg-zinc-800 p-1 rounded-xl gap-1">
              <button 
                onClick={() => setDiscountType('percent')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${discountType === 'percent' ? 'bg-zinc-600 text-white shadow-lg' : 'text-zinc-500'}`}
              >
                (%)
              </button>
              <button 
                onClick={() => setDiscountType('fixed')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${discountType === 'fixed' ? 'bg-zinc-600 text-white shadow-lg' : 'text-zinc-500'}`}
              >
                (₹)
              </button>
            </div>
            <input 
              type="number"
              min="0"
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder={`Enter ${discountType === 'percent' ? '%' : 'Amount'}...`}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 font-mono text-sm"
            />
          </div>

          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(PaymentMethod).map((method) => (
                <button
                  key={method}
                  onClick={() => {
                    setPaymentMethod(method);
                    if (method !== PaymentMethod.CASH) setCashReceived('');
                  }}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                    paymentMethod === method
                    ? 'bg-yellow-500 border-white text-black scale-105 z-10'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === PaymentMethod.CASH && (
            <div className="space-y-3 p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Amount Received</label>
                {typeof cashReceived === 'number' && cashReceived >= total && (
                   <span className="text-[10px] font-black text-green-400 uppercase">Enough Cash</span>
                )}
              </div>
              <input 
                type="number"
                autoFocus
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="Enter cash given..."
                className="w-full bg-black border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 font-mono text-xl"
              />
              {typeof cashReceived === 'number' && (
                <div className="pt-2 border-t border-blue-500/20 flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-400 uppercase">Return Change:</span>
                  <span className={`text-2xl font-black ${cashChange > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                    ₹{cashChange.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 pt-3 border-t border-zinc-800">
            <div className="flex justify-between text-zinc-400 text-xs font-black uppercase">
              <span>Subtotal</span>
              <span className="text-white font-mono">₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-500 text-xs font-black uppercase">
                <span>Discount</span>
                <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400 text-xs font-black uppercase">
              <span>Tax (${settings.taxRate}%)</span>
              <span className="text-white font-mono">₹{tax.toFixed(2)}</span>
            </div>
            <div className="pt-3 flex justify-between items-center">
              <div>
                <span className="text-xl font-black uppercase block">Total</span>
                {discountAmount > 0 && (
                  <span className="text-[10px] text-green-500 font-black uppercase bg-green-500/10 px-2 py-0.5 rounded">Saved ₹{discountAmount.toFixed(2)}</span>
                )}
              </div>
              <span className="text-4xl font-black text-yellow-500 tracking-tighter">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={items.length === 0 || (paymentMethod === PaymentMethod.CASH && (cashReceived === '' || cashReceived < total))}
            onClick={handleProcessOrder}
            className={`w-full py-6 rounded-2xl font-black text-xl uppercase tracking-widest transition-all active:scale-95 ${
              items.length > 0 && (paymentMethod !== PaymentMethod.CASH || (cashReceived !== '' && cashReceived >= total))
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 border-b-4 border-yellow-700' 
              : 'bg-zinc-800 text-zinc-600 grayscale cursor-not-allowed'
            }`}
          >
            {paymentMethod === PaymentMethod.CASH && cashReceived !== '' && cashReceived < total 
              ? `Short ₹${(total - (cashReceived || 0)).toFixed(2)}` 
              : 'Process Payment'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal with Printer Warning */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-zinc-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 text-yellow-500 mb-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black uppercase text-white tracking-tight">Confirm Order</h3>
                <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Token #{orderNo} • {paymentMethod}</p>
              </div>

              {printerStatus === PrinterStatus.OFFLINE && (
                <div className="bg-red-500/10 border-2 border-red-500/30 p-4 rounded-2xl flex items-center gap-4">
                  <div className="bg-red-500 text-white p-2 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Printer Disconnected</p>
                    <p className="text-[9px] text-zinc-400 font-bold">The receipt will not print. Proceed anyway?</p>
                  </div>
                </div>
              )}

              <div className="bg-black/40 rounded-3xl p-6 border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Bill</span>
                  <span className="text-xl font-black text-white">₹{total.toFixed(2)}</span>
                </div>
                {paymentMethod === PaymentMethod.CASH && (
                  <>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">Cash Received</span>
                      <span className="text-xl font-black text-green-400">₹{Number(cashReceived).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
                      <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Change to Return</span>
                      <span className="text-3xl font-black text-yellow-500">₹{cashChange.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={executeFinalPrint}
                  className="w-full bg-green-500 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-green-400 active:scale-95 transition-all shadow-lg shadow-green-500/20"
                >
                  {printerStatus === PrinterStatus.OFFLINE ? 'Confirm Without Printing' : 'Print & Finalize Token'}
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:text-white transition-all"
                >
                  Go Back & Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentCart;
