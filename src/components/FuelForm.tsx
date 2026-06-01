'use client';

import { useState, useEffect, useRef } from 'react';
import { usePOSShortcuts } from '@/hooks/usePOSShortcuts';
import { useFuelStore } from '@/store/useFuelStore';
import { RefreshCw, Trash2, X, Pipette, Layers3, UploadCloud, Save, Printer, Settings2, CheckCircle2, Download } from 'lucide-react';

export function FuelForm() {
  const store = useFuelStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isFullEdit, setIsFullEdit] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/imageProcessor.worker.ts', import.meta.url));
    return () => workerRef.current?.terminate();
  }, []);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  usePOSShortcuts([
    { key: 'n', altKey: true, action: () => { store.startNewBill(); showToast("New Bill Generated!"); } },
    { key: 's', ctrlKey: true, action: () => { const s = store.saveBillToHistory(); if(s) showToast("Saved!"); else window.alert("⚠️ Duplicate!"); } }
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'watermark' | 'customPaperBG') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'logo') store.setLogo(reader.result as string);
        else if (field === 'watermark') store.setWatermark(reader.result as string);
        else store.setField(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeWhiteBackground = (type: 'logo' | 'watermark' | 'customPaperBG') => {
    const imgSrc = type === 'logo' ? store.logo : type === 'watermark' ? store.watermark : store.customPaperBG;
    if (!imgSrc || !workerRef.current) return;
    setIsProcessing(true);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      ctx.drawImage(img, 0, 0); const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      workerRef.current!.postMessage({ imageData, type });
      workerRef.current!.onmessage = (e) => {
        const { processedData, type: returnedType } = e.data;
        ctx.putImageData(processedData, 0, 0); 
        const newImage = canvas.toDataURL('image/png');
        if(returnedType === 'logo') store.setLogo(newImage);
        else if(returnedType === 'watermark') store.setWatermark(newImage);
        else store.setField('customPaperBG', newImage); 
        setIsProcessing(false);
      };
    }; img.src = imgSrc;
  };

  const handleFontSizeChange = (val: number) => {
    if(!store.hasWarnedFont) {
      if(window.confirm("⚠️ WARNING: Changing font size might break the exact layout of the bill. Do you want to proceed?")) {
        store.setField('hasWarnedFont', true);
        store.setField('posFontSize', val);
      }
    } else {
      store.setField('posFontSize', val);
    }
  };

  const triggerBulkDownload = () => {
    if (store.selectedBills.length === 0) return alert("Select at least 1 bill to download.");
    window.dispatchEvent(new CustomEvent('bulk-download'));
    showToast("Preparing Bulk PDF...");
  };

  const getShortStationName = (name: string) => {
    if (!name) return 'Station';
    return name.trim().split(' ').slice(0, 2).join(' ');
  };

  return (
    <div className="space-y-6 text-sm pb-10 relative px-2 md:px-0">
      {toastMsg && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl z-50 flex items-center gap-2 text-sm font-bold border border-slate-700"><CheckCircle2 size={16} className="text-emerald-400" /> {toastMsg}</div>}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-inner gap-4">
        <div>
          <h2 className="text-lg font-bold text-blue-900">Quick Actions</h2>
          <p className="text-xs text-blue-700">Auto-sets receipt, time & auto-generates fields.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => { store.startNewBill(); showToast("New Bill Generated!"); }} className="flex-1 md:flex-none items-center justify-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm flex hover:bg-blue-700 transition"><RefreshCw size={16} /> New Bill</button>
          <button onClick={() => setIsFullEdit(!isFullEdit)} className={`flex-1 md:flex-none items-center justify-center gap-1 px-4 py-2 rounded-lg font-bold shadow-sm border flex transition ${isFullEdit ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'}`}><Settings2 size={16} /> Full Edit</button>
        </div>
      </div>

      <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 w-full">
        <h2 className="text-base font-bold border-b pb-2 text-slate-800">Everyday Billing Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2"><label className="block mb-1 text-slate-500 text-xs font-bold uppercase">Station Name</label><input className="w-full p-2 border rounded font-bold border-slate-300" value={store.stationName} onChange={(e) => store.setField('stationName', e.target.value)} /></div>
          <div className="col-span-1 md:col-span-2"><label className="block mb-1 text-slate-500 text-xs font-bold uppercase">Address</label><textarea rows={2} className="w-full p-2 border rounded border-slate-300" value={store.address} onChange={(e) => store.setField('address', e.target.value)} /></div>
          <div><label className="block mb-1 font-bold text-blue-700">Receipt No</label><input className="w-full p-2 border rounded bg-blue-50 font-bold border-blue-200" value={store.receiptNo} onChange={(e) => store.setField('receiptNo', e.target.value)} /></div>
          <div><label className="block mb-1 text-slate-500 font-bold">Vehicle No</label><input className="w-full p-2 border rounded uppercase font-bold border-slate-300" value={store.vehicleNo} onChange={(e) => store.setField('vehicleNo', e.target.value)} /></div>
          <div><label className="block mb-1 text-slate-500 font-bold">Date</label><input type="date" className="w-full p-2 border rounded border-slate-300" value={store.date} onChange={(e) => store.setField('date', e.target.value)} /></div>
          <div><label className="block mb-1 text-slate-500 font-bold">Time</label><input type="time" step="1" className="w-full p-2 border rounded border-slate-300" value={store.time} onChange={(e) => store.setField('time', e.target.value)} /></div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 mt-2 w-full">
          <div className="w-full md:w-1/4">
            <label className="block mb-1 font-bold text-xs uppercase text-slate-500">Product</label>
            <select className="w-full p-2 border rounded font-bold uppercase bg-white border-slate-300" value={store.product} onChange={(e) => store.setField('product', e.target.value)}>
              <option value="PETROL">PETROL</option><option value="DIESEL">DIESEL</option><option value="POWER">POWER</option><option value="SPEED">SPEED</option><option value="XP95">XP95</option><option value="CNG">CNG</option>
            </select>
          </div>
          <div className="w-full md:w-1/4"><label className="block mb-1 font-bold text-xs uppercase">Rate (₹)</label><input type="number" step="0.01" className="w-full p-2 border rounded-lg font-mono border-slate-300" value={store.rate} onChange={(e) => store.calculateVolume(store.amount, Number(e.target.value))} /></div>
          <div className="w-full md:w-1/4"><label className="block mb-1 font-bold text-xs uppercase text-indigo-600">Volume</label><input type="number" step="0.01" className="w-full p-2 border rounded-lg font-mono bg-indigo-50 border-indigo-300" value={store.volume} onChange={(e) => store.calculateFromVolume(Number(e.target.value), store.rate)} /></div>
          <div className="w-full md:w-1/4"><label className="block mb-1 font-bold text-xs uppercase text-green-700">Amount</label><input type="number" readOnly className="w-full p-2 border rounded-lg font-mono bg-green-50 border-green-300" value={store.amount} /></div>
        </div>
      </div>

      {isFullEdit && (
        <div className="bg-slate-100 p-4 md:p-5 rounded-xl border border-slate-300 shadow-inner space-y-5 w-full">
          <h2 className="text-base font-bold mb-3 border-b border-slate-300 pb-2 text-slate-900 flex items-center gap-2"><Settings2 size={18}/> Formats & Technical Fields</h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <button onClick={() => store.setField('selectedTemplate', 1)} className={`p-2 text-xs font-bold border rounded-lg transition ${store.selectedTemplate === 1 ? 'bg-orange-500 text-white border-orange-600' : 'bg-white hover:bg-slate-200'}`}>1. IndianOil</button>
            <button onClick={() => store.setField('selectedTemplate', 2)} className={`p-2 text-xs font-bold border rounded-lg transition ${store.selectedTemplate === 2 ? 'bg-yellow-500 text-slate-900 border-yellow-600' : 'bg-white hover:bg-slate-200'}`}>2. Bharat Petroleum</button>
            <button onClick={() => store.setField('selectedTemplate', 3)} className={`p-2 text-xs font-bold border rounded-lg transition ${store.selectedTemplate === 3 ? 'bg-blue-600 text-white border-blue-700' : 'bg-white hover:bg-slate-200'}`}>3. HP Gas</button>
            <button onClick={() => store.setField('selectedTemplate', 4)} className={`p-2 text-xs font-bold border rounded-lg transition ${store.selectedTemplate === 4 ? 'bg-green-600 text-white border-green-700' : 'bg-white hover:bg-slate-200'}`}>4. Jio-bp</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            {store.selectedTemplate === 4 && (
              <><div><label className="block text-xs font-bold">RO ID</label><input className="w-full p-1.5 border rounded" value={store.roId} onChange={(e)=>store.setField('roId', e.target.value)}/></div>
                <div><label className="block text-xs font-bold">RO Code</label><input className="w-full p-1.5 border rounded" value={store.roCode} onChange={(e)=>store.setField('roCode', e.target.value)}/></div>
                <div><label className="block text-xs font-bold">RSL NO</label><input className="w-full p-1.5 border rounded" value={store.rslNo} onChange={(e)=>store.setField('rslNo', e.target.value)}/></div>
                <div><label className="block text-xs font-bold">TIN NO</label><input className="w-full p-1.5 border rounded" value={store.tinNo} onChange={(e)=>store.setField('tinNo', e.target.value)}/></div>
              </>
            )}
            {store.selectedTemplate === 1 && (
              <><div><label className="block text-xs font-bold">FCC ID</label><input className="w-full p-1.5 border rounded" value={store.fccId} onChange={(e)=>store.setField('fccId', e.target.value)}/></div>
                <div><label className="block text-xs font-bold">FIP No.</label><input className="w-full p-1.5 border rounded" value={store.fipNo} onChange={(e)=>store.setField('fipNo', e.target.value)}/></div>
                <div><label className="block text-xs font-bold">VAT No</label><input className="w-full p-1.5 border rounded" value={store.vatNo} onChange={(e)=>store.setField('vatNo', e.target.value)}/></div>
              </>
            )}
            {store.selectedTemplate === 3 && (
              <><div><label className="block text-xs font-bold">Trns.ID</label><input className="w-full p-1.5 border rounded" value={store.txnId} onChange={(e)=>store.setField('txnId', e.target.value)}/></div>
                <div><label className="block text-xs font-bold">Density</label><input className="w-full p-1.5 border rounded" value={store.density} onChange={(e)=>store.setField('density', e.target.value)}/></div>
                <div><label className="block text-xs font-bold">FP. ID</label><input className="w-full p-1.5 border rounded" value={store.fpId} onChange={(e)=>store.setField('fpId', e.target.value)}/></div>
              </>
            )}
            {store.selectedTemplate !== 4 && <div><label className="block text-xs font-bold">Nozzle No</label><input className="w-full p-1.5 border rounded" value={store.nozzleNo} onChange={(e)=>store.setField('nozzleNo', e.target.value)}/></div>}
            <div><label className="block text-xs font-bold">Phone</label><input className="w-full p-1.5 border rounded" value={store.phone} onChange={(e)=>store.setField('phone', e.target.value)}/></div>
            <div><label className="block text-xs font-bold">GSTIN/VAT</label><input className="w-full p-1.5 border rounded" value={store.gstin} onChange={(e)=>store.setField('gstin', e.target.value)}/></div>
          </div>

          <div className="border border-slate-300 bg-white rounded-lg overflow-hidden flex flex-col md:flex-row text-xs font-bold mt-4">
            <button onClick={() => store.setField('paperMode', 'COLOR')} className={`p-2.5 flex-1 flex justify-center gap-1.5 ${store.paperMode === 'COLOR' ? 'bg-indigo-100 text-indigo-700' : 'bg-white'}`}><Pipette size={14}/> Flat Color</button>
            <button onClick={() => store.setField('paperMode', 'PRESET')} className={`p-2.5 flex-1 flex justify-center gap-1.5 border-y md:border-y-0 md:border-x ${store.paperMode === 'PRESET' ? 'bg-indigo-100 text-indigo-700' : 'bg-white'}`}><Layers3 size={14}/> Real Textures</button>
            <button onClick={() => store.setField('paperMode', 'CUSTOM')} className={`p-2.5 flex-1 flex justify-center gap-1.5 ${store.paperMode === 'CUSTOM' ? 'bg-indigo-100 text-indigo-700' : 'bg-white'}`}><UploadCloud size={14}/> Upload Paper</button>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-300 overflow-x-auto mt-2">
            {store.paperMode === 'COLOR' && (
               <div><label className="block text-xs font-bold mb-1">Pick Color</label><input type="color" className="w-20 h-10 p-0 cursor-pointer border rounded" value={store.paperBackground} onChange={(e) => store.setField('paperBackground', e.target.value)} /></div>
            )}
            {store.paperMode === 'PRESET' && (
              <div className="flex md:grid md:grid-cols-5 gap-2">
                {[{ id: 1, name: 'Standard Thermal', bg: '#fdfcf8' }, { id: 2, name: 'Recycled Fiber', bg: '#e7e5e0' }, { id: 3, name: 'Crumpled Paper', bg: '#f4f4f5' }, { id: 4, name: 'Dirty Thermal', bg: '#f1f0da' }, { id: 5, name: 'Pure White', bg: '#ffffff' }].map((txt) => (
                  <button key={txt.id} onClick={() => store.setField('selectedTexture', txt.id)} className={`h-16 rounded-lg border-2 flex flex-col items-center justify-center p-1 text-center min-w-[100px] md:min-w-0 transition ${store.selectedTexture === txt.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-200'}`}>
                    <div className="w-10 h-6 border rounded mb-1" style={{ backgroundColor: txt.bg }}></div><span className="text-[9px] font-bold">{txt.name}</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* 🟢 CUSTOM PAPER CLEAR FIX ADDED HERE */}
            {store.paperMode === 'CUSTOM' && (
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  {store.customPaperBG && <button onClick={() => { store.savePaperToGallery(store.customPaperBG!); showToast("Background texture saved!"); }} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded font-bold transition hover:bg-indigo-200">Save</button>}
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'customPaperBG')} className="w-full text-xs p-1.5 border rounded bg-slate-50" />
                  {store.customPaperBG && <button onClick={() => removeWhiteBackground('customPaperBG')} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded transition hover:bg-slate-700">Rem BG</button>}
                  {/* CLEAR BUTTON WAPAS AA GAYA 👇 */}
                  {store.customPaperBG && <button onClick={() => store.setField('customPaperBG', null)} className="text-xs text-red-500 hover:bg-red-50 font-bold border border-red-200 px-3 py-1.5 rounded transition">Clear</button>}
                </div>
                {store.savedPapers && store.savedPapers.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto mt-2 pb-1 custom-scrollbar">
                    {store.savedPapers.map((savedPaper, idx) => (
                      <div key={`paper-${idx}`} className="relative shrink-0">
                        <div style={{ backgroundImage: `url(${savedPaper})`, backgroundSize: 'cover' }} onClick={() => store.setField('customPaperBG', savedPaper)} className={`h-10 w-14 border-2 cursor-pointer rounded ${store.customPaperBG === savedPaper ? 'border-indigo-600' : 'border-slate-200'}`} />
                        <button onClick={() => store.deletePaperFromGallery(idx)} className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"><X size={8}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-300 pt-4">
            <div><label className="block text-sm font-bold mb-1">POS Width ({store.paperWidth}px)</label><input type="range" min="180" max="400" step="5" className="w-full accent-indigo-600" value={store.paperWidth} onChange={(e) => store.setField('paperWidth', Number(e.target.value))} /></div>
            <div><label className="block text-sm font-bold mb-1">Font Size ({store.posFontSize}px)</label><input type="range" min="9" max="16" step="0.5" className="w-full accent-indigo-600" value={store.posFontSize} onChange={(e) => handleFontSizeChange(Number(e.target.value))} /></div>
            <div><label className="block text-sm font-bold mb-1">POS Font</label>
              <select className="w-full p-1.5 border rounded-lg font-mono text-xs border-slate-300" value={store.receiptFont} onChange={(e) => store.setField('receiptFont', e.target.value)}>
                <option value="'Courier New', Courier, monospace">Courier (Standard)</option>
                <option value="'Lucida Console', Monaco, monospace">Lucida (Sharp)</option>
                <option value="'VT323', monospace">VT323 (Dot Matrix)</option>
                <option value="'Space Mono', monospace">Space Mono (Modern)</option>
                <option value="'Inconsolata', monospace">Inconsolata (Clean Thermal)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-300 pt-4">
            <div className="space-y-2">
              <label className="flex items-center space-x-2 font-bold cursor-pointer"><input type="checkbox" checked={store.showLogo} onChange={(e) => store.setField('showLogo', e.target.checked)} className="h-4 w-4 accent-indigo-600" /> <span>Show Top Logo</span></label>
              {store.showLogo && (
                <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                  <div className="flex gap-2 mb-2">
                    {store.logo && <button onClick={() => { store.saveLogoToGallery(store.logo!); showToast("Logo saved!"); }} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded transition hover:bg-indigo-200 font-bold">Save</button>}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="w-full text-xs p-1 border rounded bg-slate-50" />
                    {store.logo && <button onClick={() => removeWhiteBackground('logo')} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded transition">Rem BG</button>}
                  </div>
                  {store.savedLogos && store.savedLogos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto mt-2 custom-scrollbar pb-1">
                      {store.savedLogos.map((savedLogo, idx) => (
                        <div key={`logo-${idx}`} className="relative shrink-0">
                          <img src={savedLogo} alt="saved" onClick={() => store.setLogo(savedLogo)} className={`h-10 w-10 object-contain bg-white border-2 cursor-pointer rounded ${store.logo === savedLogo ? 'border-indigo-600' : 'border-slate-200'}`} />
                          <button onClick={() => store.deleteLogoFromGallery(idx)} className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"><X size={8}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 font-bold cursor-pointer"><input type="checkbox" checked={store.showWatermark} onChange={(e) => store.setField('showWatermark', e.target.checked)} className="h-4 w-4 accent-indigo-600" /> <span>Bank Tag / Watermark</span></label>
              {store.showWatermark && (
                <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                  <div className="flex gap-2 mb-2">
                    {store.watermark && <button onClick={() => { store.saveWatermarkToGallery(store.watermark!); showToast("Bank Tag saved!"); }} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded transition hover:bg-indigo-200 font-bold">Save</button>}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'watermark')} className="w-full text-xs p-1 border rounded bg-slate-50" />
                    {store.watermark && <button onClick={() => removeWhiteBackground('watermark')} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded transition">Rem BG</button>}
                  </div>
                  {store.savedWatermarks && store.savedWatermarks.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto mt-2 custom-scrollbar pb-1">
                      {store.savedWatermarks.map((savedWm, idx) => (
                        <div key={`wm-${idx}`} className="relative shrink-0">
                          <img src={savedWm} alt="saved" onClick={() => store.setWatermark(savedWm)} className={`h-10 w-10 object-contain bg-white border-2 cursor-pointer rounded ${store.watermark === savedWm ? 'border-indigo-600' : 'border-slate-200'}`} />
                          <button onClick={() => store.deleteWatermarkFromGallery(idx)} className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"><X size={8}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
        <div className="bg-slate-800 text-white p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-base font-bold flex items-center gap-2"><Save size={18}/> Local Bill Memory</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { const s = store.saveBillToHistory(); if(s) showToast("Saved!"); else window.alert("⚠️ Duplicate!"); }} className="bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded text-xs font-bold transition">Save Current</button>
            <button onClick={() => { if(window.confirm("Delete selected?")) store.deleteBillsFromHistory(store.selectedBills); }} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-xs font-bold transition"><Trash2 size={14}/></button>
            <button onClick={triggerBulkDownload} className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition text-white"><Download size={14}/> Bulk Down</button>
          </div>
        </div>
        
        <div className="p-0 md:p-3 max-h-80 overflow-y-auto w-full custom-scrollbar">
          {store.billHistory.length === 0 ? <p className="text-center text-slate-400 py-4 italic">No saved bills.</p> : (
            <div className="w-full">
              <table className="w-full text-left text-sm table-fixed">
                <thead className="border-b font-bold text-slate-500 uppercase text-[10px] bg-slate-50">
                  <tr>
                    <th className="p-2 w-10 text-center"><input type="checkbox" onChange={(e) => store.setSelectedBills(e.target.checked ? store.billHistory.map(b => b.id) : [])} checked={store.selectedBills.length === store.billHistory.length && store.billHistory.length > 0} className="accent-indigo-600 cursor-pointer"/></th>
                    <th className="p-2 w-2/5">Station & Date</th>
                    <th className="p-2 w-1/4">Amount</th>
                    <th className="p-2 w-1/4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {store.billHistory.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center"><input type="checkbox" checked={store.selectedBills.includes(b.id)} onChange={(e) => store.setSelectedBills(e.target.checked ? [...store.selectedBills, b.id] : store.selectedBills.filter(id => id !== b.id))} className="accent-indigo-600 cursor-pointer"/></td>
                      
                      <td className="p-2 overflow-hidden">
                        <div className="font-bold leading-tight text-blue-900 truncate" title={b.stationName}>{b.stationName}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{b.date.split('-').reverse().join('/')}</div>
                      </td>
                      
                      <td className="p-2 font-mono font-bold text-emerald-600 truncate">₹{b.amount.toFixed(2)}</td>
                      
                      <td className="p-2 text-right">
                        <button onClick={() => { store.loadBillFromHistory(b); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-indigo-600 hover:underline text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded transition hover:bg-indigo-100">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}