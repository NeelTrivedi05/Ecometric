import React, { useState } from 'react';
import { LCA_STAGES } from '../../data/landingData';
import { ChevronRightIcon, CheckCircleIcon, LeafIcon } from '../studio/Icons';

export default function LifeCycleRibbon() {
  const [activeStageId, setActiveStageId] = useState('a1_a3');

  const currentStage = LCA_STAGES.find(s => s.id === activeStageId) || LCA_STAGES[0];

  return (
    <section id="stages" style={{ padding: '80px 0', backgroundColor: '#FAF6F0' }}>
      <div className="lp-container">
        <div className="section-header">
          <div className="section-badge">
            <span>Modular Scoping (EN 15804+A2)</span>
          </div>
          <h2 className="section-title">The Complete Cradle-to-Grave Life Cycle</h2>
          <p className="section-subtitle">
            Under EN 15804+A2 and PCR 2019:14, EPDs require comprehensive lifecycle accounting across all 5 standard modules. Click any stage to inspect its boundaries.
          </p>
        </div>

        <div className="ribbon-container">
          {/* Stage Node Selector */}
          <div className="ribbon-track">
            {LCA_STAGES.map((stg) => {
              const isActive = stg.id === activeStageId;
              return (
                <div
                  key={stg.id}
                  className={`ribbon-node ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveStageId(stg.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isActive ? '#C25A23' : '#EFE4D8',
                      color: isActive ? '#FFFFFF' : '#5C4E46',
                    }}>
                      {stg.code}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#8A7A72' }}>
                      {stg.gwpShare}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#2C221E' }}>
                    {stg.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7A6B63', marginTop: '4px' }}>
                    {stg.boundary}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SVG Connector Graphic */}
          <div style={{ margin: '16px 0 24px 0', textAlign: 'center' }}>
            <svg width="100%" height="24" viewBox="0 0 800 24" fill="none" style={{ maxWidth: '800px', display: 'block', margin: '0 auto' }}>
              <line x1="10" y1="12" x2="790" y2="12" stroke="#E5D6C8" strokeWidth="2" strokeDasharray="6 6" />
              <circle cx="80" cy="12" r="5" fill="#C25A23" />
              <circle cx="240" cy="12" r="5" fill="#C25A23" />
              <circle cx="400" cy="12" r="5" fill="#C25A23" />
              <circle cx="560" cy="12" r="5" fill="#C25A23" />
              <circle cx="720" cy="12" r="5" fill="#2E7D32" />
            </svg>
          </div>

          {/* Detailed Stage Telemetry Card */}
          <div style={{
            backgroundColor: '#FAF5EE',
            borderRadius: '12px',
            border: '1px solid #EAE0D5',
            padding: '24px 28px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#C25A23', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Stage Specification
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#2C221E', margin: '4px 0 8px 0' }}>
                {currentStage.code}: {currentStage.name}
              </h3>
              <p style={{ fontSize: '13px', color: '#5C4E46', lineHeight: '1.6' }}>
                {currentStage.desc}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #EFE4D8', fontSize: '12px' }}>
                <span style={{ color: '#8A7A72' }}>Standard Mandate:</span>
                <strong style={{ color: '#2C221E' }}>{currentStage.standard}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #EFE4D8', fontSize: '12px' }}>
                <span style={{ color: '#8A7A72' }}>System Boundary:</span>
                <strong style={{ color: '#2C221E' }}>{currentStage.boundary}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #EFE4D8', fontSize: '12px' }}>
                <span style={{ color: '#8A7A72' }}>Typical HVAC GWP Share:</span>
                <strong style={{ color: '#C25A23' }}>{currentStage.gwpShare}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
