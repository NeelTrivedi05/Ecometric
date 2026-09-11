import React from 'react';

export default function TrustProof() {
  return (
    <section className="trust-section">
      <div className="container">
        <h3 className="trust-heading">
          Built for manufacturers • LCA teams • Consultants
        </h3>

        <div className="trust-metrics-grid">
          <div className="metric-card">
            <div className="metric-number">14,800+</div>
            <div className="metric-label">LCA Inventories Processed</div>
          </div>
          <div className="metric-card">
            <div className="metric-number">99.8%</div>
            <div className="metric-label">First-Pass Verifier Approval</div>
          </div>
          <div className="metric-card">
            <div className="metric-number">48 Hrs</div>
            <div className="metric-label">Average Time to Declaration</div>
          </div>
          <div className="metric-card">
            <div className="metric-number">100%</div>
            <div className="metric-label">GPI 5.0.1 & PCR 2019:14 Compliant</div>
          </div>
        </div>

        <div className="standards-row">
          <div className="standard-pill">
            <span>🏛️</span>
            <span>International EPD® System</span>
          </div>
          <div className="standard-pill">
            <span>📐</span>
            <span>EN 15804+A2</span>
          </div>
          <div className="standard-pill">
            <span>🌿</span>
            <span>ecoinvent 3.10 Verified</span>
          </div>
          <div className="standard-pill">
            <span>⚡</span>
            <span>EF 3.1 Characterization Engine</span>
          </div>
          <div className="standard-pill">
            <span>🌐</span>
            <span>ISO 14025 / ISO 14040/44</span>
          </div>
        </div>
      </div>
    </section>
  );
}
