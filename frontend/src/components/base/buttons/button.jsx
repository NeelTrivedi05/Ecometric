import React from 'react';

/**
 * Button component adhering to DESIGN.md nature-led tokens.
 * Primary: Forest Emerald (#1f7a4c)
 * Secondary: Pure Crisp Canvas (#ffffff) with Hairline Divider (#dfe7dd)
 */
export function Button({
  children,
  size = 'md',
  color = 'primary',
  iconLeading: IconLeading,
  iconTrailing: IconTrailing,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  style = {},
  ...props
}) {
  const sizeStyles = {
    sm: {
      height: '34px',
      minHeight: '34px',
      maxHeight: '34px',
      padding: '0 12px',
      fontSize: '12px',
      gap: '6px',
      borderRadius: '8px',
      iconSize: 14,
    },
    md: {
      height: '38px',
      minHeight: '38px',
      maxHeight: '38px',
      padding: '0 16px',
      fontSize: '13px',
      gap: '8px',
      borderRadius: '8px',
      iconSize: 16,
    },
    lg: {
      height: '42px',
      minHeight: '42px',
      maxHeight: '42px',
      padding: '0 20px',
      fontSize: '14px',
      gap: '8px',
      borderRadius: '10px',
      iconSize: 18,
    },
  }[size] || {
    height: '38px',
    minHeight: '38px',
    maxHeight: '38px',
    padding: '0 16px',
    fontSize: '13px',
    gap: '8px',
    borderRadius: '8px',
    iconSize: 16,
  };

  const colorStyles = {
    primary: {
      backgroundColor: '#1f7a4c',
      color: '#ffffff',
      border: '1px solid #1a6b42',
      boxShadow: '0 1px 2px rgba(16, 52, 33, 0.14)',
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: '#2f3b33',
      border: '1px solid #dfe7dd',
      boxShadow: '0 1px 2px rgba(16, 52, 33, 0.04)',
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: '#5b6f62',
      border: '1px solid transparent',
    },
    destructive: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      border: '1px solid #fecaca',
    },
  }[color] || {
    backgroundColor: '#1f7a4c',
    color: '#ffffff',
    border: '1px solid #1a6b42',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn-nature ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        boxSizing: 'border-box',
        margin: 0,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        fontFamily: "'Google Sans Flex', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        ...sizeStyles,
        ...colorStyles,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (color === 'primary') {
          e.currentTarget.style.backgroundColor = '#176640';
        } else if (color === 'secondary') {
          e.currentTarget.style.backgroundColor = '#f8faf6';
          e.currentTarget.style.borderColor = '#c8d4c6';
        } else if (color === 'tertiary') {
          e.currentTarget.style.backgroundColor = '#eef7f1';
          e.currentTarget.style.color = '#1f7a4c';
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (color === 'primary') {
          e.currentTarget.style.backgroundColor = '#1f7a4c';
        } else if (color === 'secondary') {
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.borderColor = '#dfe7dd';
        } else if (color === 'tertiary') {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#5b6f62';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(0.97)';
      }}
      onMouseUp={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(1)';
      }}
      {...props}
    >
      {IconLeading && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: sizeStyles.iconSize,
            height: sizeStyles.iconSize,
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          <IconLeading
            size={sizeStyles.iconSize}
            className="flex-shrink-0"
            style={{ width: sizeStyles.iconSize, height: sizeStyles.iconSize, flexShrink: 0, display: 'block' }}
          />
        </span>
      )}
      {children && (
        <span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
          {children}
        </span>
      )}
      {IconTrailing && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: sizeStyles.iconSize,
            height: sizeStyles.iconSize,
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          <IconTrailing
            size={sizeStyles.iconSize}
            className="flex-shrink-0"
            style={{ width: sizeStyles.iconSize, height: sizeStyles.iconSize, flexShrink: 0, display: 'block' }}
          />
        </span>
      )}
    </button>
  );
}

export default Button;
