import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '@/lib/storage';

export interface BillHistoryItem {
  id: string; savedAt: string; stationName: string; address: string; receiptNo: string; date: string; time: string;
  amount: number; volume: number; product: string; vehicleNo: string; rate: number; selectedTemplate: number;
  roId?: string; roCode?: string; rslNo?: string; tinNo?: string; jioContact?: string;
  fccId?: string; fipNo?: string; nozzleNo?: string; uom: string; phone: string; gstin: string;
  mobileNo: string; paymentMode: string; density?: string; txnId?: string;
  vatNo?: string; cstNo?: string; lstNo?: string; attendantId?: string; fpId?: string; atot?: string; vtot?: string;
  watermark: string | null; watermarkPosition: 'LEFT' | 'BOTH'; showWatermark: boolean;
  logo: string | null; showLogo: boolean; receiptFont: string; posFontSize: number;
  paperWidth: number; paperBackground: string; paperMode: 'COLOR' | 'PRESET' | 'CUSTOM';
  selectedTexture: number; customPaperBG: string | null;
}

export interface FuelBillState extends Omit<BillHistoryItem, 'id' | 'savedAt'> {
  savedLogos: string[]; 
  savedWatermarks: string[]; 
  savedPapers: string[]; // 🟢 Custom Paper Gallery Added
  billHistory: BillHistoryItem[]; 
  selectedBills: string[]; 
  hasWarnedFont: boolean;

  setSelectedBills: (bills: string[]) => void;
  setField: <K extends keyof FuelBillState>(field: K, value: FuelBillState[K]) => void; 
  setLogo: (logoUrl: string) => void; removeLogo: () => void; 
  setWatermark: (wmUrl: string) => void; removeWatermark: () => void;
  saveLogoToGallery: (logoUrl: string) => void; deleteLogoFromGallery: (index: number) => void;
  saveWatermarkToGallery: (wmUrl: string) => void; deleteWatermarkFromGallery: (index: number) => void;
  savePaperToGallery: (paperUrl: string) => void; deletePaperFromGallery: (index: number) => void; // 🟢 Paper Gallery Actions
  calculateFromVolume: (vol: number, rt: number) => void;
  calculateVolume: (amt: number, rt: number) => void;
  startNewBill: () => void; clearAll: () => void; 
  saveBillToHistory: () => boolean; 
  deleteBillsFromHistory: (ids: string[]) => void; 
  loadBillFromHistory: (bill: Partial<FuelBillState>) => void;
}

