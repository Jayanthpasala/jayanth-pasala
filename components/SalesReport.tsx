
import React, { useState, useMemo } from 'react';
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
  onUpdateOpeningCash?: (val: number) => void;
}

const SalesReport: React.FC<SalesReportProps> = ({ sales, openingCash, onUpdateOpeningCash }) => {
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [tempCash, setTempCash] = useState(openingCash.toString());
  
  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Only count sales that aren't VOIDED for general metrics
  const validSales = useMemo(() => sales.filter(s => s.status !== OrderStatus.VOIDED), [sales]);
  
  // Filtered Sales for the History Table
  const filteredHistory = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch = s.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.tokenNumber.toString().includes(searchQuery) ||
                          s.settledBy?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const saleDate = new Date(s.timestamp).toISOString().split('T')[0];
      const matchesFrom = fromDate ? saleDate >= fromDate : true;
      const matchesTo = toDate ? saleDate <= toDate : true;
      
      return matchesSearch && matchesFrom && matchesTo;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, searchQuery, fromDate, toDate]);

  const totalRevenue = validSales.reduce((acc, s) => acc + s.total, 0);
  const totalOrders = validSales.length;
  const voidedCount = sales.filter(s => s.status === OrderStatus.VOIDED).length;
  
  const revenueByMethod = validSales.reduce((acc, s) => {
    acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.total;
    return acc;
  }, {} as Record<PaymentMethod, number>);

  const revenueByStaff = validSales.reduce((acc, s) => {
    const staffName = s.settledBy || 'Unknown';
    acc[staffName] = (acc[staffName] || 0) + s.total;
    return acc;
  }, {} as Record<string, number>);

  const staffData = Object.entries(revenueByStaff).map(([name, revenue]) => ({
    name,
    revenue
  })).sort((a, b) => b.revenue - a.revenue);

  // Cash Flow Calculations
  const cashSales = validSales.filter(s => s.paymentMethod === PaymentMethod.CASH);
  // Fix: Ensure cashReceived and cashChange are treated as numbers during reduction
  const totalCashReceived = cashSales.reduce((acc, s) => acc + (Number(s.cashReceived) || s.total), 0);
  const totalChangeGiven = cashSales.reduce((acc, s) => acc + (Number(s.cashChange) || 0), 0);
  const netCashFromSales = totalCashReceived - totalChangeGiven;
  const expectedDrawerCash = openingCash + netCashFromSales;

  const chartData = validSales.slice(-10).map((s) => ({
    name: `#${s.id.slice(-4)}`,
    revenue: s.total,
  }));

  const handleSaveCash = () => {
    const val = parseFloat(tempCash) || 0;
    if (onUpdateOpeningCash) {
      onUpdateOpeningCash(val);
    }
    setIsEditingCash(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
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
        
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex flex-col justify-center shadow-xl relative overflow-hidden">
          <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Expected Cash in Drawer</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black text-green-500 tracking-tighter">₹{expectedDrawerCash.toFixed(2)}</h3>
          </div>
          <button 
            onClick={() => { setIsEditingCash(true); setTempCash(openingCash.toString()); }}
            className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all border border-zinc-700"
            title="Adjust Opening Balance"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
        </div>

        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Avg. Ticket Size</p>
          <h3 className="text-5xl font-black text-white tracking-tighter">
            ₹{totalOrders ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}
          </h3>
        </div>
      </div>

      {/* Staff and Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
             <p className="text-xs font-black uppercase text-zinc-400 tracking-widest">Revenue by Staff Member</p>
             <span className="text-[9px] font-black text-yellow-500 uppercase bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">Contribution</span>
          </div>
          
          <div className="space-y-4">
            {staffData.length > 0 ? staffData.map((staff, idx) => (
              <div key={staff.name} className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center bg-zinc-800 rounded text-[10px] font-black text-zinc-500">{idx + 1}</span>
                    <span className="text-sm font-bold text-white uppercase">{staff.name}</span>
                  </div>
                  {/* Fix: revenue is a number, toFixed is safe */}
                  <span className="text-lg font-black text-yellow-500">₹{Number(staff.revenue).toFixed(2)}</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-full rounded-full" 
                    // Fix: Ensure arithmetic on totalRevenue and revenue is treated correctly
                    style={{ width: `${(Number(staff.revenue) / (totalRevenue || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-center text-zinc-600 text-xs italic py-4">No staff activity yet</p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl space-y-6">
            <p className="text-xs font-black uppercase text-zinc-400 tracking-widest">Revenue by Payment Mode</p>
            <div className="grid grid-cols-1 gap-3">
              {[PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.CARD].map(method => {
                const amount = revenueByMethod[method] || 0;
                return (
                  <div key={method} className="bg-black/40 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center hover:bg-black/60 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{method}</span>
                      <span className="text-[9px] text-zinc-600 font-bold uppercase">{((amount / (totalRevenue || 1)) * 100).toFixed(0)}% of total</span>
                    </div>
                    <div className="text-2xl font-black text-white">₹{amount.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
        </div>
      </div>

      {/* Advanced Past Orders Search Section */}
      <div className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 shadow-2xl space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Search Past Orders</h3>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Audit historical data & filter by date</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 max-w-4xl">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-600 uppercase ml-2">From Date</label>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-600 uppercase ml-2">To Date</label>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-600 uppercase ml-2">Global Search</label>
              <input 
                type="text" 
                placeholder="ID, Token, or Staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Result Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
           <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50">
             <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Results Found</p>
             <p className="text-xl font-black text-white">{filteredHistory.length}</p>
           </div>
           <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50">
             <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Filtered Revenue</p>
             <p className="text-xl font-black text-yellow-500">₹{filteredHistory.filter(s => s.status !== OrderStatus.VOIDED).reduce((a, b) => a + b.total, 0).toFixed(2)}</p>
           </div>
           <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50">
             <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">UPI Portion</p>
             <p className="text-xl font-black text-blue-400">₹{filteredHistory.filter(s => s.paymentMethod === PaymentMethod.UPI && s.status !== OrderStatus.VOIDED).reduce((a, b) => a + b.total, 0).toFixed(2)}</p>
           </div>
           <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50">
             <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Cash Portion</p>
             <p className="text-xl font-black text-green-400">₹{filteredHistory.filter(s => s.paymentMethod === PaymentMethod.CASH && s.status !== OrderStatus.VOIDED).reduce((a, b) => a + b.total, 0).toFixed(2)}</p>
           </div>
        </div>

        <div className="bg-black/20 rounded-2xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-800/30 text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                <th className="p-4">Date & Time</th>
                <th className="p-4">Token</th>
                <th className="p-4">ID</th>
                <th className="p-4">Staff</th>
                <th className="p-4">Method</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredHistory.length > 0 ? filteredHistory.map(sale => (
                <tr key={sale.id} className={`hover:bg-white/5 transition-colors ${sale.status === OrderStatus.VOIDED ? 'opacity-40 grayscale italic' : ''}`}>
                  <td className="p-4 text-xs font-mono text-zinc-400">
                    {new Date(sale.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="p-4">
                    <span className="font-black text-white">#{sale.tokenNumber}</span>
                  </td>
                  <td className="p-4 text-[10px] font-black text-zinc-500 uppercase">{sale.id}</td>
                  <td className="p-4 text-xs font-bold text-zinc-300 uppercase">{sale.settledBy}</td>
                  <td className="p-4">
                    <span className="text-[9px] font-black uppercase bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">{sale.paymentMethod}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`text-sm font-black ${sale.status === OrderStatus.VOIDED ? 'text-zinc-600' : 'text-white'}`}>₹{sale.total.toFixed(2)}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <p className="text-zinc-600 font-black uppercase text-[10px] tracking-widest">No matching history found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cash Drawer Reconciliation */}
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
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-white">₹{openingCash.toFixed(2)}</span>
              </div>
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

        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col gap-6">
           <h4 className="text-xs font-black uppercase text-zinc-400">Revenue Trend (Last 10 Orders)</h4>
           <div className="h-[250px] w-full">
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
        </div>
      </div>

      {/* Cash Edit Modal */}
      {isEditingCash && (
        <div className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Adjust Drawer</h3>
                <p className="text-xs text-zinc-500 font-bold uppercase">Update Opening Cash / Base Balance</p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-green-500 text-2xl font-black">₹</div>
                  <input 
                    type="number"
                    autoFocus
                    value={tempCash}
                    onChange={(e) => setTempCash(e.target.value)}
                    className="w-full bg-black border-2 border-zinc-800 rounded-2xl pl-12 pr-6 py-5 text-3xl font-black text-white focus:outline-none focus:border-green-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setIsEditingCash(false)}
                    className="py-4 rounded-xl bg-zinc-800 text-zinc-400 font-black uppercase text-[10px] tracking-widest hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveCash}
                    className="py-4 rounded-xl bg-green-500 text-black font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-500/20"
                  >
                    Update Cash
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReport;
