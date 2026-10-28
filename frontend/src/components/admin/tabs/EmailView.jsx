import React, { useState } from 'react';
import { Mail01, Check } from '@untitledui/icons';

export default function EmailView() {
  const [preferences, setPreferences] = useState({
    calcComplete: true,
    verifierReview: true,
    pcrAlert: true,
    monthlySummary: false,
  });

  const [saved, setSaved] = useState(false);

  const toggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
          Delivery Preferences
        </span>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '4px 0 0' }}>
          Email Notifications
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
          Configure transactional and status updates delivered to team members and verifiers.
        </p>
      </div>

      {saved && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#eaf7ee',
            border: '1px solid #c3e8cd',
            borderRadius: '8px',
            color: 'var(--accent, #1f7a4c)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={16} />
          <span>Email preferences updated successfully.</span>
        </div>
      )}

      {/* Preferences List */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>
              LCA Calculation Completed
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>
              Receive an email when TRACI 2.1 or EN 15804 impact characterization batches complete.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.calcComplete}
            onChange={() => toggle('calcComplete')}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent, #1f7a4c)', cursor: 'pointer' }}
          />
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border, #dfe7dd)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>
              Verifier Review Status Alerts
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>
              Instant notification when an external verifier leaves comments or signs an EPD verification package.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.verifierReview}
            onChange={() => toggle('verifierReview')}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent, #1f7a4c)', cursor: 'pointer' }}
          />
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border, #dfe7dd)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>
              PCR Compliance & Cut-Off Warnings
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>
              Alert when a project model exceeds mass or energy cut-off thresholds (&gt;1% single, &gt;5% total).
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.pcrAlert}
            onChange={() => toggle('pcrAlert')}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent, #1f7a4c)', cursor: 'pointer' }}
          />
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border, #dfe7dd)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>
              Monthly Executive Sustainability Report
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>
              Aggregated monthly overview of embodied carbon tracked and published declarations.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.monthlySummary}
            onChange={() => toggle('monthlySummary')}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent, #1f7a4c)', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent, #1f7a4c)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Save Email Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

