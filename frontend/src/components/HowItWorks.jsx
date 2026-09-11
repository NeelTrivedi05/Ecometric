import React, { useState } from 'react';
import { HOW_IT_WORKS_STEPS } from '../data/epdData';

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const current = HOW_IT_WORKS_STEPS[activeStep];

  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <div className="badge">
            <span>STEP-BY-STEP PROCESS</span>
          </div>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Five streamlined stages from raw factory inventory to international certified EPD publication.
          </p>
        </div>

        <div className="steps-interactive-grid">
          {/* Step Buttons List */}
          <div className="steps-list">
            {HOW_IT_WORKS_STEPS.map((s, idx) => {
              const isActive = idx === activeStep;
              return (
                <button
                  key={s.step}
                  type="button"
                  className={`step-card-button ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveStep(idx)}
                >
                  <div className="step-num-badge">{s.step}</div>
                  <div>
                    <h3 className="step-text-title">{s.title}</h3>
                    <p className="step-text-desc">{s.desc.slice(0, 75)}...</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dynamic Active Step Display Panel */}
          <div className="step-display-panel">
            <div>
              <div className="display-panel-header">
                <div>
                  <span className="badge badge-cyan">{current.badge}</span>
                  <h3 style={{ fontSize: '1.5rem', marginTop: '8px', color: '#f8fafc' }}>
                    Stage {current.step}: {current.title}
                  </h3>
                </div>
                <span className="mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'rgba(52, 211, 153, 0.3)' }}>
                  {current.step}
                </span>
              </div>

              <p style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: '1.7', marginBottom: '24px' }}>
                {current.desc}
              </p>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#34d399', marginBottom: '12px', letterSpacing: '0.05em' }}>
                  KEY CAPABILITIES IN THIS STAGE
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {current.details.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.925rem', color: '#e2e8f0' }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="mono" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Step {activeStep + 1} of 5 • Standard: EN 15804+A2
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                  style={{ opacity: activeStep === 0 ? 0.4 : 1, cursor: activeStep === 0 ? 'not-allowed' : 'pointer' }}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={activeStep === HOW_IT_WORKS_STEPS.length - 1}
                  onClick={() => setActiveStep(prev => Math.min(HOW_IT_WORKS_STEPS.length - 1, prev + 1))}
                  style={{ opacity: activeStep === HOW_IT_WORKS_STEPS.length - 1 ? 0.4 : 1, cursor: activeStep === HOW_IT_WORKS_STEPS.length - 1 ? 'not-allowed' : 'pointer' }}
                >
                  Next Step →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
