'use client';

import { useState, useEffect, useRef } from 'react';
import { useHotelStore } from '@/store/useHotelStore';
import { usePOSShortcuts } from '@/hooks/usePOSShortcuts';
import { Plus, Trash2, X, RefreshCw, Save, CheckCircle2, Settings2, Download, Wand2, MapPin, Stamp, Pizza, User, Wallet, QrCode } from 'lucide-react';

export default function HotelForm() {
  const store = useHotelStore();
  const [toastMsg, setToastMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'stay'|'billing'|'setup'>('stay');
  const [newSvc, setNewSvc] = useState({ name: '', rate: '', type: 'service' });
  const workerRef = useRef<Worker | null>(null);

  const roomSubtotal = store.noOfDays * store.perDayCharge;
  const extraTotal = store.extraServices.reduce((sum, item) => sum + (item.amount || 0), 0);
  const baseTotal = roomSubtotal + extraTotal + (store.showServiceCharge ? store.serviceCharge : 0);
  const discountAmount = store.discountType === 'PERCENT' ? (baseTotal * store.discount) / 100 : store.discount;
  const totalBeforeTax = baseTotal - discountAmount;
  const cgst = store.hasTax ? (totalBeforeTax * store.cgstRate) / 100 : 0;
  const sgst = store.hasTax ? (totalBeforeTax * store.sgstRate) / 100 : 0;
  const grandTotal = totalBeforeTax + cgst + sgst;

  useEffect(() => { workerRef.current = new Worker(new URL('../workers/imageProcessor.worker.ts', import.meta.url)); return () => workerRef.current?.terminate(); }, []);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  usePOSShortcuts([
    { key: 'n', altKey: true, action: () => { store.startNewBill(); showToast("New Bill Generated!"); } },
    { key: 's', ctrlKey: true, action: () => { const s = store.saveBillToHistory(grandTotal); if (s) showToast("Saved to Memory!"); else window.alert("⚠️ Duplicate bill!"); } }
  ]);

  const handleBgRemoval = (field: 'logo' | 'signature') => {
    const imgSrc = field === 'logo' ? store.logo : store.signature;
    if (!imgSrc || !workerRef.current) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      ctx.drawImage(img, 0, 0); const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      workerRef.current!.postMessage({ imageData, type: field });
      workerRef.current!.onmessage = (e) => {
        const { processedData, type: returnedType } = e.data; ctx.putImageData(processedData, 0, 0);
        store.setField(returnedType as any, canvas.toDataURL('image/png')); showToast("BG Removed!");
      };
    }; img.src = imgSrc;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature' | 'qrCode') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { store.setField(field, reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleExtraNameChange = (id: string, name: string) => {
    let matchedRate = 0; const allSvc = [...store.serviceDB, ...store.foodDB];
    const found = allSvc.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (found) matchedRate = found.rate;
    store.updateExtraService(id, { name, rate: matchedRate > 0 ? matchedRate : undefined });
  };

  return (
    <div className="space-y-6 pb-10 text-sm">
      {toastMsg && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl z-[9999] flex items-center gap-2 font-bold"><CheckCircle2 size={16} className="text-emerald-400" /> {toastMsg}</div>}

      <div className="flex flex-col md:flex-row justify-between bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-inner gap-4 items-center">
        <div><h2 className="text-lg font-bold text-blue-900">Hotel PMS Center</h2><p className="text-xs text-blue-700">(Alt+N) New | (Ctrl+S) Save</p></div>
        <button onClick={() => { store.startNewBill(); showToast("New Booking Ready!"); }} className="flex items-center text-sm font-bold text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><RefreshCw size={16} className="mr-1" /> New Booking</button>
      </div>

      {/* 🟢 Smart Form Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-sm font-bold text-slate-500">
        <button onClick={()=>setActiveTab('stay')} className={`flex-1 py-3 flex justify-center items-center gap-2 ${activeTab==='stay'?'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600':'hover:bg-slate-50'}`}><User size={16}/> Guest & Stay</button>
        <button onClick={()=>setActiveTab('billing')} className={`flex-1 py-3 flex justify-center items-center gap-2 ${activeTab==='billing'?'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600':'hover:bg-slate-50'}`}><Pizza size={16}/> Billing & Extras</button>
        <button onClick={()=>setActiveTab('setup')} className={`flex-1 py-3 flex justify-center items-center gap-2 ${activeTab==='setup'?'bg-orange-50 text-orange-700 border-b-2 border-orange-600':'hover:bg-slate-50'}`}><Settings2 size={16}/> Elite Setup</button>
      </div>

      {/* TAB 1: GUEST & STAY */}
      {activeTab === 'stay' && (
        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-base font-bold">Primary Guest Details</h2>
            <button onClick={store.clearGuestDetails} className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded hover:bg-red-100"><Trash2 size={12} className="inline mr-1"/>Clear Guest Info</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2"><label className="block text-xs font-bold uppercase mb-1">Guest Name</label><input className="w-full p-2 border rounded font-bold outline-none" value={store.customerName} onChange={(e) => store.setField('customerName', e.target.value)} /></div>
            <div><label className="block text-xs font-bold uppercase mb-1">Phone</label><input className="w-full p-2 border rounded outline-none" value={store.customerPhone} onChange={(e) => store.setField('customerPhone', e.target.value)} /></div>
            <div className="row-start-2 col-span-2 md:col-span-2 md:row-start-1"><label className="block text-xs font-bold uppercase mb-1 text-slate-500">Address</label><input className="w-full p-2 border rounded outline-none" value={store.customerAddress} onChange={(e)=>store.setField('customerAddress', e.target.value)}/></div>
            <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500">Nationality</label><input className="w-full p-2 border rounded outline-none text-xs" value={store.nationality} onChange={(e)=>store.setField('nationality', e.target.value)}/></div>
            <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500">Vehicle No (Opt)</label><input className="w-full p-2 border rounded outline-none text-xs uppercase" value={store.vehicleNo} onChange={(e)=>store.setField('vehicleNo', e.target.value)}/></div>
          </div>

          <h2 className="text-base font-bold border-b pb-2 mt-4">Room & Stay Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded border">
            <div><label className="block text-xs font-bold uppercase mb-1">Invoice No</label><input className="w-full p-2 border rounded font-bold bg-white" value={store.invoiceNo} onChange={(e) => store.setField('invoiceNo', e.target.value)} /></div>
            <div><label className="block text-xs font-bold uppercase mb-1">Bill Date</label><input type="date" className="w-full p-2 border rounded bg-white" value={store.date} onChange={(e) => store.setField('date', e.target.value)} /></div>
            <div><label className="block text-xs font-bold uppercase mb-1">Room No</label><input className="w-full p-2 border rounded bg-white font-bold text-indigo-700" value={store.roomNo} onChange={(e) => store.setField('roomNo', e.target.value)} /></div>
            <div className="col-span-2"><label className="block text-xs font-bold uppercase mb-1">Room Type</label><input list="rt" className="w-full p-2 border rounded bg-white" value={store.roomType} onChange={(e) => store.setField('roomType', e.target.value)} /><datalist id="rt"><option value="Deluxe AC"/><option value="Super Deluxe"/><option value="Executive Suite"/><option value="Standard Non-AC"/></datalist></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="col-span-2"><label className="block text-xs font-bold uppercase mb-1">Pax (Guests)</label><div className="flex gap-2 items-center text-xs font-bold">Adults <input type="number" className="w-12 p-1.5 border rounded" value={store.adults} onChange={(e)=>store.setField('adults', Number(e.target.value))}/> Kids <input type="number" className="w-12 p-1.5 border rounded" value={store.kids} onChange={(e)=>store.setField('kids', Number(e.target.value))}/></div></div>
            <div><label className="block text-xs font-bold uppercase mb-1">Check-In</label><input type="date" className="w-full p-2 border rounded" value={store.checkInDate} onChange={(e) => store.handleDateChange('checkInDate', e.target.value)} /><input type="time" className="w-full p-1.5 border rounded mt-1 text-xs" value={store.checkInTime} onChange={(e) => store.setField('checkInTime', e.target.value)} /></div>
            <div><label className="block text-xs font-bold uppercase mb-1">Check-Out</label><input type="date" className="w-full p-2 border rounded" value={store.checkOutDate} onChange={(e) => store.handleDateChange('checkOutDate', e.target.value)} /><input type="time" className="w-full p-1.5 border rounded mt-1 text-xs" value={store.checkOutTime} onChange={(e) => store.setField('checkOutTime', e.target.value)} /></div>
            <div><label className="block text-xs font-bold text-indigo-600 uppercase mb-1">Total Nights</label><input type="number" className="w-full p-2 border rounded bg-indigo-50 font-bold" value={store.noOfDays} onChange={(e) => store.setField('noOfDays', Number(e.target.value))} /></div>
            <div><label className="block text-xs font-bold text-orange-800 uppercase mb-1">Rate/Night (₹)</label><input type="number" className="w-full p-2 border rounded font-mono border-orange-200" value={store.perDayCharge} onChange={(e) => store.setField('perDayCharge', Number(e.target.value))} /></div>
          </div>
        </div>
      )}

      {/* TAB 2: BILLING & EXTRAS */}
      {activeTab === 'billing' && (
        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4 animate-in fade-in zoom-in duration-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4 border-b">
            <div><label className="block text-xs font-bold uppercase mb-1 text-emerald-700">Advance Paid</label><input type="number" className="w-full p-2 border rounded font-mono font-bold text-emerald-600 bg-emerald-50" value={store.advancePaid} onChange={(e) => store.setField('advancePaid', Number(e.target.value))} /></div>
            <div><label className="block text-xs font-bold uppercase mb-1">Discount</label><div className="flex"><select className="p-2 border rounded-l outline-none font-bold" value={store.discountType} onChange={(e)=>store.setField('discountType', e.target.value as any)}><option value="FLAT">₹</option><option value="PERCENT">%</option></select><input type="number" className="w-full p-2 border rounded-r border-l-0 font-mono" value={store.discount} onChange={(e)=>store.setField('discount', Number(e.target.value))}/></div></div>
            <div><label className="block text-xs font-bold uppercase mb-1">Payment Mode</label><select className="w-full p-2 border rounded font-bold" value={store.paymentMode} onChange={(e) => store.setField('paymentMode', e.target.value)}><option value="CASH">CASH</option><option value="ONLINE">ONLINE / UPI</option><option value="CARD">CARD</option><option value="BILL TO COMPANY">BILL TO COMPANY</option></select></div>
          </div>
          <div>
            <h3 className="font-bold mb-2 text-indigo-700 flex items-center gap-1"><Pizza size={16}/> Extra Services & Food</h3>
            <datalist id="svc-db">{[...store.serviceDB, ...store.foodDB].map((s,i)=><option key={i} value={s.name}/>)}</datalist>
            {store.extraServices.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <div className="col-span-5"><input list="svc-db" className="w-full p-2 border rounded" placeholder="Type Laundry, Extra Bed..." value={item.name} onChange={(e) => handleExtraNameChange(item.id, e.target.value)} /></div>
                <div className="col-span-2"><input type="number" className="w-full p-2 border rounded text-center" placeholder="Qty" value={item.qty || ''} onChange={(e) => store.updateExtraService(item.id, { qty: Number(e.target.value) })} /></div>
                <div className="col-span-3"><input type="number" className="w-full p-2 border rounded" placeholder="Rate" value={item.rate || ''} onChange={(e) => store.updateExtraService(item.id, { rate: Number(e.target.value) })} /></div>
                <div className="col-span-2 flex justify-center"><button onClick={() => store.removeExtraService(item.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={16} /></button></div>
              </div>
            ))}
            <button onClick={store.addExtraService} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded mt-2 border border-indigo-200">+ Add New Item</button>
          </div>
        </div>
      )}

      {/* TAB 3: ELITE SETUP & BRANDING */}
      {activeTab === 'setup' && (
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-300 shadow-inner space-y-6 animate-in fade-in zoom-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded border shadow-sm">
            <div><label className="block text-xs font-bold mb-1">Luxury Theme Magic</label>
              <select className="w-full p-2 border rounded bg-indigo-50 font-bold text-indigo-800" value={store.themePreset} onChange={(e) => store.applyTheme(e.target.value)}>
                <option value="ROYAL_GOLD">👑 Royal Gold (Serif)</option><option value="MIDNIGHT_NAVY">🌌 Midnight Navy (Sans)</option><option value="VINTAGE_SEPIA">📜 Vintage Sepia</option><option value="ELITE_CORPORATE">🏢 Elite Corporate</option>
              </select>
            </div>
            <div><label className="block text-xs font-bold mb-1">14 Master Print Formats</label>
              <select className="w-full p-2 border rounded font-bold" value={store.selectedTemplate} onChange={(e) => store.setField('selectedTemplate', Number(e.target.value))}>
                <option value={1}>1. Luxury Resort (5-Star)</option><option value={2}>2. Corporate Business Hotel</option><option value={3}>3. Highway Lodge/Motel</option><option value={4}>4. Boutique Homestay</option>
                <option value={5}>5. Hostel / Dormitory</option><option value={6}>6. Traditional Heritage</option><option value={7}>7. Online OTA (MMT/Goibibo)</option><option value={8}>8. Guest House (Raw)</option>
                <option value={9}>9. Extended Stay / Rent</option><option value={10}>10. Modern Minimalist</option><option value={11}>11. Custom DIY Layout</option>
                <option value={12}>12. Full Page Simple Invoice</option><option value={13}>13. Full Page Corporate Detail</option><option value={14}>14. Full Page Resort Detail</option>
              </select>
            </div>
            <div>
              <label className="flex items-center space-x-2 text-xs font-bold mb-1 mt-1 cursor-pointer"><input type="checkbox" checked={store.showBookingSource} onChange={(e)=>store.setField('showBookingSource', e.target.checked)} className="accent-indigo-600"/><span>Show OTA Booking Source</span></label>
              {store.showBookingSource && <select className="w-full p-2 border rounded outline-none font-bold text-emerald-700 bg-emerald-50" value={store.bookingSource} onChange={(e)=>store.setField('bookingSource', e.target.value)}><option value="Walk-in">Walk-in</option><option value="OYO Rooms">OYO Rooms</option><option value="MakeMyTrip">MakeMyTrip</option><option value="Agoda">Agoda</option><option value="Booking.com">Booking.com</option><option value="Goibibo">Goibibo</option></select>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white border rounded shadow-sm">
            <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-3 gap-4 mb-2 pb-4 border-b">
              <div><label className="block text-xs font-bold">Hotel Name</label><input className="w-full p-1.5 border rounded" value={store.hotelName} onChange={(e)=>store.setField('hotelName', e.target.value)}/></div>
              <div><label className="block text-xs font-bold">Address</label><input className="w-full p-1.5 border rounded" value={store.address} onChange={(e)=>store.setField('address', e.target.value)}/></div>
              <div><label className="block text-xs font-bold">Phone</label><input className="w-full p-1.5 border rounded" value={store.phone} onChange={(e)=>store.setField('phone', e.target.value)}/></div>
              <div><label className="block text-xs font-bold">Email</label><input className="w-full p-1.5 border rounded" value={store.email} onChange={(e)=>store.setField('email', e.target.value)}/></div>
              <div><label className="block text-xs font-bold">Website</label><input className="w-full p-1.5 border rounded" value={store.website} onChange={(e)=>store.setField('website', e.target.value)}/></div>
              <div><label className="block text-xs font-bold text-indigo-600">Name Size: {store.hotelNameSize}px</label><input type="range" min="14" max="48" className="w-full accent-indigo-600 mt-1" value={store.hotelNameSize} onChange={(e)=>store.setField('hotelNameSize', Number(e.target.value))}/></div>
            </div>

            <div className="col-span-2 md:col-span-4 flex flex-wrap gap-4 pt-2 items-center border-b pb-4">
              <label className="flex items-center space-x-2 font-bold text-xs"><input type="checkbox" checked={store.hasTax} onChange={(e) => store.setField('hasTax', e.target.checked)} className="accent-indigo-600" /> <span>Apply GST</span></label>
              {store.hasTax && <div className="flex gap-2 items-center"><span className="text-xs">CGST%:</span><input type="number" className="w-12 p-1 border rounded text-xs" value={store.cgstRate} onChange={(e)=>store.setField('cgstRate', Number(e.target.value))}/><span className="text-xs">SGST%:</span><input type="number" className="w-12 p-1 border rounded text-xs" value={store.sgstRate} onChange={(e)=>store.setField('sgstRate', Number(e.target.value))}/></div>}
              {store.hasTax && <label className="flex items-center space-x-2 font-bold text-xs ml-2"><input type="checkbox" checked={store.showSac} onChange={(e) => store.setField('showSac', e.target.checked)} className="accent-indigo-600" /> <span>SAC Details:</span></label>}
              {store.hasTax && store.showSac && <input className="w-16 p-1 border rounded text-xs font-normal" value={store.sacCode} onChange={(e)=>store.setField('sacCode', e.target.value)}/>}
              <div className="flex gap-2 items-center ml-auto"><span className="font-bold text-xs">GSTIN:</span><input className="w-32 p-1 border rounded text-xs uppercase" value={store.gstin} onChange={(e)=>store.setField('gstin', e.target.value)}/></div>
            </div>

            {/* Bank Details & QR (Elite Block) */}
            <div className="col-span-2 md:col-span-4 grid grid-cols-2 gap-4 border-b pb-4 bg-blue-50 p-4 rounded">
              <div><label className="block text-xs font-bold mb-1 text-blue-900"><Wallet size={14} className="inline mr-1"/> Bank / UPI Details (Footer)</label><textarea className="w-full p-2 border rounded text-xs font-mono" rows={3} placeholder="Bank: HDFC&#10;A/c: 123456789&#10;IFSC: HDFC0001" value={store.bankDetails} onChange={(e)=>store.setField('bankDetails', e.target.value)}></textarea></div>
              <div>
                <label className="block text-xs font-bold mb-1 text-blue-900"><QrCode size={14} className="inline mr-1"/> QR Code Scanner</label>
                <div className="flex gap-2 mb-2">
                  <input type="file" accept="image/*" onChange={(e)=>handleImageUpload(e,'qrCode')} className="w-full p-1 border rounded text-xs bg-white"/>
                  {store.qrCode && <button onClick={()=>{store.saveImageToGallery('qrCode', store.qrCode!); showToast("QR Saved!");}} className="text-xs bg-indigo-100 text-indigo-700 px-2 rounded font-bold">Save</button>}
                  {store.qrCode && <button onClick={()=>store.setField('qrCode', null)} className="bg-red-500 text-white px-2 rounded text-xs">Clear</button>}
                </div>
                {store.qrCode && <div><label className="text-[10px] font-bold text-slate-500">QR Size: {store.qrSize}px</label><input type="range" min="40" max="150" value={store.qrSize} onChange={(e)=>store.setField('qrSize', Number(e.target.value))} className="w-full accent-blue-600 h-1"/></div>}
                {store.savedQRs.length > 0 && <div className="flex gap-2 overflow-x-auto mt-2 custom-scrollbar pb-1">{store.savedQRs.map((q, i) => (<div key={`qr-${i}`} className="relative shrink-0"><img src={q} onClick={()=>store.setField('qrCode', q)} className={`h-8 w-8 object-cover border-2 cursor-pointer rounded ${store.qrCode===q?'border-blue-600':'border-slate-200'}`} alt="qr"/><button onClick={()=>store.deleteImageFromGallery('qrCode',i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8}/></button></div>))}</div>}
              </div>
            </div>

            {/* Stamp Configuration */}
            <div className="col-span-2 md:col-span-4 bg-orange-50 border border-orange-200 p-4 rounded">
              <label className="flex items-center space-x-2 font-bold text-xs text-orange-900 mb-2 cursor-pointer"><input type="checkbox" checked={store.showStamp} onChange={(e) => store.setField('showStamp', e.target.checked)} className="accent-orange-600" /> <Stamp size={14}/> Enable Realistic Rubber Stamp (Muhar) & Watermarks</label>
              {store.showStamp && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-3">
                  <div className="col-span-2"><label className="block text-[10px] font-bold">Stamp Style</label>
                    <select className="w-full p-1.5 border rounded" value={store.stampType} onChange={(e)=>store.setField('stampType', e.target.value as any)}>
                      <option value="MUHAR">Format 1: Hotel Round Seal (Auto-Muhar)</option><option value="PAID">Format 2: PAID IN FULL</option><option value="DUE">Format 3: CASH DUE</option><option value="CANCELLED">Format 4: CANCELLED</option>
                    </select>
                  </div>
                  <div><label className="block text-[10px] font-bold">Stamp Ink Color</label>
                    <select className="w-full p-1.5 border rounded font-bold" style={{color: store.stampColor}} value={store.stampColor} onChange={(e)=>store.setField('stampColor', e.target.value)}>
                      <option value="#000080">Navy Blue</option><option value="#4169e1">Royal Blue</option><option value="#9b111e">Ruby Red</option><option value="#1a1a1a">Ink Black</option><option value="#047857">Emerald Green</option>
                    </select>
                  </div>
                  <div><label className="block text-[10px] font-bold">Ink Size</label><input type="range" min="80" max="300" value={store.stampSize} onChange={(e)=>store.setField('stampSize', Number(e.target.value))} className="w-full accent-orange-600"/></div>
                  <div><label className="block text-[10px] font-bold">Pos X (Left/Right)</label><input type="range" min="0" max="100" value={store.stampX} onChange={(e)=>store.setField('stampX', Number(e.target.value))} className="w-full accent-orange-600"/></div>
                  <div><label className="block text-[10px] font-bold">Pos Y (Top/Bottom)</label><input type="range" min="0" max="100" value={store.stampY} onChange={(e)=>store.setField('stampY', Number(e.target.value))} className="w-full accent-orange-600"/></div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded shadow-sm border">
            {/* Signature Gallery & Designation */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 font-bold cursor-pointer"><input type="checkbox" checked={store.showSignature} onChange={(e) => store.setField('showSignature', e.target.checked)} className="h-4 w-4 accent-indigo-600" /> <span>Show Signatures</span></label>
              {store.showSignature && (
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <select className="p-1 text-xs border rounded font-bold w-1/2" value={store.signatoryTitle} onChange={(e)=>store.setField('signatoryTitle', e.target.value)}>
                      <option value="Authorized Signatory">Authorized Signatory</option><option value="Receptionist">Receptionist</option><option value="Front Office Manager">Front Office Manager</option><option value="Duty Manager">Duty Manager</option><option value="Cashier">Cashier</option>
                    </select>
                    <label className="text-xs font-bold flex items-center gap-1"><input type="checkbox" checked={store.showGuestSignature} onChange={(e)=>store.setField('showGuestSignature', e.target.checked)}/> Guest Sign Box</label>
                  </div>
                  <div className="flex gap-2 mb-2 items-center">
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} className="w-full text-xs p-1 border rounded bg-white" />
                    {store.signature && <button onClick={()=>{store.saveImageToGallery('signature', store.signature!); showToast("Saved!");}} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold">Save</button>}
                    {store.signature && <button onClick={() => handleBgRemoval('signature')} className="text-xs bg-slate-800 text-white px-2 py-1 rounded">Rem BG</button>}
                    {store.signature && <button onClick={store.removeSignature} className="text-xs font-bold text-red-500 border border-red-200 px-2 py-1 rounded">Clear</button>}
                  </div>
                  {store.signature && <div className="mt-2"><label className="text-[10px] font-bold text-slate-500">Sign Size</label><input type="range" min="30" max="120" value={store.signatureSize} onChange={(e)=>store.setField('signatureSize', Number(e.target.value))} className="w-full accent-indigo-600 h-1"/></div>}
                  {store.savedSignatures.length > 0 && <div className="flex gap-2 overflow-x-auto mt-2 custom-scrollbar pb-1">{store.savedSignatures.map((s, i) => (<div key={`sig-${i}`} className="relative shrink-0"><img src={s} onClick={()=>store.setField('signature', s)} className={`h-8 w-14 object-contain border-2 cursor-pointer bg-white rounded ${store.signature===s?'border-indigo-600':'border-slate-200'}`} alt="sig"/><button onClick={()=>store.deleteImageFromGallery('signature',i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8}/></button></div>))}</div>}
                </div>
              )}
            </div>
            
            {/* Logo Gallery & Size */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 font-bold cursor-pointer"><input type="checkbox" checked={store.showLogo} onChange={(e) => store.setField('showLogo', e.target.checked)} className="h-4 w-4 accent-indigo-600" /> <span>Show Top Logo</span></label>
              {store.showLogo && (
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="flex gap-2 mb-2 items-center">
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="w-full text-xs p-1 border rounded bg-white" />
                    {store.logo && <button onClick={()=>{store.saveImageToGallery('logo', store.logo!); showToast("Saved!");}} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold">Save</button>}
                    {store.logo && <button onClick={() => handleBgRemoval('logo')} className="text-xs bg-slate-800 text-white px-2 py-1 rounded">Rem BG</button>}
                    {store.logo && <button onClick={store.removeLogo} className="text-xs font-bold text-red-500 border border-red-200 px-2 py-1 rounded">Clear</button>}
                  </div>
                  {store.logo && <div className="mt-2"><label className="text-[10px] font-bold text-slate-500">Logo Size</label><input type="range" min="40" max="200" value={store.logoSize} onChange={(e)=>store.setField('logoSize', Number(e.target.value))} className="w-full accent-indigo-600 h-1"/></div>}
                  {store.customLogos.length > 0 && <div className="flex gap-2 overflow-x-auto mt-2 custom-scrollbar pb-1">{store.customLogos.map((l, i) => (<div key={`log-${i}`} className="relative shrink-0"><img src={l} onClick={()=>store.setField('logo', l)} className={`h-8 w-8 object-contain border-2 cursor-pointer bg-white rounded ${store.logo===l?'border-indigo-600':'border-slate-200'}`} alt="logo"/><button onClick={()=>store.deleteImageFromGallery('logo',i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8}/></button></div>))}</div>}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded shadow-sm border">
            <div><label className="block text-xs font-bold mb-1">Color Override</label><input type="color" className="w-full h-8 cursor-pointer rounded" value={store.themeColor} onChange={(e)=>store.setField('themeColor', e.target.value)}/></div>
            <div><label className="block text-xs font-bold mb-1">Global Font Size</label><input type="number" className="w-full p-1.5 border rounded" value={store.fontSize} onChange={(e)=>{if(window.confirm("Size changes might affect A4 fitting. Proceed?")) store.setField('fontSize', Number(e.target.value));}}/></div>
            <div><label className="block text-xs font-bold mb-1">Font Family</label><select className="w-full p-1.5 border rounded text-xs" value={store.fontFamily} onChange={(e)=>store.setField('fontFamily', e.target.value)}><option value="font-sans">Modern (Sans)</option><option value="font-serif">Elegant (Serif)</option><option value="font-mono">Typewriter (Mono)</option><option value="'Courier New', Courier, monospace">Courier New</option><option value="'Space Mono', monospace">Space Mono</option></select></div>
            <div><label className="block text-xs font-bold mb-1">Jurisdiction City <MapPin size={10} className="inline"/></label><input className="w-full p-1.5 border rounded" value={store.jurisdictionCity} onChange={(e)=>store.setField('jurisdictionCity', e.target.value)}/></div>
            
            <div className="col-span-2 md:col-span-4 border-t pt-3">
              <label className="block text-xs font-bold mb-1">Terms & Conditions Policy</label>
              <select className="w-full p-1.5 border rounded" value={store.termsIndex} onChange={(e)=>store.setField('termsIndex', Number(e.target.value))}>
                <option value={0}>Standard (Check-out 11AM, Payment Non-Refundable)</option><option value={1}>Strict OTA Policy (As per MakeMyTrip/OYO Rules)</option>
                <option value={2}>Luxury Resort (No loud music, Pool timings apply)</option><option value={3}>Hostel Rules (Self-service, Bunk rules)</option>
                <option value={4}>Homestay (Respect local culture, No smoking inside)</option><option value={5}>Business Hotel (Corporate billing rules apply)</option>
                <option value={6}>Blank / No Terms</option>
                <option value={7}>✍️ CUSTOM (Write your own Terms)</option>
              </select>
              {store.termsIndex === 7 && <textarea rows={3} className="w-full mt-2 p-2 border rounded text-xs" placeholder="Type your custom terms here (1 per line)..." value={store.customTerms} onChange={(e)=>store.setField('customTerms', e.target.value)}></textarea>}
            </div>
          </div>
        </div>
      )}

      {/* Memory Manager Table */}
      <div className="mt-10 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
        <div className="bg-slate-800 text-white p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-base font-bold flex items-center gap-2"><Save size={18}/> Hotel Billing Memory</h2>
          <div className="flex gap-2">
            <button onClick={() => { const s = store.saveBillToHistory(grandTotal); if(s) showToast("Saved!"); else window.alert("⚠️ Duplicate!"); }} className="bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded text-xs font-bold transition">Save Current</button>
            <button onClick={() => { if(window.confirm("Delete selected?")) store.deleteBillsFromHistory(store.selectedBills); }} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-xs font-bold transition"><Trash2 size={14}/></button>
          </div>
        </div>
        <div className="p-0 md:p-3 max-h-80 overflow-y-auto w-full custom-scrollbar">
          {store.billHistory.length === 0 ? <p className="text-center text-slate-400 py-4 italic">No saved bills.</p> : (
            <div className="w-full">
              <table className="w-full text-left text-sm table-fixed">
                <thead className="border-b font-bold text-slate-500 uppercase text-[10px] bg-slate-50">
                  <tr>
                    <th className="p-2 w-10 text-center"><input type="checkbox" onChange={(e) => store.setSelectedBills(e.target.checked ? store.billHistory.map(b => b.id) : [])} checked={store.selectedBills.length === store.billHistory.length && store.billHistory.length > 0} className="accent-indigo-600 cursor-pointer"/></th>
                    <th className="p-2 w-2/5">Guest & Room</th><th className="p-2 w-1/4">Amount</th><th className="p-2 w-1/4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {store.billHistory.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center"><input type="checkbox" checked={store.selectedBills.includes(b.id)} onChange={(e) => store.setSelectedBills(e.target.checked ? [...store.selectedBills, b.id] : store.selectedBills.filter(id => id !== b.id))} className="accent-indigo-600 cursor-pointer"/></td>
                      <td className="p-2 overflow-hidden"><div className="font-bold leading-tight text-blue-900 truncate" title={b.customerName}>{b.customerName || 'Walk-in'}</div><div className="text-[10px] text-slate-500 font-normal">{b.invoiceNo} | Room: {b.roomNo}</div></td>
                      <td className="p-2 font-mono font-bold text-emerald-600 truncate">₹{b.grandTotal?.toFixed(2)}</td>
                      <td className="p-2 text-right"><button onClick={() => { store.loadBillFromHistory(b); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-indigo-600 hover:underline text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded transition hover:bg-indigo-100">Load</button></td>
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