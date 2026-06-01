import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '@/lib/storage';

export interface TravelBillHistoryItem extends Partial<TravelBillState> {
  id: string;
  savedAt: string;
  grandTotal: number;
}

export interface TravelBillState {
  agencyName: string; address: string; phone: string; email: string; gstin: string; invoiceNo: string; date: string; customerName: string; customerPhone: string;
  startLocation: string; endLocation: string; startDate: string; endDate: string; vehicleType: string; vehicleNo: string; driverName: string;
  startKm: number; endKm: number; totalKm: number; ratePerKm: number; tollsParking: number; driverAllowance: number; otherCharges: number; advancePaid: number; discount: number; taxRate: number; hasTax: boolean;
  paymentMode: string; logo: string | null; showLogo: boolean; signature: string | null; showSignature: boolean; selectedTemplate: number; themeColor: string; currency: string;
  
  // 🟢 NAYA: History Fields
  billHistory: TravelBillHistoryItem[];
  selectedBills: string[];
  
  setSelectedBills: (bills: string[]) => void;
  setField: <K extends keyof TravelBillState>(field: K, value: TravelBillState[K]) => void; 
  setLogo: (logoUrl: string | null) => void; removeLogo: () => void; 
  setSignature: (signUrl: string | null) => void; removeSignature: () => void; 
  calculateKm: (start: number, end: number) => void; 
  startNewBill: () => void; startNewCustomer: () => void;
  
  // 🟢 NAYA: History Actions
  saveBillToHistory: (grandTotal: number) => boolean;
  deleteBillsFromHistory: (ids: string[]) => void;
  loadBillFromHistory: (bill: Partial<TravelBillState>) => void;
}

export const useTravelStore = create<TravelBillState>()(
  persist((set, get) => ({
    agencyName: 'ROYAL CAB & TRAVELS', address: 'Shop No. 12, Main Market, Station Road\nBhabua, Bihar - 821101', phone: '09876543210', email: '', gstin: '',
    invoiceNo: 'RCT-2026-809', date: new Date().toISOString().split('T')[0], customerName: 'Rahul Verma', customerPhone: '', startLocation: 'Bhabua', endLocation: 'Varanasi Airport', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0],
    vehicleType: 'Toyota Innova Crysta', vehicleNo: 'BR 45 X 1234', driverName: 'Ramesh Singh', startKm: 15420, endKm: 15645, totalKm: 225, ratePerKm: 14, tollsParking: 250, driverAllowance: 300, otherCharges: 0, advancePaid: 1000, discount: 0, taxRate: 5, hasTax: false,
    paymentMode: 'UPI / ONLINE', logo: null, showLogo: true, signature: null, showSignature: true, selectedTemplate: 1, themeColor: '#eab308', currency: '₹',
    
    billHistory: [], selectedBills: [],

    setSelectedBills: (bills) => set({ selectedBills: bills }),
    setField: (field, value) => set((state) => ({ ...state, [field]: value })), 
    setLogo: (logoUrl) => set({ logo: logoUrl }), removeLogo: () => set({ logo: null }), 
    setSignature: (signUrl) => set({ signature: signUrl }), removeSignature: () => set({ signature: null }), 
    
    calculateKm: (start, end) => { const total = end > start ? end - start : 0; set({ startKm: start, endKm: end, totalKm: total }); },
    
    startNewBill: () => { 
        const currentReceipt = get().invoiceNo; 
        const numPart = currentReceipt.match(/\d+$/); 
        let nextReceipt = currentReceipt + '1'; 
        if (numPart) { 
            const num = parseInt(numPart[0], 10) + 1; 
            nextReceipt = currentReceipt.replace(/\d+$/, String(num).padStart(numPart[0].length, '0')); 
        } 
        set({ invoiceNo: nextReceipt, startKm: get().endKm, endKm: get().endKm, totalKm: 0, advancePaid: 0, tollsParking: 0, driverAllowance: 0, otherCharges: 0, date: new Date().toISOString().split('T')[0], startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }); 
    },
    startNewCustomer: () => { get().startNewBill(); set({ customerName: '', customerPhone: '' }); },

    saveBillToHistory: (grandTotal) => {
      const state = get();
      const isDuplicate = state.billHistory.some(b => b.invoiceNo === state.invoiceNo && b.date === state.date);
      if (isDuplicate) return false;

      const newBill: TravelBillHistoryItem = {
        ...state, id: `travel_${Date.now()}`, savedAt: new Date().toISOString(), grandTotal
      };
      
      set((s) => ({ billHistory: [newBill, ...s.billHistory] }));
      return true;
    },
    
    deleteBillsFromHistory: (ids) => set((state) => ({ billHistory: state.billHistory.filter(b => !ids.includes(b.id)), selectedBills: [] })),
    loadBillFromHistory: (bill) => set((state) => ({ ...state, ...bill }))
  }), { name: 'travel-bill-storage', storage: createJSONStorage(() => idbStorage) })
);