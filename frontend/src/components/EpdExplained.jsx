import React from 'react';

export default function EpdExplained() {
  return (
    <section className="epd-explained-section" id="epds">
      <div className="container">
        <div className="section-header">
          <div className="badge badge-cyan">
            <span>REGULATORY CONTEXT</span>
          </div>
          <h2 className="section-title">EPD Explained</h2>
          <p className="section-subtitle">
            Understand the fundamentals of Type III Environmental Product Declarations and why they have become mandatory across global supply chains.
          </p>
        </div>

        <div className="explained-cards">
          {/* Card 1: What is an EPD */}
          <div className="explained-card">
            <div className="badge explained-badge">ISO 14025 • EN 15804</div>
            <h3 className="explained-question">What is an EPD?</h3>
            <p className="explained-answer">
              An Environmental Product Declaration (EPD) is an independently verified, registered document that communicates transparent and comparable information about the life-cycle environmental impact of products.
            </p>
            <ul className="explained-points">
              <li className="explained-point-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>Third-party audited by accredited LCA verifiers</span>
              </li>
              <li className="explained-point-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>Based on strict Product Category Rules (PCRs)</span>
              </li>
              <li className="explained-point-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>Valid internationally for a 5-year certification cycle</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Why manufacturers need one */}
          <div className="explained-card">
            <div className="badge explained-badge">BUSINESS VALUE</div>
            <h3 className="explained-question">Why do manufacturers need one?</h3>
            <p className="explained-answer">
              Without an EPD, manufacturers are increasingly disqualified from high-value commercial construction tenders, green building programs, and public infrastructure procurement.
            </p>
            <ul className="explained-points">
              <li className="explained-point-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>Mandatory for LEED v4.1, BREEAM & DGNB credits</span>
              </li>
              <li className="explained-point-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>EU Buy Clean & Green Public Procurement mandates</span>
              </li>
              <li className="explained-point-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>Protects against greenwashing under EU Green Claims</span>
              </li>
            </ul>
          </div>

          {/* Card 3: What information does an EPD contain */}
          <div className="explained-card">
            <div className="badge explained-badge">EN 15804+A2 CONTENTS</div>
            <h3 className="explained-question">What information does an EPD contain?</h3>
            <p className="explained-answer">
              An EPD contains declared product specifications, system boundary definitions (A1-A3, B1-B7, C1-C4, D), and verified life cycle environmental indicator tables.
            </p>
            <ul className="explained-points">
              <li className="explained-point-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>Core indicators: GWP (fossil/biogenic/luluc), AP, POCP</span>
              </li>
              <li className="explained-point-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>Mandatory GPI 5.0.1 disclaimers for ADP and AWARE Water</span>
              </li>
              <li className="explained-point-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>Resource use, waste fractions & end-of-life recovery (Module D)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
