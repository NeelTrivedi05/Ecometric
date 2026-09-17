import React, { useState } from 'react';
import { ChevronRightIcon, CheckCircleIcon, FileIcon } from '../studio/Icons';

export default function TheSolution() {
  const [activeStep, setActiveStep] = useState(0);

  const workflowSteps = [
    {
      title: "1. Product Data",
      subtitle: "BOM & Energy Ingestion",
      desc: "Upload CAD/ERP BOM spreadsheets, facility utility electricity bills, and Tier-1 transport distances in any common format."
    },
    {
      title: "2. Dataset Linking",
      subtitle: "ecoinvent v3.12 Engine",
      desc: "Components are mapped to verified background datasets (steel, copper, motors, regional grids) with automated proxy suggestions."
    },
    {
      title: "3. LCIA Engine",
      subtitle: "EN 15804+A2 / EF 3.1",
      desc: "The characterization engine calculates 13 core indicators across all lifecycle modules (A1–A3, A4–A5, B1–B7, C1–C4, Module D)."
    },
    {
      title: "4. PCR Validation",
      subtitle: "Automated Compliance Gate",
      desc: "The rules engine verifies mass cut-off criteria, proxy data thresholds, and mandatory module declarations before building."
    },
    {
      title: "5. Verified EPD",
      subtitle: "Publication PDF & ILCD XML",
      desc: "Export third-party verifier ready publication PDFs and EcoPlatform compliant machine-readable ILCD+EPD XML in one click."
    }
  ];

  return (
    <section id="solution" style={{ padding: '80px 0', backgroundColor: '#FFFFFF', borderTop: '1px solid #EFE4D8', borderBottom: '1px solid #EFE4D8' }}>
      <div className="lp-container">
        <div className="section-header">
          <div className="section-badge">
            <span>The Solution</span>
          </div>
          <h2 className="section-title">One workflow from product data → EPD</h2>
          <p className="section-subtitle">
            An end-to-end automated platform that replaces fragmented consulting steps with a continuous, traceable digital pipeline.
          </p>
        </div>

        {/* Visual Interactive Workflow Bar */}
        <div style={{
          backgroundColor: '#FAF5EE',
          borderRadius: '16px',
          border: '1px solid #EAE0D5',
          padding: '32px 24px',
          boxShadow: '0 4px 20px rgba(44, 34, 30, 0.04)'
        }}>
          {/* Step Pills */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '28px'
          }}>
            {workflowSteps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  style={{
                    backgroundColor: isActive ? '#FFFFFF' : '#FAF6F0',
                    border: '1px solid',
                    borderColor: isActive ? '#C25A23' : '#EAE0D5',
                    borderRadius: '10px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(194, 90, 35, 0.12)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: isActive ? '#C25A23' : '#8A7A72' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#2C221E', marginTop: '4px' }}>
                    {step.subtitle}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Step Showcase */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #EAE0D5',
            padding: '24px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ maxWidth: '580px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#C25A23', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Stage Details
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C221E', margin: '4px 0 8px 0' }}>
                {workflowSteps[activeStep].title}: {workflowSteps[activeStep].subtitle}
              </h3>
              <p style={{ fontSize: '14px', color: '#5C4E46', lineHeight: '1.6', margin: 0 }}>
                {workflowSteps[activeStep].desc}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : workflowSteps.length - 1))}
                className="btn-lp-secondary"
                style={{ padding: '8px 14px', fontSize: '12px' }}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev < workflowSteps.length - 1 ? prev + 1 : 0))}
                className="btn-lp-primary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Next Stage
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
