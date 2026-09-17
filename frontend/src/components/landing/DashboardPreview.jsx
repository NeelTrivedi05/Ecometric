import React, { useState } from 'react';
import { ChevronRightIcon, CheckCircleIcon, FileIcon, LeafIcon } from '../studio/Icons';

export default function DashboardPreview({ onLaunchApp }) {
  const [activeView, setActiveView] = useState('results');

  return (
    <section style={{ padding: '80px 0', backgroundColor: '#FFFFFF', borderTop: '1px solid #EFE4D8', borderBottom: '1px solid #EFE4D8' }}>
      <div className="lp-container">
        <div className="section-header">
          <div className="section-badge">
            <span>Product Interface</span>
          </div>
          <h2 className="section-title">Dashboard Preview</h2>
          <p className="section-subtitle">
            An intuitive, modern workspace designed for rapid modeling, validation, and certificate generation.
          </p>
        </div>

        {/* Large UI Screenshot Mockup */}
        <div style={{
          backgroundColor: '#FAF5EE',
          borderRadius: '16px',
          border: '1px solid #EAE0D5',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(44, 34, 30, 0.08)'
        }}>
          {/* Studio Header Mock */}
          <div style={{
            padding: '14px 20px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #EAE0D5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#C25A23', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                <LeafIcon size={14} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#2C221E' }}>EcoMetric Studio</span>
              <span style={{ fontSize: '12px', color: '#8A7A72' }}>/ Industrial Chiller 500RT / EN 15804+A2</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onLaunchApp}
                className="btn-lp-primary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                <span>Launch Interactive App</span>
                <ChevronRightIcon size={12} />
              </button>
            </div>
          </div>

          {/* Studio Body Mock: Sidebar + Main Area */}
          <div style={{ display: 'flex', minHeight: '440px' }}>
            {/* Sidebar Mock */}
            <div style={{
              width: '200px',
              backgroundColor: '#FAF5EE',
              borderRight: '1px solid #EAE0D5',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
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
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: activeView === tab.id ? 700 : 500,
                    backgroundColor: activeView === tab.id ? '#FFFFFF' : 'transparent',
                    color: activeView === tab.id ? '#C25A23' : '#5C4E46',
                    cursor: 'pointer',
                    boxShadow: activeView === tab.id ? '0 1px 4px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Main Content Area Mock */}
            <div style={{ flex: 1, padding: '24px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
                    Characterized LCIA Results (EF 3.1 Standard)
                  </h3>
                  <p style={{ fontSize: '12px', color: '#8A7A72', margin: '2px 0 0 0' }}>
                    ecoinvent v3.12 Cutoff system model • UL 10010-4 Part B verified
                  </p>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }}>
                  ✓ Passed ISO 14025 Check
                </span>
              </div>

              {/* Table of Results */}
              <div style={{ borderRadius: '8px', border: '1px solid #EAE0D5', overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#FAF5EE', borderBottom: '1px solid #EAE0D5', color: '#5C4E46', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Impact Category</th>
                      <th style={{ padding: '8px 12px' }}>Unit</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>A1–A3</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>B1–B7</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>C1–C4</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#2E7D32' }}>Module D</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F2EAE2' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>Global Warming Potential (GWP-total)</td>
                      <td style={{ padding: '8px 12px', color: '#8A7A72' }}>kg CO₂ eq</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>20,700</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>312,000</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>4,850</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#2E7D32' }}>-6,840</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F2EAE2' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>Ozone Depletion Potential (ODP)</td>
                      <td style={{ padding: '8px 12px', color: '#8A7A72' }}>kg CFC-11 eq</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>4.2E-04</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>1.8E-03</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>2.5E-05</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#2E7D32' }}>-8.5E-05</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F2EAE2' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>Acidification Potential (AP)</td>
                      <td style={{ padding: '8px 12px', color: '#8A7A72' }}>mol H⁺ eq</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>68.4</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>242.0</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>2.1</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#2E7D32' }}>-12.4</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>Abiotic Depletion - Minerals (ADPe)</td>
                      <td style={{ padding: '8px 12px', color: '#8A7A72' }}>kg Sb eq</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>0.45</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>0.88</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>0.005</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#2E7D32' }}>-0.18</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
