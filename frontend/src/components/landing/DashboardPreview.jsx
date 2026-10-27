import React, { useState } from 'react';
import { ChevronRightIcon, CheckCircleIcon, FileIcon } from '../studio/Icons';
import BrandLogo from '../BrandLogo';

export default function DashboardPreview({ onLaunchApp }) {
  const [activeView, setActiveView] = useState('results');

  return (
    <section className="product-tile-parchment reveal-on-scroll" id="preview">
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
              <BrandLogo />
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--apple-ink)', letterSpacing: '-0.2px' }}>
                EcoMetric Studio
              </span>
              <span style={{ fontSize: '13px', color: '#7a8f81' }}>
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
                    boxShadow: activeView === tab.id ? '0 1px 3px rgba(16, 52, 33, 0.06)' : 'none',
                    color: activeView === tab.id ? 'var(--apple-primary)' : '#5b6f62',
                    fontWeight: activeView === tab.id ? 600 : 400,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <span>{tab.label}</span>
                  {activeView === tab.id && <ChevronRightIcon size={12} />}
                </button>
              ))}
            </div>

            {/* Main Area Mock */}
            <div style={{ flex: 1, padding: '24px', backgroundColor: 'var(--apple-canvas)', overflowX: 'auto' }}>
              <div key={activeView} className="step-card-animate">
                {/* 1. Upload View Preview */}
                {activeView === 'upload' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--apple-ink)', margin: 0 }}>
                        Ingested Document Queue (3 files processed)
                      </h4>
                      <span style={{ fontSize: '12px', color: '#2e9e5b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircleIcon size={14} /> ecoinvent v3.12 Matched
                      </span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--apple-hairline)', color: '#5b6f62', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>DOCUMENT NAME</th>
                          <th style={{ padding: '8px' }}>SIZE</th>
                          <th style={{ padding: '8px' }}>LIFECYCLE SCOPE</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--apple-ink)' }}>
                            AquaEdge_19DV_Centrifugal_BOM.xlsx
                          </td>
                          <td style={{ padding: '10px 8px', color: '#7a8f81', fontFamily: 'var(--apple-font-mono)' }}>124.5 KB</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(31, 122, 76, 0.08)', color: 'var(--apple-primary)', fontWeight: 600 }}>
                              Module A1 Raw Materials
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#2e9e5b', fontWeight: 600 }}>
                            100% Parsed (3,470 kg)
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--apple-ink)' }}>
                            Facility_Energy_Submetering_2025.pdf
                          </td>
                          <td style={{ padding: '10px 8px', color: '#7a8f81', fontFamily: 'var(--apple-font-mono)' }}>840.2 KB</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(31, 122, 76, 0.08)', color: 'var(--apple-primary)', fontWeight: 600 }}>
                              Module A3 Manufacturing
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#2e9e5b', fontWeight: 600 }}>
                            34,000 kWh Electricity
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--apple-ink)' }}>
                            Tier1_Inbound_Freight_Manifest.csv
                          </td>
                          <td style={{ padding: '10px 8px', color: '#7a8f81', fontFamily: 'var(--apple-font-mono)' }}>18.2 KB</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(31, 122, 76, 0.08)', color: 'var(--apple-primary)', fontWeight: 600 }}>
                              Module A2 Inbound Logistics
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#2e9e5b', fontWeight: 600 }}>
                            485 km (EURO 6 Lorry)
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--apple-hairline)' }}>
                      <span style={{ fontSize: '12px', color: '#5b6f62' }}>
                        Ready for automated cradle-to-grave characterization
                      </span>
                      <button type="button" onClick={onLaunchApp} className="btn-apple-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                        <span>Upload Your Files in Studio →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Review BOM View Preview */}
                {activeView === 'review' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--apple-ink)', margin: 0 }}>
                        Bill of Materials &amp; Activity Mapping (Module A1)
                      </h4>
                      <span style={{ fontSize: '12px', color: '#2e9e5b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircleIcon size={14} /> 100% Mass Mapped (0.0% Cut-Off)
                      </span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--apple-hairline)', color: '#5b6f62', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>COMPONENT ASSEMBLY</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>MASS (KG)</th>
                          <th style={{ padding: '8px' }}>SHARE</th>
                          <th style={{ padding: '8px' }}>ECOINVENT V3.12 PROVIDER</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                          <td style={{ padding: '9px 8px', fontWeight: 600, color: 'var(--apple-ink)' }}>Compressor Shell &amp; Frame</td>
                          <td style={{ padding: '9px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>2,100</td>
                          <td style={{ padding: '9px 8px', color: '#7a8f81' }}>60.5%</td>
                          <td style={{ padding: '9px 8px', color: 'var(--apple-primary)', fontSize: '12px' }}>steel, low-alloyed, hot rolled [GLO]</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                          <td style={{ padding: '9px 8px', fontWeight: 600, color: 'var(--apple-ink)' }}>Condenser &amp; Evaporator Tubes</td>
                          <td style={{ padding: '9px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>650</td>
                          <td style={{ padding: '9px 8px', color: '#7a8f81' }}>18.7%</td>
                          <td style={{ padding: '9px 8px', color: 'var(--apple-primary)', fontSize: '12px' }}>wire drawing, copper [GLO]</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                          <td style={{ padding: '9px 8px', fontWeight: 600, color: 'var(--apple-ink)' }}>Semi-Hermetic Induction Motor</td>
                          <td style={{ padding: '9px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>450</td>
                          <td style={{ padding: '9px 8px', color: '#7a8f81' }}>13.0%</td>
                          <td style={{ padding: '9px 8px', color: 'var(--apple-primary)', fontSize: '12px' }}>electric motor production [GLO]</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                          <td style={{ padding: '9px 8px', fontWeight: 600, color: 'var(--apple-ink)' }}>Shell Insulation Jackets</td>
                          <td style={{ padding: '9px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>150</td>
                          <td style={{ padding: '9px 8px', color: '#7a8f81' }}>4.3%</td>
                          <td style={{ padding: '9px 8px', color: 'var(--apple-primary)', fontSize: '12px' }}>polyurethane foam, rigid [RER]</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--apple-hairline)' }}>
                      <span style={{ fontSize: '12px', color: '#5b6f62' }}>
                        Total Product Mass: <strong>3,470 kg</strong> • Declared Unit: 1 unit / 500 RT
                      </span>
                      <button type="button" onClick={onLaunchApp} className="btn-apple-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                        <span>Edit BOM in Studio →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Validate PCR View Preview */}
                {activeView === 'validate' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--apple-ink)', margin: 0 }}>
                        Pre-Audit Quality Gates &amp; Standards Verification
                      </h4>
                      <span style={{ fontSize: '12px', color: '#2e9e5b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircleIcon size={14} /> 5 of 5 Gates Passed
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                      {[
                        { title: 'Mandatory Indicators', spec: '16 / 16 (100%)', std: 'UL 10010-4 / EN 15804+A2', status: 'Passed' },
                        { title: 'Mass Cut-Off Threshold', spec: '0.0% (<1.0% single)', std: 'ISO 14025 §4.3', status: 'Passed' },
                        { title: 'Modular Completeness', spec: 'Modules A1–D (Cradle-to-Grave)', std: 'EN 15804+A2 §7.1', status: 'Passed' },
                        { title: 'Database Lineage Audit', spec: 'ecoinvent 3.12 (SHA-256 Valid)', std: 'GPI v4.0 §4.6', status: 'Passed' },
                        { title: 'Grid Mix Specificity', spec: 'US Medium Voltage Subgrid', std: 'GHG Protocol Scope 2', status: 'Passed' },
                      ].map((gate, i) => (
                        <div key={i} style={{ padding: '12px 14px', backgroundColor: '#fbfdfb', border: '1px solid #d9eadf', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-ink)' }}>{gate.title}</span>
                            <span style={{ fontSize: '10px', color: '#2e9e5b', fontWeight: 700, backgroundColor: 'rgba(46, 158, 91, 0.1)', padding: '2px 6px', borderRadius: '9999px' }}>
                              ✓ {gate.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--apple-primary)', fontWeight: 600 }}>{gate.spec}</div>
                          <div style={{ fontSize: '10px', color: '#7a8f81', marginTop: '2px' }}>{gate.std}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--apple-hairline)' }}>
                      <span style={{ fontSize: '12px', color: '#5b6f62' }}>
                        Verdict: <strong>AUDIT VERIFIED</strong> • Eligible for Type III Third-Party Review
                      </span>
                      <button type="button" onClick={onLaunchApp} className="btn-apple-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                        <span>Run Full Audit →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Methodology View Preview */}
                {activeView === 'methodology' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--apple-ink)', margin: 0 }}>
                        LCIA Methodology Characterization Packages
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--apple-primary)', fontWeight: 600 }}>
                        41 ecoinvent 3.12 Models Supported
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                      {[
                        { id: 'ef31', name: 'EF v3.1 (PEF Compliant)', sub: '16 Core Indicators • Recommended European Standard', badge: 'Active Selection', active: true },
                        { id: 'traci', name: 'TRACI 2.1 (US EPA)', sub: '9 Midpoint Indicators • Required for UL 10010-4 Part B', badge: 'North America', active: false },
                        { id: 'ipcc', name: 'IPCC 2021 GWP100', sub: 'Direct 100-Year Climate Warming Assessment', badge: 'GHG Scope', active: false },
                        { id: 'cml', name: 'CML-IA Baseline (v4.8)', sub: 'European Baseline Midpoint Characterization', badge: 'Classic LCA', active: false },
                      ].map(method => (
                        <div
                          key={method.id}
                          style={{
                            padding: '14px',
                            backgroundColor: method.active ? 'rgba(31, 122, 76, 0.04)' : '#ffffff',
                            border: `1px solid ${method.active ? 'var(--apple-primary)' : 'var(--apple-hairline)'}`,
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apple-ink)' }}>{method.name}</span>
                            <span style={{ fontSize: '10px', color: method.active ? '#ffffff' : '#5b6f62', backgroundColor: method.active ? 'var(--apple-primary)' : 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '9999px', fontWeight: 600 }}>
                              {method.badge}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#5b6f62', lineHeight: '1.4' }}>{method.sub}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--apple-hairline)' }}>
                      <span style={{ fontSize: '12px', color: '#5b6f62' }}>
                        Switch methodologies dynamically without losing background inventory
                      </span>
                      <button type="button" onClick={onLaunchApp} className="btn-apple-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                        <span>Select Package in Studio →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. Results Matrix View Preview */}
                {activeView === 'results' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--apple-ink)', margin: 0 }}>
                        Environmental Impact Results Matrix (EF 3.1)
                      </h4>
                      <span style={{ fontSize: '12px', color: '#2e9e5b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircleIcon size={14} /> DQR Rating 1.42 (High Quality)
                      </span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--apple-hairline)', color: '#5b6f62', textAlign: 'left' }}>
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
                          <td style={{ padding: '10px 8px', color: '#7a8f81' }}>kg CO₂e</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', fontWeight: 600, color: 'var(--apple-primary)' }}>20,700</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>1,450</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>4,820</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>920</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', color: '#2e9e5b' }}>-3,840</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 600 }}>ODP</td>
                          <td style={{ padding: '10px 8px', color: '#7a8f81' }}>kg CFC-11e</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>1.24e-4</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>8.10e-6</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>2.10e-5</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>3.40e-6</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', color: '#2e9e5b' }}>-2.10e-5</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 600 }}>AP</td>
                          <td style={{ padding: '10px 8px', color: '#7a8f81' }}>mol H+ eq</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>94.2</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>6.12</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>14.8</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)' }}>3.40</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', color: '#2e9e5b' }}>-18.4</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--apple-hairline)' }}>
                      <span style={{ fontSize: '12px', color: '#5b6f62' }}>
                        Showing 3 of 25 indicators • Full matrix includes ADP, WDP, POCP &amp; Ecotoxicity
                      </span>
                      <button type="button" onClick={onLaunchApp} className="btn-apple-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                        <span>Explore Full Results →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. Export EPD View Preview */}
                {activeView === 'export' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--apple-ink)', margin: 0 }}>
                        EPD Publication &amp; Digital Standards Export
                      </h4>
                      <span style={{ fontSize: '12px', color: '#2e9e5b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircleIcon size={14} /> ISO 14025 Type III Declaration Ready
                      </span>
                    </div>

                    <div style={{ padding: '16px', backgroundColor: '#f8fdf9', border: '1px solid #d9eadf', borderRadius: '10px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#7a8f81', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Declaration Number</span>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--apple-ink)' }}>EPD11017 • AquaEdge® 19DV Centrifugal Chiller</div>
                          <div style={{ fontSize: '12px', color: '#5b6f62' }}>Carrier Corporation • 1 ton chilling capacity over 25 years RSL</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', backgroundColor: 'var(--apple-primary)', color: '#FFF' }}>
                          VERIFIED
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12px', color: '#5b6f62', paddingTop: '10px', borderTop: '1px solid rgba(46, 158, 91, 0.15)' }}>
                        <div><strong>Program Operator:</strong> NSF Certification LLC</div>
                        <div><strong>Reference PCR:</strong> UL 10010-4 Part B v2.0</div>
                        <div><strong>Validity:</strong> 5 Years (to Dec 2029)</div>
                        <div><strong>Audit Lineage:</strong> SHA-256 Validated</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'var(--apple-canvas-parchment)', border: '1px solid var(--apple-hairline)', color: 'var(--apple-ink)' }}>
                          📄 Publication PDF (14 Pages)
                        </span>
                        <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'var(--apple-canvas-parchment)', border: '1px solid var(--apple-hairline)', color: 'var(--apple-ink)' }}>
                          ⚡ openEPD® JSON v2.0
                        </span>
                        <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'var(--apple-canvas-parchment)', border: '1px solid var(--apple-hairline)', color: 'var(--apple-ink)' }}>
                          📦 7-File Verifier ZIP Bundle
                        </span>
                      </div>

                      <button type="button" onClick={onLaunchApp} className="btn-apple-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                        <span>Export in Studio →</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
