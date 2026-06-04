'use client';
import React from 'react';

interface EliteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const EliteInput: React.FC<EliteInputProps> = ({ label, ...props }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <input 
      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm font-medium text-slate-800" 
      {...props} 
    />
  </div>
);