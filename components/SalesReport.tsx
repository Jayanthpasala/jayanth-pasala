import React, { useState, useMemo } from 'react';
import { SaleRecord, PaymentMethod, OrderStatus } from '../types.ts';
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

const SalesReport: React.FC<SalesReportProps> = ({ sales = [], openingCash, onUpdateOpeningCash }) => {
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [tempCash, setTempCash] = useState(openingCash.toString());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const validSales = useMemo(() => sales.filter(s => s && s.status !== OrderStatus.VOIDED), [sales]);
  
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (!s) return false;
      const matchesSearch = s.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.tokenNumber?.toString().includes(searchQuery) ||
                          s.settledBy?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const saleDate = new Date(s.timestamp).toISOString().split('T')[0];
      const matchesFrom = fromDate ? saleDate >= fromDate : true;
      const matchesTo = toDate ? saleDate <= toDate : true;
      
      return matchesSearch && matchesFrom && matchesTo;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, searchQuery, fromDate, toDate]);

  const validFilteredSales = useMemo(() => filteredSales.filter(s => s.status !== OrderStatus.VOIDED), [filteredSales]);

  const itemStats = useMemo(() => {
    const stats: Record<string, { name: string, qty: number, revenue: number, category: string }> = {};
    validFilteredSales.forEach(sale => {
      sale.items?.forEach(item => {
        if (!stats[item.id]) {
          stats[item.id] = { name: item.name, qty: 0, revenue: 0, category: item.category };
        }
        stats[item.id].qty += item.quantity || 0;
        stats[item.id].revenue += ((item.price || 0) * (item.quantity || 0));
      });
    });
    return Object.values(stats).sort((a, b) => Number(b.revenue) - Number(a.revenue));
  }, [validFilteredSales]);

  const totalRevenue = validSales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalOrders = validSales.length;
  
  const revenueByMethod = validSales.reduce((acc, s) => {
    if (s.paymentMethod) {
      acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + (s.total || 0);
    }
    return acc;
  }, {} as Record<PaymentMethod, number>);

  const cashSales = validSales.filter(s => s.paymentMethod === PaymentMethod.CASH);
  const netCashFromSales = cashSales.reduce((acc, s) => acc + ((s.cashReceived || s.total || 0) - (s.cashChange || 0)), 0);
  const expectedDrawerCash = openingCash + netCashFromSales;

  const chartData = validSales.slice(-10).map((s) => ({
    name: `#${s.tokenNumber || '?' }`,
    revenue: s.total || 0,
  }));

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-600 space-y-4">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <p className="font-black uppercase tracking-widest text-sm">No sales data recorded yet</p>
        <p className="text-xs font-bold opacity-60">Complete an order to see metrics here</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Performance Metrics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl">
          <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Total Gross Revenue</p>
          <h3 className="text-5xl font-black text-yellow-500 tracking-tighter">₹{totalRevenue.toFixed(2)}</h3>
        </div>
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl relative">
          <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Expected Cash in Drawer</p>
          <h3 className="text-5xl font-black text-green-500 tracking-tighter">₹{expectedDrawerCash.toFixed(2)}</h3>
          <button onClick={() => setIsEditingCash(true)} className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
        </div>
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl">
          <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Total Orders</p>
          <h3 className="text-5xl font-black text-white tracking-tighter">{totalOrders}</h3>
        </div>
      </div>

      <div className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 shadow-2xl space-y-8">
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Product Ranking</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
          {itemStats.map((item, idx) => (
            <div key={idx} className="flex items-center gap-6 p-4 rounded-2xl bg-white/5">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-zinc-500 text-lg">{idx + 1}</div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-white uppercase">{item.name}</span>
                  <span className="text-lg font-black text-yellow-500">₹{item.revenue.toFixed(0)}</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(item.revenue / (itemStats[0].revenue || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl h-[300px]">
        <h4 className="text-xs font-black uppercase text-zinc-400 mb-4">Last 10 Orders Trend</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
            <Tooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px'}} />
            <Bar dataKey="revenue" fill="#eab308" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {isEditingCash && (
        <div className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2rem] p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-widest text-white text-center">Adjust Drawer</h3>
            <input type="number" value={tempCash} onChange={(e) => setTempCash(e.target.value)} className="w-full bg-black border-2 border-zinc-800 rounded-2xl py-5 text-3xl font-black text-white text-center" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setIsEditingCash(false)} className="py-4 rounded-xl bg-zinc-800 text-zinc-400 font-black uppercase text-[10px]">Cancel</button>
              <button onClick={() => { onUpdateOpeningCash?.(parseFloat(tempCash) || 0); setIsEditingCash(false); }} className="py-4 rounded-xl bg-green-500 text-black font-black uppercase text-[10px]">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReport;