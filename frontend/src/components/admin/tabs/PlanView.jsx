import React from 'react';
import { Package, Check, Shield01 } from '@untitledui/icons';

export default function PlanView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px' }}>
      {/* Header Card */}
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
          Subscription & Capacity
        </span>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '4px 0 0' }}>
          Organization Plan & Quotas
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
          Review active LCA calculation limits, third-party verifier seats, and ISO compliance entitlements.
        </p>
      </div>

      {/* Plan Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          padding: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(31, 122, 76, 0.08)',
                color: 'var(--accent, #1f7a4c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={20} />
            </span>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: 0 }}>
                Enterprise Verified LCI
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>
                Billed annually • Renews Dec 31, 2026
              </span>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary, #2f3b33)', lineHeight: 1.5, margin: '14px 0 20px' }}>
            Full access to ISO 14025, EN 15804+A2, and UL 10010-4 Part B calculation engines with verified supply chain background datasets.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'Unlimited Life Cycle Assessment (LCA) models',
              'Automated Type III EPD verification package generation',
              'Multi-tenant PostgreSQL Row-Level Security tenant isolation',
              'Verified ecoinvent v3.12 Cut-off database integration',
              'Dedicated third-party verifier review portal with secure tokens',
            ].map((feature, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary, #2f3b33)' }}>
                <span style={{ color: 'var(--accent, #1f7a4c)', display: 'flex' }}><Check size={16} /></span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: '#eaf7ee',
              color: 'var(--accent, #1f7a4c)',
              border: '1px solid #c3e8cd',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Active & Verified
          </span>

          <button
            type="button"
            onClick={() => alert('Your Enterprise subscription is managed via your enterprise contract.')}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border, #dfe7dd)',
              color: 'var(--text-secondary, #2f3b33)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Manage Enterprise Agreement
          </button>
        </div>
      </div>
    </div>
  );
}

