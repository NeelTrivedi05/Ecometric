import React, { useEffect } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { CheckIcon, AlertIcon, RefreshCwIcon, ChevronRightIcon } from '../Icons';
import PcrCheckList, { SummaryChips } from '../PcrCheckList';

// Step 4: PCR `input` rules, evaluated before the LCA is calculated.
export default function ValidateView() {
  const {
    validationResults,
    validationStale,
    runValidation,
    isLoading,
    setActivePhase,
    extractedData,
    uploadedFiles,
    productProfile,
  } = useStudio();

  const hasRun = Boolean(validationResults.run_at);

  // Run on first visit, and again when the inventory changed since the last run.
  useEffect(() => {
    const hasData = uploadedFiles.length > 0 || extractedData.bom?.length > 0;
    if (hasData && !isLoading && !validationResults.error && (!hasRun || validationStale)) {
      runValidation();
    }
  }, [hasRun, validationStale, validationResults.error, uploadedFiles.length, extractedData.bom?.length, runValidation, isLoading]);

  const summary = validationResults.summary;
  const blocking = summary?.blocking ?? 0;
  const requiredLater = summary?.required_before_publish ?? 0;
  const canProceed = hasRun && !validationStale && validationResults.passed;

  let banner;
  if (validationResults.error) {
    banner = { tone: 'error', title: 'PCR validation service unavailable', text: `${validationResults.error} Calculation stays blocked until the rules can be checked.` };
  } else if (!hasRun) {
    banner = { tone: 'neutral', title: 'Validation pending', text: 'Run the PCR input rules to check the inventory before calculation.' };
  } else if (validationStale) {
    banner = { tone: 'warn', title: 'Inventory changed since this check', text: 'Re-run the PCR input rules before calculating.' };
  } else if (blocking > 0) {
    banner = { tone: 'error', title: `${blocking} critical requirement${blocking > 1 ? 's' : ''} not met`, text: 'Fix the items marked “Blocks calculation” to continue.' };
  } else {
    banner = {
      tone: 'ok',
      title: 'Ready for calculation',
      text: requiredLater > 0
        ? `${requiredLater} critical item${requiredLater > 1 ? 's are' : ' is'} still missing and must be completed before publishing (most are entered in Report Details at export).`
        : 'All critical input requirements are met.',
    };
  }
  const tone = {
    ok: { bg: '#f8fdf9', border: 'rgba(40, 205, 65, 0.3)', color: '#28cd41' },
    warn: { bg: '#fffdfa', border: 'rgba(255, 159, 10, 0.3)', color: '#ff9f0a' },
    error: { bg: '#fff8f7', border: 'rgba(255, 59, 48, 0.3)', color: '#ff3b30' },
    neutral: { bg: '#ffffff', border: '#e0e0e0', color: '#1d1d1f' },
  }[banner.tone];

  return (
    <div className="view-container">
      <div className="apple-view-header">
        <div>
          <span className="apple-eyebrow">Phase 4 • Before calculation</span>
          <h1 className="view-title" style={{ margin: 0, fontFamily: 'var(--font-display, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif)', letterSpacing: '-0.022em' }}>
            PCR Input Rules
          </h1>
          <p className="view-subtitle" style={{ marginTop: '4px', marginBottom: 0, color: 'var(--text-secondary, #86868b)' }}>
            Checks the essential EPD requirements that apply to every product before the LCA is calculated
            (product PCR: {validationResults.pcr_label || productProfile?.pcrLabel}). Results rules run in step 7.
          </p>
        </div>

        <div className="apple-header-action-group">
          <button type="button" className="btn-apple-secondary-pill" onClick={runValidation} disabled={isLoading}>
            <RefreshCwIcon size={13} className={isLoading ? 'spin-anim' : ''} />
            <span>{isLoading ? 'Checking...' : 'Re-run Checks'}</span>
          </button>
        </div>
      </div>

      <div className="apple-card" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        padding: '20px 24px', marginBottom: '24px', backgroundColor: tone.bg, borderColor: tone.border,
      }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: tone.color, fontWeight: 600, fontSize: '15px' }}>
            {banner.tone === 'ok' ? <CheckIcon size={18} /> : banner.tone !== 'neutral' && <AlertIcon size={18} />}
            <span>{banner.title}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#86868b' }}>
            {banner.text}
            {hasRun && ` • Evaluated at ${new Date(validationResults.run_at).toLocaleTimeString()}`}
          </div>
        </div>
        <SummaryChips summary={summary} />
      </div>

      {validationResults.missing_rulesets?.length > 0 && (
        <div className="apple-card" style={{ padding: '12px 20px', marginBottom: 20, fontSize: 12, color: '#8f5800', backgroundColor: '#fffcf5' }}>
          No machine-readable ruleset for: {validationResults.missing_rulesets.join(', ')}. Those PCR requirements are not checked.
        </div>
      )}

      {hasRun ? (
        <PcrCheckList report={validationResults} blockingLabel="Blocks calculation" />
      ) : !validationResults.error && (
        <div className="apple-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>No check run yet</div>
          <div style={{ fontSize: '13px', color: '#86868b', marginBottom: 20 }}>
            Evaluate the inventory against {productProfile?.pcrShort} input rules.
          </div>
          <button type="button" className="btn-apple-action-blue" onClick={runValidation}>Run PCR Input Rules</button>
        </div>
      )}

      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <button type="button" className="btn-apple-secondary-pill" onClick={() => setActivePhase('user_review')}>
          ← Back to User Review
        </button>
        <button
          type="button"
          className="btn-apple-action-blue"
          onClick={() => setActivePhase('methodology')}
          disabled={!canProceed}
          title={canProceed ? 'Proceed to select LCIA methodology' : 'Resolve the blocking items and re-run the checks first'}
        >
          <span>Select LCIA Methodology</span>
          <ChevronRightIcon size={14} />
        </button>
      </div>
    </div>
  );
}
