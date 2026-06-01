'use client';

import { useState, useEffect, useRef } from 'react';
import { useTravelStore } from '@/store/useTravelStore'; // 🟢 Store Path
import { usePOSShortcuts } from '@/hooks/usePOSShortcuts'; // 🟢 Shortcuts
import { RefreshCw, CarFront, UserPlus, Save, Trash2, Printer, Scan, CheckCircle2 } from 'lucide-react';

export default function TravelForm() {
  const store = useTravelStore();
  const [toastMsg, setToastMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Calculate Grand Total for History
  const baseFare = store.totalKm * store.ratePerKm;
  const subTotal = baseFare + store.tollsParking + store.driverAllowance + store.otherCharges;
  const taxAmount = store.hasTax ? (subTotal * store.taxRate) / 100 : 0;
  const grandTotal = subTotal + taxAmount - store.discount;

  // 🟢 Web Worker Setup
  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/imageProcessor.worker.ts', import.meta.url));
    return () => workerRef.current?.terminate();
  }, []);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 4000); };

  // 🟢 Keyboard Shortcuts
  usePOSShortcuts([
    { key: 'n', altKey: true, action: () => { store.startNewBill(); showToast("New Trip Generated! (Alt+N)"); } },
    { key: 's', ctrlKey: true, action: () => {
        const saved = store.saveBillToHistory(grandTotal);
        if (saved) showToast("Bill Saved to Memory! (Ctrl+S)");
        else window.alert("⚠️ Duplicate bill cannot be saved!");
    }},
    { key: 'p', ctrlKey: true, action: () => window.print() }
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => store.setField(field, reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 🟢 Non-Blocking Worker Image Processor
  const handleBgRemoval = (field: 'logo' | 'signature') => {
    const imgSrc = field === 'logo' ? store.logo : store.signature;
    if (!imgSrc || !workerRef.current) return;
    if (imgSrc.includes('image/svg+xml')) return alert("SVG images are already transparent.");

    setIsProcessing(true);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      workerRef.current!.postMessage({ imageData, type: field });
      
      workerRef.current!.onmessage = (e) => {
        const { processedData, type: returnedType } = e.data;
        ctx.putImageData(processedData, 0, 0);
        const newImage = canvas.toDataURL('image/png');
        store.setField(returnedType as any, newImage);
        setIsProcessing(false);
        showToast("White background removed!");
      };
    };
    img.src = imgSrc;
  };

  const handleNewTrip = () => {
    store.startNewBill();
    showToast('New Trip: Invoice, Date & Time updated. (Customer retained)');
  };

  const handleNewCustomer = () => {
    store.startNewCustomer();
    showToast('New Customer: All guest details cleared & Invoice updated.');
  };

  return (
    <div className="space-y-6 text-sm pb-10 relative">
      
      {/* Floating Toast Message */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl z-50 flex items-center gap-2 text-sm font-bold border border-slate-700">
          <CheckCircle2 size={16} className="text-emerald-400" /> {toastMsg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-yellow-50 p-4 rounded-xl border border-yellow-200 shadow-inner gap-4">
        <div>
          <h2 className="text-lg font-bold text-yellow-900 flex items-center gap-2"><CarFront size={20}/> Bill Actions</h2>
          <p className="text-xs text-yellow-700">Choose action based on regular or new client. <span className="font-mono bg-white px-1 rounded text-slate-800">(Alt+N for New, Ctrl+S to Save)</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleNewTrip} className="flex items-center gap-1 bg-white text-slate-800 border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50 font-bold transition shadow-sm"><RefreshCw size={16} /> New Trip</button>
          <button onClick={handleNewCustomer} className="flex items-center gap-1 bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-600 font-bold transition shadow-sm"><UserPlus size={16} /> New Customer</button>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
        <h2 className="text-base font-bold mb-3 border-b pb-2">Layout (10 Formats) & Branding</h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
             <button key={i} onClick={() => store.setField('selectedTemplate', i)} className={`p-2 text-xs font-bold border rounded-lg ${store.selectedTemplate === i ? 'bg-slate-800 text-white' : 'bg-white hover:bg-slate-100'}`}>Format {i}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-bold mb-1">Theme Color</label><input type="color" className="w-full h-8 p-0 border-0 rounded cursor-pointer" value={store.themeColor} onChange={(e) => store.setField('themeColor', e.target.value)} /></div>
          <div><label className="block text-xs font-bold mb-1">Currency</label><select className="w-full p-1.5 border rounded-lg bg-white" value={store.currency} onChange={(e) => store.setField('currency', e.target.value)}><option value="₹">₹ (INR)</option><option value="$">$ (USD)</option></select></div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block font-bold">Upload Logo</label>
                <div className="flex gap-2">
                    {store.logo && <button onClick={() => handleBgRemoval('logo')} disabled={isProcessing} className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded flex items-center"><Scan size={10} className="mr-1"/> Rem BG</button>}
                    {store.logo && <button onClick={()=>store.setField('logo', null)} className="text-[10px] text-red-500">Clear</button>}
                </div>
            </div>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="w-full p-1 border rounded text-xs bg-white" />
            <label className="flex items-center space-x-2 mt-2 cursor-pointer font-bold"><input type="checkbox" checked={store.showLogo} onChange={(e) => store.setField('showLogo', e.target.checked)} /> <span>Show Logo</span></label>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block font-bold">Upload Signature</label>
                <div className="flex gap-2">
                    {store.signature && <button onClick={() => handleBgRemoval('signature')} disabled={isProcessing} className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded flex items-center"><Scan size={10} className="mr-1"/> Rem BG</button>}
                    {store.signature && <button onClick={()=>store.setField('signature', null)} className="text-[10px] text-red-500">Clear</button>}
                </div>
            </div>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} className="w-full p-1 border rounded text-xs bg-white" />
            <label className="flex items-center space-x-2 mt-2 cursor-pointer font-bold"><input type="checkbox" checked={store.showSignature} onChange={(e) => store.setField('showSignature', e.target.checked)} /> <span>Show Signature Block</span></label>
          </div>
        </div>
      </div>

      <h2 className="text-base font-bold border-b pb-2">Agency Details</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block mb-1">Agency Name</label><input className="w-full p-2 border rounded font-bold" value={store.agencyName} onChange={(e) => store.setField('agencyName', e.target.value)} /></div>
        <div className="col-span-2"><label className="block mb-1">Address</label><textarea rows={2} className="w-full p-2 border rounded resize-none" value={store.address} onChange={(e) => store.setField('address', e.target.value)} /></div>
        <div><label className="block mb-1">Phone (Optional)</label><input className="w-full p-2 border rounded" value={store.phone} onChange={(e) => store.setField('phone', e.target.value)} /></div>
        <div><label className="block mb-1">Email (Optional)</label><input className="w-full p-2 border rounded" value={store.email} onChange={(e) => store.setField('email', e.target.value)} /></div>
        <div><label className="block mb-1">GSTIN (Optional)</label><input className="w-full p-2 border rounded" value={store.gstin} onChange={(e) => store.setField('gstin', e.target.value)} /></div>
      </div>

      <h2 className="text-base font-bold border-b pb-2">Journey & Vehicle Details</h2>
      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div><label className="block mb-1 font-bold text-indigo-700">From (Pickup)</label><input className="w-full p-2 border rounded" value={store.startLocation} onChange={(e) => store.setField('startLocation', e.target.value)} /></div>
        <div><label className="block mb-1 font-bold text-indigo-700">To (Drop)</label><input className="w-full p-2 border rounded" value={store.endLocation} onChange={(e) => store.setField('endLocation', e.target.value)} /></div>
        <div><label className="block mb-1">Start Date</label><input type="date" className="w-full p-2 border rounded" value={store.startDate} onChange={(e) => store.setField('startDate', e.target.value)} /></div>
        <div><label className="block mb-1">End Date</label><input type="date" className="w-full p-2 border rounded" value={store.endDate} onChange={(e) => store.setField('endDate', e.target.value)} /></div>
        
        <div className="col-span-2 border-t pt-3 mt-1"></div>
        <div><label className="block mb-1">Vehicle Type (e.g. SUV/Sedan)</label><input className="w-full p-2 border rounded" value={store.vehicleType} onChange={(e) => store.setField('vehicleType', e.target.value)} /></div>
        <div><label className="block mb-1 font-bold">Vehicle Number</label><input className="w-full p-2 border rounded uppercase" value={store.vehicleNo} onChange={(e) => store.setField('vehicleNo', e.target.value)} /></div>
        <div className="col-span-2"><label className="block mb-1">Driver Name (Optional)</label><input className="w-full p-2 border rounded" value={store.driverName} onChange={(e) => store.setField('driverName', e.target.value)} /></div>
      </div>

      <h2 className="text-base font-bold border-b pb-2">Odometer (KM) & Pricing</h2>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="block mb-1 font-bold">Start KM</label><input type="number" className="w-full p-2 border rounded bg-white" value={store.startKm} onChange={(e) => store.calculateKm(Number(e.target.value), store.endKm)} /></div>
        <div><label className="block mb-1 font-bold">End KM</label><input type="number" className="w-full p-2 border rounded bg-white" value={store.endKm} onChange={(e) => store.calculateKm(store.startKm, Number(e.target.value))} /></div>
        <div><label className="block mb-1 font-bold text-blue-700">Total KM</label><input type="number" className="w-full p-2 border rounded bg-blue-50 outline-none" value={store.totalKm} onChange={(e) => store.setField('totalKm', Number(e.target.value))} /></div>
        
        <div><label className="block mb-1 font-bold text-emerald-700">Rate / KM</label><input type="number" className="w-full p-2 border rounded border-emerald-300" value={store.ratePerKm} onChange={(e) => store.setField('ratePerKm', Number(e.target.value))} /></div>
        <div><label className="block mb-1">Toll & Parking</label><input type="number" className="w-full p-2 border rounded" value={store.tollsParking} onChange={(e) => store.setField('tollsParking', Number(e.target.value))} /></div>
        <div><label className="block mb-1">Driver Allowance</label><input type="number" className="w-full p-2 border rounded" value={store.driverAllowance} onChange={(e) => store.setField('driverAllowance', Number(e.target.value))} /></div>
        
        <div><label className="block mb-1">Other Charges</label><input type="number" className="w-full p-2 border rounded" value={store.otherCharges} onChange={(e) => store.setField('otherCharges', Number(e.target.value))} /></div>
        <div><label className="block mb-1">Advance Paid</label><input type="number" className="w-full p-2 border rounded" value={store.advancePaid} onChange={(e) => store.setField('advancePaid', Number(e.target.value))} /></div>
        <div><label className="block mb-1">Discount</label><input type="number" className="w-full p-2 border rounded" value={store.discount} onChange={(e) => store.setField('discount', Number(e.target.value))} /></div>
      </div>

      <h2 className="text-base font-bold border-b pb-2">Billing Details</h2>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block mb-1">Invoice No</label><input className="w-full p-2 border rounded bg-slate-50 font-bold" value={store.invoiceNo} onChange={(e) => store.setField('invoiceNo', e.target.value)} /></div>
        <div><label className="block mb-1">Bill Date</label><input type="date" className="w-full p-2 border rounded" value={store.date} onChange={(e) => store.setField('date', e.target.value)} /></div>
        <div><label className="block mb-1 font-bold">Customer Name (Optional)</label><input className="w-full p-2 border rounded" placeholder="Walk-in" value={store.customerName} onChange={(e) => store.setField('customerName', e.target.value)} /></div>
        <div><label className="block mb-1">Customer Phone (Optional)</label><input className="w-full p-2 border rounded" value={store.customerPhone} onChange={(e) => store.setField('customerPhone', e.target.value)} /></div>
        <div className="flex items-center space-x-2 pt-6">
          <input type="checkbox" checked={store.hasTax} onChange={(e) => store.setField('hasTax', e.target.checked)} className="h-4 w-4" />
          <label className="font-bold">Apply GST ({store.taxRate}%)</label>
        </div>
      </div>

      {/* 🟢 NAYA: Memory Manager (History) */}
      <div className="mt-10 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
        <div className="bg-slate-800 text-white p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-base font-bold flex items-center gap-2"><Save size={18}/> Local Trip Memory</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { const s = store.saveBillToHistory(grandTotal); if(s) showToast("Saved!"); else window.alert("⚠️ Duplicate bill!"); }} className="bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded text-xs font-bold transition">Save Current</button>
            <button onClick={() => { if(window.confirm("Delete selected?")) { store.deleteBillsFromHistory(store.selectedBills); showToast("Deleted!"); } }} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-xs font-bold transition"><Trash2 size={14}/></button>
            <button onClick={() => window.print()} className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition"><Printer size={14}/> Bulk Print</button>
          </div>
        </div>
        <div className="p-0 md:p-4 max-h-80 overflow-y-auto w-full custom-scrollbar">
          {(!store.billHistory || store.billHistory.length === 0) ? <p className="text-center text-slate-400 py-4 italic">No saved trips.</p> : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead className="border-b font-bold text-slate-500 uppercase text-[10px] bg-slate-50">
                  <tr>
                    <th className="p-3 w-8"><input type="checkbox" onChange={(e) => store.setSelectedBills(e.target.checked ? store.billHistory.map(b => b.id) : [])} checked={store.selectedBills.length === store.billHistory.length && store.billHistory.length > 0} /></th>
                    <th className="p-3">Customer / Vehicle</th><th className="p-3">Invoice & Date</th><th className="p-3">Amount</th><th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {store.billHistory.map((b, index) => (
                    <tr key={`${b.id}-${index}`} className="hover:bg-slate-50">
                      <td className="p-3"><input type="checkbox" checked={store.selectedBills.includes(b.id)} onChange={(e) => store.setSelectedBills(e.target.checked ? [...store.selectedBills, b.id] : store.selectedBills.filter(id => id !== b.id))} /></td>
                      <td className="p-3 font-bold leading-tight text-blue-900">{b.customerName || 'Walk-in'} <br/><span className="text-[10px] text-slate-500 font-normal uppercase">{b.vehicleNo}</span></td>
                      <td className="p-3">{b.invoiceNo} <br/><span className="text-slate-400 text-xs block">{b.date}</span></td>
                      <td className="p-3 font-mono font-bold text-emerald-600">{b.currency}{b.grandTotal?.toFixed(2)}</td>
                      <td className="p-3 text-right"><button onClick={() => { store.loadBillFromHistory(b); showToast("Loaded!"); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-indigo-600 hover:underline text-xs font-bold bg-indigo-50 px-2 py-1 rounded">Edit</button></td>
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
