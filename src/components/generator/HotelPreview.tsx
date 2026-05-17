'use client';

import { useRef, useState } from 'react';
import { useHotelStore } from '@/store/useBillStore';
import { Download, FileImage, Share2, FileText, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != '00') ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
  str += (n[2] != '00') ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
  str += (n[3] != '00') ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
  str += (n[4] != '0') ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
  str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) : '';
  return str.trim() + ' Only';
}

export default function HotelPreview() {
  const store = useHotelStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

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
  const fmtDate = (d: string) => d ? d.split('-').reverse().join('-') : '';

  const hasGuest = store.customerName || store.customerPhone || store.customerAddress;
  const displayLogo = store.showLogo ? store.logo : null;

  const downloadPNG = async () => {
    if (!printRef.current) return;
    const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
    const link = document.createElement('a'); link.download = `Hotel_${store.invoiceNo}.png`; link.href = dataUrl; link.click();
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
    const pdf = new jsPDF({ format: 'a4', unit: 'px' });
    const w = pdf.internal.pageSize.getWidth(); const h = (printRef.current.offsetHeight * w) / printRef.current.offsetWidth;
    pdf.addImage(dataUrl, 'PNG', 0, 0, w, h); pdf.save(`Hotel_${store.invoiceNo}.pdf`);
  };

  // 🟢 NAYA: Smart Share Function for Hotel
  const shareFile = async (type: 'png' | 'pdf') => {
    if (!printRef.current) return;
    setShowShareMenu(false);

    try {
      let file: File;
      const fileName = `Hotel_${store.invoiceNo}.${type}`;
      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      
      if (type === 'png') {
        const blob = await (await fetch(dataUrl)).blob();
        file = new File([blob], fileName, { type: 'image/png' });
      } else {
        const pdf = new jsPDF({ format: 'a4', unit: 'px' });
        const w = pdf.internal.pageSize.getWidth();
        const h = (printRef.current.offsetHeight * w) / printRef.current.offsetWidth;
        pdf.addImage(dataUrl, 'PNG', 0, 0, w, h);
        const pdfBlob = pdf.output('blob');
        file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      }

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Invoice ${store.invoiceNo}`,
          text: `Hello ${store.customerName || 'Guest'},\nHere is your hotel invoice of ${cur}${Math.max(0, balanceDue)} from ${store.hotelName}.`,
          files: [file]
        });
      } else {
        alert("Your browser doesn't support direct file sharing. The file will be downloaded instead.");
        type === 'png' ? downloadPNG() : downloadPDF();
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const TotalsBlock = () => (
    <div className="w-64 space-y-1 text-sm ml-auto">
      <div className="flex justify-between"><span>Subtotal:</span><span>{cur}{baseTotal.toFixed(2)}</span></div>
      {store.discount > 0 && <div className="flex justify-between text-red-600"><span>Discount:</span><span>-{cur}{discountAmount.toFixed(2)}</span></div>}
      {store.hasTax && (
        <><div className="flex justify-between text-slate-600"><span>CGST ({store.cgstRate}%):</span><span>{cur}{cgst.toFixed(2)}</span></div>
        <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-1 mb-1"><span>SGST ({store.sgstRate}%):</span><span>{cur}{sgst.toFixed(2)}</span></div></>
      )}
      <div className="flex justify-between font-bold text-lg"><span>Grand Total:</span><span>{cur}{Math.round(grandTotal).toFixed(2)}</span></div>
      {store.advancePaid > 0 && (
        <><div className="flex justify-between text-emerald-600 mt-1"><span>Advance Paid:</span><span>-{cur}{store.advancePaid}</span></div>
        <div className="flex justify-between font-bold text-rose-600 border-t border-slate-200 mt-1 pt-1"><span>Balance Due:</span><span>{cur}{Math.max(0, balanceDue).toFixed(2)}</span></div></>
      )}
    </div>
  );

  const TermsAndSignature = () => (
    <div className="flex justify-between items-end mt-8 pt-4">
      <div className="text-xs text-slate-500 max-w-[60%]">
        <p className="font-bold text-slate-700 mb-1">Terms & Conditions:</p>
        <p>1. Please hand over the room key to reception at checkout.</p>
        <p>2. Payment is non-refundable. All disputes subject to local jurisdiction.</p>
        {store.showPoweredBy && <p className="mt-2 opacity-60 text-[10px]">System Generated Invoice via Billgeno</p>}
      </div>
      {store.showSignature && (
        <div className="text-center w-40">
          {store.signature ? (
            <img src={store.signature} className="h-10 mx-auto mb-1" alt="sign" />
          ) : (
            <div className="h-10 border-b border-black mb-1 w-full"></div>
          )}
          <p className="text-xs font-bold uppercase">Authorized Signatory</p>
        </div>
      )}
    </div>
  );

  const ItemsTable = ({ coloredHeader = false }) => (
    <table className="w-full text-left text-sm mb-6 border-collapse">
      <thead style={coloredHeader ? { backgroundColor: c, color: '#fff' } : { borderBottom: '2px solid #000' }}>
        <tr><th className="py-2 px-2">Description</th><th className="py-2 px-2 text-center">Qty/Days</th><th className="py-2 px-2 text-right">Rate</th><th className="py-2 px-2 text-right">Amount</th></tr>
      </thead>
      <tbody>
        <tr>
          <td className="py-2 px-2 border-b border-slate-200">Room: {store.roomType} (No: {store.roomNo}) <br/><span className="text-xs text-slate-500">SAC: 9963</span></td>
          <td className="py-2 px-2 border-b border-slate-200 text-center align-top">{store.noOfDays}</td>
          <td className="py-2 px-2 border-b border-slate-200 text-right align-top">{cur}{store.perDayCharge}</td>
          <td className="py-2 px-2 border-b border-slate-200 text-right align-top">{cur}{roomSubtotal}</td>
        </tr>
        {store.extraServices.map((svc) => (
          <tr key={svc.id}>
            <td className="py-2 px-2 border-b border-slate-200" colSpan={3}>{svc.name}</td>
            <td className="py-2 px-2 border-b border-slate-200 text-right">{cur}{svc.amount}</td>
          </tr>
        ))}
        {store.showServiceCharge && <tr><td className="py-2 px-2 border-b border-slate-200 font-medium" colSpan={3}>Service Charges</td><td className="py-2 px-2 border-b border-slate-200 text-right">{cur}{store.serviceCharge}</td></tr>}
      </tbody>
    </table>
  );

  const renderTemplate = () => {
    const t = store.selectedTemplate;

    switch (t) {
      case 1: 
        return (
          <div className="p-8 h-full bg-white text-black flex flex-col">
            <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
              <div className="flex items-center gap-4">
                {displayLogo && <img src={displayLogo} className="h-14" alt="logo" />}
                <div><h1 className="text-2xl font-bold uppercase">{store.hotelName}</h1><p className="text-sm">{store.address}</p></div>
              </div>
              <div className="text-right"><h2 className="text-xl font-bold">INVOICE</h2><p className="font-bold">#{store.invoiceNo}</p><p className="text-sm">Date: {fmtDate(store.date)}</p></div>
            </div>
            <div className="flex justify-between mb-6 text-sm">
              <div className="w-1/2">
                {hasGuest && <p className="font-bold border-b border-black mb-1">GUEST DETAILS</p>}
                {store.customerName && <p className="font-bold">{store.customerName}</p>}
                {store.customerAddress && <p>{store.customerAddress}</p>}
                {store.customerPhone && <p>Ph: {store.customerPhone}</p>}
              </div>
              <div className="text-right w-1/2"><p className="font-bold border-b border-black mb-1">STAY DETAILS</p><p>Check In: {fmtDate(store.checkInDate)}</p><p>Check Out: {fmtDate(store.checkOutDate)}</p></div>
            </div>
            <ItemsTable />
            <TotalsBlock />
            <div className="mt-auto"><TermsAndSignature /></div>
          </div>
        );

      case 2:
        return (
          <div className="p-8 h-full bg-white text-slate-800 flex flex-col font-sans">
            <div className="text-center mb-8">
              {displayLogo && <img src={displayLogo} className="h-12 mx-auto mb-2" alt="logo" />}
              <h1 className="text-3xl font-light tracking-wide">{store.hotelName}</h1>
              <p className="text-xs text-slate-500">{store.address} | Ph: {store.phone}</p>
            </div>
            <div className="flex justify-between text-sm mb-8 bg-slate-50 p-4 rounded border border-slate-100">
              <div className="w-1/2">
                {hasGuest && <p className="text-slate-400 text-xs uppercase mb-1">Billed To</p>}
                {store.customerName && <p className="font-semibold text-lg leading-tight">{store.customerName}</p>}
                {store.customerAddress && <p className="text-slate-600 mt-1">{store.customerAddress}</p>}
              </div>
              <div className="text-right w-1/2"><p className="text-slate-400 text-xs uppercase mb-1">Invoice No & Date</p><p className="font-semibold">{store.invoiceNo}</p><p>{fmtDate(store.date)}</p></div>
            </div>
            <ItemsTable />
            <TotalsBlock />
            <div className="mt-auto"><TermsAndSignature /></div>
          </div>
        );

      case 3:
        return (
          <div className="p-8 h-full bg-white flex flex-col">
            <div className="flex justify-between border-b pb-4 mb-6">
              <div><h1 className="text-2xl font-bold" style={{color: c}}>{store.hotelName}</h1><p className="text-sm text-slate-500">{store.address}</p></div>
              {displayLogo && <img src={displayLogo} className="h-12" alt="logo" />}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg border text-sm" style={{borderColor: c}}>
                <h3 className="font-bold mb-2 uppercase text-xs" style={{color: c}}>Guest Information</h3>
                {hasGuest ? <>{store.customerName && <p className="font-bold">{store.customerName}</p>}{store.customerAddress && <p>{store.customerAddress}</p>}</> : <p className="text-slate-400 italic">Walk-in Guest</p>}
              </div>
              <div className="p-4 rounded-lg border text-sm" style={{borderColor: c}}><h3 className="font-bold mb-2 uppercase text-xs" style={{color: c}}>Booking Information</h3><p>Invoice: <strong>{store.invoiceNo}</strong></p><p>Stay: {fmtDate(store.checkInDate)} to {fmtDate(store.checkOutDate)}</p></div>
            </div>
            <ItemsTable coloredHeader={true} />
            <div className="flex justify-between items-end mt-4">
              <div className="w-1/2 text-sm text-slate-500 italic px-2">Amount in words: {numberToWords(Math.round(grandTotal))}</div>
              <div className="w-1/2"><TotalsBlock /></div>
            </div>
            <div className="mt-auto"><TermsAndSignature /></div>
          </div>
        );

      case 4:
        return (
          <div className="h-full bg-white flex flex-col relative">
            <div className="absolute top-0 left-0 right-0 h-4" style={{backgroundColor: c}}></div>
            <div className="p-8 pt-12 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                {displayLogo ? <img src={displayLogo} className="h-16" alt="logo" /> : <h1 className="text-3xl font-black">{store.hotelName}</h1>}
                <div className="text-right"><h2 className="text-3xl font-light uppercase tracking-widest text-slate-300">Invoice</h2><p className="font-bold"># {store.invoiceNo}</p><p className="text-sm text-slate-500">Date: {fmtDate(store.date)}</p></div>
              </div>
              {!displayLogo && <p className="text-sm text-slate-500 mb-6">{store.address}</p>}
              <div className="flex bg-slate-100 p-4 mb-8 text-sm">
                <div className="w-1/2 border-r border-slate-300 pr-4"><p className="text-xs text-slate-400 uppercase font-bold">Billed To</p>{hasGuest ? <>{store.customerName && <p className="font-bold text-lg">{store.customerName}</p>}{store.customerAddress && <p className="text-slate-600">{store.customerAddress}</p>}</> : <p className="font-bold text-lg text-slate-400">Cash Guest</p>}</div>
                <div className="w-1/2 pl-4"><p className="text-xs text-slate-400 uppercase font-bold">Stay Period</p><p className="font-bold mt-1">{fmtDate(store.checkInDate)} — {fmtDate(store.checkOutDate)}</p></div>
              </div>
              <ItemsTable coloredHeader={true} />
              <TotalsBlock />
              <div className="mt-auto"><TermsAndSignature /></div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="p-8 h-full bg-slate-50 flex flex-col">
            <div className="bg-white p-6 rounded-xl shadow-sm mb-4 flex justify-between items-center border border-slate-100">
              <div className="flex items-center gap-3">
                {displayLogo && <img src={displayLogo} className="h-10" alt="logo" />}
                <div><h1 className="text-2xl font-bold">{store.hotelName}</h1><p className="text-xs text-slate-500">{store.address}</p></div>
              </div>
              <div className="text-right"><p className="text-sm text-slate-400 uppercase font-bold">Receipt</p><p className="font-bold text-lg">{store.invoiceNo}</p></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm mb-4 border border-slate-100">
              {hasGuest && <p className="text-xs text-slate-400 mb-1 font-bold uppercase">Billed To</p>}
              {store.customerName && <p className="text-xl font-bold">{store.customerName}</p>}
              <div className="flex justify-between mt-4 text-sm border-t pt-4"><div><span className="text-slate-400">Check-In:</span> {fmtDate(store.checkInDate)}</div><div><span className="text-slate-400">Check-Out:</span> {fmtDate(store.checkOutDate)}</div><div><span className="text-slate-400">Room:</span> {store.roomType}</div></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm flex-1 flex flex-col border border-slate-100">
              <ItemsTable />
              <TotalsBlock />
              <div className="mt-auto pt-4"><TermsAndSignature /></div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="p-10 h-full bg-[#fdfbf7] flex flex-col font-serif border-8 border-white outline outline-1 outline-slate-200">
            <div className="text-center border-b border-black pb-6 mb-6">
              {displayLogo && <img src={displayLogo} className="h-16 mx-auto mb-4" alt="logo" />}
              <h1 className="text-4xl uppercase tracking-widest">{store.hotelName}</h1>
              <p className="text-sm mt-2">{store.address}</p>
            </div>
            <div className="text-center mb-8"><h2 className="text-xl tracking-[0.2em] uppercase">Guest Folio</h2></div>
            <div className="flex justify-between text-sm mb-8">
              <div className="w-1/2 pr-4">{hasGuest && <>{store.customerName && <p><strong>Name:</strong> {store.customerName}</p>}</>}<p className="mt-1"><strong>Room:</strong> {store.roomNo} ({store.roomType})</p></div>
              <div className="text-right w-1/2"><p><strong>Folio No:</strong> {store.invoiceNo}</p><p><strong>Arrival:</strong> {fmtDate(store.checkInDate)}</p></div>
            </div>
            <ItemsTable />
            <TotalsBlock />
            <div className="mt-auto pt-8 border-t border-black"><TermsAndSignature /></div>
          </div>
        );

      case 7:
        return (
          <div className="p-12 h-full bg-white flex flex-col font-serif text-slate-800 relative">
            <div className="absolute top-0 bottom-0 left-0 w-2" style={{backgroundColor: c}}></div>
            <div className="pl-6 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <div><h1 className="text-3xl uppercase tracking-widest" style={{color: c}}>{store.hotelName}</h1><p className="text-sm text-slate-500 italic mt-1">{store.address}</p></div>
                {displayLogo && <img src={displayLogo} className="h-12" alt="logo" />}
              </div>
              <div className="grid grid-cols-3 gap-6 text-sm border-y border-slate-200 py-4 mb-8">
                <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Guest</p>{hasGuest ? <>{store.customerName && <p className="font-bold">{store.customerName}</p>}</> : <p className="italic text-slate-400">Not Provided</p>}</div>
                <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Invoice</p><p>{store.invoiceNo} <br/> {fmtDate(store.date)}</p></div>
                <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Duration</p><p>{store.noOfDays} Nights</p></div>
              </div>
              <ItemsTable />
              <div className="mt-4"><TotalsBlock /></div>
              <div className="mt-auto pt-8"><TermsAndSignature /></div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="h-full bg-white flex flex-col text-sm border border-slate-200">
            <div className="bg-slate-900 text-white p-8 flex justify-between items-center">
              <div className="flex items-center gap-4">
                {displayLogo && <div className="bg-white p-2 rounded"><img src={displayLogo} className="h-10" alt="logo" /></div>}
                <div><h1 className="text-3xl font-bold">{store.hotelName}</h1><p className="text-slate-300 mt-1">{store.address}</p></div>
              </div>
              <h2 className="text-2xl uppercase tracking-widest text-slate-500">Invoice</h2>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between mb-8 pb-4 border-b">
                <div className="w-1/2">{hasGuest && <p className="font-bold text-slate-400 mb-1">BILLED TO</p>}{store.customerName && <p className="text-lg font-bold">{store.customerName}</p>}{store.customerAddress && <p className="text-slate-600">{store.customerAddress}</p>}</div>
                <div className="text-right w-1/2"><p className="font-bold text-slate-400 mb-1">DETAILS</p><p>Inv: <span className="font-bold">{store.invoiceNo}</span></p><p>Date: {fmtDate(store.date)}</p></div>
              </div>
              <ItemsTable />
              <TotalsBlock />
              <div className="mt-auto"><TermsAndSignature /></div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="p-8 h-full bg-stone-50 flex flex-col font-sans">
            <div className="border-l-4 pl-4 mb-8" style={{borderColor: c}}>
              {displayLogo && <img src={displayLogo} className="h-12 mb-2" alt="logo" />}
              <h1 className="text-3xl font-black uppercase tracking-tighter" style={{color: c}}>{store.hotelName}</h1>
              <p className="text-sm text-stone-500">{store.address}</p>
            </div>
            <div className="bg-white p-6 shadow-sm border border-stone-200 mb-8 flex justify-between items-center">
              <div className="w-1/2">{hasGuest ? <><p className="text-xs font-bold text-stone-400 uppercase mb-1">Guest</p>{store.customerName && <p className="text-xl font-bold">{store.customerName}</p>}</> : <p className="text-xl font-bold text-stone-300">Walk-in Guest</p>}</div>
              <div className="text-right w-1/2"><p className="text-xs font-bold text-stone-400 uppercase mb-1">Invoice</p><p className="text-xl font-bold">{store.invoiceNo}</p></div>
            </div>
            <div className="bg-white p-6 shadow-sm border border-stone-200 flex-1 flex flex-col">
              <ItemsTable />
              <div className="mt-4"><TotalsBlock /></div>
              <div className="mt-auto pt-8"><TermsAndSignature /></div>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="h-full bg-white flex flex-col relative font-sans text-sm pb-8">
            <div className="px-10 py-8 flex justify-between items-center" style={{ backgroundColor: c, color: '#fff' }}>
              <div><h1 className="text-3xl font-bold uppercase">{store.hotelName}</h1><p className="mt-1 opacity-90">{store.address}</p></div>
              {displayLogo && <div className="bg-white p-2 rounded"><img src={displayLogo} className="h-16" alt="logo" /></div>}
            </div>
            <div className="px-10 py-8 flex-1 flex flex-col">
              <div className="text-center mb-8"><h2 className="text-xl font-bold uppercase tracking-widest border-b-2 inline-block pb-1" style={{borderColor: c}}>TAX INVOICE</h2></div>
              <div className="flex justify-between mb-8 text-sm">
                <div className="w-1/2 pr-4">{hasGuest ? <><p className="font-bold uppercase text-slate-500 mb-1">To,</p>{store.customerName && <p className="font-bold text-lg">{store.customerName}</p>}{store.customerAddress && <p>{store.customerAddress}</p>}</> : <p className="font-bold text-lg text-slate-400 mt-4">Cash / Walk-in</p>}</div>
                <div className="border border-slate-200 p-4 rounded bg-slate-50 w-1/2"><table className="text-left w-full"><tbody><tr><th className="pr-4 pb-1 w-1/3">Invoice No:</th><td className="font-bold pb-1">{store.invoiceNo}</td></tr><tr><th className="pr-4 pb-1">Date:</th><td className="pb-1">{fmtDate(store.date)}</td></tr><tr><th className="pr-4 pb-1">Room No:</th><td className="pb-1">{store.roomNo}</td></tr></tbody></table></div>
              </div>
              <ItemsTable coloredHeader={true} />
              <div className="flex justify-between items-end mt-6">
                <div className="w-[55%]"><p className="text-xs uppercase text-slate-500 mb-1">Total Amount in Words:</p><p className="font-bold italic">{numberToWords(Math.round(grandTotal))}</p></div>
                <div className="w-[45%]"><TotalsBlock /></div>
              </div>
              <div className="mt-auto"><TermsAndSignature /></div>
            </div>
          </div>
        );

      default: return <div>Select Template</div>;
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-4 w-full mb-4 justify-end relative">
        
        {/* 🟢 Share Menu Button */}
        <div className="relative">
          <button 
            onClick={() => setShowShareMenu(!showShareMenu)} 
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition"
          >
            <Share2 size={18} /> Share
          </button>
          
          {showShareMenu && (
            <div className="absolute top-12 right-0 bg-white border border-slate-200 shadow-xl rounded-lg w-48 py-2 z-50">
              <p className="text-xs font-bold text-slate-400 px-4 mb-2 uppercase">Share to app</p>
              <button onClick={() => shareFile('pdf')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium">
                <FileText size={16} className="text-red-500" /> Share as PDF
              </button>
              <button onClick={() => shareFile('png')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium">
                <ImageIcon size={16} className="text-indigo-500" /> Share as Image
              </button>
            </div>
          )}
        </div>

        <button onClick={downloadPNG} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition">
          <FileImage size={18} /> PNG
        </button>
        <button onClick={downloadPDF} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded shadow hover:bg-slate-900 transition">
          <Download size={18} /> PDF
        </button>
      </div>
      <div className="bg-white shadow-2xl w-full max-w-[700px] mx-auto overflow-hidden border border-slate-200" style={{ height: '900px', fontFamily: store.fontFamily.includes(',') ? store.fontFamily : undefined }} className={!store.fontFamily.includes(',') ? store.fontFamily : ''}>
        <div ref={printRef} className="h-full w-full">{renderTemplate()}</div>
      </div>
    </div>
  );
}