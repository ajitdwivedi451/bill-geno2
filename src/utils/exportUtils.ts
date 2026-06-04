import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export const safeGenerateImage = async (element: HTMLElement): Promise<string> => {
  // Try High Resolution First (Premium Quality)
  try {
    return await toPng(element, { 
      backgroundColor: '#ffffff', 
      pixelRatio: 2, 
      style: { transform: 'none' },
      skipFonts: true // Prevents font-loading timeouts on slow networks
    });
  } catch (error) {
    console.warn("High-res export failed (Memory/Canvas limit). Falling back to standard resolution...", error);
    // Fallback to Standard Resolution (Low Memory)
    return await toPng(element, { 
      backgroundColor: '#ffffff', 
      pixelRatio: 1, 
      style: { transform: 'none' } 
    });
  }
};

export const downloadBill = async (element: HTMLElement | null, type: 'png'|'pdf', invoiceNo: string, paperSize: string = 'A4') => {
  if (!element) return;
  
  try {
    const dataUrl = await safeGenerateImage(element);
    
    if (type === 'png') {
      const link = document.createElement('a'); 
      link.download = `Hotel_${invoiceNo}.png`; 
      link.href = dataUrl; 
      link.click();
    } else {
      const pdf = new jsPDF({ format: paperSize.toLowerCase(), unit: 'px' }); 
      const w = pdf.internal.pageSize.getWidth(); 
      const h = (element.offsetHeight * w) / element.offsetWidth; 
      pdf.addImage(dataUrl, 'PNG', 0, 0, w, h); 
      pdf.save(`Hotel_${invoiceNo}.pdf`);
    }
  } catch (err) {
    console.error("Export Failed completely:", err);
    alert("Export failed due to device limitations. Try restarting the browser.");
  }
};