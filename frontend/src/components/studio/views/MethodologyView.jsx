import React from 'react';
import { useStudio, METHODOLOGIES } from '../../../context/StudioContext';
import { MethodologyIcon, CheckIcon, ChevronRightIcon, InfoIcon, RefreshCwIcon } from '../Icons';
import LciaExtractorSection from '../LciaExtractorSection';

export default function MethodologyView() {
  const {
    selectedMethodology,
    changeMethodology,
    runCalculation,
    isLoading,
    setActivePhase,
  } = useStudio();

  const handleApplyAndCalculate = async () => {
    await runCalculation();
    setActivePhase('results');
  };

  const activeMethodDetails = METHODOLOGIES[selectedMethodology] || METHODOLOGIES.ef31;

  return (
    <div className="view-container">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MethodologyIcon size={24} style={{ color: 'var(--accent)' }} />
          4. Select LCIA Characterization Methodology
        </h1>
        <p className="view-subtitle">
          In OpenLCA and EN 15804 standards, characterization factors convert raw Life Cycle Inventory (LCI) elementary flows into verified environmental impact indicators. Select which methodology package to apply.
        </p>
      </div>

      {/* Educational Note Box explaining LCIA mechanics */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card2)',
          borderLeft: '4px solid var(--accent)',
          padding: '16px 20px',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <InfoIcon size={20} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            <strong>How LCA Characterization Works:</strong> The calculation engine first compiles all elementary flows (energy, raw resources, direct emissions) from your uploaded documents and ecoinvent 3.12 cutoff.
            When you select a methodology below, standard characterization factors are multiplied across those flows (<code>Impact = &sum; Flow<sub>i</sub> &times; CF<sub>i</sub></code>).
            You can return and switch methodologies at any time to re-characterize without re-uploading documents.
          </div>
        </div>
      </div>

      {/* Methodology Selection Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {Object.entries(METHODOLOGIES).map(([key, method]) => {
          const isSelected = selectedMethodology === key;

          return (
            <div
              key={key}
              onClick={() => changeMethodology(key)}
              style={{
                background: isSelected ? 'var(--bg-card)' : 'var(--bg-card)',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckIcon size={14} />
                </div>
              )}

              <div>
                <span
                  style={{
                    fontSize: 'var(--text-2xs)',
                    fontFamily: 'var(--mono)',
                    color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {method.standard}
                </span>

                <h3
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginTop: 4,
                    marginBottom: 8,
                    paddingRight: 24,
                  }}
                >
                  {method.name}
                </h3>

                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                  {method.desc}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border)',
                  paddingTop: 12,
                  marginTop: 12,
                  fontSize: 'var(--text-2xs)',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Indicators</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text-primary)' }}>
                  {method.indicators} Midpoint Impact Categories
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Method Preview */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="card-title">
          <span>Active Package: {activeMethodDetails.name}</span>
          <span className="item-badge" style={{ marginLeft: 'auto' }}>ecoinvent 3.12 cutoff</span>
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12 }}>
          Applying this methodology will characterize elementary flows across declared lifecycle stages (A1–A3 Production, A4 Transport, Stage B Use, Stage C EOL, and Module D Circularity Credits).
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span className="format-tag">GWP-total</span>
          <span className="format-tag">ODP</span>
          <span className="format-tag">Acidification (AP)</span>
          <span className="format-tag">Eutrophication (EP)</span>
          <span className="format-tag">POCP</span>
          <span className="format-tag">ADP-minerals</span>
          <span className="format-tag">ADP-fossil</span>
          <span className="format-tag">Water Deprivation (WDP)</span>
        </div>
      </div>

      {/* Live ecoinvent LCIA Extractor & EPD Calculator Component */}
      <LciaExtractorSection />

      {/* Action Footer */}
      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>

        <button
          type="button"
          className="btn btn-outline btn-lg"
          onClick={() => setActivePhase('validate')}
        >
          Back to Validation
        </button>

        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={handleApplyAndCalculate}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCwIcon size={16} className="spin-anim" />
              <span>Applying Characterization Factors...</span>
            </>
          ) : (
            <>
              <span>Calculate &amp; View Results</span>
              <ChevronRightIcon size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
