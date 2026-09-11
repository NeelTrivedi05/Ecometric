import React from 'react';

export default function TheProblem() {
  const problems = [
    {
      title: "Multiple spreadsheets",
      desc: "Fragile 40-tab workbooks filled with broken formulas, unlinked BOM versions, and unversioned supplier emails.",
      icon: "📊"
    },
    {
      title: "Manual LCA calculations",
      desc: "Hundreds of tedious hours spent hand-multiplying unit processes and elementary flows across modules A1 to D.",
      icon: "🧮"
    },
    {
      title: "Complex datasets & factor mismatches",
      desc: "Using raw ecoinvent LCI without characterization factors causes huge discrepancies (like missing Carrier chiller EPD11017 parity).",
      icon: "🔀"
    },
    {
      title: "PCR requirements",
      desc: "Keeping up with GPI 5.0.1 and PCR 2019:14 strict rules: biogenic carbon mass balances, 10 mandatory resource indicators, and cut-off criteria.",
      icon: "📜"
    },
    {
      title: "Repetitive documentation",
      desc: "Manually re-typing system boundary narratives, data quality ratings, and factory background details for every product SKU.",
      icon: "🔁"
    },
    {
      title: "Time-consuming reporting",
      desc: "Taking 4 to 6 months to compile 35-page verifier-ready PDFs, missing critical tender deadlines and green procurement windows.",
      icon: "⏳"
    }
  ];

  return (
    <section className="problem-section" id="problem">
      <div className="container">
        <div className="section-header">
          <div className="badge badge-cyan">
            <span>THE CHALLENGE</span>
          </div>
          <h2 className="section-title">EPD creation is complicated.</h2>
          <p className="section-subtitle">
            Traditional Life Cycle Assessments are bogged down by disconnected tools, manual mathematical errors, and shifting international standards.
          </p>
        </div>

        <div className="problem-grid">
          {problems.map((p, idx) => (
            <div key={idx} className="problem-card">
              <div className="problem-icon-wrapper">
                <span>❌</span>
              </div>
              <h3 className="problem-card-title">{p.title}</h3>
              <p className="problem-card-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
