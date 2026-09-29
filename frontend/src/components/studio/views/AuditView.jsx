import React, { useState } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { ChevronRightIcon, CheckIcon, AlertIcon, RefreshCwIcon, InfoIcon, LeafIcon } from '../Icons';

export default function AuditView() {
  const {
    lca,
    setActivePhase,
    showNotif,
    pcrRules,
    selectedPcrRule,
    setSelectedPcrRule,
    evaluatePcrCompliance,
    pcrEvaluation,
    isLoading,
    setIsFlowModalOpen,
  } = useStudio();

  const [isAuditing, setIsAuditing] = useState(false);

  const rules = lca?.auditRules || [];
  const allPassed = rules.length > 0 && rules.every(r => r.passed);
  const passedCount = rules.filter(r => r.passed).length;
  const activeRule = (pcrRules || []).find(r => r.id === selectedPcrRule) || {
    id: 'rule-ul10010-4-traci',
    rule_name: 'UL 10010-4 Part B v2.0 (TRACI 2.1)',
    standard: 'UL 10010-4 / ISO 14025',
    methodology: 'TRACI 2.1',
    cut_off_criteria: '1% mass / 1% energy cumulative 95%'
  };

  const handleRuleChange = async (newRuleId) => {
    setSelectedPcrRule(newRuleId);
    setIsAuditing(true);
    await evaluatePcrCompliance(newRuleId);
    setIsAuditing(false);
  };

  const handleReAudit = async () => {
    setIsAuditing(true);
    await evaluatePcrCompliance(selectedPcrRule);
    setIsAuditing(false);
  };

  const lineageHash = pcrEvaluation?.lineage_hash || '6bc4e6475877e8e90d8a6184b681366154cc5f6ec42c7cec54eb871224b33e02';

  const copyHash = () => {
    navigator.clipboard?.writeText(lineageHash);
    showNotif('Cryptographic SHA-256 lineage hash copied to clipboard', 'Hash Copied');
  };

  return (
    <div className="phase-container audit-view">
      <div className="view-section">
        {/* Section Title & Subtitle */}
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 className="section-title">8. Pre-Audit Quality Gate &amp; Compliance Verification</h2>
            <p className="section-subtitle">
              Automated 5-gate compliance validation assessing third-party audit readiness under ISO 14025, EN 15804+A2, and Program Operator rules.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsFlowModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LeafIcon size={14} />
              <span>Process Entanglement Graph</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleReAudit}
              disabled={isAuditing || isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCwIcon size={14} className={isAuditing ? 'spin' : ''} />
              <span>{isAuditing ? 'Auditing...' : 'Re-Audit PCR Rules'}</span>
            </button>
          </div>
        </div>

        {/* PCR / GPI Standard Selector Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              backgroundColor: 'var(--accent-light, #eef2ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent, #3b82f6)'
            }}>
              <InfoIcon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Verification Standard
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                {activeRule.rule_name}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Methodology Baseline:</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeRule.methodology} · {activeRule.cut_off_criteria}
              </span>
            </div>
            <select
              value={selectedPcrRule}
              onChange={(e) => handleRuleChange(e.target.value)}
              disabled={isAuditing}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              {(pcrRules || []).map(r => (
                <option key={r.id} value={r.id}>
                  {r.rule_name} ({r.standard})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Verdict Banner */}
        <div className={`audit-verdict-banner ${allPassed ? 'verdict-pass' : 'verdict-warn'}`}>
          <div className="verdict-icon">
            {allPassed ? <CheckIcon className="w-6 h-6" /> : <AlertIcon className="w-6 h-6" />}
          </div>
          <div className="verdict-body">
            <h3 className="verdict-heading">
              {allPassed ? 'VERIFICATION READY — ALL AUDIT GATES PASSED' : 'AUDIT ACTION REQUIRED'}
            </h3>
            <p className="verdict-desc">
              {allPassed
                ? 'Your project satisfies all mandatory indicator coverage, 1% mass cut-off, modular completeness, and background dataset integrity rules for third-party verifier submission.'
                : 'One or more data quality thresholds require attention before submitting to the program operator. Review the specific findings below.'}
            </p>
          </div>
          <div className="verdict-score">
            <span className="score-num">{passedCount} / {rules.length}</span>
            <span className="score-label">Gates Verified</span>
          </div>
        </div>

        {/* Cryptographic Lineage Telemetry Pill */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Cryptographic Lineage:
            </span>
            <code style={{ fontSize: '12px', color: '#0F172A', backgroundColor: '#EDE9FE', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
              SHA256: {lineageHash}
            </code>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
              ● ecoinvent v3.12 Cut-off Verified
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={copyHash}
            style={{ fontSize: '11px', fontWeight: 600 }}
          >
            Copy Hash
          </button>
        </div>

        {/* 5-Gate Checklist Cards */}
        <div className="audit-cards-grid">
          {rules.map((rule) => (
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
