'use client';

import { useRef, useState, useEffect } from 'react';
import { useFuelStore } from '@/store/useFuelStore';
import { Download, FileImage, Printer, ArrowLeft, Share2, FileText, Image as ImageIcon, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

// ---------------------------------------------------------
// TEXTURES & CONSTANTS
// ---------------------------------------------------------
const textureThermalNoise = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;
const textureRecycled = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='f'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='%23e7e5e0'/%3E%3Crect width='100' height='100' filter='url(%23f)' opacity='0.3'/%3E%3C/svg%3E")`;

const getPresetTextureCSS = (index: number) => {
  switch (index) {
    case 1: return { backgroundImage: textureThermalNoise, backgroundColor: '#fdfcf8', backgroundSize: '200px 200px' };
    case 2: return { backgroundImage: textureRecycled, backgroundColor: '#e7e5e0', backgroundSize: '100px 100px' };
    case 3: return { backgroundImage: textureRecycled, backgroundColor: '#f4f4f5', backgroundSize: '150px 150px' };
    case 4: return { backgroundImage: textureThermalNoise, backgroundColor: '#f1f0da', backgroundSize: '100px 100px' };
    case 5: return { backgroundColor: '#ffffff' };
    default: return { backgroundColor: '#ffffff' };
  }
};

const fmtDate = (d?: string, format: string = 'DD/MM/YYYY') => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  if (format === 'DD/MM/YY') return `${day}/${m}/${y.slice(-2)}`;
  return `${day}/${m}/${y}`;
};

// ---------------------------------------------------------
// REUSABLE UI COMPONENTS (For Thermal Aesthetics)
// ---------------------------------------------------------
const DashedLine = () => (
  <div style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', letterSpacing: '-1px', margin: '6px 0', borderBottom: '1.5px dashed #000' }}></div>
);

const KeyValueRow = ({ label, value, labelWidth = '120px' }: { label: string, value: string | number | undefined, labelWidth?: string }) => {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
      <span style={{ flexBasis: labelWidth, flexShrink: 0, textAlign: 'left' }}>{label}</span>
      <span style={{ flexGrow: 1, textAlign: 'center' }}>:</span>
      <span style={{ flexBasis: '50%', flexGrow: 1, textAlign: 'right' }}>{value}</span>
    </div>
  );
};

const TableRow = ({ items, bold = false }: { items: (string|number|undefined)[], bold?: boolean }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: bold ? 'bold' : 'normal', marginBottom: '2px' }}>
    {items.map((item, idx) => (
      <span key={idx} style={{ flex: 1, textAlign: idx === 0 ? 'left' : 'right' }}>{item || ''}</span>
    ))}
  </div>
);

const LogoRender = ({ show, src }: { show: boolean, src?: string }) => {
  if (!show || !src) return null;
  return (
    <img src={src} style={{ height: '70px', maxWidth: '100%', margin: '0 auto 10px auto', display: 'block', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'grayscale(100%)' }} alt="Pump Logo" />
  );
};

