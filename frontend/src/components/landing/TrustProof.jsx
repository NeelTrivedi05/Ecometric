import React from 'react';
import { CheckCircleIcon } from '../studio/Icons';

export default function TrustProof() {
  const standards = [
    "ISO 14025:2006 Type III",
    "EN 15804+A2:2019 Core PCR",
    "ecoinvent v3.12 Cut-off LCI",
    "PEF 3.0 / EF 3.1 Method",
    "openEPD & ILCD+EPD XML",
    "UL 10010-4 Part B PCR"
  ];

  return (
    <section className="product-tile-parchment" style={{ padding: '40px 0', borderTop: '1px solid var(--apple-hairline)', borderBottom: '1px solid var(--apple-hairline)' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--apple-ink)', letterSpacing: '-0.224px' }}>
            Built for environmental engineers, sustainability managers, and third-party LCA verifiers
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '16px 28px'
        }}>
          {standards.map((name, idx) => (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--apple-radius-pill)',
                backgroundColor: 'var(--apple-canvas)',
                border: '1px solid var(--apple-hairline)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--apple-ink)',
                letterSpacing: '-0.1px'
              }}
            >
              <CheckCircleIcon size={14} style={{ color: '#28cd41' }} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
