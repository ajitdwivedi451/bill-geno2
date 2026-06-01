import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '@/lib/storage';

export interface BillItem { id: string; name: string; qty: number; rate: number; amt: number; }
export interface Customer { name: string; phone: string; address: string; }
export interface MenuItem { name: string; rate: number; }

export interface RestaurantBillHistoryItem extends Partial<RestaurantBillState> {
  id: string; savedAt: string; grandTotal: number;
}

export interface RestaurantBillState {
  businessName: string; phone: string; address: string; fssaiNo: string; slogan: string;
  customerName: string; customerPhone: string; customerAddress: string;
  receiptNo: string; date: string; time: string;
  orderType: 'DINE-IN' | 'TAKEAWAY' | 'DELIVERY'; orderId: string;
  tableNo: string; pax: string; waiterName: string;
  items: BillItem[]; mealType: 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';
  breakfastMenu: MenuItem[]; lunchMenu: MenuItem[]; snacksMenu: MenuItem[]; dinnerMenu: MenuItem[];
  hasTax: boolean; cgstRate: number; sgstRate: number;
  hasServiceCharge: boolean; serviceChargeRate: number; packagingCharge: number;
  discountType: 'FLAT' | 'PERCENT'; discountValue: number;
  paymentMode: 'CASH' | 'ONLINE' | 'CARD' | 'SPLIT'; splitCash: number; splitOnline: number;
  logo: string | null; showLogo: boolean; watermark: string | null; showWatermark: boolean; watermarkPosition: 'LEFT' | 'BOTH';
  selectedTemplate: number; paperWidth: number; posFontSize: number;
  paperBackground: string; paperMode: 'COLOR' | 'PRESET' | 'CUSTOM'; selectedTexture: number; customPaperBG: string | null; receiptFont: string;
  savedLogos: string[]; savedWatermarks: string[]; savedPapers: string[]; savedCustomers: Customer[];
  billHistory: RestaurantBillHistoryItem[]; selectedBills: string[]; hasWarnedFont: boolean;

  setSelectedBills: (bills: string[]) => void;
  setField: <K extends keyof RestaurantBillState>(field: K, value: RestaurantBillState[K]) => void;
  addItem: () => void; updateItem: (id: string, updatedFields: Partial<BillItem>) => void; removeItem: (id: string) => void;
  saveCustomer: () => void;
  addMenuItem: (mealType: string, item: MenuItem) => void; removeMenuItem: (mealType: string, name: string) => void;
  
