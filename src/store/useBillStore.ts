import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval'; // 🟢 IndexedDB imports

// --- Helper: Custom IndexedDB Storage for Zustand ---
// यह बड़ी फाइल्स (Base64 Images) को बिना Quota Error के सेव करेगा
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

// --- Restaurant Bill Store ---

export interface BillItem {
  id: string;
  name: string;
  qty: number;
  rate: number;
  amt: number;
}

interface RestaurantBillState {
  businessName: string;
  phone: string;
  address: string;
  customerName: string;
  receiptNo: string;
  date: string;
  time: string;
  items: BillItem[];
  hasTax: boolean;
  cgstRate: number;
  sgstRate: number;
  paymentMode: 'ONLINE' | 'CASH' | 'CARD';
  setField: (field: string, value: any) => void;
  addItem: () => void;
  updateItem: (id: string, updatedFields: Partial<BillItem>) => void;
  removeItem: (id: string) => void;
}

export const useRestaurantStore = create<RestaurantBillState>()(
  persist(
    (set) => ({
      businessName: 'Shri Krishna Dhaba',
      phone: '09430411789',
      address: '',
      customerName: 'Praveen Dubey',
      receiptNo: '45',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      items: [
        { id: '1', name: 'Aloo paratha', qty: 2, rate: 110, amt: 220 },
        { id: '2', name: 'Tea', qty: 2, rate: 10, amt: 20 },
      ],
      hasTax: false,
      cgstRate: 2.5,
      sgstRate: 2.5,
      paymentMode: 'ONLINE',

      setField: (field, value) => set((state) => ({ ...state, [field]: value })),
      addItem: () => set((state) => ({ items: [...state.items, { id: crypto.randomUUID(), name: '', qty: 1, rate: 0, amt: 0 }] })),
      updateItem: (id, updatedFields) => set((state) => {
        const updatedItems = state.items.map((item) => {
          if (item.id === id) {
            const merged = { ...item, ...updatedFields };
            merged.amt = merged.qty * merged.rate;
            return merged;
          }
          return item;
        });
        return { items: updatedItems };
      }),
      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
    }),
    { name: 'restaurant-bill-storage' }
  )
);

// --- Hotel Bill Store ---
export interface ExtraService {
  id: string;
  name: string;
  qty: number;
  rate: number;
  amount: number;
}

interface HotelBillState {
  hotelName: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  invoiceNo: string;
  date: string;
  roomNo: string;
  roomType: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  noOfDays: number;
  perDayCharge: number;
  
  currency: string;
  logo: string | null;
  showLogo: boolean;
  customLogos: string[]; 
  signature: string | null;
  showSignature: boolean;
  customBackground: string | null; 
  advancePaid: number;
  discountType: 'FLAT' | 'PERCENT';
  extraServices: ExtraService[];
  
  serviceCharge: number;
  hasTax: boolean;
  cgstRate: number;
  sgstRate: number;
  discount: number;
  paymentMode: string;
  selectedTemplate: number;
  themeColor: string;
  fontFamily: string;
  showServiceCharge: boolean;
  showPoweredBy: boolean;
  
  setField: (field: string, value: any) => void;
  addCustomLogo: (logoBase64: string) => void; 
  addExtraService: () => void;
  updateExtraService: (id: string, updatedFields: Partial<ExtraService>) => void;
  removeExtraService: (id: string) => void;
  startNewBill: () => void;
  clearGuestDetails: () => void; 
}

