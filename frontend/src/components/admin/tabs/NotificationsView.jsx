import React from 'react';
import { Bell01, Shield01, Check } from '@untitledui/icons';

export default function NotificationsView() {
  const notifications = [
    {
      id: 'notif-1',
      title: 'PostgreSQL Row-Level Security Isolation Activated',
      description: 'Zero cross-tenant leakage policy is actively enforced across all LCA models, calculations, and materials.',
      timestamp: 'Today at 02:15 PM',
      isUnread: true,
      category: 'Security & RLS',
    },
    {
      id: 'notif-2',
      title: '24-Hour Active Presence Heartbeat Synchronized',
      description: 'Your user presence session is preserved for 24 hours with automatic security logout on inactivity.',
      timestamp: 'Today at 11:30 AM',
      isUnread: true,
      category: 'Authentication',
    },
    {
      id: 'notif-3',
      title: 'Carrier Syracuse Facility LCI Baseline Linked',
      description: 'Regional electricity grid mix US-NYUP and natural gas cogeneration emission factors verified.',
      timestamp: 'Yesterday at 04:45 PM',
      isUnread: false,
      category: 'Domain Data',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--accent, #1f7a4c)',
            }}
          >
            System Activity
          </span>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '4px 0 0' }}>
            Notifications
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
            Real-time compliance alerts, security events, and organization updates.
          </p>
        </div>

        <span
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: '#eaf7ee',
            color: 'var(--accent, #1f7a4c)',
            border: '1px solid #c3e8cd',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          2 Unread
        </span>
      </div>

      {/* Notifications List */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {notifications.map((item, idx) => (
            <div
              key={item.id}
              style={{
                padding: '20px 24px',
                borderBottom: idx !== notifications.length - 1 ? '1px solid var(--border, #dfe7dd)' : 'none',
                backgroundColor: item.isUnread ? 'rgba(31, 122, 76, 0.02)' : 'transparent',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: item.isUnread ? 'rgba(31, 122, 76, 0.1)' : 'var(--bg-card2, #f8faf6)',
                  color: item.isUnread ? 'var(--accent, #1f7a4c)' : 'var(--text-muted, #5b6f62)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Bell01 size={18} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>
                      {item.title}
                    </span>
                    {item.isUnread && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent, #1f7a4c)' }} />
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>{item.timestamp}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary, #2f3b33)', lineHeight: 1.45, margin: '2px 0 6px' }}>
                  {item.description}
                </p>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-card2, #f8faf6)',
                    color: 'var(--text-muted, #5b6f62)',
                    border: '1px solid var(--border, #dfe7dd)',
                  }}
                >
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

