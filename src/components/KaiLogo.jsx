import React from 'react';

/**
 * Authentic PT Kereta Api Indonesia (Persero) Logo Component
 * Matches the official identity seen in KAI official documents
 */
export default function KaiLogo({ className = "h-8 w-auto", showText = false }) {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg 
        viewBox="0 0 160 70" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto drop-shadow-xs"
      >
        {/* Letter K & Left Orange Accent */}
        <g id="kai-brandmark">
          {/* K - Vertical Stem (Deep Blue) */}
          <path
            d="M 12 10 L 32 10 L 18 60 L -2 60 Z"
            fill="#003580"
          />
          {/* K - Upper Arm (Deep Blue) */}
          <path
            d="M 28 32 L 48 10 L 68 10 L 42 38 Z"
            fill="#003580"
          />
          {/* Orange Dynamic Slash (Center Accent of K) */}
          <path
            d="M 33 26 L 50 10 L 62 10 L 41 33 Z"
            fill="#EE7623"
          />
          {/* K - Lower Leg (Deep Blue) */}
          <path
            d="M 35 34 L 62 60 L 42 60 L 22 41 Z"
            fill="#003580"
          />

          {/* Letter A (Orange & Blue) */}
          {/* Left Slant (Deep Blue) */}
          <path
            d="M 72 60 L 88 10 L 102 10 L 86 60 Z"
            fill="#003580"
          />
          {/* Right Slant (Orange) */}
          <path
            d="M 94 10 L 110 60 L 96 60 L 88 34 Z"
            fill="#EE7623"
          />
          {/* A - Crossbar (Orange) */}
          <path
            d="M 79 40 L 98 40 L 96 46 L 77 46 Z"
            fill="#EE7623"
          />

          {/* Letter I (Deep Blue) */}
          <path
            d="M 118 10 L 136 10 L 122 60 L 104 60 Z"
            fill="#003580"
          />
          {/* Dot/Top Accent of I (Orange dynamic diamond) */}
          <path
            d="M 132 10 L 144 10 L 138 20 L 126 20 Z"
            fill="#EE7623"
          />
        </g>
      </svg>
      {showText && (
        <div className="flex flex-col text-left leading-none font-sans">
          <span className="text-[13px] font-black tracking-widest text-[#003580]">
            KERETA API
          </span>
          <span className="text-[9px] font-bold tracking-wider text-[#EE7623]">
            INDONESIA
          </span>
        </div>
      )}
    </div>
  );
}
