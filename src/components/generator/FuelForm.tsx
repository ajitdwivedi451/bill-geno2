'use client';

import { useState } from 'react';
import { useFuelStore } from '@/store/useBillStore';
import { RefreshCw, Trash2, X, ImageOff, Pipette, Layers3, UploadCloud } from 'lucide-react';

export default function FuelForm() {
  const store = useFuelStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'watermark' | 'customPaperBG') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => store.setField(field, reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeWhiteBackground = () => {
    if (!store.logo) return;
    setIsProcessing(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230) {
          data[i + 3] = 0; 
        }
      }
      ctx.putImageData(imageData, 0, 0);
      store.setField('logo', canvas.toDataURL('image/png'));
      setIsProcessing(false);
    };
    img.src = store.logo;
  };

  const TexturesThumbnails = [
    { id: 1, name: 'Standard Thermal', bg: '#fdfcf8' },
    { id: 2, name: 'Recycled Fiber', bg: '#e7e5e0' },
    { id: 3, name: 'Crumpled Paper', bg: '#f4f4f5' }, 
    { id: 4, name: 'Dirty Thermal', bg: '#f1f0da' },
    { id: 5, name: 'Dot Matrix Grid', bg: '#ffffff' }
  ];

  return (
    <div className="space-y-6 text-sm pb-10">
      
      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-inner">
        <div>
          <h2 className="text-lg font-bold text-blue-900">1-Click New Bill</h2>
          <p className="text-xs text-blue-700">Increments receipt no, updates time, clears vehicle details.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={store.startNewBill} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold transition"><RefreshCw size={16} /> New Bill</button>
          <button onClick={store.clearAll} className="flex items-center gap-1 bg-white text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-base font-bold mb-3 border-b pb-2 text-slate-900">Extreme POS Realism & Paper Settings</h2>
        
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Select POS Layout Style</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <button onClick={() => store.setField('selectedTemplate', 1)} className={`p-2 text-xs font-bold border rounded-lg ${store.selectedTemplate === 1 ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white hover:bg-slate-100'}`}>T-1: IndianOil Look</button>
            <button onClick={() => store.setField('selectedTemplate', 2)} className={`p-2 text-xs font-bold border rounded-lg ${store.selectedTemplate === 2 ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white hover:bg-slate-100'}`}>T-2: BPCL Dashed Look</button>
            <button onClick={() => store.setField('selectedTemplate', 3)} className={`p-2 text-xs font-bold border rounded-lg ${store.selectedTemplate === 3 ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white hover:bg-slate-100'}`}>T-3: HPCL Star Look</button>
            <button onClick={() => store.setField('selectedTemplate', 4)} className={`p-2 text-xs font-bold border rounded-lg ${store.selectedTemplate === 4 ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white hover:bg-slate-100'}`}>T-4: Jio-bp Look</button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden flex text-xs font-bold">
          <button onClick={() => store.setField('paperMode', 'COLOR')} className={`w-1/3 p-2.5 flex items-center justify-center gap-1.5 ${store.paperMode === 'COLOR' ? 'bg-white text-indigo-700 shadow-inner' : 'bg-slate-100 text-slate-600'}`}><Pipette size={14}/> Flat Color</button>
          <button onClick={() => store.setField('paperMode', 'PRESET')} className={`w-1/3 p-2.5 flex items-center justify-center gap-1.5 border-x ${store.paperMode === 'PRESET' ? 'bg-white text-indigo-700 shadow-inner' : 'bg-slate-100 text-slate-600'}`}><Layers3 size={14}/> Real Textures</button>
          <button onClick={() => store.setField('paperMode', 'CUSTOM')} className={`w-1/3 p-2.5 flex items-center justify-center gap-1.5 ${store.paperMode === 'CUSTOM' ? 'bg-white text-indigo-700 shadow-inner' : 'bg-slate-100 text-slate-600'}`}><UploadCloud size={14}/> Upload Paper</button>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-inner">
          {store.paperMode === 'COLOR' && (
            <div className="flex gap-4 items-center">
              <div><label className="block text-xs font-bold mb-1 text-slate-600">Choose Flat Paper Color</label><input type="color" className="w-20 h-10 p-0 border-0 rounded cursor-pointer" value={store.paperBackground} onChange={(e) => store.setField('paperBackground', e.target.value)} /></div>
            </div>
          )}
          {store.paperMode === 'PRESET' && (
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-600">Select Realistic Thermal Paper Type</label>
              <div className="grid grid-cols-5 gap-2">
                {TexturesThumbnails.map((txt) => (
                  <button key={txt.id} onClick={() => store.setField('selectedTexture', txt.id)} className={`h-16 rounded-lg border-2 flex flex-col items-center justify-center p-1 text-center group transition ${store.selectedTexture === txt.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <div className="w-10 h-6 border rounded mb-1" style={{ backgroundColor: txt.bg }}></div>
                    <span className={`text-[9px] leading-tight font-bold ${store.selectedTexture === txt.id ? 'text-indigo-800' : 'text-slate-500'}`}>{txt.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {store.paperMode === 'CUSTOM' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600">Upload your own crumpled paper photo</label>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'customPaperBG')} className="w-full text-xs p-1.5 border rounded bg-slate-50" />
            </div>
          )}
        </div>

        {/* 🟢 NAYA: Font Size & Width Controls */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 border-t pt-4">
          <div><label className="block text-sm font-bold mb-1 text-slate-700">POS Width ({store.paperWidth}px)</label><input type="range" min="180" max="400" step="5" className="w-full" value={store.paperWidth} onChange={(e) => store.setField('paperWidth', Number(e.target.value))} /></div>
          <div><label className="block text-sm font-bold mb-1 text-indigo-600">Font Size ({store.posFontSize}px)</label><input type="range" min="9" max="16" step="0.5" className="w-full accent-indigo-600" value={store.posFontSize || 12} onChange={(e) => store.setField('posFontSize', Number(e.target.value))} /></div>
          <div className="col-span-2 lg:col-span-1"><label className="block text-sm font-bold mb-1 text-slate-700">Thermal Font</label><select className="w-full p-1.5 border rounded-lg outline-none bg-white text-xs font-mono" value={store.receiptFont} onChange={(e) => store.setField('receiptFont', e.target.value)}><option value="'Courier New', Courier, monospace">Courier (Classic)</option><option value="'Lucida Console', Monaco, monospace">Lucida (Clear)</option><option value="'VT323', monospace">VT323 (Dot Matrix)</option><option value="'Ubuntu Mono', monospace">Ubuntu Mono</option></select></div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <label className="flex items-center space-x-2 cursor-pointer font-bold"><input type="checkbox" checked={store.showLogo} onChange={(e) => store.setField('showLogo', e.target.checked)} className="h-4 w-4" /> <span>Show Top Logo</span></label>
          <div className="space-y-1.5">
            <label className="flex items-center space-x-2 cursor-pointer font-bold"><input type="checkbox" checked={store.showWatermark} onChange={(e) => store.setField('showWatermark', e.target.checked)} className="h-4 w-4" /> <span>Side Watermark (SBI/HDFC)</span></label>
            {store.showWatermark && <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'watermark')} className="w-full p-1 border rounded-lg text-xs bg-white" />}
          </div>
        </div>
        
        {store.showLogo && (
          <div className="bg-white p-4 border rounded-lg shadow-inner mt-2">
            <div className="flex justify-between items-center mb-3 border-b pb-2"><label className="text-sm font-bold text-slate-700">Upload & Refine Station Logo</label>{store.logo && <button onClick={() => store.setField('logo', null)} className="text-xs text-red-500 flex items-center bg-red-50 px-2 py-1 rounded-lg"><X size={12} className="mr-1"/> Clear</button>}</div>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="w-full text-sm mb-3 border p-2 rounded-lg bg-slate-50" />
            {store.logo && (
              <div className="flex items-center gap-4 bg-slate-100 p-2.5 rounded-lg border">
                <img src={store.logo} alt="uploaded logo" className="h-14 w-14 object-contain bg-white border-2 rounded-md" />
                <button onClick={removeWhiteBackground} disabled={isProcessing} className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition"><ImageOff size={15} /> {isProcessing ? 'Processing...' : 'Remove White Background'}</button>
              </div>
            )}
          </div>
        )}
      </div>

      <h2 className="text-base font-bold border-b pb-2">Station Details</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block mb-1 text-slate-500">Station Name</label><input className="w-full p-2 border rounded uppercase font-bold" value={store.stationName} onChange={(e) => store.setField('stationName', e.target.value)} /></div>
        <div className="col-span-2"><label className="block mb-1 text-slate-500">Address</label><textarea rows={3} className="w-full p-2 border rounded resize-none" value={store.address} onChange={(e) => store.setField('address', e.target.value)} /></div>
        <div><label className="block mb-1 text-slate-500">Phone</label><input className="w-full p-2 border rounded" value={store.phone} onChange={(e) => store.setField('phone', e.target.value)} /></div>
        <div><label className="block mb-1 text-slate-500">GSTIN</label><input className="w-full p-2 border rounded" value={store.gstin} onChange={(e) => store.setField('gstin', e.target.value)} /></div>
        <div><label className="block mb-1 text-slate-500">RO Code / Local ID</label><input className="w-full p-2 border rounded" value={store.roCode} onChange={(e) => store.setField('roCode', e.target.value)} /></div>
      </div>

      <h2 className="text-base font-bold border-b pb-2">Fuel & Dispenser</h2>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="block mb-1 text-slate-500">Product</label><input className="w-full p-2 border rounded font-bold uppercase" value={store.product} onChange={(e) => store.setField('product', e.target.value)} /></div>
        <div><label className="block mb-1 text-slate-500">Nozzle No</label><input className="w-full p-2 border rounded" value={store.nozzleNo} onChange={(e) => store.setField('nozzleNo', e.target.value)} /></div>
        <div><label className="block mb-1 text-indigo-600 font-bold">Unit (UoM)</label><input className="w-full p-2 border rounded border-indigo-300" placeholder="Litre / L" value={store.uom || 'Litre'} onChange={(e) => store.setField('uom', e.target.value)} /></div>
        
        <div className="col-span-3 bg-slate-100 p-4 rounded-xl border flex items-center gap-4 shadow-inner mt-2">
          <div className="w-1/3"><label className="block mb-1 font-bold">Rate (₹/{store.uom})</label><input type="number" className="w-full p-2.5 border rounded-lg font-mono text-base" value={store.rate} onChange={(e) => store.calculateVolume(store.amount, Number(e.target.value))} /></div>
          <div className="w-1/3"><label className="block mb-1 font-bold text-green-700">Amount (₹)</label><input type="number" className="w-full p-2.5 border rounded-lg font-mono text-base border-green-500 focus:ring-green-500" value={store.amount} onChange={(e) => store.calculateVolume(Number(e.target.value), store.rate)} /></div>
          <div className="w-1/3"><label className="block mb-1 font-bold text-slate-500">Volume auto</label><input type="number" readOnly className="w-full p-2.5 border rounded-lg font-mono text-base bg-slate-200 outline-none" value={store.volume} /></div>
        </div>
      </div>

      <h2 className="text-base font-bold border-b pb-2">Billing & Vehicle</h2>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block mb-1 font-bold text-blue-700">Receipt No</label><input className="w-full p-2 border rounded-lg bg-blue-50 font-bold" value={store.receiptNo} onChange={(e) => store.setField('receiptNo', e.target.value)} /></div>
        <div><label className="block mb-1 text-slate-500">Txn ID</label><input className="w-full p-2 border rounded-lg" value={store.txnId} onChange={(e) => store.setField('txnId', e.target.value)} /></div>
        <div><label className="block mb-1">Vehicle No</label><input className="w-full p-2 border rounded-lg uppercase font-bold" value={store.vehicleNo} onChange={(e) => store.setField('vehicleNo', e.target.value)} /></div>
        <div><label className="block mb-1">Mobile No</label><input className="w-full p-2 border rounded-lg" value={store.mobileNo} onChange={(e) => store.setField('mobileNo', e.target.value)} /></div>
        <div><label className="block mb-1 text-slate-500">Date</label><input type="date" className="w-full p-2 border rounded-lg" value={store.date} onChange={(e) => store.setField('date', e.target.value)} /></div>
        <div><label className="block mb-1 text-slate-500">Time</label><input type="time" className="w-full p-2 border rounded-lg" value={store.time} onChange={(e) => store.setField('time', e.target.value)} /></div>
      </div>
    </div>
  );
}