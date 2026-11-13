import React from 'react';

/** Sharp brutalist geometric 'K' crest emblem shared across Storefront, AI Stylist, and Admin Studio. */
export function KronosLogo({ className = 'w-6 h-5' }) {
  return (
    <svg viewBox="0 0 36 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Left Pillar - Faceted Architectural Column */}
      <path d="M 4 2 L 12 2 L 12 30 L 4 30 Z" fill="#EA301F" />
      <path d="M 4 2 L 7.5 2 L 7.5 30 L 4 30 Z" fill="#FFFFE3" />
      <path d="M 10 2 L 12 2 L 12 30 L 10 30 Z" fill="#B0180B" />

      {/* Upper Blade - Angled Crest Wing */}
      <path d="M 14 14 L 25 2 L 33 2 L 19 17 Z" fill="#EA301F" />
      <path d="M 14 14 L 20 7.5 L 28 7.5 L 19 17 Z" fill="#FFFFE3" />

      {/* Lower Blade - Interlocking Dynamic Stance */}
      <path d="M 16 14.5 L 33 30 L 25 30 L 12 18 Z" fill="#EA301F" />
      <path d="M 16 14.5 L 21 19.5 L 29 30 L 25 30 Z" fill="#FFFFE3" />

      {/* Core Geometric Fold Accent */}
      <polygon points="12,13 16,14.5 14,18 12,18" fill="#FFFFE3" />
    </svg>
  );
}

export const RawlineFoldedLogo = KronosLogo;
export default KronosLogo;

