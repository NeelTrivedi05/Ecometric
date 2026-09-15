import React from 'react';
import { useStudio } from '../../../context/StudioContext';
import { ChevronRightIcon, CheckIcon, AlertIcon } from '../Icons';

export default function AuditView() {
  const { lca, setActivePhase, showNotif } = useStudio();

  const allPassed = lca.auditRules.every(r => r.passed);

  return (
    <div className="phase-container audit-view">
      <div className="view-section">
        <div className="section-header">
          <h2 className="section-title">8. Pre-Audit Quality Gate &amp; Compliance Verification</h2>
          <p className="section-subtitle">
            Automated verification checks assessing readiness for third-party audit under ISO 14025, EN 15804+A2, and Program Operator rules.
          </p>
        </div>

        {/* Global Verdict Banner */}
        <div className={`audit-verdict-banner ${allPassed ? 'verdict-pass' : 'verdict-warn'}`}>
          <div className="verdict-icon">
            {allPassed ? <CheckIcon className="w-6 h-6" /> : <AlertIcon className="w-6 h-6" />}
          </div>
          <div className="verdict-body">
            <h3 className="verdict-heading">
              {allPassed ? 'VERIFICATION READY — ALL AUDIT GATES PASSED' : 'AUDIT WARNINGS DETECTED'}
            </h3>
            <p className="verdict-desc">
              {allPassed
                ? 'Your project satisfies all mandatory data quality, mass cut-off, and module completeness criteria required for third-party verifier submission.'
                : 'One or more data quality thresholds are near boundary limits. Review the specific items below before submitting to the program operator.'}
            </p>
          </div>
          <div className="verdict-score">
            <span className="score-num">{lca.auditRules.filter(r => r.passed).length} / {lca.auditRules.length}</span>
            <span className="score-label">Gates Verified</span>
          </div>
        </div>

        {/* 5-Gate Checklist Cards */}
        <div className="audit-cards-grid">
          {lca.auditRules.map((rule) => (
            <div key={rule.id} className={`audit-gate-card ${rule.passed ? 'gate-pass' : 'gate-fail'}`}>
              <div className="gate-header">
                <div className="gate-title-group">
                  <span className="gate-id">Gate #{rule.id}</span>
                  <h4 className="gate-name">{rule.title}</h4>
                </div>
                <span className={`gate-status-pill ${rule.passed ? 'pill-pass' : 'pill-fail'}`}>
                  {rule.passed ? 'PASSED' : 'ACTION REQ'}
                </span>
              </div>

              <div className="gate-meta-row">
                <span className="gate-standard">Standard: {rule.standard}</span>
                <span className="gate-metric">
                  Actual: <strong>{rule.value}</strong> (Req: {rule.target})
                </span>
              </div>

              <p className="gate-desc">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="workflow-footer">
        <div className="wf-status">
          <CheckIcon className="w-4 h-4 text-emerald" />
          <span>Automated pre-verification audit report ready for independent verifier package</span>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={() => {
            showNotif('Audit verified! Ready for EPD publishing', 'Audit Complete');
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
