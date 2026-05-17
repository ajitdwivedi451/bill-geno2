'use client';

import { useRef, useState } from 'react';
import { useFuelStore } from '@/store/useBillStore';
import { Download, FileImage, Share2, FileText, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

// --- 🟢 SEAMLESS SVG PAPER TEXTURES ---
const textureThermalNoise = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;
const textureRecycled = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='f'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='%23e7e5e0'/%3E%3Crect width='100' height='100' filter='url(%23f)' opacity='0.3'/%3E%3C/svg%3E")`;
const textureCrumpled = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ffffff' stop-opacity='0.2'/%3E%3Cstop offset='1' stop-color='%23000000' stop-opacity='0.03'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23f4f4f5'/%3E%3Cpath d='M0 100 Q100 0 200 100 T400 100 M0 200 Q100 300 200 200 T400 200 M0 300 Q100 200 200 300 T400 300' stroke='url(%23a)' stroke-width='2' fill='none' opacity='0.5'/%3E%3C/svg%3E")`;
const textureDirty = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f0da'/%3E%3Cfilter id='a'%3E%3CfeTurbulence baseFrequency='0.05' numOctaves='1'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)' opacity='0.2'/%3E%3C/svg%3E")`;
const textureGrid = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23e2e8f0' fill-opacity='0.5'/%3E%3C/svg%3E")`;

const getPresetTextureCSS = (index: number) => {
  switch (index) {
    case 1: return { backgroundImage: textureThermalNoise, backgroundColor: '#fdfcf8', backgroundSize: '200px 200px' };
    case 2: return { backgroundImage: textureRecycled, backgroundColor: '#e7e5e0', backgroundSize: '100px 100px' };
    case 3: return { backgroundImage: `${textureThermalNoise}, ${textureCrumpled}`, backgroundColor: '#f4f4f5', backgroundSize: '200px 200px, 400px 400px' }; 
    case 4: return { backgroundImage: textureDirty, backgroundColor: '#f1f0da', backgroundSize: '100px 100px' };
    case 5: return { backgroundImage: textureGrid, backgroundColor: '#ffffff', backgroundSize: '10px 10px' };
    default: return {};
  }
};

export default function FuelPreview() {
  const store = useFuelStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false); 

  const fmtDate = (d: string) => d ? d.split('-').reverse().join('/') : '';
  const rndTot = () => (store.amount * 1000 + 4234723.67).toFixed(2);
  const rndLtot = () => (store.volume * 1000 + 541193.05).toFixed(3);
  const curUoM = store.uom || 'Litre'; 

  const getBGColorForDownload = () => {
    if (store.paperMode === 'CUSTOM' || store.paperMode === 'PRESET') {
        if (store.paperMode === 'PRESET') return getPresetTextureCSS(store.selectedTexture).backgroundColor || '#ffffff';
        return '#ffffff';
    }
    return store.paperBackground; 
  }

  const downloadPNG = async () => {
    if (!printRef.current) return;
    const bgColor = getBGColorForDownload();
    const dataUrl = await toPng(printRef.current, { backgroundColor: bgColor, pixelRatio: 3 });
    const link = document.createElement('a'); link.download = `Fuel_Receipt_${store.receiptNo}.png`; link.href = dataUrl; link.click();
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    const bgColor = getBGColorForDownload();
    const dataUrl = await toPng(printRef.current, { backgroundColor: bgColor, pixelRatio: 3 });
    const pdf = new jsPDF({ format: [printRef.current.offsetWidth, printRef.current.offsetHeight], unit: 'px' });
    pdf.addImage(dataUrl, 'PNG', 0, 0, printRef.current.offsetWidth, printRef.current.offsetHeight); 
    pdf.save(`Fuel_Receipt_${store.receiptNo}.pdf`);
  };

  const shareFile = async (type: 'png' | 'pdf') => {
    if (!printRef.current) return;
    setShowShareMenu(false);
    try {
      let file: File;
      const fileName = `Fuel_Receipt_${store.receiptNo}.${type}`;
      const bgColor = getBGColorForDownload();
      const dataUrl = await toPng(printRef.current, { backgroundColor: bgColor, pixelRatio: 3 });
      
      if (type === 'png') {
        const blob = await (await fetch(dataUrl)).blob();
        file = new File([blob], fileName, { type: 'image/png' });
      } else {
        const pdf = new jsPDF({ format: [printRef.current.offsetWidth, printRef.current.offsetHeight], unit: 'px' });
        pdf.addImage(dataUrl, 'PNG', 0, 0, printRef.current.offsetWidth, printRef.current.offsetHeight);
        const pdfBlob = pdf.output('blob');
        file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      }

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `Receipt ${store.receiptNo}`, text: `Fuel receipt from ${store.stationName}.`, files: [file] });
      } else {
        alert("Browser doesn't support direct file sharing. Downloading instead.");
        type === 'png' ? downloadPNG() : downloadPDF();
      }
    } catch (error) { console.error("Error sharing:", error); }
  };

  const Watermarks = () => {
    if (!store.showWatermark || !store.watermark) return null;
    return (
      <>
        <div className="absolute inset-y-0 left-0 flex flex-col justify-around overflow-hidden pointer-events-none opacity-80" style={{ width: '25px' }}>
          {[1,2,3,4,5].map(i => <img key={`l${i}`} src={store.watermark!} className="w-28 -rotate-90 origin-center mix-blend-multiply" alt="wm" />)}
        </div>
        <div className="absolute inset-y-0 right-0 flex flex-col justify-around overflow-hidden pointer-events-none opacity-80" style={{ width: '25px' }}>
          {[1,2,3,4,5].map(i => <img key={`r${i}`} src={store.watermark!} className="w-28 -rotate-90 origin-center mix-blend-multiply" alt="wm" />)}
        </div>
      </>
    );
  };

  const paperStyle: any = {
    fontFamily: store.receiptFont,
    fontSize: `${store.posFontSize || 12}px`,
    lineHeight: '1.35',
    width: `${store.paperWidth}px`,
    minHeight: '600px',
    color: '#000000',
    backgroundRepeat: 'repeat',
    borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
  };

  if (store.paperMode === 'CUSTOM' && store.customPaperBG) {
    paperStyle.backgroundImage = `url(${store.customPaperBG})`;
    paperStyle.backgroundSize = 'cover';
    paperStyle.backgroundPosition = 'center';
    paperStyle.backgroundColor = '#ffffff'; 
  } else if (store.paperMode === 'PRESET') {
    const presetCSS = getPresetTextureCSS(store.selectedTexture);
    Object.assign(paperStyle, presetCSS);
  } else {
    paperStyle.backgroundColor = store.paperBackground;
    paperStyle.backgroundImage = textureThermalNoise;
    paperStyle.backgroundSize = '200px 200px';
  }

  // 🟢 Optimized LogoBlock to prevent full-page overflow
  const LogoBlock = () => {
    if (!store.showLogo || !store.logo) return null;
    return (
      <div className="mb-4 w-full flex justify-center max-h-32 overflow-hidden">
        <img 
          src={store.logo} 
          // Pure black ink effect with safe width constraints
          className="h-auto max-h-24 max-w-[80%] object-contain grayscale brightness-0 opacity-90" 
          alt="brand logo" 
        />
      </div>
    );
  };

  const Field = ({ label, val, pad = 12 }: { label: string, val: string|number, pad?: number }) => (
    <div className="flex"><span style={{ width: `${pad}ch`, display: 'inline-block' }}>{label}</span><span>: {val}</span></div>
  );

  const renderTemplate = () => {
    const t = store.selectedTemplate;
    const addressStyle = "whitespace-pre-wrap break-words w-full uppercase";
    const nameStyle = "uppercase font-bold break-words w-full";

    switch (t) {
      case 1:
        return (
          <div className={`relative overflow-hidden px-5 py-6 mx-auto tracking-tight font-medium`} style={paperStyle}>
            <Watermarks />
            <div className="relative z-10 w-full">
              <LogoBlock />
              <div className="text-center font-bold text-[1.1em] mb-2 tracking-wide">Welcomes You</div>
              <div className={nameStyle}>{store.stationName}</div>
              <div className={addressStyle}>{store.address}</div>
              {store.phone && <div className="mb-4">Tel. No.: {store.phone}</div>}
              {!store.phone && <div className="mb-4"></div>}

              <Field label="Receipt No." val={store.receiptNo} pad={13} />
              {store.roCode && <Field label="Local ID" val={store.roCode} pad={13} />}
              <Field label="FCC ID" val={store.fccId} pad={13} />
              <Field label="FIP No." val={store.fipNo} pad={13} />
              <Field label="Nozzle No." val={store.nozzleNo} pad={13} />
              <Field label="Product" val={store.product} pad={13} />
              {store.density && <Field label="Density" val={`${store.density}Kg/Cu.mtr`} pad={13} />}
              <div className="mb-4"></div>

              <Field label="Preset Type" val={store.presetType} pad={13} />
              <Field label={`Rate(Rs/${curUoM})`} val={store.rate.toFixed(2).padStart(8, ' ')} pad={13} />
              <Field label={`Volume(${curUoM})`} val={store.volume.toFixed(2).padStart(8, '0')} pad={13} />
              <Field label="Amount(Rs)" val={store.amount.toFixed(2).padStart(8, '0')} pad={13} />
              <div className="mb-2"></div>
              
              <Field label="Atot" val={rndTot()} pad={13} />
              <Field label="Vtot" val={rndLtot()} pad={13} />
              <div className="mb-4"></div>

              <Field label="Vehicle No" val={store.vehicleNo || 'Not Entered'} pad={13} />
              <Field label="Mobile No" val={store.mobileNo || 'Not Entered'} pad={13} />
              <div className="mb-4"></div>

              <div>Date : {fmtDate(store.date)} &nbsp; Time: {store.time}</div>
              <div className="mb-4"></div>

              {store.gstin && <Field label="VAT/GST No" val={store.gstin} pad={15} />}
              <Field label="ATTENDANT ID" val="Not Available" pad={15} />
              
              <div className="text-center mt-8 tracking-wide break-words w-full">Thank You! Please Visit Again..</div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={`relative overflow-hidden px-4 py-6 mx-auto tracking-tight font-medium`} style={paperStyle}>
            <Watermarks />
            <div className="relative z-10 w-full">
              <LogoBlock />
              <div className={`${nameStyle} mt-2`}>M/S {store.stationName}</div>
              <div className={addressStyle}>{store.address}</div>
              {store.phone && <div>PH {store.phone}</div>}
              
              <div className="my-2 border-t border-dashed border-black"></div>
              
              <div>INV NO.:{store.receiptNo}-ORGNL</div>
              <div>RECEIPT:Physical Receipt</div>
              {store.txnId && <div>TRNS.ID:{store.txnId}</div>}
              <div>VEH NO.:{store.vehicleNo || 'NotEntered'}</div>
              <div>DATE   :{fmtDate(store.date)}</div>
              <div>TIME   :{store.time}</div>
              <div>NZ NO. :{store.nozzleNo}</div>
              <div className="uppercase">PRODUCT:{store.product}</div>
              {store.density && <div>DENSITY:{store.density}kg/m3</div>}
              <div>RATE   :Rs.{store.rate.toFixed(2)}/{curUoM}</div>
              
              <div className="my-2 border-t border-dashed border-black"></div>
              
              <div className="font-bold text-[1.1em]">AMOUNT :Rs.{store.amount.toFixed(2)}</div>
              <div className="font-bold text-[1.1em]">VOLUME :{store.volume.toFixed(2)} {curUoM}</div>
              
              <div className="my-2 border-t border-dashed border-black"></div>
              {store.gstin && <div className="mt-2 break-words">GSTIN-{store.gstin}</div>}
              <div className="mt-6 uppercase text-center font-bold w-full break-words">THANK YOU</div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={`relative overflow-hidden px-5 py-6 mx-auto tracking-tight font-medium`} style={paperStyle}>
            <Watermarks />
            <div className="relative z-10 w-full">
              <LogoBlock />
              <div className={`${nameStyle} mt-2`}>{store.stationName}</div>
              <div className={addressStyle}>{store.address}</div>
              {store.gstin && <div className="mt-1 break-words">GSTIN-{store.gstin}</div>}
              
              <div className="text-center font-bold tracking-widest mt-4">ORIGINAL</div>
              <div className="text-center overflow-hidden tracking-tighter w-full">********************************</div>
              
              <div className="flex justify-between font-bold">
                <span>{fmtDate(store.date)}</span><span>{store.time}</span>
              </div>
              
              <div className="mt-2">
                <div>INVOICE NO:{store.receiptNo}</div>
                <div>VEHICLE NO: {store.vehicleNo || 'NotEntered'}</div>
                <div>PRESET: {store.paymentMode}</div>
              </div>
              
              <div className="text-center overflow-hidden tracking-tighter mt-1 w-full">********************************</div>
              
              <div className="mt-1 uppercase">
                <Field label="NOZZLE NO" val={store.nozzleNo} pad={10} />
                <Field label="PRODUCT" val={store.product} pad={10} />
                {store.density && <Field label="DENSITY" val={`${store.density} kg/m3`} pad={10} />}
                <Field label="RATE" val={`${store.rate.toFixed(2)} INR/${curUoM}`} pad={10} />
                <Field label="VOLUME" val={`${store.volume.toFixed(2)} ${curUoM}`} pad={10} />
                <Field label="AMOUNT" val={`${store.amount.toFixed(2)} INR`} pad={10} />
              </div>
              
              <div className="text-center overflow-hidden tracking-tighter mt-1 w-full">********************************</div>
              
              <div className="mt-6 text-center break-words w-full">Thank You! Visit Again</div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={`relative overflow-hidden px-4 py-6 mx-auto tracking-tight font-medium`} style={paperStyle}>
            <Watermarks />
            <div className="relative z-10 w-full">
              <LogoBlock />
              <div className="text-center mt-2 leading-tight">
                <div className={nameStyle}>{store.stationName}</div>
                <div className={addressStyle}>{store.address}</div>
                {store.phone && <div>Ph:{store.phone}</div>}
                <div className="mt-2">RO ID: {store.roCode}</div>
                <div>RETAIL INVOICE - Original</div>
                <div className="mt-1 mb-2">Customer Copy</div>
              </div>
              
              <div>Date : {fmtDate(store.date)} {store.time}</div>
              <div>Inv  : {store.receiptNo}</div>
              <div>Vehicle No : {store.vehicleNo || '**********'}</div>
              
              <div className="my-2 border-y border-dashed border-black py-1">
                <div className="flex font-bold justify-between text-[0.9em]">
                  <span className="w-[28%] text-left">Product</span>
                  <span className="w-[18%] text-center">Qty</span>
                  <span className="w-[16%] text-center">UoM</span>
                  <span className="w-[18%] text-right">Rate</span>
                  <span className="w-[20%] text-right">Amount</span>
                </div>
              </div>
              
              <div className="flex justify-between uppercase mt-1 mb-2">
                <span className="w-[28%] truncate text-left">{store.product}</span>
                <span className="w-[18%] text-center">{store.volume.toFixed(2)}</span>
                <span className="w-[16%] text-center truncate">{curUoM}</span>
                <span className="w-[18%] text-right">{store.rate.toFixed(2)}</span>
                <span className="w-[20%] text-right">{store.amount.toFixed(2)}</span>
              </div>
              
              <div className="my-2 border-t border-dashed border-black"></div>
              
              <div className="flex justify-between font-bold"><span>Total Invoice Amount:</span><span>Rs.{store.amount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Method Of Payment:</span><span>{store.paymentMode}</span></div>
              
              <div className="mt-3 break-words w-full">Resale to tax paid goods</div>
              {store.gstin && <div className="break-words w-full">GST No : {store.gstin}</div>}
              <div className="break-words w-full">Wishes you a safe journey</div>
              
              <div className="mt-5 text-[0.8em] opacity-80 text-center w-full">FP-5/DSM-20 &nbsp; {fmtDate(store.date)} {store.time}</div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex gap-4 w-full mb-4 justify-end relative">
        <div className="relative">
          <button onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition">
            <Share2 size={18} /> Share
          </button>
          
          {showShareMenu && (
            <div className="absolute top-12 right-0 bg-white border border-slate-200 shadow-xl rounded-lg w-48 py-2 z-50">
              <p className="text-xs font-bold text-slate-400 px-4 mb-2 uppercase">Share directly to app</p>
              <button onClick={() => shareFile('pdf')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium"><FileText size={16} className="text-red-500" /> Share as PDF</button>
              <button onClick={() => shareFile('png')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium"><ImageIcon size={16} className="text-indigo-500" /> Share as Image</button>
            </div>
          )}
        </div>

        <button onClick={downloadPNG} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"><FileImage size={18} /> PNG</button>
        <button onClick={downloadPDF} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded shadow hover:bg-slate-900 transition"><Download size={18} /> PDF</button>
      </div>
      
      <div className="bg-slate-300 p-8 rounded-xl w-full flex justify-center shadow-inner overflow-auto" style={{ minHeight: '800px' }}>
        <div ref={printRef} className="shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-full relative">
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
}