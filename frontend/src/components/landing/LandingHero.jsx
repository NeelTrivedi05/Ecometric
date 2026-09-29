import React, { useState } from 'react';
import { ChevronRightIcon, CheckCircleIcon, FileIcon, LeafIcon } from '../studio/Icons';

export default function LandingHero({ onLaunchApp }) {
  const [selectedTab, setSelectedTab] = useState('summary');

  return (
    <section className="product-tile-light" id="product" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
      <div className="lp-container">
        <div className="apple-section-eyebrow" style={{ textAlign: 'center', display: 'block' }}>
          Life Cycle Assessment Platform
        </div>

        <h1 className="apple-hero-headline">
          Generate EPDs<br />
          without the spreadsheet nightmare.
        </h1>

        <p className="apple-hero-tagline">
          Automate your Environmental Product Declaration workflow with verified ecoinvent v3.12 background data and instant PCR compliance.
        </p>

        <div className="apple-hero-actions">
          <button
            type="button"
            onClick={onLaunchApp}
            className="btn-apple-primary"
            style={{ padding: '12px 26px', fontSize: '16px' }}
          >
            <span>Start creating EPD</span>
            <ChevronRightIcon size={16} />
          </button>

          <a
            href="#solution"
            className="btn-apple-secondary"
            style={{ padding: '12px 26px', fontSize: '16px' }}
          >
            See how it works
          </a>
        </div>

        {/* Dashboard / Product Visual Mockup resting on surface with the ONE signature shadow */}
        <div className="apple-product-render">
          {/* Mock Window Top Bar */}
          <div style={{
            padding: '12px 20px',
            backgroundColor: 'var(--apple-canvas-parchment)',
            borderBottom: '1px solid var(--apple-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apple-ink)', marginLeft: '6px', letterSpacing: '-0.1px' }}>
                EcoMetric Studio — Industrial Chiller 500RT EPD Model
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: 'var(--apple-radius-pill)',
                backgroundColor: 'rgba(52, 199, 89, 0.12)',
                color: '#28cd41',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <CheckCircleIcon size={12} />
                PCR Verified (EN 15804+A2)
              </span>
            </div>
          </div>

          {/* Mock Dashboard Body */}
          <div style={{ padding: '28px', backgroundColor: 'var(--apple-canvas)' }}>
            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderRadius: 'var(--apple-radius-lg)', backgroundColor: 'var(--apple-canvas-parchment)', border: '1px solid var(--apple-hairline)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Embodied GWP (A1–A3)
                </div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--apple-primary)', marginTop: '4px', letterSpacing: '-0.02em' }}>
                  20,700 <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--apple-ink)' }}>kg CO₂e</span>
                </div>
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
                  ecoinvent v3.12 Cutoff
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderRadius: 'var(--apple-radius-lg)', backgroundColor: 'var(--apple-canvas-parchment)', border: '1px solid var(--apple-hairline)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Net Circularity (Module D)
                </div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#28cd41', marginTop: '4px', letterSpacing: '-0.02em' }}>
                  -3,840 <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--apple-ink)' }}>kg CO₂e</span>
                </div>
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
                  Avoided Virgin Extraction
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderRadius: 'var(--apple-radius-lg)', backgroundColor: 'var(--apple-canvas-parchment)', border: '1px solid var(--apple-hairline)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  5-Gate PCR Check
                </div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--apple-ink)', marginTop: '4px', letterSpacing: '-0.02em' }}>
                  100% Pass
                </div>
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
                  Cut-off &lt; 1.0% Mass
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderRadius: 'var(--apple-radius-lg)', backgroundColor: 'var(--apple-canvas-parchment)', border: '1px solid var(--apple-hairline)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  PEF 3.0 DQR Rating
                </div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--apple-primary)', marginTop: '4px', letterSpacing: '-0.02em' }}>
                  1.42 <span style={{ fontSize: '12px', fontWeight: 400, color: '#28cd41' }}>(Very Good)</span>
                </div>
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
                  Audit-Ready Lineage
                </div>
              </div>
            </div>

            {/* Interactive Tab Switcher */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--apple-hairline)', paddingBottom: '12px', marginBottom: '16px' }}>
              {[
                { id: 'summary', label: 'Life Cycle Stages (A1–D)' },
                { id: 'bom', label: 'BOM Supply Chain Lineage' },
                { id: 'compliance', label: 'PCR Rules Audit Log' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`configurator-chip ${selectedTab === tab.id ? 'selected' : ''}`}
                  style={{ padding: '6px 16px', fontSize: '13px' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mock Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--apple-hairline)', textAlign: 'left', color: '#6e6e73' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600, fontSize: '12px' }}>LIFECYCLE STAGE</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, fontSize: '12px' }}>MODULE BOUNDARY</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, fontSize: '12px', textAlign: 'right' }}>GWP (KG CO₂E)</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, fontSize: '12px', textAlign: 'right' }}>SHARE (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--apple-ink)' }}>A1–A3 Production</td>
                  <td style={{ padding: '12px', color: '#6e6e73' }}>Raw materials, inbound transport, factory assembly</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', fontWeight: 600, color: 'var(--apple-primary)' }}>20,700</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', color: 'var(--apple-ink)' }}>74.2%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--apple-ink)' }}>A4–A5 Construction</td>
                  <td style={{ padding: '12px', color: '#6e6e73' }}>Distribution freight (500 km) & crane installation</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', fontWeight: 600, color: 'var(--apple-primary)' }}>1,450</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', color: 'var(--apple-ink)' }}>5.2%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--apple-ink)' }}>B1–B7 Use Phase</td>
                  <td style={{ padding: '12px', color: '#6e6e73' }}>25-yr operational energy & fugitive refrigerant</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', fontWeight: 600, color: 'var(--apple-primary)' }}>4,820</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', color: 'var(--apple-ink)' }}>17.3%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--apple-divider-soft)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--apple-ink)' }}>C1–C4 End-of-Life</td>
                  <td style={{ padding: '12px', color: '#6e6e73' }}>Demolition, scrap sorting, and inert landfilling</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', fontWeight: 600, color: 'var(--apple-primary)' }}>920</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', color: 'var(--apple-ink)' }}>3.3%</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#28cd41' }}>Module D Circularity</td>
                  <td style={{ padding: '12px', color: '#6e6e73' }}>Net benefits from scrap steel, copper & aluminium</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', fontWeight: 600, color: '#28cd41' }}>-3,840</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--apple-font-mono)', color: '#28cd41' }}>-13.8%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