// ---------------------------------------------------------
// TEMPLATE DICTIONARY
// ---------------------------------------------------------
const Templates: Record<number, React.FC<{ data: any }>> = {
  // 1: IndianOil
  1: ({ data }) => (
    <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.4', color: '#000' }}>
      <LogoRender show={data.showLogo} src={data.logo} />
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1em', marginBottom: '4px' }}>Welcomes You</div>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontWeight: 'bold' }}>{data.stationName}</div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{data.address}</div>
        {data.phone && <div>Tel. No. : {data.phone}</div>}
      </div>
      
      <KeyValueRow label="Receipt No." value={data.receiptNo} />
      <KeyValueRow label="FCC ID" value={data.fccId} />
      <KeyValueRow label="FIP No." value={data.fipNo} />
      <KeyValueRow label="Nozzle No." value={data.nozzleNo} />
      <KeyValueRow label="Product" value={data.product} />
      <DashedLine />
      
      <KeyValueRow label="Preset Type" value="Amount" />
      <KeyValueRow label="Rate(Rs/L)" value={data.rate?.toFixed(2)} />
      <KeyValueRow label="Volume(L)" value={data.volume?.toFixed(2)} />
      <KeyValueRow label="Amount(Rs)" value={data.amount?.toFixed(2)} />
      
      <DashedLine />
      <KeyValueRow label="Vehicle No" value={data.vehicleNo || 'NOT ENTERED'} />
      <KeyValueRow label="Mobile No" value={data.mobileNo || 'NOT ENTERED'} />
      <DashedLine />
      
      <KeyValueRow label="Date" value={fmtDate(data.date, 'DD/MM/YY')} />
      <KeyValueRow label="Time" value={data.time ? data.time.slice(0, 5) : undefined} />
      <KeyValueRow label="VAT No" value={data.vatNo || data.gstin} />
      <KeyValueRow label="Attendant ID" value={data.attendantId} />
      
      <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>Thank You Please visit Again.n </div>
    </div>
  ),

  // 2: Bharat Petroleum
  2: ({ data }) => (
    <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.3', color: '#000' }}>
      <LogoRender show={data.showLogo} src={data.logo} />
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <div style={{ fontWeight: 'bold' }}> {data.stationName}</div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{data.address}</div>
        {data.phone && <div>PH {data.phone}</div>}
      </div>
      <DashedLine />
      
      <KeyValueRow label="INV NO." value={data.receiptNo} />
      <KeyValueRow label="RECEIPT" value="Physical Receipt" />
      <KeyValueRow label="VEH NO." value={data.vehicleNo} />
      <KeyValueRow label="MOB.No" value={data.mobileNo} />
      
      <KeyValueRow label="DATE" value={fmtDate(data.date)} labelWidth="80px" />
      <KeyValueRow label="TIME" value={data.time} labelWidth="80px" />
      <KeyValueRow label="NZ NO." value={data.nozzleNo} labelWidth="80px" />
      <KeyValueRow label="PRODUCT" value={data.product} labelWidth="80px" />
      <KeyValueRow label="RATE" value={`RS.${data.rate?.toFixed(2)}`} labelWidth="80px" />
      <DashedLine />
      
      <KeyValueRow label="AMOUNT" value={`RS.${data.amount?.toFixed(2)}`} labelWidth="80px" />
      <KeyValueRow label="VOLUME" value={`${data.volume?.toFixed(2)}L`} labelWidth="80px" />
      <DashedLine />
      <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>THANK YOU PLEASE VISIT AGAIN</div>
    </div>
  ),

  // 3: HP Gas
  3: ({ data }) => (
    <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.25', color: '#000' }}>
      <LogoRender show={data.showLogo} src={data.logo} />
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.05em' }}>{data.stationName}</div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{data.address}</div>
        {data.phone && <div>PH.NO-{data.phone}</div>}
        {data.gstin && <div>GSTIN-{data.gstin}</div>}
      </div>
      
      <KeyValueRow label="Bill No" value={data.receiptNo} />
      <KeyValueRow label="Trns.ID" value={data.txnId} />
      <KeyValueRow label="Atnd.ID" value={data.attendantId} />
      <KeyValueRow label="Vehi.No" value={data.vehicleNo} />
      <KeyValueRow label="Mob.No" value={data.mobileNo} />
      
      <KeyValueRow label="Date" value={fmtDate(data.date)} />
      <KeyValueRow label="Time" value={data.time} />
      <KeyValueRow label="FP. ID" value={data.fpId} />
      <KeyValueRow label="Nozl No" value={data.nozzleNo} />
      <KeyValueRow label="Fuel" value={data.product} />
      <KeyValueRow label="Density" value={data.density ? `${data.density}KG/M3` : undefined} />
      <KeyValueRow label="Rate" value={data.rate ? `RS.${data.rate.toFixed(2)}` : undefined} />
      <KeyValueRow label="Volume" value={data.volume ? `${data.volume.toFixed(2)}L` : undefined} />
      <KeyValueRow label="Sale" value={data.amount ? `RS.${data.amount.toFixed(2)}` : undefined} />
      
      <div style={{ marginTop: '12px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.05em' }}>THANK YOU</div>
    </div>
  ),

  // 4: JioBP / Reliance
  4: ({ data }) => (
    <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.3', color: '#000' }}>
      <LogoRender show={data.showLogo} src={data.logo} />
      <div style={{ textAlign: 'center', marginTop: '4px' }}>
        <div style={{ fontWeight: 'bold' }}>{data.stationName}</div>
        <div>Dealer of Reliance BP Mobility Limited</div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{data.address}</div>
        {data.phone && <div>PH:{data.phone}</div>}
        <br />
        {data.roId && <div style={{ fontWeight: 'bold' }}>RO ID: {data.roId} {data.roCode && `/ RO Code: ${data.roCode}`}</div>}
        <div style={{ fontWeight: 'bold' }}>RETAIL INVOICE - Original</div>
        <br />
        <div>Customer Copy</div>
      </div>
      <br />
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Date : {fmtDate(data.date)}</span>
        <span>{data.time}</span>
      </div>
      <div>Inv : {data.receiptNo}</div>
      <div>Vehicle No : {data.vehicleNo}</div>
      <div>Mobile No : {data.mobileNo}</div>
      
      <DashedLine />
      <TableRow items={['Product', 'Qty', 'Rate-Rs', 'Amount-Rs']} bold={true} />
      <TableRow items={[data.product, data.volume?.toFixed(2), data.rate?.toFixed(2), data.amount?.toFixed(2)]} />
      <DashedLine />
      
      <KeyValueRow label="Total Invoice Amount" value={`Rs.${data.amount?.toFixed(2)}`} />
      <KeyValueRow label="Method Of Payment" value={data.paymentMode || 'CASH'} />
      <KeyValueRow label="Amount Tendered" value={`Rs.${data.amount?.toFixed(2)}`} />
      
      {data.mobileNo && <div>Loyalty Card/Mob : {data.mobileNo}</div>}
      <div>Jio-bp 4ever Smile(s) : {Math.floor(10 + Math.random() * 90)}</div>
      <br />
      
      {data.rslNo && <div>RSL NO : {data.rslNo}</div>}
      {data.tinNo && <div>TIN NO : {data.tinNo}</div>}
      {data.gstin && <div>GST no: {data.gstin}</div>}
      
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <div>Resale to tax paid goods</div>
        <div>For any feedback and query</div>
        <div>Contact : {data.jioContact || data.phone}</div>
        <div style={{ fontWeight: 'bold', marginTop: '4px' }}>Jio-bp wishes you a safe journey</div>
      </div>
    </div>
  )
};

