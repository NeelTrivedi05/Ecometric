import React from 'react';

export default function TheSolution() {
  return (
    <section className="solution-section" id="solution">
      <div className="container">
        <div className="section-header">
          <div className="badge">
            <span className="badge-pulse-dot"></span>
            <span>THE MODERN APPROACH</span>
          </div>
          <h2 className="section-title">One workflow from product data → EPD</h2>
          <p className="section-subtitle">
            Say goodbye to 6-month spreadsheet bottlenecks. Consolidate your entire Life Cycle Assessment and verified publication pipeline into one automated cloud engine.
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="solution-comparison">
          <div className="compare-col old-way">
            <span className="compare-badge red">Traditional Spreadsheet Nightmare</span>
            <h3 className="compare-title">3 to 6 Months of Manual Chaos</h3>
            <ul className="compare-list">
              <li className="compare-item">
                <span style={{ color: '#fb7185' }}>✕</span>
                <span>Scattered across 15+ unlinked Excel workbooks</span>
              </li>
              <li className="compare-item">
                <span style={{ color: '#fb7185' }}>✕</span>
                <span>Raw ecoinvent LCI without characterization matrix factors</span>
              </li>
              <li className="compare-item">
                <span style={{ color: '#fb7185' }}>✕</span>
                <span>Manual biogenic net-zero carbon reconciliation errors</span>
              </li>
              <li className="compare-item">
                <span style={{ color: '#fb7185' }}>✕</span>
                <span>Frequent third-party audit rejection and costly revision cycles</span>
              </li>
              <li className="compare-item">
                <span style={{ color: '#fb7185' }}>✕</span>
                <span>Static, locked PDFs with no machine-readable data</span>
              </li>
            </ul>
          </div>

          <div className="compare-col new-way">
            <span className="compare-badge green">EcoPulse Automated Engine</span>
            <h3 className="compare-title">Under 48 Hours to Verified EPD</h3>
            <ul className="compare-list">
              <li className="compare-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>Direct 1-click import of ERP/BOM & factory energy bills</span>
              </li>
              <li className="compare-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>Automated EF 3.1 & EN 15804+A2 characterization factor engine</span>
              </li>
              <li className="compare-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>Built-in GPI 5.0.1 rule validator & biogenic mass balancer</span>
              </li>
              <li className="compare-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>First-pass verifier approval with auto-generated audit packs</span>
              </li>
              <li className="compare-item">
                <span style={{ color: '#34d399' }}>✓</span>
                <span>Dual export: Branded 30-pg PDF + digital ILCD/BIM XML</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Visual Workflow Pipeline */}
        <div className="pipeline-container">
          <h4 className="pipeline-title">
            Automated Architecture: <span className="gradient-text">Product Data to Declaration</span>
          </h4>

          <div className="pipeline-stages">
            <div className="pipeline-node">
              <div className="pipeline-node-icon">📦</div>
              <div className="pipeline-node-name">1. Product BOM</div>
              <div className="pipeline-node-sub">Raw metals, refrigerants, factory kWh</div>
            </div>

            <div className="pipeline-arrow">➔</div>

            <div className="pipeline-node">
              <div className="pipeline-node-icon">⚡</div>
              <div className="pipeline-node-name">2. EF 3.1 Engine</div>
              <div className="pipeline-node-sub">ecoinvent 3.10 characterization</div>
            </div>

            <div className="pipeline-arrow">➔</div>

            <div className="pipeline-node">
              <div className="pipeline-node-icon">🛡️</div>
              <div className="pipeline-node-name">3. PCR Rules Enforcer</div>
              <div className="pipeline-node-sub">GPI 5.0.1 & Mass Balance Netting</div>
            </div>

            <div className="pipeline-arrow">➔</div>

            <div className="pipeline-node">
              <div className="pipeline-node-icon">📑</div>
              <div className="pipeline-node-name">4. Verified EPD</div>
              <div className="pipeline-node-sub">Publication-ready PDF & ILCD XML</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
