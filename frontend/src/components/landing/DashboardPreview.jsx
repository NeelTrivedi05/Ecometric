import React, { useState } from 'react';
import { ChevronRightIcon, CheckCircleIcon, FileIcon, LeafIcon } from '../studio/Icons';

export default function DashboardPreview({ onLaunchApp }) {
  const [activeView, setActiveView] = useState('results');

  return (
    <section className="product-tile-parchment" id="preview">
      <div className="lp-container">
        <div className="apple-section-header">
          <div className="apple-section-eyebrow">
            Product Interface
          </div>
          <h2 className="apple-section-title">
            The Studio Workspace
          </h2>
          <p className="apple-section-subtitle">
            An intuitive, distraction-free environment engineered for rapid modeling, validation, and certificate generation.
          </p>
        </div>

        {/* Large UI Screenshot Mockup with the ONE signature shadow */}
        <div className="apple-product-render">
          {/* Studio Header Mock */}
          <div style={{
            padding: '14px 24px',
            backgroundColor: 'var(--apple-canvas)',
            borderBottom: '1px solid var(--apple-hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LeafIcon size={16} style={{ color: 'var(--apple-primary)' }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--apple-ink)', letterSpacing: '-0.2px' }}>
                EcoMetric Studio
              </span>
              <span style={{ fontSize: '13px', color: '#86868b' }}>
                / Water-Cooled Chiller 500RT / EN 15804+A2
              </span>
            </div>

            <div>
              <button
                type="button"
                onClick={onLaunchApp}
                className="btn-apple-primary"
                style={{ padding: '7px 16px', fontSize: '13px' }}
              >
                <span>Launch Interactive Studio</span>
                <ChevronRightIcon size={13} />
              </button>
            </div>
          </div>

          {/* Studio Body Mock: Sidebar + Main Area */}
          <div style={{ display: 'flex', minHeight: '440px', backgroundColor: 'var(--apple-canvas)' }}>
            {/* Sidebar Mock */}
            <div style={{
              width: '210px',
              backgroundColor: 'var(--apple-canvas-parchment)',
              borderRight: '1px solid var(--apple-hairline)',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {[
                { id: 'upload', label: '1. Upload Files' },
                { id: 'review', label: '2. Review BOM' },
                { id: 'validate', label: '3. PCR Validate' },
                { id: 'methodology', label: '4. LCIA Method' },
                { id: 'results', label: '5. Results Matrix' },
                { id: 'export', label: '6. EPD Export' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: 'var(--apple-radius-sm)',
                    border: 'none',
                    backgroundColor: activeView === tab.id ? 'var(--apple-canvas)' : 'transparent',
                    boxShadow: activeView === tab.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    color: activeView === tab.id ? 'var(--apple-primary)' : '#6e6e73',
                    fontWeight: activeView === tab.id ? 600 : 400,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>{tab.label}</span>
                  {activeView === tab.id && <ChevronRightIcon size={12} />}
                </button>
              ))}
            </div>

            {/* Main Area Mock */}
            <div style={{ flex: 1, padding: '24px', backgroundColor: 'var(--apple-canvas)' }}>
              {activeView === 'results' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--apple-ink)' }}>
                      Environmental Impact Results (EF 3.1)
                    </h4>
                    <span style={{ fontSize: '12px', color: '#28cd41', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircleIcon size={14} /> DQR Rating 1.42
                    </span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--apple-hairline)', color: '#6e6e73', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>INDICATOR</th>
                        <th style={{ padding: '8px' }}>UNIT</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>A1–A3</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>A4–A5</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>B1–B7</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>C1–C4</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>MODULE D</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 600 }}>GWP-total</td>
                        <td style={{ padding: '10px 8px', color: '#86868b' }}>kg CO₂e</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', fontWeight: 600, color: 'var(--apple-primary)' }}>20,700</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>1,450</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>4,820</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>920</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', color: '#28cd41' }}>-3,840</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 600 }}>ODP</td>
                        <td style={{ padding: '10px 8px', color: '#86868b' }}>kg CFC-11e</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>1.24e-4</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>8.10e-6</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>2.10e-5</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>3.40e-6</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', color: '#28cd41' }}>-2.10e-5</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 600 }}>AP</td>
                        <td style={{ padding: '10px 8px', color: '#86868b' }}>mol H+ eq</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>94.2</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>6.12</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>14.8</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>3.40</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', color: '#28cd41' }}>-18.4</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeView !== 'results' && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#6e6e73' }}>
                  <p style={{ fontSize: '15px', marginBottom: '16px' }}>
                    Active module: <strong>{activeView.toUpperCase()}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={onLaunchApp}
                    className="btn-apple-primary"
                    style={{ fontSize: '13px', padding: '8px 18px' }}
                  >
                    Open Live Studio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
