import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const dimensions = {
    sm: { width: 140, height: 50 },
    md: { width: 220, height: 80 },
    lg: { width: 320, height: 110 },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 280 100"
        width={dimensions.width}
        height={dimensions.height}
        fill="currentColor"
      >
        {/* Mountain Silhouette Line */}
        <path
          d="M 10 50 Q 40 38 70 48 T 130 45 T 190 35 T 270 52"
          fill="none"
          stroke="#1c663c"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 25 51 Q 65 38 105 45 T 185 36 T 255 51"
          fill="none"
          stroke="#c5a059"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* CLUB CAMPESTRE Text */}
        <text
          x="140"
          y="28"
          textAnchor="middle"
          fontSize="20"
          fontWeight="bold"
          fontFamily="Outfit, sans-serif"
          letterSpacing="4"
          fill="#ffffff"
        >
          CLUB CAMPESTRE
        </text>

        {/* LOURDES Text with golf ball O */}
        <g transform="translate(15, 60)">
          {/* L */}
          <text x="5" y="30" fontSize="34" fontWeight="800" fontFamily="Outfit, sans-serif" fill="#1c663c">L</text>
          
          {/* Golf Ball (O) */}
          <g transform="translate(48, 14)">
            {/* Ball */}
            <circle cx="8" cy="11" r="9" fill="#ffffff" stroke="#1c663c" strokeWidth="1.5" />
            {/* Dimples on Golf ball */}
            <circle cx="5" cy="8" r="0.8" fill="#1c663c" />
            <circle cx="8" cy="7" r="0.8" fill="#1c663c" />
            <circle cx="11" cy="8" r="0.8" fill="#1c663c" />
            <circle cx="5" cy="11" r="0.8" fill="#1c663c" />
            <circle cx="8" cy="11" r="0.8" fill="#1c663c" />
            <circle cx="11" cy="11" r="0.8" fill="#1c663c" />
            <circle cx="6" cy="14" r="0.8" fill="#1c663c" />
            <circle cx="8" cy="15" r="0.8" fill="#1c663c" />
            <circle cx="10" cy="14" r="0.8" fill="#1c663c" />
          </g>

          {/* URDES */}
          <text x="80" y="30" fontSize="34" fontWeight="800" fontFamily="Outfit, sans-serif" fill="#1c663c" letterSpacing="2">URDES</text>
        </g>
      </svg>
    </div>
  );
}
