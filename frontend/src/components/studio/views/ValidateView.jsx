import React, { useEffect } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { ValidateIcon, CheckIcon, AlertIcon, CloseIcon, RefreshCwIcon, ChevronRightIcon } from '../Icons';

export default function ValidateView() {
  const {
    validationResults,
    runValidation,
    isLoading,
    setActivePhase,
    extractedData,
    uploadedFiles,
  } = useStudio();

  // Auto-run validation if not run yet
  useEffect(() => {
    if (!validationResults.run_at && (uploadedFiles.length > 0 || extractedData.bom?.length > 0)) {
      runValidation();
    }
  }, [validationResults.run_at, uploadedFiles.length, extractedData.bom?.length, runValidation]);

  const checks = validationResults.checks || [];
  const passedCount = checks.filter(c => c.passed).length;
  const criticalFails = checks.filter(c => !c.passed && c.critical).length;
  const warnings = checks.filter(c => !c.passed && !c.critical).length;
  const isReady = checks.length > 0 && criticalFails === 0;

  // Group checks by category/standard
  const pcrChecks = checks.filter(c => c.id?.startsWith('pcr'));
  const gpiChecks = checks.filter(c => c.id?.startsWith('gpi'));
  const isoChecks = checks.filter(c => c.id?.startsWith('iso') || (!c.id?.startsWith('pcr') && !c.id?.startsWith('gpi')));

  return (
    <div className="view-container">
      {/* Apple View Header */}
      <div className="apple-view-header">
        <div>
          <span className="apple-eyebrow">Phase 4 • Compliance Audit</span>
          <h1 className="view-title" style={{ margin: 0, fontFamily: 'var(--font-display, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif)', letterSpacing: '-0.022em' }}>
            Validate Against Standards &amp; Rules
          </h1>
          <p className="view-subtitle" style={{ marginTop: '4px', marginBottom: 0, color: 'var(--text-secondary, #86868b)' }}>
            Automated verification against UL 10010-4 Part B v2.0, ISO 14025, and GPI v4.0 before characterization.
          </p>
        </div>

        <div className="apple-header-action-group">
          <button
            type="button"
            className="btn-apple-secondary-pill"
            onClick={runValidation}
            disabled={isLoading}
          >
            <RefreshCwIcon size={13} className={isLoading ? 'spin-anim' : ''} />
            <span>{isLoading ? 'Auditing...' : 'Re-Run Verification'}</span>
          </button>
        </div>
      </div>

      {/* Validation Status Summary Banner (Apple System Health Card) */}
      <div
        className="apple-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          padding: '20px 24px',
          marginBottom: '24px',
          backgroundColor: isReady ? '#f8fdf9' : '#fffdfa',
          borderColor: isReady ? 'rgba(40, 205, 65, 0.3)' : 'rgba(255, 159, 10, 0.3)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            {isReady ? (
              <span style={{ color: '#28cd41', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '15px' }}>
                <CheckIcon size={18} />
                <span>Verification Passed — Ready for Characterization</span>
              </span>
            ) : checks.length === 0 ? (
              <span style={{ fontWeight: 600, fontSize: '15px', color: '#1d1d1f' }}>Validation Pending</span>
            ) : (
              <span style={{ color: '#ff3b30', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '15px' }}>
                <AlertIcon size={18} />
                <span>{criticalFails} Critical Requirement{criticalFails > 1 ? 's' : ''} Missing</span>
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#86868b' }}>
            {checks.length > 0 ? (
              <>
                {passedCount} of {checks.length} compliance rules satisfied
                {warnings > 0 && ` • ${warnings} non-critical default(s) applied`}
                {validationResults.run_at && ` • Evaluated at ${new Date(validationResults.run_at).toLocaleTimeString()}`}
              </>
            ) : (
              'Run automated audit against PCR and GPI rules to verify data readiness'
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: '9999px',
            backgroundColor: isReady ? 'rgba(40, 205, 65, 0.12)' : 'rgba(255, 159, 10, 0.12)',
            color: isReady ? '#28cd41' : '#ff9f0a'
          }}>
            {isReady ? 'AUDIT VERIFIED' : 'ACTION REQUIRED'}
          </span>
        </div>
      </div>

      {/* Rules Checklists */}
      {checks.length === 0 ? (
        <div className="apple-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>No Audit Performed Yet</div>
          <div style={{ fontSize: '13px', color: '#86868b', marginBottom: 20 }}>
            Run the automated audit engine to verify compliance with UL 10010-4 cut-off and data quality rules.
          </div>
          <button type="button" className="btn-apple-action-blue" onClick={runValidation}>
            Run Compliance Verification
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* PCR Section */}
          <div className="apple-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.01em' }}>
                Product Category Rules (PCR) Compliance
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#0066cc', backgroundColor: 'rgba(0, 102, 204, 0.08)', padding: '2px 8px', borderRadius: '9999px' }}>
                UL 10010-4 Part B v2.0
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pcrChecks.map(check => (
                <RuleItem key={check.id} check={check} />
              ))}
            </div>
          </div>

          {/* GPI Section */}
          <div className="apple-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.01em' }}>
                General Programme Instructions (GPI v4.0)
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#0066cc', backgroundColor: 'rgba(0, 102, 204, 0.08)', padding: '2px 8px', borderRadius: '9999px' }}>
                International EPD System
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gpiChecks.map(check => (
                <RuleItem key={check.id} check={check} />
              ))}
            </div>
          </div>

          {/* ISO 14025 Section */}
          {isoChecks.length > 0 && (
            <div className="apple-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.01em' }}>
                  ISO 14025:2006 Type III Standard
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0066cc', backgroundColor: 'rgba(0, 102, 204, 0.08)', padding: '2px 8px', borderRadius: '9999px' }}>
                  Third-Party Verification Ready
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isoChecks.map(check => (
                  <RuleItem key={check.id} check={check} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <button
          type="button"
          className="btn-apple-secondary-pill"
          onClick={() => setActivePhase('user_review')}
        >
          ← Back to User Review
        </button>

        <button
          type="button"
          className="btn-apple-action-blue"
          onClick={() => setActivePhase('methodology')}
          disabled={criticalFails > 0}
          title={criticalFails > 0 ? 'Resolve critical items before continuing' : 'Proceed to select LCIA methodology'}
        >
          <span>Select LCIA Methodology</span>
          <ChevronRightIcon size={14} />
        </button>
      </div>
    </div>
  );
}

function RuleItem({ check }) {
  const isPassed = check.passed;
  const isCritical = check.critical;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        borderRadius: '12px',
        backgroundColor: isPassed ? '#ffffff' : isCritical ? '#fff8f7' : '#fffcf5',
        border: `1px solid ${isPassed ? '#e0e0e0' : isCritical ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 159, 10, 0.2)'}`,
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{ marginTop: 2, flexShrink: 0 }}>
        {isPassed ? (
          <span style={{ color: '#28cd41' }}><CheckIcon size={17} /></span>
        ) : isCritical ? (
          <span style={{ color: '#ff3b30' }}><CloseIcon size={17} /></span>
        ) : (
          <span style={{ color: '#ff9f0a' }}><AlertIcon size={17} /></span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#1d1d1f' }}>
            {check.rule}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: '#f5f5f7',
              border: '1px solid #e0e0e0',
              color: '#86868b',
            }}
          >
            {check.section}
          </span>
        </div>
        <p style={{ fontSize: '12px', color: isPassed ? '#86868b' : '#1d1d1f', margin: 0, lineHeight: 1.4 }}>
          {check.message}
        </p>
      </div>
    </div>
  );
}
