'use client';

import { useRef, useState, useEffect } from 'react';
import { useHotelStore } from '@/store/useHotelStore';
import { TemplateEngine } from './templates/TemplateEngine';
import { Download, Share2, Printer, ArrowLeft, Maximize2, Minimize2, FileImage, FileText, ChevronDown, Receipt } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function HotelPreview() {
  const store = useHotelStore();
  
  // 🟢 Separate Ref for pristine, unscaled image capture
  const printRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const [zoomMode, setZoomMode] = useState<'FIT' | 50 | 75 | 100 | 125>('FIT');
  const [fitScale, setFitScale] = useState(1);
  const [theatreMode, setTheatreMode] = useState(false);
  
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [paperFormat, setPaperFormat] = useState<'A4' | 'A3' | 'THERMAL'>('A4');

  // 🟢 PERFORMANCE: Debounced Resize Observer
  useEffect(() => {
    setIsMounted(true);
    const container = containerRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;
    const runObserverCalculation = (entries: ResizeObserverEntry[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (zoomMode === 'FIT') {
          const { width, height } = entries[0].contentRect;
          const targetW = paperFormat === 'THERMAL' ? 302 : (paperFormat === 'A3' ? 1123 : 794);
          const targetH = paperFormat === 'THERMAL' ? 600 : (paperFormat === 'A3' ? 1587 : 1123);
          
          const scaleW = (width - 48) / targetW;
          const scaleH = (height - 48) / targetH;
          setFitScale(Math.min(scaleW, scaleH, 1));
        }
      }, 50);
    };

    const observer = new ResizeObserver(runObserverCalculation);
    observer.observe(container);
    return () => { observer.disconnect(); clearTimeout(timeoutId); };
  }, [zoomMode, theatreMode, paperFormat]);

  if (!isMounted) return null;

  // 🟢 DYNAMIC DIMENSIONS
  const activeScale = zoomMode === 'FIT' ? fitScale : (zoomMode / 100);
  const baseWidth = paperFormat === 'THERMAL' ? 302 : (paperFormat === 'A3' ? 1123 : 794);
  const baseMinHeight = paperFormat === 'THERMAL' ? 600 : (paperFormat === 'A3' ? 1587 : 1123);
  const exactWidth = baseWidth * activeScale;
  const exactHeight = baseMinHeight * activeScale;

  // 🟢 BULLETPROOF EXPORT ENGINE (No External Dependencies)
  const downloadPNG = async () => {
    if (!printRef.current) return;
    try {
      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a'); 
      link.download = `Hotel_INV_${store.invoiceNo}.png`; 
      link.href = dataUrl; 
      link.click();
    } catch (err) { console.error("PNG Error:", err); }
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const pdfFormat = paperFormat === 'THERMAL' ? [302, printRef.current.offsetHeight] : paperFormat.toLowerCase();
      const pdf = new jsPDF({ format: pdfFormat as any, unit: 'px' });
      const w = pdf.internal.pageSize.getWidth(); 
      const h = (printRef.current.offsetHeight * w) / printRef.current.offsetWidth;
      pdf.addImage(dataUrl, 'PNG', 0, 0, w, h); 
      pdf.save(`Hotel_INV_${store.invoiceNo}.pdf`);
    } catch (err) { console.error("PDF Error:", err); }
  };

  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      const printWidth = paperFormat === 'THERMAL' ? '80mm' : '100%';
      printWindow.document.write(`<html><head><style>body{margin:0;display:flex;justify-content:center;background:white;}img{width:${printWidth};max-width:100%;height:auto;}@page{margin:0;size:auto;}</style></head><body><img src="${dataUrl}" onload="setTimeout(()=>{window.print();window.close();},250);" /></body></html>`);
      printWindow.document.close();
    } catch (err) { console.error("Print Error:", err); }
  };

  const shareFile = async (type: 'png' | 'pdf') => {
    if (!printRef.current) return;
    setShowShareMenu(false);

    try {
      let file: File;
      const fileName = `Hotel_INV_${store.invoiceNo}.${type}`;
      const dataUrl = await toPng(printRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      
      if (type === 'png') {
        const blob = await (await fetch(dataUrl)).blob();
        file = new File([blob], fileName, { type: 'image/png' });
      } else {
        const pdfFormat = paperFormat === 'THERMAL' ? [302, printRef.current.offsetHeight] : paperFormat.toLowerCase();
        const pdf = new jsPDF({ format: pdfFormat as any, unit: 'px' });
        const w = pdf.internal.pageSize.getWidth();
        const h = (printRef.current.offsetHeight * w) / printRef.current.offsetWidth;
        pdf.addImage(dataUrl, 'PNG', 0, 0, w, h);
        const pdfBlob = pdf.output('blob');
        file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      }

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Invoice ${store.invoiceNo}`,
          text: `Hello ${store.customerName},\nHere is your hotel invoice from ${store.hotelName}.`,
          files: [file]
        });
      } else {
        alert("Direct sharing is unsupported on this device. Auto-downloading file instead.");
        type === 'png' ? downloadPNG() : downloadPDF();
      }
    } catch (error) { 
      console.error("Error sharing:", error); 
    }
  };

  const viewportContent = (
    <div className="flex flex-col w-full h-full relative" onClick={() => showShareMenu && setShowShareMenu(false)}>
      
      {/* 🟢 PREMIUM ACTION BAR */}
      <div className="flex flex-col xl:flex-row justify-between items-center w-full mb-4 bg-slate-900 text-white p-3 rounded-xl shadow-md border border-slate-800 z-50 shrink-0 gap-3">
        
        <div className="flex items-center gap-3 w-full xl:w-auto">
          {!theatreMode && <button onClick={() => window.history.back()} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition"><ArrowLeft size={14} /> Back</button>}
          <span className="font-black text-xs tracking-widest uppercase text-amber-400 hidden sm:inline-block">LIVE ACTIVE CANVAS</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button onClick={() => setPaperFormat('THERMAL')} className={`px-2.5 py-1 text-[10px] font-black rounded-md transition flex items-center gap-1 ${paperFormat === 'THERMAL' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><Receipt size={12}/> 80mm</button>
            <button onClick={() => setPaperFormat('A4')} className={`px-2.5 py-1 text-[10px] font-black rounded-md transition ${paperFormat === 'A4' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>A4</button>
            <button onClick={() => setPaperFormat('A3')} className={`px-2.5 py-1 text-[10px] font-black rounded-md transition ${paperFormat === 'A3' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>A3</button>
          </div>

          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button onClick={() => setZoomMode('FIT')} className={`px-2.5 py-1 text-[10px] font-black rounded-md transition ${zoomMode === 'FIT' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>FIT</button>
            {[50, 75, 100, 125].map(z => (
              <button key={z} onClick={() => setZoomMode(z as any)} className={`px-2 py-1 text-[10px] font-black rounded-md transition ${zoomMode === z ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>{z}%</button>
            ))}
          </div>

          <div className="flex gap-1.5 items-center">
            <button onClick={() => setTheatreMode(!theatreMode)} className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-lg transition text-white" title="Theatre Expanded View">{theatreMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>
            
            {/* SAFE SHARE MENU */}
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }} className={`flex items-center justify-center w-auto px-3 h-8 rounded-lg transition text-white font-bold text-xs gap-1.5 ${showShareMenu ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'}`}>
                <Share2 size={14} /> Share
              </button>
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-2xl z-[999999] overflow-hidden animate-in fade-in zoom-in duration-200">
                  <p className="text-[10px] font-bold text-slate-400 px-4 py-2 border-b border-slate-100 uppercase tracking-widest">Share Option</p>
                  <button onClick={() => shareFile('pdf')} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-2 text-slate-700"><FileText size={14} className="text-rose-500"/> Share as PDF</button>
                  <button onClick={() => shareFile('png')} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-2 border-t border-slate-100 text-slate-700"><FileImage size={14} className="text-indigo-500"/> Share as Image</button>
                </div>
              )}
            </div>

            {/* ROBUST EXPORT BUTTONS */}
            <button onClick={handlePrint} className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 w-8 h-8 rounded-lg transition text-white" title="Trigger Hardware Print"><Printer size={14} /></button>
            <button onClick={downloadPNG} className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 w-8 h-8 rounded-lg transition text-white" title="Download High Density PNG"><FileImage size={14} /></button>
            <button onClick={downloadPDF} className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 w-8 h-8 rounded-lg transition text-white" title="Download PDF"><Download size={14} /></button>
          </div>
        </div>
      </div>

      {/* 🟢 VISUAL SCALABLE CANVAS CONTAINER (What user sees on screen) */}
      <div ref={containerRef} className={`w-full flex-1 flex ${zoomMode === 'FIT' ? 'items-center justify-center overflow-hidden' : 'items-start justify-center overflow-auto'} bg-slate-200/60 rounded-2xl border border-slate-300 shadow-inner relative p-2 custom-scrollbar`}>
        
        {/* Scale Wrapper for visual display */}
        <div className="bg-white shadow-2xl transition-all duration-150 ease-out relative shrink-0 rounded-sm" style={{ width: `${exactWidth}px`, minHeight: `${exactHeight}px`, margin: zoomMode !== 'FIT' ? '16px auto' : '0 auto' }}>
          <div className="absolute top-0 left-0 bg-white origin-top-left" style={{ width: `${baseWidth}px`, minHeight: `${baseMinHeight}px`, transform: `scale(${activeScale})` }}>
            <div className="w-full h-full relative"><TemplateEngine data={store} /></div>
          </div>
        </div>
      </div>

      {/* 🟢 HIDDEN 100% QUALITY RENDER TARGET (What the PDF/Image engine sees) 
          Placed far off-screen so it doesn't mess with UI, but remains fully rendered.
      */}
      {/* 🟢 FIX: Added 'flex flex-col' so the inner template can stretch to the absolute bottom */}
      <div className="absolute top-[-9999px] left-[-9999px] bg-white flex flex-col" style={{ width: `${baseWidth}px`, minHeight: `${baseMinHeight}px` }}>
        <div ref={printRef} className="w-full flex-1 flex flex-col">
          <TemplateEngine data={store} />
        </div>
      </div>

    </div>
  );

  return theatreMode ? <div className="fixed inset-0 z-[999999] bg-slate-950 p-4 flex flex-col">{viewportContent}</div> : <div className="h-full w-full">{viewportContent}</div>;
}