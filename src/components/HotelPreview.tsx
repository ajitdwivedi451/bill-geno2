'use client';

import { useRef, useState, useEffect } from 'react';
import { useHotelStore, HotelBillState } from '@/store/useHotelStore';
import { Download, FileImage, Share2, FileText, Image as ImageIcon, Printer, ArrowLeft } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const n = ('000000000' + Math.round(num)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != '00') ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
  str += (n[2] != '00') ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
  str += (n[3] != '00') ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
  str += (n[4] != '0') ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
  str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) : '';
  return str.trim() + ' Only';
}

const T_TERMS = [
  ["1. Please hand over the room key to reception at checkout.", "2. Payment is non-refundable. All disputes subject to local jurisdiction."],
  ["1. Billed as per MakeMyTrip/OYO Policies.", "2. Early check-in or late check-out is subject to availability.", "3. Guests must carry a valid ID."],
  ["1. No loud music allowed after 10 PM.", "2. Pool timings are 8 AM to 8 PM only.", "3. Damage to resort property will be billed to guest."],
  ["1. Self-service kitchen usage must be kept clean.", "2. Bunk beds assigned cannot be swapped.", "3. Respect quiet hours after 11 PM."],
  ["1. Respect local culture and property rules.", "2. Smoking is strictly prohibited inside the rooms."],
  ["1. Corporate billing is subject to company tie-up terms.", "2. Overdue payments attract 1.5% interest per month."],
  []
];

