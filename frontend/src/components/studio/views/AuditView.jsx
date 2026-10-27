import React, { useState } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { ChevronRightIcon, CheckIcon, AlertIcon, RefreshCwIcon, LeafIcon } from '../Icons';
import PcrCheckList, { SummaryChips } from '../PcrCheckList';

// Step 7: PCR `results` rules on the calculation output. Step 4's verdict is shown read-only;
// input rules are not re-evaluated here.
export default function AuditView() {
  const {
    setActivePhase,
    showNotif,
    isLoading,
    setIsFlowModalOpen,
    validationResults,
    validationStale,
    resultsAudit,
    runResultsAudit,
    resultsAuditStale,
    lca,
  } = useStudio();

  const [isAuditing, setIsAuditing] = useState(false);

  const handleReAudit = async () => {
    setIsAuditing(true);
    await runResultsAudit();
    setIsAuditing(false);
  };

  const inputRun = Boolean(validationResults.run_at);
  const inputOk = inputRun && !validationStale && validationResults.passed;
  const blocking = resultsAudit?.summary?.blocking ?? 0;
  const resultsOk = Boolean(resultsAudit) && !resultsAuditStale && blocking === 0;
  const canExport = inputOk && resultsOk;

  let verdict;
  if (!resultsAudit) {
    verdict = lca?.isCalculated
      ? 'These results were estimated in the browser and have not been checked against the PCR. Start the EcoMetric backend (port 8000) and recalculate in step 6.'
      : 'Calculate the LCA (step 6) to check the results rules.';
  } else if (resultsAuditStale) {
    verdict = 'The inventory changed after the last calculation. Recalculate in step 6, then re-run this audit.';
  } else if (blocking > 0) {
    verdict = `${blocking} critical results requirement${blocking > 1 ? 's are' : ' is'} not met. Export is blocked until they are resolved.`;
  } else {
    verdict = 'All critical results requirements are met.';
  }

  return (
    <div className="phase-container audit-view">
      <div className="view-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 className="section-title">7. Pre-Audit Verification</h2>
            <p className="section-subtitle">
              Checks the essential results requirements (GWP, core indicators, required modules) before the EPD is
              exported. A few document checks run on the rendered EPD at export.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsFlowModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LeafIcon size={14} />
              <span>Process Entanglement Graph</span>
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleReAudit}
              disabled={isAuditing || isLoading || !lca?.isCalculated}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCwIcon size={14} className={isAuditing ? 'spin' : ''} />
              <span>{isAuditing ? 'Auditing...' : 'Re-run Results Rules'}</span>
            </button>
          </div>
        </div>

        {/* Step 4 verdict, read-only */}
        <div className="apple-card" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          padding: '14px 20px', marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Step 4 · PCR input rules
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, color: inputOk ? '#1b5e20' : '#d70015' }}>
              {!inputRun ? 'Not run yet'
                : validationStale ? 'Out of date — the inventory changed after this check'
                : validationResults.passed ? 'Passed before calculation'
                : `${validationResults.summary?.blocking ?? 0} critical requirement(s) not met`}
            </div>
            {inputOk && validationResults.summary?.required_before_publish > 0 && (
              <div style={{ fontSize: 12, color: '#8f5800', marginTop: 2 }}>
                {validationResults.summary.required_before_publish} critical item(s) still to complete before publishing.
              </div>
            )}
          </div>
          {!inputOk && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setActivePhase('validate')}>
              Open step 4
            </button>
          )}
        </div>

        <div className={`audit-verdict-banner ${resultsOk ? 'verdict-pass' : 'verdict-warn'}`}>
          <div className="verdict-icon">
            {resultsOk ? <CheckIcon className="w-6 h-6" /> : <AlertIcon className="w-6 h-6" />}
          </div>
          <div className="verdict-body">
            <h3 className="verdict-heading">
              {resultsOk ? 'RESULTS RULES MET' : 'ACTION REQUIRED'}
            </h3>
            <p className="verdict-desc">{verdict}</p>
            {resultsAudit && <div style={{ marginTop: 8 }}><SummaryChips summary={resultsAudit.summary} /></div>}
          </div>
          {resultsAudit && (
            <div className="verdict-score">
              <span className="score-num">{resultsAudit.summary.pass} / {resultsAudit.summary.total - resultsAudit.summary.not_applicable}</span>
              <span className="score-label">Rules met</span>
            </div>
          )}
        </div>

        {resultsAudit && <PcrCheckList report={resultsAudit} blockingLabel="Blocks export" />}

        {!resultsAudit && (
          <div style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setActivePhase('results')}>
              Go to step 6 · LCIA Results
            </button>
          </div>
        )}
      </div>

      <div className="workflow-footer">
        <div className="wf-status">
          {canExport ? <CheckIcon className="w-4 h-4 text-emerald" /> : <AlertIcon className="w-4 h-4" />}
          <span>
            {canExport
              ? 'Input and results rules met. Document rules are checked on the rendered EPD at export.'
              : 'Export unlocks when step 4 has passed on the current inventory and no critical results rule fails.'}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-lg"
          disabled={!canExport}
          onClick={() => {
            showNotif('Pre-audit passed. Continue to export.', 'Pre-Audit');
            setActivePhase('export');
          }}
        >
          <span>Proceed to Export &amp; Publish</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
