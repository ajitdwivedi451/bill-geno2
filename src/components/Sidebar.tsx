'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Fuel, Building2, Utensils, CarFront, Settings, LogOut } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Fuel Station', href: '/generator/fuel', icon: Fuel },
  { name: 'Hotel & Lodge', href: '/generator/hotel', icon: Building2 },
  { name: 'Restaurant', href: '/generator/restaurant', icon: Utensils },
  { name: 'Travels & Taxi', href: '/generator/travels', icon: CarFront },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col text-slate-300 hidden md:flex sticky top-0 print:hidden shadow-2xl">
      {/* Branding */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded-lg shadow-lg">
            <LayoutDashboard className="text-slate-900 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wider">BILLGENO</h1>
            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Workspace</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Modules</p>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className="block relative">
              {/* Animated Active Background */}
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-slate-800 border-l-4 border-amber-500 rounded-r-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <div className={`relative flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors z-10 ${isActive ? 'text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="text-sm">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
          <Settings className="w-4 h-4" /> <span className="text-sm font-medium">Settings</span>
        </button>
        <button className="flex items-center gap-3 px-3 py-2 w-full text-rose-400 hover:text-rose-300 transition-colors rounded-lg hover:bg-slate-800 mt-1">
          <LogOut className="w-4 h-4" /> <span className="text-sm font-medium">Exit System</span>
        </button>
      </div>
    </div>
  );
}