
import React, { useState } from 'react';
import { BillSettings, PrinterStatus } from '../types';

interface BillSettingsProps {
  settings: BillSettings;
  setSettings: (val: BillSettings) => void;
  openingCash: number;
  setOpeningCash: (val: number) => void;
  connectedPrinterName?: string;
  printerStatus?: PrinterStatus;
  currentTerminalName?: string;
  onUpdateTerminalName?: (name: string) => void;
  onUpdatePrinter?: (name: string, status: PrinterStatus) => void;
}

const BillSettingsView: React.FC<BillSettingsProps> = ({ 
  settings, 
  setSettings, 
  openingCash, 
  setOpeningCash,
  connectedPrinterName,
  printerStatus,
  currentTerminalName,
  onUpdateTerminalName,
  onUpdatePrinter
}) => {
  const [newWorker, setNewWorker] = useState({ name: '', email: '' });
  const [editingTerminal, setEditingTerminal] = useState(currentTerminalName || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connError, setConnError] = useState('');

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

  // ROBUST BLUETOOTH CONNECTION LOGIC
  const connectBluetooth = async () => {
    setIsConnecting(true);
    setConnError('');
    
    if (!(navigator as any).bluetooth) {
      setConnError('Bluetooth not supported in this browser. Use Chrome or Edge.');
      setIsConnecting(false);
      return;
    }

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Retsol' },
          { namePrefix: 'TP82' },
          { namePrefix: 'Printer' },
          { namePrefix: 'BT-PRINTER' }
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] 
      });

      if (onUpdatePrinter) {
        onUpdatePrinter(device.name || 'RETSOL 82 UB', PrinterStatus.CONNECTED);
      }
    } catch (err: any) {
      console.error('Bluetooth Error:', err);
      if (err.name === 'NotFoundError') {
        setConnError('No printer selected. Ensure your Retsol is in pairing mode.');
      } else if (err.name === 'SecurityError') {
        setConnError('Bluetooth access blocked by browser security settings.');
      } else if (err.name === 'NotSupportedError') {
        setConnError('Bluetooth is disabled or not available on this device.');
      } else {
        setConnError(`Bluetooth Error: ${err.message || 'Check printer connection.'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // ROBUST USB CONNECTION LOGIC
  const connectUSB = async () => {
    setIsConnecting(true);
    setConnError('');

    if (!(navigator as any).usb) {
      setConnError('USB connection not supported in this browser. Use Chrome.');
      setIsConnecting(false);
      return;
    }

    try {
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      if (onUpdatePrinter) {
        onUpdatePrinter(device.productName || 'RETSOL USB', PrinterStatus.CONNECTED);
      }
    } catch (err: any) {
      console.error('USB Error:', err);
      if (err.name === 'NotFoundError') {
        setConnError('No USB device selected. Ensure the OTG cable is secure.');
      } else if (err.name === 'SecurityError') {
        setConnError('USB access denied. Check Android/Tablet permissions.');
      } else {
        setConnError(`USB Error: ${err.message || 'Check OTG cable and printer power.'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestPrint = () => {
    if (!settings.printerEnabled) return;
    const printWindow = window.open('', '_blank', 'width=400,height=400');
    if (printWindow) {
      printWindow.document.write(`
        <html><body style="font-family:monospace; text-align:center; padding:20px;">
          <h2 style="margin:0;">RETSOL 82 UB</h2>
          <p style="font-size:12px;">HUB DIAGNOSTIC OK</p>
          <hr/>
          <p>STALL: ${settings.stallName}</p>
          <p>TERMINAL: ${currentTerminalName}</p>
          <hr/>
          <p>${new Date().toLocaleString()}</p>
          <p>ROLE: PRIMARY HUB</p>
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
        {/* Hardware & Printer Control */}
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-8 shadow-2xl">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Hardware & Printing</h3>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${settings.printerEnabled ? 'text-green-500' : 'text-zinc-600'}`}>
                  {settings.printerEnabled ? 'System Enabled' : 'System Disabled'}
                </span>
                <button 
                  onClick={() => setSettings({ ...settings, printerEnabled: !settings.printerEnabled })}
                  className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${settings.printerEnabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.printerEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* MASTER HUB TOGGLE */}
            <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Primary Hardware Hub</p>
                <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1">Designate this terminal as the printer server</p>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, isPrintHub: !settings.isPrintHub })}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${settings.isPrintHub ? 'bg-blue-500' : 'bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.isPrintHub ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            
            <div className={`bg-black/40 p-5 rounded-2xl border border-zinc-800 space-y-4 transition-all ${!settings.printerEnabled || !settings.isPrintHub ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-white tracking-widest">Active Device</p>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${printerStatus === PrinterStatus.CONNECTED ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                      <span className={`text-[10px] font-black uppercase ${printerStatus === PrinterStatus.CONNECTED ? 'text-green-500' : 'text-red-500'}`}>
                        {connectedPrinterName}
                      </span>
                    </div>
                 </div>
                 <div className="flex gap-2">
                   <button 
                    onClick={connectBluetooth} 
                    disabled={isConnecting} 
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase text-white border border-blue-400 flex items-center gap-2"
                   >
                     {isConnecting ? (
                       <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                     ) : null}
                     {isConnecting ? 'Linking...' : 'Bluetooth'}
                   </button>
                   <button 
                    onClick={connectUSB} 
                    disabled={isConnecting} 
                    className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-[9px] font-black uppercase text-white border border-zinc-700"
                   >
                     USB (OTG)
                   </button>
                 </div>
              </div>

              {connError && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-[10px] font-black uppercase tracking-tight">{connError}</p>
                  </div>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase leading-relaxed">
                    Troubleshooting: Check Retsol 82 UB power, pairing mode, or OTG cable connection. Ensure browser permissions are granted.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                 <p className="text-[9px] font-black text-zinc-500 uppercase">Hardware Health</p>
                 <button onClick={handleTestPrint} className="text-[9px] font-black text-yellow-500 uppercase hover:underline">Diagnostic</button>
              </div>
            </div>

            <div className="bg-black/40 p-5 rounded-2xl border border-zinc-800 space-y-2">
               <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Terminal Local Name</label>
               <div className="flex gap-2">
                  <input 
                    type="text"
                    value={editingTerminal}
                    onChange={e => setEditingTerminal(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-white font-black uppercase text-xs"
                  />
                  <button onClick={updateTerminal} className="bg-zinc-800 text-white px-4 rounded-xl text-[10px] font-black uppercase hover:bg-zinc-700">Save</button>
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

        {/* Global Branding & Staff */}
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
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Active Staff</h3>
              <span className="text-[9px] font-black text-zinc-600 uppercase">Multi-device sync enabled</span>
            </div>
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
            <div className="space-y-2">
              {settings.workerAccounts.map(w => (
                <div key={w.email} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-zinc-800/50">
                  <span className="text-xs font-bold text-white uppercase">{w.name}</span>
                  <button onClick={() => removeWorker(w.email)} className="text-[9px] font-black text-red-500 uppercase hover:underline">Delete</button>
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