export default function HotelPreview() {
  const store = useHotelStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const roomSubtotal = store.noOfDays * store.perDayCharge;
  const extraTotal = store.extraServices.reduce((sum, item) => sum + (item.amount || 0), 0);
  const applicableServiceCharge = store.showServiceCharge ? store.serviceCharge : 0;
  const baseTotal = roomSubtotal + extraTotal + applicableServiceCharge;
  const discountAmount = store.discountType === 'PERCENT' ? (baseTotal * store.discount) / 100 : store.discount;
  const totalBeforeTax = baseTotal - discountAmount;
  const cgst = store.hasTax ? (totalBeforeTax * store.cgstRate) / 100 : 0;
  const sgst = store.hasTax ? (totalBeforeTax * store.sgstRate) / 100 : 0;
  const grandTotal = totalBeforeTax + cgst + sgst;
  const balanceDue = grandTotal - store.advancePaid;

  const cur = store.currency; 
  const c = store.themeColor; 
  const fz = store.fontSize || 14;
  const fmtDate = (d?: string) => d ? d.split('-').reverse().join('-') : '';
  const displayLogo = store.showLogo ? store.logo : null;

  // Type assertion helpers
  type PartialStore = Partial<HotelBillState>;

  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const printWindow = window.open('', '_blank'); if (!printWindow) return;
      printWindow.document.write(`<html><head><style>body{margin:0;display:flex;justify-content:center;background:white;}img{width:100%;max-width:794px;height:auto;}@page{margin:0;size:auto;}</style></head><body><img src="${dataUrl}" onload="setTimeout(()=>{window.print();window.close();},300);" /></body></html>`);
      printWindow.document.close();
    } catch (err) { console.error(err); }
  };

  const downloadFile = async (type: 'png'|'pdf') => {
    if (!printRef.current) return;
    const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
    if(type==='png'){ 
        const link = document.createElement('a'); 
        link.download = `Hotel_${store.invoiceNo}.png`; 
        link.href = dataUrl; 
        link.click(); 
    }
    else { 
        const pdf = new jsPDF({ format: 'a4', unit: 'px' }); 
        const w = pdf.internal.pageSize.getWidth(); 
        const h = (printRef.current.offsetHeight * w) / printRef.current.offsetWidth; 
        pdf.addImage(dataUrl, 'PNG', 0, 0, w, h); 
        pdf.save(`Hotel_${store.invoiceNo}.pdf`); 
    }
  };

  const shareFile = async (type: 'png' | 'pdf') => {
    if (!printRef.current) return;
    setShowShareMenu(false);
    try {
      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      let file: File; 
      const fileName = `Hotel_${store.invoiceNo}.${type}`;
      
      if (type === 'png') { 
          const blob = await (await fetch(dataUrl)).blob(); 
          file = new File([blob], fileName, { type: 'image/png' }); 
      } else { 
          const pdf = new jsPDF({ format: 'a4', unit: 'px' }); 
          const w = pdf.internal.pageSize.getWidth(); 
          const h = (printRef.current.offsetHeight * w) / printRef.current.offsetWidth; 
          pdf.addImage(dataUrl, 'PNG', 0, 0, w, h); 
          file = new File([pdf.output('blob')], fileName, { type: 'application/pdf' }); 
      }
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: `Invoice ${store.invoiceNo}`, files: [file] });
      } else { 
          alert("Browser does not support sharing. Downloading..."); 
          type === 'png' ? downloadFile('png') : downloadFile('pdf'); 
      }
    } catch (error) { console.error(error); }
  };

  const HotelHeader = ({ align = 'left', data }: { align?: 'left' | 'center' | 'right', data: PartialStore }) => (
    <div className={`flex flex-col ${align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
      <h1 className="font-bold uppercase" style={{ color: c, fontSize: `${fz + 8}px` }}>{data.hotelName}</h1>
      {data.address && <p>{data.address}</p>}
      {data.phone && <p>Ph: {data.phone}</p>}
      {data.email && <p>{data.email}</p>}
      {data.gstin && <p className="font-bold mt-1">GSTIN: {data.gstin}</p>}
    </div>
  );

  const TotalsBlock = () => (
    <div className="w-64 space-y-1 ml-auto">
      <div className="flex justify-between"><span>Subtotal:</span><span>{cur}{baseTotal.toFixed(2)}</span></div>
      {store.discount > 0 && <div className="flex justify-between text-red-600"><span>Discount:</span><span>-{cur}{discountAmount.toFixed(2)}</span></div>}
      {store.hasTax && (
        <><div className="flex justify-between text-slate-600"><span>CGST ({store.cgstRate}%):</span><span>{cur}{cgst.toFixed(2)}</span></div>
        <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-1 mb-1"><span>SGST ({store.sgstRate}%):</span><span>{cur}{sgst.toFixed(2)}</span></div></>
      )}
      <div className="flex justify-between font-bold mt-1 pt-1" style={{ color: c, fontSize: `${fz + 4}px`, borderTop: `2px solid ${c}` }}><span>Grand Total:</span><span>{cur}{Math.round(grandTotal).toFixed(2)}</span></div>
      {store.advancePaid > 0 && (
        <><div className="flex justify-between text-emerald-600 mt-2"><span>Advance Paid:</span><span>-{cur}{store.advancePaid}</span></div>
        <div className="flex justify-between font-bold text-rose-600 border-t border-slate-200 mt-1 pt-1"><span>Balance Due:</span><span>{cur}{Math.max(0, balanceDue).toFixed(2)}</span></div></>
      )}
    </div>
  );

  const TermsAndSignature = () => {
    // Basic terms array mapping, assuming user index or defaults
    const termsArray = T_TERMS[0]; 
    return (
      <div className="flex justify-between items-end mt-6 pt-4">
        <div className="text-slate-500 max-w-[55%]" style={{ fontSize: `${fz - 2}px` }}>
          <p className="font-bold text-slate-700 mb-1">Terms & Conditions:</p>
          {termsArray.map((t, i) => <p key={i}>{t}</p>)}
          {store.showPoweredBy && <p className="mt-2 opacity-60 text-[10px]">System Generated Invoice via Billgeno</p>}
        </div>
        <div className="flex gap-8 items-end">
           {store.showSignature && (
             <div className="text-center w-40 flex flex-col items-center relative">
               {store.signature ? <img src={store.signature} style={{ height: '40px' }} className="mb-1" alt="sign" /> : <div className="h-10 border-b border-black mb-1 w-full"></div>}
               <p className="font-bold uppercase w-full pt-1" style={{ fontSize: `${fz - 3}px` }}>Authorized Signatory</p>
             </div>
           )}
        </div>
      </div>
    );
  };

  const ItemsTable = ({ coloredHeader = false, stretch = false }) => (
    <div className={stretch ? "flex-1 flex flex-col" : ""}>
      <table className="w-full text-left mb-6 border-collapse">
        <thead style={coloredHeader ? { backgroundColor: c, color: '#fff' } : { borderBottom: `2px solid ${c}` }}>
          <tr><th className="py-2 px-2">Description</th><th className="py-2 px-2 text-center">Qty/Nights</th><th className="py-2 px-2 text-right">Rate</th><th className="py-2 px-2 text-right">Amount</th></tr>
        </thead>
        <tbody className={stretch ? "flex-1" : ""}>
          <tr>
            <td className="py-2 px-2 border-b border-slate-200">
               <span className="font-bold">Room: {store.roomType} (No: {store.roomNo})</span> <br/>
               <span className="text-slate-500" style={{ fontSize: `${fz - 2}px` }}>Stay: {fmtDate(store.checkInDate)} to {fmtDate(store.checkOutDate)}</span>
            </td>
            <td className="py-2 px-2 border-b border-slate-200 text-center align-top">{store.noOfDays}</td>
            <td className="py-2 px-2 border-b border-slate-200 text-right align-top">{cur}{store.perDayCharge}</td>
            <td className="py-2 px-2 border-b border-slate-200 text-right align-top">{cur}{roomSubtotal}</td>
          </tr>
          {store.extraServices.map((svc) => (
            <tr key={svc.id}>
              <td className="py-2 px-2 border-b border-slate-200">{svc.name}</td>
              <td className="py-2 px-2 border-b border-slate-200 text-center align-top">{svc.qty}</td>
              <td className="py-2 px-2 border-b border-slate-200 text-right align-top">{cur}{svc.rate}</td>
              <td className="py-2 px-2 border-b border-slate-200 text-right align-top">{cur}{svc.amount}</td>
            </tr>
          ))}
          {store.showServiceCharge && <tr><td className="py-2 px-2 border-b border-slate-200 font-medium" colSpan={3}>Service Charges / Extras</td><td className="py-2 px-2 border-b border-slate-200 text-right">{cur}{store.serviceCharge}</td></tr>}
          {stretch && <tr><td colSpan={4} className="h-full"></td></tr>}
        </tbody>
      </table>
    </div>
  );

  const renderTemplate = (data: PartialStore = store) => {
    const t = data.selectedTemplate;

    switch (t) {
      case 1:
        return (
          <div className="p-8 h-full bg-white flex flex-col relative">
            <div className="flex justify-between items-center border-b-2 pb-4 mb-6" style={{ borderColor: c }}>
              <div className="flex items-center gap-4">
                {displayLogo && <img src={displayLogo} style={{height: '60px'}} alt="logo" />}
                <HotelHeader align="left" data={data}/>
              </div>
              <div className="text-right"><h2 className="font-bold" style={{ color: c, fontSize: `${fz + 6}px` }}>INVOICE</h2><p className="font-bold">#{data.invoiceNo}</p><p>Date: {fmtDate(data.date)}</p></div>
            </div>
            <div className="flex justify-between mb-6">
              <div className="w-1/2">
                <p className="font-bold border-b mb-1" style={{ borderColor: c }}>GUEST DETAILS</p>
                <p className="font-bold">{data.customerName || 'Walk-in Guest'}</p>
                {data.customerAddress && <p>{data.customerAddress}</p>}{data.customerPhone && <p>Ph: {data.customerPhone}</p>}
              </div>
              <div className="text-right w-1/2">
                <p className="font-bold border-b mb-1" style={{ borderColor: c }}>STAY INFO</p>
                <p>Check In: {fmtDate(data.checkInDate)} {data.checkInTime}</p>
                <p>Check Out: {fmtDate(data.checkOutDate)} {data.checkOutTime}</p>
              </div>
            </div>
            <ItemsTable />
            <TotalsBlock />
            <div className="mt-auto"><TermsAndSignature /></div>
          </div>
        );
      
      // Removed bulk code switch options for brevity, they can be added back if needed.
      default: 
        return (
          <div className="p-8 h-full bg-white flex flex-col font-sans relative">
             <div className="flex justify-between items-center mb-6"><HotelHeader align="left" data={data}/><div><p className="font-bold text-xl">{data.invoiceNo}</p><p>{fmtDate(data.date)}</p></div></div>
             <div className="flex justify-between mb-6 border-y py-4"><div><p className="font-bold">{data.customerName}</p></div><div><p>In: {fmtDate(data.checkInDate)}</p><p>Out: {fmtDate(data.checkOutDate)}</p></div></div>
             <ItemsTable stretch={true}/>
             <TotalsBlock />
             <div className="mt-auto"><TermsAndSignature /></div>
          </div>
        );
    }
  };

  if (!isMounted) return null;

  // Ensure that a valid font is passed to className or style, and NEVER double use className
  const fontClass = store.fontFamily && !store.fontFamily.includes(',') ? store.fontFamily : '';

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
          .no-print { display: none !important; }
        }
      `}} />
      <div className="flex flex-col items-center w-full no-print">
        
        {/* ACTION BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full max-w-[794px] mx-auto mb-6 bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 gap-3 md:gap-0">
          <button onClick={() => window.history.back()} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition active:scale-95"><ArrowLeft size={16} /> Back</button>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end items-center">
            <div className="relative">
              <button onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-md"><Share2 size={16} /> Share</button>
              {showShareMenu && (
                <div className="absolute top-10 right-0 bg-white border border-slate-200 shadow-xl rounded-lg w-40 py-2 z-50">
                  <button onClick={() => shareFile('pdf')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700"><FileText size={16} className="text-red-500" /> As PDF</button>
                  <button onClick={() => shareFile('png')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700"><ImageIcon size={16} className="text-indigo-500" /> As Image</button>
                </div>
              )}
            </div>
            <button onClick={handlePrint} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-md"><Printer size={16} /></button>
            <button onClick={() => downloadFile('png')} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-md"><FileImage size={16} /></button>
            <button onClick={() => downloadFile('pdf')} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-md"><Download size={16} /></button>
          </div>
        </div>

        {/* 🚨 VERCEL FIX: Removed dual className, simplified styles */}
        <div 
           className={`bg-white shadow-2xl w-full mx-auto overflow-hidden border border-slate-200 transition-all ${fontClass}`} 
           style={{ 
             maxWidth: '794px', 
             height: '1123px', 
             fontFamily: store.fontFamily.includes(',') ? store.fontFamily : undefined, 
             fontSize: `${fz}px` 
           }}
        >
          <div ref={printRef} className="h-full w-full relative" style={store.customBackground ? { backgroundImage: `url(${store.customBackground})`, backgroundSize: 'cover' } : {}}>
             {renderTemplate()}
          </div>
        </div>
      </div>
    </>
  );
}