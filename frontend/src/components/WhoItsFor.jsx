import React from 'react';
import { WHO_ITS_FOR_DATA } from '../data/epdData';

export default function WhoItsFor() {
  return (
    <section className="who-section">
      <div className="container">
        <div className="section-header">
          <div className="badge badge-cyan">
            <span>TAILORED FOR IMPACT</span>
          </div>
          <h2 className="section-title">Who It's For</h2>
          <p className="section-subtitle">
            Whether you are manufacturing chillers or managing hundreds of client LCA studies, EcoPulse accelerates your path to certified declarations.
          </p>
        </div>

        <div className="who-grid">
          {WHO_ITS_FOR_DATA.map((target, idx) => (
            <div key={idx} className="who-card">
              <div className="who-avatar">
                <span>{target.avatar}</span>
              </div>
              <h3 className="who-role">{target.role}</h3>
              <p className="who-desc">{target.desc}</p>
              <div className="who-perk">
                <span>⚡</span>
                <span>{target.perk}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
