import React from 'react';
import { CheckCircleIcon } from '../studio/Icons';

export default function WhoItsFor() {
  const groups = [
    {
      title: "Manufacturers",
      desc: "Accelerate portfolio-wide environmental declarations to qualify for procurement contracts and green building tenders."
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
      title: "Construction companies",
      desc: "Quickly verify and compare supplier EPD claims to achieve LEED v4.1, BREEAM, and DGNB project certification credits."
    }
  ];

  return (
    <section style={{ padding: '80px 0', backgroundColor: '#FAF6F0' }}>
      <div className="lp-container">
        <div className="section-header">
          <div className="section-badge">
            <span>Target Audience</span>
          </div>
          <h2 className="section-title">Who It's For</h2>
          <p className="section-subtitle">
            Engineered for professionals requiring auditable, standard-compliant environmental disclosures.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {groups.map((grp, idx) => (
            <div key={idx} className="lp-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ color: '#2E7D32', display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon size={18} />
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
                  {grp.title}
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#5C4E46', lineHeight: '1.6', margin: 0 }}>
                {grp.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
