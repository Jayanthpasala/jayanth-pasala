
import React from 'react';
import { BillSettings } from '../types';

interface BillSettingsProps {
  settings: BillSettings;
  setSettings: React.Dispatch<React.SetStateAction<BillSettings>>;
  openingCash: number;
  setOpeningCash: (val: number) => void;
}

const BillSettingsView: React.FC<BillSettingsProps> = ({ settings, setSettings, openingCash, setOpeningCash }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
        <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
        Admin Settings
      </h2>
      
      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-8 shadow-2xl relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-800 pb-2">Shift Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Opening Cash Balance (₹)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-green-500 font-bold">₹</div>
                  <input 
                    type="number"
                    value={openingCash}
                    onChange={e => setOpeningCash(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black border-2 border-zinc-800 rounded-2xl pl-10 pr-6 py-4 text-2xl font-mono text-green-500 focus:outline-none focus:border-green-500/50 transition-all group-hover:border-zinc-700"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 italic px-1">This amount is used as the base for the Sales Report's drawer calculation.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Tax Percentage (%)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-yellow-500 font-bold">%</div>
                  <input 
                    type="number"
                    value={settings.taxRate}
                    onChange={e => setSettings({...settings, taxRate: parseFloat(e.target.value) || 0})}
                    className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-6 py-4 text-2xl font-mono text-yellow-500 focus:outline-none focus:border-yellow-500/50 transition-all group-hover:border-zinc-700"
                    placeholder="0"
                  />
                </div>
              </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-800 pb-2">Receipt Branding</h3>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Stall Display Name</label>
            <input 
              type="text"
              value={settings.stallName}
              onChange={e => setSettings({...settings, stallName: e.target.value})}
              className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-6 py-4 text-xl font-black text-white focus:outline-none focus:border-yellow-500 transition-all hover:border-zinc-700"
              placeholder="Enter Stall Name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Receipt Footer Message</label>
            <textarea 
              rows={3}
              value={settings.footerMessage}
              onChange={e => setSettings({...settings, footerMessage: e.target.value})}
              className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-yellow-500 transition-all resize-none hover:border-zinc-700"
              placeholder="Thank you for visiting!"
            />
          </div>
        </div>

        <div className="pt-4">
          <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700 flex items-start gap-4">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 flex-shrink-0">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h4 className="text-white text-xs font-black uppercase mb-1">Security Note</h4>
              <p className="text-zinc-500 text-[11px] leading-relaxed">Changes to the Opening Cash will reflect immediately in the Sales Report. Ensure the cash drawer matches this value before starting a new shift.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillSettingsView;
