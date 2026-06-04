'use client';

import HotelForm from '@/components/hotel/HotelForm';
import HotelPreview from '@/components/hotel/HotelPreview';

export default function HotelBillingPage() {
  return (
    // 🟢 PRINT HACK: print:h-auto print:overflow-visible ensures the browser prints all pages
    <div className="h-screen w-full bg-slate-50 flex flex-col lg:flex-row overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white print:block">
      
      {/* LEFT SIDEBAR (Form) - 🟢 PRINT HACK: print:hidden removes it during print */}
      <div className="w-full lg:w-[500px] xl:w-[600px] flex-shrink-0 h-full overflow-y-auto border-r border-slate-200 bg-white shadow-sm relative z-10 custom-scrollbar print:hidden">
        <div className="p-6 md:p-8">
          <HotelForm />
        </div>
      </div>

      {/* RIGHT SIDEBAR (Preview) - 🟢 PRINT HACK: Removes padding/margins during print */}
      <div className="flex-1 min-w-0 h-full bg-slate-100 p-4 lg:p-8 flex flex-col overflow-hidden relative print:p-0 print:m-0 print:block print:overflow-visible">
        <HotelPreview />
      </div>

    </div>
  );
}