'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Utensils, Building2, Fuel, CarFront, MonitorCheck, Activity } from 'lucide-react';

export default function HomePage() {
  const generators = [
    { name: 'Fuel Station POS', description: 'Thermal POS fuel receipts with real textures.', icon: <Fuel className="w-8 h-8 text-emerald-600" />, href: '/generator/fuel', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    { name: 'Hotel & Lodge', description: 'A4 Invoices & Check-out folios (11 Formats).', icon: <Building2 className="w-8 h-8 text-indigo-600" />, href: '/generator/hotel', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
    { name: 'Restaurant & Dhaba', description: 'Thermal POS food bills with GST & items.', icon: <Utensils className="w-8 h-8 text-orange-600" />, href: '/generator/restaurant', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    { name: 'Travels & Taxi', description: 'Duty slips, CAB invoices & distance billing.', icon: <CarFront className="w-8 h-8 text-amber-600" />, href: '/generator/travels', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' }
  ];

  // Animation Variants
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Top Status Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-3 rounded-xl shadow-lg">
            <MonitorCheck className="text-amber-400 w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Welcome to Billgeno</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Master Workspace Dashboard</p>
          </div>
        </div>
        <div className="hidden md:flex text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 items-center gap-2 shadow-sm">
          <Activity size={14} className="text-emerald-500 animate-pulse" />
          System Online (Local IndexedDB)
        </div>
      </motion.div>

      {/* Modules Grid */}
      <motion.div 
        variants={container} initial="hidden" animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
      >
        {generators.map((gen) => (
          <motion.div key={gen.name} variants={item}>
            <Link href={gen.href}>
              <div className={`flex items-center p-6 rounded-2xl border-2 ${gen.borderColor} bg-white hover:${gen.bgColor} hover:border-transparent hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full group`}>
                <div className={`p-4 rounded-2xl shadow-sm mr-5 group-hover:scale-110 transition-transform duration-300 ${gen.bgColor}`}>
                  {gen.icon}
                </div>
                <div className="flex flex-col justify-center">
                  <h2 className="text-xl font-black text-slate-900 mb-1">{gen.name}</h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{gen.description}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-12 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 Billgeno | Elite Offline Workspace</p>
      </motion.div>
    </div>
  );
}