'use client';

import HotelForm from '@/components/HotelForm';
import HotelPreview from '@/components/HotelPreview';

export default function HotelGeneratorPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Billgeno - Hotel & Lodge</h1>
          <p className="text-slate-500">Create premium multi-format hotel and stay invoices</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel: Form */}
          <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <HotelForm />
          </div>

          {/* Right panel: Preview */}
          <div className="lg:col-span-6">
            <div className="sticky top-8">
              <HotelPreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}