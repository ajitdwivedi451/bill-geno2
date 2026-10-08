'use client';
import React, { useId } from 'react';
import { HotelBillState } from '@/store/useHotelStore';

export const RubberStamp = ({ data }: { data: Partial<HotelBillState> }) => {
  const topPathId = useId();
  const bottomPathId = useId();

  if (!data.showStamp) return null;

  const sX = data.stampX ?? 50;
  const sY = data.stampY ?? 50;
  const stampSize = data.stampSize || 150;
  const hotelName = (data.hotelName || '').toUpperCase();
  const city = (data.jurisdictionCity || '').toUpperCase(); // Location variable

  return (
    <div
      style={{
        position: 'absolute',
        top: `${sY}%`,
        left: `${sX}%`,
        transform: 'translate(-50%, -50%) rotate(-15deg)',
        zIndex: 50,
        pointerEvents: 'none',
        opacity: 0.85,
        mixBlendMode: 'multiply',
      }}
    >
      {data.stampType === 'MUHAR' ? (
        <svg
          viewBox="0 0 200 200"
          width={stampSize}
          height={stampSize}
          style={{ filter: 'drop-shadow(0px 0px 0.5px rgba(0,0,0,0.3))' }}
        >
          {/* Outer and Inner Rings */}
          <circle cx="100" cy="100" r="95" stroke={data.stampColor} strokeWidth="3" fill="none" strokeDasharray="590 5" />
          <circle cx="100" cy="100" r="88" stroke={data.stampColor} strokeWidth="1.5" fill="none" />
          <circle cx="100" cy="100" r="60" stroke={data.stampColor} strokeWidth="1" fill="none" />
          
          <defs>
            {/* Top Arc Path (Clockwise) */}
            <path id={topPathId} d="M 30, 100 A 70, 70 0 1, 1 170, 100" fill="transparent" />
            {/* Bottom Arc Path (Counter-Clockwise to keep text upright) */}
            <path id={bottomPathId} d="M 170, 100 A 70, 70 0 0, 1 30, 100" fill="transparent" />
          </defs>
          
          {/* 1. TOP TEXT: Hotel Name */}
          <text fill={data.stampColor} fontWeight="900" fontSize="18" letterSpacing="1.2">
            <textPath 
              href={`#${topPathId}`} 
              startOffset="50%" 
              textAnchor="middle"
              textLength={hotelName.length > 20 ? "200" : undefined}
              lengthAdjust="spacingAndGlyphs"
            >
              {hotelName}
            </textPath>
          </text>
          
          {/* Side Separator Stars */}
          <text fill={data.stampColor} fontSize="20" fontWeight="900" x="18" y="106" textAnchor="middle">★</text>
          <text fill={data.stampColor} fontSize="20" fontWeight="900" x="182" y="106" textAnchor="middle">★</text>
          
          {/* 2. BOTTOM TEXT: Location (City) - Fixed Here */}
          <text fill={data.stampColor} fontWeight="bold" fontSize="16" letterSpacing="1.5">
            <textPath 
              href={`#${bottomPathId}`} 
              startOffset="50%" 
              textAnchor="middle"
              textLength={city.length > 15 ? "180" : undefined}
              lengthAdjust="spacingAndGlyphs"
            >
              {city} 
            </textPath>
          </text>
          
          {/* 3. CENTER TEXT: Paid */}
          <text x="100" y="105" textAnchor="middle" fill={data.stampColor} fontWeight="900" fontSize="18">
            PAID
          </text>
        </svg>
      ) : (
        <div
          style={{
            border: `4px solid ${data.stampColor}`,
            color: data.stampColor,
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: `${stampSize / 4}px`,
            fontWeight: '900',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            background: 'transparent',
          }}
        >
          {data.stampType === 'PAID'
            ? 'PAID IN FULL'
            : data.stampType === 'DUE'
            ? 'CASH DUE'
            : 'CANCELLED'}
        </div>
      )}
    </div>
  );
};