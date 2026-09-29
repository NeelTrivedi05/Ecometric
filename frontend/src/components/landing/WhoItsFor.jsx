import React from 'react';
import { CheckCircleIcon } from '../studio/Icons';

export default function WhoItsFor() {
  const groups = [
    {
      title: "Manufacturers",
      desc: "Accelerate portfolio-wide environmental declarations to qualify for public procurement contracts and green building tenders."
    },
    {
      title: "LCA consultants",
      desc: "Automate repetitive background data linking and report formatting to deliver client EPDs in days instead of months."
    },
    {
      title: "Sustainability teams",
      desc: "Model product carbon footprints across complex assemblies with complete data lineage and auditable calculations."
    },
    {
      title: "Building developers",
      desc: "Quickly verify and compare supplier EPD claims to achieve LEED v4.1, BREEAM, and DGNB project certification credits."
    }
  ];

  return (
    <section className="product-tile-light" id="who-its-for">
      <div className="lp-container">
        <div className="apple-section-header">
          <div className="apple-section-eyebrow">
            Target Audience
          </div>
          <h2 className="apple-section-title">
            Built for professionals across the supply chain
          </h2>
          <p className="apple-section-subtitle">
            Engineered for practitioners requiring auditable, standard-compliant environmental disclosures without consulting overhead.
          </p>
        </div>

        <div className="store-utility-grid">
          {groups.map((grp, idx) => (
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
                  {grp.title}
                </h3>
              </div>
              <p style={{
                fontSize: '15px',
                color: '#6e6e73',
                lineHeight: '1.47',
                margin: 0
              }}>
                {grp.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
