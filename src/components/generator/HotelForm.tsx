'use client';

import { useHotelStore } from '@/store/useBillStore';
import { Plus, Trash2, X, Upload, Scan, RefreshCw } from 'lucide-react';

const PRESET_LOGOS = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M20 80 Q 5 50 20 20 Q 15 50 30 75 Z' fill='%230f172a'/%3E%3Cpath d='M80 80 Q 95 50 80 20 Q 85 50 70 75 Z' fill='%230f172a'/%3E%3Cpath d='M35 25 L50 10 L65 25 L60 30 L50 20 L40 30 Z' fill='%230f172a'/%3E%3Cpath d='M35 60 C 35 40, 65 40, 65 60 Z' fill='%230f172a'/%3E%3Cpath d='M30 65 H70 V72 H30 Z' fill='%230f172a'/%3E%3Cpath d='M47 35 H53 V40 H47 Z' fill='%230f172a'/%3E%3Cpath d='M30 80 L70 80' stroke='%23b45309' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M30 30 L50 20 L70 30 V60 L50 85 L30 60 Z' fill='%230f172a'/%3E%3Cpath d='M25 25 L50 15 L75 25 V62 L50 90 L25 62 Z' stroke='%23b45309' stroke-width='2' fill='none'/%3E%3Cpath d='M40 70 L60 40 M40 40 L60 70' stroke='%23b45309' stroke-width='4' stroke-linecap='round'/%3E%3Ccircle cx='40' cy='40' r='5' fill='%23b45309'/%3E%3Ccircle cx='60' cy='40' r='5' fill='%23b45309'/%3E%3Cpath d='M35 12 L50 2 L65 12 L60 15 L50 10 L40 15 Z' fill='%230f172a'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M35 60 L50 40 L65 60 V85 H35 Z' fill='%230f172a'/%3E%3Cpath d='M45 85 V70 H55 V85' fill='white'/%3E%3Cpath d='M25 85 Q 25 50 30 40 M75 85 Q 75 50 70 40' stroke='%230f172a' stroke-width='3'/%3E%3Cpath d='M30 40 Q 15 35 20 50 M30 40 Q 20 25 35 35' stroke='%230f172a' stroke-width='4' stroke-linecap='round'/%3E%3Cpath d='M70 40 Q 85 35 80 50 M70 40 Q 80 25 65 35' stroke='%230f172a' stroke-width='4' stroke-linecap='round'/%3E%3Cpath d='M10 88 H90' stroke='%23b45309' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M35 20 H65 V85 H35 Z' fill='%230f172a'/%3E%3Cpath d='M20 50 H35 V85 H20 Z' fill='%230f172a'/%3E%3Cpath d='M65 40 H80 V85 H65 Z' fill='%230f172a'/%3E%3Cpath d='M40 25 V85 M45 25 V85 M50 25 V85 M55 25 V85 M60 25 V85' stroke='white' stroke-width='2'/%3E%3Cpath d='M45 85 V75 H55 V85' fill='white'/%3E%3Cpath d='M10 88 H90' stroke='%23b45309' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' stroke='%230f172a' stroke-width='3' fill='none' stroke-dasharray='4 2'/%3E%3Ctext x='50' y='65' font-family='serif' font-size='40' font-weight='bold' text-anchor='middle' fill='%23b45309'%3EH%3C/text%3E%3Cpath d='M30 80 Q 50 95 70 80' stroke='%230f172a' stroke-width='4' stroke-linecap='round' fill='none'/%3E%3C/svg%3E"
];

