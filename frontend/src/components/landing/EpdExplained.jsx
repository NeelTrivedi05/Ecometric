import React from 'react';

export default function EpdExplained() {
  const sections = [
    {
      question: "What is an EPD?",
      answer: "An Environmental Product Declaration (EPD) is an independently verified and registered document that communicates transparent and comparable information about the life-cycle environmental impact of products in accordance with ISO 14025 (Type III declarations) and EN 15804+A2."
    },
    {
      question: "Why do manufacturers need one?",
      answer: "Global green building schemes (LEED, BREEAM, DGNB) and public procurement regulations increasingly mandate Type III EPDs as a non-negotiable bidding prerequisite. Without verified declarations, manufacturers face disqualification from high-value tenders."
    },
    {
      question: "What information does an EPD contain?",
      answer: "A standard declaration contains the product's declared/functional unit, technical specification, comprehensive bill of materials, 13 core environmental impact indicators (GWP, ozone depletion, acidification, eutrophication) across stages A1–A3, A4–A5, B1–B7, C1–C4, and Module D circularity credits."
    }
  ];

  return (
    <section className="product-tile-dark" id="epds">
      <div className="lp-container">
        <div className="apple-section-header">
          <div className="apple-section-eyebrow on-dark">
            Regulatory Knowledge Base
          </div>
          <h2 className="apple-section-title" style={{ color: 'var(--apple-body-on-dark)' }}>
            EPD Explained
          </h2>
          <p className="apple-section-subtitle">
            Essential principles behind Type III environmental declarations and international compliance standards.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {sections.map((item, idx) => (
            <div
              key={idx}
              className="store-utility-card dark-surface"
              style={{ padding: '32px' }}
            >
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--apple-primary-on-dark)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '12px'
              }}>
                Topic 0{idx + 1}
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--apple-body-on-dark)',
                marginBottom: '12px',
                letterSpacing: '-0.02em'
              }}>
                {item.question}
              </h3>
              <p style={{
                fontSize: '15px',
                color: 'var(--apple-body-muted)',
                lineHeight: '1.47',
                margin: 0
              }}>
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