export const useFuelStore = create<FuelBillState>()(
  persist((set, get) => ({
    stationName: 'PRIYANKA SERVICE STATION', address: 'SECTOR 12 ROHINI\nDELHI 110085', phone: '01127571143', gstin: '33AABPV3906B3Z3', roCode: 'ORF021',
    receiptNo: 'D2363', txnId: '0000003050606045', fccId: '00000000000491205', fipNo: '04', nozzleNo: '04', product: 'PETROL', density: '733.3', presetType: 'Amount', uom: 'L',
    rate: 96.72, amount: 2000.00, volume: 20.68, vehicleNo: 'Not Entered', mobileNo: 'Not Entered', date: new Date().toISOString().split('T')[0], time: '10:12:45', paymentMode: 'CASH',
    vatNo: '07220306483', cstNo: '', lstNo: '', attendantId: 'Not Available', fpId: '2', atot: '00164873326.48', vtot: '0001830843.920',
    logo: null, showLogo: true, watermark: null, showWatermark: false, watermarkPosition: 'BOTH', hasWarnedFont: false,
    selectedTemplate: 1, paperWidth: 280, posFontSize: 12, paperBackground: '#fdfcf8', paperMode: 'PRESET', selectedTexture: 3, customPaperBG: null, receiptFont: "'Courier New', Courier, monospace",
    roId: '1176', rslNo: '04/2015-16', tinNo: '21621111617', jioContact: '18008919023',
    
    savedLogos: [], savedWatermarks: [], savedPapers: [], billHistory: [], selectedBills: [],

    setSelectedBills: (bills) => set({ selectedBills: bills }),
    setField: (field, value) => set((state) => ({ ...state, [field]: value })),
    setLogo: (logoUrl) => set({ logo: logoUrl }), removeLogo: () => set({ logo: null }),
    setWatermark: (wmUrl) => set({ watermark: wmUrl }), removeWatermark: () => set({ watermark: null }),
    
    saveLogoToGallery: (logoUrl) => set((state) => ({ savedLogos: [logoUrl, ...state.savedLogos.filter(l => l !== logoUrl)].slice(0, 6) })),
    deleteLogoFromGallery: (index) => set((state) => ({ savedLogos: state.savedLogos.filter((_, i) => i !== index) })),
    
    saveWatermarkToGallery: (wmUrl) => set((state) => ({ savedWatermarks: [wmUrl, ...state.savedWatermarks.filter(l => l !== wmUrl)].slice(0, 6) })),
    deleteWatermarkFromGallery: (index) => set((state) => ({ savedWatermarks: state.savedWatermarks.filter((_, i) => i !== index) })),

    savePaperToGallery: (paperUrl) => set((state) => ({ savedPapers: [paperUrl, ...state.savedPapers.filter(p => p !== paperUrl)].slice(0, 6) })),
    deletePaperFromGallery: (index) => set((state) => ({ savedPapers: state.savedPapers.filter((_, i) => i !== index) })),

    calculateFromVolume: (vol, rt) => set({ volume: vol, rate: rt, amount: Number((vol * rt).toFixed(2)) }),
    calculateVolume: (amt, rt) => set({ amount: amt, rate: rt, volume: rt > 0 ? Number((amt / rt).toFixed(2)) : 0 }),

    startNewBill: () => {
      const state = get();
      const d = new Date();
      const mth = d.toLocaleString('default', { month: 'short' });
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      
      let nextReceipt = state.receiptNo;
      if (state.selectedTemplate === 4) {
        nextReceipt = `${yy}${mm}${dd}${Math.floor(10000 + Math.random() * 90000)}`; 
      } else if (state.selectedTemplate === 2 || state.selectedTemplate === 3) {
        const num = Math.floor(10000 + Math.random() * 89999);
        nextReceipt = `${mth}-${num}-ORGNL`; 
      } else {
        const match = state.receiptNo.match(/\d+/);
        nextReceipt = match ? `D${parseInt(match[0]) + 1}` : `D${Math.floor(1000 + Math.random() * 9000)}`; 
      }

      const h = Math.floor(Math.random() * (18 - 8 + 1)) + 8;
      const m = Math.floor(Math.random() * 60);
      const s = Math.floor(Math.random() * 60);
      const randomTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

      set({ 
        receiptNo: nextReceipt, time: randomTime,
        txnId: Math.floor(1000000000000000 + Math.random() * 900000000000000).toString(),
        atot: (Number(state.atot) + state.amount).toFixed(2).padStart(14, '0'),
        vtot: (Number(state.vtot) + state.volume).toFixed(3).padStart(14, '0')
      });
    },
    
    clearAll: () => set({ vehicleNo: 'Not Entered', mobileNo: 'Not Entered', amount: 0, volume: 0 }),
    
    saveBillToHistory: () => {
      const state = get();
      const isDuplicate = state.billHistory.some(b => b.receiptNo === state.receiptNo && b.date === state.date && b.amount === state.amount);
      if (isDuplicate) return false;

      const newBill: BillHistoryItem = {
        id: `bill_${Date.now()}`, savedAt: new Date().toISOString(),
        stationName: state.stationName, address: state.address, receiptNo: state.receiptNo, date: state.date, time: state.time,
        amount: state.amount, volume: state.volume, product: state.product, vehicleNo: state.vehicleNo, rate: state.rate,
        selectedTemplate: state.selectedTemplate, roId: state.roId, roCode: state.roCode, rslNo: state.rslNo, tinNo: state.tinNo, jioContact: state.jioContact,
        fccId: state.fccId, fipNo: state.fipNo, nozzleNo: state.nozzleNo, uom: state.uom, phone: state.phone, gstin: state.gstin,
        mobileNo: state.mobileNo, paymentMode: state.paymentMode, density: state.density, txnId: state.txnId,
        vatNo: state.vatNo, cstNo: state.cstNo, lstNo: state.lstNo, attendantId: state.attendantId, fpId: state.fpId, atot: state.atot, vtot: state.vtot,
        watermark: state.watermark, watermarkPosition: state.watermarkPosition, showWatermark: state.showWatermark,
        logo: state.logo, showLogo: state.showLogo, receiptFont: state.receiptFont, posFontSize: state.posFontSize,
        paperWidth: state.paperWidth, paperBackground: state.paperBackground, paperMode: state.paperMode,
        selectedTexture: state.selectedTexture, customPaperBG: state.customPaperBG
      };
      
      set((s) => ({ billHistory: [newBill, ...s.billHistory] }));
      return true;
    },
    
    deleteBillsFromHistory: (ids) => set((state) => ({ billHistory: state.billHistory.filter(b => !ids.includes(b.id)), selectedBills: [] })),
    
    loadBillFromHistory: (bill) => set((state) => {
      const safeBill = { ...bill };
      delete (safeBill as any).billHistory;
      delete (safeBill as any).savedLogos;
      delete (safeBill as any).savedWatermarks;
      delete (safeBill as any).savedPapers;
      delete (safeBill as any).selectedBills;
      return { ...state, ...safeBill };
    })
  }), { name: 'fuel-bill-idb-storage', storage: createJSONStorage(() => idbStorage) })
);