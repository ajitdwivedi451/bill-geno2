'use client';

import { useRef, useState, useEffect } from 'react';
import { useTravelStore } from '@/store/useTravelStore'; // 🟢 Path Updated
import { Download, FileImage, Share2, FileText, Image as ImageIcon, Printer, ArrowLeft } from 'lucide-react';
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
  return str.trim() ;
}

export default function TravelPreview() {
  const store = useTravelStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const baseFare = store.totalKm * store.ratePerKm;
  const subTotal = baseFare + store.tollsParking + store.driverAllowance + store.otherCharges;
  const taxAmount = store.hasTax ? (subTotal * store.taxRate) / 100 : 0;
  const grandTotal = subTotal + taxAmount - store.discount;
  const balanceDue = grandTotal - store.advancePaid;

  const cur = store.currency;
  const c = store.themeColor;
  const fmtDate = (d: string) => d ? d.split('-').reverse().join('-') : '';

  const downloadPNG = async () => {
    if (!printRef.current) return;
    const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
    const link = document.createElement('a'); link.download = `Trip_${store.invoiceNo}.png`; link.href = dataUrl; link.click();
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
    const pdf = new jsPDF({ format: 'a4', unit: 'px' });
    const w = pdf.internal.pageSize.getWidth(); const h = (printRef.current.offsetHeight * w) / printRef.current.offsetWidth;
    pdf.addImage(dataUrl, 'PNG', 0, 0, w, h); pdf.save(`Trip_${store.invoiceNo}.pdf`);
  };

  // 🟢 NAYA: Print Function
  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`<html><head><style>body{margin:0;display:flex;justify-content:center;background:white;}img{width:100%;max-width:794px;height:auto;}@page{margin:0;size:auto;}</style></head><body><img src="${dataUrl}" onload="setTimeout(()=>{window.print();window.close();},250);" /></body></html>`);
      printWindow.document.close();
    } catch (err) { console.error(err); }
  };

  const shareFile = async (type: 'png' | 'pdf') => {
    if (!printRef.current) return;
    setShowShareMenu(false);

    try {
      let file: File;
      const fileName = `Invoice_${store.invoiceNo}.${type}`;
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
          text: `Hello ${store.customerName},\nHere is your trip invoice from ${store.agencyName}.`,
          files: [file]
        });
      } else {
        alert("Your browser does not support direct file sharing. The file will be downloaded instead, you can attach it manually on WhatsApp.");
        type === 'png' ? downloadPNG() : downloadPDF();
      }
    } catch (error) { console.error("Error sharing:", error); }
  };

  const SignatureBlock = () => {
    if (!store.showSignature) return null;
    return (
      <div className="text-center w-40 mt-4 ml-auto">
        {store.signature ? <img src={store.signature} className="h-12 mx-auto mb-1" alt="sign"/> : <div className="h-12 border-b border-black mb-1"></div>}
        <p className="text-xs font-bold uppercase">Authorized Signatory</p>
      </div>
    );
  };

  const TotalsBlock = () => (
    <div className="w-72 ml-auto text-sm space-y-1">
      <div className="flex justify-between font-bold border-t border-black pt-1"><span>Sub Total:</span><span>{cur}{subTotal.toFixed(2)}</span></div>
      {store.hasTax && <div className="flex justify-between text-slate-600"><span>GST ({store.taxRate}%):</span><span>{cur}{taxAmount.toFixed(2)}</span></div>}
      {store.discount > 0 && <div className="flex justify-between text-red-600"><span>Discount:</span><span>-{cur}{store.discount.toFixed(2)}</span></div>}
      <div className="border-t-2 border-black my-1"></div>
      <div className="flex justify-between font-bold text-lg"><span>Grand Total:</span><span>{cur}{Math.round(grandTotal).toFixed(2)}</span></div>
      {store.advancePaid > 0 && (
        <>
          <div className="flex justify-between text-emerald-600 mt-1"><span>Advance Paid:</span><span>-{cur}{store.advancePaid.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-rose-600 text-base border-t border-slate-200 mt-1 pt-1"><span>Balance Due:</span><span>{cur}{Math.max(0, balanceDue).toFixed(2)}</span></div>
        </>
      )}
    </div>
  );

  const AgencyTable = ({ coloredHeader = false }) => (
    <table className="w-full text-left text-sm mb-6 border-collapse">
      <thead style={coloredHeader ? { backgroundColor: c, color: '#fff' } : { borderBottom: '2px solid #000', borderTop: '2px solid #000' }}>
        <tr><th className="py-2 px-2">Description</th><th className="py-2 px-2 text-center">KM / Qty</th><th className="py-2 px-2 text-right">Rate</th><th className="py-2 px-2 text-right">Amount</th></tr>
      </thead>
      <tbody>
        <tr className="border-b border-slate-100">
          <td className="py-3 px-2">
            <strong>Transport Charges ({store.vehicleType})</strong><br/>
            <span className="text-xs text-slate-500">Reg: {store.vehicleNo} | Route: {store.startLocation} to {store.endLocation}</span><br/>
            <span className="text-xs text-slate-500">KM Reading: Start {store.startKm} - End {store.endKm}</span>
          </td>
          <td className="py-3 px-2 text-center align-top">{store.totalKm}</td>
          <td className="py-3 px-2 text-right align-top">{cur}{store.ratePerKm}</td>
          <td className="py-3 px-2 text-right align-top">{cur}{baseFare.toFixed(2)}</td>
        </tr>
        {store.tollsParking > 0 && <tr className="border-b border-slate-100"><td className="py-2 px-2">Tolls & Parking Charges</td><td className="py-2 px-2 text-center">-</td><td className="py-2 px-2 text-right">-</td><td className="py-2 px-2 text-right">{cur}{store.tollsParking.toFixed(2)}</td></tr>}
        {store.driverAllowance > 0 && <tr className="border-b border-slate-100"><td className="py-2 px-2">Driver Allowance / Bata</td><td className="py-2 px-2 text-center">-</td><td className="py-2 px-2 text-right">-</td><td className="py-2 px-2 text-right">{cur}{store.driverAllowance.toFixed(2)}</td></tr>}
        {store.otherCharges > 0 && <tr className="border-b border-slate-100"><td className="py-2 px-2">Other Charges</td><td className="py-2 px-2 text-center">-</td><td className="py-2 px-2 text-right">-</td><td className="py-2 px-2 text-right">{cur}{store.otherCharges.toFixed(2)}</td></tr>}
      </tbody>
    </table>
  );

  const renderTemplate = () => {
    const t = store.selectedTemplate;

    switch (t) {
      case 1: 
        return (
          <div className="p-10 h-full bg-white text-slate-800 flex flex-col font-sans">
            <div className="flex justify-between items-start border-b-2 pb-6 mb-6" style={{ borderColor: c }}>
              <div>
                {store.showLogo && store.logo && <img src={store.logo} className="h-16 mb-2 object-contain" alt="logo" />}
                <h1 className="text-3xl font-bold uppercase">{store.agencyName}</h1>
                <p className="whitespace-pre-wrap text-sm text-slate-600">{store.address}</p>
                <div className="text-sm mt-1">
                  {store.phone && <span>Ph: {store.phone} </span>}
                  {store.email && <span>| Email: {store.email}</span>}
                </div>
                {store.gstin && <p className="text-sm font-semibold mt-1">GSTIN: {store.gstin}</p>}
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black uppercase tracking-wider text-slate-300">Invoice</h2>
                <p className="font-bold mt-1"># {store.invoiceNo}</p>
                <p className="text-sm text-slate-500">Date: {fmtDate(store.date)}</p>
              </div>
            </div>

            <div className="flex justify-between bg-slate-50 p-4 rounded border border-slate-200 mb-6 text-sm">
              <div>
                <p className="font-bold text-xs uppercase text-slate-400 mb-1">Billed To</p>
                <p className="font-bold text-lg">{store.customerName || 'Cash Guest'}</p>
                {store.customerPhone && <p>{store.customerPhone}</p>}
              </div>
              <div className="text-right">
                <p className="font-bold text-xs uppercase text-slate-400 mb-1">Journey Dates</p>
                <p className="font-semibold">{fmtDate(store.startDate)} to {fmtDate(store.endDate)}</p>
              </div>
            </div>

            <AgencyTable coloredHeader={false} />

            <div className="flex justify-between items-end mt-4">
              <div className="w-[45%] text-xs text-slate-500">
                <p className="uppercase font-bold text-slate-400 mb-1">Amount in Words:</p>
                <p className="italic font-bold text-black">{numberToWords(Math.round(grandTotal))}</p>
              </div>
              <div className="w-[55%]"><TotalsBlock /></div>
            </div>

            <div className="mt-auto border-t-2 pt-4 flex justify-between items-end" style={{ borderColor: c }}>
              <div className="text-xs text-slate-500">Subject to local jurisdiction. E.&O.E.</div>
              <SignatureBlock />
            </div>
          </div>
        );

      case 2: 
        return (
          <div className="p-0 h-full bg-white flex flex-col">
            <div className="p-10 text-white" style={{ backgroundColor: c }}>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-4xl font-bold">{store.agencyName}</h1>
                  <p className="opacity-90 whitespace-pre-wrap mt-2">{store.address}</p>
                  <p className="opacity-90 mt-1">{store.phone} {store.email && `| ${store.email}`}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-light tracking-widest uppercase">Invoice</h2>
                  <p className="text-lg font-bold mt-2"># {store.invoiceNo}</p>
                  <p className="text-sm opacity-80">{fmtDate(store.date)}</p>
                </div>
              </div>
            </div>
            <div className="p-10 flex-1 flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase">Passenger</p>
                <p className="font-bold text-xl">{store.customerName}</p>
                {store.customerPhone && <p className="text-sm text-slate-600">{store.customerPhone}</p>}
              </div>
              
              <AgencyTable coloredHeader={true} />
              
              <TotalsBlock />
              
              <div className="mt-auto flex justify-between items-end border-t pt-4">
                <div className="italic text-slate-600 text-sm font-bold">Amt: {numberToWords(Math.round(grandTotal))}</div>
                <SignatureBlock />
              </div>
            </div>
          </div>
        );

      case 3: 
        return (
          <div className="bg-slate-100 h-full flex justify-center py-4">
            <div className="bg-[#fdfcf8] p-4 text-[12px] font-mono leading-tight shadow-xl" style={{ width: '320px', minHeight: '600px' }}>
              <div className="text-center border-b border-dashed border-black pb-2 mb-2">
                {store.showLogo && store.logo ? <img src={store.logo} className="h-12 mx-auto mix-blend-multiply grayscale" alt="logo"/> : <h1 className="font-bold text-[16px] uppercase">{store.agencyName}</h1>}
                <div className="mt-1 whitespace-pre-wrap">{store.address}</div>
                {store.phone && <div>Ph: {store.phone}</div>}
                {store.gstin && <div>GST: {store.gstin}</div>}
              </div>
              
              <div className="text-center font-bold text-[14px] mb-2">RIDE RECEIPT</div>
              <div>Date: {fmtDate(store.date)}</div>
              <div>CRN: {store.invoiceNo}</div>
              <div className="mb-2">Guest: {store.customerName}</div>
              
              <div className="border-t border-dashed border-black my-2"></div>
              
              <div className="font-bold uppercase">Journey</div>
              <div>From: {store.startLocation}</div>
              <div>To: {store.endLocation}</div>
              <div className="mt-1">Vehicle: {store.vehicleType}</div>
              <div>Reg No: {store.vehicleNo}</div>
              
              <div className="border-t border-dashed border-black my-2"></div>
              
              <div className="flex justify-between"><span>Distance:</span><span>{store.totalKm} km</span></div>
              <div className="flex justify-between mb-2"><span>Rate:</span><span>{cur}{store.ratePerKm}/km</span></div>
              
              <div className="flex justify-between"><span>Ride Fare:</span><span>{cur}{baseFare.toFixed(2)}</span></div>
              {store.tollsParking > 0 && <div className="flex justify-between"><span>Tolls/Park:</span><span>{cur}{store.tollsParking.toFixed(2)}</span></div>}
              {store.driverAllowance > 0 && <div className="flex justify-between"><span>Driver:</span><span>{cur}{store.driverAllowance.toFixed(2)}</span></div>}
              {store.hasTax && <div className="flex justify-between"><span>Taxes:</span><span>{cur}{taxAmount.toFixed(2)}</span></div>}
              {store.discount > 0 && <div className="flex justify-between"><span>Discount:</span><span>-{cur}{store.discount.toFixed(2)}</span></div>}
              
              <div className="border-t border-dashed border-black my-2"></div>
              <div className="flex justify-between font-bold text-[15px]"><span>Total:</span><span>{cur}{Math.round(grandTotal)}</span></div>
              <div className="flex justify-between"><span>Paid via:</span><span>{store.paymentMode}</span></div>
              
              <div className="border-t border-dashed border-black my-2 mt-4"></div>
              <div className="text-center mt-2">Have a good day!</div>
              <SignatureBlock />
            </div>
          </div>
        );

      case 4: 
        return (
          <div className="p-12 h-full bg-white flex flex-col font-serif border">
            <h1 className="text-4xl uppercase tracking-widest mb-2" style={{ color: c }}>{store.agencyName}</h1>
            <p className="text-slate-500 text-sm mb-1 whitespace-pre-wrap">{store.address}</p>
            {(store.phone || store.email) && <p className="text-slate-500 text-sm mb-8">Ph: {store.phone} | {store.email}</p>}
            
            <div className="grid grid-cols-2 gap-8 mb-10 border-t border-b py-4 border-slate-200">
              <div><p className="text-xs uppercase text-slate-400 mb-1">Invoice For</p><p className="font-bold text-xl">{store.customerName}</p>{store.customerPhone && <p className="text-sm">{store.customerPhone}</p>}</div>
              <div className="text-right"><p className="text-xs uppercase text-slate-400 mb-1">Invoice Details</p><p className="font-bold text-lg">No. {store.invoiceNo}</p><p className="text-sm">{fmtDate(store.date)}</p></div>
            </div>
            
            <AgencyTable />
            <TotalsBlock />
            <div className="mt-auto flex justify-between items-end pt-4"><p className="italic text-slate-400 text-sm">Thanks for choosing us.</p><SignatureBlock /></div>
          </div>
        );

      case 5: 
        return (
          <div className="p-12 h-full bg-[#111] text-amber-50 flex flex-col font-serif">
            <div className="text-center border-b border-amber-900 pb-8 mb-8">
              {store.showLogo && store.logo && <img src={store.logo} className="h-16 mx-auto mb-4 invert" alt="logo" />}
              <h1 className="text-4xl uppercase tracking-[0.2em] text-amber-500">{store.agencyName}</h1>
              <p className="text-sm mt-2 opacity-70">{store.address}</p>
            </div>
            <div className="flex justify-between mb-8 border border-amber-900 p-6 rounded">
              <div><p className="text-amber-600 text-xs tracking-widest uppercase mb-1">Chauffeur Service For</p><p className="text-xl font-bold">{store.customerName}</p></div>
              <div className="text-right"><p className="text-amber-600 text-xs tracking-widest uppercase mb-1">Booking Ref</p><p className="text-xl">{store.invoiceNo}</p></div>
            </div>
            <AgencyTable coloredHeader={false} />
            <TotalsBlock />
            <div className="mt-auto border-t border-amber-900 pt-8 flex justify-between"><div className="italic opacity-50">Elegance in Motion.</div><SignatureBlock /></div>
          </div>
        );

      case 6: 
        return (
          <div className="p-8 h-full bg-white text-black font-sans text-sm">
            <div className="border-2 border-black h-full flex flex-col p-1">
              <div className="text-center border-b-2 border-black pb-4 mb-2 pt-2">
                <h1 className="text-3xl font-black uppercase">{store.agencyName}</h1>
                <p className="whitespace-pre-wrap font-semibold mt-1">{store.address}</p>
                <p className="font-semibold">Mob: {store.phone} {store.gstin && `| GSTIN: ${store.gstin}`}</p>
              </div>
              <div className="flex border-b-2 border-black">
                <div className="w-1/2 border-r-2 border-black p-2"><p><strong>M/S:</strong> {store.customerName}</p>{store.customerPhone && <p><strong>Mob:</strong> {store.customerPhone}</p>}</div>
                <div className="w-1/2 p-2"><p><strong>Bill No:</strong> {store.invoiceNo}</p><p><strong>Date:</strong> {fmtDate(store.date)}</p></div>
              </div>
              <div className="p-2 border-b-2 border-black bg-slate-100 font-bold text-center">DUTY SLIP / BILL</div>
              <div className="flex border-b-2 border-black">
                <div className="w-1/2 border-r-2 border-black p-2"><p><strong>Vehicle:</strong> {store.vehicleType}</p><p><strong>Reg No:</strong> {store.vehicleNo}</p></div>
                <div className="w-1/2 p-2"><p><strong>Start KM:</strong> {store.startKm} | <strong>End KM:</strong> {store.endKm}</p><p><strong>Total KM:</strong> {store.totalKm}</p></div>
              </div>
              <div className="flex-1 p-2"><AgencyTable /></div>
              <div className="border-t-2 border-black flex">
                <div className="w-1/2 border-r-2 border-black p-2 flex flex-col justify-between"><p><strong>Rupees:</strong> {numberToWords(Math.round(grandTotal))}</p><SignatureBlock /></div>
                <div className="w-1/2 p-2"><TotalsBlock /></div>
              </div>
            </div>
          </div>
        );

      case 7: 
        return (
          <div className="h-full bg-slate-50 flex flex-col p-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-indigo-900">{store.agencyName}</h1>
                <div className="text-right bg-indigo-50 p-3 rounded-lg"><p className="text-xs font-bold text-indigo-400 uppercase">Invoice</p><p className="font-bold text-lg text-indigo-900">#{store.invoiceNo}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Bill To</p><p className="font-bold text-lg">{store.customerName}</p></div>
                <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Route</p><p className="font-bold">{store.startLocation} ➔ {store.endLocation}</p></div>
              </div>
              <AgencyTable coloredHeader={true} />
              <div className="mt-4"><TotalsBlock /></div>
              <div className="mt-auto pt-8 border-t flex justify-between"><p className="text-xs text-slate-400 w-1/2">Payment is due upon receipt. Thank you for your business.</p><SignatureBlock /></div>
            </div>
          </div>
        );

      case 8: 
        return (
          <div className="p-10 h-full bg-white flex flex-col font-sans">
            <div className="flex items-center gap-4 mb-10">
              {store.showLogo && store.logo && <img src={store.logo} className="h-12" alt="logo" />}
              <div><h1 className="text-2xl font-bold tracking-tight">{store.agencyName}</h1><p className="text-xs text-slate-500">{store.phone} • {store.email}</p></div>
              <div className="ml-auto text-right"><p className="font-mono text-xl">{store.invoiceNo}</p><p className="text-slate-400 text-sm">{fmtDate(store.date)}</p></div>
            </div>
            <div className="bg-slate-900 text-white p-6 rounded-xl mb-8 flex justify-between items-center">
              <div><p className="text-slate-400 text-xs uppercase">Passenger</p><p className="font-bold text-lg">{store.customerName}</p></div>
              <div className="text-right"><p className="text-slate-400 text-xs uppercase">Total Paid</p><p className="font-bold text-2xl text-emerald-400">{cur}{Math.round(grandTotal)}</p></div>
            </div>
            <AgencyTable />
            <TotalsBlock />
            <div className="mt-auto flex justify-end"><SignatureBlock /></div>
          </div>
        );

      case 9: 
        return (
          <div className="p-8 h-full bg-stone-100 flex flex-col border-x-8 border-stone-800">
            <div className="bg-white p-8 shadow flex-1 flex flex-col border border-stone-200">
              <div className="text-center mb-8 border-b-4 border-stone-800 pb-4">
                <h1 className="text-3xl font-black uppercase tracking-widest text-stone-800">{store.agencyName}</h1>
                <p className="mt-2 text-stone-600 font-medium whitespace-pre-wrap">{store.address}</p>
              </div>
              <div className="flex justify-between mb-6 font-bold text-stone-700"><span>Client: {store.customerName}</span><span>Inv: {store.invoiceNo} | Date: {fmtDate(store.date)}</span></div>
              <AgencyTable />
              <div className="bg-stone-50 p-4 border border-stone-200 mt-4"><TotalsBlock /></div>
              <div className="mt-auto pt-8 flex justify-between items-end"><p className="text-xs font-bold text-stone-400">THANK YOU FOR TRAVELING WITH US</p><SignatureBlock /></div>
            </div>
          </div>
        );

      case 10: 
        return (
          <div className="p-10 h-full bg-white flex flex-col font-mono text-sm leading-relaxed">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold border-b border-dashed border-black pb-2 mb-2">{store.agencyName}</h1>
              <p className="whitespace-pre-wrap">{store.address}</p>
              <p>PH: {store.phone}</p>
            </div>
            <div className="mb-6">
              <div>=========================================================</div>
              <div className="flex justify-between"><span>INVOICE: {store.invoiceNo}</span><span>DATE: {fmtDate(store.date)}</span></div>
              <div className="flex justify-between"><span>BILL TO: {store.customerName}</span><span>VEHICLE: {store.vehicleNo}</span></div>
              <div>=========================================================</div>
            </div>
            <AgencyTable />
            <div className="mb-2">=========================================================</div>
            <TotalsBlock />
            <div className="mt-auto pt-8 text-center">
              <div>*** END OF BILL ***</div>
              <SignatureBlock />
            </div>
          </div>
        );

      default: return null;
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col items-center">
      
      {/* 🟢 Premium Desktop Action Bar (Like Fuel & Hotel) */}
      <div className="flex justify-between items-center w-full max-w-[400px] mx-auto mb-6 bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800">
        <button 
          onClick={() => window.history.back()} 
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition active:scale-95"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex gap-2 relative">
          {/* Share Dropdown */}
          <div className="relative">
            <button onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-md">
              <Share2 size={16} /> Share
            </button>
            {showShareMenu && (
              <div className="absolute top-12 right-0 bg-white border border-slate-200 shadow-xl rounded-lg w-48 py-2 z-50 animate-in fade-in zoom-in duration-200">
                <p className="text-xs font-bold text-slate-400 px-4 mb-2 uppercase">Share directly to app</p>
                <button onClick={() => shareFile('pdf')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FileText size={16} className="text-red-500" /> Share as PDF
                </button>
                <button onClick={() => shareFile('png')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <ImageIcon size={16} className="text-indigo-500" /> Share as Image
                </button>
              </div>
            )}
          </div>

          <button onClick={handlePrint} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition active:scale-95 shadow-md"><Printer size={16} /></button>
          <button onClick={downloadPNG} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition active:scale-95 shadow-md"><FileImage size={16} /></button>
          <button onClick={downloadPDF} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition active:scale-95 shadow-md"><Download size={16} /></button>
        </div>
      </div>

      <div className="bg-white shadow-2xl w-full max-w-[750px] mx-auto overflow-hidden border border-slate-200" style={{ height: '1000px' }}>
        <div ref={printRef} className="h-full w-full">{renderTemplate()}</div>
      </div>
    </div>
  );
}