export const useHotelStore = create<HotelBillState>()(
  persist(
    (set) => ({
      hotelName: 'Hotel Royal Palace',
      phone: '09876543210',
      email: 'contact@royalpalace.com',
      address: '12, VIP Road, Near Station, Patna',
      gstin: '10AAAAA0000A1Z5',
      customerName: 'Amit Kumar',
      customerPhone: '9876543211',
      customerAddress: 'Gomti Nagar, Lucknow',
      
      invoiceNo: 'INV-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toISOString().split('T')[0],
      roomNo: Math.floor(100 + Math.random() * 900).toString(),
      
      roomType: 'Deluxe AC Room',
      checkInDate: new Date().toISOString().split('T')[0],
      checkInTime: '12:00',
      checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      checkOutTime: '11:00',
      noOfDays: 1,
      perDayCharge: 2500,
      
      currency: '₹',
      logo: null,
      showLogo: true,
      customLogos: [], 
      signature: null,
      showSignature: true,
      customBackground: null, 
      advancePaid: 500,
      discountType: 'FLAT',
      extraServices: [],

      serviceCharge: 150,
      hasTax: true,
      cgstRate: 6,
      sgstRate: 6,
      discount: 0,
      paymentMode: 'ONLINE',
      selectedTemplate: 1,
      themeColor: '#1e293b',
      fontFamily: 'font-sans',
      showServiceCharge: false,
      showPoweredBy: true,

      setField: (field, value) => set((state) => ({ ...state, [field]: value })),
      
      addCustomLogo: (logoBase64) => set((state) => ({
        customLogos: Array.from(new Set([logoBase64, ...state.customLogos])) 
      })),

      addExtraService: () => set((state) => ({
        extraServices: [...state.extraServices, { id: crypto.randomUUID(), name: '', qty: 1, rate: 0, amount: 0 }]
      })),
      updateExtraService: (id, updatedFields) => set((state) => ({
        extraServices: state.extraServices.map(item => item.id === id ? { ...item, ...updatedFields } : item)
      })),
      removeExtraService: (id) => set((state) => ({
        extraServices: state.extraServices.filter(item => item.id !== id)
      })),

      startNewBill: () => set(() => ({
        invoiceNo: 'INV-' + Math.floor(100000 + Math.random() * 900000),
        roomNo: Math.floor(100 + Math.random() * 900).toString(),
        extraServices: [],
        advancePaid: 0,
        discount: 0,
        date: new Date().toISOString().split('T')[0],
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      })),

      clearGuestDetails: () => set(() => ({
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      }))
    }),
    { 
      name: 'hotel-bill-storage',
      // 🟢 Note: Hotel images might still hit limit if you upload too many customLogos, 
      // but keeping it as is since you didn't ask to change Hotel persistence yet.
    }
  )
);

// --- Fuel POS Bill Store ---

// --- Fuel POS Bill Store ---

interface FuelBillState {
  stationName: string;
  address: string;
  phone: string;
  gstin: string;
  roCode: string;
  
  receiptNo: string;
  txnId: string;        
  fccId: string;
  fipNo: string;
  nozzleNo: string;
  product: string;
  density: string;     
  presetType: 'Amount' | 'Volume';
  uom: string; // 🟢 NAYA: Unit of Measure (L, Litre, Ltr)
  
  rate: number;
  amount: number;
  volume: number;
  
  vehicleNo: string;
  mobileNo: string;
  date: string;
  time: string;
  paymentMode: string;
  
  logo: string | null; 
  showLogo: boolean;
  watermark: string | null; 
  showWatermark: boolean;
  
  selectedTemplate: number;
  paperWidth: number; 
  posFontSize: number; // 🟢 NAYA: Font Size Control
  paperBackground: string; 
  paperMode: 'COLOR' | 'PRESET' | 'CUSTOM'; 
  selectedTexture: number; 
  customPaperBG: string | null; 
  receiptFont: string;     
  
  setField: (field: string, value: any) => void;
  calculateVolume: (amt: number, rt: number) => void;
  startNewBill: () => void;
  clearAll: () => void;
}

export const useFuelStore = create<FuelBillState>()(
  persist(
    (set, get) => ({
      stationName: 'PRIYANKA SERVICE STATION',
      address: 'SECTOR 12 ROHINI\nDELHI 110085',
      phone: '01127571143',
      gstin: '07220306483',
      roCode: '00024735',
      
      receiptNo: 'D2363',
      txnId: '6242805',
      fccId: '00000000000491205',
      fipNo: '04',
      nozzleNo: '04',
      product: 'Petrol',
      density: '733.3',
      presetType: 'Amount',
      uom: 'Litre', // 🟢 Default UoM
      
      rate: 96.72,
      amount: 4441.38,
      volume: 45.92,
      
      vehicleNo: '', 
      mobileNo: '',  
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      paymentMode: 'CASH',
      
      logo: null,
      showLogo: true,
      watermark: null,
      showWatermark: true,
      
      selectedTemplate: 1, 
      paperWidth: 280, 
      posFontSize: 12, // 🟢 Default Font Size
      paperBackground: '#fdfcf8', 

      paperMode: 'PRESET', 
      selectedTexture: 3,  
      customPaperBG: null,
      
      receiptFont: "'Courier New', Courier, monospace", 
      
      setField: (field, value) => set((state) => ({ ...state, [field]: value })),
      
      calculateVolume: (amt, rt) => {
        const vol = rt > 0 ? (amt / rt) : 0;
        set({ amount: amt, rate: rt, volume: Number(vol.toFixed(3)) });
      },
      
      startNewBill: () => {
        const currentReceipt = get().receiptNo;
        const numPart = currentReceipt.match(/\d+$/);
        let nextReceipt = currentReceipt + '1';
        if (numPart) {
          const num = parseInt(numPart[0], 10) + 1;
          nextReceipt = currentReceipt.replace(/\d+$/, String(num).padStart(numPart[0].length, '0'));
        }
        set({
          receiptNo: nextReceipt,
          vehicleNo: '',
          mobileNo: '',
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        });
      },
      
      clearAll: () => set({ vehicleNo: '', mobileNo: '', amount: 0, volume: 0 })
    }),
    { 
      name: 'fuel-bill-idb-storage',
      storage: createJSONStorage(() => idbStorage), 
    }
  )
);

