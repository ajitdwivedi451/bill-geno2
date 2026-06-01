'use client';

import { useRef, useState, useEffect } from 'react';
import { useFuelStore } from '@/store/useFuelStore';
import { Download, FileImage, Printer, ArrowLeft, Share2, FileText, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

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

export function FuelPreview() {
  const store = useFuelStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

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

  const fmtDate = (d?: string, format: string = 'DD/MM/YYYY') => {
    if(!d) return '';
    const [y, m, day] = d.split('-');
    if (format === 'DD/MM/YY') return `${day}/${m}/${y.slice(-2)}`;
    return `${day}/${m}/${y}`;
  };

  const getFormatName = (id?: number) => { switch(id) { case 1: return 'IndianOil'; case 2: return 'BharatPetroleum'; case 3: return 'HP_Gas'; case 4: return 'JioBP'; default: return 'Fuel'; } };
  const generateFileName = (ext: string) => `${getFormatName(store.selectedTemplate)}_${store.date}.${ext}`;

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
      // 1. Exact height aur width measure karna
      const exactWidth = printRef.current.offsetWidth;
      const exactHeight = printRef.current.offsetHeight;

      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
      
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
      // 2. CSS me @page rule ko bill ki exact size ke mutabiq set karna
      iframeWindow.document.write(`
        <html>
          <head>
            <style>
              body, html { margin: 0; padding: 0; display: flex; justify-content: flex-start; align-items: flex-start; background: white; }
              img { width: ${exactWidth}px; height: ${exactHeight}px; display: block; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; }
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

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 5000);

    } catch (err) {
      console.error("Print Error: ", err);
      alert("⚠️ Error preparing print.");
    }
  };

  const DashedLine = () => <div style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', letterSpacing: '-1px', margin: '4px 0', borderBottom: '1px dashed #000' }}></div>;
  const Line = ({ l, r }: { l: string, r: string|number }) => <div style={{ display: 'flex', marginBottom: '2px' }}><span style={{ width: '110px', display: 'inline-block', flexShrink: 0 }}>{l}</span><span>: {r}</span></div>;
  const IOCLLine = ({ l, r }: { l: string, r: string|number }) => <div style={{ display: 'flex', marginBottom: '2px' }}><span style={{ width: '140px', display: 'inline-block', flexShrink: 0 }}>{l}</span><span>: &nbsp;{r}</span></div>;

  const renderTemplate = (data: any = store) => {
    const t = data.selectedTemplate;
    const logoImg = data.showLogo && data.logo ? <img src={data.logo} style={{ height: '90px', maxWidth: '100%', margin: '0 auto 8px auto', display: 'block', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'grayscale(100%)' }} alt="logo" /> : null;

    switch (t) {
      case 1: 
        return (
          <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.4', color: '#000' }}>
            {logoImg}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2em', marginBottom: '4px', fontStyle: 'italic' }}>Welcomes You</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>{data.stationName}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{data.address}</div>
              {data.phone && <div>Tel. No. : {data.phone}</div>}
            </div>
            <br/>
            <IOCLLine l="Receipt No." r={data.receiptNo} />
            <IOCLLine l="FCC ID" r={data.fccId || '00000000000491205'} />
            <IOCLLine l="FIP No." r={data.fipNo || '04'} />
            <IOCLLine l="Nozzle No." r={data.nozzleNo || '04'} />
            <IOCLLine l="Product" r={data.product} />
            <br/>
            <IOCLLine l="Preset Type" r="Amount" />
            <IOCLLine l="Rate(Rs/L)" r={data.rate?.toFixed(2).padStart(8, '0')} />
            <IOCLLine l="Volume(L)" r={data.volume?.toFixed(2).padStart(8, '0')} />
            <IOCLLine l="Amount(Rs)" r={data.amount?.toFixed(2).padStart(8, '0')} />
            <IOCLLine l="Atot" r={data.atot || '00164873326.48'} />
            <IOCLLine l="Vtot" r={data.vtot || '0001830843.920'} />
            <br/>
            <div style={{ display: 'flex' }}><span style={{ width: '140px' }}>Vehicle No</span><span>: &nbsp;{data.vehicleNo || 'Not Entered'}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '140px' }}>Mobile No</span><span>: &nbsp;{data.mobileNo || 'Not Entered'}</span></div>
            <br/>
            <div style={{ display: 'flex' }}><span style={{ width: '140px' }}>Date</span><span>: &nbsp;{fmtDate(data.date, 'DD/MM/YY')}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '140px' }}>Time</span><span>: &nbsp;{data.time ? data.time.slice(0,5) : ''}</span></div>
            <br/>
            <div style={{ display: 'flex' }}><span style={{ width: '140px' }}>CST No</span><span>: &nbsp;{data.cstNo || ''}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '140px' }}>LST No</span><span>: &nbsp;{data.lstNo || ''}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '140px' }}>VAT No</span><span>: &nbsp;{data.vatNo || data.gstin || ''}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '140px' }}>ATTENDANT ID</span><span>: &nbsp;{data.attendantId || 'Not Available'}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '140px' }}>FCC DATE</span><span>: &nbsp;Not Available</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '140px' }}>FCC TIME</span><span>: &nbsp;Not Available</span></div>
          </div>
        );
      case 2: 
        return (
          <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.3', color: '#000' }}>
            {logoImg}
            <div style={{ fontWeight: 'bold' }}>M/S {data.stationName}</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{data.address}</div>
            {data.phone && <div>PH {data.phone}</div>}
            <DashedLine />
            <div>INV NO.:{data.receiptNo}</div>
            <div>RECEIPT:Physical Receipt</div>
            <div>VEH NO.:{data.vehicleNo}</div>
            <div>MOB.No :{data.mobileNo}</div>
            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>DATE</span><span>:{fmtDate(data.date)}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>TIME</span><span>:{data.time}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>NZ NO.</span><span>:{data.nozzleNo || '06'}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>PRODUCT</span><span>:{data.product}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>RATE</span><span>:RS.{data.rate?.toFixed(2)}</span></div>
            <DashedLine />
            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>AMOUNT</span><span>:RS.{data.amount?.toFixed(2)}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>VOLUME</span><span>:{data.volume?.toFixed(2)}L</span></div>
            <DashedLine />
          </div>
        );
      case 3: 
        return (
          <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.25', color: '#000' }}>
            {logoImg}
            <div style={{ fontWeight: 'bold', fontSize: '1.05em' }}>{data.stationName} HPCL</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{data.address}</div>
            {data.phone && <div>PH.NO-{data.phone}</div>}
            <div>GSTIN-{data.gstin}</div>
            <div>Bill No:{data.receiptNo}</div>
            <div>Trns.ID:{data.txnId}</div>
            <div>Atnd.ID:{data.attendantId || 'NotEntered'}</div>
            <div>Receipt:Physical Receipt</div>
            <div>Vehi.No:{data.vehicleNo}</div>
            <div>Mob.No :{data.mobileNo}</div>
            <Line l="Date" r={fmtDate(data.date)} />
            <Line l="Time" r={data.time} />
            <Line l="FP. ID" r={data.fpId || '2'} />
            <Line l="Nozl No" r={data.nozzleNo || '2'} />
            <Line l="Fuel" r={data.product} />
            <Line l="Density" r={`${data.density || '733.3'}KG/M3`} />
            <Line l="Preset" r={`RS.${data.amount?.toFixed(0)}`} />
            <Line l="Rate" r={`RS.${data.rate?.toFixed(2)}`} />
            <Line l="Sale" r={`RS.${data.amount?.toFixed(2)}`} />
            <Line l="Volume" r={`${data.volume?.toFixed(2)}L`} />
            <div style={{ marginTop: '12px', fontWeight: 'bold', letterSpacing: '0.05em' }}>THANK YOU</div>
          </div>
        );
      case 4: 
        return (
          <div style={{ width: '100%', textTransform: 'uppercase', lineHeight: '1.3', color: '#000' }}>
            {logoImg}
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <div style={{ fontWeight: 'bold' }}>{data.stationName}</div>
              <div>Dealer of Reliance BP Mobility Limited</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{data.address}</div>
              {data.phone && <div>PH:{data.phone}</div>}
              <br/>
              <div style={{ fontWeight: 'bold' }}>RO ID: {data.roId} / RO Code: {data.roCode}</div>
              <div style={{ fontWeight: 'bold' }}>RETAIL INVOICE - Original</div>
              <br/>
              <div>Customer Copy</div>
            </div>
            <br/>
            <div>Date : {fmtDate(data.date)} {data.time}</div>
            <div>Inv : {data.receiptNo}</div>
            <div>Vehicle No : {data.vehicleNo}</div>
            <div>Mobile No : {data.mobileNo}</div>
            <DashedLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.95em' }}>
              <span style={{ width: '25%' }}>Product</span>
              <span style={{ width: '15%', textAlign: 'right' }}>Qty</span>
              <span style={{ width: '15%', textAlign: 'right' }}>UoM</span>
              <span style={{ width: '20%', textAlign: 'right' }}>Rate-Rs</span>
              <span style={{ width: '25%', textAlign: 'right' }}>Amount-Rs</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
              <span style={{ width: '25%' }}>{data.product}</span>
              <span style={{ width: '15%', textAlign: 'right' }}>{data.volume?.toFixed(2)}</span>
              <span style={{ width: '15%', textAlign: 'right' }}>Litre</span>
              <span style={{ width: '20%', textAlign: 'right' }}>{data.rate?.toFixed(2)}</span>
              <span style={{ width: '25%', textAlign: 'right' }}>{data.amount?.toFixed(2)}</span>
            </div>
            <DashedLine />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Total Invoice Amount:</span><span>Rs.{data.amount?.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Method Of Payment :</span><span>{data.paymentMode}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Amount Tendered :</span><span>Rs.{data.amount?.toFixed(2)}</span></div>
            <div>Loyalty Card/Mob : {data.mobileNo && data.mobileNo !== 'Not Entered' ? data.mobileNo : ''}</div>
            <div>Jio-bp 4ever Smile(s) : {Math.floor(10 + Math.random() * 90)}</div>
            <br/>
            <div>RSL NO : {data.rslNo}</div>
            <div>TIN NO : {data.tinNo}</div>
            <div>GST no: {data.gstin}</div>
            <div>Resale to tax paid goods</div>
            <div>Authorised signatory</div>
            <div>For any feedback and query</div>
            <div>Contact : {data.jioContact || data.phone}</div>
            <div>Jio-bp wishes you a safe journey</div>
            <br/>
            <div>FP-5/DSM-20  {data.date ? new Date(data.date).toDateString() : ''} {data.time ? data.time.slice(0,5) : ''}</div>
          </div>
        );
      default: return null;
    }
  };

  const getPaperStyle = (data: any = store) => ({
    fontFamily: data.receiptFont, 
    fontSize: `${data.posFontSize}px`, 
    lineHeight: '1.35', 
    width: `${data.paperWidth}px`,
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

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
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
                {store.showWatermark && store.watermark && (
                  <>
                    <div className="absolute inset-y-0 left-0 flex flex-col justify-around overflow-hidden pointer-events-none opacity-40 w-6">{[1,2,3,4,5].map((i) => <img key={`wml-${i}`} src={store.watermark!} className="w-24 -rotate-90 origin-center mix-blend-multiply grayscale" alt="wm" />)}</div>
                    {store.watermarkPosition === 'BOTH' && <div className="absolute inset-y-0 right-0 flex flex-col justify-around overflow-hidden pointer-events-none opacity-40 w-6">{[1,2,3,4].map((i) => <img key={`wmr-${i}`} src={store.watermark!} className="w-24 -rotate-90 origin-center mix-blend-multiply grayscale" alt="wm" />)}</div>}
                  </>
                )}
                {renderTemplate(store)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}