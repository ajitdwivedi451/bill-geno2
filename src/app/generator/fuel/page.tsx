'use client';

import {FuelForm} from '@/components/FuelForm';
import {FuelPreview} from '@/components/FuelPreview';

export default function FuelGeneratorPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Billgeno - Fuel Station POS</h1>
          <p className="text-slate-500">Ultra-realistic thermal receipts with dynamic width & bank watermarks</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel: Form */}
          <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <FuelForm />
          </div>

          {/* Right panel: Preview */}
          <div className="lg:col-span-6">
            <div className="sticky top-8">
              <FuelPreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}