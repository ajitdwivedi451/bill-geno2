'use client';

import { useRef, useState } from 'react';
import { useRestaurantStore } from '@/store/useBillStore';
import { Download, FileImage, Share2, FileText, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function RestaurantPreview() {
  const store = useRestaurantStore();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const subtotal = store.items.reduce((acc, item) => acc + (item.amt || 0), 0);
  const cgst = store.hasTax ? (subtotal * store.cgstRate) / 100 : 0;
  const sgst = store.hasTax ? (subtotal * store.sgstRate) / 100 : 0;
  const total = subtotal + cgst + sgst;

  const downloadPNG = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `Billgeno_${store.receiptNo}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('PNG Error:', error);
    }
  };

  const downloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
      const pdf = new jsPDF({ format: 'a5', unit: 'px' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const refWidth = receiptRef.current.offsetWidth;
      const refHeight = receiptRef.current.offsetHeight;
      const pdfHeight = (refHeight * pdfWidth) / refWidth;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Billgeno_${store.receiptNo}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
    }
  };

  // 🟢 NAYA: Smart Share Function for Restaurant
  const shareFile = async (type: 'png' | 'pdf') => {
    if (!receiptRef.current) return;
    setShowShareMenu(false);

    try {
      let file: File;
      const fileName = `Billgeno_${store.receiptNo}.${type}`;
      const dataUrl = await toPng(receiptRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
      
      if (type === 'png') {
        const blob = await (await fetch(dataUrl)).blob();
        file = new File([blob], fileName, { type: 'image/png' });
      } else {
        const pdf = new jsPDF({ format: 'a5', unit: 'px' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const refWidth = receiptRef.current.offsetWidth;
        const refHeight = receiptRef.current.offsetHeight;
        const pdfHeight = (refHeight * pdfWidth) / refWidth;
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        const pdfBlob = pdf.output('blob');
        file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      }

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Receipt ${store.receiptNo}`,
          text: `Hello ${store.customerName || 'Guest'},\nHere is your receipt from ${store.businessName}.`,
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
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

      <div className="bg-white p-6 shadow-xl w-full max-w-[350px] mx-auto rounded-sm">
        <div ref={receiptRef} className="bg-white p-4 font-mono text-black text-[13px] leading-relaxed" style={{ width: '100%' }}>
          
          <div className="text-center font-bold mb-4">
            <h2 className="text-xl tracking-widest uppercase">WELCOME</h2>
            <h1 className="text-[1.3rem] mt-1">{store.businessName || 'Business Name'}</h1>
            {store.address && (
              <p className="text-xs font-normal mt-1 leading-tight w-[80%] mx-auto">
                {store.address}
              </p>
            )}
            {store.phone && <p className="text-xs font-normal mt-1">Phone: {store.phone}</p>}
          </div>

          <div className="border-t border-dashed border-black my-2"></div>
          <div className="text-center text-sm">ORIGINAL RECEIPT</div>
          <div className="border-t border-dashed border-black my-2"></div>

          <div className="flex justify-between mb-1">
            <span>Date: {formatDate(store.date)}</span>
            <span>Time: {store.time}</span>
          </div>
          <div className="mb-1">Name: {store.customerName || 'Cash'}</div>
          <div>Receipt No: {store.receiptNo}</div>

          <div className="border-t border-dashed border-black my-2 mt-4"></div>
          
          <div className="flex justify-between font-bold">
            <span className="w-1/2">Item</span>
            <span className="w-1/6 text-center">Qty</span>
            <span className="w-1/6 text-right">Rate</span>
            <span className="w-1/6 text-right">Amt</span>
          </div>
          
          <div className="border-t border-dashed border-black my-2"></div>

          <div className="space-y-1 min-h-[50px]">
            {store.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="w-1/2 truncate pr-2">{item.name || '-'}</span>
                <span className="w-1/6 text-center">{item.qty}</span>
                <span className="w-1/6 text-right">{item.rate}</span>
                <span className="w-1/6 text-right">{item.amt}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-black my-2 mt-4"></div>

          {store.hasTax && (
            <>
              <div className="flex justify-between">
                <span>Sub Total:</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST ({store.cgstRate}%):</span>
                <span>{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST ({store.sgstRate}%):</span>
                <span>{sgst.toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed border-black my-2"></div>
            </>
          )}

          <div className="flex justify-between font-bold text-[15px]">
            <span>TOTAL:</span>
            <span>{total.toFixed(2)}</span>
          </div>
          
          <div className="border-t border-dashed border-black my-2"></div>
          <div className="text-center mt-3">Payment Mode: {store.paymentMode}</div>
          <div className="border-t border-dashed border-black my-2 mt-3"></div>
          <div className="text-center font-bold tracking-wider my-3 uppercase text-sm">
            Thank you, Visit again !!
          </div>
          <div className="border-t border-dashed border-black my-2"></div>
        </div>
      </div>
    </div>
  );
}