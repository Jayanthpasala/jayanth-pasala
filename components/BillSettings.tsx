
import React, { useState } from 'react';
import { BillSettings, WorkerAccount } from '../types';

interface BillSettingsProps {
  settings: BillSettings;
  setSettings: React.Dispatch<React.SetStateAction<BillSettings>>;
  openingCash: number;
  setOpeningCash: (val: number) => void;
  onPairPrinter?: () => void;
  connectedPrinterName?: string;
}

const BillSettingsView: React.FC<BillSettingsProps> = ({ 
  settings, 
  setSettings, 
  openingCash, 
  setOpeningCash,
  onPairPrinter,
  connectedPrinterName
}) => {
  const [newWorker, setNewWorker] = useState({ name: '', email: '' });

  const addWorker = () => {
    if (!newWorker.name || !newWorker.email) return;
    setSettings(prev => ({
      ...prev,
      workerAccounts: [...prev.workerAccounts, { ...newWorker }]
    }));
    setNewWorker({ name: '', email: '' });
  };

  const removeWorker = (email: string) => {
    setSettings(prev => ({
      ...prev,
      workerAccounts: prev.workerAccounts.filter(w => w.email !== email)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
        <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
        Admin Settings
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Configuration */}
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-800 pb-2">Hardware & Tax</h3>
            
            {/* Printer Toggle */}
            <div className="bg-black/40 p-5 rounded-2xl border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase text-white tracking-widest">Printer Software</p>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Enable Print Interface</p>
                 </div>
                 <button 
                  onClick={() => setSettings({...settings, printerEnabled: !settings.printerEnabled})}
                  className={`w-14 h-8 rounded-full transition-all relative ${settings.printerEnabled ? 'bg-green-500' : 'bg-zinc-800'}`}
                 >
                   <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${settings.printerEnabled ? 'left-7' : 'left-1'}`}></div>
                 </button>
              </div>

              {settings.printerEnabled && (
                <div className="pt-4 border-t border-zinc-800/50 space-y-3">
                  <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Hardware ID</span>
                      <span className="text-xs font-black text-white">{connectedPrinterName || 'No Device'}</span>
                    </div>
                    <button 
                      onClick={onPairPrinter}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white text-[9px] font-black uppercase px-3 py-2 rounded-lg border border-zinc-700 transition-all flex items-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      Pair New
                    </button>
                  </div>
                  <p className="text-[8px] text-zinc-600 font-bold uppercase text-center tracking-[0.2em]">WebUSB Thermal Protocol Active</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Opening Cash (₹)</label>
                  <input 
                    type="number"
                    value={openingCash}
                    onChange={e => setOpeningCash(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-6 py-4 text-2xl font-mono text-green-500 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Tax Rate (%)</label>
                  <input 
                    type="number"
                    value={settings.taxRate}
                    onChange={e => setSettings({...settings, taxRate: parseFloat(e.target.value) || 0})}
                    className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-6 py-4 text-2xl font-mono text-yellow-500 focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-800 pb-2">Branding</h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Stall Name</label>
              <input 
                type="text"
                value={settings.stallName}
                onChange={e => setSettings({...settings, stallName: e.target.value})}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Receipt Footer</label>
              <textarea 
                rows={2}
                value={settings.footerMessage}
                onChange={e => setSettings({...settings, footerMessage: e.target.value})}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-yellow-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Staff Management */}
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-6 shadow-2xl">
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-800 pb-2">Staff Access Control</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <input 
                type="text"
                placeholder="Staff Member Name"
                value={newWorker.name}
                onChange={e => setNewWorker({...newWorker, name: e.target.value})}
                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none"
              />
              <input 
                type="email"
                placeholder="Staff Email ID"
                value={newWorker.email}
                onChange={e => setNewWorker({...newWorker, email: e.target.value})}
                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none"
              />
              <button 
                onClick={addWorker}
                className="bg-yellow-500 text-black font-black uppercase text-[10px] tracking-widest py-3 rounded-xl hover:bg-yellow-400"
              >
                Add Staff Member
              </button>
            </div>
          </div>
          <div className="space-y-3 mt-6">
            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Active Staff Accounts</p>
            <div className="divide-y divide-zinc-800">
              {settings.workerAccounts.map((worker) => (
                <div key={worker.email} className="py-3 flex justify-between items-center group">
                  <div>
                    <p className="text-sm font-bold text-white">{worker.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{worker.email}</p>
                  </div>
                  <button 
                    onClick={() => removeWorker(worker.email)}
                    className="text-red-500 text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillSettingsView;
