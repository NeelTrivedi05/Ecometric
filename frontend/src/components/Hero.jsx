import React, { useState } from 'react';

export default function Hero({ onOpenWizard }) {
  const [refrigChoice, setRefrigChoice] = useState('r134a');

  // Dynamic interactive calculation in hero mockup
  const baseGwp = refrigChoice === 'r134a' ? 42850 : 28400;
  const usePhaseGwp = refrigChoice === 'r134a' ? 19200 : 7800;

  return (
    <section className="hero-section" id="product">
      <div className="container">
        <div className="hero-grid">
          {/* Left Column: Copy & Actions */}
          <div className="hero-content">
            <div className="badge">
              <span className="badge-pulse-dot"></span>
              <span>EN 15804+A2 & GPI 5.0.1 Ready • EF 3.1 Characterization Engine</span>
            </div>

            <h1 className="hero-title">
              Generate EPDs <br />
              <span className="gradient-text">without the spreadsheet nightmare.</span>
            </h1>

            <p className="hero-subtitle">
              Automate your Life Cycle Assessment and Environmental Product Declaration workflow.
              Eliminate manual formula errors, match verified ecoinvent flows, and deliver verifier-approved declarations in hours.
            </p>

            <div className="hero-actions">
              <button 
                type="button" 
                className="btn btn-primary btn-lg"
                onClick={onOpenWizard}
              >
                <span>Start creating EPD</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                <span>See how it works</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>

            <div className="hero-tags">
              <div className="hero-tag-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--forest-800)" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Zero raw LCI mismatches</span>
              </div>
              <div className="hero-tag-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--forest-800)" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>PCR 2019:14 Base Compliant</span>
              </div>
              <div className="hero-tag-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--forest-800)" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Instant Verifier Audit Pack</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Dashboard / Product Visual */}
          <div className="hero-visual">
            <div className="hero-visual-card">
              <div className="card-topbar">
                <div className="window-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div className="live-badge">● LIVE LCA CALCULATION</div>
              </div>

              <div className="hero-visual-content">
                <div className="calc-preview-head">
                  <div>
                    <h3 className="calc-product-name">Carrier Chiller Benchmark (EPD11017)</h3>
                    <span className="calc-product-pcr">EN 15804+A2 • EF 3.1 Characterized</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        background: refrigChoice === 'r134a' ? 'var(--forest-800)' : 'var(--bg-tertiary)',
                        color: refrigChoice === 'r134a' ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setRefrigChoice('r134a')}
                    >
                      R-134a
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        background: refrigChoice === 'r1234ze' ? 'var(--forest-800)' : 'var(--bg-tertiary)',
                        color: refrigChoice === 'r1234ze' ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setRefrigChoice('r1234ze')}
                    >
                      Low-GWP HFO
                    </button>
                  </div>
                </div>

                <div className="hero-stat-boxes">
                  <div className="stat-box">
                    <span className="stat-label">Total GWP-fossil</span>
                    <span className="stat-val">{baseGwp.toLocaleString()} <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>kg CO₂e</small></span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Acidification (AP)</span>
                    <span className="stat-val">186.4 <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>mol H⁺</small></span>
                  </div>
                </div>

                <div className="hero-chart-bars">
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.04em' }}>
                    LIFE CYCLE MODULES IMPACT DISTRIBUTION (EN 15804)
                  </div>

                  <div className="bar-row">
                    <span className="mono">A1-A3 Gate</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: '45%', background: 'var(--forest-800)' }}></div>
                    </div>
                    <span className="mono" style={{ textAlign: 'right' }}>18,450 kg</span>
                  </div>

                  <div className="bar-row">
                    <span className="mono">B1-B7 Use</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: refrigChoice === 'r134a' ? '48%' : '20%', background: 'var(--slate-700)' }}></div>
                    </div>
                    <span className="mono" style={{ textAlign: 'right' }}>{usePhaseGwp.toLocaleString()} kg</span>
                  </div>

                  <div className="bar-row">
                    <span className="mono">C1-C4 EoL</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: '12%', background: 'var(--amber-gold)' }}></div>
                    </div>
                    <span className="mono" style={{ textAlign: 'right' }}>5,200 kg</span>
                  </div>

                  <div className="bar-row">
                    <span className="mono">Module D</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: '18%', background: 'var(--viz-module-d)' }}></div>
                    </div>
                    <span className="mono" style={{ textAlign: 'right', color: 'var(--forest-800)' }}>-7,840 kg</span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--forest-100)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--forest-border)',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--forest-800)', fontWeight: 700 }}>✓</span>
                    <span style={{ color: 'var(--text-primary)' }}>GPI 5.0.1 Biogenic Mass Balance: <strong>Balanced (0.00 kg)</strong></span>
                  </div>
                  <span className="mono" style={{ color: 'var(--forest-800)', fontWeight: 700 }}>100% VALID</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
