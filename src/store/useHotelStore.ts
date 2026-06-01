import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '@/lib/storage';

export interface ExtraService { id: string; name: string; qty: number; rate: number; amount: number; }
export interface MenuItem { name: string; rate: number; }
export interface HotelBillHistoryItem extends Partial<HotelBillState> { id: string; savedAt: string; grandTotal: number; }

export interface HotelBillState {
  hotelName: string; phone: string; email: string; website: string; address: string; gstin: string;
  jurisdictionCity: string; sacCode: string; showSac: boolean; hotelNameSize: number;
  showBankDetails: boolean; bankDetails: string; bankSize: number; bankY: number; qrCode: string | null; qrSize: number; savedQRs: string[];
  customerName: string; customerPhone: string; customerAddress: string; nationality: string; vehicleNo: string;
  invoiceNo: string; date: string; roomNo: string; roomType: string;
  checkInDate: string; checkInTime: string; checkOutDate: string; checkOutTime: string; 
  noOfDays: number; perDayCharge: number;
  showBookingSource: boolean; bookingSource: string; adults: number; kids: number;
  currency: string; advancePaid: number; discountType: 'FLAT' | 'PERCENT'; discount: number;
  extraServices: ExtraService[]; serviceCharge: number; showServiceCharge: boolean;
  hasTax: boolean; cgstRate: number; sgstRate: number; paymentMode: string;
  selectedTemplate: number; themeColor: string; fontFamily: string; fontSize: number;
  amountInWords: boolean; termsIndex: number; customTerms: string; printPaperSize: 'A4' | 'A3' | 'A2'; themePreset: string; showPoweredBy: boolean;
  logo: string | null; showLogo: boolean; customLogos: string[]; logoSize: number;
  signature: string | null; showSignature: boolean; showGuestSignature: boolean; signatureSize: number; savedSignatures: string[]; signatoryTitle: string;
  showStamp: boolean; stampFormat: number; stampType: 'MUHAR' | 'PAID' | 'DUE' | 'CANCELLED'; stampColor: string; stampSize: number; stampX: number; stampY: number;
  serviceDB: MenuItem[]; foodDB: MenuItem[]; billHistory: HotelBillHistoryItem[]; selectedBills: string[];
  
  setSelectedBills: (bills: string[]) => void; setField: <K extends keyof HotelBillState>(field: K, value: HotelBillState[K]) => void;
  handleDateChange: (field: 'checkInDate' | 'checkOutDate', val: string) => void; applyTheme: (theme: string) => void;
  setLogo: (url: string | null) => void; removeLogo: () => void; 
  setSignature: (url: string | null) => void; removeSignature: () => void;
  saveImageToGallery: (type: 'logo'|'signature'|'qrCode', url: string) => void; deleteImageFromGallery: (type: 'logo'|'signature'|'qrCode', idx: number) => void;
  addExtraService: () => void; updateExtraService: (id: string, fields: Partial<ExtraService>) => void; removeExtraService: (id: string) => void;
  addServiceToDB: (type: 'food'|'service', item: MenuItem) => void; removeServiceFromDB: (type: 'food'|'service', name: string) => void;
  startNewBill: () => void; clearGuestDetails: () => void;
  saveBillToHistory: (grandTotal: number) => boolean; deleteBillsFromHistory: (ids: string[]) => void; loadBillFromHistory: (bill: Partial<HotelBillState>) => void;
}

