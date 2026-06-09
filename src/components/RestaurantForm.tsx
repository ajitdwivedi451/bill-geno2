'use client';

import { useState, useEffect, useRef } from 'react';
import { usePOSShortcuts } from '@/hooks/usePOSShortcuts';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { RefreshCw, Trash2, X, Pipette, Layers3, UploadCloud, Save, Settings2, CheckCircle2, Download, Plus, Tag, Users, Clock } from 'lucide-react';

export function RestaurantForm() {
  const store = useRestaurantStore();
  const [toastMsg, setToastMsg] = useState('');
  const [isFullEdit, setIsFullEdit] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/imageProcessor.worker.ts', import.meta.url));
    return () => workerRef.current?.terminate();
  }, []);

  // 🟢 BUG FIX: Correct Tax Logic (Service charge separate, Tax only on Food + Pack)
  const getSubtotal = () => store.items.reduce((acc, item) => acc + (item.amt || 0), 0);
  const subtotal = getSubtotal();
  const discount = store.discountType === 'FLAT' ? store.discountValue : (subtotal * store.discountValue) / 100;
  const subAfterDisc = subtotal - discount;
  const serviceChargeAmt = store.hasServiceCharge ? (subAfterDisc * store.serviceChargeRate) / 100 : 0;
  const taxableAmt = subAfterDisc + Number(store.packagingCharge || 0); // Excluded Svc Chg from GST
  const cgstAmt = store.hasTax ? (taxableAmt * store.cgstRate) / 100 : 0;
  const sgstAmt = store.hasTax ? (taxableAmt * store.sgstRate) / 100 : 0;
  const grandTotal = taxableAmt + serviceChargeAmt + cgstAmt + sgstAmt;

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  usePOSShortcuts([
    { key: 'n', altKey: true, action: () => { store.startNewBill(); showToast("New Bill Generated!"); } },
    { key: 's', ctrlKey: true, action: () => { const s = store.saveBillToHistory(grandTotal); if(s) showToast("Saved!"); else window.alert("⚠️ Duplicate!"); } }
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
        if(returnedType === 'logo') store.setLogo(newImage); else if(returnedType === 'watermark') store.setWatermark(newImage); else store.setField('customPaperBG', newImage); 
        setIsProcessing(false);
      };
    }; img.src = imgSrc;
  };

  const handleItemNameChange = (id: string, name: string) => {
    let matchedRate = 0;
    const allMenus = [...store.breakfastMenu, ...store.lunchMenu, ...store.snacksMenu, ...store.dinnerMenu];
    const found = allMenus.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (found) matchedRate = found.rate;
    store.updateItem(id, { name, rate: matchedRate > 0 ? matchedRate : undefined });
  };

  const triggerBulkDownload = () => {
    if (store.selectedBills.length === 0) return alert("Select at least 1 bill.");
    window.dispatchEvent(new CustomEvent('bulk-download'));
    showToast("Preparing Bulk PDF...");
  };

  const currentMenu = store.mealType === 'BREAKFAST' ? store.breakfastMenu : store.mealType === 'LUNCH' ? store.lunchMenu : store.mealType === 'SNACKS' ? store.snacksMenu : store.dinnerMenu;

  const [newMenuItem, setNewMenuItem] = useState({ name: '', rate: '' });
  const handleAddMenu = () => {
    if (newMenuItem.name && newMenuItem.rate) {
      store.addMenuItem(store.mealType, { name: newMenuItem.name, rate: Number(newMenuItem.rate) });
      setNewMenuItem({ name: '', rate: '' });
      showToast("Menu Item Added!");
    }
  };

  return (
    <div className="space-y-6 text-sm pb-10 relative px-2 md:px-0">
      {toastMsg && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl z-[9999] flex items-center gap-2 font-bold"><CheckCircle2 size={16} className="text-emerald-400" /> {toastMsg}</div>}

      <div className="flex flex-col md:flex-row justify-between bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-inner gap-4 items-center">
        <div><h2 className="text-lg font-bold text-blue-900">POS Core</h2><p className="text-xs text-blue-700 font-mono">(Alt+N) New | (Ctrl+S) Save</p></div>
        <div className="flex gap-2">
          <button onClick={() => { store.startNewBill(); showToast("New Bill Ready!"); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow flex items-center gap-1 hover:bg-blue-700 transition"><RefreshCw size={16} /> New Bill</button>
          <button onClick={() => setIsFullEdit(!isFullEdit)} className={`px-4 py-2 rounded-lg font-bold shadow border flex items-center gap-1 transition ${isFullEdit ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'}`}><Settings2 size={16} /> Full Edit</button>
        </div>
      </div>

      <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold border-b pb-2 flex justify-between">
          <span>Everyday Details</span>
          <select className="p-1 border rounded text-xs font-bold bg-indigo-50 text-indigo-700 outline-none" value={store.orderType} onChange={(e) => store.setField('orderType', e.target.value as any)}>
            <option value="DINE-IN">Dine-In</option><option value="TAKEAWAY">Takeaway</option><option value="DELIVERY">Delivery</option>
          </select>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2">
            <label className="block mb-1 text-slate-500 text-xs font-bold uppercase">Customer Name</label>
            <input list="saved-customers" className="w-full p-2 border rounded font-bold outline-none focus:border-indigo-500" placeholder="Walk-in Guest" value={store.customerName} onChange={(e) => {
              store.setField('customerName', e.target.value);
              const found = store.savedCustomers.find(c => c.name === e.target.value);
              if(found) { store.setField('customerPhone', found.phone); store.setField('customerAddress', found.address); }
            }} />
            <datalist id="saved-customers">{store.savedCustomers.map((c, i) => <option key={i} value={c.name} />)}</datalist>
          </div>
          <div><label className="block mb-1 text-slate-500 text-xs font-bold uppercase">Phone</label><input className="w-full p-2 border rounded border-slate-300 outline-none" value={store.customerPhone} onChange={(e) => store.setField('customerPhone', e.target.value)} /></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className="block mb-1 font-bold text-blue-700 text-xs uppercase">Receipt No</label><input className="w-full p-2 border rounded bg-blue-50 font-bold border-blue-200 outline-none" value={store.receiptNo} onChange={(e) => store.setField('receiptNo', e.target.value)} /></div>
          <div><label className="block mb-1 text-slate-500 text-xs font-bold uppercase">Date</label><input type="date" className="w-full p-2 border rounded border-slate-300 outline-none" value={store.date} onChange={(e) => store.setField('date', e.target.value)} /></div>
          <div>
            <label className="flex items-center gap-1 mb-1 text-slate-500 text-xs font-bold uppercase">Time <button onClick={()=>store.setField('time', new Date().toLocaleTimeString('en-US', {hour12:false, hour:'2-digit', minute:'2-digit'}))} className="text-blue-500"><Clock size={12}/></button></label>
            <input type="time" className="w-full p-2 border rounded outline-none" value={store.time} onChange={(e) => store.setField('time', e.target.value)} />
          </div>
          <div><label className="block mb-1 text-slate-500 text-xs font-bold uppercase">Pay Mode</label>
            <select className="w-full p-2 border rounded border-slate-300 outline-none font-bold" value={store.paymentMode} onChange={(e) => store.setField('paymentMode', e.target.value as any)}>
              <option value="CASH">CASH</option><option value="ONLINE">ONLINE (UPI)</option><option value="CARD">CARD</option><option value="SPLIT">SPLIT (Cash + UPI)</option>
            </select>
          </div>
        </div>
        
        {store.paymentMode === 'SPLIT' && (
          <div className="grid grid-cols-2 gap-4 bg-orange-50 p-3 rounded border border-orange-200">
            <div><label className="block text-xs font-bold text-orange-800">Cash Received (₹)</label><input type="number" className="w-full p-1.5 border rounded outline-none" value={store.splitCash || ''} onChange={(e)=>{ store.setField('splitCash', Number(e.target.value)); store.setField('splitOnline', Number((grandTotal - Number(e.target.value)).toFixed(2))); }} /></div>
            <div><label className="block text-xs font-bold text-orange-800">Online/UPI Paid (₹)</label><input type="number" className="w-full p-1.5 border rounded outline-none bg-white" value={store.splitOnline || ''} onChange={(e)=>store.setField('splitOnline', Number(e.target.value))} /></div>
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Tag size={16}/> Items & Auto-Menu</h3>
            {/* 🟢 BUG FIX: Meal Dropdown triggering Auto Time */}
            <select className="p-1.5 border rounded-lg text-xs font-bold bg-orange-50 text-orange-700 outline-none border-orange-200" value={store.mealType} onChange={(e) => store.changeMealType(e.target.value as any)}>
              <option value="BREAKFAST">🍳 Breakfast</option><option value="LUNCH">🍛 Lunch</option><option value="SNACKS">🍟 Snacks</option><option value="DINNER">🍲 Dinner</option>
            </select>
          </div>

          <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase mb-2"><div className="col-span-5">Item Name</div><div className="col-span-2">Qty</div><div className="col-span-3">Rate</div><div className="col-span-2 text-center">Action</div></div>
          
          <datalist id="active-menu">{currentMenu.map((m, idx) => <option key={idx} value={m.name} />)}</datalist>

          <div className="space-y-2">
            {store.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5"><input list="active-menu" className="w-full p-2 border rounded font-bold outline-none focus:border-indigo-500" placeholder="Item name" value={item.name} onChange={(e) => handleItemNameChange(item.id, e.target.value)} /></div>
                <div className="col-span-2"><input type="number" className="w-full p-2 border rounded text-center font-mono outline-none focus:border-indigo-500" value={item.qty || ''} onChange={(e) => store.updateItem(item.id, { qty: Number(e.target.value) })} /></div>
                <div className="col-span-3"><input type="number" className="w-full p-2 border rounded font-mono outline-none focus:border-indigo-500" value={item.rate || ''} onChange={(e) => store.updateItem(item.id, { rate: Number(e.target.value) })} /></div>
                <div className="col-span-2 flex justify-center"><button onClick={() => store.removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button></div>
              </div>
            ))}
          </div>
          <button onClick={store.addItem} className="flex items-center text-xs font-bold text-indigo-600 mt-3 bg-indigo-50 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors"><Plus size={14} className="mr-1" /> Add Blank Row</button>
        </div>
      </div>

      {isFullEdit && (
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 shadow-inner space-y-4">
          <h2 className="text-base font-bold mb-2 flex items-center gap-2"><Settings2 size={18}/> 10 Elite POS Formats & Setup</h2>
          
          <div>
            <label className="block text-xs font-bold mb-1 text-indigo-700">Select Print Template Format</label>
            <select className="w-full p-2 border border-indigo-300 rounded font-bold bg-white text-indigo-900 outline-none" value={store.selectedTemplate} onChange={(e) => store.setField('selectedTemplate', Number(e.target.value))}>
              <option value={1}>1. Classic Fine Dine (Center Aligned, Detailed Taxes)</option><option value={2}>2. Modern Cafe / QSR (Left Aligned, Minimal)</option>
              <option value={3}>3. Highway Dhaba (Raw, Dashed Lines, No Tax Split)</option><option value={4}>4. Delivery Partner (Zomato/Swiggy Style, Order ID Focus)</option>
              <option value={5}>5. Bar & Pub (Bold Headers, Pax & Waiter Focused)</option><option value={6}>6. Food Court (Huge Token Number on Top)</option>
              <option value={7}>7. Bakery / Sweet Shop (Elegant Title Style)</option><option value={8}>8. South Indian / Udupi (Traditional Block Style)</option>
              <option value={9}>9. Buffet / BBQ (Per Head Pricing Focus)</option><option value={10}>10. Cloud Kitchen (Strict Order ID & Packing Detail)</option>
            </select>
          </div>

          <div className="bg-white p-3 border rounded shadow-sm">
            <h3 className="text-xs font-bold mb-2 flex items-center gap-1 text-slate-700"><Plus size={14}/> Permanent Menu Editor ({store.mealType})</h3>
            <div className="flex gap-2 mb-3">
              <input className="flex-1 p-1.5 text-xs border rounded outline-none" placeholder="New Item Name" value={newMenuItem.name} onChange={(e)=>setNewMenuItem({...newMenuItem, name: e.target.value})}/>
              <input type="number" className="w-24 p-1.5 text-xs border rounded outline-none" placeholder="Rate ₹" value={newMenuItem.rate} onChange={(e)=>setNewMenuItem({...newMenuItem, rate: e.target.value})}/>
              <button onClick={handleAddMenu} className="bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-bold">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-auto custom-scrollbar">
              {currentMenu.map((m, i) => (
                <div key={i} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-[10px] font-bold border border-slate-200">
                  {m.name} <span className="text-indigo-600">₹{m.rate}</span> <button onClick={()=>store.removeMenuItem(store.mealType, m.name)} className="text-red-500 ml-1"><X size={10}/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white border rounded shadow-sm">
            <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 mb-2 pb-2 border-b">
              <div><label className="block text-xs font-bold">Restaurant Name</label><input className="w-full p-1.5 border rounded outline-none" value={store.businessName} onChange={(e)=>store.setField('businessName', e.target.value)}/></div>
              <div className="col-span-2"><label className="block text-xs font-bold">Address</label><input className="w-full p-1.5 border rounded outline-none" value={store.address} onChange={(e)=>store.setField('address', e.target.value)}/></div>
              <div><label className="block text-xs font-bold">Phone No.</label><input className="w-full p-1.5 border rounded outline-none" value={store.phone || ''} onChange={(e)=>store.setField('phone', e.target.value)}/></div>
              <div><label className="block text-xs font-bold">FSSAI No.</label><input className="w-full p-1.5 border rounded outline-none" value={store.fssaiNo} onChange={(e)=>store.setField('fssaiNo', e.target.value)}/></div>
            </div>

            {store.selectedTemplate !== 4 && store.selectedTemplate !== 10 && <>
              <div><label className="block text-xs font-bold"><Users size={12} className="inline mr-1"/>Table No</label><input className="w-full p-1.5 border rounded outline-none" value={store.tableNo} onChange={(e)=>store.setField('tableNo', e.target.value)}/></div>
              <div><label className="block text-xs font-bold">Pax (Persons)</label><input className="w-full p-1.5 border rounded outline-none" value={store.pax} onChange={(e)=>store.setField('pax', e.target.value)}/></div>
              <div><label className="block text-xs font-bold">Waiter Name</label><input className="w-full p-1.5 border rounded outline-none" value={store.waiterName} onChange={(e)=>store.setField('waiterName', e.target.value)}/></div>
            </>}
            {(store.selectedTemplate === 4 || store.selectedTemplate === 10 || store.selectedTemplate === 6) && <div><label className="block text-xs font-bold text-red-600">Order / Token ID</label><input className="w-full p-1.5 border rounded outline-none" value={store.orderId} onChange={(e)=>store.setField('orderId', e.target.value)}/></div>}
            
            <div className="col-span-2 md:col-span-4 grid grid-cols-3 gap-4 pt-2 border-t">
               <div><label className="block text-xs font-bold">Discount Value</label><div className="flex"><select className="p-1.5 border rounded-l bg-slate-50 outline-none" value={store.discountType} onChange={(e)=>store.setField('discountType', e.target.value as any)}><option value="FLAT">₹</option><option value="PERCENT">%</option></select><input type="number" className="w-full p-1.5 border rounded-r border-l-0 outline-none" value={store.discountValue} onChange={(e)=>store.setField('discountValue', Number(e.target.value))}/></div></div>
               <div><label className="block text-xs font-bold">Packaging Charge (₹)</label><input type="number" className="w-full p-1.5 border rounded outline-none" value={store.packagingCharge} onChange={(e)=>store.setField('packagingCharge', Number(e.target.value))}/></div>
               <div><label className="block text-xs font-bold">Slogan (Footer)</label>
                 <select className="w-full p-1.5 border rounded outline-none text-[10px]" value={store.slogan} onChange={(e) => store.setField('slogan', e.target.value)}>
                   <option value="Thank you, Visit again !!">Thank you, Visit again !!</option>
                   <option value="A meal cooked with love. See you soon!">A meal cooked with love. See you soon!</option>
                   <option value="Hope you enjoyed the flavors. Have a great day!">Hope you enjoyed the flavors. Have a great day!</option>
                   <option value="Good Food, Good Mood. Thanks for dining with us!">Good Food, Good Mood. Thanks for dining with us!</option>
                   <option value="">(Blank / No Slogan)</option>
                 </select>
               </div>
            </div>
            
            <div className="col-span-2 md:col-span-4 flex flex-wrap gap-4 pt-2 border-t items-center bg-slate-50 p-2 rounded">
              <label className="flex items-center space-x-2 font-bold text-xs cursor-pointer"><input type="checkbox" checked={store.hasTax} onChange={(e) => store.setField('hasTax', e.target.checked)} className="accent-indigo-600 w-4 h-4" /> <span>Enable GST</span></label>
              {store.hasTax && <div className="flex gap-2 items-center"><span className="text-xs">CGST%:</span><input type="number" className="w-16 p-1 border rounded text-xs outline-none" value={store.cgstRate} onChange={(e)=>store.setField('cgstRate', Number(e.target.value))}/><span className="text-xs">SGST%:</span><input type="number" className="w-16 p-1 border rounded text-xs outline-none" value={store.sgstRate} onChange={(e)=>store.setField('sgstRate', Number(e.target.value))}/></div>}
              <label className="flex items-center space-x-2 font-bold text-xs ml-4 cursor-pointer"><input type="checkbox" checked={store.hasServiceCharge} onChange={(e) => store.setField('hasServiceCharge', e.target.checked)} className="accent-indigo-600 w-4 h-4" /> <span>Service Charge</span></label>
              {store.hasServiceCharge && <div className="flex gap-2 items-center"><span className="text-xs">Rate%:</span><input type="number" className="w-16 p-1 border rounded text-xs outline-none" value={store.serviceChargeRate} onChange={(e)=>store.setField('serviceChargeRate', Number(e.target.value))}/></div>}
            </div>
          </div>

          <div className="border border-slate-300 bg-white rounded-lg overflow-hidden flex flex-col md:flex-row text-xs font-bold mt-2">
            <button onClick={() => store.setField('paperMode', 'COLOR')} className={`p-2.5 flex-1 flex justify-center gap-1.5 ${store.paperMode === 'COLOR' ? 'bg-indigo-100 text-indigo-700' : 'bg-white'}`}><Pipette size={14}/> Flat Color</button>
            <button onClick={() => store.setField('paperMode', 'PRESET')} className={`p-2.5 flex-1 flex justify-center gap-1.5 border-y md:border-y-0 md:border-x ${store.paperMode === 'PRESET' ? 'bg-indigo-100 text-indigo-700' : 'bg-white'}`}><Layers3 size={14}/> Textures</button>
            <button onClick={() => store.setField('paperMode', 'CUSTOM')} className={`p-2.5 flex-1 flex justify-center gap-1.5 ${store.paperMode === 'CUSTOM' ? 'bg-indigo-100 text-indigo-700' : 'bg-white'}`}><UploadCloud size={14}/> Custom Paper</button>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-300">
            {store.paperMode === 'PRESET' && (
              <div className="flex md:grid md:grid-cols-5 gap-2">
                {[{ id: 1, name: 'Standard Thermal', bg: '#fdfcf8' }, { id: 2, name: 'Recycled Fiber', bg: '#e7e5e0' }, { id: 3, name: 'Crumpled Paper', bg: '#f4f4f5' }, { id: 4, name: 'Dirty Thermal', bg: '#f1f0da' }, { id: 5, name: 'Pure White', bg: '#ffffff' }].map((txt) => (
                  <button key={txt.id} onClick={() => store.setField('selectedTexture', txt.id)} className={`h-12 rounded border flex flex-col items-center justify-center min-w-[80px] transition ${store.selectedTexture === txt.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-200'}`}><span className="text-[9px] font-bold">{txt.name}</span></button>
                ))}
              </div>
            )}
            {store.paperMode === 'COLOR' && <div><input type="color" className="w-16 h-8 p-0 cursor-pointer" value={store.paperBackground} onChange={(e) => store.setField('paperBackground', e.target.value)} /></div>}
            {store.paperMode === 'CUSTOM' && (
              <div className="flex gap-2 items-center">
                {store.customPaperBG && <button onClick={() => store.savePaperToGallery(store.customPaperBG!)} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Save</button>}
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'customPaperBG')} className="w-full text-xs p-1 border rounded bg-slate-50" />
                {store.customPaperBG && <button onClick={() => store.setField('customPaperBG', null)} className="text-xs text-red-500 font-bold px-2 py-1 border border-red-200 rounded">Clear</button>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
            <div><label className="block text-xs font-bold mb-1">POS Width ({store.paperWidth}px)</label><input type="range" min="180" max="400" step="5" className="w-full accent-indigo-600" value={store.paperWidth} onChange={(e) => store.setField('paperWidth', Number(e.target.value))} /></div>
            <div><label className="block text-xs font-bold mb-1">Font Size ({store.posFontSize}px)</label>
              <input type="range" min="9" max="16" step="0.5" className="w-full accent-indigo-600" value={store.posFontSize} onChange={(e) => {
                if(!store.hasWarnedFont && window.confirm("Might break layout. Proceed?")) store.setField('hasWarnedFont', true); store.setField('posFontSize', Number(e.target.value));
              }} />
            </div>
            <div><label className="block text-xs font-bold mb-1">POS Font</label>
              <select className="w-full p-1.5 border rounded text-xs font-mono outline-none" value={store.receiptFont} onChange={(e) => store.setField('receiptFont', e.target.value)}>
                <option value="'Courier New', Courier, monospace">Courier (Standard)</option><option value="'Lucida Console', Monaco, monospace">Lucida (Sharp)</option>
                <option value="'VT323', monospace">VT323 (Dot Matrix)</option><option value="'Space Mono', monospace">Space Mono (Modern)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Memory Manager Table */}
      <div className="mt-10 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
        <div className="bg-slate-800 text-white p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-base font-bold flex items-center gap-2"><Save size={18}/> Local Bill Memory</h2>
          <div className="flex gap-2">
            <button onClick={() => { const s = store.saveBillToHistory(grandTotal); if(s) showToast("Saved!"); else window.alert("⚠️ Duplicate!"); }} className="bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded text-xs font-bold transition">Save Current</button>
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
                    <th className="p-2 w-2/5">Customer & Info</th><th className="p-2 w-1/4">Amount</th><th className="p-2 w-1/4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {store.billHistory.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center"><input type="checkbox" checked={store.selectedBills.includes(b.id)} onChange={(e) => store.setSelectedBills(e.target.checked ? [...store.selectedBills, b.id] : store.selectedBills.filter(id => id !== b.id))} className="accent-indigo-600 cursor-pointer"/></td>
                      <td className="p-2 overflow-hidden"><div className="font-bold leading-tight text-blue-900 truncate" title={b.customerName}>{b.customerName || 'Walk-in Guest'}</div><div className="text-[10px] text-slate-500 font-normal">{b.receiptNo} | {b.date ? b.date.split('-').reverse().join('/') : ''}</div></td>
                      <td className="p-2 font-mono font-bold text-emerald-600 truncate">₹{b.grandTotal?.toFixed(2)}</td>
                      <td className="p-2 text-right"><button onClick={() => { store.loadBillFromHistory(b); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-indigo-600 hover:underline text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded transition hover:bg-indigo-100">Edit</button></td>
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