'use client';

import HotelForm from '@/components/hotel/HotelForm';
import HotelPreview from '@/components/hotel/HotelPreview';

export default function HotelBillingPage() {
  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col lg:flex-row overflow-hidden font-sans">
      
      {/* LEFT PANEL: Form gets a generous STRICT width so it NEVER squishes */}
      <div className="w-full lg:w-[500px] xl:w-[600px] flex-shrink-0 h-full overflow-y-auto border-r border-slate-200 bg-white shadow-[8px_0_30px_rgba(0,0,0,0.03)] relative z-10 custom-scrollbar">
        <div className="p-6 md:p-8">
          <HotelForm />
        </div>
      </div>

      {/* RIGHT PANEL: Preview takes EXACTLY the remaining space */}
      <div className="flex-1 min-w-0 h-full bg-[#f1f5f9] p-4 lg:p-8 flex flex-col overflow-hidden relative">
        <HotelPreview />
      </div>
      
    </div>
  );
}