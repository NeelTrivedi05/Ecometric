import React from 'react';
import { CheckCircleIcon, LeafIcon, FileIcon } from '../studio/Icons';

export default function Features() {
  const features = [
    {
      title: "Automated LCA",
      desc: "Instant component mapping and characterization without building manual technosphere supply-chain matrix inversions."
    },
    {
      title: "EPD generation",
      desc: "One-click generation of ISO 14025 Type III declarations compliant with EN 15804+A2 and product category rules."
    },
    {
      title: "Data validation",
      desc: "Built-in PCR validation gate enforcing mass cut-off rules (<1%), proxy data thresholds, and data quality ratings (DQR)."
    },
    {
      title: "Impact assessment",
      desc: "Dynamic calculation of 13 core environmental indicators across EF 3.1, TRACI 2.1, CML-IA 2016, and ReCiPe midpoint matrices."
    },
    {
      title: "PDF generation",
      desc: "Export 20–30 page third-party verifier ready publication PDFs complete with required indicator disclaimers and charts."
    },
    {
      title: "EPD management",
      desc: "Centralized project hub to manage product portfolios, track revision histories, and renew declarations over time."
    }
  ];

  return (
    <section style={{ padding: '80px 0', backgroundColor: '#FFFFFF', borderTop: '1px solid #EFE4D8', borderBottom: '1px solid #EFE4D8' }}>
      <div className="lp-container">
        <div className="section-header">
          <div className="section-badge">
            <span>Capabilities</span>
          </div>
          <h2 className="section-title">Features</h2>
          <p className="section-subtitle">
            Everything your team needs to model, validate, and publish verified environmental product declarations.
          </p>
        </div>

        <div className="lp-card-grid">
          {features.map((feat, idx) => (
            <div key={idx} className="lp-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ color: '#2E7D32', display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon size={18} />
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
                  {feat.title}
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#5C4E46', lineHeight: '1.6', margin: 0 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
