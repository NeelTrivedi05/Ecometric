import React from 'react';

export default function TheProblem() {
  const problems = [
    {
      title: "Multiple spreadsheets",
      desc: "Engineering data scattered across ERP exports, purchasing files, and unlinked Excel workbooks with broken formulas."
    },
    {
      title: "Manual LCA calculations",
      desc: "Hand-multiplying thousands of elementary substance flows against characterization matrices leads to costly mathematical errors."
    },
    {
      title: "Complex datasets",
      desc: "Navigating 20,000+ unit processes in raw background databases like ecoinvent without automated proxy recommendations."
    },
    {
      title: "PCR requirements",
      desc: "Strict compliance checks for cut-off thresholds (<1% mass, <5% energy) and mandatory lifecycle stage declarations."
    },
    {
      title: "Repetitive documentation",
      desc: "Manually re-entering the same product parameters across multiple compliance portals, questionnaires, and registry forms."
    },
    {
      title: "Time-consuming reporting",
      desc: "Spending weeks drafting 30-page PDF reports and hand-formatting ILCD+EPD XML files for third-party verification."
    }
  ];

  return (
    <section style={{ padding: '80px 0', backgroundColor: '#FAF6F0' }}>
      <div className="lp-container">
        <div className="section-header">
          <div className="section-badge">
            <span>The Challenge</span>
          </div>
          <h2 className="section-title">EPD creation is complicated.</h2>
          <p className="section-subtitle">
            Traditional life cycle assessment processes waste hundreds of hours and thousands of dollars on manual friction.
          </p>
        </div>

        <div className="lp-card-grid">
          {problems.map((prob, idx) => (
            <div key={idx} className="lp-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{
                  fontSize: '18px',
                  backgroundColor: '#FFF2EB',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  ❌
                </span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2C221E', marginBottom: '6px' }}>
                    {prob.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#5C4E46', lineHeight: '1.6' }}>
                    {prob.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
