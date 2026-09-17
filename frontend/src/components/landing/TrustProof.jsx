import React from 'react';
import { CheckCircleIcon } from '../studio/Icons';

export default function TrustProof() {
  const standards = [
    "ISO 14025:2006 Type III",
    "EN 15804+A2:2019",
    "ecoinvent v3.12 Cutoff",
    "UL 10010-4 Part B",
    "ILCD+EPD Data Format"
  ];

  return (
    <div className="lp-trust-banner">
      <div className="lp-container">
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#2C221E', letterSpacing: '-0.01em' }}>
            Built for manufacturers • LCA teams • Consultants
          </span>
        </div>

        <div className="lp-trust-grid" style={{ justifyContent: 'center', gap: '32px' }}>
          {standards.map((name, idx) => (
            <div key={idx} className="lp-trust-item">
              <span style={{ color: '#2E7D32', display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon size={16} />
              </span>
              <span style={{ fontSize: '13px', color: '#5C4E46', fontWeight: 600 }}>
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
