'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Fuel, Building2, Utensils, CarFront, Settings, LogOut, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 🟢 SMART ENGINE: Jaise hi Generator page par jayenge, menu automatically chhota ho jayega!
  useEffect(() => {
    if (pathname.includes('/generator')) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Fuel Station', href: '/generator/fuel', icon: <Fuel size={20} /> },
    { name: 'Hotel & Lodge', href: '/generator/hotel', icon: <Building2 size={20} /> },
    { name: 'Restaurant', href: '/generator/restaurant', icon: <Utensils size={20} /> },
    { name: 'Travels & Taxi', href: '/generator/travels', icon: <CarFront size={20} /> },
  ];

  return (
    <aside 
      className={`relative bg-[#0b1121] border-r border-slate-800 text-slate-300 min-h-screen transition-all duration-300 ease-in-out flex flex-col shadow-2xl z-50 ${isCollapsed ? 'w-[80px]' : 'w-64 shrink-0'}`}
    >
      {/* 🟢 Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="absolute -right-3 top-8 bg-amber-500 text-slate-900 p-1.5 rounded-full shadow-lg hover:bg-amber-400 transition-all z-50 border-2 border-[#0b1121]"
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
      </button>

      {/* Logo Section */}
      <div className={`p-5 flex items-center gap-3 ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <div className="bg-amber-500 text-slate-900 p-2 rounded-lg shrink-0">
          <LayoutGrid size={22} strokeWidth={2.5} />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-white font-black text-xl tracking-wider leading-none">BILLGENO</h1>
            <p className="text-amber-500 text-[9px] font-bold tracking-widest uppercase mt-0.5">Workspace</p>
          </div>
        )}
      </div>

      <div className={`px-6 mt-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 ${isCollapsed ? 'hidden' : 'block'}`}>
        Modules
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname.includes(item.href) && item.href !== '/' || pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div 
                title={isCollapsed ? item.name : ''} // Hover karne par naam dikhega jab chhota hoga
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${isActive ? 'bg-slate-800 text-amber-400 font-bold shadow-inner' : 'hover:bg-slate-800/50 hover:text-white font-medium'} ${isCollapsed ? 'justify-center' : ''}`}
              >
                <div className="shrink-0">{item.icon}</div>
                {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Settings */}
      <div className="p-3 border-t border-slate-800 space-y-1.5">
        <Link href="/settings">
          <div title={isCollapsed ? "Settings" : ""} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer hover:bg-slate-800/50 hover:text-white font-medium ${isCollapsed ? 'justify-center' : ''}`}>
            <Settings size={20} className="shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Settings</span>}
          </div>
        </Link>
        <button title={isCollapsed ? "Exit System" : ""} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer hover:bg-red-500/10 text-red-400 hover:text-red-500 font-bold ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Exit System</span>}
        </button>
      </div>
    </aside>
  );
}