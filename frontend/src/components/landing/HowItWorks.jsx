import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Import product data",
      desc: "Upload your engineering bill of materials (BOM), plant utility electricity logs, and logistics manifests."
    },
    {
      num: "2",
      title: "Connect LCA datasets",
      desc: "Map materials to verified ecoinvent v3.12 industrial processes with intelligent fuzzy search and proxy recommendations."
    },
    {
      num: "3",
      title: "Calculate impacts",
      desc: "Run dynamic characterization matrices (EF 3.1, TRACI 2.1) across all modules from raw materials (A1) to circularity (D)."
    },
    {
      num: "4",
      title: "Validate results",
      desc: "The automated rules engine checks cut-off criteria, mass balance, and PCR mandates to guarantee audit readiness."
    },
    {
      num: "5",
      title: "Generate EPD",
      desc: "Download verified publication PDFs and ILCD+EPD machine-readable XML ready for registry submission."
    }
  ];

  return (
    <section id="how-it-works" style={{ padding: '80px 0', backgroundColor: '#FAF6F0' }}>
      <div className="lp-container">
        <div className="section-header">
          <div className="section-badge">
            <span>The Process</span>
          </div>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Five clear, structured steps from raw product files to an independently verifier-ready declaration.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {steps.map((step, idx) => (
            <div key={idx} style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px 20px',
              border: '1px solid #EAE0D5',
              boxShadow: '0 4px 12px rgba(44, 34, 30, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#C25A23',
                  display: 'block',
                  marginBottom: '12px',
                  fontFamily: 'monospace'
                }}>
                  {step.num}.
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2C221E', marginBottom: '8px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '12px', color: '#5C4E46', lineHeight: '1.6' }}>
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
