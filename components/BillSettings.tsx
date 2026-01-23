
import React, { useState } from 'react';
import { BillSettings, WorkerAccount, PrinterStatus } from '../types';

interface BillSettingsProps {
  settings: BillSettings;
  setSettings: (val: BillSettings) => void;
  openingCash: number;
  setOpeningCash: (val: number) => void;
  connectedPrinterName?: string;
  printerStatus?: PrinterStatus;
  currentTerminalName?: string;
  onUpdateTerminalName?: (name: string) => void;
}

const BillSettingsView: React.FC<BillSettingsProps> = ({ 
  settings, 
  setSettings, 
  openingCash, 
  setOpeningCash,
  connectedPrinterName,
  printerStatus,
  currentTerminalName,
  onUpdateTerminalName
}) => {
  const [newWorker, setNewWorker] = useState({ name: '', email: '' });
  const [editingTerminal, setEditingTerminal] = useState(currentTerminalName || '');

  const addWorker = () => {
    if (!newWorker.name || !newWorker.email) return;
    setSettings({
      ...settings,
      workerAccounts: [...settings.workerAccounts, { ...newWorker }]
    });
    setNewWorker({ name: '', email: '' });
  };

  const removeWorker = (email: string) => {
    setSettings({
      ...settings,
      workerAccounts: settings.workerAccounts.filter(w => w.email !== email)
    });
  };

  const updateTerminal = () => {
    if (onUpdateTerminalName) onUpdateTerminalName(editingTerminal);
  };

  const handleTestPrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=400');
    if (printWindow) {
      printWindow.document.write(`
        <html><body style="font-family:monospace; text-align:center; padding:20px;">
          <h2>DIAGNOSTIC TEST</h2>
          <hr/>
          <p>STALL: ${settings.stallName}</p>
          <p>TERMINAL: ${currentTerminalName}</p>
          <hr/>
          <p>${new Date().toLocaleString()}</p>
          <p>PRINTER: WIRELESS/HOTSPOT READY</p>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
        <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
        Business Configuration
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-8 shadow-2xl">
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-800 pb-2">Hardware & Local Identity</h3>
            
            <div className="bg-black/40 p-5 rounded-2xl border border-zinc-800 space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Rename This Terminal (e.g. Counter 1)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={editingTerminal}
                      onChange={e => setEditingTerminal(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-white font-black uppercase text-xs"
                      placeholder="Terminal Name"
                    />
                    <button onClick={updateTerminal} className="bg-zinc-800 text-white px-4 rounded-xl text-[10px] font-black uppercase hover:bg-zinc-700">Save</button>
                  </div>
               </div>
            </div>

            <div className="bg-black/40 p-5 rounded-2xl border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-white tracking-widest">Wireless Printer</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] font-black text-green-500 uppercase">HOTSPOT SPOOLER READY</span>
                    </div>
                 </div>
                 <button onClick={handleTestPrint} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-[9px] font-black uppercase text-white border border-zinc-700">Test Print</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Opening Cash (₹)</label>
                  <input 
                    type="number"
                    value={openingCash}
                    onChange={e => setOpeningCash(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-6 py-4 text-2xl font-mono text-green-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Tax (%)</label>
                  <input 
                    type="number"
                    value={settings.taxRate}
                    onChange={e => setSettings({...settings, taxRate: parseFloat(e.target.value) || 0})}
                    className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-6 py-4 text-2xl font-mono text-yellow-500 focus:outline-none"
                  />
                </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-8 shadow-2xl">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-800 pb-2">Global Stall Branding</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Stall Name</label>
                <input 
                  type="text"
                  value={settings.stallName}
                  onChange={e => setSettings({...settings, stallName: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Receipt Footer</label>
                <textarea 
                  rows={2}
                  value={settings.footerMessage}
                  onChange={e => setSettings({...settings, footerMessage: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Active Staff</h3>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Staff Name"
                value={newWorker.name}
                onChange={e => setNewWorker({...newWorker, name: e.target.value})}
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs"
              />
              <button 
                onClick={addWorker}
                className="bg-yellow-500 text-black font-black uppercase text-[10px] px-4 rounded-xl"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillSettingsView;
