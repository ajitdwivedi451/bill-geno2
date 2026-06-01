'use client';

import {RestaurantForm} from '@/components/RestaurantForm';
import {RestaurantPreview} from '@/components/RestaurantPreview';

export default function RestaurantGeneratorPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Billgeno - Restaurant & Dhaba</h1>
          <p className="text-slate-500">Generate instant POS/Thermal receipts</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Form (Takes up 7 columns) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <RestaurantForm />
          </div>

          {/* Right Panel: Live Preview (Takes up 5 columns & sticks to top) */}
          <div className="lg:col-span-5">
            <div className="sticky top-8">
              <RestaurantPreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}