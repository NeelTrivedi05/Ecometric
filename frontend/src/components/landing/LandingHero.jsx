import React, { useState } from 'react';
import { ChevronRightIcon, CheckCircleIcon, FileIcon, LeafIcon } from '../studio/Icons';

export default function LandingHero({ onLaunchApp }) {
  const [selectedTab, setSelectedTab] = useState('summary');

  return (
    <section className="lp-hero" id="product">
      <div className="lp-container">
        <h1 className="lp-hero-headline" style={{ maxWidth: '820px', margin: '0 auto 20px auto' }}>
          Generate EPDs<br />
          <span style={{ color: '#C25A23' }}>without the spreadsheet nightmare.</span>
        </h1>

        <p className="lp-hero-sub" style={{ maxWidth: '640px', margin: '0 auto 32px auto' }}>
          Automate your Life Cycle Assessment and Environmental Product Declaration workflow.
        </p>

        <div className="lp-hero-actions" style={{ marginBottom: '48px' }}>
          <button
            type="button"
            onClick={onLaunchApp}
            className="btn-lp-primary"
            style={{ padding: '14px 28px', fontSize: '15px' }}
          >
            <span>Start creating EPD</span>
            <ChevronRightIcon size={16} />
          </button>

          <a
            href="#how-it-works"
            className="btn-lp-secondary"
            style={{ padding: '14px 28px', fontSize: '15px' }}
          >
            See how it works
          </a>
        </div>

        {/* Dashboard / Product Visual Mockup */}
        <div style={{
          maxWidth: '960px',
          margin: '0 auto',
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #EAE0D5',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(44, 34, 30, 0.08)',
          textAlign: 'left'
        }}>
          {/* Mock Window Top Bar */}
          <div style={{
            padding: '12px 18px',
            backgroundColor: '#FAF5EE',
            borderBottom: '1px solid #EAE0D5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#E29578' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ECC195' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#A9C4A0' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#5C4E46', marginLeft: '8px' }}>
                EcoMetric Studio — Water-Cooled Chiller 500RT EPD Model
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#E8F5E9',
                color: '#2E7D32',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <CheckCircleIcon size={12} />
                PCR Verified (UL 10010-4)
              </span>
            </div>
          </div>

          {/* Mock Dashboard Body */}
          <div style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
            {/* Top Stat Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#FAF6F0', border: '1px solid #EFE4D8' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#8A7A72', textTransform: 'uppercase' }}>
                  Embodied GWP (A1–A3)
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#C25A23', marginTop: '2px' }}>
                  20,700 <span style={{ fontSize: '12px', fontWeight: 500 }}>kg CO₂e</span>
                </div>
                <div style={{ fontSize: '11px', color: '#5C4E46', marginTop: '2px' }}>
                  ecoinvent v3.12 Cutoff
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#FAF6F0', border: '1px solid #EFE4D8' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#8A7A72', textTransform: 'uppercase' }}>
                  Operational Power (B6)
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#2C221E', marginTop: '2px' }}>
                  312,000 <span style={{ fontSize: '12px', fontWeight: 500 }}>kg CO₂e</span>
                </div>
                <div style={{ fontSize: '11px', color: '#5C4E46', marginTop: '2px' }}>
                  25-Year Lifecycle
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#FAF6F0', border: '1px solid #EFE4D8' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#8A7A72', textTransform: 'uppercase' }}>
                  Net Circularity (Module D)
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#2E7D32', marginTop: '2px' }}>
                  -6,840 <span style={{ fontSize: '12px', fontWeight: 500 }}>kg CO₂e</span>
                </div>
                <div style={{ fontSize: '11px', color: '#2E7D32', marginTop: '2px' }}>
                  92.4% Metal Recovery
                </div>
              </div>
            </div>

            {/* Mock BOM Table View */}
            <div style={{
              borderRadius: '8px',
              border: '1px solid #EFE4D8',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAF5EE', borderBottom: '1px solid #EFE4D8', textAlign: 'left', color: '#5C4E46' }}>
                    <th style={{ padding: '10px 12px' }}>Component</th>
                    <th style={{ padding: '10px 12px' }}>Material</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Mass</th>
                    <th style={{ padding: '10px 12px' }}>ecoinvent Dataset Linked</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Cut-off Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F2EAE2' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>Compressor Shell & Frame</td>
                    <td style={{ padding: '10px 12px', color: '#5C4E46' }}>Steel, low-alloyed</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>2,100 kg</td>
                    <td style={{ padding: '10px 12px', color: '#8A7A72' }}>market for steel, low-alloyed | Cutoff, U</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Passed (60.5%)</span>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F2EAE2' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>Condenser & Evaporator Tubes</td>
                    <td style={{ padding: '10px 12px', color: '#5C4E46' }}>Copper, cathode</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>650 kg</td>
                    <td style={{ padding: '10px 12px', color: '#8A7A72' }}>market for copper, drawn tube | Cutoff, U</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Passed (18.7%)</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>Semi-Hermetic Induction Motor</td>
                    <td style={{ padding: '10px 12px', color: '#5C4E46' }}>Electric motor, vehicle</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>450 kg</td>
                    <td style={{ padding: '10px 12px', color: '#8A7A72' }}>market for electric motor | Cutoff, U</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Passed (12.9%)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
