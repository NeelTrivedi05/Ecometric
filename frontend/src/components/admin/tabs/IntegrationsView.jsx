import React from 'react';
import { Link01, Check } from '@untitledui/icons';

export default function IntegrationsView() {
  const integrations = [
    {
      name: 'ecoinvent v3.12 Cloud API',
      category: 'LCI Background Database',
      description: 'Global certified supply chain background dataset with 26,500+ unit and system activities.',
      status: 'Connected',
      badge: 'Platinum Tier 1',
    },
    {
      name: 'Supabase Postgres Tenant Storage',
      category: 'Cloud Storage & RLS',
      description: 'Multi-tenant isolated bucket storage for uploaded Bill of Materials (BOM) Excel and CAD drawings.',
      status: 'Active',
      badge: 'RLS Isolated',
    },
    {
      name: 'EcoPlatform / UL Solutions EPD Sync',
      category: 'EPD Registry',
      description: 'Direct publishing connector to international Type III Environmental Product Declaration registries.',
      status: 'Connected',
      badge: 'EN 15804+A2',
    },
    {
      name: 'Autodesk Revit BIM Connector',
      category: 'CAD / PLM Pipeline',
      description: 'Extract building material mass schedules and schedule revisions directly into LCA assemblies.',
      status: 'Available',
      badge: 'v2026 Compatible',
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
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--accent, #1f7a4c)',
          }}
        >
          Ecosystem & Connectors
        </span>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '4px 0 0' }}>
          Connected Integrations
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
          Seamlessly link upstream PLM material data, certified background databases, and EPD program operators.
        </p>
      </div>

      {/* Integrations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
        {integrations.map((item, idx) => {
          const isConnected = item.status === 'Connected' || item.status === 'Active';
          return (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-card, #ffffff)',
                borderRadius: '16px',
                border: '1px solid var(--border, #dfe7dd)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: 0 }}>
                      {item.name}
                    </h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>{item.category}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: isConnected ? '#eaf7ee' : 'var(--bg-card2, #f8faf6)',
                      color: isConnected ? 'var(--accent, #1f7a4c)' : 'var(--text-muted, #5b6f62)',
                      border: `1px solid ${isConnected ? '#c3e8cd' : 'var(--border, #dfe7dd)'}`,
                    }}
                  >
                    {item.status}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary, #2f3b33)', lineHeight: 1.45, margin: '8px 0 16px' }}>
                  {item.description}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border, #dfe7dd)' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(31, 122, 76, 0.08)',
                    color: 'var(--accent, #1f7a4c)',
                  }}
                >
                  {item.badge}
                </span>

                <button
                  type="button"
                  onClick={() => alert(`Configuring ${item.name}`)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent, #1f7a4c)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

