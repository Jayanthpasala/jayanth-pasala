
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
  onUpdatePrinter?: (device: any, name: string, status: PrinterStatus) => void;
  onTestPrint?: () => void;
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
  onUpdatePrinter,
  onTestPrint
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connError, setConnError] = useState('');
  
  const connectBluetooth = async () => {
    setIsConnecting(true); setConnError('');
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Retsol' }, 
          { namePrefix: 'TP82' }, 
          { namePrefix: 'Printer' },
          { namePrefix: 'BT-PRINTER' },
          { namePrefix: 'MTP' }
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] 
      });
      if (onUpdatePrinter) onUpdatePrinter(device, device.name || 'RETSOL BT', PrinterStatus.CONNECTED);
    } catch (err: any) { setConnError(`Bluetooth Error: ${err.message}`); }
    finally { setIsConnecting(false); }
  };

  const connectUSB = async () => {
    setIsConnecting(true); setConnError('');
    try {
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      if (onUpdatePrinter) onUpdatePrinter(device, device.productName || 'USB PRINTER', PrinterStatus.CONNECTED);
    } catch (err: any) { setConnError(`USB Error: ${err.message}`); }
    finally { setIsConnecting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
          Terminal Configuration
        </h2>
        <div className="bg-green-500/10 text-green-500 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border border-green-500/20 tracking-widest">
          Cloud Sync Active
        </div>
      </div>

      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-6 shadow-2xl">
        <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl mb-4">
          <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Multi-Device Synchronization</p>
          <p className="text-[11px] text-zinc-400 font-bold uppercase">All devices using the <span className="text-white">exact same Stall Name</span> will sync orders, inventory, and token status in real-time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Stall Display Name (Sync Key)</label>
            <input 
              type="text"
              value={settings.stallName}
              onChange={(e) => setSettings({ ...settings, stallName: e.target.value })}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Terminal ID</label>
            <input 
              type="text"
              value={currentTerminalName}
              onChange={(e) => onUpdateTerminalName?.(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all font-bold"
            />
          </div>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Master Hardware Hub</p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1">This terminal handles the Physical Printer</p>
          </div>
          <button 
            onClick={() => setSettings({ ...settings, isPrintHub: !settings.isPrintHub })}
            className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${settings.isPrintHub ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-zinc-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.isPrintHub ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between bg-black/40 p-6 rounded-2xl border border-zinc-800">
           <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-white tracking-widest">Link Direct Driver</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${printerStatus === PrinterStatus.CONNECTED ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className={`text-[10px] font-black uppercase ${printerStatus === PrinterStatus.CONNECTED ? 'text-green-500' : 'text-red-500'}`}>
                  {connectedPrinterName}
                </span>
              </div>
           </div>
           <div className="flex gap-2">
             <button onClick={connectBluetooth} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-[9px] font-black uppercase text-white transition-all active:scale-95">Bluetooth</button>
             <button onClick={connectUSB} className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-xl text-[9px] font-black uppercase text-white transition-all active:scale-95">USB OTG</button>
             {printerStatus === PrinterStatus.CONNECTED && (
               <button onClick={onTestPrint} className="bg-yellow-500 text-black px-6 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95">Test Print</button>
             )}
           </div>
        </div>

        {connError && <p className="text-red-500 text-[9px] font-black uppercase text-center mt-2">{connError}</p>}
      </div>

      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-4 shadow-2xl">
        <h3 className="text-sm font-black text-white uppercase tracking-tighter">Receipt Template</h3>
        <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Footer Message</label>
            <textarea 
              value={settings.footerMessage}
              onChange={(e) => setSettings({ ...settings, footerMessage: e.target.value })}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all font-bold text-sm min-h-[100px]"
            />
        </div>
      </div>
    </div>
  );
};

export default BillSettingsView;
