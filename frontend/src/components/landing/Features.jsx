import React from 'react';
import { CheckCircleIcon } from '../studio/Icons';

export default function Features() {
  const features = [
    {
      title: "Automated LCA modeling",
      desc: "Instant component mapping and characterization without building manual technosphere supply-chain matrix inversions."
    },
    {
      title: "EPD generation in minutes",
      desc: "One-click generation of ISO 14025 Type III declarations compliant with EN 15804+A2 and product category rules."
    },
    {
      title: "Automated PCR validation",
      desc: "Built-in PCR validation gate enforcing mass cut-off rules (<1%), proxy data thresholds, and data quality ratings (DQR)."
    },
    {
      title: "Multi-indicator impact assessment",
      desc: "Dynamic calculation of 13 core environmental indicators across EF 3.1, TRACI 2.1, CML-IA 2016, and ReCiPe midpoint matrices."
    },
    {
      title: "Publication PDF generation",
      desc: "Export 20–30 page third-party verifier ready publication PDFs complete with required indicator disclaimers and charts."
    },
    {
      title: "openEPD & machine-readable data",
      desc: "Instant export to openEPD JSON and ILCD+EPD XML standards for seamless upload into green building portals."
    }
  ];

  return (
    <section className="product-tile-light" id="features">
      <div className="lp-container">
        <div className="apple-section-header">
          <div className="apple-section-eyebrow">
            Capabilities
          </div>
          <h2 className="apple-section-title">
            Features designed for precision and speed
          </h2>
          <p className="apple-section-subtitle">
            Everything your engineering and sustainability teams need to model, validate, and publish verified declarations.
          </p>
        </div>

        <div className="store-utility-grid">
          {features.map((feat, idx) => (
            <div key={idx} className="store-utility-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <CheckCircleIcon size={18} style={{ color: 'var(--apple-primary)' }} />
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'var(--apple-ink)',
                  margin: 0,
                  letterSpacing: '-0.374px'
                }}>
                  {feat.title}
                </h3>
              </div>
              <p style={{
                fontSize: '15px',
                color: '#6e6e73',
                lineHeight: '1.47',
                margin: 0
              }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
