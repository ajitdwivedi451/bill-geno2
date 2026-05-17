'use client';

import { useRestaurantStore } from '@/store/useBillStore';
import { Plus, Trash2 } from 'lucide-react';

export default function RestaurantForm() {
  const store = useRestaurantStore();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2">Business Details</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Restaurant Name</label>
          <input 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={store.businessName} 
            onChange={(e) => store.setField('businessName', e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={store.phone} 
            onChange={(e) => store.setField('phone', e.target.value)} 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea 
          rows={2}
          placeholder="e.g., Shop No 5, Main Market..."
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          value={store.address} 
          onChange={(e) => store.setField('address', e.target.value)} 
        />
      </div>

      <h2 className="text-xl font-semibold border-b pb-2 mt-6">Bill Details</h2>
      
      {/* Customer Name & Receipt No */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Customer Name</label>
          <input 
            className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
            value={store.customerName} 
            onChange={(e) => store.setField('customerName', e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Receipt No</label>
          <input 
            className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
            value={store.receiptNo} 
            onChange={(e) => store.setField('receiptNo', e.target.value)} 
          />
        </div>
      </div>

      {/* Date, Time & Payment Mode Added Here */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input 
            type="date"
            className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
            value={store.date} 
            onChange={(e) => store.setField('date', e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time</label>
          <input 
            type="time"
            className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
            value={store.time} 
            onChange={(e) => store.setField('time', e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Payment Mode</label>
          <select 
            className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={store.paymentMode}
            onChange={(e) => store.setField('paymentMode', e.target.value)}
          >
            <option value="CASH">CASH</option>
            <option value="ONLINE">ONLINE</option>
            <option value="CARD">CARD</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between border-b pb-2 mt-6">
        <h2 className="text-xl font-semibold">Items</h2>
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="taxToggle"
            checked={store.hasTax}
            onChange={(e) => store.setField('hasTax', e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <label htmlFor="taxToggle" className="text-sm font-medium cursor-pointer">Apply GST (CGST/SGST)</label>
        </div>
      </div>

      {/* Dynamic Items Array */}
      <div className="space-y-3">
        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-slate-500">
          <div className="col-span-5">Item Name</div>
          <div className="col-span-2">Qty</div>
          <div className="col-span-3">Rate (₹)</div>
          <div className="col-span-2 text-center">Action</div>
        </div>
        
        {store.items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5">
              <input 
                className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Item name"
                value={item.name}
                onChange={(e) => store.updateItem(item.id, { name: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <input 
                type="number"
                className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                value={item.qty || ''}
                onChange={(e) => store.updateItem(item.id, { qty: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-3">
              <input 
                type="number"
                className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                value={item.rate || ''}
                onChange={(e) => store.updateItem(item.id, { rate: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <button 
                onClick={() => store.removeItem(item.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        <button 
          onClick={store.addItem}
          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 mt-2 transition-colors"
        >
          <Plus size={16} className="mr-1" /> Add New Item
        </button>
      </div>
    </div>
  );
}