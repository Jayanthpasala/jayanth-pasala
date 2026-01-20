
import React from 'react';
import { SaleRecord, PaymentMethod, OrderStatus } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface SalesReportProps {
  sales: SaleRecord[];
  openingCash: number;
}

const SalesReport: React.FC<SalesReportProps> = ({ sales, openingCash }) => {
  // Only count sales that aren't VOIDED
  const validSales = sales.filter(s => s.status !== OrderStatus.VOIDED);
  const totalRevenue = validSales.reduce((acc, s) => acc + s.total, 0);
  const totalOrders = validSales.length;
  const voidedCount = sales.filter(s => s.status === OrderStatus.VOIDED).length;
  
  const revenueByMethod = validSales.reduce((acc, s) => {
    acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.total;
    return acc;
  }, {} as Record<PaymentMethod, number>);

  // Cash Flow Calculations
  const cashSales = validSales.filter(s => s.paymentMethod === PaymentMethod.CASH);
  const totalCashReceived = cashSales.reduce((acc, s) => acc + (s.cashReceived || s.total), 0);
  const totalChangeGiven = cashSales.reduce((acc, s) => acc + (s.cashChange || 0), 0);
  const netCashFromSales = totalCashReceived - totalChangeGiven;
  const expectedDrawerCash = openingCash + netCashFromSales;

  const chartData = validSales.slice(-10).map((s) => ({
    name: `#${s.id.slice(-4)}`,
    revenue: s.total,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Performance Metrics</h2>
        {voidedCount > 0 && (
          <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-3 py-1 rounded-full border border-red-500/20">
            {voidedCount} VOIDED ORDERS EXCLUDED
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Total Gross Revenue</p>
          <h3 className="text-5xl font-black text-yellow-500 tracking-tighter">₹{totalRevenue.toFixed(2)}</h3>
        </div>
        
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Expected Cash in Drawer</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black text-green-500 tracking-tighter">₹{expectedDrawerCash.toFixed(2)}</h3>
            <span className="text-[10px] text-zinc-600 font-bold uppercase">(Incl. Opening)</span>
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Avg. Ticket Size</p>
          <h3 className="text-5xl font-black text-white tracking-tighter">
            ₹{totalOrders ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}
          </h3>
        </div>
      </div>

      {/* Cash Drawer Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
             <p className="text-xs font-black uppercase text-zinc-400 tracking-widest">Cash Drawer Audit</p>
             <div className="px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700">
                <span className="text-[9px] font-black text-green-500 uppercase">Live Tracking</span>
             </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
              <span className="text-sm font-bold text-zinc-500 uppercase">Opening Balance</span>
              <span className="text-xl font-black text-white">₹{openingCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
              <span className="text-sm font-bold text-zinc-500 uppercase">Total Cash Inflow (Sales)</span>
              <span className="text-xl font-black text-green-400">+ ₹{totalCashReceived.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
              <span className="text-sm font-bold text-zinc-500 uppercase">Total Change Outflow</span>
              <span className="text-xl font-black text-red-400">- ₹{totalChangeGiven.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-4 bg-black/30 px-4 rounded-2xl border border-zinc-800 mt-4">
              <span className="text-sm font-black text-yellow-500 uppercase">Net Cash in Drawer</span>
              <span className="text-3xl font-black text-yellow-500">₹{expectedDrawerCash.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl">
            <p className="text-[10px] font-black uppercase text-zinc-500 mb-4 tracking-widest">Revenue by Payment Mode</p>
            <div className="grid grid-cols-1 gap-3">
              {[PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.CARD].map(method => (
                <div key={method} className="bg-black/40 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center hover:bg-black/60 transition-colors">
                  <span className="text-xs font-black text-zinc-400 uppercase tracking-tighter">{method}</span>
                  <div className="text-2xl font-black text-white">₹{(revenueByMethod[method] || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden flex flex-col shadow-2xl">
          <div className="p-4 bg-zinc-800/50 border-b border-zinc-800 flex justify-between items-center">
            <h4 className="text-xs font-black uppercase text-zinc-400">Transaction History</h4>
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Showing last {Math.min(validSales.length, 20)} valid sales</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500">
                  <th className="p-4">Time</th>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {validSales.slice().reverse().map(sale => (
                  <tr key={sale.id} className="border-b border-zinc-800 hover:bg-zinc-800/20">
                    <td className="p-4 text-xs font-mono text-zinc-400">
                      {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-bold">#{sale.id}</td>
                    <td className="p-4">
                      <span className="text-[9px] font-black bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 uppercase">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-yellow-500">₹{sale.total.toFixed(2)}</td>
                  </tr>
                ))}
                {validSales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-zinc-700 uppercase italic font-bold">No sales recorded yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col gap-6">
           <h4 className="text-xs font-black uppercase text-zinc-400">Revenue Trend (Last 10 Orders)</h4>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '12px'}}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#eab308" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
           </div>
           <div className="mt-auto p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700">
              <p className="text-xs text-zinc-400">Financial data is stored securely in current session memory. Use "Admin" role to update opening balances in Bill Settings.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
