import React from 'react';
import logoUrl from '../assets/anarva-logo.jpg';

interface AnarvaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS: Record<NonNullable<AnarvaLogoProps['size']>, string> = {
  sm: 'h-9',
  md: 'h-11',
  lg: 'h-14',
};

/** Official Anarva Clinic logo (site/assets/images/logo.jpg). */
export const AnarvaLogo: React.FC<AnarvaLogoProps> = ({ className = '', size = 'md' }) => (
  <img
    src={logoUrl}
    alt="Anarva Clinic — Skin, Hair & Beauty"
    className={`${SIZE_CLASS[size]} w-auto object-contain select-none ${className}`}
  />
);
