import React from 'react';

export default function BrandLogo({ className = '', alt = 'EcoMetric logo' }) {
  return <img className={`brand-logo-image ${className}`} src="/brand-symbol.png" alt={alt} />;
}
