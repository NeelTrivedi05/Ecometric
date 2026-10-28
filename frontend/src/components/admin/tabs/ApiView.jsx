import React, { useState } from 'react';
import { Key01, Check } from '@untitledui/icons';

export default function ApiView() {
  const [copied, setCopied] = useState(false);
  const apiKey = 'eco_live_9f83a4c10e8b27d4c81a95e7b23f';

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
          Developer Platform
        </span>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '4px 0 0' }}>
          API Keys & Webhooks
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
          Programmatically trigger LCA calculations, export EPD verifier packages, and sync BOM data.
        </p>
      </div>

      {/* API Key Box */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          padding: '24px 28px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '0 0 6px' }}>
          Production Secret Key
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '0 0 16px' }}>
          Never share this key in client-side code or public repositories. Scoped strictly to your tenant via RLS.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', maxWidth: '640px' }}>
          <input
            type="password"
            readOnly
            value={apiKey}
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-card2, #f8faf6)',
              border: '1px solid var(--border, #dfe7dd)',
              borderRadius: '8px 0 0 8px',
              fontSize: '13px',
              color: 'var(--text-primary, #16231b)',
              flex: 1,
              outline: 'none',
              fontFamily: 'monospace',
            }}
          />
          <button
            type="button"
            onClick={copyKey}
            style={{
              padding: '10px 18px',
              backgroundColor: 'var(--accent, #1f7a4c)',
              color: '#ffffff',
              border: '1px solid var(--accent, #1f7a4c)',
              borderRadius: '0 8px 8px 0',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <span>Copy Key</span>
            )}
          </button>
        </div>
      </div>

      {/* Webhooks Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          padding: '24px 28px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '0 0 6px' }}>
          Webhooks Endpoint
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '0 0 16px' }}>
          Deliver real-time HTTP payloads whenever an EPD status transitions to Published or Verified.
        </p>

        <input
          type="url"
          readOnly
          value="https://api.carrier.com/webhooks/ecometric/epd-status"
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-card2, #f8faf6)',
            border: '1px solid var(--border, #dfe7dd)',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--text-primary, #16231b)',
            width: '100%',
            maxWidth: '640px',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

