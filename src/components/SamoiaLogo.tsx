import React from 'react';

export default function SamoiaLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Circle glyph icon with horizontal line and dot */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        className="w-7 h-7 sm:w-9 sm:h-9 text-white shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      >
        <circle cx="50" cy="50" r="40" />
        <line x1="10" y1="50" x2="90" y2="50" />
        <circle cx="50" cy="70" r="4.5" fill="currentColor" />
      </svg>

      {/* Brand Text Stack */}
      <div className="relative flex flex-col justify-center">
        <span 
          className="text-sm sm:text-lg font-bold tracking-[0.22em] uppercase text-white leading-none font-sans"
          style={{ textShadow: "0 2px 10px rgba(255,255,255,0.1)" }}
        >
          SAMOIA EXPERT
        </span>
        <span 
          className="font-script text-base sm:text-2xl text-gold-copper lowercase tracking-wide leading-none absolute -bottom-3 sm:-bottom-4.5 right-1 pointer-events-none select-none"
          style={{ fontFamily: "'Alex Brush', cursive", transform: "rotate(-4deg)" }}
        >
          Acceleration
        </span>
      </div>
    </div>
  );
}
