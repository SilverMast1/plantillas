import React from 'react';
import brandingConfig from '../config/branding.json';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const dimensions = {
    sm: { width: 140, height: 45, textMain: 'text-base', textSub: 'text-[9px]' },
    md: { width: 200, height: 60, textMain: 'text-xl', textSub: 'text-xs' },
    lg: { width: 280, height: 80, textMain: 'text-2xl', textSub: 'text-sm' },
  }[size];

  // Si se configuró una URL de imagen para el logo
  if (brandingConfig.logoUrl) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img
          src={brandingConfig.logoUrl}
          alt={brandingConfig.appName}
          style={{ height: dimensions.height, objectFit: 'contain' }}
        />
      </div>
    );
  }

  // Logo por defecto basado en texto y colores de la marca
  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-md border border-amber-400/30">
        {brandingConfig.companyName.charAt(0) || 'P'}
      </div>
      <div className="flex flex-col">
        <span className={`font-extrabold tracking-tight text-white ${dimensions.textMain}`}>
          {brandingConfig.companyName}
        </span>
        <span className={`text-slate-400 font-medium tracking-wider uppercase ${dimensions.textSub}`}>
          {brandingConfig.tagline}
        </span>
      </div>
    </div>
  );
}