// --- Travels & Taxi Bill Store ---

// --- Travels & Taxi Bill Store ---

interface TravelBillState {
  agencyName: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  
  invoiceNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  
  startLocation: string;
  endLocation: string;
  startDate: string;
  endDate: string;
  
  vehicleType: string;
  vehicleNo: string;
  driverName: string;
  
  startKm: number;
  endKm: number;
  totalKm: number;
  ratePerKm: number;
  
  tollsParking: number;
  driverAllowance: number;
  otherCharges: number;
  advancePaid: number;
  discount: number;
  taxRate: number; 
  hasTax: boolean;
  
  paymentMode: string;
  logo: string | null;
  showLogo: boolean;
  signature: string | null;
  showSignature: boolean;
  
  selectedTemplate: number;
  themeColor: string;
  currency: string;
  
  setField: (field: string, value: any) => void;
  calculateKm: (start: number, end: number) => void;
  startNewBill: () => void;
  startNewCustomer: () => void; // 🟢 NAYA: For completely new customer
}

export const useTravelStore = create<TravelBillState>()(
  persist(
    (set, get) => ({
      agencyName: 'ROYAL CAB & TRAVELS',
      address: 'Shop No. 12, Main Market, Station Road\nBhabua, Bihar - 821101',
      phone: '09876543210',
      email: '', 
      gstin: '', 
      
      invoiceNo: 'RCT-2026-809',
      date: new Date().toISOString().split('T')[0],
      customerName: 'Rahul Verma',
      customerPhone: '', 
      
      startLocation: 'Bhabua',
      endLocation: 'Varanasi Airport',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      
      vehicleType: 'Toyota Innova Crysta',
      vehicleNo: 'BR 45 X 1234',
      driverName: 'Ramesh Singh',
      
      startKm: 15420,
      endKm: 15645,
      totalKm: 225,
      ratePerKm: 14,
      
      tollsParking: 250,
      driverAllowance: 300,
      otherCharges: 0,
      advancePaid: 1000,
      discount: 0,
      taxRate: 5,
      hasTax: false,
      
      paymentMode: 'UPI / ONLINE',
      logo: null,
      showLogo: true,
      signature: null,
      showSignature: true,
      
      selectedTemplate: 1, 
      themeColor: '#eab308', 
      currency: '₹',
      
      setField: (field, value) => set((state) => ({ ...state, [field]: value })),
      
      calculateKm: (start, end) => {
        const total = end > start ? end - start : 0;
        set({ startKm: start, endKm: end, totalKm: total });
      },
      
      // 🟢 Keeps customer details same, just updates Inv, Date, KM
      startNewBill: () => {
        const currentReceipt = get().invoiceNo;
        const numPart = currentReceipt.match(/\d+$/);
        let nextReceipt = currentReceipt + '1';
        if (numPart) {
          const num = parseInt(numPart[0], 10) + 1;
          nextReceipt = currentReceipt.replace(/\d+$/, String(num).padStart(numPart[0].length, '0'));
        }
        set({
          invoiceNo: nextReceipt,
          startKm: get().endKm, 
          endKm: get().endKm,
          totalKm: 0,
          advancePaid: 0, tollsParking: 0, driverAllowance: 0, otherCharges: 0,
          date: new Date().toISOString().split('T')[0],
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        });
      },

      // 🟢 Clears customer details too
      startNewCustomer: () => {
        get().startNewBill(); // Run normal bill reset first
        set({ customerName: '', customerPhone: '' }); // Then clear customer
      }
    }),
    { 
      name: 'travel-bill-idb-storage',
      storage: createJSONStorage(() => idbStorage), 
    }
  )
);