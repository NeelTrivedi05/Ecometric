import React from 'react';
import { CreditCard01 } from '@untitledui/icons';

export default function BillingView() {
  const invoices = [
    { id: 'INV-2026-003', date: 'Oct 01, 2026', amount: '$1,250.00', status: 'Paid', pdf: 'epd-invoice-oct.pdf' },
    { id: 'INV-2026-002', date: 'Sep 01, 2026', amount: '$1,250.00', status: 'Paid', pdf: 'epd-invoice-sep.pdf' },
    { id: 'INV-2026-001', date: 'Aug 01, 2026', amount: '$1,250.00', status: 'Paid', pdf: 'epd-invoice-aug.pdf' },
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
          Payment & Invoicing
        </span>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '4px 0 0' }}>
          Billing & Invoices
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
          Manage your organization payment methods, billing contact, and download calculation receipts.
        </p>
      </div>

      {/* Payment Method Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          padding: '24px 28px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '0 0 16px' }}>
          Payment Method
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-card2, #f8faf6)',
            border: '1px solid var(--border, #dfe7dd)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(31, 122, 76, 0.08)',
                color: 'var(--accent, #1f7a4c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard01 size={22} />
            </span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>
                Corporate Mastercard ending in 4242
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>
                Expires 12/2028 • Default payment card
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert('Update card flow modal')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border, #dfe7dd)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent, #1f7a4c)',
              cursor: 'pointer',
            }}
          >
            Update
          </button>
        </div>
      </div>

      {/* Invoice History Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border, #dfe7dd)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: 0 }}>
            Past Invoices
          </h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-card2, #f8faf6)', borderBottom: '1px solid var(--border, #dfe7dd)' }}>
              <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Invoice</th>
              <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Billing Date</th>
              <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Amount</th>
              <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Status</th>
              <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)', textAlign: 'right' }}>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} style={{ borderBottom: '1px solid var(--border, #dfe7dd)' }}>
                <td style={{ padding: '14px 24px', fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>{inv.id}</td>
                <td style={{ padding: '14px 24px', color: 'var(--text-muted, #5b6f62)' }}>{inv.date}</td>
                <td style={{ padding: '14px 24px', fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>{inv.amount}</td>
                <td style={{ padding: '14px 24px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: '#eaf7ee',
                      color: 'var(--accent, #1f7a4c)',
                    }}
                  >
                    {inv.status}
                  </span>
                </td>
                <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => alert(`Downloading ${inv.pdf}...`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent, #1f7a4c)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

