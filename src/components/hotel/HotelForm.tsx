'use client';

import { useState, useMemo, useRef } from 'react';
import { useHotelStore, GuestRecord } from '@/store/useHotelStore';
import { EliteInput } from './shared/EliteInput';
import { Trash2, RefreshCw, Save, CheckCircle2, Settings2, Stamp, Pizza, User, Wallet, Building, Receipt, ShieldCheck, PenTool, Image as ImageIcon, Move, Palette, X, SlidersHorizontal, Database, ScrollText, DownloadCloud, Eye, Plus, Check } from 'lucide-react';

const safeNum = (val: any) => isNaN(Number(val)) ? 0 : Number(val);

const InlineAdjuster = ({ type, title, activeSetting, setActiveSetting, store }: { type: 'logo' | 'signature' | 'guestSignature' | 'stamp', title: string, activeSetting: string | null, setActiveSetting: any, store: any }) => {
  if (activeSetting !== type) return null;
  const isStamp = type === 'stamp';
  return (
    <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
        <span className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2"><SlidersHorizontal size={14}/> {title} Tuning</span>
        <button onClick={() => setActiveSetting(null)} className="text-slate-400 hover:text-red-500"><X size={16}/></button>
      </div>
      <div className="space-y-5">
        <div>
          <div className="flex justify-between"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scale / Size</label></div>
          <input type="range" min="20" max="300" value={store[`${type}Size`] ?? 80} onChange={(e)=>store.setField(`${type}Size`, safeNum(e.target.value))} className="w-full accent-slate-900 h-1.5 mt-2"/>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">X (Left/Right)</label></div>
            <input type="range" min={isStamp ? 0 : -300} max={isStamp ? 100 : 300} value={store[`${type}X`] ?? (isStamp ? 50 : 0)} onChange={(e)=>store.setField(`${type}X`, safeNum(e.target.value))} className="w-full accent-blue-600 h-1.5 mt-2"/>
          </div>
          <div>
            <div className="flex justify-between"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Y (Up/Down)</label></div>
            <input type="range" min={isStamp ? 0 : -300} max={isStamp ? 100 : 300} value={store[`${type}Y`] ?? (isStamp ? 50 : 0)} onChange={(e)=>store.setField(`${type}Y`, safeNum(e.target.value))} className="w-full accent-emerald-600 h-1.5 mt-2"/>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function HotelForm() {
  const store = useHotelStore();
  const [toastMsg, setToastMsg] = useState('');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'stay'|'billing'|'setup'>('stay');
  const [activeSetting, setActiveSetting] = useState<'logo' | 'signature' | 'guestSignature' | 'stamp' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCRM, setShowCRM] = useState(false);
  
  const [newPosName, setNewPosName] = useState('');
  const [newPosRate, setNewPosRate] = useState('');

  const { grandTotal } = useMemo(() => {
    const roomSubtotal = safeNum(store.noOfDays) * safeNum(store.perDayCharge);
    const extraTotal = store.extraServices.filter(item => item.selected !== false).reduce((sum, item) => sum + (safeNum(item.qty) * safeNum(item.rate)), 0);
    const baseTotal = roomSubtotal + extraTotal + (store.showServiceCharge ? safeNum(store.serviceCharge) : 0);
    const discountAmount = store.discountType === 'PERCENT' ? (baseTotal * safeNum(store.discount)) / 100 : safeNum(store.discount);
    const totalBeforeTax = baseTotal - discountAmount;
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

  const handleImageUploadRegistry = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature' | 'guestSignature' | 'stamp') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const makeTransparent = window.confirm("Do you want to make the image background transparent (Remove white background shadows)?");

        if (makeTransparent && ctx) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 210 && data[i+1] > 210 && data[i+2] > 210) {
              data[i+3] = 0; 
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        const outputBase64 = canvas.toDataURL('image/webp', 0.85);
        store.setField(field as any, outputBase64);
        showToast(`${field} parsed successfully!`);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const applyGuestCRMData = (g: GuestRecord) => {
    store.setField('customerName', g.name);
    store.setField('customerPhone', g.phone);
    store.setField('customerAddress', g.address);
    store.setField('nationality', g.nationality);
    setShowCRM(false);
    showToast("Guest profile auto-filled!");
  };

  const exportToCSV = () => {
    if (store.billHistory.length === 0) {
      showToast("No data captured yet!");
      return;
    }
    const headers = ["Invoice No,Date,Guest Name,Company,GSTIN,Total Amount,Payment Mode"];
    const rows = store.billHistory.map(b => `"${b.invoiceNo}","${b.date}","${b.customerName}","${b.guestCompany || ''}","${b.guestGstin || ''}","${b.grandTotal}","${b.paymentMode || 'CASH'}"`);
    const csvBlob = new Blob([headers.concat(rows).join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(csvBlob);
    link.setAttribute("download", `GSTR1_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("ERP Sheet Exported!");
  };

  const downloadBackup = () => {
    const backupData = JSON.stringify(store);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([backupData], { type: "application/json" }));
    link.download = `HotelPMS_Vault_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast("Vault Backup Downloaded!");
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        useHotelStore.setState(JSON.parse(event.target?.result as string));
        showToast("Vault Restored Successfully!");
      } catch (err) { showToast("Invalid Backup File!"); }
    };
    reader.readAsText(file);
  };

  const handleAddCustomPosItem = () => {
    if(newPosName && newPosRate) {
      store.quickAddPOSItem(newPosName, safeNum(newPosRate));
      setNewPosName('');
      setNewPosRate('');
      showToast(`Added ${newPosName} to Bill!`);
    } else {
      showToast("Enter Name and Rate first");
    }
  };


  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-400 px-5 py-2.5 rounded-full shadow-2xl z-[99999] flex items-center gap-2 text-sm font-bold border border-slate-700 animate-fade-in">
          <CheckCircle2 size={18} /> {toastMsg}
        </div>
      )}

      {/* CORE BRAND TOOLBAR HEADER */}
      <div className="flex flex-col sm:flex-row justify-between bg-slate-900 p-5 rounded-2xl shadow-lg gap-4 items-center border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Hotel PMS Center</h2>
          <p className="text-xs text-slate-400 font-medium tracking-wide">(Alt+N) Fresh Invoice | (Ctrl+S) Cache</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => { store.startNewBill(); showToast("Fresh layout structured!"); }} className="flex-1 flex items-center justify-center text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-4 py-2.5 rounded-xl transition shadow-sm">
            <RefreshCw size={14} className="mr-1.5" /> Next Bill
          </button>
        </div>
      </div>

      {/* APPLICATION PRIMARY PANEL TABS */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl shadow-inner text-sm font-bold text-slate-500 gap-1 overflow-x-auto">
        <button onClick={()=>setActiveTab('stay')} className={`flex-1 py-3 px-3 flex justify-center items-center gap-2 rounded-lg transition-all ${activeTab==='stay'?'bg-white text-slate-900 shadow-sm':'hover:text-slate-700'}`}><User size={16}/> Guest & Stay</button>
        <button onClick={()=>setActiveTab('billing')} className={`flex-1 py-3 px-3 flex justify-center items-center gap-2 rounded-lg transition-all ${activeTab==='billing'?'bg-white text-slate-900 shadow-sm':'hover:text-slate-700'}`}><Receipt size={16}/> Billing & POS</button>
        <button onClick={()=>setActiveTab('setup')} className={`flex-1 py-3 px-3 flex justify-center items-center gap-2 rounded-lg transition-all ${activeTab==='setup'?'bg-white text-slate-900 shadow-sm':'hover:text-slate-700'}`}><Settings2 size={16}/> Elite Setup</button>
      </div>

      {/* TAB CONTAINER CONTENT: REGISTRATION ENTRY */}
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
                {store.guestDatabase.length === 0 ? <p className="text-xs text-slate-400 italic">No guests stored yet. Saving a bill auto-caches the guest.</p> : 
                  store.guestDatabase.map((g, idx) => (
                    <div key={idx} onClick={() => applyGuestCRMData(g)} className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-lg hover:border-blue-400 cursor-pointer text-xs font-medium transition">
                      <span className="font-bold text-slate-800">{g.name}</span>
                      <span className="text-slate-500">{g.phone} | {g.nationality}</span>
                    </div>
                  ))
                }
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EliteInput label="Guest Name" value={store.customerName ?? ''} onChange={(e:any) => store.setField('customerName', e.target.value)} />
              <EliteInput label="Phone Number" value={store.customerPhone ?? ''} onChange={(e:any) => store.setField('customerPhone', e.target.value)} />
              <div className="md:col-span-2"><EliteInput label="Full Address" value={store.customerAddress ?? ''} onChange={(e:any) => store.setField('customerAddress', e.target.value)} /></div>
              <EliteInput label="Nationality" value={store.nationality ?? ''} onChange={(e:any) => store.setField('nationality', e.target.value)} />
              <EliteInput label="Vehicle No (Optional)" value={store.vehicleNo ?? ''} onChange={(e:any) => store.setField('vehicleNo', e.target.value)} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-5"><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Building size={16} className="text-amber-500"/> Core Allocation & Stay Management</h3></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <EliteInput label="Invoice Reference" value={store.invoiceNo ?? ''} onChange={(e:any) => store.setField('invoiceNo', e.target.value)} />
              <EliteInput type="date" label="Billing Date" value={store.date ?? ''} onChange={(e:any) => store.setField('date', e.target.value)} />
              <div className="relative">
                <EliteInput label="Room No" value={store.roomNo ?? ''} onChange={(e:any) => store.setField('roomNo', e.target.value)} />
                <button onClick={executeAutoRoomGen} className="absolute right-2 top-8 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded border">Auto</button>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Room Category</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-bold text-slate-800 h-[42px]" value={store.roomType ?? ''} onChange={(e) => store.setField('roomType', e.target.value)}>
                  <option value="Standard Non-AC">Standard Non-AC</option>
                  <option value="Deluxe AC">Deluxe AC</option>
                  <option value="Super Deluxe">Super Deluxe</option>
                  <option value="Premium Suite">Premium Suite</option>
                  <option value="Executive Family Room">Executive Family Room</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="flex-1 flex flex-col min-w-0">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Check-In Config</label>
                  <div className="flex gap-2">
                    <input type="date" className="flex-1 p-2 border rounded-lg text-xs font-bold bg-white min-w-0" value={store.checkInDate ?? ''} onChange={(e)=>store.setField('checkInDate', e.target.value)}/>
                    <input type="time" className="w-24 p-2 border rounded-lg text-xs font-bold bg-white" value={store.checkInTime ?? ''} onChange={(e)=>store.setField('checkInTime', e.target.value)}/>
                  </div>
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Check-Out Config</label>
                  <div className="flex gap-2">
                    <input type="date" className="flex-1 p-2 border rounded-lg text-xs font-bold bg-white min-w-0" value={store.checkOutDate ?? ''} onChange={(e)=>store.setField('checkOutDate', e.target.value)}/>
                    <input type="time" className="w-24 p-2 border rounded-lg text-xs font-bold bg-white" value={store.checkOutTime ?? ''} onChange={(e)=>store.setField('checkOutTime', e.target.value)}/>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-200">
                <div className="col-span-2 flex gap-2">
                  <div className="flex-1"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Adults</label><input type="number" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={store.adults ?? ''} onChange={(e)=>store.setField('adults', safeNum(e.target.value))}/></div>
                  <div className="flex-1"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kids</label><input type="number" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={store.kids ?? ''} onChange={(e)=>store.setField('kids', safeNum(e.target.value))}/></div>
                </div>
                <div><label className="block text-[10px] font-bold text-slate-900 uppercase mb-1">Rate / Night (₹)</label><input type="number" className="w-full p-2 bg-amber-50 border border-amber-200 text-slate-900 rounded-lg text-xs font-black" value={store.perDayCharge ?? ''} onChange={(e)=>store.setField('perDayCharge', safeNum(e.target.value))}/></div>
                <div><label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Calculated Nights</label><input type="number" className="w-full p-2 bg-slate-900 text-white rounded-lg text-xs font-black text-center" value={store.noOfDays ?? ''} readOnly /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTAINER CONTENT: BILLING SECTION */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4 mb-5"><Wallet size={16} className="text-emerald-500"/> Financial Adjustments</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Advance Paid (₹)</label><input type="number" className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg outline-none font-bold text-emerald-800 text-sm" value={store.advancePaid ?? ''} onChange={(e) => store.setField('advancePaid', safeNum(e.target.value))} /></div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Discount Matrix</label><div className="flex bg-slate-50 rounded-lg border border-slate-200 overflow-hidden"><select className="px-3 bg-slate-100 border-r border-slate-200 outline-none font-bold text-xs" value={store.discountType ?? 'FLAT'} onChange={(e)=>store.setField('discountType', e.target.value as any)}><option value="FLAT">₹</option><option value="PERCENT">%</option></select><input type="number" className="w-full p-2 outline-none font-bold text-sm" value={store.discount ?? ''} onChange={(e)=>store.setField('discount', safeNum(e.target.value))}/></div></div>
              <div><label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1">Payment Mode</label><select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800 text-sm" value={store.paymentMode ?? 'CASH'} onChange={(e) => store.setField('paymentMode', e.target.value)}><option value="CASH">CASH</option><option value="ONLINE">ONLINE / UPI</option><option value="CARD">CARD</option><option value="BILL TO COMPANY">BILL TO COMPANY</option></select></div>
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

            <div className="mb-5 flex gap-2 items-center bg-slate-50 p-2 border border-slate-200 rounded-xl">
              <input type="text" placeholder="Item / Service Name" className="flex-1 p-2 rounded bg-white border border-slate-200 text-xs font-medium outline-none" value={newPosName ?? ''} onChange={(e)=>setNewPosName(e.target.value)} />
              <input type="number" placeholder="Rate ₹" className="w-24 p-2 rounded bg-white border border-slate-200 text-xs font-medium outline-none" value={newPosRate ?? ''} onChange={(e)=>setNewPosRate(e.target.value)} />
              <button onClick={handleAddCustomPosItem} className="bg-slate-900 text-white px-4 py-2 rounded text-xs font-bold hover:bg-slate-800 transition">Add</button>
            </div>

            <div className="space-y-3">
              {store.extraServices.map((item, idx) => {
                const handleLocalChange = (val: string) => {
                  const found = [...store.serviceDB, ...store.foodDB].find(s => s.name === val);
                  store.updateExtraService(item.id, { name: val, rate: found ? found.rate : item.rate });
                };
                return (
                  <div key={item.id} className={`grid grid-cols-12 gap-3 items-center p-2 rounded-lg border transition ${item.selected !== false ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-dashed border-slate-200 opacity-50'}`}>
                    <div className="col-span-1 flex justify-center"><input type="checkbox" checked={item.selected !== false} onChange={(e) => store.updateExtraService(item.id, { selected: e.target.checked })} className="w-4 h-4 accent-amber-500 cursor-pointer" title="Include in Grand Total" /></div>
                    <div className="col-span-4"><input className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-medium" placeholder="Item/Service" value={item.name ?? ''} onChange={(e) => handleLocalChange(e.target.value)} disabled={item.selected === false} /></div>
                    <div className="col-span-2"><input type="number" className="w-full p-2 bg-white border border-slate-200 rounded text-center text-xs" placeholder="Qty" value={item.qty || ''} onChange={(e) => store.updateExtraService(item.id, { qty: safeNum(e.target.value) })} disabled={item.selected === false} /></div>
                    <div className="col-span-3 flex items-center bg-white border border-slate-200 rounded px-2"><span className="text-slate-400 text-xs mr-1">₹</span><input type="number" className="w-full py-1.5 outline-none font-bold text-xs" placeholder="Rate" value={item.rate || ''} onChange={(e) => store.updateExtraService(item.id, { rate: safeNum(e.target.value) })} disabled={item.selected === false} /></div>
                    <div className="col-span-2 flex justify-center"><button onClick={() => store.removeExtraService(item.id)} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={16} /></button></div>
                  </div>
                );
              })}
            </div>
            <button onClick={store.addExtraService} className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-50/50 transition">+ Append Custom Data Row</button>
          </div>
        </div>
      )}

      {/* TAB CONTAINER CONTENT: ELITE MASTER SETUP */}
      {activeTab === 'setup' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="bg-slate-900 p-5 rounded-2xl shadow-md border border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-5"><Building size={16} className="text-amber-400"/> Hotel Brand & Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EliteInput label="Hotel / Property Name" value={store.hotelName ?? ''} onChange={(e:any) => store.setField('hotelName', e.target.value)} />
              <EliteInput label="GSTIN Number" value={store.hotelGstin ?? ''} onChange={(e:any) => store.setField('hotelGstin', e.target.value)} />
              <div className="md:col-span-2">
                <EliteInput label="Full Address" value={store.hotelAddress ?? ''} onChange={(e:any) => store.setField('hotelAddress', e.target.value)} />
              </div>
              <EliteInput label="Contact Phone" value={store.hotelPhone ?? ''} onChange={(e:any) => store.setField('hotelPhone', e.target.value)} />
              <EliteInput label="Support Email" value={store.hotelEmail ?? ''} onChange={(e:any) => store.setField('hotelEmail', e.target.value)} />
              <EliteInput label="Website Link" value={store.website ?? ''} onChange={(e:any) => store.setField('website', e.target.value)} />
              <EliteInput label="FSSAI Number" value={store.fssaiNo ?? ''} onChange={(e:any) => store.setField('fssaiNo', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-slate-900 p-5 rounded-2xl shadow-md border border-slate-800">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-5"><ShieldCheck size={16} className="text-amber-400"/> Master UI Canvas Customization</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">15 Elite Formats Selector</label>
                    <select className="w-full p-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-bold outline-none" value={store.selectedTemplate ?? 1} onChange={(e) => store.setField('selectedTemplate', Number(e.target.value))}><option value={1}>1. 5-Star Luxury Resort</option><option value={2}>2. Premium Corporate</option><option value={3}>3. MMT / Goibibo</option><option value={4}>4. OYO / Budget</option><option value={5}>5. Traditional Palace</option><option value={6}>6. Highway Dhaba</option><option value={7}>7. Boutique Homestay</option><option value={8}>8. Backpacker Hostel</option><option value={9}>9. GST Tax Invoice</option><option value={10}>10. Monthly Rent</option><option value={11}>11. Simple Receipt</option><option value={12}>12. Eco-Resort</option><option value={13}>13. Transit Lounge</option><option value={14}>14. Modern Minimalist</option><option value={15}>15. Custom DIY</option></select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Theme Palette</label>
                      <select className="w-full p-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-bold outline-none" value={store.themePreset ?? 'ROYAL_GOLD'} onChange={(e) => store.applyTheme(e.target.value)}><option value="ROYAL_GOLD">👑 Royal Gold</option><option value="MIDNIGHT_NAVY">🌌 Midnight Navy</option><option value="VINTAGE_SEPIA">📜 Vintage Sepia</option><option value="ELITE_CORPORATE">🏢 Corporate Charcoal</option></select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-0.5"><Palette size={10}/> Custom hex</label>
                      <input type="color" className="w-full h-[38px] rounded-lg cursor-pointer border-0 bg-slate-800" value={store.themeColor ?? '#000000'} onChange={(e)=>store.setField('themeColor', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <EliteInput label="Header Brand Size" type="number" value={store.hotelNameSize ?? ''} onChange={(e:any)=>store.setField('hotelNameSize', safeNum(e.target.value))}/>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Typography Family</label>
                    <select className="w-full p-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-bold outline-none" value={store.fontFamily ?? ''} onChange={(e) => store.setField('fontFamily', e.target.value)}><option value="font-sans">Modern Sans-Serif</option><option value="font-serif">Classic Antiqua Serif</option><option value="font-mono">Monospace Courier Type</option></select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4"><ScrollText size={16} className="text-rose-500"/> Rules, Declarations & Policy Settings</h3>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800" value={store.termsIndex ?? 0} onChange={(e)=>store.setField('termsIndex', Number(e.target.value))}><option value={0}>Standard Rules (Check-out 11AM, Base non-refundable)</option><option value={1}>Strict Channels (MMT, Goibibo & OYO Rules)</option><option value={2}>Luxury Retreat Policy (Noise limits, Pool waivers)</option><option value={3}>Backpacker Dorm Rules (Self-service hygiene rules)</option><option value={6}>Omit Policies / Clean Blank Slate</option><option value={7}>✍️ CUSTOM BRAND RULES (Manual write down)</option></select>
              {store.termsIndex === 7 && <textarea rows={4} className="w-full mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-medium" placeholder="Write property policies here (Press enter for parsing line spacing breaks)..." value={store.customTerms ?? ''} onChange={(e)=>store.setField('customTerms', e.target.value)}></textarea>}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap gap-4 mb-4 border-b border-slate-100 pb-3">
                <label className="flex items-center space-x-2 text-xs font-black text-slate-800 uppercase tracking-wider"><input type="checkbox" checked={store.hasTax} onChange={(e)=>store.setField('hasTax', e.target.checked)} className="accent-slate-900 w-4 h-4"/><span>Apply GST Calculations</span></label>
                <label className="flex items-center space-x-2 text-xs font-black text-slate-800 uppercase tracking-wider"><input type="checkbox" checked={store.showSac} onChange={(e)=>store.setField('showSac', e.target.checked)} className="accent-slate-900 w-4 h-4"/><span>Activate SAC Logging</span></label>
                {store.showSac && <label className="flex items-center space-x-2 text-xs font-black text-indigo-600 uppercase tracking-wider"><input type="checkbox" checked={store.showSacOnHeaderOnly} onChange={(e)=>store.setField('showSacOnHeaderOnly', e.target.checked)} className="accent-indigo-600 w-4 h-4"/><span>Lock SAC on Header (No row repeat)</span></label>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {store.hasTax && (
                  <><EliteInput label="CGST Rate (%)" type="number" value={store.cgstRate ?? ''} onChange={(e:any)=>store.setField('cgstRate', safeNum(e.target.value))}/><EliteInput label="SGST Rate (%)" type="number" value={store.sgstRate ?? ''} onChange={(e:any)=>store.setField('sgstRate', safeNum(e.target.value))}/></>
                )}
                {store.showSac && <EliteInput label="SAC HSN Code" value={store.sacCode ?? ''} onChange={(e:any)=>store.setField('sacCode', e.target.value)}/>}
              </div>
            </div>

            {/* 🟢 LOGO SECTION */}
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
                      <div className="flex gap-1 shrink-0">
                        <button onClick={()=>setActiveSetting(activeSetting==='logo'?null:'logo')} className={`p-2 rounded-lg ${activeSetting==='logo'?'bg-slate-900 text-white':'bg-slate-200 text-slate-700'}`}><Move size={14}/></button>
                        <button onClick={()=>{ store.saveImageToGallery('logo', store.logo!); showToast("Logo Saved"); }} className="bg-slate-900 text-white p-2 rounded-lg" title="Save to Gallery"><Save size={14}/></button>
                        <button onClick={store.removeLogo} className="bg-red-50 text-red-600 text-xs px-2.5 py-1.5 rounded-lg font-bold">Clear</button>
                      </div>
                    )}
                  </div>
                  
                  {/* Logo Gallery */}
                  {store.customLogos && store.customLogos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto p-2 border border-slate-100 bg-slate-50 rounded-lg custom-scrollbar">
                      {store.customLogos.map((img, i) => (
                        <div key={i} className="relative shrink-0 group">
                          <img src={img} onClick={() => store.setField('logo', img)} className="h-10 w-10 object-contain border border-slate-200 bg-white rounded cursor-pointer hover:border-blue-500 transition-all" title="Click to use" />
                          <button onClick={(e) => { e.stopPropagation(); store.removeImageFromGallery('logo', img); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                            <X size={10}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <InlineAdjuster store={store} type="logo" title="Logo Layout Matrix" activeSetting={activeSetting} setActiveSetting={setActiveSetting} />
                </div>
              )}
            </div>

            {/* 🟢 SIGNATURE SECTION */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4"><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><PenTool size={16} className="text-indigo-500"/> Signature Sign Management</h3><label className="flex items-center space-x-1 text-xs font-bold cursor-pointer"><input type="checkbox" checked={store.showSignature} onChange={(e)=>store.setField('showSignature', e.target.checked)} className="w-3.5 h-3.5 accent-slate-900"/><span>Enable Auth Sign</span></label></div>
              {store.showSignature && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 items-center">
                    <input type="file" accept="image/*" onChange={(e)=>handleImageUploadRegistry(e, 'signature')} className="w-full text-xs text-slate-500 file:bg-slate-900 file:text-white file:rounded-lg file:text-xs file:px-3 file:py-1.5 file:border-0 file:mr-3 cursor-pointer" />
                    {store.signature && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={()=>setActiveSetting(activeSetting==='signature'?null:'signature')} className={`p-2 rounded-lg ${activeSetting==='signature'?'bg-slate-900 text-white':'bg-slate-200 text-slate-700'}`}><Move size={14}/></button>
                        <button onClick={()=>{ store.saveImageToGallery('signature', store.signature!); showToast("Sign Saved"); }} className="bg-slate-900 text-white p-2 rounded-lg" title="Save to Gallery"><Save size={14}/></button>
                        <button onClick={store.removeSignature} className="bg-red-50 text-red-600 text-xs px-2.5 py-1.5 rounded-lg font-bold">Clear</button>
                      </div>
                    )}
                  </div>

                  {/* Auth Sign Gallery */}
                  {store.savedSignatures && store.savedSignatures.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto p-2 border border-slate-100 bg-slate-50 rounded-lg custom-scrollbar">
                      {store.savedSignatures.map((img, i) => (
                        <div key={i} className="relative shrink-0 group">
                          <img src={img} onClick={() => store.setField('signature', img)} className="h-10 w-16 object-contain border border-slate-200 bg-white rounded cursor-pointer hover:border-blue-500 transition-all" title="Click to use" />
                          <button onClick={(e) => { e.stopPropagation(); store.removeImageFromGallery('signature', img); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                            <X size={10}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <InlineAdjuster store={store} type="signature" title="Auth Signature Alignment" activeSetting={activeSetting} setActiveSetting={setActiveSetting} />
                </div>
              )}
            </div>

            {/* 🟢 GUEST SIGNATURE SECTION */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4"><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><PenTool size={16} className="text-indigo-500"/> Guest Signature Management</h3><label className="flex items-center space-x-1 text-xs font-bold cursor-pointer"><input type="checkbox" checked={store.showGuestSignature} onChange={(e)=>store.setField('showGuestSignature', e.target.checked)} className="w-3.5 h-3.5 accent-slate-900"/><span>Enable Guest Sign</span></label></div>
              {store.showGuestSignature && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 items-center">
                    <input type="file" accept="image/*" onChange={(e)=>handleImageUploadRegistry(e, 'guestSignature')} className="w-full text-xs text-slate-500 file:bg-slate-900 file:text-white file:rounded-lg file:text-xs file:px-3 file:py-1.5 file:border-0 file:mr-3 cursor-pointer" />
                    {store.guestSignature && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={()=>setActiveSetting(activeSetting==='guestSignature'?null:'guestSignature')} className={`p-2 rounded-lg ${activeSetting==='guestSignature'?'bg-slate-900 text-white':'bg-slate-200 text-slate-700'}`}><Move size={14}/></button>
                        <button onClick={()=>{ store.saveImageToGallery('guestSignature', store.guestSignature!); showToast("Guest Sign Saved"); }} className="bg-slate-900 text-white p-2 rounded-lg" title="Save to Gallery"><Save size={14}/></button>
                        <button onClick={()=>store.setField('guestSignature', null)} className="bg-red-50 text-red-600 text-xs px-2.5 py-1.5 rounded-lg font-bold">Clear</button>
                      </div>
                    )}
                  </div>

                  {/* Guest Sign Gallery */}
                  {store.savedGuestSignatures && store.savedGuestSignatures.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto p-2 border border-slate-100 bg-slate-50 rounded-lg custom-scrollbar">
                      {store.savedGuestSignatures.map((img, i) => (
                        <div key={i} className="relative shrink-0 group">
                          <img src={img} onClick={() => store.setField('guestSignature', img)} className="h-10 w-16 object-contain border border-slate-200 bg-white rounded cursor-pointer hover:border-blue-500 transition-all" title="Click to use" />
                          <button onClick={(e) => { e.stopPropagation(); store.removeImageFromGallery('guestSignature', img); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                            <X size={10}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <InlineAdjuster store={store} type="guestSignature" title="Guest Signature Alignment" activeSetting={activeSetting} setActiveSetting={setActiveSetting} />
                </div>
              )}
            </div>

            {/* 🟢 STAMP SECTION */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Stamp size={16} className="text-rose-500"/> Official Stamp / Seal</h3>
                <label className="flex items-center space-x-1 text-xs font-bold cursor-pointer"><input type="checkbox" checked={store.showStamp} onChange={(e)=>store.setField('showStamp', e.target.checked)} className="w-3.5 h-3.5 accent-slate-900"/><span>Enable Stamp</span></label>
              </div>
              {store.showStamp && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Inbuilt Text Stamp</label>
                      <select className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none" value={store.stampType ?? 'MUHAR'} onChange={(e) => store.setField('stampType', e.target.value as any)}>
                        <option value="MUHAR">MUHAR (Round)</option>
                        <option value="PAID">PAID (Rect)</option>
                        <option value="DUE">DUE (Rect)</option>
                        <option value="CANCELLED">CANCELLED (Rect)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Stamp Color</label>
                      <input type="color" className="w-full h-[38px] rounded-lg cursor-pointer border-0 bg-white" value={store.stampColor ?? '#1e3a8a'} onChange={(e)=>store.setField('stampColor', e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 pl-1">Or Upload Custom Stamp Image</label>
                    <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 items-center">
                      <input type="file" accept="image/*" onChange={(e)=>handleImageUploadRegistry(e, 'stamp')} className="w-full text-xs text-slate-500 file:bg-slate-900 file:text-white file:rounded-lg file:text-xs file:px-3 file:py-1.5 file:border-0 file:mr-3 cursor-pointer" />
                      {store.stamp && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={()=>setActiveSetting(activeSetting==='stamp'?null:'stamp')} className={`p-2 rounded-lg ${activeSetting==='stamp'?'bg-slate-900 text-white':'bg-slate-200 text-slate-700'}`}><Move size={14}/></button>
                          <button onClick={()=>{ store.saveImageToGallery('stamp', store.stamp!); showToast("Stamp Saved"); }} className="bg-slate-900 text-white p-2 rounded-lg" title="Save to Gallery"><Save size={14}/></button>
                          <button onClick={()=>store.setField('stamp', null)} className="bg-red-50 text-red-600 text-xs px-2.5 py-1.5 rounded-lg font-bold">Clear</button>
                        </div>
                      )}
                    </div>

                    {/* Stamp Gallery */}
                    {store.savedStamps && store.savedStamps.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto p-2 border border-slate-100 bg-slate-50 rounded-lg custom-scrollbar mt-2">
                        {store.savedStamps.map((img, i) => (
                          <div key={i} className="relative shrink-0 group">
                            <img src={img} onClick={() => store.setField('stamp', img)} className="h-10 w-10 object-contain border border-slate-200 bg-white rounded cursor-pointer hover:border-blue-500 transition-all" title="Click to use" />
                            <button onClick={(e) => { e.stopPropagation(); store.removeImageFromGallery('stamp', img); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                              <X size={10}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                  <InlineAdjuster store={store} type="stamp" title="Stamp Placement" activeSetting={activeSetting} setActiveSetting={setActiveSetting} />
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* 🟢 COMPACT MANAGEMENT CONTROL REGISTRY (DATA VAULT BACKUPS) */}
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
                  <div key={bill.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm text-xs text-white">
                    <div><p className="font-bold text-amber-400">{bill.invoiceNo}</p><p className="text-[11px] text-slate-400 mt-0.5">{bill.customerName} | ₹{bill.grandTotal}</p></div>
                    <div className="flex gap-1.5"><button onClick={() => { store.loadBillFromHistory(bill); showToast("Invoice records retrieved!"); setShowHistory(false); }} className="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-md text-[10px] tracking-wide uppercase">Load</button><button onClick={() => store.deleteBillsFromHistory([bill.id])} className="bg-red-950 text-red-400 p-1.5 rounded-md hover:bg-red-900 transition"><Trash2 size={12}/></button></div>
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