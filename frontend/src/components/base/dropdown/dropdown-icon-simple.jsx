import React, { useState, useRef, useEffect } from 'react';
import { DotsVertical } from '@untitledui/icons';

export function DropdownIconSimple({
  items = [
    { label: 'Inspect EPD Details', action: 'inspect' },
    { label: 'Download PDF Declaration', action: 'download' },
    { label: 'Verify Cryptographic Lineage', action: 'verify' },
  ],
  onSelect,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item) => {
    setIsOpen(false);
    if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: '1px solid transparent',
          borderRadius: '6px',
          padding: '6px',
          color: '#5b6f62',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f2f6f0';
          e.currentTarget.style.borderColor = '#dfe7dd';
          e.currentTarget.style.color = '#16231b';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.color = '#5b6f62';
          }
        }}
        aria-label="More actions"
        title="More actions"
      >
        <DotsVertical size={16} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '4px',
            minWidth: '190px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #dfe7dd',
            boxShadow: '0 8px 24px -4px rgba(16, 52, 33, 0.12), 0 2px 6px rgba(16, 52, 33, 0.04)',
            zIndex: 1000,
            overflow: 'hidden',
            padding: '4px',
            animation: 'studioFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {items.map((item, idx) => (
            <button
              key={item.label || idx}
              type="button"
              onClick={() => handleItemClick(item)}
              style={{
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 500,
                color: item.destructive ? '#dc2626' : '#2f3b33',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = item.destructive ? '#fee2e2' : '#eef7f1';
                if (!item.destructive) e.currentTarget.style.color = '#1f7a4c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = item.destructive ? '#dc2626' : '#2f3b33';
              }}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DropdownIconSimple;
