import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar"; // 🟢 Sidebar Import
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceMono = Space_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "700"], 
  variable: "--font-mono" 
});

export const metadata: Metadata = {
  title: "Billgeno Workspace",
  description: "Professional Offline Billing & POS System.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className={`${inter.variable} ${spaceMono.variable} font-sans antialiased h-full flex overflow-hidden`}>
        
        {/* 🟢 Persistent Elite Sidebar */}
        <Sidebar />

        {/* 🟢 Main Content Area (Forms & Previews will render here) */}
        <main className="flex-1 h-screen overflow-y-auto custom-scrollbar bg-slate-50 relative">
          {/* Subtle Background Pattern for Premium Feel */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 p-4 md:p-8">
            {children}
          </div>
        </main>
        
      </body>
    </html>
  );
}