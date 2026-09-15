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
      <div className="section-header" style={{ marginBottom: 20 }}>
        <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ValidateIcon size={24} style={{ color: 'var(--accent)' }} />
          3. Validate Against Rules
        </h1>
        <p className="view-subtitle">
          Automated compliance verification against Product Category Rules (PCR), General Programme Instructions (GPI), and ISO 14025 before calculating LCIA impact scores.
        </p>
      </div>

      {/* Validation Status Summary Banner */}
      <div
        className="card"
        style={{
          borderLeft: isReady ? '4px solid var(--success)' : '4px solid var(--warning)',
          background: isReady ? 'var(--bg-card)' : 'var(--bg-card2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          padding: '18px 24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {isReady ? (
              <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 'var(--text-base)' }}>
                <CheckIcon size={20} />
                Validation Passed — Ready for Methodology Selection
              </span>
            ) : checks.length === 0 ? (
              <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>Validation Pending</span>
            ) : (
              <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 'var(--text-base)' }}>
                <AlertIcon size={20} />
                {criticalFails} Critical Requirement{criticalFails > 1 ? 's' : ''} Missing
              </span>
            )}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {checks.length > 0 ? (
              <>
                {passedCount} of {checks.length} compliance rules satisfied
                {warnings > 0 && ` • ${warnings} non-critical default(s) applied`}
                {validationResults.run_at && ` • Last evaluated at ${new Date(validationResults.run_at).toLocaleTimeString()}`}
              </>
            ) : (
              'Run automated audit against PCR and GPI rules to verify data readiness'
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={runValidation}
            disabled={isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCwIcon size={14} className={isLoading ? 'spin-anim' : ''} />
            <span>{isLoading ? 'Verifying...' : 'Re-Run Checks'}</span>
          </button>
        </div>
      </div>

      {/* Rules Checklists */}
      {checks.length === 0 ? (
        <div className="empty-state" style={{ padding: 36, textAlign: 'center' }}>
          <div className="empty-state-title">No Validation Run Yet</div>
          <div className="empty-state-desc" style={{ marginBottom: 16 }}>
            Click below to audit your extracted data against PCR and GPI requirements.
          </div>
          <button type="button" className="btn btn-primary" onClick={runValidation}>
            Run Compliance Verification
          </button>
        </div>
      ) : (
        <>
          {/* PCR Section */}
          <div className="card">
            <div className="card-title">
              <span>Product Category Rules (PCR) Compliance</span>
              <span className="item-badge" style={{ marginLeft: 'auto' }}>Part B / EN 15804</span>
            </div>
            <div className="rules-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pcrChecks.map(check => (
                <RuleItem key={check.id} check={check} />
              ))}
            </div>
          </div>

          {/* GPI Section */}
          <div className="card">
            <div className="card-title">
              <span>General Programme Instructions (GPI v4.0)</span>
              <span className="item-badge" style={{ marginLeft: 'auto' }}>Environdec Registry</span>
            </div>
            <div className="rules-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {gpiChecks.map(check => (
                <RuleItem key={check.id} check={check} />
              ))}
            </div>
          </div>

          {/* ISO 14025 Section */}
          {isoChecks.length > 0 && (
            <div className="card">
              <div className="card-title">
                <span>ISO 14025:2006 Type III Standard</span>
                <span className="item-badge" style={{ marginLeft: 'auto' }}>Third-Party Verification</span>
              </div>
              <div className="rules-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isoChecks.map(check => (
                  <RuleItem key={check.id} check={check} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Footer */}
      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <button
          type="button"
          className="btn btn-outline btn-lg"
          onClick={() => setActivePhase('review')}
        >
          Back to Review Data
        </button>

        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={() => setActivePhase('methodology')}
          disabled={criticalFails > 0}
          title={criticalFails > 0 ? 'Resolve critical items before continuing' : 'Proceed to select LCIA methodology'}
        >
          <span>Proceed to Select Methodology</span>
          <ChevronRightIcon size={16} />
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
        padding: '12px 14px',
        borderRadius: 'var(--radius-sm)',
        background: isPassed ? 'var(--bg-card)' : isCritical ? 'var(--error-soft)' : 'var(--warning-soft)',
        border: `1px solid ${isPassed ? 'var(--border)' : isCritical ? 'var(--error)' : 'var(--warning)'}`,
      }}
    >
      <div style={{ marginTop: 2, flexShrink: 0 }}>
        {isPassed ? (
          <span style={{ color: 'var(--success)' }}><CheckIcon size={18} /></span>
        ) : isCritical ? (
          <span style={{ color: 'var(--error)' }}><CloseIcon size={18} /></span>
        ) : (
          <span style={{ color: 'var(--warning)' }}><AlertIcon size={18} /></span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
            {check.rule}
          </span>
          <span
            style={{
              fontSize: 'var(--text-2xs)',
              fontFamily: 'var(--mono)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            {check.section}
          </span>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: isPassed ? 'var(--text-secondary)' : 'var(--text-primary)', margin: 0 }}>
          {check.message}
        </p>
      </div>
    </div>
  );
}