  // 🟢 NAYA: Meal Time Engine
  changeMealType: (type: 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER') => void;

  setLogo: (url: string) => void; removeLogo: () => void; saveLogoToGallery: (url: string) => void; deleteLogoFromGallery: (i: number) => void;
  setWatermark: (url: string) => void; removeWatermark: () => void; saveWatermarkToGallery: (url: string) => void; deleteWatermarkFromGallery: (i: number) => void;
  savePaperToGallery: (url: string) => void; deletePaperFromGallery: (i: number) => void;

  startNewBill: () => void; saveBillToHistory: (grandTotal: number) => boolean; deleteBillsFromHistory: (ids: string[]) => void; loadBillFromHistory: (bill: Partial<RestaurantBillState>) => void;
}

export const useRestaurantStore = create<RestaurantBillState>()(
  persist((set, get) => ({
    businessName: 'THE ROYAL SPICE', phone: '9876543210', address: '12, Main Street, Civil Lines\nPatna, Bihar 800001', fssaiNo: '10421000000123', slogan: 'Thank you, Visit again !!',
    customerName: 'Walk-in Guest', customerPhone: '', customerAddress: '',
    receiptNo: '1001', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    orderType: 'DINE-IN', orderId: '', tableNo: '4', pax: '2', waiterName: 'Raju',
    items: [{ id: crypto.randomUUID(), name: 'Paneer Butter Masala', qty: 1, rate: 240, amt: 240 }, { id: crypto.randomUUID(), name: 'Tandoori Roti', qty: 2, rate: 20, amt: 40 }, { id: crypto.randomUUID(), name: 'Water Bottle', qty: 1, rate: 20, amt: 20 }],
    mealType: 'LUNCH',
    
    breakfastMenu: [{name: 'Poha', rate: 40}, {name: 'Masala Dosa', rate: 80}, {name: 'Idli Sambar', rate: 50}, {name: 'Tea', rate: 15}, {name: 'Water Bottle', rate: 20}],
    lunchMenu: [{name: 'Special Thali', rate: 180}, {name: 'Paneer Butter Masala', rate: 240}, {name: 'Dal Makhani', rate: 160}, {name: 'Tandoori Roti', rate: 20}, {name: 'Water Bottle', rate: 20}],
    snacksMenu: [{name: 'Samosa', rate: 20}, {name: 'French Fries', rate: 90}, {name: 'Veg Burger', rate: 110}, {name: 'Cold Coffee', rate: 80}, {name: 'Water Bottle', rate: 20}],
    dinnerMenu: [{name: 'Chicken Tikka', rate: 320}, {name: 'Mutton Biryani', rate: 350}, {name: 'Veg Pulao', rate: 150}, {name: 'Tandoori Roti', rate: 20}, {name: 'Water Bottle', rate: 20}],

    hasTax: true, cgstRate: 2.5, sgstRate: 2.5, hasServiceCharge: false, serviceChargeRate: 5, packagingCharge: 0,
    discountType: 'FLAT', discountValue: 0, paymentMode: 'CASH', splitCash: 0, splitOnline: 0,

    logo: null, showLogo: true, watermark: null, showWatermark: false, watermarkPosition: 'BOTH',
    selectedTemplate: 1, paperWidth: 300, posFontSize: 12, paperBackground: '#fdfcf8', paperMode: 'PRESET', selectedTexture: 1, customPaperBG: null, receiptFont: "'Courier New', Courier, monospace",
    hasWarnedFont: false, savedLogos: [], savedWatermarks: [], savedPapers: [], savedCustomers: [], billHistory: [], selectedBills: [],

    setSelectedBills: (bills) => set({ selectedBills: bills }), setField: (field, value) => set((state) => ({ ...state, [field]: value })),
    addItem: () => set((state) => ({ items: [...state.items, { id: crypto.randomUUID(), name: '', qty: 1, rate: 0, amt: 0 }] })),
    updateItem: (id, fields) => set((state) => ({ items: state.items.map((item) => item.id === id ? { ...item, ...fields, amt: (fields.qty ?? item.qty) * (fields.rate ?? item.rate) } : item) })),
    removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

    saveCustomer: () => set((state) => {
      if(!state.customerName || state.customerName === 'Walk-in Guest') return state;
      const newCust = { name: state.customerName, phone: state.customerPhone, address: state.customerAddress };
      const filtered = state.savedCustomers.filter(c => c.name !== newCust.name);
      return { savedCustomers: [newCust, ...filtered].slice(0, 5) };
    }),

    addMenuItem: (mealType, item) => set((state: any) => { const menuKey = mealType.toLowerCase() + 'Menu'; return { [menuKey]: [...state[menuKey], item] }; }),
    removeMenuItem: (mealType, name) => set((state: any) => { const menuKey = mealType.toLowerCase() + 'Menu'; return { [menuKey]: state[menuKey].filter((i: any) => i.name !== name) }; }),

    // 🟢 BUG FIX: Auto Meal Time Changer
    changeMealType: (type) => {
      const tDate = new Date();
      let h = tDate.getHours();
      if (type === 'BREAKFAST') h = Math.floor(Math.random()*(11-8+1))+8;
      else if (type === 'LUNCH') h = Math.floor(Math.random()*(15-12+1))+12;
      else if (type === 'DINNER') h = Math.floor(Math.random()*(22-19+1))+19;
      else h = Math.floor(Math.random()*(18-16+1))+16;
      const m = Math.floor(Math.random()*60);
      const rTime = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
      set({ mealType: type, time: rTime });
    },

    setLogo: (url) => set({ logo: url }), removeLogo: () => set({ logo: null }), saveLogoToGallery: (url) => set((s) => ({ savedLogos: [url, ...s.savedLogos.filter(l => l !== url)].slice(0, 6) })), deleteLogoFromGallery: (i) => set((s) => ({ savedLogos: s.savedLogos.filter((_, idx) => idx !== i) })),
    setWatermark: (url) => set({ watermark: url }), removeWatermark: () => set({ watermark: null }), saveWatermarkToGallery: (url) => set((s) => ({ savedWatermarks: [url, ...s.savedWatermarks.filter(l => l !== url)].slice(0, 6) })), deleteWatermarkFromGallery: (i) => set((s) => ({ savedWatermarks: s.savedWatermarks.filter((_, idx) => idx !== i) })),
    savePaperToGallery: (url) => set((s) => ({ savedPapers: [url, ...s.savedPapers.filter(p => p !== url)].slice(0, 6) })), deletePaperFromGallery: (i) => set((s) => ({ savedPapers: s.savedPapers.filter((_, idx) => idx !== i) })),

    startNewBill: () => {
      const state = get();
      let nextReceipt = state.receiptNo;
      const match = state.receiptNo.match(/\d+(?=\D*$)/);
      if (match) {
        const numStr = match[0];
        const nextNum = String(parseInt(numStr, 10) + 1).padStart(numStr.length, '0');
        const lastIdx = state.receiptNo.lastIndexOf(numStr);
        nextReceipt = state.receiptNo.substring(0, lastIdx) + nextNum + state.receiptNo.substring(lastIdx + numStr.length);
      } else nextReceipt = state.receiptNo + '1';
      
      const orderIds = ['ZOM', 'SWG', 'EAT', 'DLV'];
      const ranOrd = `${orderIds[Math.floor(Math.random()*4)]}${Math.floor(100000 + Math.random()*900000)}`;
      const waiters = ['Raju', 'Chhotu', 'Amit', 'Prakash'];
      const wName = waiters[Math.floor(Math.random()*waiters.length)];
      const tDate = new Date();
      let h = tDate.getHours();
      if (state.mealType === 'BREAKFAST') h = Math.floor(Math.random()*(11-8+1))+8;
      else if (state.mealType === 'LUNCH') h = Math.floor(Math.random()*(15-12+1))+12;
      else if (state.mealType === 'DINNER') h = Math.floor(Math.random()*(22-19+1))+19;
      else h = Math.floor(Math.random()*(18-16+1))+16;
      const m = Math.floor(Math.random()*60);
      const rTime = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;

      set({ 
        receiptNo: nextReceipt, customerName: 'Walk-in Guest', customerPhone: '', customerAddress: '',
        orderId: ranOrd, tableNo: Math.floor(1 + Math.random() * 20).toString(), waiterName: wName, pax: Math.floor(1+Math.random()*4).toString(),
        items: [{ id: crypto.randomUUID(), name: '', qty: 1, rate: 0, amt: 0 }, { id: crypto.randomUUID(), name: 'Tandoori Roti', qty: 2, rate: 20, amt: 40 }, { id: crypto.randomUUID(), name: 'Water Bottle', qty: 1, rate: 20, amt: 20 }], 
        discountValue: 0, packagingCharge: 0, splitCash: 0, splitOnline: 0, date: tDate.toISOString().split('T')[0], time: rTime
      });
    },

    saveBillToHistory: (grandTotal) => {
      const state = get();
      get().saveCustomer(); 
      const isDuplicate = state.billHistory.some(b => b.receiptNo === state.receiptNo && b.date === state.date);
      if (isDuplicate) return false;
      const newBill: RestaurantBillHistoryItem = {
        id: `rest_${Date.now()}`, savedAt: new Date().toISOString(), grandTotal, businessName: state.businessName, phone: state.phone, address: state.address, fssaiNo: state.fssaiNo,
        customerName: state.customerName, customerPhone: state.customerPhone, customerAddress: state.customerAddress, receiptNo: state.receiptNo, date: state.date, time: state.time, orderType: state.orderType, orderId: state.orderId,
        tableNo: state.tableNo, pax: state.pax, waiterName: state.waiterName, items: state.items, mealType: state.mealType, hasTax: state.hasTax, cgstRate: state.cgstRate, sgstRate: state.sgstRate, hasServiceCharge: state.hasServiceCharge,
        serviceChargeRate: state.serviceChargeRate, packagingCharge: state.packagingCharge, discountType: state.discountType, discountValue: state.discountValue, paymentMode: state.paymentMode, splitCash: state.splitCash, splitOnline: state.splitOnline, selectedTemplate: state.selectedTemplate,
        paperWidth: state.paperWidth, posFontSize: state.posFontSize, paperBackground: state.paperBackground, paperMode: state.paperMode, selectedTexture: state.selectedTexture, customPaperBG: state.customPaperBG, receiptFont: state.receiptFont, showLogo: state.showLogo, logo: state.logo, showWatermark: state.showWatermark,
        watermark: state.watermark, watermarkPosition: state.watermarkPosition, slogan: state.slogan
      };
      set((s) => ({ billHistory: [newBill, ...s.billHistory] }));
      return true;
    },
    
    deleteBillsFromHistory: (ids) => set((state) => ({ billHistory: state.billHistory.filter(b => !ids.includes(b.id)), selectedBills: [] })),
    
    loadBillFromHistory: (bill) => set((state) => {
      const safeBill = { ...bill };
      delete (safeBill as any).billHistory; delete (safeBill as any).savedLogos; delete (safeBill as any).savedWatermarks;
      delete (safeBill as any).savedPapers; delete (safeBill as any).savedCustomers; delete (safeBill as any).selectedBills;
      delete (safeBill as any).breakfastMenu; delete (safeBill as any).lunchMenu; delete (safeBill as any).snacksMenu; delete (safeBill as any).dinnerMenu;
      // 🟢 BUG FIX: Maintain Default POS Paper Size when viewing older bills
      delete (safeBill as any).paperWidth; delete (safeBill as any).posFontSize; delete (safeBill as any).receiptFont;
      return { ...state, ...safeBill };
    })
  }), { name: 'restaurant-bill-storage', storage: createJSONStorage(() => idbStorage) })
);