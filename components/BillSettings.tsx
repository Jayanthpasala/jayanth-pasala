
import React, { useState } from 'react';
import { BillSettings, WorkerAccount } from '../types';

interface BillSettingsProps {
  settings: BillSettings;
  setSettings: React.Dispatch<React.SetStateAction<BillSettings>>;
  openingCash: number;
  setOpeningCash: (val: number) => void;
}

const BillSettingsView: React.FC<BillSettingsProps> = ({ settings, setSettings, openingCash, setOpeningCash }) => {
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
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-800 pb-2">Shift & Tax</h3>
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
              {settings.workerAccounts.length === 0 && (
                <p className="py-4 text-center text-zinc-600 text-xs italic">No staff members added yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillSettingsView;
