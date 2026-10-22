import React, { useState } from 'react';
import { CheckCircle, FileCheck02, MessageChatCircle, XCircle } from '@untitledui/icons';
import { Button } from '../components/base/buttons/button';
import { useStudio } from '../context/StudioContext';

export default function VerifierPortal() {
  const { projectInfo, lca } = useStudio();
  const [pendingAction, setPendingAction] = useState(null);
  const checks = lca?.auditRules || [];
  const passedChecks = checks.filter((check) => check.passed).length;

  return (
    <main className="portal-page">
      <header className="portal-header">
        <div className="brand-lockup"><span className="brand-mark"><FileCheck02 size={20} /></span><span>EcoMetric Verifier Portal</span></div>
        <span className="status-badge status-info">Read-only review</span>
      </header>
      <div className="portal-layout">
        <section className="portal-report" aria-labelledby="portal-title">
          <p className="eyebrow">Environmental Product Declaration</p>
          <h1 id="portal-title">{projectInfo.productName}</h1>
          <p className="portal-subtitle">{projectInfo.manufacturer} · {projectInfo.declaredUnitStatement}</p>
          <div className="portal-stat-grid">
            <div><span>LCIA method</span><strong>{projectInfo.lciaMethod}</strong></div>
            <div><span>Reference service life</span><strong>{projectInfo.rsl}</strong></div>
            <div><span>Audit checks</span><strong>{passedChecks} / {checks.length || 5} passed</strong></div>
          </div>
          <div className="portal-section">
            <div className="section-heading"><div><p className="eyebrow">Compliance review</p><h2>Pre-verification findings</h2></div><span className="status-badge status-success">Ready for review</span></div>
            <div className="check-list">
              {(checks.length ? checks : [{ name: 'Mandatory indicator coverage', passed: true }, { name: 'Mass balance and cut-off', passed: true }, { name: 'Background dataset integrity', passed: true }]).map((check, index) => (
                <div className="check-row" key={check.name || index}><CheckCircle size={18} className={check.passed ? 'icon-success' : 'icon-warning'} /><span>{check.name || check.label}</span><span className={check.passed ? 'check-result' : 'check-result warning'}>{check.passed ? 'Pass' : 'Review'}</span></div>
              ))}
            </div>
          </div>
        </section>
        <aside className="annotation-panel" aria-label="Verifier actions">
          <div className="annotation-heading"><MessageChatCircle size={18} /><h2>Annotations</h2></div>
          <p>No annotations have been added to this report.</p>
          <div className="portal-actions"><Button size="lg" iconLeading={CheckCircle} onClick={() => setPendingAction('approve')}>Approve report</Button><Button size="lg" color="destructive" iconLeading={XCircle} onClick={() => setPendingAction('reject')}>Reject report</Button></div>
        </aside>
      </div>
      {pendingAction && <div className="dialog-backdrop" role="presentation" onClick={() => setPendingAction(null)}><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()}><p className="eyebrow">Verifier decision</p><h2 id="confirm-title">{pendingAction === 'approve' ? 'Approve this report?' : 'Reject this report?'}</h2><p>This is a presentation-only review action. No verifier or calculation data will be changed.</p><div className="dialog-actions"><Button color="secondary" onClick={() => setPendingAction(null)}>Cancel</Button><Button color={pendingAction === 'approve' ? 'primary' : 'destructive'} onClick={() => setPendingAction(null)}>{pendingAction === 'approve' ? 'Confirm approval' : 'Confirm rejection'}</Button></div></section></div>}
    </main>
  );
}
