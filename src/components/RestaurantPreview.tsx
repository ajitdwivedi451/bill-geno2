'use client';

import { useRef, useState, useEffect } from 'react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Download, FileImage, Printer, ArrowLeft, Share2, FileText, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

const getPresetTextureCSS = (index: number) => {
  switch (index) {
    case 1: return { backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`, backgroundColor: '#fdfcf8' };
    case 2: return { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='f'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='%23e7e5e0'/%3E%3Crect width='100' height='100' filter='url(%23f)' opacity='0.3'/%3E%3C/svg%3E")`, backgroundColor: '#e7e5e0' };
    case 3: return { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='f'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='%23f4f4f5'/%3E%3Crect width='100' height='100' filter='url(%23f)' opacity='0.3'/%3E%3C/svg%3E")`, backgroundColor: '#f4f4f5' };
    case 4: return { backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`, backgroundColor: '#f1f0da' };
    case 5: return { backgroundColor: '#ffffff' };
    default: return { backgroundColor: '#ffffff' };
  }
};

export function RestaurantPreview() {
  const store = useRestaurantStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  // useEffect(() => {
  //   const handleBulkDownload = async () => {
  //     const elements = document.querySelectorAll('.print-bill');
  //     if (elements.length === 0) return alert("⚠️ No bills found to download.");
  //     try {
  //       const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
  //       const margin = 10; let currentX = margin; let currentY = margin; const a4Width = 210; const a4Height = 297; let maxRowHeight = 0;

  //       for (let i = 0; i < elements.length; i++) {
  //         const el = elements[i] as HTMLElement;
  //         const dataUrl = await toPng(el, { backgroundColor: '#ffffff', pixelRatio: 2 });
  //         const pxToMm = 0.264583; let imgWidth = el.offsetWidth * pxToMm; let imgHeight = el.offsetHeight * pxToMm;

  //         if (imgHeight > (a4Height - 20)) {
  //           const scaleFactor = (a4Height - 20) / imgHeight;
  //           imgHeight = imgHeight * scaleFactor; imgWidth = imgWidth * scaleFactor;
  //         }

  //         if (currentX + imgWidth > a4Width - margin) { currentX = margin; currentY += maxRowHeight + 5; maxRowHeight = 0; }
  //         if (currentY + imgHeight > a4Height - margin) { pdf.addPage(); currentX = margin; currentY = margin; maxRowHeight = 0; }

  //         pdf.addImage(dataUrl, 'PNG', currentX, currentY, imgWidth, imgHeight);
  //         currentX += imgWidth + 8; if (imgHeight > maxRowHeight) maxRowHeight = imgHeight;
  //       }
  //       pdf.save(`Bulk_Rest_Bills_${new Date().getTime()}.pdf`);
  //       alert("✅ Bulk Download Complete!");
  //     } catch (err) { console.error(err); alert("⚠️ Error processing Bulk PDF."); }
  //   };
  //   window.addEventListener('bulk-download', handleBulkDownload);
  //   return () => window.removeEventListener('bulk-download', handleBulkDownload);
  // }, [store.selectedBills]);
  useEffect(() => {
    const handleBulkDownload = async () => {
      const elements = document.querySelectorAll('.print-bill');
      if (elements.length === 0) return alert("⚠️ No bills found to download.");
      
      try {
        const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
        const a4Width = 210; 
        const a4Height = 297;
        const margin = 10; 
        
        let currentX = margin;
        let currentY = margin;
        let maxRowHeight = 0;

        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          const dataUrl = await toPng(el, { backgroundColor: '#ffffff', pixelRatio: 3 });
          
          const pxToMm = 0.264583; 
          let imgWidth = el.offsetWidth * pxToMm; 
          let imgHeight = el.offsetHeight * pxToMm;

          // Max Width Limit: Ek bill A4 ki aadhi width se thoda chota hona chahiye (taki 2 side-by-side aa sakein)
          const maxWidth = 90; // 90mm is safe for 2 columns
          if (imgWidth > maxWidth) {
            const ratio = maxWidth / imgWidth;
            imgWidth = maxWidth;
            imgHeight = imgHeight * ratio;
          }

          // Check X: Agar next bill same row me fit nahi aa raha to next row me jao
          if (currentX + imgWidth > a4Width - margin) {
            currentX = margin;
            currentY += maxRowHeight + 10; // row gap
            maxRowHeight = 0;
          }

          // Check Y: Agar next row page limit se bahar ja rahi hai to naya page add karo
          if (currentY + imgHeight > a4Height - margin) {
            pdf.addPage();
            currentX = margin;
            currentY = margin;
            maxRowHeight = 0;
          }

          // Print Image
          pdf.addImage(dataUrl, 'PNG', currentX, currentY, imgWidth, imgHeight);
          
          // Next bill ke liye X position update karo (plus gap)
          currentX += imgWidth + 10; 
          
          if (imgHeight > maxRowHeight) {
            maxRowHeight = imgHeight;
          }
        }
        
        pdf.save(`Bulk_Rest_Bills_${new Date().getTime()}.pdf`);
        alert("✅ Bulk Download Complete!");
      } catch (err) { 
        console.error(err); 
        alert("⚠️ Error processing Bulk PDF."); 
      }
    };
    
    window.addEventListener('bulk-download', handleBulkDownload);
    return () => window.removeEventListener('bulk-download', handleBulkDownload);
  }, [store.selectedBills]);
  const generateFileName = (ext: string) => `Rest_Bill_${store.receiptNo}_${store.date}.${ext}`;

  const downloadPNG = async () => {
    if (!printRef.current) return;
    const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
    const link = document.createElement('a'); link.download = generateFileName('png'); link.href = dataUrl; link.click();
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    const exactWidth = printRef.current.offsetWidth;
    const exactHeight = printRef.current.offsetHeight;
    const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
    const pdf = new jsPDF({ format: [exactWidth, exactHeight], unit: 'px' });
    pdf.addImage(dataUrl, 'PNG', 0, 0, exactWidth, exactHeight);
    pdf.save(generateFileName('pdf'));
  };

  const shareFile = async (type: 'png' | 'pdf') => {
    if (!printRef.current) return;
    setShowShareMenu(false);
    try {
      let file: File; const fileName = generateFileName(type);
      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
      if (type === 'png') {
        const blob = await (await fetch(dataUrl)).blob(); file = new File([blob], fileName, { type: 'image/png' });
      } else {
        const exactWidth = printRef.current.offsetWidth; const exactHeight = printRef.current.offsetHeight;
        const pdf = new jsPDF({ format: [exactWidth, exactHeight], unit: 'px' });
        pdf.addImage(dataUrl, 'PNG', 0, 0, exactWidth, exactHeight);
        const pdfBlob = pdf.output('blob'); file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      }
      if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ title: `Restaurant Receipt`, text: `Bill from ${store.businessName}`, files: [file] });
      else { alert("Browser does not support sharing."); type === 'png' ? downloadPNG() : downloadPDF(); }
    } catch (error) { console.error(error); }
  };

  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      const exactWidth = printRef.current.offsetWidth;
      const exactHeight = printRef.current.offsetHeight;
      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
      document.body.appendChild(iframe);
      const iframeWindow = iframe.contentWindow || iframe.contentDocument?.defaultView;
      if (!iframeWindow) return;
      iframeWindow.document.open();
      iframeWindow.document.write(`<html><head><style>body, html { margin: 0; padding: 0; display: flex; justify-content: flex-start; align-items: flex-start; background: white; } img { width: ${exactWidth}px; height: ${exactHeight}px; display: block; image-rendering: crisp-edges; } @page { margin: 0; size: ${exactWidth}px ${exactHeight}px; } </style></head><body><img src="${dataUrl}" /><script>window.onload = function() { setTimeout(() => { window.focus(); window.print(); }, 300); };</script></body></html>`);
      iframeWindow.document.close();
      setTimeout(() => document.body.removeChild(iframe), 5000);
    } catch (err) { console.error("Print Error: ", err); }
  };

  const DashedLine = () => <div style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', letterSpacing: '-1px', margin: '4px 0', borderBottom: '1px dashed #000' }}></div>;
  const SolidLine = () => <div style={{ width: '100%', margin: '4px 0', borderBottom: '1px solid #000' }}></div>;
  const AsteriskLine = () => <div style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', letterSpacing: '1px', margin: '4px 0' }}>************************************************</div>;

  const renderTemplate = (data: any = store) => {
    const t = data.selectedTemplate;
    const logoImg = data.showLogo && data.logo ? <img src={data.logo} style={{ height: '70px', maxWidth: '100%', margin: '0 auto 8px auto', display: 'block', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'grayscale(100%)' }} alt="logo" /> : null;
    const wmImg = data.showWatermark && data.watermark ? <img src={data.watermark} style={{ height: '70px', maxWidth: '100%', margin: '10px auto 0 auto', display: 'block', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'grayscale(100%)' }} alt="qr" /> : null;

    const subtotal = data.items.reduce((acc: number, item: any) => acc + (item.amt || 0), 0);
    const discount = data.discountType === 'FLAT' ? data.discountValue : (subtotal * data.discountValue) / 100;
    const subAfterDisc = subtotal - discount;
    const serviceChargeAmt = data.hasServiceCharge ? (subAfterDisc * data.serviceChargeRate) / 100 : 0;
    
    // 🟢 BUG FIX: Tax only on Food + Packaging. Service Charge excluded.
    const taxableAmt = subAfterDisc + Number(data.packagingCharge || 0);
    const cgstAmt = data.hasTax ? (taxableAmt * data.cgstRate) / 100 : 0;
    const sgstAmt = data.hasTax ? (taxableAmt * data.sgstRate) / 100 : 0;
    const grandTotal = taxableAmt + serviceChargeAmt + cgstAmt + sgstAmt;

    const fmtDate = data.date ? data.date.split('-').reverse().join('/') : '';
    const payStr = data.paymentMode === 'SPLIT' ? `CASH: ₹${data.splitCash} | UPI: ₹${data.splitOnline}` : data.paymentMode;

    switch (t) {
      case 1: 
        return (
          <div style={{ width: '100%', lineHeight: '1.4', color: '#000', textTransform: 'uppercase' }}>
            {logoImg}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{data.businessName}</div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>{data.address}</div>
              {data.phone && <div>PH: {data.phone}</div>}
              {data.fssaiNo && <div>FSSAI: {data.fssaiNo}</div>}
              <div style={{ fontWeight: 'bold', marginTop: '4px' }}>TAX INVOICE</div>
            </div>
            <DashedLine />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bill No: {data.receiptNo}</span><span>{fmtDate} {data.time}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Table: {data.tableNo}</span><span>Pax: {data.pax}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Waiter: {data.waiterName}</span><span>Type: {data.orderType}</span></div>
            {data.customerName && data.customerName !== 'Walk-in Guest' && <div>Cust: {data.customerName} {data.customerPhone}</div>}
            <DashedLine />
            <div style={{ display: 'flex', fontWeight: 'bold' }}><span style={{ width: '50%' }}>Item</span><span style={{ width: '15%', textAlign: 'center' }}>Qty</span><span style={{ width: '15%', textAlign: 'right' }}>Rate</span><span style={{ width: '20%', textAlign: 'right' }}>Amt</span></div>
            <SolidLine />
            {data.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', marginBottom: '2px' }}><span style={{ width: '50%', overflow: 'hidden' }}>{item.name}</span><span style={{ width: '15%', textAlign: 'center' }}>{item.qty}</span><span style={{ width: '15%', textAlign: 'right' }}>{item.rate}</span><span style={{ width: '20%', textAlign: 'right' }}>{item.amt?.toFixed(2)}</span></div>
            ))}
            <SolidLine />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sub Total</span><span>{subtotal.toFixed(2)}</span></div>
            {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount ({data.discountType === 'PERCENT' ? `${data.discountValue}%` : 'Flat'})</span><span>-{discount.toFixed(2)}</span></div>}
            {data.packagingCharge > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Packaging</span><span>{Number(data.packagingCharge).toFixed(2)}</span></div>}
            {data.hasServiceCharge && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Svc Charge ({data.serviceChargeRate}%)</span><span>{serviceChargeAmt.toFixed(2)}</span></div>}
            {data.hasTax && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}><span>CGST @ {data.cgstRate}%</span><span>{cgstAmt.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}><span>SGST @ {data.sgstRate}%</span><span>{sgstAmt.toFixed(2)}</span></div>
              </>
            )}
            <DashedLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em' }}><span>GRAND TOTAL</span><span>Rs. {grandTotal.toFixed(2)}</span></div>
            <DashedLine />
            <div style={{ textAlign: 'center' }}><div>Paid By: {payStr}</div><div style={{ marginTop: '8px', fontStyle: 'italic' }}>{data.slogan}</div></div>
            {wmImg}
          </div>
        );
      case 2: 
        return (
          <div style={{ width: '100%', lineHeight: '1.4', color: '#000' }}>
            {logoImg}
            <div style={{ fontWeight: 'bold', fontSize: '1.2em', textTransform: 'uppercase' }}>{data.businessName}</div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em', textTransform: 'uppercase' }}>{data.address}</div>
            {data.phone && <div>Tel: {data.phone}</div>}
            {data.fssaiNo && <div>FSSAI: {data.fssaiNo}</div>}
            <br/>
            <div style={{ fontWeight: 'bold', fontSize: '1.1em', background: '#000', color: '#fff', display: 'inline-block', padding: '2px 6px', textTransform: 'uppercase' }}>{data.orderType}</div>
            <div style={{ marginTop: '4px' }}>Date: {fmtDate} {data.time}</div>
            <div style={{ textTransform: 'uppercase' }}>Order No: {data.receiptNo}</div>
            {data.customerName && data.customerName !== 'Walk-in Guest' && <div style={{ textTransform: 'uppercase' }}>Cust: {data.customerName}</div>}
            <SolidLine />
            <div style={{ display: 'flex', fontWeight: 'bold', textTransform: 'uppercase' }}><span style={{ width: '60%' }}>Item</span><span style={{ width: '20%', textAlign: 'center' }}>Qty</span><span style={{ width: '20%', textAlign: 'right' }}>Total</span></div>
            <SolidLine />
            {data.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', marginBottom: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}><span style={{ width: '60%', overflow: 'hidden' }}>{item.name}</span><span style={{ width: '20%', textAlign: 'center' }}>{item.qty}</span><span style={{ width: '20%', textAlign: 'right' }}>{item.amt?.toFixed(2)}</span></div>
            ))}
            <SolidLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase' }}><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
            {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase' }}><span>Discount</span><span>-{discount.toFixed(2)}</span></div>}
            {data.hasServiceCharge && <div style={{ display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase' }}><span>Svc Charge</span><span>{serviceChargeAmt.toFixed(2)}</span></div>}
            {data.hasTax && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', textTransform: 'uppercase' }}><span>Taxes (CGST+SGST)</span><span>{(cgstAmt+sgstAmt).toFixed(2)}</span></div>}
            {data.packagingCharge > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase' }}><span>Extras</span><span>{Number(data.packagingCharge).toFixed(2)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.3em', marginTop: '4px', textTransform: 'uppercase' }}><span>Total</span><span>₹ {grandTotal.toFixed(2)}</span></div>
            <br/>
            <div style={{ textTransform: 'uppercase' }}>Payment: {payStr}</div>
            <div style={{ marginTop: '8px', textAlign: 'center', fontWeight: 'bold' }}>{data.slogan}</div>
            {wmImg}
          </div>
        );
      case 3: 
        return (
          <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.25', color: '#000' }}>
            {logoImg}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1em' }}>{data.businessName}</div>
            <div style={{ textAlign: 'center', whiteSpace: 'pre-wrap' }}>{data.address}</div>
            <DashedLine />
            <div>BILL NO: {data.receiptNo}</div>
            <div>DATE: {fmtDate} {data.time}</div>
            <DashedLine />
            <div style={{ display: 'flex', fontWeight: 'bold' }}><span style={{ width: '60%' }}>PARTICULARS</span><span style={{ width: '20%', textAlign: 'center' }}>QTY</span><span style={{ width: '20%', textAlign: 'right' }}>AMT</span></div>
            <DashedLine />
            {data.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex' }}><span style={{ width: '60%' }}>{item.name}</span><span style={{ width: '20%', textAlign: 'center' }}>{item.qty}</span><span style={{ width: '20%', textAlign: 'right' }}>{item.amt?.toFixed(0)}</span></div>
            ))}
            <DashedLine />
            {data.hasServiceCharge && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SVC CHARGE</span><span>{serviceChargeAmt.toFixed(0)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>TOTAL AMOUNT</span><span>RS. {grandTotal.toFixed(0)}</span></div>
            <DashedLine />
            <div style={{ textAlign: 'center', marginTop: '8px' }}>{data.slogan}</div>
          </div>
        );
      case 4: 
        return (
          <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.3', color: '#000' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.5em', border: '2px solid #000', padding: '4px', marginBottom: '8px' }}>ORDER ID: {data.orderId || 'DEL-001'}</div>
            {logoImg}
            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{data.businessName}</div>
            <div style={{ textAlign: 'center', whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>{data.address}</div>
            {data.fssaiNo && <div style={{ textAlign: 'center' }}>FSSAI: {data.fssaiNo}</div>}
            <br/>
            <div>Date: {fmtDate} {data.time}</div>
            {data.customerName && <div>Customer: {data.customerName}</div>}
            {data.customerPhone && <div>Phone: {data.customerPhone}</div>}
            <DashedLine />
            <div style={{ display: 'flex', fontWeight: 'bold' }}><span style={{ width: '15%' }}>Qty</span><span style={{ width: '65%' }}>Item</span><span style={{ width: '20%', textAlign: 'right' }}>Price</span></div>
            <DashedLine />
            {data.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', marginBottom: '2px' }}><span style={{ width: '15%' }}>{item.qty} x</span><span style={{ width: '65%' }}>{item.name}</span><span style={{ width: '20%', textAlign: 'right' }}>{item.amt?.toFixed(2)}</span></div>
            ))}
            <DashedLine />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Item Total</span><span>{subtotal.toFixed(2)}</span></div>
            {data.packagingCharge > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Packing Charges</span><span>{Number(data.packagingCharge).toFixed(2)}</span></div>}
            {data.hasServiceCharge && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Service Charge</span><span>{serviceChargeAmt.toFixed(2)}</span></div>}
            {data.hasTax && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Taxes</span><span>{(cgstAmt+sgstAmt).toFixed(2)}</span></div>}
            <DashedLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em' }}><span>Bill Total</span><span>Rs. {grandTotal.toFixed(2)}</span></div>
            <br/>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1em', background: '#000', color: '#fff', padding: '4px' }}>PAID ONLINE</div>
          </div>
        );
      case 5: 
        return (
          <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.4', color: '#000' }}>
            {logoImg}
            <div style={{ textAlign: 'center', fontSize: '1.3em', fontWeight: '900', letterSpacing: '2px' }}>{data.businessName}</div>
            <div style={{ textAlign: 'center', fontSize: '0.8em', marginBottom: '8px' }}>{data.address}</div>
            <SolidLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>TBL: {data.tableNo}</span><span>PAX: {data.pax}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>INV: {data.receiptNo}</span><span>HOST: {data.waiterName}</span></div>
            <SolidLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em' }}><span>{fmtDate}</span><span>{data.time}</span></div>
            <AsteriskLine />
            {data.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ width: '70%', fontWeight: 'bold' }}>{item.qty} x {item.name}</span><span style={{ width: '30%', textAlign: 'right' }}>{item.amt?.toFixed(2)}</span>
              </div>
            ))}
            <AsteriskLine />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Amount</span><span>{subtotal.toFixed(2)}</span></div>
            {data.hasServiceCharge && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Svc Chg ({data.serviceChargeRate}%)</span><span>{serviceChargeAmt.toFixed(2)}</span></div>}
            {data.hasTax && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VAT/GST</span><span>{(cgstAmt+sgstAmt).toFixed(2)}</span></div>}
            <SolidLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.4em' }}><span>NET PAY</span><span>₹{grandTotal.toFixed(2)}</span></div>
            <SolidLine />
            <div style={{ textAlign: 'center', fontSize: '0.8em', fontWeight: 'bold' }}>{payStr}</div>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>{data.slogan}</div>
            {wmImg}
          </div>
        );
      case 6: 
        return (
          <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.3', color: '#000' }}>
            <div style={{ textAlign: 'center', fontSize: '0.9em' }}>TOKEN NO.</div>
            <div style={{ textAlign: 'center', fontSize: '3em', fontWeight: '900', borderBottom: '2px solid #000', marginBottom: '8px', lineHeight: '1' }}>{data.orderId || Math.floor(Math.random()*100)}</div>
            {logoImg}
            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{data.businessName}</div>
            <div style={{ textAlign: 'center', fontSize: '0.8em' }}>{data.address}</div>
            <DashedLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}><span>{fmtDate} {data.time}</span><span>Bill: {data.receiptNo}</span></div>
            <DashedLine />
            {data.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span style={{ width: '15%' }}>{item.qty}x</span><span style={{ width: '60%' }}>{item.name}</span><span style={{ width: '25%', textAlign: 'right' }}>{item.amt?.toFixed(2)}</span>
              </div>
            ))}
            <DashedLine />
            {data.hasServiceCharge && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SVC CHARGE</span><span>{serviceChargeAmt.toFixed(2)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em' }}><span>TOTAL</span><span>₹{grandTotal.toFixed(2)}</span></div>
            <div style={{ textAlign: 'center', fontSize: '0.8em', marginTop: '4px' }}>PAID BY {payStr}</div>
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.9em' }}>{data.slogan}</div>
          </div>
        );
      case 7: 
        return (
          <div style={{ width: '100%', lineHeight: '1.4', color: '#000' }}>
            {logoImg}
            <div style={{ textAlign: 'center', fontFamily: "'Georgia', serif", fontSize: '1.4em', fontWeight: 'bold', fontStyle: 'italic' }}>{data.businessName}</div>
            <div style={{ textAlign: 'center', fontSize: '0.85em' }}>{data.address}</div>
            <div style={{ textAlign: 'center', fontSize: '0.85em' }}>Ph: {data.phone}</div>
            <SolidLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}><span>Inv: {data.receiptNo}</span><span>{fmtDate} {data.time}</span></div>
            {data.customerName && data.customerName !== 'Walk-in Guest' && <div style={{ fontSize: '0.9em' }}>Name: {data.customerName}</div>}
            <SolidLine />
            <div style={{ display: 'flex', fontWeight: 'bold', fontSize: '0.9em' }}><span style={{ width: '50%' }}>Description</span><span style={{ width: '20%', textAlign: 'center' }}>Qty</span><span style={{ width: '30%', textAlign: 'right' }}>Amount</span></div>
            <SolidLine />
            {data.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', fontSize: '0.95em' }}><span style={{ width: '50%', overflow: 'hidden' }}>{item.name}</span><span style={{ width: '20%', textAlign: 'center' }}>{item.qty}</span><span style={{ width: '30%', textAlign: 'right' }}>{item.amt?.toFixed(2)}</span></div>
            ))}
            <SolidLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95em' }}><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
            {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95em' }}><span>Discount</span><span>-{discount.toFixed(2)}</span></div>}
            {data.hasServiceCharge && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95em' }}><span>Service Charge</span><span>{serviceChargeAmt.toFixed(2)}</span></div>}
            {data.hasTax && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95em' }}><span>GST</span><span>{(cgstAmt+sgstAmt).toFixed(2)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em', marginTop: '4px' }}><span>Net Amount</span><span>₹{grandTotal.toFixed(2)}</span></div>
            <div style={{ textAlign: 'center', marginTop: '10px', fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>{data.slogan}</div>
            {wmImg}
          </div>
        );
      case 8: 
        return (
          <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.3', color: '#000', border: '1px solid #000', padding: '4px' }}>
            {logoImg}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1em', background: '#000', color: '#fff' }}>{data.businessName}</div>
            <div style={{ textAlign: 'center', fontSize: '0.85em', marginTop: '4px' }}>{data.address}</div>
            <div style={{ textAlign: 'center', fontSize: '0.85em' }}>FSSAI: {data.fssaiNo}</div>
            <div style={{ borderBottom: '1px solid #000', margin: '4px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}><span>BILL: {data.receiptNo}</span><span>DT: {fmtDate}</span></div>
            <div style={{ borderBottom: '1px solid #000', margin: '4px 0' }}></div>
            <div style={{ display: 'flex', fontWeight: 'bold' }}><span style={{ width: '15%' }}>QTY</span><span style={{ width: '60%' }}>ITEM</span><span style={{ width: '25%', textAlign: 'right' }}>AMT</span></div>
            <div style={{ borderBottom: '1px solid #000', margin: '4px 0' }}></div>
            {data.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', marginBottom: '2px', fontWeight: 'bold' }}><span style={{ width: '15%' }}>{item.qty}</span><span style={{ width: '60%', overflow: 'hidden' }}>{item.name}</span><span style={{ width: '25%', textAlign: 'right' }}>{item.amt?.toFixed(2)}</span></div>
            ))}
            <div style={{ borderBottom: '1px solid #000', margin: '4px 0' }}></div>
            {data.hasServiceCharge && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SVC CHARGE</span><span>{serviceChargeAmt.toFixed(2)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1em' }}><span>TOTAL</span><span>RS. {grandTotal.toFixed(2)}</span></div>
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.85em' }}>PAID: {payStr}</div>
            <div style={{ textAlign: 'center', marginTop: '4px', fontWeight: 'bold' }}>{data.slogan}</div>
          </div>
        );
      case 9: 
        return (
          <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.4', color: '#000' }}>
            {logoImg}
            <div style={{ textAlign: 'center', fontSize: '1.2em', fontWeight: 'bold' }}>{data.businessName}</div>
            <div style={{ textAlign: 'center', letterSpacing: '1px' }}>UNLIMITED BUFFET</div>
            <DashedLine />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Inv: {data.receiptNo}</span><span>{fmtDate} {data.time}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Table: {data.tableNo}</span><span>Adults/Pax: {data.pax}</span></div>
            <DashedLine />
            <div style={{ display: 'flex', fontWeight: 'bold' }}><span style={{ width: '50%' }}>Package</span><span style={{ width: '15%' }}>Pax</span><span style={{ width: '35%', textAlign: 'right' }}>Amount</span></div>
            <SolidLine />
            {data.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex' }}><span style={{ width: '50%' }}>{item.name}</span><span style={{ width: '15%' }}>{item.qty}</span><span style={{ width: '35%', textAlign: 'right' }}>{item.amt?.toFixed(2)}</span></div>
            ))}
            <SolidLine />
            {data.hasServiceCharge && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Svc Chg ({data.serviceChargeRate}%)</span><span>{serviceChargeAmt.toFixed(2)}</span></div>}
            {data.hasTax && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST</span><span>{(cgstAmt+sgstAmt).toFixed(2)}</span></div>}
            <DashedLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.3em' }}><span>GRAND TOTAL</span><span>₹{grandTotal.toFixed(2)}</span></div>
            <DashedLine />
            <div style={{ textAlign: 'center' }}>{data.slogan}</div>
            {wmImg}
          </div>
        );
      case 10: 
        return (
          <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.3', color: '#000', fontFamily: "'Courier New', monospace" }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.4em', border: '2px solid #000', padding: '4px', marginBottom: '8px' }}>#{data.orderId || 'CK-001'}</div>
            {logoImg}
            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{data.businessName} (CLOUD KITCHEN)</div>
            <div style={{ textAlign: 'center', fontSize: '0.8em' }}>{data.address}</div>
            <SolidLine />
            <div>Date: {fmtDate} {data.time}</div>
            <div>Order Type: {data.orderType}</div>
            <SolidLine />
            <div style={{ display: 'flex', fontWeight: 'bold' }}><span style={{ width: '15%' }}>Qty</span><span style={{ width: '65%' }}>Item</span><span style={{ width: '20%', textAlign: 'right' }}>Price</span></div>
            <DashedLine />
            {data.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', marginBottom: '2px' }}><span style={{ width: '15%' }}>{item.qty} x</span><span style={{ width: '65%' }}>{item.name}</span><span style={{ width: '20%', textAlign: 'right' }}>{item.amt?.toFixed(2)}</span></div>
            ))}
            <DashedLine />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Item Total</span><span>{subtotal.toFixed(2)}</span></div>
            {data.packagingCharge > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Packing Charges</span><span>{Number(data.packagingCharge).toFixed(2)}</span></div>}
            {data.hasServiceCharge && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Service Charge</span><span>{serviceChargeAmt.toFixed(2)}</span></div>}
            {data.hasTax && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Taxes</span><span>{(cgstAmt+sgstAmt).toFixed(2)}</span></div>}
            <SolidLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em' }}><span>Total</span><span>₹ {grandTotal.toFixed(2)}</span></div>
            <br/>
            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>* PREPARED HYGIENICALLY *</div>
          </div>
        );
      default: return null;
    }
  };

  const getPaperStyle = (data: any = store) => ({ fontFamily: data.receiptFont, fontSize: `${data.posFontSize}px`, lineHeight: '1.35', width: `${data.paperWidth}px`, color: '#000000' });
  const getPaperBgStyle = (data: any = store) => {
    if (data.paperMode === 'PRESET') return getPresetTextureCSS(data.selectedTexture || 3);
    if (data.paperMode === 'COLOR') return { backgroundColor: data.paperBackground || '#ffffff' };
    if (data.paperMode === 'CUSTOM' && data.customPaperBG) return { backgroundImage: `url(${data.customPaperBG})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    return { backgroundColor: '#ffffff' };
  };

  if (!isMounted) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-2 md:p-4 no-print">
        <div className="w-full flex flex-col items-center">
          
          <div className="flex justify-between items-center w-full max-w-[400px] mx-auto mb-6 bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800">
            <button onClick={() => window.history.back()} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition active:scale-95"><ArrowLeft size={16} /> Back</button>
            <div className="flex gap-2 relative">
              <button onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-1.5 bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-md"><Share2 size={16} /> Share</button>
              {showShareMenu && (
                <div className="absolute top-10 right-[120px] bg-white border border-slate-200 shadow-xl rounded-lg w-40 py-2 z-50">
                  <button onClick={() => shareFile('pdf')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700"><FileText size={16} className="text-red-500" /> As PDF</button>
                  <button onClick={() => shareFile('png')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700"><ImageIcon size={16} className="text-indigo-500" /> As Image</button>
                </div>
              )}
              <button onClick={handlePrint} className="bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1.5 rounded-lg text-sm transition shadow-md"><Printer size={16} /></button>
              <button onClick={downloadPNG} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm transition shadow-md"><FileImage size={16} /></button>
              <button onClick={downloadPDF} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm transition shadow-md"><Download size={16} /></button>
            </div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 p-4 md:p-6 rounded-2xl w-full flex justify-center shadow-2xl overflow-auto min-h-[650px] max-w-[600px] mx-auto custom-scrollbar">
            <div ref={printRef} className="shadow-[0_25px_60px_rgba(0,0,0,0.5)] relative overflow-hidden" style={{ ...getPaperBgStyle(store), width: `${store.paperWidth}px` }}>
              <div className="relative px-5 py-6 mx-auto tracking-tight font-medium" style={getPaperStyle(store)}>
                {renderTemplate(store)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <div id="bulk-container" className="absolute top-[-9999px] left-[-9999px] flex gap-4 w-[210mm] opacity-0 print:opacity-100 z-[-10]">
        {store.billHistory.filter(b => store.selectedBills.includes(b.id)).map(bill => (
          <div key={bill.id} className="print-bill relative overflow-hidden bg-white border border-slate-100" style={{ ...getPaperBgStyle(bill), width: `${bill.paperWidth}px` }}>
             <div className="relative px-5 py-6 tracking-tight font-medium" style={getPaperStyle(bill)}>{renderTemplate(bill)}</div>
          </div>
        ))}
      </div> */}
      {/* 🟢 FIX: Removed w-[210mm] and added flex-col so bills render at 100% width before screenshot */}
      <div id="bulk-container" className="absolute top-[-9999px] left-[-9999px] flex flex-col gap-8 opacity-0 print:opacity-100 z-[-10]">
        {store.billHistory.filter(b => store.selectedBills.includes(b.id)).map(bill => (
          <div key={bill.id} className="print-bill relative overflow-hidden bg-white border border-slate-100 inline-block" style={{ ...getPaperBgStyle(bill), width: `${bill.paperWidth}px` }}>
             <div className="relative px-5 py-6 tracking-tight font-medium" style={getPaperStyle(bill)}>{renderTemplate(bill)}</div>
          </div>
        ))}
      </div>
    </>
  );
}