'use client';
import React from 'react';
import { HotelBillState } from '@/store/useHotelStore';
import { RubberStamp } from '../shared/RubberStamp';
import { numberToWords } from '@/utils/numberToWords';

const T_TERMS = [
  ["1. Standard Check-out timeline parameters apply strictly at 11:00 AM.", "2. Advance financial payloads processed are 100% non-refundable.", "3. Management holds no liability for unmonitored personal safety boxes."],
  ["1. Records parsed matching explicit OTA digital guidelines.", "2. Extension windows are calculated over floating capacity metrics.", "3. Financial reporting mapped direct to primary aggregate agency portals."],
  ["1. Noise pollution control systems are strictly enforced post 10:00 PM.", "2. Facility access rules apply to premium registered entities only.", "3. Structural damages matching assets will clear standard fine matrix grids."],
  ["1. Collective kitchen protocols adhere to absolute hygiene control metrics.", "2. Quiet timelines lock safely at 11:00 PM corporate standard guidelines."],
  ["1. Respect local culture and property rules.", "2. Smoking is strictly prohibited inside the rooms."],
  ["1. Corporate billing is subject to company tie-up terms.", "2. Overdue payments attract 1.5% interest per month."],
  []
];

export const TemplateEngine = ({ data }: { data: HotelBillState }) => {
  const brandColor = data.themeColor || '#0f172a';
  
  // 🟢 INDIAN HOTEL INDUSTRY STANDARD FONTS ARCHITECTURE
  let structuralFontFamily = 'Arial, Helvetica, sans-serif'; 
  if (data.fontFamily === 'font-serif') structuralFontFamily = '"Times New Roman", Times, serif'; 
  else if (data.fontFamily === 'font-mono') structuralFontFamily = '"Courier New", Courier, monospace'; 
  else if (data.fontFamily === 'font-modern') structuralFontFamily = 'Calibri, "Segoe UI", sans-serif'; 
  else if (data.fontFamily === 'font-clear') structuralFontFamily = 'Tahoma, Verdana, sans-serif'; 
  
  const fz = data.fontSize || 13;
  const fmtDate = (d?: string) => d ? d.split('-').reverse().join('-') : '';
  const isOta = data.showBookingSource;

  const safeNum = (val: any) => isNaN(Number(val)) ? 0 : Number(val);
  const fmtNum = (num: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  const activeExtraServices = (data.extraServices || []).filter(item => item.selected !== false);

  const getGuestSubline = () => {
    let s = `Pax: ${safeNum(data.adults)}A`;
    if(safeNum(data.kids) > 0) s += ` ${safeNum(data.kids)}C`;
    if(data.nationality && data.nationality.toLowerCase() !== 'indian') s += ` | Nat: ${data.nationality}`;
    if(data.vehicleNo) s += ` | Veh: ${data.vehicleNo}`;
    return s;
  };

  const HotelHeader = ({ align = 'left' }: { align?: 'left'|'center'|'right' }) => (
    <div className={`flex flex-col ${align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left'} w-full`} style={{ fontFamily: structuralFontFamily }}>
      {data.showLogo && data.logo && (
        <div style={{ transform: `translate(${data.logoX || 0}px, ${data.logoY || 0}px)`, zIndex: 10 }} className="relative mb-2">
          <img src={data.logo} style={{height: `${data.logoSize || 80}px`, maxWidth: '300px', objectFit: 'contain'}} alt="logo" />
        </div>
      )}
      <h1 className="font-black uppercase tracking-wide break-words w-full" style={{ color: brandColor, fontSize: `${data.hotelNameSize || 24}px`, lineHeight: '1.2' }}>
        {data.hotelName}
      </h1>
      <div className="mt-1 leading-relaxed text-slate-700" style={{ fontSize: `${fz - 1}px` }}>
        {data.address && <p>{data.address}</p>}
        {data.phone && <span>Ph: {data.phone}</span>}
        {(data.email || data.website) && <span> | {data.email} {data.email && data.website ? '|' : ''} {data.website}</span>}
        <div className="flex gap-4 mt-1 border-t border-slate-200 pt-1">
          {data.gstin && <p className="font-bold uppercase" style={{ color: brandColor }}>GSTIN: {data.gstin}</p>}
          {data.fssaiNo && <p className="font-bold">FSSAI: {data.fssaiNo}</p>}
          {data.showSac && data.showSacOnHeaderOnly && <p className="font-bold text-slate-500">SAC Code: {data.sacCode}</p>}
        </div>
      </div>
    </div>
  );

  const TotalsBlock = ({ minimal = false }: { minimal?: boolean }) => {
    const rSub = safeNum(data.noOfDays) * safeNum(data.perDayCharge);
    const eTot = activeExtraServices.reduce((sum, item) => sum + (safeNum(item.qty) * safeNum(item.rate)), 0);
    const bTot = rSub + eTot + (data.showServiceCharge ? safeNum(data.serviceCharge) : 0);
    const discAmt = data.discountType === 'PERCENT' ? (bTot * safeNum(data.discount)) / 100 : safeNum(data.discount);
    const tBefore = bTot - discAmt;
    const cgstAmt = data.hasTax ? (tBefore * safeNum(data.cgstRate)) / 100 : 0;
    const sgstAmt = data.hasTax ? (tBefore * safeNum(data.sgstRate)) / 100 : 0;
    const gTot = tBefore + cgstAmt + sgstAmt;
    const balDue = gTot - safeNum(data.advancePaid);

    return (
      <div className="w-full flex justify-between mt-6 border-t pt-4 print:break-inside-avoid" style={{ borderColor: brandColor, fontFamily: structuralFontFamily }}>
        {data.hasTax && !minimal ? (
          <div className="text-[10px] text-slate-500 w-1/2 pr-4 border-r border-slate-200">
             <p className="font-bold uppercase tracking-wider mb-2 text-slate-700">Tax Summary (INR)</p>
             <table className="w-full text-left border-collapse">
               <thead><tr className="border-b border-slate-200"><th className="pb-1">Slab</th><th className="pb-1">Taxable</th><th className="pb-1">CGST</th><th className="pb-1">SGST</th></tr></thead>
               <tbody>
                 <tr className="font-medium text-slate-600">
                   <td className="py-1">GST {safeNum(data.cgstRate) + safeNum(data.sgstRate)}%</td>
                   <td className="py-1">₹{fmtNum(tBefore)}</td><td className="py-1">₹{fmtNum(cgstAmt)}</td><td className="py-1">₹{fmtNum(sgstAmt)}</td>
                 </tr>
               </tbody>
             </table>
          </div>
        ) : <div className="w-1/2"></div>}
        <div className="w-64 space-y-1 font-medium text-slate-700 ml-auto pl-4" style={{ fontSize: `${fz}px` }}>
          <div className="flex justify-between"><span>Subtotal Base:</span><span>{data.currency}{fmtNum(bTot)}</span></div>
          {safeNum(data.discount) > 0 && <div className="flex justify-between text-red-600"><span>Discount:</span><span>-{data.currency}{fmtNum(discAmt)}</span></div>}
          {data.hasTax && (
            <><div className="flex justify-between text-slate-500"><span>CGST ({safeNum(data.cgstRate)}%):</span><span>{data.currency}{fmtNum(cgstAmt)}</span></div>
            <div className="flex justify-between text-slate-500 border-b border-slate-200 pb-1 mb-1"><span>SGST ({safeNum(data.sgstRate)}%):</span><span>{data.currency}{fmtNum(sgstAmt)}</span></div></>
          )}
          <div className="flex justify-between font-black mt-2 pt-2 text-lg" style={{ color: brandColor }}><span>Grand Total:</span><span>{data.currency}{fmtNum(Math.round(gTot))}</span></div>
          {safeNum(data.advancePaid) > 0 && (
            <><div className="flex justify-between text-emerald-600 mt-2"><span>Advance Paid:</span><span>-{data.currency}{fmtNum(safeNum(data.advancePaid))}</span></div>
            <div className="flex justify-between font-bold text-rose-600 border-t border-slate-200 mt-1 pt-1"><span>Balance Due:</span><span>{data.currency}{fmtNum(Math.max(0, balDue))}</span></div></>
          )}
        </div>
      </div>
    );
  };

  const TermsAndSignature = () => {
    const termsArray = data.termsIndex === 7 ? (data.customTerms || '').split('\n').filter(t=>t.trim()!=='') : T_TERMS[data.termsIndex || 0] || [];
    const rSub = safeNum(data.noOfDays) * safeNum(data.perDayCharge);
    const eTot = activeExtraServices.reduce((sum, item) => sum + (safeNum(item.qty) * safeNum(item.rate)), 0);
    const bTot = rSub + eTot + (data.showServiceCharge ? safeNum(data.serviceCharge) : 0);
    const discAmt = data.discountType === 'PERCENT' ? (bTot * safeNum(data.discount)) / 100 : safeNum(data.discount);
    const tBefore = bTot - discAmt;
    const gTot = Math.round(tBefore + (data.hasTax ? (tBefore * safeNum(data.cgstRate)) / 100 : 0) + (data.hasTax ? (tBefore * safeNum(data.sgstRate)) / 100 : 0));

    return (
      <div className="flex justify-between items-end mt-6 pt-4 w-full print:break-inside-avoid border-t border-slate-100" style={{ fontFamily: structuralFontFamily }}>
        <div className="text-slate-600 font-medium max-w-[60%]" style={{ fontSize: `${fz - 2}px` }}>
          {data.amountInWords && <p className="mb-4 font-bold not-italic px-3 py-1.5 rounded bg-slate-50 border border-slate-200 inline-block" style={{ color: brandColor }}>Amount In Words: {numberToWords(gTot)} Only</p>}
          <p className="font-bold uppercase tracking-wider text-[10px] mb-1" style={{ color: brandColor }}>Property Terms & Conditions:</p>
          {termsArray.map((t, i) => <p key={i} className="mb-0.5">{t}</p>)}
          <p className="mt-2 font-bold text-slate-800">Jurisdiction: Court Of {data.jurisdictionCity || 'Local'}</p>
          {/* {data.showPoweredBy && <p className="mt-3 opacity-40 text-[9px] font-mono"></p>} */}
        </div>
        <div className="flex gap-8 items-end relative z-10">
           {data.showGuestSignature && (
             <div className="text-center w-32 flex flex-col items-center">
               <div style={{ transform: `translate(${data.guestSignatureX || 0}px, ${data.guestSignatureY || 0}px)` }} className="h-14 flex items-end justify-center">
                 {data.guestSignature ? <img src={data.guestSignature} style={{ height: `${data.guestSignatureSize || 60}px` }} className="object-contain" alt="guest-sign" /> : <div className="h-0 w-full"></div>}
               </div>
               <p className="font-bold uppercase w-full border-t border-slate-400 pt-1 text-[10px] text-slate-500">Guest Signature</p>
             </div>
           )}
           {data.showSignature && (
             <div className="text-center w-40 flex flex-col items-center">
               <div style={{ transform: `translate(${data.signatureX}px, ${data.signatureY}px)` }} className="h-14 flex items-end justify-center">
                 {data.signature ? <img src={data.signature} style={{ height: `${data.signatureSize || 60}px` }} className="object-contain" alt="sign" /> : <div className="h-0 w-full"></div>}
               </div>
               <p className="font-black uppercase w-full border-t border-slate-400 pt-1 text-[10px] truncate" style={{ color: brandColor }}>{data.signatoryTitle === 'CUSTOM' ? data.customSignatory : (data.signatoryTitle || 'Authorized Signatory')}</p>
             </div>
           )}
        </div>
      </div>
    );
  };

  const ItemsTable = ({ style = 'standard' }: { style?: 'standard'|'boxed'|'minimal'|'dotted' }) => {
    const thClass = style === 'boxed' ? `py-2 px-3 border border-slate-300 bg-slate-100` : style === 'minimal' ? 'py-2 px-2 text-slate-500 uppercase text-xs' : 'py-2 px-2';
    const tdClass = style === 'boxed' ? 'py-3 px-3 border border-slate-300' : style === 'dotted' ? 'py-3 px-2 border-b border-dashed border-slate-400' : 'py-3 px-2 border-b border-slate-200';
    return (
      <div className="flex-1 flex flex-col w-full my-4" style={{ fontFamily: structuralFontFamily }}>
        <table className="w-full text-left border-collapse">
          <thead style={style === 'standard' ? { backgroundColor: brandColor, color: '#fff' } : {}}>
            <tr className="uppercase text-[11px] tracking-wider"><th className={thClass}>Description</th><th className={`${thClass} text-center`}>Qty/Nights</th><th className={`${thClass} text-right`}>Rate</th><th className={`${thClass} text-right`}>Amount</th></tr>
          </thead>
          <tbody style={{ fontSize: `${fz}px` }}>
            <tr className="print:break-inside-avoid hover:bg-slate-50/50">
              <td className={tdClass}>
                 <span className="font-bold text-slate-900">Room: {data.roomType} (No: {data.roomNo})</span> <br/>
                 <span className="text-slate-500 font-medium" style={{ fontSize: `${fz - 2}px` }}>Stay: {fmtDate(data.checkInDate)} to {fmtDate(data.checkOutDate)}</span>
                 {data.showSac && !data.showSacOnHeaderOnly && <div className="text-[10px] text-slate-400 mt-0.5 font-bold">SAC: {data.sacCode}</div>}
              </td>
              <td className={`${tdClass} text-center align-top font-bold text-slate-900`}>{safeNum(data.noOfDays)}</td>
              <td className={`${tdClass} text-right align-top font-medium`}>{data.currency}{fmtNum(safeNum(data.perDayCharge))}</td>
              <td className={`${tdClass} text-right align-top font-bold text-slate-900`}>{data.currency}{fmtNum(safeNum(data.noOfDays) * safeNum(data.perDayCharge))}</td>
            </tr>
            {activeExtraServices.map((svc) => (
              <tr key={svc.id} className="print:break-inside-avoid hover:bg-slate-50/50">
                <td className={tdClass}>
                  <span className="font-semibold text-slate-900">{svc.name}</span>
                  {data.showSac && !data.showSacOnHeaderOnly && <div className="text-[10px] text-slate-400 mt-0.5 font-bold">SAC: {data.sacCode}</div>}
                </td>
                <td className={`${tdClass} text-center align-top font-bold text-slate-900`}>{safeNum(svc.qty)}</td>
                <td className={`${tdClass} text-right align-top font-medium`}>{data.currency}{fmtNum(safeNum(svc.rate))}</td>
                <td className={`${tdClass} text-right align-top font-bold text-slate-900`}>{data.currency}{fmtNum(safeNum(svc.qty) * safeNum(svc.rate))}</td>
              </tr>
            ))}
            {data.showServiceCharge && <tr className="print:break-inside-avoid bg-slate-50/50"><td className={`${tdClass} font-bold`} colSpan={3}>Service Charges</td><td className={`${tdClass} text-right font-black`}>{data.currency}{fmtNum(safeNum(data.serviceCharge))}</td></tr>}
          </tbody>
        </table>
      </div>
    );
  };

  // 🟢 15 TEMPLATES SWITCH ENGINE RESTORED WITH FULL BRANDING
  switch (Number(data.selectedTemplate)) {
    case 1:
      return (
        <div className="p-10 h-full bg-white flex flex-col relative" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between items-end border-b-2 pb-6 mb-6" style={{ borderColor: brandColor }}>
            <HotelHeader align="left"/>
            <div className="text-right shrink-0">
              <h2 className="font-black tracking-widest text-2xl uppercase mb-2" style={{ color: brandColor }}>Guest Folio</h2>
              <p className="text-sm font-bold text-slate-500">Invoice: <span className="font-black text-slate-900">{data.invoiceNo}</span></p>
              <p className="text-sm font-medium text-slate-500">Date: {fmtDate(data.date)}</p>
            </div>
          </div>
          <div className="flex justify-between mb-8" style={{ fontSize: `${fz}px` }}>
            <div className="bg-slate-50 p-4 rounded border border-slate-100 flex-1 mr-4">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Billed To</p>
              <p className="font-black text-lg text-slate-900">{data.customerName || 'Walk-in Guest'}</p>
              {data.customerAddress && <p className="text-slate-600 mt-1">{data.customerAddress}</p>}
              {data.guestCompany && <p className="font-bold mt-1" style={{ color: brandColor }}>M/s: {data.guestCompany}</p>}
              {data.guestGstin && <p className="text-xs font-bold text-slate-500 mt-1">GSTIN: {data.guestGstin}</p>}
            </div>
            <div className="text-right bg-slate-50 p-4 rounded border border-slate-100 shrink-0">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Stay Details</p>
              <p className="font-bold text-slate-800">Check-In: {fmtDate(data.checkInDate)} {data.checkInTime}</p>
              <p className="font-bold text-slate-800 mt-0.5">Check-Out: {fmtDate(data.checkOutDate)} {data.checkOutTime}</p>
              <p className="text-slate-500 text-[11px] font-medium mt-2">{getGuestSubline()}</p>
            </div>
          </div>
          <ItemsTable style="standard" />
          <div className="mt-auto"><TotalsBlock /><TermsAndSignature /></div>
        </div>
      );
    case 2:
      return (
        <div className="p-8 h-full bg-white flex flex-col relative" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="text-center mb-6"><HotelHeader align="center"/></div>
          <div className="border-2 rounded-lg p-4 flex justify-between mb-4 bg-slate-50" style={{ borderColor: brandColor }}>
            <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Corporate Client</p><p className="font-black text-lg text-slate-900">{data.customerName}</p>{data.guestCompany && <p className="font-bold mt-1" style={{ color: brandColor }}>Company: {data.guestCompany}</p>}{data.guestGstin && <p className="font-bold text-xs text-slate-600 mt-0.5">Client GSTIN: {data.guestGstin}</p>}</div>
            <div className="text-right"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice Details</p><p className="font-black text-lg text-slate-900">No: {data.invoiceNo}</p><p className="font-medium text-slate-600 mt-1">Date: {fmtDate(data.date)}</p></div>
          </div>
          <ItemsTable style="boxed" />
          <div className="mt-auto"><div className="border-t-2 pt-4" style={{ borderColor: brandColor }}><TotalsBlock /></div><TermsAndSignature /></div>
        </div>
      );
    case 3:
      return (
        <div className="p-8 h-full bg-white flex flex-col relative border-t-8" style={{ borderColor: brandColor, fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between items-center mb-6"><HotelHeader align="left"/><div className="text-right"><span className="px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: brandColor }}>Tax Invoice</span><p className="mt-2 font-black text-xl text-slate-900">#{data.invoiceNo}</p></div></div>
          <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center mb-6 border border-slate-200">
            <div><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Booking Channel</p><p className="font-black text-lg" style={{ color: brandColor }}>{isOta ? data.bookingSource : 'Direct Booking'}</p></div>
            <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Stay Duration</p><p className="font-bold text-slate-800">{fmtDate(data.checkInDate)} ➔ {fmtDate(data.checkOutDate)}</p></div>
          </div>
          <div className="mb-2"><p className="font-black text-lg border-b pb-1 text-slate-900">Guest: {data.customerName}</p></div>
          <ItemsTable style="minimal" />
          <div className="mt-auto"><div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><TotalsBlock minimal /></div><TermsAndSignature /></div>
        </div>
      );
    case 4:
      return (
        <div className="p-8 h-full bg-white border-4 flex flex-col relative" style={{ borderColor: brandColor, fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between border-b-4 pb-4 mb-4" style={{ borderColor: brandColor }}><HotelHeader align="left"/><div className="text-right"><span className="bg-slate-900 text-white px-4 py-1 font-black text-xl uppercase tracking-widest">INVOICE</span><p className="mt-2 font-black text-lg text-slate-900">{data.invoiceNo}</p><p className="font-medium text-slate-600">{fmtDate(data.date)}</p></div></div>
          <div className="flex border-b-4 pb-4 mb-4 divide-x-4" style={{ borderColor: brandColor }}><div className="w-1/2 pr-4"><p className="font-black uppercase text-slate-400 text-[10px] tracking-widest">Billed To</p><p className="font-black text-lg text-slate-900">{data.customerName}</p><p className="font-medium text-slate-600 mt-1">{data.customerPhone}</p></div><div className="w-1/2 pl-4"><p className="font-black uppercase text-slate-400 text-[10px] tracking-widest">Room Info</p><p className="font-black text-lg text-slate-900">Room {data.roomNo}</p><p className="font-medium text-slate-600 mt-1">In: {fmtDate(data.checkInDate)}</p></div></div>
          <ItemsTable style="boxed" />
          <div className="mt-auto"><TotalsBlock /><TermsAndSignature /></div>
        </div>
      );
    case 5:
      return (
        <div className="p-8 h-full bg-[#fffdf5] flex flex-col relative border-double border-8" style={{ borderColor: brandColor, fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="text-center border-b pb-6 mb-6 relative" style={{ borderColor: brandColor }}><HotelHeader align="center"/><div className="absolute bottom-[-14px] left-1/2 -translate-x-1/2 bg-[#fffdf5] px-4 font-black uppercase tracking-widest text-lg" style={{ color: brandColor }}>Guest Folio</div></div>
          <div className="flex justify-between mb-8 italic text-slate-800"><div><p>Shri/Smt: <strong className="text-lg not-italic text-slate-900">{data.customerName}</strong></p><p className="mt-1">Room: <span className="font-bold not-italic">{data.roomNo}</span></p></div><div className="text-right"><p>Folio No: <span className="font-bold not-italic text-slate-900">{data.invoiceNo}</span></p><p className="mt-1">Date: <span className="not-italic">{fmtDate(data.date)}</span></p></div></div>
          <ItemsTable style="standard" />
          <div className="mt-auto"><div className="border-t pt-4" style={{ borderColor: brandColor }}><TotalsBlock /></div><div className="border-t" style={{ borderColor: brandColor }}><TermsAndSignature /></div></div>
        </div>
      );
    case 6:
      return (
        <div className="p-8 h-full bg-white flex flex-col relative font-mono text-slate-900">
          <RubberStamp data={data} />
          <div className="text-center border-b-2 border-dashed pb-4 mb-4" style={{ borderColor: brandColor }}><h1 className="font-black text-3xl uppercase">{data.hotelName}</h1><p className="text-sm font-bold mt-1">{data.address} | Ph: {data.phone}</p>{data.gstin && <p className="text-sm font-bold mt-0.5">GSTIN: {data.gstin}</p>}</div>
          <div className="flex justify-between text-lg font-bold border-b-2 border-dashed pb-2 mb-4" style={{ borderColor: brandColor }}><p>BILL: {data.invoiceNo}</p><p>DATE: {fmtDate(data.date)}</p></div>
          <div className="text-lg font-bold mb-4 uppercase"><p>NAME: {data.customerName}</p><p className="mt-1">ROOM: {data.roomNo} | DAYS: {safeNum(data.noOfDays)}</p></div>
          <ItemsTable style="dotted" />
          <div className="mt-auto border-t-2 border-dashed pt-4" style={{ borderColor: brandColor }}><TotalsBlock minimal /><TermsAndSignature /></div>
        </div>
      );
    case 7:
      return (
        <div className="p-10 h-full bg-[#f8fafc] flex flex-col relative rounded-3xl border-2 border-slate-100" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex justify-between items-center"><HotelHeader align="left"/><div className="text-right"><h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest" style={{ color: brandColor }}>Invoice</h2><p className="text-slate-500 font-bold mt-1">#{data.invoiceNo}</p></div></div>
          <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex justify-between"><div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Guest</p><p className="font-black text-lg text-slate-900">{data.customerName}</p><p className="text-slate-500 font-medium mt-1">{data.customerPhone}</p></div><div className="text-right"><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Stay</p><p className="font-bold text-slate-800">Room {data.roomNo}</p><p className="text-slate-500 font-medium mt-1">{fmtDate(data.checkInDate)}</p></div></div>
          <div className="bg-white p-6 rounded-2xl shadow-sm flex-1 flex flex-col"><ItemsTable style="minimal" /><TotalsBlock minimal /></div>
          <div className="mt-4"><TermsAndSignature /></div>
        </div>
      );
    case 8:
      return (
        <div className="p-8 h-full bg-white flex flex-col relative border border-slate-900 font-mono shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-slate-900">
          <RubberStamp data={data} />
          <div className="flex justify-between border-b-2 border-slate-900 pb-4 mb-4"><HotelHeader align="left"/><div className="text-right border-l-2 border-slate-900 pl-4"><h2 className="font-black text-2xl uppercase tracking-widest" style={{ color: brandColor }}>Receipt</h2><p className="font-bold mt-1">#{data.invoiceNo}</p></div></div>
          <div className="bg-slate-900 text-white p-3 font-bold flex justify-between uppercase mb-4 tracking-wider"><span>GUEST: {data.customerName}</span><span>ROOM/BED: {data.roomNo}</span></div>
          <ItemsTable style="dotted" />
          <div className="mt-auto border-t-4 border-slate-900 pt-4"><TotalsBlock minimal /><TermsAndSignature /></div>
        </div>
      );
    case 9:
      return (
        <div className="p-8 h-full bg-white flex flex-col relative border border-slate-900 text-slate-900" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="text-center border-b border-slate-900 pb-4 mb-4"><h1 className="font-black text-xl uppercase tracking-widest mb-2" style={{ color: brandColor }}>Tax Invoice</h1><HotelHeader align="center"/></div>
          <table className="w-full border-collapse border border-slate-900 mb-4 text-sm">
            <tbody>
              <tr><td className="border border-slate-900 p-2 w-1/2"><span className="font-bold">Invoice No:</span> {data.invoiceNo}</td><td className="border border-slate-900 p-2 w-1/2"><span className="font-bold">Date:</span> {fmtDate(data.date)}</td></tr>
              <tr><td className="border border-slate-900 p-2"><span className="font-bold">Billed To:</span><br/><span className="font-semibold text-lg">{data.customerName}</span><br/>{data.customerAddress}<br/>{data.guestGstin && <span className="font-bold text-xs mt-1 block">GSTIN: {data.guestGstin}</span>}</td><td className="border border-slate-900 p-2"><span className="font-bold">Stay Details:</span><br/>Room: <span className="font-bold">{data.roomNo}</span><br/>In: {fmtDate(data.checkInDate)}<br/>Out: {fmtDate(data.checkOutDate)}</td></tr>
            </tbody>
          </table>
          <ItemsTable style="boxed" />
          <div className="mt-auto"><TotalsBlock /><div className="border-t border-slate-900 pt-2 mt-4"><TermsAndSignature /></div></div>
        </div>
      );
    case 10:
      return (
        <div className="p-8 h-full bg-white flex flex-col relative border-t-[20px]" style={{ borderColor: brandColor, fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between items-center mb-10"><HotelHeader align="left"/><h2 className="font-black text-3xl text-slate-300 uppercase tracking-tighter">Rent Bill</h2></div>
          <div className="text-center bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200"><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Rental Period</p><p className="font-black text-2xl" style={{ color: brandColor }}>{fmtDate(data.checkInDate)} to {fmtDate(data.checkOutDate)}</p><p className="font-bold text-slate-700 mt-2 uppercase tracking-wide">Tenant: {data.customerName} | Room: {data.roomNo}</p></div>
          <ItemsTable style="minimal" />
          <div className="mt-auto"><TotalsBlock minimal /><TermsAndSignature /></div>
        </div>
      );
    case 11:
      return (
        <div className="p-8 h-full bg-white flex flex-col items-center relative" style={{ fontFamily: structuralFontFamily }}>
          <div className="w-[85%] border border-slate-300 p-8 shadow-sm flex flex-col">
            <RubberStamp data={data} />
            <div className="text-center border-b border-dashed border-slate-400 pb-4 mb-4"><HotelHeader align="center"/></div>
            <div className="text-center mb-6"><p className="font-black text-xl tracking-widest uppercase mb-1" style={{ color: brandColor }}>CASH RECEIPT</p><p className="text-slate-600 font-medium text-sm">Bill: <span className="font-bold text-slate-900">{data.invoiceNo}</span> | Date: {fmtDate(data.date)}</p></div>
            <div className="mb-4 text-center"><p className="text-slate-600">Received with thanks from:</p><p className="font-black text-2xl mt-1 text-slate-900">{data.customerName}</p></div>
            <ItemsTable style="dotted" />
            <div className="mt-8"><TotalsBlock minimal /><TermsAndSignature /></div>
          </div>
        </div>
      );
    case 12:
      return (
        <div className="p-8 h-full bg-[#f8faf6] flex flex-col relative border-l-8 border-[#65a30d]" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between items-center mb-8 border-b-2 border-[#84cc16] pb-4"><HotelHeader align="left"/><div className="text-right text-[#4d7c0f]"><h2 className="font-black text-2xl uppercase tracking-widest">Folio</h2><p className="font-bold mt-1 text-slate-600">{data.invoiceNo}</p></div></div>
          <div className="grid grid-cols-2 gap-4 mb-6"><div className="bg-white p-4 rounded-xl shadow-sm border border-[#ecfccb]"><p className="text-[#84cc16] font-black text-[10px] uppercase tracking-widest mb-1">Guest</p><p className="font-black text-lg text-slate-900">{data.customerName}</p></div><div className="bg-white p-4 rounded-xl shadow-sm border border-[#ecfccb]"><p className="text-[#84cc16] font-black text-[10px] uppercase tracking-widest mb-1">Check-In</p><p className="font-black text-lg text-slate-900">{fmtDate(data.checkInDate)}</p></div></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#ecfccb] flex-1 flex flex-col"><ItemsTable style="minimal" /><TotalsBlock minimal /></div>
          <div className="mt-4"><TermsAndSignature /></div>
        </div>
      );
    case 13:
      return (
        <div className="p-8 h-full bg-slate-950 text-slate-100 flex flex-col relative" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between items-center border-b border-slate-800 pb-6 mb-6"><HotelHeader align="left"/><div className="text-right"><h2 className="font-black text-2xl tracking-widest uppercase" style={{ color: brandColor }}>TRANSIT INVOICE</h2><p className="text-slate-400 font-medium mt-1">#{data.invoiceNo}</p></div></div>
          <div className="flex justify-between bg-slate-900 border border-slate-800 p-5 rounded-xl mb-6"><div><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Check-In Time</p><p className="font-black text-2xl text-white">{data.checkInTime}</p><p className="text-sm font-medium text-slate-400 mt-1">{fmtDate(data.checkInDate)}</p></div><div className="text-right"><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Check-Out Time</p><p className="font-black text-2xl text-white">{data.checkOutTime}</p><p className="text-sm font-medium text-slate-400 mt-1">{fmtDate(data.checkOutDate)}</p></div></div>
          <div className="mb-4"><p className="font-black text-lg text-white uppercase tracking-wider">Passenger: <span style={{ color: brandColor }}>{data.customerName}</span></p></div>
          <div className="bg-slate-50 text-slate-900 p-5 rounded-xl flex-1 flex flex-col"><ItemsTable style="minimal" /><TotalsBlock minimal /></div>
          <div className="mt-4 text-slate-400"><TermsAndSignature /></div>
        </div>
      );
    case 14:
      return (
        <div className="p-12 h-full bg-white flex flex-col relative" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between items-start mb-16"><HotelHeader align="left"/><h2 className="text-5xl font-light text-slate-200 tracking-tighter uppercase">INVOICE</h2></div>
          <div className="flex justify-between mb-12 border-t border-slate-200 pt-8"><div><p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Billed To</p><p className="text-2xl font-medium text-slate-900">{data.customerName}</p></div><div><p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Invoice No</p><p className="text-xl font-bold text-slate-800">{data.invoiceNo}</p></div><div className="text-right"><p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Date</p><p className="text-xl font-bold text-slate-800">{fmtDate(data.date)}</p></div></div>
          <ItemsTable style="minimal" />
          <div className="mt-10"><TotalsBlock minimal /></div><div className="mt-auto opacity-70"><TermsAndSignature /></div>
        </div>
      );
    case 15:
    default:
      return (
        <div className="p-8 h-full bg-white flex flex-col relative" style={{ fontFamily: structuralFontFamily }}>
           <RubberStamp data={data} />
           <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4"><HotelHeader align="left"/><div className="text-right"><p className="font-black text-xl text-slate-900">{data.invoiceNo}</p><p className="font-medium text-slate-500 mt-1">Date: {fmtDate(data.date)}</p></div></div>
           <div className="flex justify-between mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200"><div><p className="font-black text-xl text-slate-900">{data.customerName}</p><p className="text-slate-500 font-medium mt-1">{getGuestSubline()}</p></div><div className="text-right"><p className="font-medium text-slate-600"><strong className="text-slate-900">In:</strong> {fmtDate(data.checkInDate)}</p><p className="font-medium text-slate-600 mt-1"><strong className="text-slate-900">Out:</strong> {fmtDate(data.checkOutDate)}</p></div></div>
           <ItemsTable style="standard" />
           <div className="mt-auto"><TotalsBlock /><TermsAndSignature /></div>
        </div>
      );
  }
};