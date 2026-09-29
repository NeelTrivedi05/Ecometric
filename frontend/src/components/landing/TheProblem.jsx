import React from 'react';

export default function TheProblem() {
  const problems = [
    {
      title: "Multiple disconnected spreadsheets",
      desc: "Engineering data scattered across ERP exports, procurement files, and unlinked Excel workbooks with fragile formulas."
    },
    {
      title: "Manual LCA matrix calculations",
      desc: "Hand-multiplying thousands of elementary substance flows against characterization factors leads to costly audit errors."
    },
    {
      title: "Complex background datasets",
      desc: "Navigating 20,000+ industrial unit processes in raw background databases without automated proxy recommendations."
    },
    {
      title: "Strict PCR compliance rules",
      desc: "Stringent regulatory checks for cut-off thresholds (<1% mass, <5% energy) and mandatory lifecycle stage declarations."
    },
    {
      title: "Repetitive documentation",
      desc: "Manually re-entering the same product parameters across multiple compliance portals, questionnaires, and registry forms."
    },
    {
      title: "Time-consuming verification",
      desc: "Spending weeks drafting 30-page PDF reports and hand-formatting ILCD+EPD XML files for third-party verifiers."
    }
  ];

  return (
    <section className="product-tile-dark" id="challenge">
      <div className="lp-container">
        <div className="apple-section-header">
          <div className="apple-section-eyebrow on-dark">
            The Industry Challenge
          </div>
          <h2 className="apple-section-title" style={{ color: 'var(--apple-body-on-dark)' }}>
            EPD creation is complicated.
          </h2>
          <p className="apple-section-subtitle">
            Traditional life cycle assessment processes waste hundreds of hours and thousands of dollars on manual friction and spreadsheet errors.
          </p>
        </div>

        <div className="store-utility-grid">
          {problems.map((prob, idx) => (
            <div
              key={idx}
              className="store-utility-card dark-surface"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 69, 58, 0.15)',
                  color: '#ff453a',
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--apple-radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  0{idx + 1}
                </span>

                <div>
                  <h3 style={{
                    fontSize: '17px',
                    fontWeight: 600,
                    color: 'var(--apple-body-on-dark)',
                    marginBottom: '8px',
                    letterSpacing: '-0.374px'
                  }}>
                    {prob.title}
                  </h3>
                  <p style={{
                    fontSize: '15px',
                    color: 'var(--apple-body-muted)',
                    lineHeight: '1.47',
                    letterSpacing: '-0.2px'
                  }}>
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