export default function HotelForm() {
  const store = useHotelStore();

  const removeWhiteBackground = (dataUrl: string) => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl); 
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data; 

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]; const g = data[i + 1]; const b = data[i + 2];
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; 
          }
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature' | 'customBackground') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        store.setField(field, base64);
        if (field === 'logo') store.addCustomLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgRemoval = async (field: 'logo' | 'signature') => {
    const imgData = field === 'logo' ? store.logo : store.signature;
    if (!imgData) return;
    if (imgData.includes('image/svg+xml')) {
        alert("Ye SVG image hai, ye pehle se transparent hai.");
        return;
    }
    try {
        const transparentImg = await removeWhiteBackground(imgData);
        store.setField(field, transparentImg);
        alert("Succeeded! White background removal applied.");
    } catch (error) {
        console.error("BG Removal failed", error);
        alert("Failed to remove background.");
    }
  };

  const combinedLogos = [...store.customLogos, ...PRESET_LOGOS];

  return (
    <div className="space-y-6">
      
      {/* 🎨 Appearance Settings */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h2 className="text-lg font-bold mb-3 text-slate-800 border-b pb-2">Appearance & Settings</h2>
        
        {/* 🟢 11 FORMATS INCLUDED NOW */}
        <div className="grid grid-cols-5 md:grid-cols-6 gap-2 mb-4">
          {[...Array(11)].map((_, i) => (
            <button key={i + 1} onClick={() => store.setField('selectedTemplate', i + 1)}
              className={`p-2 text-sm font-bold border rounded transition-all ${
                store.selectedTemplate === i + 1 ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}>
                {i + 1 === 11 ? 'Custom (11)' : `Format ${i + 1}`}
              </button>
          ))}
        </div>

        {/* 🟢 Custom Background Uploader (Shows only for Format 11) */}
        {store.selectedTemplate === 11 && (
          <div className="mb-4 bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-purple-800">Upload Custom Layout Background (A4 Size)</label>
              {store.customBackground && <button onClick={() => store.setField('customBackground', null)} className="text-xs text-red-500 flex items-center"><X size={12} className="mr-1"/> Remove</button>}
            </div>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'customBackground')} className="w-full text-sm" />
            <p className="text-xs text-purple-600 mt-1">Upload an image (like your letterhead or specific design) to act as the full page background.</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div><label className="block text-sm font-medium mb-1">Theme Color</label><input type="color" className="w-full h-10 p-1 border rounded cursor-pointer" value={store.themeColor} onChange={(e) => store.setField('themeColor', e.target.value)} /></div>
          <div>
            <label className="block text-sm font-medium mb-1">Font Style</label>
            <select className="w-full p-2 border rounded outline-none bg-white" value={store.fontFamily} onChange={(e) => store.setField('fontFamily', e.target.value)}>
              <option value="font-sans">Modern (Sans)</option><option value="font-serif">Elegant (Serif)</option><option value="font-mono">Typewriter (Mono)</option>
              <option value="Arial, sans-serif">Arial (Classic)</option><option value="Georgia, serif">Georgia (Royal)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <select className="w-full p-2 border rounded outline-none bg-white" value={store.currency} onChange={(e) => store.setField('currency', e.target.value)}>
              <option value="₹">₹ (INR)</option><option value="$">$ (USD)</option><option value="€">€ (EUR)</option><option value="£">£ (GBP)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
          <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={store.showLogo} onChange={(e) => store.setField('showLogo', e.target.checked)} className="w-4 h-4" /><span>Show Logo</span></label>
          <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={store.showSignature} onChange={(e) => store.setField('showSignature', e.target.checked)} className="w-4 h-4" /><span>Show Signature</span></label>
          <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={store.showPoweredBy} onChange={(e) => store.setField('showPoweredBy', e.target.checked)} className="w-4 h-4" /><span>Show 'Billgeno'</span></label>
        </div>
      </div>

      {/* Hotel Details & Branding */}
      <h2 className="text-xl font-semibold border-b pb-2 mt-6">Hotel Details & Branding</h2>
      
      {store.showLogo && (
        <div className="mb-4 bg-white p-4 border border-blue-200 rounded-lg shadow-sm relative">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-bold text-slate-700">Hotel Logo</label>
            <div className='flex gap-2'>
                {store.logo && !store.logo.includes('image/svg+xml') && (
                    <button 
                        onClick={() => handleBgRemoval('logo')} 
                        className="text-xs text-blue-600 font-medium flex items-center bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition"
                    >
                        <Scan size={14} className="mr-1.5"/> Auto Remove White BG
                    </button>
                )}
                {store.logo && <button onClick={() => store.setField('logo', null)} className="text-xs text-red-500 flex items-center bg-red-50 px-2.5 py-1 rounded-full hover:bg-red-100 transition"><X size={12} className="mr-1"/> Remove</button>}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition group bg-blue-50/50">
              <Upload size={20} className="text-blue-500 mr-3 group-hover:scale-110 transition-transform" />
              <div className='flex flex-col'>
                  <span className="text-sm font-semibold text-blue-700">Upload Your Own Image</span>
                  <span className="text-xs text-slate-500">It will be saved below in your gallery</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
            </label>
          </div>

          <p className="text-xs text-slate-500 mb-2 font-medium">Your Gallery (Select one to use):</p>
          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar">
            {combinedLogos.map((src, idx) => (
              <div key={idx} className='relative flex-shrink-0'>
                <img 
                    src={src} alt={`logo-${idx}`} 
                    onClick={() => store.setField('logo', src)}
                    className={`w-16 h-16 object-contain p-1 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${store.logo === src ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' : 'border-slate-200 bg-white'}`}
                />
                {store.logo === src && <div className='absolute -top-1.5 -right-1.5 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold'>✓</div>}
                {idx < store.customLogos.length && <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1.5 rounded-full whitespace-nowrap">Yours</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* 🟢 Signature Upload + BG Remove Option */}
        {store.showSignature && (
          <div className="col-span-2 md:col-span-1 border border-slate-200 p-3 rounded-lg bg-white">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-blue-600 font-bold">Upload Signature</label>
              <div className="flex gap-2">
                {store.signature && !store.signature.includes('image/svg+xml') && (
                  <button onClick={() => handleBgRemoval('signature')} className="text-xs text-blue-600 font-medium flex items-center bg-blue-50 px-2 py-1 rounded-full hover:bg-blue-100 transition">
                    <Scan size={12} className="mr-1"/> Remove BG
                  </button>
                )}
                {store.signature && <button onClick={() => store.setField('signature', null)} className="text-xs text-red-500"><X size={14}/></button>}
              </div>
            </div>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} className="w-full text-sm" />
          </div>
        )}
        
        <div className={store.showSignature ? 'col-span-2 md:col-span-1' : 'col-span-2'}><label className="block text-sm mb-1">Hotel Name</label><input className="w-full p-2 border rounded outline-none" value={store.hotelName} onChange={(e) => store.setField('hotelName', e.target.value)} /></div>
        <div><label className="block text-sm mb-1">Phone</label><input className="w-full p-2 border rounded outline-none" value={store.phone} onChange={(e) => store.setField('phone', e.target.value)} /></div>
        <div className="col-span-2"><label className="block text-sm mb-1">Address</label><input className="w-full p-2 border rounded outline-none" value={store.address} onChange={(e) => store.setField('address', e.target.value)} /></div>
        <div className="col-span-2"><label className="block text-sm mb-1">GSTIN</label><input className="w-full p-2 border rounded outline-none" value={store.gstin} onChange={(e) => store.setField('gstin', e.target.value)} /></div>
      </div>

      {/* Guest & Stay Header with BOTH buttons */}
      <div className="border-b pb-2 mt-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Guest & Booking Details</h2>
        <div className="flex gap-2">
          <button 
            onClick={store.clearGuestDetails} 
            className="flex items-center text-sm font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded shadow-sm hover:bg-red-100 transition border border-red-100"
          >
            <Trash2 size={16} className="mr-1" /> Clear Guest
          </button>
          
          <button 
            onClick={store.startNewBill} 
            className="flex items-center text-sm font-bold text-white bg-indigo-600 px-3 py-1.5 rounded shadow hover:bg-indigo-700 transition"
          >
            <Plus size={16} className="mr-1" /> Start New Bill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className="flex justify-between items-center text-sm mb-1 text-blue-600 font-bold">
            Invoice Number
            <button onClick={() => store.setField('invoiceNo', 'INV-' + Math.floor(100000 + Math.random() * 900000))} className="text-slate-400 hover:text-blue-600" title="Generate New Invoice No">
              <RefreshCw size={14} />
            </button>
          </label>
          <input className="w-full p-2 border rounded outline-none bg-blue-50" value={store.invoiceNo} onChange={(e) => store.setField('invoiceNo', e.target.value)} />
        </div>

        <div><label className="block text-sm mb-1 text-slate-500">Bill Date</label><input type="date" className="w-full p-2 border rounded outline-none" value={store.date} onChange={(e) => store.setField('date', e.target.value)} /></div>
        <div><label className="block text-sm mb-1 text-slate-800 font-bold">Guest Name</label><input className="w-full p-2 border rounded outline-none" value={store.customerName} onChange={(e) => store.setField('customerName', e.target.value)} /></div>
        <div><label className="block text-sm mb-1 text-slate-800 font-bold">Guest Address</label><input className="w-full p-2 border rounded outline-none" value={store.customerAddress} onChange={(e) => store.setField('customerAddress', e.target.value)} /></div>
        <div className="col-span-2"><label className="block text-sm mb-1 text-slate-500">Guest Phone</label><input className="w-full p-2 border rounded outline-none" value={store.customerPhone} onChange={(e) => store.setField('customerPhone', e.target.value)} /></div>
        
        <div>
          <label className="flex justify-between items-center text-sm mb-1">
            Room No
            <button onClick={() => store.setField('roomNo', Math.floor(100 + Math.random() * 900).toString())} className="text-slate-400 hover:text-blue-600" title="Generate New Room No">
              <RefreshCw size={14} />
            </button>
          </label>
          <input className="w-full p-2 border rounded outline-none" value={store.roomNo} onChange={(e) => store.setField('roomNo', e.target.value)} />
        </div>
        
        <div><label className="block text-sm mb-1 text-indigo-600 font-bold">Room Type (e.g. Deluxe AC)</label><input className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-indigo-500" value={store.roomType} onChange={(e) => store.setField('roomType', e.target.value)} /></div>
        
        <div><label className="block text-sm mb-1">Check-In Date</label><input type="date" className="w-full p-2 border rounded outline-none" value={store.checkInDate} onChange={(e) => store.setField('checkInDate', e.target.value)} /></div>
        <div><label className="block text-sm mb-1">Check-Out Date</label><input type="date" className="w-full p-2 border rounded outline-none" value={store.checkOutDate} onChange={(e) => store.setField('checkOutDate', e.target.value)} /></div>
        <div><label className="block text-sm mb-1">Total Days</label><input type="number" className="w-full p-2 border rounded outline-none" value={store.noOfDays} onChange={(e) => store.setField('noOfDays', Number(e.target.value))} /></div>
        <div><label className="block text-sm mb-1">Room Charge (Per Day)</label><input type="number" className="w-full p-2 border rounded outline-none" value={store.perDayCharge} onChange={(e) => store.setField('perDayCharge', Number(e.target.value))} /></div>
      </div>

      {/* Extra Services */}
      <div className="border-b pb-2 mt-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Extra Services (Food, Laundry, etc.)</h2>
        <button onClick={store.addExtraService} className="flex items-center text-sm font-medium text-blue-600"><Plus size={16} /> Add Service</button>
      </div>
      <div className="space-y-2">
        {store.extraServices.map((item) => (
          <div key={item.id} className="flex gap-2 items-center">
            <input className="w-[40%] p-2 border rounded outline-none text-sm" placeholder="Service Name" value={item.name} onChange={(e) => store.updateExtraService(item.id, { name: e.target.value })} />
            <input type="number" className="w-[20%] p-2 border rounded outline-none text-sm" placeholder="Qty" value={item.qty || ''} onChange={(e) => store.updateExtraService(item.id, { qty: Number(e.target.value), amount: Number(e.target.value) * item.rate })} />
            <input type="number" className="w-[25%] p-2 border rounded outline-none text-sm" placeholder="Rate" value={item.rate || ''} onChange={(e) => store.updateExtraService(item.id, { rate: Number(e.target.value), amount: item.qty * Number(e.target.value) })} />
            <div className="w-[15%] text-sm font-bold text-center">₹{item.amount || 0}</div>
            <button onClick={() => store.removeExtraService(item.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>

      {/* Taxes, Discounts & Payments */}
      <h2 className="text-xl font-semibold border-b pb-2 mt-6">Taxes, Discounts & Services</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Tax Block */}
        <div className="bg-slate-50 p-4 border rounded">
          <label className="flex items-center space-x-2 font-bold cursor-pointer text-slate-800 mb-2">
            <input type="checkbox" checked={store.hasTax} onChange={(e) => store.setField('hasTax', e.target.checked)} className="w-5 h-5" />
            <span>Apply GST Tax</span>
          </label>
          {store.hasTax && (
            <div className="flex gap-2">
              <div><label className="text-xs">CGST %</label><input type="number" className="w-full p-2 border rounded" value={store.cgstRate} onChange={(e) => store.setField('cgstRate', Number(e.target.value))} /></div>
              <div><label className="text-xs">SGST %</label><input type="number" className="w-full p-2 border rounded" value={store.sgstRate} onChange={(e) => store.setField('sgstRate', Number(e.target.value))} /></div>
            </div>
          )}
        </div>

        {/* Service Charge Block */}
        <div className="bg-orange-50 p-4 border border-orange-200 rounded">
          <label className="flex items-center space-x-2 font-bold cursor-pointer text-orange-800 mb-2">
            <input type="checkbox" checked={store.showServiceCharge} onChange={(e) => store.setField('showServiceCharge', e.target.checked)} className="w-5 h-5" />
            <span>Service Charge</span>
          </label>
          {store.showServiceCharge && (
            <div><label className="text-xs">Amount</label><input type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500" value={store.serviceCharge} onChange={(e) => store.setField('serviceCharge', Number(e.target.value))} /></div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Discount</label>
          <div className="flex gap-2">
            <input type="number" className="w-full p-2 border rounded outline-none" value={store.discount} onChange={(e) => store.setField('discount', Number(e.target.value))} />
            <select className="p-2 border rounded bg-white" value={store.discountType} onChange={(e) => store.setField('discountType', e.target.value as 'FLAT'|'PERCENT')}>
              <option value="FLAT">{store.currency}</option><option value="PERCENT">%</option>
            </select>
          </div>
        </div>
        <div><label className="block text-sm mb-1">Advance Paid</label><input type="number" className="w-full p-2 border rounded outline-none" value={store.advancePaid} onChange={(e) => store.setField('advancePaid', Number(e.target.value))} /></div>
      </div>
    </div>
  );
}