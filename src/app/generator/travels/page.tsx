'use client';

import TravelForm from '@/components/TravelForm';
import TravelPreview from '@/components/TravelPreview';

export default function TravelGeneratorPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Billgeno - Travels & Taxi</h1>
          <p className="text-slate-500">Generate professional trip invoices and instant POS receipts</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <TravelForm />
          </div>
          <div className="lg:col-span-6">
            <div className="sticky top-8">
              <TravelPreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}