// ---------------------------------------------------------
// MAIN EXPORT
// ---------------------------------------------------------
export function FuelPreview() {
  const store = useFuelStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [zoomScale, setZoomScale] = useState('FIT');
  const [paperView, setPaperView] = useState('80mm');

  useEffect(() => { setIsMounted(true); }, []);

  // 🟢 BULK DOWNLOAD HANDLER (Fixed with hidden DOM class)
  useEffect(() => {
    const handleBulkDownload = async () => {
      const elements = document.querySelectorAll('.print-bill');
      if (elements.length === 0) {
        alert("⚠️ No bills found to download. Please select bills in Memory Manager.");
        return;
      }

      try {
        const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
        const margin = 10;
        let currentX = margin;
        let currentY = margin;
        const a4Width = 210;
        const a4Height = 297;
        let maxRowHeight = 0;

        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          const dataUrl = await toPng(el, { backgroundColor: '#ffffff', pixelRatio: 2 });
          
          const pxToMm = 0.264583; 
          const imgWidth = el.offsetWidth * pxToMm;
          const imgHeight = el.offsetHeight * pxToMm;

          if (currentX + imgWidth > a4Width - margin) {
            currentX = margin;
            currentY += maxRowHeight + 5;
            maxRowHeight = 0;
          }

          if (currentY + imgHeight > a4Height - margin) {
            pdf.addPage();
            currentX = margin;
            currentY = margin;
            maxRowHeight = 0;
          }

          pdf.addImage(dataUrl, 'PNG', currentX, currentY, imgWidth, imgHeight);
          currentX += imgWidth + 8; 
          if (imgHeight > maxRowHeight) maxRowHeight = imgHeight;
        }
        
        pdf.save(`Bulk_Fuel_Bills_${new Date().getTime()}.pdf`);
        alert("✅ Bulk Download Complete!");
      } catch (err) {
        console.error(err);
        alert("⚠️ Error processing Bulk PDF.");
      }
    };

    window.addEventListener('bulk-download', handleBulkDownload);
    return () => window.removeEventListener('bulk-download', handleBulkDownload);
  }, [store.selectedBills]);

  const getFormatName = (id?: number) => { 
    switch(id) { case 1: return 'IndianOil'; case 2: return 'BharatPetroleum'; case 3: return 'HP_Gas'; case 4: return 'JioBP'; default: return 'Fuel'; } 
  };
  
  const generateFileName = (ext: string) => `${getFormatName(store.selectedTemplate)}_${store.date}.${ext}`;

  // 🟢 DOWNLOAD LOGIC
  const downloadPNG = async () => {
    if (!printRef.current) return;
    const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
    const link = document.createElement('a'); link.download = generateFileName('png'); link.href = dataUrl; link.click();
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
    const pdf = new jsPDF({ format: [printRef.current.offsetWidth, printRef.current.offsetHeight], unit: 'px' });
    pdf.addImage(dataUrl, 'PNG', 0, 0, printRef.current.offsetWidth, printRef.current.offsetHeight);
    pdf.save(generateFileName('pdf'));
  };

  const shareFile = async (type: 'png' | 'pdf') => {
    if (!printRef.current) return;
    setShowShareMenu(false);
    try {
      let file: File;
      const fileName = generateFileName(type);
      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
      if (type === 'png') {
        const blob = await (await fetch(dataUrl)).blob(); file = new File([blob], fileName, { type: 'image/png' });
      } else {
        const pdf = new jsPDF({ format: [printRef.current.offsetWidth, printRef.current.offsetHeight], unit: 'px' });
        pdf.addImage(dataUrl, 'PNG', 0, 0, printRef.current.offsetWidth, printRef.current.offsetHeight);
        const pdfBlob = pdf.output('blob'); file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      }
      if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ title: `Fuel Receipt`, text: `Receipt from ${store.stationName}`, files: [file] });
      else { alert("Browser does not support sharing."); type === 'png' ? downloadPNG() : downloadPDF(); }
    } catch (error) { console.error(error); }
  };

  // 🟢 AUTO-DETECT SPACE PRINT LOGIC (Dynamic Paper Size)
  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      const exactWidth = printRef.current.offsetWidth;
      const exactHeight = printRef.current.offsetHeight;

      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 4 });
      
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const iframeWindow = iframe.contentWindow || iframe.contentDocument?.defaultView;
      if (!iframeWindow) return;

      iframeWindow.document.open();
      iframeWindow.document.write(`
        <html>
          <head>
            <style>
              body, html { margin: 0; padding: 0; display: flex; justify-content: flex-start; align-items: flex-start; background: white; }
              img { width: ${exactWidth}px; height: ${exactHeight}px; display: block; image-rendering: auto; }
              @page { margin: 0; size: ${exactWidth}px ${exactHeight}px; } 
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.focus();
                  window.print();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      iframeWindow.document.close();

      setTimeout(() => { document.body.removeChild(iframe); }, 5000);
    } catch (err) {
      console.error("Print Error: ", err);
      alert("⚠️ Error preparing print.");
    }
  };

  const getPaperStyle = (data: any = store) => ({
    fontFamily: data.receiptFont || 'monospace', 
    fontSize: `${data.posFontSize}px`, 
    lineHeight: '1.35', 
    color: '#000000',
  });

  const getPaperBgStyle = (data: any = store) => {
    if (data.paperMode === 'PRESET') return getPresetTextureCSS(data.selectedTexture || 3);
    if (data.paperMode === 'COLOR') return { backgroundColor: data.paperBackground || '#ffffff' };
    if (data.paperMode === 'CUSTOM' && data.customPaperBG) {
      return { backgroundImage: `url(${data.customPaperBG})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { backgroundColor: '#ffffff' };
  };

  if (!isMounted) return null;

  const ActiveTemplate = Templates[store.selectedTemplate] || Templates[1];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
        }
      `}} />

      <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-2 md:p-4 no-print">
        
        {/* 🟢 ELITE ACTION BAR */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center bg-[#0b1120] text-white p-4 rounded-xl shadow-xl border border-slate-800 gap-4 mb-6">
          
          <div className="flex items-center gap-6">
            <button onClick={() => window.history.back()} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition active:scale-95">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="flex flex-col leading-tight font-black uppercase text-[#eab308] tracking-wide">
              <span>Live Active</span>
              <span>Canvas</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 items-end">
            <div className="flex gap-3 text-xs font-bold">
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 items-center">
                <span className="text-slate-500 px-2"><FileText size={12} /></span>
                {['80mm', 'A4', 'A3'].map(size => (
                  <button key={size} onClick={() => setPaperView(size)} className={`px-3 py-1.5 rounded-md transition ${paperView === size ? 'bg-[#eab308] text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                    {size}
                  </button>
                ))}
              </div>
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                {['FIT', '50%', '75%', '100%', '125%'].map(z => (
                  <button key={z} onClick={() => setZoomScale(z)} className={`px-3 py-1.5 rounded-md transition ${zoomScale === z ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                    {z}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-lg text-slate-300 transition shadow-md" title="Fullscreen"><Maximize size={18} /></button>
              
              <div className="relative">
                <button onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2.5 rounded-lg text-sm font-bold transition shadow-md">
                  <Share2 size={18} /> Share
                </button>
                {showShareMenu && (
                  <div className="absolute top-12 right-0 bg-white border border-slate-200 shadow-xl rounded-lg w-40 py-2 z-50">
                    <button onClick={() => shareFile('pdf')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-bold text-slate-700"><FileText size={16} className="text-red-500" /> As PDF</button>
                    <button onClick={() => shareFile('png')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-bold text-slate-700"><ImageIcon size={16} className="text-indigo-500" /> As Image</button>
                  </div>
                )}
              </div>

              <button onClick={handlePrint} className="bg-[#10b981] hover:bg-[#059669] p-2.5 rounded-lg text-white transition shadow-md" title="Print Bill"><Printer size={18} /></button>
              <button onClick={downloadPNG} className="bg-[#6366f1] hover:bg-[#4f46e5] p-2.5 rounded-lg text-white transition shadow-md" title="Download Image (PNG)"><FileImage size={18} /></button>
              <button onClick={downloadPDF} className="bg-slate-700 hover:bg-slate-600 p-2.5 rounded-lg text-white transition shadow-md" title="Download PDF"><Download size={18} /></button>
            </div>
          </div>
        </div>
        
        {/* 🟢 DYNAMIC CANVAS CONTAINER */}
        <div className="bg-slate-800 border border-slate-700 p-4 md:p-6 rounded-2xl w-full flex justify-center shadow-2xl overflow-auto min-h-[650px] custom-scrollbar relative">
          
          <div style={{ transform: zoomScale === 'FIT' ? 'scale(1)' : `scale(${parseInt(zoomScale)/100})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-in-out' }}>
            
            <div ref={printRef} className="shadow-[0_25px_60px_rgba(0,0,0,0.5)] relative overflow-hidden" style={{ ...getPaperBgStyle(store), width: paperView === '80mm' ? '300px' : (paperView === 'A4' ? '500px' : `${store.paperWidth}px`) }}>
              <div className="relative px-5 py-6 mx-auto tracking-tight font-medium" style={getPaperStyle(store)}>
                
                {store.showWatermark && store.watermark && (
                  <div className="absolute inset-0 pointer-events-none opacity-10" 
                       style={{ backgroundImage: `url(${store.watermark})`, backgroundSize: '150px', backgroundRepeat: 'repeat', filter: 'grayscale(100%)', mixBlendMode: 'multiply' }}>
                  </div>
                )}
                
                <ActiveTemplate data={store} />

              </div>
            </div>

          </div>
        </div>
        
        {/* 🟢 HIDDEN CONTAINER FOR BULK DOWNLOAD */}
        <div className="fixed top-[-10000px] left-[-10000px] opacity-0 pointer-events-none z-[-50]">
          {store.billHistory
            .filter((bill) => store.selectedBills.includes(bill.id))
            .map((billData) => {
              const HistoricTemplate = Templates[billData.selectedTemplate] || Templates[1];
              return (
                <div key={billData.id} className="print-bill shadow-none" style={{ ...getPaperBgStyle(billData), width: `${billData.paperWidth}px`, padding: '20px' }}>
                  <div className="relative mx-auto tracking-tight font-medium" style={getPaperStyle(billData)}>
                    {billData.showWatermark && billData.watermark && (
                      <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: `url(${billData.watermark})`, backgroundSize: '150px', backgroundRepeat: 'repeat', filter: 'grayscale(100%)', mixBlendMode: 'multiply' }}></div>
                    )}
                    <HistoricTemplate data={billData} />
                  </div>
                </div>
              );
          })}
        </div>

      </div>
    </>
  );
}