import React from 'react';
import { InfoIcon, CheckCircleIcon } from '../studio/Icons';

export default function EpdExplained() {
  const sections = [
    {
      question: "What is an EPD?",
      answer: "An Environmental Product Declaration (EPD) is an independently verified and registered document that communicates transparent and comparable information about the life-cycle environmental impact of products in accordance with ISO 14025 (Type III declarations) and EN 15804+A2."
    },
    {
      question: "Why do manufacturers need one?",
      answer: "Global green building schemes (LEED, BREEAM, DGNB) and public procurement regulations increasingly mandate Type III EPDs as a non-negotiable bidding prerequisite. Without verified declarations, manufacturers face disqualification from high-value infrastructure projects."
    },
    {
      question: "What information does an EPD contain?",
      answer: "A standard declaration contains the product's declared/functional unit, technical specification, comprehensive bill of materials, 13 core environmental impact indicators (GWP, ozone depletion, acidification, eutrophication, resource depletion) across stages A1–A3, A4–A5, B1–B7, C1–C4, and Module D circularity credits."
    }
  ];

  return (
    <section id="epds" style={{ padding: '80px 0', backgroundColor: '#FAF6F0' }}>
      <div className="lp-container">
        <div className="section-header">
          <div className="section-badge">
            <span>Knowledge Base</span>
          </div>
          <h2 className="section-title">EPD Explained</h2>
          <p className="section-subtitle">
            Essential principles behind Type III environmental declarations and international compliance standards.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {sections.map((item, idx) => (
            <div key={idx} style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '28px',
              border: '1px solid #EAE0D5',
              boxShadow: '0 4px 16px rgba(44, 34, 30, 0.03)'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#C25A23',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px'
              }}>
                Topic 0{idx + 1}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C221E', marginBottom: '12px' }}>
                {item.question}
              </h3>
              <p style={{ fontSize: '13px', color: '#5C4E46', lineHeight: '1.6', margin: 0 }}>
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
