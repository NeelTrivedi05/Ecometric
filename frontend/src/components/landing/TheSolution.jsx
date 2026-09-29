import React, { useState } from 'react';
import { ChevronRightIcon, CheckCircleIcon, FileIcon } from '../studio/Icons';

export default function TheSolution() {
  const [activeStep, setActiveStep] = useState(0);

  const workflowSteps = [
    {
      title: "1. Ingest Product Data",
      subtitle: "BOM & Energy Ingestion",
      desc: "Upload engineering bill of materials (BOM), plant utility electricity logs, and Tier-1 transport manifests in CSV, Excel, or PDF format."
    },
    {
      title: "2. Dataset Linking",
      subtitle: "ecoinvent v3.12 Engine",
      desc: "Components are mapped to verified background datasets (steel, copper, motors, regional grids) with automated proxy suggestions."
    },
    {
      title: "3. LCIA Dynamic Engine",
      subtitle: "EN 15804+A2 / EF 3.1",
      desc: "The characterization engine calculates 13 core indicators across all lifecycle modules (A1–A3, A4–A5, B1–B7, C1–C4, Module D)."
    },
    {
      title: "4. Automated PCR Gate",
      subtitle: "5-Gate Compliance Rule",
      desc: "The rules engine enforces mass cut-off criteria (<1%), proxy data thresholds (<10%), and mandatory module declarations before building."
    },
    {
      title: "5. Verified EPD Export",
      subtitle: "Publication PDF & ILCD XML",
      desc: "Export third-party verifier ready publication PDFs and EcoPlatform compliant machine-readable ILCD+EPD XML in one click."
    }
  ];

  return (
    <section className="product-tile-light" id="solution">
      <div className="lp-container">
        <div className="apple-section-header">
          <div className="apple-section-eyebrow">
            The Solution
          </div>
          <h2 className="apple-section-title">
            One workflow from product data → verified EPD
          </h2>
          <p className="apple-section-subtitle">
            An end-to-end automated platform that replaces fragmented consulting steps with a continuous, traceable digital pipeline.
          </p>
        </div>

        {/* Step Selector Chips (Apple configurator-option-chip style) */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          {workflowSteps.map((step, idx) => {
            const isSelected = activeStep === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`configurator-chip ${isSelected ? 'selected' : ''}`}
                style={{
                  padding: '11px 20px',
                  fontSize: '14px',
                  fontWeight: isSelected ? 600 : 400
                }}
              >
                <span>{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Detail Container Card (Store Utility Card style: 18px radius, 1px hairline, no shadow) */}
        <div className="store-utility-card" style={{ maxWidth: '860px', margin: '0 auto', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--apple-primary)'
            }}>
              Step 0{activeStep + 1} • {workflowSteps[activeStep].subtitle}
            </span>
            <span style={{
              fontSize: '12px',
              color: '#28cd41',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircleIcon size={14} /> Automated Verification
            </span>
          </div>

          <h3 style={{
            fontFamily: 'var(--apple-font-display)',
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--apple-ink)',
            marginBottom: '12px',
            letterSpacing: '-0.02em'
          }}>
            {workflowSteps[activeStep].title}
          </h3>

          <p style={{
            fontSize: '17px',
            color: '#6e6e73',
            lineHeight: '1.47',
            letterSpacing: '-0.374px',
            marginBottom: '24px'
          }}>
            {workflowSteps[activeStep].desc}
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '20px',
            borderTop: '1px solid var(--apple-hairline)',
            fontSize: '13px',
            color: '#86868b'
          }}>
            <span>EN 15804+A2 & ISO 14025 Aligned</span>
            <span style={{ color: 'var(--apple-primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveStep((activeStep + 1) % workflowSteps.length)}>
              Next Step →
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
