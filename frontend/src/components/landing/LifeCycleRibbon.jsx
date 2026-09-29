import React, { useState } from 'react';
import { LCA_STAGES } from '../../data/landingData';
import { ChevronRightIcon, CheckCircleIcon, LeafIcon } from '../studio/Icons';

export default function LifeCycleRibbon() {
  const [activeStageId, setActiveStageId] = useState('a1_a3');

  const currentStage = LCA_STAGES.find(s => s.id === activeStageId) || LCA_STAGES[0];

  return (
    <section className="product-tile-dark-2" id="stages">
      <div className="lp-container">
        <div className="apple-section-header">
          <div className="apple-section-eyebrow on-dark">
            Modular Scoping (EN 15804+A2)
          </div>
          <h2 className="apple-section-title" style={{ color: 'var(--apple-body-on-dark)' }}>
            The Complete Cradle-to-Grave Life Cycle
          </h2>
          <p className="apple-section-subtitle">
            Under EN 15804+A2 and PCR 2019:14, EPDs require comprehensive lifecycle accounting across all standard modules. Select any module to inspect its system boundaries.
          </p>
        </div>

        {/* Stage Node Selector Chips */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '32px'
        }}>
          {LCA_STAGES.map((stg) => {
            const isActive = stg.id === activeStageId;
            return (
              <div
                key={stg.id}
                onClick={() => setActiveStageId(stg.id)}
                style={{
                  backgroundColor: isActive ? 'var(--apple-surface-tile-1)' : 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--apple-primary-on-dark)' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--apple-radius-lg)',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 'var(--apple-radius-sm)',
                    backgroundColor: isActive ? 'var(--apple-primary-on-dark)' : 'rgba(255, 255, 255, 0.12)',
                    color: isActive ? '#000000' : '#ffffff'
                  }}>
                    {stg.code}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-primary-on-dark)', fontFamily: 'var(--apple-font-mono)' }}>
                    {stg.gwpShare}
                  </span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--apple-body-on-dark)', letterSpacing: '-0.2px' }}>
                  {stg.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--apple-body-muted)', marginTop: '4px' }}>
                  {stg.boundary}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Stage Detail Panel */}
        <div style={{
          backgroundColor: 'var(--apple-surface-tile-1)',
          borderRadius: 'var(--apple-radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-primary-on-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              System Boundary Detail • {currentStage.code}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--apple-body-muted)' }}>
              ecoinvent v3.12 Cut-off Allocation
            </div>
          </div>

          <h3 style={{
            fontFamily: 'var(--apple-font-display)',
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--apple-body-on-dark)',
            marginBottom: '12px'
          }}>
            {currentStage.name} ({currentStage.code})
          </h3>

          <p style={{
            fontSize: '17px',
            color: 'var(--apple-body-muted)',
            lineHeight: '1.47',
            marginBottom: '20px'
          }}>
            {currentStage.desc}
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '13px',
            color: '#a1a1a6',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span>Boundary: <strong style={{ color: '#ffffff' }}>{currentStage.boundary}</strong></span>
            <span>Typical Benchmark GWP Impact: <strong style={{ color: 'var(--apple-primary-on-dark)', fontFamily: 'var(--apple-font-mono)' }}>{currentStage.gwpShare}</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}
