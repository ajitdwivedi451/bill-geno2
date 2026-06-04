'use client';

import { useState, useMemo, useRef } from 'react';
import { useHotelStore, GuestRecord } from '@/store/useHotelStore';
import { EliteInput } from './shared/EliteInput';
import { Trash2, RefreshCw, Save, CheckCircle2, Settings2, Stamp, Pizza, User, Wallet, Building, Receipt, ShieldCheck, PenTool, Image as ImageIcon, Move, Palette, X, SlidersHorizontal, Database, ScrollText, DownloadCloud, Eye, Plus, Check, AlertTriangle } from 'lucide-react';

// 🟢 NEGATIVE VALUE DEFENSE
const safeNum = (val: any) => Math.max(0, isNaN(Number(val)) ? 0 : Number(val)); 

export default function HotelForm() {
  const store = useHotelStore();
  const [toastMsg, setToastMsg] = useState('');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'stay'|'billing'|'setup'>('stay');
  const [activeSetting, setActiveSetting] = useState<'logo' | 'signature' | 'guestSignature' | 'stamp' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCRM, setShowCRM] = useState(false);
  
  // Local state for POS DB & Delete Modal
  const [newPosName, setNewPosName] = useState('');
  const [newPosRate, setNewPosRate] = useState('');
  const [posCategory, setPosCategory] = useState<'service' | 'food'>('service');
  
  // 🟢 REFINED STATUS MODAL FOR DELETION
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null });

  const { grandTotal } = useMemo(() => {
    const roomSubtotal = safeNum(store.noOfDays) * safeNum(store.perDayCharge);
    const extraTotal = store.extraServices.filter(item => item.selected !== false).reduce((sum, item) => sum + (safeNum(item.qty) * safeNum(item.rate)), 0);
    const baseTotal = roomSubtotal + extraTotal + (store.showServiceCharge ? safeNum(store.serviceCharge) : 0);
    const discountAmount = store.discountType === 'PERCENT' ? (baseTotal * safeNum(store.discount)) / 100 : safeNum(store.discount);
    const totalBeforeTax = Math.max(0, baseTotal - discountAmount);
    const cgst = store.hasTax ? (totalBeforeTax * safeNum(store.cgstRate)) / 100 : 0;
    const sgst = store.hasTax ? (totalBeforeTax * safeNum(store.sgstRate)) / 100 : 0;
    return { grandTotal: totalBeforeTax + cgst + sgst };
  }, [store.noOfDays, store.perDayCharge, store.extraServices, store.showServiceCharge, store.serviceCharge, store.discountType, store.discount, store.hasTax, store.cgstRate, store.sgstRate]);

  const showToast = (msg: string) => { 
    setToastMsg(msg); 
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMsg(''), 3000); 
  };

  const executeAutoRoomGen = () => {
    const num = Math.floor(100 + Math.random() * 499).toString();
    store.setField('roomNo', num);
    showToast(`Allocated Room #${num}`);
  };

  // IMAGE PARSER
  const handleImageUploadRegistry = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature' | 'guestSignature' | 'stampImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 800;
        const scale = Math.min(MAX_WIDTH / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const makeTransparent = window.confirm("Make the image background transparent (Remove white background shadows)?");

        if (makeTransparent && ctx) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 210 && data[i+1] > 210 && data[i+2] > 210) data[i+3] = 0;
          }
          ctx.putImageData(imgData, 0, 0);
        }

        const outputBase64 = canvas.toDataURL('image/webp', 0.85);
        store.setField(field as any, outputBase64);
        showToast(`${field} parsed safely!`);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const applyGuestCRMData = (g: GuestRecord) => {
    store.setField('customerName', g.name); store.setField('customerPhone', g.phone); store.setField('customerAddress', g.address); store.setField('nationality', g.nationality);
    setShowCRM(false); showToast("Guest profile auto-filled!");
  };

  const confirmDeleteBill = () => {
    if (deleteModal.id) {
      store.deleteBillsFromHistory([deleteModal.id]);
      showToast("Bill permanently deleted!");
    }
    setDeleteModal({ isOpen: false, id: null });
  };

  const removeGalleryImage = (field: 'customLogos' | 'savedSignatures' | 'savedGuestSignatures' | 'savedStamps', url: string) => {
    const currentArray = (store as any)[field] || [];
    store.setField(field as any, currentArray.filter((item: string) => item !== url));
    showToast("Image removed from gallery!");
  };

  const exportToCSV = () => {
    if (store.billHistory.length === 0) return showToast("No data captured yet!");
    const headers = ["Invoice No,Date,Guest Name,Company,GSTIN,Total Amount,Payment Mode"];
    const rows = store.billHistory.map(b => `"${b.invoiceNo}","${b.date}","${b.customerName}","${b.guestCompany || ''}","${b.guestGstin || ''}","${b.grandTotal}","${b.paymentMode || 'CASH'}"`);
    const csvBlob = new Blob([headers.concat(rows).join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(csvBlob);
    link.setAttribute("download", `GSTR1_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast("ERP Sheet Exported!");
  };

  const downloadBackup = () => {
    const backupData = JSON.stringify(store);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([backupData], { type: "application/json" }));
    link.download = `HotelPMS_Vault_${new Date().toISOString().split('T')[0]}.json`;
    link.click(); showToast("Vault Backup Downloaded!");
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try { useHotelStore.setState(JSON.parse(event.target?.result as string)); showToast("Vault Restored Successfully!"); } 
      catch (err) { showToast("Invalid Backup File!"); }
    };
    reader.readAsText(file);
  };

  const InlineAdjuster = ({ type, title }: { type: 'logo' | 'signature' | 'guestSignature' | 'stamp', title: string }) => {
    if (activeSetting !== type) return null;
    const isStamp = type === 'stamp';
    return (
      <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200"><span className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2"><SlidersHorizontal size={14}/> {title} Tuning</span><button onClick={() => setActiveSetting(null)} className="text-slate-400 hover:text-red-500"><X size={16}/></button></div>
        <div className="space-y-5">
          <div><div className="flex justify-between"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scale / Size</label></div><input type="range" min="20" max="300" value={(store as any)[`${type}Size`] || 80} onChange={(e)=>store.setField(`${type}Size` as any, safeNum(e.target.value))} className="w-full accent-slate-900 h-1.5 mt-2"/></div>
          <div className="grid grid-cols-2 gap-6">
            <div><div className="flex justify-between"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">X (Left/Right)</label></div><input type="range" min={isStamp ? -100 : -300} max={isStamp ? 100 : 300} value={(store as any)[`${type}X`] || (isStamp ? 50 : 0)} onChange={(e)=>store.setField(`${type}X` as any, parseInt(e.target.value))} className="w-full accent-blue-600 h-1.5 mt-2"/></div>
            <div><div className="flex justify-between"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Y (Up/Down)</label></div><input type="range" min={isStamp ? -100 : -300} max={isStamp ? 100 : 300} value={(store as any)[`${type}Y`] || (isStamp ? 50 : 0)} onChange={(e)=>store.setField(`${type}Y` as any, parseInt(e.target.value))} className="w-full accent-emerald-600 h-1.5 mt-2"/></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      
      {/* DELETION STATUS MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-50 rounded-full"><AlertTriangle size={24} /></div>
              <h3 className="text-lg font-black tracking-tight text-slate-900">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6 font-medium">Are you sure you want to permanently delete this record? This action cannot be undone and will remove it from the database.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteModal({ isOpen: false, id: null })} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition">Cancel</button>
              <button onClick={confirmDeleteBill} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-red-200">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-400 px-5 py-2.5 rounded-full shadow-2xl z-[99999] flex items-center gap-2 text-sm font-bold border border-slate-700 animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 size={18} /> {toastMsg}
        </div>
      )}

      {/* CORE BRAND TOOLBAR HEADER */}
      <div className="flex flex-col sm:flex-row justify-between bg-slate-900 p-5 rounded-2xl shadow-lg gap-4 items-center border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Hotel PMS Center</h2>
          <p className="text-xs text-slate-400 font-medium tracking-wide">(Alt+N) Fresh Invoice | (Ctrl+S) Cache</p>
        </div>
        <button onClick={() => { store.startNewBill(); showToast("Fresh layout structured!"); }} className="w-full sm:w-auto flex items-center justify-center text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-5 py-2.5 rounded-xl transition shadow-sm">
          <RefreshCw size={14} className="mr-1.5" /> Next Bill
        </button>
      </div>

      {/* APPLICATION PRIMARY PANEL TABS */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl shadow-inner text-sm font-bold text-slate-500 gap-1 overflow-x-auto">
        <button onClick={()=>setActiveTab('stay')} className={`flex-1 py-3 px-3 flex justify-center items-center gap-2 rounded-lg transition-all ${activeTab==='stay'?'bg-white text-slate-900 shadow-sm':'hover:text-slate-700'}`}><User size={16}/> Guest & Stay</button>
        <button onClick={()=>setActiveTab('billing')} className={`flex-1 py-3 px-3 flex justify-center items-center gap-2 rounded-lg transition-all ${activeTab==='billing'?'bg-white text-slate-900 shadow-sm':'hover:text-slate-700'}`}><Receipt size={16}/> Billing & POS</button>
        <button onClick={()=>setActiveTab('setup')} className={`flex-1 py-3 px-3 flex justify-center items-center gap-2 rounded-lg transition-all ${activeTab==='setup'?'bg-white text-slate-900 shadow-sm':'hover:text-slate-700'}`}><Settings2 size={16}/> Elite Setup</button>
      </div>

      {/* 🟢 TAB 1: GUEST & STAY */}
      {activeTab === 'stay' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><User size={16} className="text-amber-500"/> Guest Profiles</h3>
              <div className="flex gap-2">
                <button onClick={() => setShowCRM(!showCRM)} className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1"><Eye size={12}/> {showCRM ? "Hide CRM" : "Open CRM Autofill"}</button>
                <button onClick={store.clearGuestDetails} className="text-slate-400 font-bold text-xs hover:text-red-500 transition flex items-center"><Trash2 size={12} className="mr-0.5"/> Clear</button>
              </div>
            </div>

            {showCRM && (
              <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select verified record from history:</p>
                {store.guestDatabase.length === 0 ? <p className="text-xs text-slate-400 italic">No guests stored yet.</p> : 
                  store.guestDatabase.map((g, idx) => (
                    <div key={idx} onClick={() => applyGuestCRMData(g)} className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-lg hover:border-blue-400 cursor-pointer text-xs font-medium transition">
                      <span className="font-bold text-slate-800">{g.name}</span><span className="text-slate-500">{g.phone} | {g.nationality}</span>
                    </div>
                  ))
                }
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EliteInput label="Guest Name" value={store.customerName} onChange={(e:any) => store.setField('customerName', e.target.value)} />
              <EliteInput label="Phone Number" value={store.customerPhone} onChange={(e:any) => store.setField('customerPhone', e.target.value)} />
              <div className="md:col-span-2"><EliteInput label="Full Address" value={store.customerAddress} onChange={(e:any) => store.setField('customerAddress', e.target.value)} /></div>
              <EliteInput label="Nationality" value={store.nationality} onChange={(e:any) => store.setField('nationality', e.target.value)} />
              <EliteInput label="Vehicle No (Optional)" value={store.vehicleNo} onChange={(e:any) => store.setField('vehicleNo', e.target.value)} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-5"><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Building size={16} className="text-amber-500"/> Core Allocation & Stay Management</h3></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <EliteInput label="Invoice Reference" value={store.invoiceNo} onChange={(e:any) => store.setField('invoiceNo', e.target.value)} />
              <EliteInput type="date" label="Billing Date" value={store.date} onChange={(e:any) => store.setField('date', e.target.value)} />
              <div className="relative">
                <EliteInput label="Room No" value={store.roomNo} onChange={(e:any) => store.setField('roomNo', e.target.value)} />
                <button onClick={executeAutoRoomGen} className="absolute right-2 top-8 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded border">Auto</button>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Room Category</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-bold text-slate-800 h-[42px]" value={store.roomType} onChange={(e) => store.setField('roomType', e.target.value)}>
                  <option value="Standard Non-AC">Standard Non-AC</option><option value="Deluxe AC">Deluxe AC</option><option value="Super Deluxe">Super Deluxe</option><option value="Premium Suite">Premium Suite</option><option value="Executive Family Room">Executive Family Room</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              
              {/* 🟢 RESTORED: BOOKING CHANNEL / OTA MANAGER */}
              <div className="flex flex-wrap gap-4 border-b border-slate-200 pb-4">
                <label className="flex items-center space-x-2 text-xs font-black text-slate-800 uppercase tracking-wider"><input type="checkbox" checked={store.showBookingSource} onChange={(e)=>store.setField('showBookingSource', e.target.checked)} className="accent-slate-900 w-4 h-4"/><span>Show Booking Source</span></label>
                {store.showBookingSource && (
                  <select className="p-2 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold text-slate-800" value={store.bookingSource} onChange={(e) => store.setField('bookingSource', e.target.value)}>
                    <option value="Direct Walk-in">Direct Walk-in</option><option value="MakeMyTrip">MakeMyTrip</option><option value="Goibibo">Goibibo</option><option value="OYO">OYO Rooms</option><option value="Agoda">Agoda</option><option value="Booking.com">Booking.com</option>
                  </select>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="flex-1 flex flex-col min-w-0">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Check-In Config</label>
                  <div className="flex gap-2">
                    <input type="date" className="flex-1 p-2 border rounded-lg text-xs font-bold bg-white min-w-0" value={store.checkInDate} onChange={(e)=>store.handleDateChange('checkInDate', e.target.value)}/>
                    <input type="time" className="w-24 p-2 border rounded-lg text-xs font-bold bg-white" value={store.checkInTime} onChange={(e)=>store.setField('checkInTime', e.target.value)}/>
                  </div>
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Check-Out Config</label>
                  <div className="flex gap-2">
                    <input type="date" className="flex-1 p-2 border rounded-lg text-xs font-bold bg-white min-w-0" value={store.checkOutDate} onChange={(e)=>store.handleDateChange('checkOutDate', e.target.value)}/>
                    <input type="time" className="w-24 p-2 border rounded-lg text-xs font-bold bg-white" value={store.checkOutTime} onChange={(e)=>store.setField('checkOutTime', e.target.value)}/>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-200">
                <div className="col-span-2 flex gap-2">
                  <div className="flex-1"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Adults</label><input type="number" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={store.adults} onChange={(e)=>store.setField('adults', safeNum(e.target.value))}/></div>
                  <div className="flex-1"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kids</label><input type="number" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={store.kids} onChange={(e)=>store.setField('kids', safeNum(e.target.value))}/></div>
                </div>
                <div><label className="block text-[10px] font-bold text-slate-900 uppercase mb-1">Rate / Night (₹)</label><input type="number" className="w-full p-2 bg-amber-50 border border-amber-200 text-slate-900 rounded-lg text-xs font-black" value={store.perDayCharge} onChange={(e)=>store.setField('perDayCharge', safeNum(e.target.value))}/></div>
                <div><label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Calculated Nights</label><input type="number" className="w-full p-2 bg-slate-900 text-white rounded-lg text-xs font-black text-center" value={store.noOfDays} readOnly /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 TAB 2: BILLING & POS */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4 mb-5"><Wallet size={16} className="text-emerald-500"/> Financial Adjustments</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div><label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Advance Paid (₹)</label><input type="number" className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg outline-none font-bold text-emerald-800 text-sm" value={store.advancePaid} onChange={(e) => store.setField('advancePaid', safeNum(e.target.value))} /></div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Discount Matrix</label><div className="flex bg-slate-50 rounded-lg border border-slate-200 overflow-hidden"><select className="px-3 bg-slate-100 border-r border-slate-200 outline-none font-bold text-xs" value={store.discountType} onChange={(e)=>store.setField('discountType', e.target.value as any)}><option value="FLAT">₹</option><option value="PERCENT">%</option></select><input type="number" className="w-full p-2 outline-none font-bold text-sm" value={store.discount} onChange={(e)=>store.setField('discount', safeNum(e.target.value))}/></div></div>
              <div><label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1">Payment Mode</label><select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800 text-sm" value={store.paymentMode} onChange={(e) => store.setField('paymentMode', e.target.value)}><option value="CASH">CASH</option><option value="ONLINE">ONLINE / UPI</option><option value="CARD">CARD</option><option value="BILL TO COMPANY">BILL TO COMPANY</option></select></div>
            </div>
            {/* 🟢 RESTORED: SERVICE CHARGE & AMOUNT IN WORDS TOGGLE */}
            <div className="flex gap-6 items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <label className="flex items-center space-x-2 text-xs font-black text-slate-800 uppercase tracking-wider"><input type="checkbox" checked={store.showServiceCharge} onChange={(e)=>store.setField('showServiceCharge', e.target.checked)} className="accent-slate-900 w-4 h-4"/><span>Apply Service Charge</span></label>
              {store.showServiceCharge && <input type="number" placeholder="Amount (₹)" className="p-2 outline-none font-bold text-xs border border-slate-200 rounded-lg w-32" value={store.serviceCharge} onChange={(e)=>store.setField('serviceCharge', safeNum(e.target.value))} />}
              <label className="flex items-center space-x-2 text-xs font-black text-indigo-600 uppercase tracking-wider ml-auto"><input type="checkbox" checked={store.amountInWords} onChange={(e)=>store.setField('amountInWords', e.target.checked)} className="accent-indigo-600 w-4 h-4"/><span>Show Amount in Words</span></label>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4 mb-4"><Pizza size={16} className="text-orange-500"/> POS Extras & Split Invoicing</h3>
            <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Click Add Registry:</p>
              <div className="flex flex-wrap gap-2">
                {[...store.serviceDB, ...store.foodDB].map((dbItem, index) => (
                  <button key={index} onClick={() => { store.quickAddPOSItem(dbItem.name, dbItem.rate); showToast(`Added ${dbItem.name}`); }} className="flex items-center gap-1 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-2xs transition">
                    <Plus size={12} className="text-slate-400"/> {dbItem.name} <span className="text-[10px] text-slate-400 font-normal">(₹{dbItem.rate})</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {store.extraServices.map((item, idx) => {
                const handleLocalChange = (val: string) => {
                  const found = [...store.serviceDB, ...store.foodDB].find(s => s.name === val);
                  store.updateExtraService(item.id, { name: val, rate: found ? found.rate : item.rate });
                };
                const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && idx === store.extraServices.length - 1) { e.preventDefault(); store.addExtraService(); } };
                return (
                  <div key={item.id} className={`grid grid-cols-12 gap-3 items-center p-2 rounded-lg border transition ${item.selected !== false ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-dashed border-slate-200 opacity-50'}`}>
                    <div className="col-span-1 flex justify-center"><input type="checkbox" checked={item.selected !== false} onChange={(e) => store.updateExtraService(item.id, { selected: e.target.checked })} className="w-4 h-4 accent-amber-500 cursor-pointer" title="Include in Grand Total" /></div>
                    <div className="col-span-4"><input className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-medium outline-none focus:border-slate-400" placeholder="Item/Service" value={item.name} onChange={(e) => handleLocalChange(e.target.value)} disabled={item.selected === false} /></div>
                    <div className="col-span-2"><input type="number" className="w-full p-2 bg-white border border-slate-200 rounded text-center text-xs outline-none focus:border-slate-400" placeholder="Qty" value={item.qty || ''} onChange={(e) => store.updateExtraService(item.id, { qty: safeNum(e.target.value) })} disabled={item.selected === false} /></div>
                    <div className="col-span-3 flex items-center bg-white border border-slate-200 rounded px-2"><span className="text-slate-400 text-xs mr-1">₹</span><input type="number" onKeyDown={handleKeyDown} className="w-full py-1.5 outline-none font-bold text-xs" placeholder="Rate (Enter to add)" value={item.rate || ''} onChange={(e) => store.updateExtraService(item.id, { rate: safeNum(e.target.value) })} disabled={item.selected === false} /></div>
                    <div className="col-span-2 flex justify-center"><button onClick={() => store.removeExtraService(item.id)} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={16} /></button></div>
                  </div>
                );
              })}
            </div>
            <button onClick={store.addExtraService} className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-50 transition">+ Append Custom Data Row</button>
          </div>

          {/* 🟢 POS DB MANAGER UI (RESTORED CATEGORIES) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-6">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4"><Database size={16} className="text-indigo-500"/> POS DB Manager</h2>
            <div className="flex flex-col md:flex-row gap-3 mb-4 items-end border-b border-slate-100 pb-5">
              <div className="w-full md:w-32">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-bold" value={posCategory} onChange={(e) => setPosCategory(e.target.value as any)}>
                  <option value="service">Services/Laundry</option><option value="food">Food & Beverage</option>
                </select>
              </div>
              <div className="flex-1 w-full"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item Name</label><input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium" placeholder="e.g. Dry Cleaning" value={newPosName} onChange={(e) => setNewPosName(e.target.value)} /></div>
              <div className="w-full md:w-24"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Rate (₹)</label><input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium" placeholder="150" value={newPosRate} onChange={(e) => setNewPosRate(e.target.value)} /></div>
              <button onClick={() => { if(newPosName && newPosRate) { store.addServiceToDB(posCategory, { name: newPosName, rate: Number(newPosRate) }); setNewPosName(''); setNewPosRate(''); showToast("Item Saved to DB!"); } }} className="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition w-full md:w-auto h-[40px]">Save</button>
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Services / Laundry</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {store.serviceDB.map((s, i) => (<div key={`s-${i}`} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700"><span className="truncate max-w-[120px]">{s.name}</span> <span className="text-slate-400 font-medium">(₹{s.rate})</span><button onClick={() => store.removeServiceFromDB('service', s.name)} className="text-red-300 hover:text-red-500 ml-1"><X size={12}/></button></div>))}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Food & Beverage</p>
              <div className="flex flex-wrap gap-2">
                {store.foodDB.map((s, i) => (<div key={`f-${i}`} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700"><span className="truncate max-w-[120px]">{s.name}</span> <span className="text-slate-400 font-medium">(₹{s.rate})</span><button onClick={() => store.removeServiceFromDB('food', s.name)} className="text-red-300 hover:text-red-500 ml-1"><X size={12}/></button></div>))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 TAB 3: ELITE MASTER SETUP */}
      {activeTab === 'setup' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 gap-6">
            
            {/* 🟢 RESTORED: PROPERTY CORE IDENTITY */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4 mb-4"><Building size={16} className="text-blue-500"/> Property Core Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><EliteInput label="Hotel / Property Name" value={store.hotelName} onChange={(e:any)=>store.setField('hotelName', e.target.value)} /></div>
                <div className="md:col-span-2"><EliteInput label="Full Property Address" value={store.address} onChange={(e:any)=>store.setField('address', e.target.value)} /></div>
                <EliteInput label="Phone Numbers" value={store.phone} onChange={(e:any)=>store.setField('phone', e.target.value)} />
                <EliteInput label="Official Email" value={store.email} onChange={(e:any)=>store.setField('email', e.target.value)} />
                <EliteInput label="Website URL" value={store.website} onChange={(e:any)=>store.setField('website', e.target.value)} />
                <EliteInput label="Property GSTIN" value={store.gstin} onChange={(e:any)=>store.setField('gstin', e.target.value)} />
                <EliteInput label="FSSAI License No." value={store.fssaiNo} onChange={(e:any)=>store.setField('fssaiNo', e.target.value)} />
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl shadow-md border border-slate-800">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-5"><ShieldCheck size={16} className="text-amber-400"/> Master UI Canvas Customization</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">15 Elite Formats Selector</label>
                    <select className="w-full p-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-bold outline-none" value={store.selectedTemplate} onChange={(e) => store.setField('selectedTemplate', Number(e.target.value))}><option value={1}>1. 5-Star Luxury Resort</option><option value={2}>2. Premium Corporate</option><option value={3}>3. MMT / Goibibo</option><option value={4}>4. OYO / Budget</option><option value={5}>5. Traditional Palace</option><option value={6}>6. Highway Dhaba</option><option value={7}>7. Boutique Homestay</option><option value={8}>8. Backpacker Hostel</option><option value={9}>9. GST Tax Invoice</option><option value={10}>10. Monthly Rent</option><option value={11}>11. Simple Receipt</option><option value={12}>12. Eco-Resort</option><option value={13}>13. Transit Lounge</option><option value={14}>14. Modern Minimalist</option><option value={15}>15. Custom DIY</option></select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Theme Palette</label>
                      <select className="w-full p-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-bold outline-none" value={store.themePreset} onChange={(e) => store.applyTheme(e.target.value)}><option value="ROYAL_GOLD">👑 Royal Gold</option><option value="MIDNIGHT_NAVY">🌌 Midnight Navy</option><option value="VINTAGE_SEPIA">📜 Vintage Sepia</option><option value="ELITE_CORPORATE">🏢 Corporate Charcoal</option></select>
                    </div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-0.5"><Palette size={10}/> Custom hex</label><input type="color" className="w-full h-[38px] rounded-lg cursor-pointer border-0 bg-slate-800" value={store.themeColor} onChange={(e)=>store.setField('themeColor', e.target.value)} /></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <EliteInput label="Header Brand Size" type="number" value={store.hotelNameSize} onChange={(e:any)=>store.setField('hotelNameSize', safeNum(e.target.value))}/>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Typography</label><select className="w-full p-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-bold outline-none" value={store.fontFamily} onChange={(e) => store.setField('fontFamily', e.target.value)}><option value="font-sans">Modern Sans-Serif</option><option value="font-serif">Classic Antiqua Serif</option><option value="font-mono">Monospace Courier Type</option></select></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4"><ScrollText size={16} className="text-rose-500"/> Rules & Policy Settings</h3>
              
              {/* 🟢 RESTORED: JURISDICTION CITY */}
              <div className="mb-4"><EliteInput label="Jurisdiction City (Subject to...)" value={store.jurisdictionCity} onChange={(e:any)=>store.setField('jurisdictionCity', e.target.value)} /></div>
              
              <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800" value={store.termsIndex} onChange={(e)=>store.setField('termsIndex', Number(e.target.value))}><option value={0}>Standard Rules (Check-out 11AM, Base non-refundable)</option><option value={1}>Strict Channels (MMT, Goibibo & OYO Rules)</option><option value={2}>Luxury Retreat Policy (Noise limits, Pool waivers)</option><option value={3}>Backpacker Dorm Rules (Self-service hygiene rules)</option><option value={6}>Omit Policies / Clean Blank Slate</option><option value={7}>✍️ CUSTOM BRAND RULES (Manual write down)</option></select>
              {store.termsIndex === 7 && <textarea rows={4} className="w-full mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-medium" placeholder="Write property policies here..." value={store.customTerms} onChange={(e)=>store.setField('customTerms', e.target.value)}></textarea>}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap gap-4 mb-4 border-b border-slate-100 pb-3">
                <label className="flex items-center space-x-2 text-xs font-black text-slate-800 uppercase tracking-wider"><input type="checkbox" checked={store.hasTax} onChange={(e)=>store.setField('hasTax', e.target.checked)} className="accent-slate-900 w-4 h-4"/><span>Apply GST Calculations</span></label>
                <label className="flex items-center space-x-2 text-xs font-black text-slate-800 uppercase tracking-wider"><input type="checkbox" checked={store.showSac} onChange={(e)=>store.setField('showSac', e.target.checked)} className="accent-slate-900 w-4 h-4"/><span>Activate SAC Logging</span></label>
                {store.showSac && <label className="flex items-center space-x-2 text-xs font-black text-indigo-600 uppercase tracking-wider"><input type="checkbox" checked={store.showSacOnHeaderOnly} onChange={(e)=>store.setField('showSacOnHeaderOnly', e.target.checked)} className="accent-indigo-600 w-4 h-4"/><span>Lock SAC on Header</span></label>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {store.hasTax && (<><EliteInput label="CGST Rate (%)" type="number" value={store.cgstRate} onChange={(e:any)=>store.setField('cgstRate', safeNum(e.target.value))}/><EliteInput label="SGST Rate (%)" type="number" value={store.sgstRate} onChange={(e:any)=>store.setField('sgstRate', safeNum(e.target.value))}/></>)}
                {store.showSac && <EliteInput label="SAC HSN Code" value={store.sacCode} onChange={(e:any)=>store.setField('sacCode', e.target.value)}/>}
              </div>
            </div>

            {/* DIGITAL ASSETS REGISTRIES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={16} className="text-blue-500"/> Logo Branding Control</h3>
                <label className="flex items-center space-x-1 text-xs font-bold cursor-pointer"><input type="checkbox" checked={store.showLogo} onChange={(e)=>store.setField('showLogo', e.target.checked)} className="w-3.5 h-3.5 accent-slate-900"/><span>Enable Logo</span></label>
              </div>
              {store.showLogo && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 items-center">
                    <input type="file" accept="image/*" onChange={(e)=>handleImageUploadRegistry(e, 'logo')} className="w-full text-xs text-slate-500 file:bg-slate-900 file:text-white file:rounded-lg file:text-xs file:px-3 file:py-1.5 file:border-0 file:mr-3 cursor-pointer" />
                    {store.logo && (
                      <div className="flex gap-1 shrink-0"><button onClick={()=>setActiveSetting(activeSetting==='logo'?null:'logo')} className={`p-2 rounded-lg ${activeSetting==='logo'?'bg-slate-900 text-white':'bg-slate-200 text-slate-700'}`}><Move size={14}/></button><button onClick={()=>store.saveImageToGallery('logo', store.logo!)} className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg font-bold"><Check size={12}/></button><button onClick={store.removeLogo} className="bg-red-50 text-red-600 text-xs px-2.5 py-1.5 rounded-lg font-bold">Clear</button></div>
                    )}
                  </div>
                  {store.customLogos && store.customLogos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {store.customLogos.map((img, i) => (
                        <div key={i} className="relative group shrink-0">
                          <img src={img} onClick={() => store.setField('logo', img)} className="h-10 w-auto border border-slate-200 rounded cursor-pointer hover:border-blue-500" alt="saved logo" />
                          <button onClick={() => removeGalleryImage('customLogos', img)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:block"><X size={10}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <InlineAdjuster type="logo" title="Logo Layout Matrix" />
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4"><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><PenTool size={16} className="text-indigo-500"/> Signatures Management</h3></div>
              <div className="flex gap-6 mb-5">
                <label className="flex items-center space-x-1 text-xs font-bold cursor-pointer"><input type="checkbox" checked={store.showGuestSignature} onChange={(e)=>store.setField('showGuestSignature', e.target.checked)} className="w-3.5 h-3.5 accent-slate-900"/><span>Guest Sign Box</span></label>
                <label className="flex items-center space-x-1 text-xs font-bold cursor-pointer"><input type="checkbox" checked={store.showSignature} onChange={(e)=>store.setField('showSignature', e.target.checked)} className="w-3.5 h-3.5 accent-slate-900"/><span>Auth Sign Box</span></label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {store.showGuestSignature && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Guest Signature Upload</p>
                    <div className="flex flex-col xl:flex-row gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                      <input type="file" accept="image/*" onChange={(e)=>handleImageUploadRegistry(e, 'guestSignature')} className="w-full text-[10px] text-slate-500 file:bg-slate-200 file:text-slate-700 file:rounded file:text-[10px] file:px-2 file:py-1 file:border-0 cursor-pointer" />
                      {store.guestSignature && (
                        <div className="flex gap-1"><button onClick={()=>setActiveSetting(activeSetting==='guestSignature'?null:'guestSignature')} className={`p-1.5 rounded ${activeSetting==='guestSignature'?'bg-slate-800 text-white':'bg-slate-100 text-slate-600'}`}><Move size={12}/></button><button onClick={()=>store.saveImageToGallery('guestSignature', store.guestSignature!)} className="bg-slate-800 text-white px-2 py-1 rounded text-[10px] font-bold"><Check size={10}/></button><button onClick={() => store.setField('guestSignature', null)} className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold">Del</button></div>
                      )}
                    </div>
                    {store.savedGuestSignatures && store.savedGuestSignatures.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {store.savedGuestSignatures.map((sig, i) => (
                          <div key={i} className="relative group shrink-0">
                            <img src={sig} onClick={() => store.setField('guestSignature', sig)} className="h-8 border border-slate-200 rounded cursor-pointer hover:border-slate-500 bg-white" alt="saved sign" />
                            <button onClick={() => removeGalleryImage('savedGuestSignatures', sig)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:block"><X size={10}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <InlineAdjuster type="guestSignature" title="Guest Sign Adjust" />
                  </div>
                )}

                {store.showSignature && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex gap-2">
                      <select className="w-1/2 p-2 bg-white border border-slate-200 rounded-lg outline-none text-[10px] font-bold text-slate-700" value={store.signatoryTitle} onChange={(e)=>store.setField('signatoryTitle', e.target.value)}><option value="Authorized Signatory">Authorized Signatory</option><option value="Manager">Manager</option><option value="CUSTOM">✍️ Custom...</option></select>
                      {store.signatoryTitle === 'CUSTOM' && <input type="text" placeholder="Type..." className="w-1/2 p-2 bg-white border border-slate-200 rounded-lg outline-none text-[10px] font-bold" value={store.customSignatory} onChange={(e)=>store.setField('customSignatory', e.target.value)} />}
                    </div>
                    <div className="flex flex-col xl:flex-row gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                      <input type="file" accept="image/*" onChange={(e)=>handleImageUploadRegistry(e, 'signature')} className="w-full text-[10px] text-slate-500 file:bg-slate-200 file:text-slate-700 file:rounded file:text-[10px] file:px-2 file:py-1 file:border-0 cursor-pointer" />
                      {store.signature && (
                        <div className="flex gap-1"><button onClick={()=>setActiveSetting(activeSetting==='signature'?null:'signature')} className={`p-1.5 rounded ${activeSetting==='signature'?'bg-slate-800 text-white':'bg-slate-100 text-slate-600'}`}><Move size={12}/></button><button onClick={()=>store.saveImageToGallery('signature', store.signature!)} className="bg-slate-800 text-white px-2 py-1 rounded text-[10px] font-bold"><Check size={10}/></button><button onClick={store.removeSignature} className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold">Del</button></div>
                      )}
                    </div>
                    {store.savedSignatures && store.savedSignatures.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {store.savedSignatures.map((sig, i) => (
                          <div key={i} className="relative group shrink-0">
                            <img src={sig} onClick={() => store.setField('signature', sig)} className="h-8 border border-slate-200 rounded cursor-pointer hover:border-slate-500 bg-white" alt="saved sign" />
                            <button onClick={() => removeGalleryImage('savedSignatures', sig)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:block"><X size={10}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <InlineAdjuster type="signature" title="Auth Signature Adjust" />
                  </div>
                )}
              </div>
            </div>

            {/* 🟢 RESTORED: STAMP ENGINE WITH UPLOAD/GALLERY/DELETE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4"><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Stamp size={16} className="text-teal-500"/> Digital Stamp / Muhar Control</h3>
                <label className="flex items-center space-x-1 text-xs font-bold cursor-pointer"><input type="checkbox" checked={store.showStamp} onChange={(e)=>store.setField('showStamp', e.target.checked)} className="w-3.5 h-3.5 accent-slate-900"/><span>Enable Stamp</span></label>
              </div>
              
              {store.showStamp && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-4">
                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preset Text Stamp</label><select className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold" value={store.stampType} onChange={(e)=>store.setField('stampType', e.target.value as any)}><option value="PAID">PAID</option><option value="DUE">DUE</option><option value="CANCELLED">CANCELLED</option><option value="MUHAR">MUHAR / APPROVED</option></select></div>
                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-0.5"><Palette size={10}/> Stamp Ink Color</label><input type="color" className="w-full h-8 rounded border-0 cursor-pointer bg-white" value={store.stampColor} onChange={(e)=>store.setField('stampColor', e.target.value)} /></div>
                    <button onClick={()=>setActiveSetting(activeSetting==='stamp'?null:'stamp')} className={`w-full py-2 flex items-center justify-center gap-2 rounded-lg text-xs font-bold border transition ${activeSetting==='stamp'?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}><Move size={14}/> Adjust Stamp Position</button>
                  </div>
                  
                  <div className="space-y-3 pt-4 md:pt-0 md:border-l border-slate-200 md:pl-6">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Or Upload Custom Stamp Image</p>
                    <div className="flex flex-col xl:flex-row gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                      <input type="file" accept="image/*" onChange={(e)=>handleImageUploadRegistry(e, 'stampImage' as any)} className="w-full text-[10px] text-slate-500 file:bg-slate-200 file:text-slate-700 file:rounded file:text-[10px] file:px-2 file:py-1 file:border-0 cursor-pointer" />
                      {(store as any).stampImage && (
                        <div className="flex gap-1"><button onClick={()=>store.saveImageToGallery('stampImage' as any, (store as any).stampImage)} className="bg-slate-800 text-white px-2 py-1 rounded text-[10px] font-bold"><Check size={10}/></button><button onClick={() => store.setField('stampImage' as any, null)} className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold">Del</button></div>
                      )}
                    </div>
                    {(store as any).savedStamps && (store as any).savedStamps.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {(store as any).savedStamps.map((sig: string, i: number) => (
                          <div key={i} className="relative group shrink-0">
                            <img src={sig} onClick={() => store.setField('stampImage' as any, sig)} className="h-10 border border-slate-200 rounded cursor-pointer hover:border-slate-500 bg-white" alt="saved stamp" />
                            <button onClick={() => removeGalleryImage('savedStamps', sig)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:block"><X size={10}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2"><InlineAdjuster type="stamp" title="Stamp Adjustments" /></div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* COMPACT MANAGEMENT CONTROL REGISTRY (DATA VAULT BACKUPS) */}
      <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden w-full relative">
        <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white"><Database size={16} className="text-amber-400"/> <span className="text-xs font-black uppercase tracking-widest">Memory Cloud Records</span></div>
          <div className="flex gap-2 w-full sm:w-auto">
            <label className="flex-1 sm:flex-none flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase px-4 py-2 rounded-lg transition cursor-pointer">Restore <input type="file" accept=".json" className="hidden" onChange={handleRestoreBackup} /></label>
            <button onClick={downloadBackup} className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase px-4 py-2 rounded-lg transition">Backup</button>
            <button onClick={exportToCSV} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase px-4 py-2 rounded-lg transition flex items-center justify-center gap-1"><DownloadCloud size={12}/> CSV</button>
            <button onClick={() => { const s = store.saveBillToHistory(grandTotal); if (s) showToast("Saved to system vault!"); else alert("Invoice ID collision detected!"); }} className="flex-1 sm:flex-none bg-amber-400 hover:bg-amber-300 text-slate-900 text-[10px] font-black uppercase px-4 py-2 rounded-lg transition">Save</button>
            <button onClick={() => setShowHistory(!showHistory)} className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-lg transition">History</button>
          </div>
        </div>

        {showHistory && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 max-h-[250px] overflow-y-auto custom-scrollbar">
            {store.billHistory.length === 0 ? <p className="text-xs text-slate-500 italic">Vault is completely vacant.</p> : (
              <div className="space-y-2">
                {store.billHistory.map((bill) => (
                  <div key={bill.id || bill.invoiceNo} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm text-xs text-white">
                    <div><p className="font-bold text-amber-400">{bill.invoiceNo}</p><p className="text-[11px] text-slate-400 mt-0.5">{bill.customerName} | ₹{bill.grandTotal}</p></div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { store.loadBillFromHistory(bill); showToast("Invoice records retrieved!"); setShowHistory(false); }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded-md text-[10px] tracking-wide uppercase transition">Load</button>
                      <button onClick={() => setDeleteModal({ isOpen: true, id: bill.id || bill.invoiceNo })} className="bg-red-950 text-red-400 p-1.5 rounded-md hover:bg-red-900 hover:text-red-200 transition" title="Delete permanently"><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}