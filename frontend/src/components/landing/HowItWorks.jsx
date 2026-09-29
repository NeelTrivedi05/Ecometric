import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Import product data",
      desc: "Upload engineering bill of materials (BOM), plant utility electricity logs, and logistics manifests in CSV, Excel, or PDF."
    },
    {
      num: "02",
      title: "Connect LCA datasets",
      desc: "Map materials to verified ecoinvent v3.12 industrial processes with intelligent fuzzy search and proxy recommendations."
    },
    {
      num: "03",
      title: "Calculate impacts",
      desc: "Run dynamic characterization matrices (EF 3.1, TRACI 2.1) across all modules from raw materials (A1) to circularity (D)."
    },
    {
      num: "04",
      title: "Validate results",
      desc: "The automated rules engine checks cut-off criteria, mass balance, and PCR mandates to guarantee audit readiness."
    },
    {
      num: "05",
      title: "Generate EPD",
      desc: "Download verified publication PDFs and ILCD+EPD machine-readable XML ready for registry submission."
    }
  ];

  return (
    <section className="product-tile-parchment" id="how-it-works">
      <div className="lp-container">
        <div className="apple-section-header">
          <div className="apple-section-eyebrow">
            The Process
          </div>
          <h2 className="apple-section-title">
            How It Works
          </h2>
          <p className="apple-section-subtitle">
            Five clear, structured steps from raw product files to an independently verifier-ready declaration.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px' }}>
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="store-utility-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px'
              }}
            >
              <div>
                <span style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'var(--apple-primary)',
                  display: 'block',
                  marginBottom: '12px',
                  fontFamily: 'var(--apple-font-mono)'
                }}>
                  {step.num}
                </span>
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'var(--apple-ink)',
                  marginBottom: '8px',
                  letterSpacing: '-0.374px'
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6e6e73',
                  lineHeight: '1.47'
                }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
