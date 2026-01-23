
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [connError, setConnError] = useState('');

  const connectBluetooth = async () => {
    setIsConnecting(true);
    setConnError('');
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ namePrefix: 'Retsol' }, { namePrefix: 'TP82' }, { namePrefix: 'Printer' }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] 
      });
      if (onUpdatePrinter) onUpdatePrinter(device, device.name || 'RETSOL BT', PrinterStatus.CONNECTED);
    } catch (err: any) {
      if (err.name !== 'NotFoundError' && err.name !== 'AbortError') {
        setConnError(`Bluetooth Error: ${err.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const connectUSB = async () => {
    setIsConnecting(true);
    setConnError('');
    try {
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      if (onUpdatePrinter) onUpdatePrinter(device, device.productName || 'RETSOL USB', PrinterStatus.CONNECTED);
    } catch (err: any) {
      if (err.name !== 'NotFoundError' && err.name !== 'AbortError') {
        setConnError(`USB Error: ${err.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const exportData = () => {
    const data = {
      inventory: localStorage.getItem('kapi_inventory'),
      sales: localStorage.getItem('kapi_sales'),
      settings: localStorage.getItem('kapi_settings')
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kapi_sync_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.inventory) localStorage.setItem('kapi_inventory', data.inventory);
        if (data.sales) localStorage.setItem('kapi_sales', data.sales);
        if (data.settings) localStorage.setItem('kapi_settings', data.settings);
        alert('Data Imported Successfully. Please Refresh App.');
        window.location.reload();
      } catch (err) {
        alert('Invalid Sync File');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
        <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
        Terminal & Printing
      </h2>

      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-6">
        <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Master Hardware Hub</p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1">This terminal handles the Retsol 82 UB Printer</p>
          </div>
          <button 
            onClick={() => setSettings({ ...settings, isPrintHub: !settings.isPrintHub })}
            className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${settings.isPrintHub ? 'bg-blue-500' : 'bg-zinc-700'}`}
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
             <button onClick={connectBluetooth} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-[9px] font-black uppercase text-white">Bluetooth</button>
             <button onClick={connectUSB} className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-xl text-[9px] font-black uppercase text-white">USB OTG</button>
           </div>
        </div>

        {connError && <p className="text-red-500 text-[9px] font-black uppercase px-2">{connError}</p>}
      </div>

      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Multi-Device Sync</h3>
            <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1">Manual data migration between mobile devices</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={exportData} className="bg-zinc-800 text-white p-4 rounded-2xl font-black uppercase text-[10px] border border-zinc-700 hover:bg-zinc-700">Export Shift Data</button>
          <div className="relative">
            <input type="file" accept=".json" onChange={importData} className="absolute inset-0 opacity-0 cursor-pointer" />
            <button className="w-full bg-zinc-800 text-white p-4 rounded-2xl font-black uppercase text-[10px] border border-zinc-700">Import Shift Data</button>
          </div>
        </div>
        <p className="text-[8px] font-bold text-zinc-600 uppercase text-center italic">Note: Live sync across different mobiles requires a Cloud Database (e.g. Firebase).</p>
      </div>
    </div>
  );
};

export default BillSettingsView;
