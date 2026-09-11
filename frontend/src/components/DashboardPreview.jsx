import React, { useState } from 'react';
import { BENCHMARK_PRODUCTS } from '../data/epdData';

export default function DashboardPreview() {
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [activeStage, setActiveStage] = useState('all');
  const [downloadNotice, setDownloadNotice] = useState('');

  const product = BENCHMARK_PRODUCTS[selectedProductIndex];
  const stageData = product.stages[activeStage] || product.stages.all;

  const handleDownload = (format) => {
    setDownloadNotice(`Generated ${format} for ${product.name} (${product.refDoc})`);
    setTimeout(() => setDownloadNotice(''), 4000);
  };

  return (
    <section className="dashboard-preview-section" id="dashboard">
      <div className="container">
        <div className="section-header">
          <div className="badge">
            <span className="badge-pulse-dot"></span>
            <span>LIVE INTERACTIVE PREVIEW</span>
          </div>
          <h2 className="section-title">Dashboard Preview</h2>
          <p className="section-subtitle">
            Experience the automated Life Cycle Impact assessment studio. Switch benchmark products, toggle EN 15804+A2 life cycle modules, and inspect characterized EF 3.1 results.
          </p>
        </div>

        <div className="dashboard-app-frame">
          {/* Top Control Bar */}
          <div className="app-frame-nav">
            <div className="product-selector-group">
              <span style={{ fontSize: '0.825rem', color: '#94a3b8', fontWeight: 600 }}>Active Product:</span>
              {BENCHMARK_PRODUCTS.map((prod, idx) => (
                <button
                  key={prod.id}
                  type="button"
                  className={`product-select-btn ${idx === selectedProductIndex ? 'active' : ''}`}
                  onClick={() => setSelectedProductIndex(idx)}
                >
                  {prod.name.split(' ')[0]} {prod.name.split(' ')[1]}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownload('ILCD+EPD XML')}
              >
                <span>Export ILCD XML</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleDownload('PDF Declaration (GPI 5.0.1)')}
              >
                <span>Download PDF EPD</span>
              </button>
            </div>
          </div>

          {/* Download Notification Toast */}
          {downloadNotice && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.2)',
              borderBottom: '1px solid #10b981',
              padding: '10px 24px',
              fontSize: '0.85rem',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>✓ {downloadNotice}</span>
              <span className="mono" style={{ fontSize: '0.75rem' }}>Verifier Package Ready</span>
            </div>
          )}

          {/* Body */}
          <div className="app-frame-body">
            {/* Meta Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '24px',
              padding: '16px 20px',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '4px' }}>
                  {product.name}
                </h3>
                <span className="mono" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Ref: {product.refDoc} • Declared Unit: {product.declaredUnit}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>TOTAL MASS</div>
                  <div className="mono" style={{ fontSize: '1rem', color: '#34d399', fontWeight: 700 }}>
                    {product.massKg.toLocaleString()} kg
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>REFRIGERANT / MIX</div>
                  <div className="mono" style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 600 }}>
                    {product.refrigerant}
                  </div>
                </div>
              </div>
            </div>

            {/* Stage Tabs */}
            <div className="stage-tabs">
              <button
                type="button"
                className={`stage-tab-btn ${activeStage === 'all' ? 'active' : ''}`}
                onClick={() => setActiveStage('all')}
              >
                Cradle-to-Grave + Module D (All)
              </button>
              <button
                type="button"
                className={`stage-tab-btn ${activeStage === 'a1_a3' ? 'active' : ''}`}
                onClick={() => setActiveStage('a1_a3')}
              >
                A1–A3 (Manufacturing)
              </button>
              <button
                type="button"
                className={`stage-tab-btn ${activeStage === 'b1_b7' ? 'active' : ''}`}
                onClick={() => setActiveStage('b1_b7')}
              >
                B1–B7 (Use & Leakage)
              </button>
              <button
                type="button"
                className={`stage-tab-btn ${activeStage === 'c1_c4' ? 'active' : ''}`}
                onClick={() => setActiveStage('c1_c4')}
              >
                C1–C4 (End of Life)
              </button>
              <button
                type="button"
                className={`stage-tab-btn ${activeStage === 'd' ? 'active' : ''}`}
                onClick={() => setActiveStage('d')}
              >
                Module D (Benefits)
              </button>
            </div>

            {/* Environmental Indicator Table */}
            <div className="indicator-table-wrap">
              <table className="indicator-table">
                <thead>
                  <tr>
                    <th>Core Environmental Indicator</th>
                    <th>LCIA Method</th>
                    <th>Declared Unit Result</th>
                    <th>Compliance Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="indicator-name">
                        <span>🌍</span>
                        <span>GWP-total (Global Warming Potential - Total)</span>
                      </div>
                    </td>
                    <td><span className="mono">GWP100, EN 15804 (EF 3.1)</span></td>
                    <td><span className="indicator-value">{stageData.gwpTotal}</span></td>
                    <td><span className="badge">Verified</span></td>
                  </tr>

                  <tr>
                    <td>
                      <div className="indicator-name">
                        <span>🏭</span>
                        <span>GWP-fossil (Fossil Greenhouse Gas)</span>
                      </div>
                    </td>
                    <td><span className="mono">GWP100, EF 3.1</span></td>
                    <td><span className="indicator-value">{stageData.gwpFossil}</span></td>
                    <td><span className="badge">Verified</span></td>
                  </tr>

                  <tr>
                    <td>
                      <div className="indicator-name">
                        <span>🌱</span>
                        <span>GWP-biogenic (Biogenic Carbon Mass Balance)</span>
                      </div>
                    </td>
                    <td><span className="mono">PCR 2019:14 Annex 2 Rule</span></td>
                    <td><span className="indicator-value">{stageData.gwpBiogenic}</span></td>
                    <td><span className="badge badge-cyan">Net-Zero Balanced</span></td>
                  </tr>

                  <tr>
                    <td>
                      <div className="indicator-name">
                        <span>🌧️</span>
                        <span>Acidification Potential (AP)</span>
                      </div>
                    </td>
                    <td><span className="mono">Accumulated Exceedance, EF 3.1</span></td>
                    <td><span className="indicator-value">{stageData.ap}</span></td>
                    <td><span className="badge">Verified</span></td>
                  </tr>

                  <tr>
                    <td>
                      <div className="indicator-name">
                        <span>💨</span>
                        <span>Photochemical Ozone Creation (POCP)</span>
                      </div>
                    </td>
                    <td><span className="mono">LOTOS-EUROS (ReCiPe)</span></td>
                    <td><span className="indicator-value">{stageData.pocp}</span></td>
                    <td><span className="badge">Verified</span></td>
                  </tr>

                  <tr>
                    <td>
                      <div className="indicator-name">
                        <span>🛡️</span>
                        <span>Ozone Depletion Potential (ODP)</span>
                      </div>
                    </td>
                    <td><span className="mono">EN 15804 / WMO</span></td>
                    <td><span className="indicator-value">{stageData.odp}</span></td>
                    <td><span className="badge">Verified</span></td>
                  </tr>

                  <tr>
                    <td>
                      <div className="indicator-name">
                        <span>⛏️</span>
                        <span>Abiotic Depletion (Minerals & Metals)*</span>
                      </div>
                    </td>
                    <td><span className="mono">CML 2001 Baseline (Jan 2016)</span></td>
                    <td><span className="indicator-value">{stageData.adpMinerals}</span></td>
                    <td><span className="badge badge-amber">Caution (High Uncertainty)*</span></td>
                  </tr>

                  <tr>
                    <td>
                      <div className="indicator-name">
                        <span>⛽</span>
                        <span>Abiotic Depletion (Fossil Resources)*</span>
                      </div>
                    </td>
                    <td><span className="mono">EN 15804 (Aug 2021)</span></td>
                    <td><span className="indicator-value">{stageData.adpFossil}</span></td>
                    <td><span className="badge badge-amber">Caution (High Uncertainty)*</span></td>
                  </tr>

                  <tr>
                    <td>
                      <div className="indicator-name">
                        <span>💧</span>
                        <span>Water Deprivation Potential (WDP)*</span>
                      </div>
                    </td>
                    <td><span className="mono">AWARE Method, EN 15804</span></td>
                    <td><span className="indicator-value">{stageData.wdp}</span></td>
                    <td><span className="badge badge-amber">Caution (Limited Experience)*</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mandatory Disclaimer Text (GPI 5.0.1 Section 5.9 requirement) */}
            <div className="disclaimer-alert">
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <strong>*Mandatory GPI 5.0.1 Disclaimer:</strong> The results of Abiotic Depletion (minerals/metals), Abiotic Depletion (fossil), and Water Deprivation (WDP) shall be used with care as the uncertainties on these results are high or as there is limited experience with the indicator.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
