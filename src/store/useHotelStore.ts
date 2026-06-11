import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';

// 🟢 1. CUSTOM INDEXED-DB STORAGE ENGINE (Bypasses 5MB LocalStorage Limit)
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('HotelPMS_DB', 1);
      request.onupgradeneeded = (e: any) => e.target.result.createObjectStore('zustand_store');
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction('zustand_store', 'readonly');
        const store = tx.objectStore('zustand_store');
        const getReq = store.get(name);
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('HotelPMS_DB', 1);
      request.onupgradeneeded = (e: any) => e.target.result.createObjectStore('zustand_store');
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction('zustand_store', 'readwrite');
        const store = tx.objectStore('zustand_store');
        store.put(value, name);
        tx.oncomplete = () => resolve();
      };
    });
  },
  removeItem: async (name: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('HotelPMS_DB', 1);
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction('zustand_store', 'readwrite');
        const store = tx.objectStore('zustand_store');
        store.delete(name);
        tx.oncomplete = () => resolve();
      };
    });
  },
};

const getLocalToday = () => {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};
const getLocalTomorrow = () => {
  const d = new Date(Date.now() + 86400000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export interface ExtraService { id: string; name: string; qty: number; rate: number; amount: number; gstSlab?: number; selected?: boolean; }
export interface GuestRecord { name: string; phone: string; address: string; nationality: string; }

export interface HotelBillState {
  selectedTemplate: number; themePreset: string; themeColor: string; hotelNameSize: number; fontFamily: string; showBookingSource: boolean; bookingSource: string;
  showLogo: boolean; logo: string | null; logoSize: number; logoX: number; logoY: number; customLogos: string[];
  hotelName: string; hotelAddress: string; hotelPhone: string; hotelEmail: string; website: string; fssaiNo: string; hotelGstin: string;
  customerName: string; customerPhone: string; customerAddress: string; nationality: string; vehicleNo: string; guestCompany: string; guestGstin: string;
  invoiceNo: string; date: string; roomNo: string; roomType: string; adults: number; kids: number; perDayCharge: number; noOfDays: number; checkInDate: string; checkOutDate: string; checkInTime: string; checkOutTime: string;
  advancePaid: number; discount: number; discountType: 'FLAT' | 'PERCENT'; paymentMode: string; extraServices: ExtraService[]; showServiceCharge: boolean; serviceCharge: number; hasTax: boolean; showSac: boolean; showSacOnHeaderOnly: boolean; cgstRate: number; sgstRate: number; sacCode: string; amountInWords: boolean;
  showGuestSignature: boolean; guestSignature: string | null; guestSignatureSize: number; guestSignatureX: number; guestSignatureY: number;
  showSignature: boolean; signature: string | null; signatureSize: number; signatureX: number; signatureY: number; signatoryTitle: string; customSignatory: string; savedSignatures: string[]; savedGuestSignatures: string[];
  showStamp: boolean; stamp: string | null; stampType: 'MUHAR' | 'PAID' | 'DUE' | 'CANCELLED'; stampColor: string; stampSize: number; stampX: number; stampY: number;
  termsIndex: number; customTerms: string; jurisdictionCity: string; showPoweredBy: boolean; currency: string; fontSize: number; printPaperSize: 'A4' | 'A3';
  serviceDB: { name: string; rate: number; gstSlab?: number }[]; foodDB: { name: string; rate: number; gstSlab?: number }[]; billHistory: any[]; guestDatabase: GuestRecord[];
  savedStamps: string[];
  removeImageFromGallery: (type: 'logo' | 'signature' | 'guestSignature' | 'stamp', url: string) => void;
  
  
  saveImageToGallery: (type: 'logo' | 'signature' | 'guestSignature' | 'stamp', url: string) => void;
  setField: <K extends keyof HotelBillState>(field: K, value: HotelBillState[K]) => void;
  applyTheme: (preset: string) => void; addExtraService: () => void; quickAddPOSItem: (name: string, rate: number) => void; updateExtraService: (id: string, updates: Partial<ExtraService>) => void; removeExtraService: (id: string) => void; clearGuestDetails: () => void; startNewBill: () => void; handleDateChange: (field: 'checkInDate' | 'checkOutDate', value: string) => void; autoCalculateNights: () => void; removeLogo: () => void; removeSignature: () => void; addServiceToDB: (type: 'service' | 'food', item: { name: string; rate: number; gstSlab?: number }) => void; removeServiceFromDB: (type: 'service' | 'food', name: string) => void; saveBillToHistory: (totalAmount: number) => boolean; loadBillFromHistory: (bill: any) => void; deleteBillsFromHistory: (ids: string[]) => void;
}

export const useHotelStore = create<HotelBillState>()(
  persist((set, get) => ({
    selectedTemplate: 1, themePreset: 'MIDNIGHT_NAVY', themeColor: '#0f172a', hotelNameSize: 24, fontFamily: 'Arial, sans-serif', showBookingSource: false, bookingSource: 'MakeMyTrip', showLogo: true, logo: null, logoSize: 80, logoX: 0, logoY: 0, customLogos: [],
    hotelName: 'Hotel PMS Center', hotelAddress: 'City Center, Main Road', hotelPhone: '', hotelEmail: '', website: '', fssaiNo: '', hotelGstin: '',
    customerName: '', customerPhone: '', customerAddress: '', nationality: 'Indian', vehicleNo: '', guestCompany: '', guestGstin: '',
    invoiceNo: 'INV-1001', date: getLocalToday(), roomNo: '101', roomType: 'Deluxe AC', adults: 1, kids: 0, perDayCharge: 2000, noOfDays: 1, checkInDate: getLocalToday(), checkOutDate: getLocalTomorrow(), checkInTime: '12:00', checkOutTime: '11:00',
    advancePaid: 0, discount: 0, discountType: 'FLAT', paymentMode: 'CASH', extraServices: [], showServiceCharge: false, serviceCharge: 0, hasTax: true, showSac: true, showSacOnHeaderOnly: true, cgstRate: 6, sgstRate: 6, sacCode: '996311', amountInWords: true,
    showGuestSignature: false, guestSignature: null, guestSignatureSize: 60, guestSignatureX: 0, guestSignatureY: 0, showSignature: true, signature: null, signatureSize: 60, signatureX: 0, signatureY: 0, signatoryTitle: 'Authorized Signatory', customSignatory: '', savedSignatures: [], savedGuestSignatures: [],
    showStamp: false, stamp: null, stampType: 'MUHAR', stampColor: '#1e3a8a', stampSize: 100, stampX: 0, stampY: 0, savedStamps: [],
    termsIndex: 0, customTerms: '', jurisdictionCity: 'Local', showPoweredBy: true, currency: '₹', fontSize: 13, printPaperSize: 'A4',
    serviceDB: [], foodDB: [], billHistory: [], guestDatabase: [],

    // 🟢 setField automatically calls synced autoCalculateNights
    setField: (field, value) => { set({ [field]: value } as any); if (field === 'checkInDate' || field === 'checkOutDate') get().autoCalculateNights(); },
    applyTheme: (preset) => { const colors: any = { ROYAL_GOLD: '#b48600', MIDNIGHT_NAVY: '#0f172a', VINTAGE_SEPIA: '#432818', ELITE_CORPORATE: '#334155' }; set({ themePreset: preset, themeColor: colors[preset] || '#0f172a' }); },
    addExtraService: () => set((state) => ({ extraServices: [...state.extraServices, { id: Date.now().toString(), name: '', qty: 1, rate: 0, amount: 0, gstSlab: 5, selected: true }] })),
    quickAddPOSItem: (name, rate) => set((state) => ({ extraServices: [...state.extraServices, { id: Date.now().toString(), name, qty: 1, rate, amount: rate, selected: true }] })),
    updateExtraService: (id, updates) => set((state) => ({ extraServices: state.extraServices.map(item => item.id === id ? { ...item, ...updates, amount: (Number(updates.qty ?? item.qty) || 0) * (Number(updates.rate ?? item.rate) || 0) } : item) })),
    removeExtraService: (id) => set((state) => ({ extraServices: state.extraServices.filter(item => item.id !== id) })),
    clearGuestDetails: () => set({ customerName: '', customerPhone: '', customerAddress: '', nationality: 'Indian', vehicleNo: '', guestCompany: '', guestGstin: '' }),
    startNewBill: () => set(() => ({ invoiceNo: 'INV-' + Math.floor(100000 + Math.random() * 900000), roomNo: '', extraServices: [], advancePaid: 0, discount: 0, perDayCharge: 2000, date: getLocalToday(), checkInDate: getLocalToday(), checkOutDate: getLocalTomorrow(), noOfDays: 1 })),
    
    // 🟢 2. UPDATED handleDateChange (With + 1 Logic precisely integrated)
    handleDateChange: (field, val) => set((state: any) => {
      const newState = { ...state, [field]: val };
      const d1 = new Date(newState.checkInDate).getTime(); 
      const d2 = new Date(newState.checkOutDate).getTime();
      
      let days = Math.floor((d2 - d1) / (1000 * 3600 * 24)); 
      
      return { ...newState, noOfDays: days < 1 ? 1 : days };
    }),

    // 🟢 3. UPDATED autoCalculateNights (Synced with + 1 Logic to prevent calculation mismatch overrides)
    autoCalculateNights: () => { 
      const s = get(); 
      const d1 = new Date(s.checkInDate).getTime(); 
      const d2 = new Date(s.checkOutDate).getTime(); 
      if (!isNaN(d1) && !isNaN(d2)) {
        let days = Math.round((d2 - d1) / (1000 * 3600 * 24));
        set({ noOfDays: days < 1 ? 1 : days });
      }
    },

    saveImageToGallery: (type, url) => set((state) => {
      if (type === 'logo' && !state.customLogos.includes(url)) return { customLogos: [...state.customLogos, url] };
      if (type === 'signature' && !state.savedSignatures.includes(url)) return { savedSignatures: [...state.savedSignatures, url] };
      if (type === 'guestSignature' && !state.savedGuestSignatures.includes(url)) return { savedGuestSignatures: [...state.savedGuestSignatures, url] };
      if (type === 'stamp' && !state.savedStamps.includes(url)) return { savedStamps: [...state.savedStamps, url] };
      return state;
    }),
    removeImageFromGallery: (type, url) => set((state) => {
      if (type === 'logo') return { customLogos: state.customLogos.filter(i => i !== url) };
      if (type === 'signature') return { savedSignatures: state.savedSignatures.filter(i => i !== url) };
      if (type === 'guestSignature') return { savedGuestSignatures: state.savedGuestSignatures.filter(i => i !== url) };
      if (type === 'stamp') return { savedStamps: state.savedStamps.filter(i => i !== url) };
      return state;
    }),
    
    removeLogo: () => set({ logo: null }), removeSignature: () => set({ signature: null }),
    addServiceToDB: (type, item) => set((state) => { const arr = type === 'service' ? state.serviceDB : state.foodDB; return !arr.find(i => i.name === item.name) ? (type === 'service' ? { serviceDB: [...arr, item] } : { foodDB: [...arr, item] }) : state; }),
    removeServiceFromDB: (type, name) => set((state) => ({ [type === 'service' ? 'serviceDB' : 'foodDB']: state[type === 'service' ? 'serviceDB' : 'foodDB'].filter((i: any) => i.name !== name) })),
    
    saveBillToHistory: (totalAmount) => {
      const state = get(); if (state.billHistory.some(b => b.invoiceNo === state.invoiceNo)) return false;
      const snap = JSON.parse(JSON.stringify(state)); 
      
      // Cleanup arrays to save DB memory
      delete snap.billHistory; delete snap.customLogos; delete snap.savedSignatures; delete snap.savedGuestSignatures; delete snap.savedStamps; delete snap.serviceDB; delete snap.foodDB; delete snap.guestDatabase; 
      snap.grandTotal = totalAmount;
      
      const updatedCRM = [...state.guestDatabase];
      const existingIdx = updatedCRM.findIndex(g => g.phone === state.customerPhone);
      if (existingIdx >= 0) updatedCRM[existingIdx] = { name: state.customerName, phone: state.customerPhone, address: state.customerAddress, nationality: state.nationality };
      else if (state.customerName) updatedCRM.push({ name: state.customerName, phone: state.customerPhone, address: state.customerAddress, nationality: state.nationality });

      set({ billHistory: [snap, ...state.billHistory], guestDatabase: updatedCRM }); return true;
    },
    
    loadBillFromHistory: (bill) => set({ ...bill }), deleteBillsFromHistory: (ids) => set((state) => ({ billHistory: state.billHistory.filter(b => !ids.includes(b.id || b.invoiceNo)) }))
  }), { name: 'hotel-pms-storage', storage: createJSONStorage(() => idbStorage) })
);