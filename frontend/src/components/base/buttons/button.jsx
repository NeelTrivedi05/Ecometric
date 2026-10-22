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
      backgroundColor: 'var(--accent)',
      color: 'var(--color-neutral-0)',
      border: '1px solid var(--accent-hover)',
      boxShadow: 'var(--shadow-xs)',
    },
    secondary: {
      backgroundColor: 'var(--bg-card)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xs)',
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: 'var(--text-muted)',
      border: '1px solid transparent',
    },
    destructive: {
      backgroundColor: 'var(--error-soft)',
      color: 'var(--error)',
      border: '1px solid var(--error)',
    },
  }[color] || {
    backgroundColor: 'var(--accent)',
    color: 'var(--color-neutral-0)',
    border: '1px solid var(--accent-hover)',
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
          e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
        } else if (color === 'secondary') {
          e.currentTarget.style.backgroundColor = 'var(--bg-card2)';
          e.currentTarget.style.borderColor = 'var(--border-bright)';
        } else if (color === 'tertiary') {
          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--accent)';
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (color === 'primary') {
          e.currentTarget.style.backgroundColor = 'var(--accent)';
        } else if (color === 'secondary') {
          e.currentTarget.style.backgroundColor = 'var(--bg-card)';
          e.currentTarget.style.borderColor = 'var(--border)';
        } else if (color === 'tertiary') {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
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
