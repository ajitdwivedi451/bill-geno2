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
      <div className="mt-1.5 leading-relaxed text-slate-700 w-full" style={{ fontSize: `${fz - 1}px` }}>
        {data.hotelAddress && <p className="font-semibold">{data.hotelAddress}</p>}
        <p className="font-medium mt-0.5">
          {data.hotelPhone && <span>Ph: {data.hotelPhone}</span>}
          {data.hotelEmail && <span> | Email: {data.hotelEmail}</span>}
          {data.website && <span> | Web: {data.website}</span>}
        </p>
        <div className={`flex flex-wrap gap-x-6 gap-y-1 mt-2 border-t border-slate-300 pt-1.5 w-full ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          {data.hotelGstin && <p className="font-black uppercase tracking-wider" style={{ color: brandColor }}>GSTIN: {data.hotelGstin}</p>}
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
      <div className="w-full flex flex-col pt-4 print:break-inside-avoid border-t-2" style={{ borderColor: brandColor, fontFamily: structuralFontFamily }}>
        <div className="flex justify-between w-full">
          {/* Left Block: Taxes & Amount in Words */}
          <div className="flex-1 pr-6 flex flex-col justify-between">
            {data.hasTax && !minimal && (
              <div className="text-[10px] text-slate-700 border border-slate-300 rounded p-2.5 mb-4 bg-slate-50/50 w-[85%]">
                 <p className="font-black uppercase tracking-wider mb-1.5 text-slate-900">Tax Summary (INR)</p>
                 <table className="w-full text-left border-collapse">
                   <thead><tr className="border-b border-slate-300"><th className="pb-1">Slab</th><th className="pb-1">Taxable</th><th className="pb-1">CGST</th><th className="pb-1">SGST</th></tr></thead>
                   <tbody>
                     <tr className="font-bold text-slate-800">
                       <td className="py-1 pt-2">GST {safeNum(data.cgstRate) + safeNum(data.sgstRate)}%</td>
                       <td className="py-1 pt-2">₹{fmtNum(tBefore)}</td><td className="py-1 pt-2">₹{fmtNum(cgstAmt)}</td><td className="py-1 pt-2">₹{fmtNum(sgstAmt)}</td>
                     </tr>
                   </tbody>
                 </table>
              </div>
            )}
            {data.amountInWords && (
              <div className="mt-4 bg-slate-100 p-2.5 rounded border border-slate-300 w-[90%]">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Total Amount In Words</p>
                <p className="font-black text-sm italic capitalize" style={{ color: brandColor }}>Rupees {numberToWords(Math.round(gTot))} Only</p>
              </div>
            )}
          </div>

          {/* Right Block: Calculations */}
          <div className="w-72 space-y-1.5 font-medium text-slate-700 ml-auto pl-4" style={{ fontSize: `${fz}px` }}>
            <div className="flex justify-between"><span>Subtotal Base:</span><span>{data.currency}{fmtNum(bTot)}</span></div>
            {safeNum(data.discount) > 0 && <div className="flex justify-between text-red-600"><span>Discount:</span><span>-{data.currency}{fmtNum(discAmt)}</span></div>}
            {data.hasTax && (
              <><div className="flex justify-between text-slate-500"><span>CGST ({safeNum(data.cgstRate)}%):</span><span>{data.currency}{fmtNum(cgstAmt)}</span></div>
              <div className="flex justify-between text-slate-500 border-b border-slate-200 pb-1.5 mb-1.5"><span>SGST ({safeNum(data.sgstRate)}%):</span><span>{data.currency}{fmtNum(sgstAmt)}</span></div></>
            )}
            <div className="flex justify-between font-black mt-2 pt-2 text-lg" style={{ color: brandColor }}><span>Grand Total:</span><span>{data.currency}{fmtNum(Math.round(gTot))}</span></div>
            {safeNum(data.advancePaid) > 0 && (
              <><div className="flex justify-between text-emerald-600 mt-2"><span>Advance Paid:</span><span>-{data.currency}{fmtNum(safeNum(data.advancePaid))}</span></div>
              <div className="flex justify-between font-bold text-rose-600 border-t border-slate-200 mt-1.5 pt-1.5"><span>Balance Due:</span><span>{data.currency}{fmtNum(Math.max(0, balDue))}</span></div></>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TermsAndSignature = () => {
    const termsArray = data.termsIndex === 7 ? (data.customTerms || '').split('\n').filter(t=>t.trim()!=='') : T_TERMS[data.termsIndex || 0] || [];
    return (
      <div className="flex justify-between items-end mt-6 pt-6 w-full print:break-inside-avoid border-t-2" style={{ borderColor: brandColor, fontFamily: structuralFontFamily }}>
        <div className="text-slate-700 font-medium max-w-[55%]" style={{ fontSize: `${fz - 2}px` }}>
          <p className="font-black uppercase tracking-wider text-[11px] mb-1.5" style={{ color: brandColor }}>Terms & Conditions:</p>
          {termsArray.map((t, i) => <p key={i} className="mb-0.5 leading-tight">{t}</p>)}
          <p className="mt-3 font-bold text-slate-900">Jurisdiction: Court Of {data.jurisdictionCity || 'Local'}</p>
        </div>
        
        <div className="flex gap-12 items-end relative z-10 pb-2">
           {data.showGuestSignature && (
             <div className="text-center w-36 flex flex-col items-center">
               <div style={{ transform: `translate(${data.guestSignatureX || 0}px, ${data.guestSignatureY || 0}px)` }} className="h-16 flex items-end justify-center mb-1">
                 {data.guestSignature ? <img src={data.guestSignature} style={{ height: `${data.guestSignatureSize || 60}px` }} className="object-contain" alt="guest-sign" /> : <div className="h-0 w-full"></div>}
               </div>
               <p className="font-bold uppercase w-full border-t border-slate-800 pt-2 text-[10px] text-slate-800">Guest Signature</p>
             </div>
           )}
           {data.showSignature && (
             <div className="text-center w-48 flex flex-col items-center">
               <div style={{ transform: `translate(${data.signatureX}px, ${data.signatureY}px)` }} className="h-16 flex items-end justify-center mb-1">
                 {data.signature ? <img src={data.signature} style={{ height: `${data.signatureSize || 60}px` }} className="object-contain" alt="sign" /> : <div className="h-0 w-full"></div>}
               </div>
               <p className="font-bold uppercase w-full border-t border-slate-800 pt-2 text-[10px] truncate" style={{ color: brandColor }}>{data.signatoryTitle === 'CUSTOM' ? data.customSignatory : (data.signatoryTitle || 'Authorized Signatory')}</p>
             </div>
           )}
        </div>
      </div>
    );
  };

  const ItemsTable = ({ style = 'standard' }: { style?: 'standard'|'boxed'|'minimal'|'dotted' }) => {
    const thClass = style === 'boxed' ? `py-2.5 px-3 border border-slate-300 bg-slate-100` : style === 'minimal' ? 'py-2 px-2 text-slate-500 uppercase text-xs' : 'py-2.5 px-2';
    const tdClass = style === 'boxed' ? 'py-3 px-3 border border-slate-300' : style === 'dotted' ? 'py-3 px-2 border-b border-dashed border-slate-400' : 'py-3 px-2 border-b border-slate-200';
    return (
      <div className="flex-1 flex flex-col w-full my-6 min-h-[250px]" style={{ fontFamily: structuralFontFamily }}>
        <table className="w-full text-left border-collapse">
          <thead style={style === 'standard' ? { backgroundColor: brandColor, color: '#fff' } : {}}>
            <tr className="uppercase text-[11px] tracking-wider font-bold">
              <th className={thClass}>Description</th>
              <th className={`${thClass} text-center`}>Qty/Nights</th>
              <th className={`${thClass} text-right`}>Rate</th>
              <th className={`${thClass} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: `${fz}px` }}>
            <tr className="print:break-inside-avoid hover:bg-slate-50/50">
              <td className={tdClass}>
                 <span className="font-bold text-slate-900">Room: {data.roomType} (No: {data.roomNo})</span> <br/>
                 <span className="text-slate-600 font-medium" style={{ fontSize: `${fz - 2}px` }}>Stay: {fmtDate(data.checkInDate)} to {fmtDate(data.checkOutDate)}</span>
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

  switch (Number(data.selectedTemplate)) {
    case 1:
      return (
        <div className="p-10 min-h-full flex-1 bg-white flex flex-col relative" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between items-end border-b-2 pb-6 mb-6" style={{ borderColor: brandColor }}>
            <HotelHeader align="left"/>
            <div className="text-right shrink-0">
              <h2 className="font-black tracking-widest text-2xl uppercase mb-2" style={{ color: brandColor }}>Guest Folio</h2>
              <p className="text-sm font-bold text-slate-500">Invoice: <span className="font-black text-slate-900">{data.invoiceNo}</span></p>
              <p className="text-sm font-medium text-slate-500">Date: {fmtDate(data.date)}</p>
            </div>
          </div>
          <div className="flex justify-between mb-2" style={{ fontSize: `${fz}px` }}>
            <div className="bg-slate-50 p-4 rounded border border-slate-200 flex-1 mr-4">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5">Billed To</p>
              {data.guestCompany ? <p className="font-black text-lg text-slate-900">M/s {data.guestCompany}</p> : <p className="font-black text-lg text-slate-900">{data.customerName || 'Walk-in Guest'}</p>}
              {data.guestCompany && data.customerName && <p className="text-slate-600 font-bold mt-0.5">Attn: {data.customerName}</p>}
              {data.customerAddress && <p className="text-slate-600 mt-1">{data.customerAddress}</p>}
              {data.guestGstin && <p className="text-xs font-bold text-slate-700 mt-1.5 pt-1 border-t border-slate-200 inline-block">GSTIN: {data.guestGstin}</p>}
            </div>
            <div className="text-right bg-slate-50 p-4 rounded border border-slate-200 shrink-0">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5">Stay Details</p>
              <p className="font-bold text-slate-800">Check-In: {fmtDate(data.checkInDate)} {data.checkInTime}</p>
              <p className="font-bold text-slate-800 mt-0.5">Check-Out: {fmtDate(data.checkOutDate)} {data.checkOutTime}</p>
              <p className="text-slate-600 text-[11px] font-bold mt-2 pt-1 border-t border-slate-200">{getGuestSubline()}</p>
            </div>
          </div>
          <ItemsTable style="standard" />
          <div className="mt-auto w-full">
            <TotalsBlock />
            <TermsAndSignature />
          </div>
        </div>
      );
    case 2:
      return (
        <div className="p-10 min-h-full flex-1 bg-white flex flex-col relative" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="text-center mb-6"><HotelHeader align="center"/></div>
          <div className="border-2 rounded-lg p-5 flex justify-between mb-4 bg-slate-50" style={{ borderColor: brandColor }}>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Corporate Client</p>
              {data.guestCompany ? <p className="font-black text-xl text-slate-900">M/s {data.guestCompany}</p> : <p className="font-black text-xl text-slate-900">{data.customerName}</p>}
              {data.guestCompany && data.customerName && <p className="font-bold mt-1 text-slate-700">Attn: {data.customerName}</p>}
              {data.guestGstin && <p className="font-bold text-sm mt-1" style={{ color: brandColor }}>GSTIN: {data.guestGstin}</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Invoice Details</p>
              <p className="font-black text-xl text-slate-900">No: {data.invoiceNo}</p>
              <p className="font-bold text-slate-700 mt-1">Date: {fmtDate(data.date)}</p>
            </div>
          </div>
          <ItemsTable style="boxed" />
          <div className="mt-auto w-full">
            <TotalsBlock />
            <TermsAndSignature />
          </div>
        </div>
      );
    case 3:
      return (
        <div className="p-10 min-h-full flex-1 bg-white flex flex-col relative border-t-8" style={{ borderColor: brandColor, fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between items-center mb-6"><HotelHeader align="left"/><div className="text-right"><span className="px-4 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: brandColor }}>Tax Invoice</span><p className="mt-3 font-black text-2xl text-slate-900">#{data.invoiceNo}</p></div></div>
          <div className="bg-slate-50 p-5 rounded-xl flex justify-between items-center mb-6 border border-slate-200">
            <div><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Booking Channel</p><p className="font-black text-lg" style={{ color: brandColor }}>{isOta ? data.bookingSource : 'Direct Booking'}</p></div>
            <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Stay Duration</p><p className="font-bold text-slate-800">{fmtDate(data.checkInDate)} ➔ {fmtDate(data.checkOutDate)}</p></div>
          </div>
          <div className="mb-2 border-b-2 pb-2" style={{ borderColor: brandColor }}>
            <p className="font-black text-xl text-slate-900">Billed To: {data.guestCompany ? `M/s ${data.guestCompany} (${data.customerName})` : data.customerName}</p>
            {data.guestGstin && <p className="font-bold text-sm text-slate-600 mt-1">GSTIN: {data.guestGstin}</p>}
          </div>
          <ItemsTable style="minimal" />
          <div className="mt-auto w-full">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200"><TotalsBlock minimal /></div>
            <TermsAndSignature />
          </div>
        </div>
      );
    case 4:
      return (
        <div className="p-10 min-h-full flex-1 bg-white border-4 flex flex-col relative" style={{ borderColor: brandColor, fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between border-b-4 pb-6 mb-6" style={{ borderColor: brandColor }}><HotelHeader align="left"/><div className="text-right"><span className="bg-slate-900 text-white px-5 py-2 font-black text-xl uppercase tracking-widest">INVOICE</span><p className="mt-4 font-black text-xl text-slate-900">{data.invoiceNo}</p><p className="font-bold text-slate-600">{fmtDate(data.date)}</p></div></div>
          <div className="flex border-b-4 pb-6 mb-4 divide-x-4" style={{ borderColor: brandColor }}>
            <div className="w-1/2 pr-6"><p className="font-black uppercase text-slate-400 text-[10px] tracking-widest mb-1">Billed To</p><p className="font-black text-xl text-slate-900">{data.guestCompany ? `M/s ${data.guestCompany}` : data.customerName}</p><p className="font-bold text-slate-600 mt-1">{data.customerPhone}</p>{data.guestGstin && <p className="font-bold text-sm mt-1" style={{ color: brandColor }}>GSTIN: {data.guestGstin}</p>}</div>
            <div className="w-1/2 pl-6"><p className="font-black uppercase text-slate-400 text-[10px] tracking-widest mb-1">Room Info</p><p className="font-black text-xl text-slate-900">Room {data.roomNo}</p><p className="font-bold text-slate-600 mt-1">In: {fmtDate(data.checkInDate)}</p></div>
          </div>
          <ItemsTable style="boxed" />
          <div className="mt-auto w-full">
            <TotalsBlock />
            <TermsAndSignature />
          </div>
        </div>
      );
    case 5:
      return (
        <div className="p-10 min-h-full flex-1 bg-[#fffdf5] flex flex-col relative border-double border-[12px]" style={{ borderColor: brandColor, fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="text-center border-b-2 pb-6 mb-8 relative" style={{ borderColor: brandColor }}><HotelHeader align="center"/><div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 bg-[#fffdf5] px-6 font-black uppercase tracking-widest text-xl" style={{ color: brandColor }}>Guest Folio</div></div>
          <div className="flex justify-between mb-4 italic text-slate-800">
            <div><p>Shri/Smt/M/s: <strong className="text-xl not-italic text-slate-900">{data.guestCompany || data.customerName}</strong></p><p className="mt-1.5">Room: <span className="font-bold not-italic">{data.roomNo}</span></p></div>
            <div className="text-right"><p>Folio No: <span className="font-bold not-italic text-slate-900">{data.invoiceNo}</span></p><p className="mt-1.5">Date: <span className="not-italic font-bold">{fmtDate(data.date)}</span></p></div>
          </div>
          <ItemsTable style="standard" />
          <div className="mt-auto w-full">
            <TotalsBlock />
            <TermsAndSignature />
          </div>
        </div>
      );
    case 6:
      return (
        <div className="p-10 min-h-full flex-1 bg-white flex flex-col relative font-mono text-slate-900">
          <RubberStamp data={data} />
          <div className="text-center border-b-2 border-dashed pb-6 mb-6" style={{ borderColor: brandColor }}><h1 className="font-black text-4xl uppercase">{data.hotelName}</h1><p className="text-base font-bold mt-2">{data.hotelAddress} | Ph: {data.hotelPhone}</p>{data.hotelGstin && <p className="text-base font-bold mt-1">GSTIN: {data.hotelGstin}</p>}</div>
          <div className="flex justify-between text-xl font-bold border-b-2 border-dashed pb-3 mb-6" style={{ borderColor: brandColor }}><p>BILL: {data.invoiceNo}</p><p>DATE: {fmtDate(data.date)}</p></div>
          <div className="text-lg font-bold mb-4 uppercase"><p>NAME: {data.guestCompany ? `M/S ${data.guestCompany}` : data.customerName}</p>{data.guestGstin && <p className="mt-1">GSTIN: {data.guestGstin}</p>}<p className="mt-2">ROOM: {data.roomNo} | DAYS: {safeNum(data.noOfDays)}</p></div>
          <ItemsTable style="dotted" />
          <div className="mt-auto w-full pt-6 border-t-2 border-dashed" style={{ borderColor: brandColor }}>
            <TotalsBlock minimal />
            <TermsAndSignature />
          </div>
        </div>
      );
    case 7:
      return (
        <div className="p-10 min-h-full flex-1 bg-[#f8fafc] flex flex-col relative rounded-3xl border-2 border-slate-100" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="bg-white p-8 rounded-2xl shadow-sm mb-6 flex justify-between items-center"><HotelHeader align="left"/><div className="text-right"><h2 className="text-3xl font-black text-slate-800 uppercase tracking-widest" style={{ color: brandColor }}>Invoice</h2><p className="text-slate-500 font-bold mt-2 text-lg">#{data.invoiceNo}</p></div></div>
          <div className="bg-white p-8 rounded-2xl shadow-sm mb-6 flex justify-between"><div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Guest</p><p className="font-black text-xl text-slate-900">{data.guestCompany ? `M/s ${data.guestCompany}` : data.customerName}</p>{data.guestGstin && <p className="text-slate-500 font-bold mt-1">GSTIN: {data.guestGstin}</p>}</div><div className="text-right"><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Stay</p><p className="font-bold text-lg text-slate-800">Room {data.roomNo}</p><p className="text-slate-500 font-medium mt-1">{fmtDate(data.checkInDate)}</p></div></div>
          <div className="bg-white p-8 rounded-2xl shadow-sm flex-1 flex flex-col">
            <ItemsTable style="minimal" />
            <div className="mt-auto w-full">
              <TotalsBlock minimal />
            </div>
          </div>
          <TermsAndSignature />
        </div>
      );
    case 8:
      return (
        <div className="p-10 min-h-full flex-1 bg-white flex flex-col relative border-2 border-slate-900 font-mono shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-slate-900">
          <RubberStamp data={data} />
          <div className="flex justify-between border-b-4 border-slate-900 pb-6 mb-6"><HotelHeader align="left"/><div className="text-right border-l-4 border-slate-900 pl-6"><h2 className="font-black text-3xl uppercase tracking-widest" style={{ color: brandColor }}>Receipt</h2><p className="font-bold text-xl mt-2">#{data.invoiceNo}</p></div></div>
          <div className="bg-slate-900 text-white p-4 font-bold flex justify-between uppercase mb-6 tracking-wider text-lg"><span>GUEST: {data.guestCompany || data.customerName}</span><span>ROOM: {data.roomNo}</span></div>
          <ItemsTable style="dotted" />
          <div className="mt-auto w-full border-t-4 border-slate-900 pt-6">
            <TotalsBlock minimal />
            <TermsAndSignature />
          </div>
        </div>
      );
    case 9:
      return (
        <div className="p-10 min-h-full flex-1 bg-white flex flex-col relative border-2 border-slate-900 text-slate-900" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="text-center border-b-2 border-slate-900 pb-6 mb-6"><h1 className="font-black text-2xl uppercase tracking-widest mb-3" style={{ color: brandColor }}>Tax Invoice</h1><HotelHeader align="center"/></div>
          <table className="w-full border-collapse border-2 border-slate-900 mb-6 text-base">
            <tbody>
              <tr><td className="border-2 border-slate-900 p-3 w-1/2"><span className="font-bold">Invoice No:</span> {data.invoiceNo}</td><td className="border-2 border-slate-900 p-3 w-1/2"><span className="font-bold">Date:</span> {fmtDate(data.date)}</td></tr>
              <tr>
                <td className="border-2 border-slate-900 p-3 align-top">
                  <span className="font-bold">Billed To:</span><br/>
                  <span className="font-black text-xl block mt-1">{data.guestCompany ? `M/s ${data.guestCompany}` : data.customerName}</span>
                  {data.customerAddress}<br/>
                  {data.guestGstin && <span className="font-bold block mt-2 p-1 bg-slate-100 border border-slate-300 inline-block">Client GSTIN: {data.guestGstin}</span>}
                </td>
                <td className="border-2 border-slate-900 p-3 align-top">
                  <span className="font-bold">Stay Details:</span><br/>
                  Room: <span className="font-black text-lg">{data.roomNo}</span><br/>
                  In: <span className="font-bold">{fmtDate(data.checkInDate)}</span><br/>Out: <span className="font-bold">{fmtDate(data.checkOutDate)}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <ItemsTable style="boxed" />
          <div className="mt-auto w-full">
            <TotalsBlock />
            <TermsAndSignature />
          </div>
        </div>
      );
    case 10:
      return (
        <div className="p-10 min-h-full flex-1 bg-white flex flex-col relative border-t-[24px]" style={{ borderColor: brandColor, fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between items-center mb-10"><HotelHeader align="left"/><h2 className="font-black text-4xl text-slate-300 uppercase tracking-tighter">INVOICE</h2></div>
          <div className="text-center bg-slate-50 p-8 rounded-xl mb-8 border border-slate-200"><p className="text-xs text-slate-400 uppercase font-black tracking-widest mb-2">Rental Period</p><p className="font-black text-3xl" style={{ color: brandColor }}>{fmtDate(data.checkInDate)} to {fmtDate(data.checkOutDate)}</p><p className="font-bold text-slate-800 mt-3 text-lg uppercase tracking-wide">Tenant: {data.guestCompany ? `M/s ${data.guestCompany}` : data.customerName} | Room: {data.roomNo}</p></div>
          <ItemsTable style="minimal" />
          <div className="mt-auto w-full">
            <TotalsBlock minimal />
            <TermsAndSignature />
          </div>
        </div>
      );
    case 11:
      return (
        <div className="p-10 min-h-full flex-1 bg-white flex flex-col items-center relative" style={{ fontFamily: structuralFontFamily }}>
          <div className="w-[90%] border-2 border-slate-300 p-10 shadow-sm flex flex-col flex-1">
            <RubberStamp data={data} />
            <div className="text-center border-b-2 border-dashed border-slate-400 pb-6 mb-6"><HotelHeader align="center"/></div>
            <div className="text-center mb-8"><p className="font-black text-2xl tracking-widest uppercase mb-2" style={{ color: brandColor }}>CASH RECEIPT</p><p className="text-slate-700 font-bold text-base">Bill: <span className="font-black text-slate-900">{data.invoiceNo}</span> | Date: {fmtDate(data.date)}</p></div>
            <div className="mb-6 text-center"><p className="text-slate-600 font-bold">Received with thanks from:</p><p className="font-black text-3xl mt-2 text-slate-900">{data.guestCompany ? `M/s ${data.guestCompany}` : data.customerName}</p></div>
            <ItemsTable style="dotted" />
            <div className="mt-auto w-full">
              <TotalsBlock minimal />
              <TermsAndSignature />
            </div>
          </div>
        </div>
      );
    case 12:
      return (
        <div className="p-10 min-h-full flex-1 bg-[#f8faf6] flex flex-col relative border-l-[16px] border-[#65a30d]" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between items-center mb-10 border-b-2 border-[#84cc16] pb-6"><HotelHeader align="left"/><div className="text-right text-[#4d7c0f]"><h2 className="font-black text-4xl uppercase tracking-widest">Folio</h2><p className="font-bold mt-2 text-xl text-slate-600">{data.invoiceNo}</p></div></div>
          <div className="grid grid-cols-2 gap-6 mb-8"><div className="bg-white p-5 rounded-xl shadow-sm border border-[#ecfccb]"><p className="text-[#84cc16] font-black text-[10px] uppercase tracking-widest mb-1.5">Guest</p><p className="font-black text-xl text-slate-900">{data.guestCompany ? `M/s ${data.guestCompany}` : data.customerName}</p></div><div className="bg-white p-5 rounded-xl shadow-sm border border-[#ecfccb]"><p className="text-[#84cc16] font-black text-[10px] uppercase tracking-widest mb-1.5">Check-In</p><p className="font-black text-xl text-slate-900">{fmtDate(data.checkInDate)}</p></div></div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-[#ecfccb] flex-1 flex flex-col">
            <ItemsTable style="minimal" />
            <div className="mt-auto w-full"><TotalsBlock minimal /></div>
          </div>
          <TermsAndSignature />
        </div>
      );
    case 13:
      return (
        <div className="p-10 min-h-full flex-1 bg-slate-950 text-slate-100 flex flex-col relative" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between items-center border-b-2 border-slate-800 pb-8 mb-8"><HotelHeader align="left"/><div className="text-right"><h2 className="font-black text-3xl tracking-widest uppercase" style={{ color: brandColor }}>TRANSIT INVOICE</h2><p className="text-slate-400 font-bold mt-2 text-lg">#{data.invoiceNo}</p></div></div>
          <div className="flex justify-between bg-slate-900 border border-slate-800 p-6 rounded-xl mb-8"><div><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5">Check-In Time</p><p className="font-black text-3xl text-white">{data.checkInTime}</p><p className="text-base font-bold text-slate-400 mt-1">{fmtDate(data.checkInDate)}</p></div><div className="text-right"><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5">Check-Out Time</p><p className="font-black text-3xl text-white">{data.checkOutTime}</p><p className="text-base font-bold text-slate-400 mt-1">{fmtDate(data.checkOutDate)}</p></div></div>
          <div className="mb-6"><p className="font-black text-xl text-white uppercase tracking-wider">Passenger: <span style={{ color: brandColor }}>{data.guestCompany ? `M/s ${data.guestCompany} (${data.customerName})` : data.customerName}</span></p></div>
          <div className="bg-slate-50 text-slate-900 p-6 rounded-xl flex-1 flex flex-col">
            <ItemsTable style="minimal" />
            <div className="mt-auto w-full"><TotalsBlock minimal /></div>
          </div>
          <div className="text-slate-300 mt-4"><TermsAndSignature /></div>
        </div>
      );
    case 14:
      return (
        <div className="p-12 min-h-full flex-1 bg-white flex flex-col relative" style={{ fontFamily: structuralFontFamily }}>
          <RubberStamp data={data} />
          <div className="flex justify-between items-start mb-16"><HotelHeader align="left"/><h2 className="text-6xl font-light text-slate-200 tracking-tighter uppercase">INVOICE</h2></div>
          <div className="flex justify-between mb-12 border-t-2 border-slate-200 pt-8"><div><p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1.5">Billed To</p><p className="text-2xl font-bold text-slate-900">{data.guestCompany ? `M/s ${data.guestCompany}` : data.customerName}</p></div><div><p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1.5">Invoice No</p><p className="text-2xl font-black text-slate-800">{data.invoiceNo}</p></div><div className="text-right"><p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1.5">Date</p><p className="text-2xl font-black text-slate-800">{fmtDate(data.date)}</p></div></div>
          <ItemsTable style="minimal" />
          <div className="mt-auto w-full">
            <TotalsBlock minimal />
            <TermsAndSignature />
          </div>
        </div>
      );

      // case 16: {
      //   // Lime Tree (Strict 100% Box/Table Format)
      //   const rSub16 = safeNum(data.noOfDays) * safeNum(data.perDayCharge);
      //   const eTot16 = activeExtraServices.reduce((sum, item) => sum + (safeNum(item.qty) * safeNum(item.rate)), 0);
      //   const bTot16 = rSub16 + eTot16 + (data.showServiceCharge ? safeNum(data.serviceCharge) : 0);
      //   const discAmt16 = data.discountType === 'PERCENT' ? (bTot16 * safeNum(data.discount)) / 100 : safeNum(data.discount);
      //   const tBefore16 = bTot16 - discAmt16;
      //   const cgstAmt16 = data.hasTax ? (tBefore16 * safeNum(data.cgstRate)) / 100 : 0;
      //   const sgstAmt16 = data.hasTax ? (tBefore16 * safeNum(data.sgstRate)) / 100 : 0;
      //   const gTot16 = tBefore16 + cgstAmt16 + sgstAmt16;
      //   const balDue16 = gTot16 - safeNum(data.advancePaid);
      //   const termsArray16 = data.termsIndex === 7 ? (data.customTerms || '').split('\n').filter(t=>t.trim()!=='') : T_TERMS[data.termsIndex || 0] || [];
  
      //   return (
      //     <div className="p-8 min-h-full flex-1 bg-white font-sans text-slate-800 relative" style={{ fontFamily: structuralFontFamily }}>
      //        <RubberStamp data={data} />
             
      //        {/* Header Outside the Box */}
      //        <div className="text-center font-bold text-xl text-slate-700 mb-3 tracking-wide">Tax Invoice</div>
  
      //        {/* MAIN OUTER TABLE/BOX */}
      //        <div className="border border-slate-800 text-[12px] flex flex-col leading-relaxed">
                
      //           {/* Row 1: Header (Image + Details) */}
      //           <div className="flex border-b border-slate-800 p-2 min-h-[120px]">
      //              {/* Left Image Box */}
      //              <div className="w-48 border border-slate-300 mr-4 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
      //                 {data.logo ? (
      //                    <img src={data.logo} alt="hotel" className="w-full h-full object-cover grayscale" />
      //                 ) : (
      //                    <span className="text-[10px] text-slate-400">Image</span>
      //                 )}
      //              </div>
      //              {/* Right Text Details */}
      //              <div className="flex-1 flex flex-col justify-center">
      //                 <h1 className="text-[22px] font-bold text-slate-800 mb-1 leading-none">{data.hotelName || 'Hotel Lime Tree'}</h1>
      //                 <p className="text-slate-700 mb-2 whitespace-pre-wrap">{data.hotelAddress}</p>
      //                 <div className="flex justify-between w-full mt-auto">
      //                    <p className="text-slate-700">Phone: <span className="font-semibold text-slate-900">{data.hotelPhone}</span></p>
      //                    <p className="text-slate-700 pr-4">Email: {data.hotelEmail}</p>
      //                 </div>
      //              </div>
      //           </div>
  
      //           {/* Row 2: Bill To | Invoice Details */}
      //           <div className="flex border-b border-slate-800">
      //              {/* Left Column */}
      //              <div className="w-1/2 border-r border-slate-800 p-2 flex flex-col">
      //                 <p className="text-slate-600 mb-2 text-[11px]">Bill To:</p>
      //                 <p className="font-semibold text-slate-900 text-sm">{data.guestCompany ? `M/s ${data.guestCompany} (${data.customerName})` : data.customerName}</p>
      //                 {data.customerPhone && <p className="text-slate-700 mt-auto">Contact No: {data.customerPhone}</p>}
      //                 {data.guestGstin && <p className="text-slate-700 mt-1">GSTIN: {data.guestGstin}</p>}
      //              </div>
      //              {/* Right Column */}
      //              <div className="w-1/2 p-2 flex flex-col">
      //                 <p className="text-slate-600 mb-2 text-[11px]">Invoice Details:</p>
      //                 <div className="flex mb-1"><span className="w-12 text-slate-700">No</span><span className="mr-2">:</span><span className="font-semibold text-slate-900">{data.invoiceNo}</span></div>
      //                 <div className="flex"><span className="w-12 text-slate-700">Date</span><span className="mr-2">:</span><span className="font-semibold text-slate-900">{fmtDate(data.date)}</span></div>
      //              </div>
      //           </div>
  
      //           {/* Row 3: Blank Space | Totals */}
      //           <div className="flex border-b border-slate-800">
      //              {/* Left Blank Column (As seen in the photo) */}
      //              <div className="w-1/2 border-r border-slate-800 p-2 min-h-[100px]">
      //                 {/* Intentionally left blank to match Vyapar layout when main item table is empty */}
      //              </div>
      //              {/* Right Column: Totals */}
      //              <div className="w-1/2 flex flex-col">
      //                 <div className="flex items-center p-2 border-b border-slate-800">
      //                    <span className="w-24 text-slate-700">Total</span>
      //                    <span className="w-4 text-center">:</span>
      //                    <span className="flex-1 text-right font-semibold text-slate-900">{data.currency || '₹'} {fmtNum(gTot16)}</span>
      //                 </div>
      //                 <div className="p-2 border-b border-slate-800 min-h-[50px] flex flex-col justify-center">
      //                    <p className="text-slate-600 mb-1 text-[11px]">Invoice Amount In Words :</p>
      //                    <p className="font-semibold text-slate-900 capitalize">{numberToWords(Math.round(gTot16))} Rupees only</p>
      //                 </div>
      //                 <div className="p-2 flex flex-col gap-1.5">
      //                    <div className="flex items-center">
      //                       <span className="w-24 text-slate-700">Received</span>
      //                       <span className="w-4 text-center">:</span>
      //                       <span className="flex-1 text-right font-semibold text-slate-900">{data.currency || '₹'} {fmtNum(safeNum(data.advancePaid))}</span>
      //                    </div>
      //                    <div className="flex items-center">
      //                       <span className="w-24 text-slate-700">Balance</span>
      //                       <span className="w-4 text-center">:</span>
      //                       <span className="flex-1 text-right font-semibold text-slate-900">{data.currency || '₹'} {fmtNum(Math.max(0, balDue16))}</span>
      //                    </div>
      //                 </div>
      //              </div>
      //           </div>
  
      //           {/* Row 4: Description | Terms & Signatures */}
      //           <div className="flex">
      //              {/* Left Column: Description */}
      //              <div className="w-1/2 border-r border-slate-800 p-2 flex flex-col">
      //                 <p className="text-slate-600 mb-2 text-[11px]">Description:</p>
      //                 <p className="text-slate-900">Room no-{data.roomNo}</p>
      //                 <p className="text-slate-900">Night -{safeNum(data.noOfDays)}</p>
      //                 {activeExtraServices.map(svc => (
      //                    <p key={svc.id} className="text-slate-900 mt-1">{svc.name} (Qty: {svc.qty})</p>
      //                 ))}
      //              </div>
      //              {/* Right Column: Terms & Sign */}
      //              <div className="w-1/2 flex flex-col">
      //                 <div className="p-2 border-b border-slate-800 min-h-[60px]">
      //                    <p className="text-slate-600 mb-1 text-[11px]">Terms And Conditions:</p>
      //                    {termsArray16.length > 0 ? (
      //                       termsArray16.map((t, i) => <p key={i} className="text-slate-900 text-[10px] leading-tight mb-0.5">{t}</p>)
      //                    ) : (
      //                       <p className="text-slate-900 text-[11px]">Thank you for doing business with us</p>
      //                    )}
      //                 </div>
      //                 <div className="p-2 relative min-h-[90px] flex flex-col">
      //                    <p className="text-slate-700 mb-1 text-[11px]">For {data.hotelName || 'Hotel Lime Tree'}:</p>
                         
      //                    {/* Signature Positioning */}
      //                    <div className="absolute right-8 bottom-6 h-12 w-32 flex items-end justify-center" style={{ transform: `translate(${data.signatureX || 0}px, ${data.signatureY || 0}px)` }}>
      //                       {data.showSignature && data.signature && <img src={data.signature} className="h-full object-contain" alt="sign" />}
      //                    </div>
                         
      //                    <p className="text-[10px] text-slate-500 w-full text-center absolute bottom-2 left-0">Authorized Signatory</p>
      //                 </div>
      //              </div>
      //           </div>
  
      //        </div>
      //     </div>
      //   );
      // }

      case 16: {
        // Lime Tree (100% Exact Photo Replica - Vyapar Style)
        const rSub16 = safeNum(data.noOfDays) * safeNum(data.perDayCharge);
        const eTot16 = activeExtraServices.reduce((sum, item) => sum + (safeNum(item.qty) * safeNum(item.rate)), 0);
        const bTot16 = rSub16 + eTot16 + (data.showServiceCharge ? safeNum(data.serviceCharge) : 0);
        const discAmt16 = data.discountType === 'PERCENT' ? (bTot16 * safeNum(data.discount)) / 100 : safeNum(data.discount);
        const tBefore16 = bTot16 - discAmt16;
        const cgstAmt16 = data.hasTax ? (tBefore16 * safeNum(data.cgstRate)) / 100 : 0;
        const sgstAmt16 = data.hasTax ? (tBefore16 * safeNum(data.sgstRate)) / 100 : 0;
        const gTot16 = tBefore16 + cgstAmt16 + sgstAmt16;
        const balDue16 = gTot16 - safeNum(data.advancePaid);
  
        return (
          <div className="p-8 min-h-full flex-1 bg-white font-sans text-slate-800 relative" style={{ fontFamily: structuralFontFamily }}>
             <RubberStamp data={data} />
             
             {/* Header Text Outside the Box */}
             <div className="text-center font-bold text-[16px] text-slate-600 mb-2">Tax Invoice</div>
  
             {/* MAIN OUTER BOX (Matches exact border from photo) */}
             <div className="border border-slate-500 text-[11px] flex flex-col leading-relaxed">
                
                {/* --- ROW 1: Header (Image + Details) --- */}
                <div className="flex border-b border-slate-500 p-2 min-h-[100px]">
                   {/* Left Image Box */}
                   <div className="w-32 h-20 border border-slate-400 mr-3 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                      {data.logo ? (
                         <img src={data.logo} alt="hotel" className="w-full h-full object-cover grayscale" />
                      ) : (
                         <span className="text-[10px] text-slate-400">Image</span>
                      )}
                   </div>
                   {/* Right Text Details */}
                   <div className="flex-1 flex flex-col">
                      <h1 className="text-[18px] font-bold text-slate-800 mb-1 leading-none">{data.hotelName || 'Hotel Lime Tree'}</h1>
                      <p className="text-slate-600 whitespace-pre-wrap leading-tight max-w-[60%]">{data.hotelAddress}</p>
                      <div className="flex justify-between w-full mt-auto">
                         <p className="text-slate-600">Phone: <span className="font-semibold text-slate-800">{data.hotelPhone}</span></p>
                         <p className="text-slate-600 pr-8">Email: {data.hotelEmail}</p>
                      </div>
                   </div>
                </div>
  
                {/* --- ROW 2: Bill To | Invoice Details --- */}
                <div className="grid grid-cols-2 border-b border-slate-500">
                   {/* Left Column */}
                   <div className="border-r border-slate-500 p-2 flex flex-col">
                      <p className="text-slate-600 mb-2">Bill To:</p>
                      <p className="text-slate-800">{data.guestCompany ? `M/s ${data.guestCompany} (${data.customerName})` : data.customerName}</p>
                      <p className="text-slate-600 mt-auto pt-4">Contact No: {data.customerPhone}</p>
                      {data.guestGstin && <p className="text-slate-600 mt-1">GSTIN: {data.guestGstin}</p>}
                   </div>
                   {/* Right Column */}
                   <div className="p-2 flex flex-col">
                      <p className="text-slate-600 mb-2">Invoice Details:</p>
                      <div className="grid grid-cols-[30px_10px_1fr] mb-1">
                         <span className="text-slate-600">No</span><span>:</span><span className="text-slate-800">{data.invoiceNo}</span>
                      </div>
                      <div className="grid grid-cols-[30px_10px_1fr]">
                         <span className="text-slate-600">Date</span><span>:</span><span className="text-slate-800">{fmtDate(data.date)}</span>
                      </div>
                   </div>
                </div>
  
                {/* --- ROW 3: Blank Left | Totals Right --- */}
                <div className="grid grid-cols-2 border-b border-slate-500">
                   {/* Left Column (Completely Blank as per photo) */}
                   <div className="border-r border-slate-500 p-2"></div>
                   {/* Right Column (Totals) */}
                   <div className="flex flex-col">
                      <div className="flex items-center border-b border-slate-500 p-2">
                         <span className="flex-1 text-slate-600">Total</span>
                         <span className="w-4 text-center text-slate-600">:</span>
                         <span className="w-24 text-right text-slate-800">{data.currency || '₹'} {fmtNum(gTot16)}</span>
                      </div>
                      <div className="border-b border-slate-500 p-2 min-h-[45px] flex flex-col justify-center">
                         <p className="text-slate-600 mb-0.5">Invoice Amount In Words :</p>
                         <p className="text-slate-800 capitalize">{numberToWords(Math.round(gTot16))} Rupees only</p>
                      </div>
                      <div className="p-2 flex flex-col gap-1">
                         <div className="flex items-center">
                            <span className="flex-1 text-slate-600">Received</span>
                            <span className="w-4 text-center text-slate-600">:</span>
                            <span className="w-24 text-right text-slate-800">{data.currency || '₹'} {fmtNum(safeNum(data.advancePaid))}</span>
                         </div>
                         <div className="flex items-center mt-1">
                            <span className="flex-1 text-slate-600">Balance</span>
                            <span className="w-4 text-center text-slate-600">:</span>
                            <span className="w-24 text-right text-slate-800">{data.currency || '₹'} {fmtNum(Math.max(0, balDue16))}</span>
                         </div>
                      </div>
                   </div>
                </div>
  
                {/* --- ROW 4: Description | Terms And Conditions --- */}
                <div className="grid grid-cols-2 border-b border-slate-500">
                   {/* Left Column (Description) */}
                   <div className="border-r border-slate-500 p-2 flex flex-col">
                      <p className="text-slate-600 mb-2">Description:</p>
                      <p className="text-slate-800">Room no-{data.roomNo}</p>
                      <p className="text-slate-800">Night -{safeNum(data.noOfDays)}</p>
                      {activeExtraServices.map(svc => (
                         <p key={svc.id} className="text-slate-800 mt-1">{svc.name} - Qty {svc.qty}</p>
                      ))}
                   </div>
                   {/* Right Column (Terms) - Hardcoded single line to match photo */}
                   <div className="p-2 flex flex-col">
                      <p className="text-slate-600 mb-2">Terms And Conditions:</p>
                      <p className="text-slate-800">Thank you for doing business with us</p>
                   </div>
                </div>
  
                {/* --- ROW 5: Blank Left | Signature Right --- */}
                <div className="grid grid-cols-2">
                   {/* Left Column (Blank as per photo) */}
                   <div className="border-r border-slate-500 p-2 min-h-[90px]"></div>
                   {/* Right Column (Signature) */}
                   <div className="p-2 relative flex flex-col justify-between">
                      <p className="text-slate-600">For {data.hotelName || 'Hotel Lime Tree'}:</p>
                      
                      {/* Signature Positioning */}
                      <div className="absolute right-8 bottom-6 h-12 w-32 flex items-end justify-center" style={{ transform: `translate(${data.signatureX || 0}px, ${data.signatureY || 0}px)` }}>
                         {data.showSignature && data.signature && <img src={data.signature} className="h-full object-contain" alt="sign" />}
                      </div>
                      
                      <p className="text-center text-slate-500 mt-10 w-full text-[10px]">Authorized Signatory</p>
                   </div>
                </div>
  
             </div>
          </div>
        );
      }

    

      
      
    case 15:
    default:
      return (
        <div className="p-10 min-h-full flex-1 bg-white flex flex-col relative" style={{ fontFamily: structuralFontFamily }}>
           <RubberStamp data={data} />
           <div className="flex justify-between items-center mb-8 border-b-2 border-slate-200 pb-6"><HotelHeader align="left"/><div className="text-right"><p className="font-black text-2xl text-slate-900">{data.invoiceNo}</p><p className="font-bold text-slate-500 mt-1 text-lg">Date: {fmtDate(data.date)}</p></div></div>
           <div className="flex justify-between mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200"><div><p className="font-black text-2xl text-slate-900">{data.guestCompany ? `M/s ${data.guestCompany}` : data.customerName}</p>{data.guestGstin && <p className="font-bold text-sm text-slate-600 mt-1">GSTIN: {data.guestGstin}</p>}<p className="text-slate-600 font-bold mt-2">{getGuestSubline()}</p></div><div className="text-right"><p className="font-bold text-slate-700 text-lg"><strong className="text-slate-900">In:</strong> {fmtDate(data.checkInDate)}</p><p className="font-bold text-slate-700 mt-2 text-lg"><strong className="text-slate-900">Out:</strong> {fmtDate(data.checkOutDate)}</p></div></div>
           <ItemsTable style="standard" />
           <div className="mt-auto w-full">
             <TotalsBlock />
             <TermsAndSignature />
           </div>
        </div>
      );
  }
};