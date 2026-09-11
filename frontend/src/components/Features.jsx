import React from 'react';
import { FEATURES_DATA } from '../data/epdData';

export default function Features() {
  return (
    <section className="features-section" id="features">
      <div className="container">
        <div className="section-header">
          <div className="badge">
            <span>ENTERPRISE ARCHITECTURE</span>
          </div>
          <h2 className="section-title">Everything Needed to Automate EPDs</h2>
          <p className="section-subtitle">
            Engineered specifically for engineering, environmental, and LCA teams requiring absolute compliance with PCR 2019:14 and GPI 5.0.1.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES_DATA.map((feat, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon-box">
                <span>{feat.icon}</span>
              </div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
              <div className="feature-pills">
                {feat.pills.map((pill, pIdx) => (
                  <span key={pIdx} className="feature-pill">{pill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
