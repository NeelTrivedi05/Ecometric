import React from 'react';

export default function BrandLogo({
  className = '',
  alt = 'EcoMetric',
  theme = 'light',
  variant = 'wordmark',
  height = 22,
  style = {},
}) {
  if (variant === 'symbol') {
    return (
      <img
        className={`brand-logo-symbol ${className}`}
        src="/brand-symbol.png"
        alt={alt}
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
          ...style,
        }}
      />
    );
  }

  const src = theme === 'dark' ? '/brand-wordmark.png' : '/brand-wordmark-dark.png';

  return (
    <img
      className={`brand-logo-image ${className}`}
      src={src}
      alt={alt}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        display: 'block',
        ...style,
      }}
    />
  );
}
