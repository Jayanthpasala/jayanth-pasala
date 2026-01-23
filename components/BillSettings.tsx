import React, { useState } from 'react';
import { BillSettings, PrinterStatus } from '../types.ts';

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
  onResetData?: () => void;
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
  onTestPrint,
  onResetData
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
      if (onUpdatePrinter) onUpdatePrinter(device, device.name || 'BT PRINTER', PrinterStatus.CONNECTED);
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
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
        <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
        Terminal Configuration
      </h2>

      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Stall Display Name</label>
            <input type="text" value={settings.stallName} onChange={(e) => setSettings({ ...settings, stallName: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Terminal ID</label>
            <input type="text" value={currentTerminalName} onChange={(e) => onUpdateTerminalName?.(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold" />
          </div>
        </div>

        <div className="bg-black/40 p-6 rounded-2xl border border-zinc-800 flex items-center justify-between">
           <div>
              <p className="text-[10px] font-black uppercase text-white tracking-widest">Printer Driver</p>
              <span className={`text-[10px] font-black uppercase ${printerStatus === PrinterStatus.CONNECTED ? 'text-green-500' : 'text-red-500'}`}>{connectedPrinterName}</span>
           </div>
           <div className="flex gap-2">
             <button onClick={connectBluetooth} className="bg-blue-600 px-6 py-2 rounded-xl text-[9px] font-black uppercase text-white">Bluetooth</button>
             <button onClick={connectUSB} className="bg-zinc-800 px-6 py-2 rounded-xl text-[9px] font-black uppercase text-white">USB</button>
             {printerStatus === PrinterStatus.CONNECTED && <button onClick={onTestPrint} className="bg-yellow-500 text-black px-6 py-2 rounded-xl text-[9px] font-black uppercase">Test</button>}
           </div>
        </div>
      </div>

      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-4">
        <h3 className="text-sm font-black text-white uppercase">Data Management</h3>
        <p className="text-xs text-zinc-500 uppercase font-bold">If you are seeing blank sales or incorrect data, try resetting the local storage.</p>
        <button onClick={onResetData} className="bg-red-600/10 border border-red-600/30 text-red-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">Factory Reset (Wipe All Data)</button>
      </div>
    </div>
  );
};

export default BillSettingsView;