export const useHotelStore = create<HotelBillState>()(
  persist((set, get) => ({
    hotelName: 'THE GRAND PALACE', hotelNameSize: 24, phone: '09876543210', email: 'contact@grandpalace.com', website: 'www.grandpalace.com', address: '12, VIP Road, Patna', gstin: '10AAAAA0000A1Z5',
    jurisdictionCity: 'Patna', sacCode: '996311', showSac: true, showBankDetails: true, bankDetails: 'Bank: HDFC Bank\nA/c: 501002345678\nIFSC: HDFC0001234', bankSize: 10, bankY: 0, qrCode: null, qrSize: 70, savedQRs: [],
    customerName: '', customerPhone: '', customerAddress: '', nationality: 'Indian', vehicleNo: '',
    invoiceNo: 'INV-' + Math.floor(100000 + Math.random() * 900000), date: new Date().toISOString().split('T')[0],
    roomNo: '101', roomType: 'Deluxe AC', checkInDate: new Date().toISOString().split('T')[0], checkInTime: '12:00', checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], checkOutTime: '11:00',
    noOfDays: 1, perDayCharge: 2500, showBookingSource: false, bookingSource: 'Walk-in', adults: 2, kids: 0,
    currency: '₹', advancePaid: 0, discountType: 'FLAT', discount: 0, extraServices: [], serviceCharge: 0, showServiceCharge: false, hasTax: true, cgstRate: 6, sgstRate: 6, paymentMode: 'ONLINE',
    selectedTemplate: 2, themeColor: '#1e3a8a', fontFamily: 'font-sans', fontSize: 13, amountInWords: true, termsIndex: 0, customTerms: '', printPaperSize: 'A4', themePreset: 'MIDNIGHT_NAVY', showPoweredBy: true,
    logo: null, showLogo: true, customLogos: [], logoSize: 80, signature: null, showSignature: true, showGuestSignature: true, signatureSize: 60, savedSignatures: [], signatoryTitle: 'Authorized Signatory',
    showStamp: false, stampFormat: 1, stampType: 'MUHAR', stampColor: '#000080', stampSize: 150, stampX: 50, stampY: 50,
    serviceDB: [{name: 'Laundry', rate: 100}, {name: 'Extra Bed', rate: 500}], foodDB: [{name: 'Breakfast Thali', rate: 150}, {name: 'Tea / Coffee', rate: 30}],
    billHistory: [], selectedBills: [],

    setSelectedBills: (bills) => set({ selectedBills: bills }), setField: (field, value) => set((state) => ({ ...state, [field]: value })), 
    handleDateChange: (field, val) => set((state) => {
      const newState = { ...state, [field]: val };
      const d1 = new Date(newState.checkInDate).getTime(); const d2 = new Date(newState.checkOutDate).getTime();
      let days = Math.ceil((d2 - d1) / (1000 * 3600 * 24));
      return { ...newState, noOfDays: days < 1 ? 1 : days };
    }),

    applyTheme: (theme) => set((state) => {
      switch(theme) {
        case 'ROYAL_GOLD': return { themePreset: theme, themeColor: '#b45309', fontFamily: 'font-serif' };
        case 'MIDNIGHT_NAVY': return { themePreset: theme, themeColor: '#1e3a8a', fontFamily: 'font-sans' };
        case 'VINTAGE_SEPIA': return { themePreset: theme, themeColor: '#78350f', fontFamily: 'font-serif' };
        case 'ELITE_CORPORATE': return { themePreset: theme, themeColor: '#334155', fontFamily: 'font-mono' };
        default: return { themePreset: theme };
      }
    }),

    setLogo: (url) => set({ logo: url }), removeLogo: () => set({ logo: null }), 
    setSignature: (url) => set({ signature: url }), removeSignature: () => set({ signature: null }),
    saveImageToGallery: (type, url) => set((s) => {
      if(type==='logo') return { customLogos: [url, ...s.customLogos.filter(x=>x!==url)].slice(0,5) };
      if(type==='signature') return { savedSignatures: [url, ...s.savedSignatures.filter(x=>x!==url)].slice(0,5) };
      if(type==='qrCode') return { savedQRs: [url, ...s.savedQRs.filter(x=>x!==url)].slice(0,5) };
      return s;
    }),
    deleteImageFromGallery: (type, i) => set((s) => {
      if(type==='logo') return { customLogos: s.customLogos.filter((_,idx)=>idx!==i) };
      if(type==='signature') return { savedSignatures: s.savedSignatures.filter((_,idx)=>idx!==i) };
      if(type==='qrCode') return { savedQRs: s.savedQRs.filter((_,idx)=>idx!==i) };
      return s;
    }),
    
    addExtraService: () => set((state) => ({ extraServices: [...state.extraServices, { id: crypto.randomUUID(), name: '', qty: 1, rate: 0, amount: 0 }] })),
    updateExtraService: (id, fields) => set((state) => ({ extraServices: state.extraServices.map(item => item.id === id ? { ...item, ...fields, amount: (fields.qty ?? item.qty) * (fields.rate ?? item.rate) } : item) })),
    removeExtraService: (id) => set((state) => ({ extraServices: state.extraServices.filter(item => item.id !== id) })),
    addServiceToDB: (type, item) => set((s) => type === 'food' ? { foodDB: [...s.foodDB, item] } : { serviceDB: [...s.serviceDB, item] }),
    removeServiceFromDB: (type, name) => set((s) => type === 'food' ? { foodDB: s.foodDB.filter(x=>x.name!==name) } : { serviceDB: s.serviceDB.filter(x=>x.name!==name) }),

    startNewBill: () => set((state) => {
      const hr = Math.floor(Math.random() * (16 - 10 + 1)) + 10;
      const min = Math.random() > 0.5 ? '00' : '30';
      return { 
        invoiceNo: 'INV-' + Math.floor(100000 + Math.random() * 900000), roomNo: Math.floor(100 + Math.random() * 900).toString(), 
        extraServices: [], advancePaid: 0, discount: 0, date: new Date().toISOString().split('T')[0], checkInDate: new Date().toISOString().split('T')[0], 
        checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], checkInTime: `${hr.toString().padStart(2, '0')}:${min}`, checkOutTime: '11:00', noOfDays: 1 
      };
    }),
    clearGuestDetails: () => set(() => ({ customerName: '', customerPhone: '', customerAddress: '', vehicleNo: '', nationality: 'Indian' })),

    saveBillToHistory: (grandTotal) => {
      const state = get(); const isDuplicate = state.billHistory.some(b => b.invoiceNo === state.invoiceNo && b.date === state.date);
      if (isDuplicate) return false;
      const newBill: HotelBillHistoryItem = { ...state, id: `hotel_${Date.now()}`, savedAt: new Date().toISOString(), grandTotal };
      set((s) => ({ billHistory: [newBill, ...s.billHistory] })); return true;
    },
    deleteBillsFromHistory: (ids) => set((state) => ({ billHistory: state.billHistory.filter(b => !ids.includes(b.id)), selectedBills: [] })),
    loadBillFromHistory: (bill) => set((state) => {
      const safeBill = { ...bill }; delete (safeBill as any).billHistory; delete (safeBill as any).customLogos; delete (safeBill as any).savedSignatures; delete (safeBill as any).savedQRs; delete (safeBill as any).selectedBills; delete (safeBill as any).printPaperSize; delete (safeBill as any).hotelNameSize;
      return { ...state, ...safeBill };
    })
  }), { name: 'hotel-bill-storage', storage: createJSONStorage(() => idbStorage) })
);