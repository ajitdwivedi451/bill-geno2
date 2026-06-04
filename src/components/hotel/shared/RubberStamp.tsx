'use client';
import React from 'react';
import { HotelBillState } from '@/store/useHotelStore';

export const RubberStamp = ({ data }: { data: Partial<HotelBillState> }) => {
  if (!data.showStamp) return null;
  const sX = data.stampX !== undefined ? data.stampX : 50;
  const sY = data.stampY !== undefined ? data.stampY : 50;
  
  return (
    <div style={{ position: 'absolute', top: `${sY}%`, left: `${sX}%`, transform: 'translate(-50%, -50%) rotate(-15deg)', zIndex: 50, pointerEvents: 'none', opacity: 0.85, mixBlendMode: 'multiply' }}>
      {data.stampType === 'MUHAR' ? (
        <svg viewBox="0 0 200 200" width={data.stampSize || 150} height={data.stampSize || 150} style={{ filter: 'drop-shadow(0px 0px 0.5px rgba(0,0,0,0.3))' }}>
          <circle cx="100" cy="100" r="95" stroke={data.stampColor} strokeWidth="3" fill="none" strokeDasharray="590 5" />
          <circle cx="100" cy="100" r="88" stroke={data.stampColor} strokeWidth="1.5" fill="none" />
          <circle cx="100" cy="100" r="60" stroke={data.stampColor} strokeWidth="1" fill="none" />
          <path id="curve" d="M 25, 100 A 75, 75 0 1, 1 175, 100" fill="transparent" />
          <path id="curveBottom" d="M 175, 100 A 75, 75 0 0, 1 25, 100" fill="transparent" />
          <text fill={data.stampColor} fontWeight="900" fontSize="18" letterSpacing="1"><textPath href="#curve" startOffset="50%" textAnchor="middle">{(data.hotelName || '').substring(0,24).toUpperCase()}</textPath></text>
          <text fill={data.stampColor} fontWeight="bold" fontSize="16" letterSpacing="2"><textPath href="#curveBottom" startOffset="50%" textAnchor="middle">{(data.jurisdictionCity || '').toUpperCase()}</textPath></text>
          <text x="100" y="105" textAnchor="middle" fill={data.stampColor} fontWeight="900" fontSize="18">★ SEAL ★</text>
        </svg>
      ) : (
        <div style={{ border: `4px solid ${data.stampColor}`, color: data.stampColor, padding: '10px 20px', borderRadius: '10px', fontSize: `${(data.stampSize || 150)/4}px`, fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', background: 'transparent' }}>
          {data.stampType === 'PAID' ? 'PAID IN FULL' : data.stampType === 'DUE' ? 'CASH DUE' : 'CANCELLED'}
        </div>
      )}
    </div>
  );
};