import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { CheckIcon, AlertIcon, CloseIcon } from './Icons';

export default function StudioRightDrawer() {
  const { lca, isDrawerOpen, setIsDrawerOpen } = useStudio();

  // Lifecycle stage contributions
  const a1a3Total = lca.a1_gwp + lca.a2_gwp + lca.a3_gwp;
  const a4Total = lca.a4_gwp;
  const bTotal = lca.b_stage_gwp;
  const cTotal = lca.c_stage_gwp;
  const grossGwp = a1a3Total + a4Total + bTotal + cTotal;

  const a1a3Pct = grossGwp > 0 ? ((a1a3Total / grossGwp) * 100).toFixed(1) : '0';
  const a4Pct = grossGwp > 0 ? ((a4Total / grossGwp) * 100).toFixed(1) : '0';
  const bPct = grossGwp > 0 ? ((bTotal / grossGwp) * 100).toFixed(1) : '0';
  const cPct = grossGwp > 0 ? ((cTotal / grossGwp) * 100).toFixed(1) : '0';

  return (
    <aside className={`studio-drawer ${isDrawerOpen ? 'mobile-open' : ''}`} aria-label="Real-time LCA Telemetry">
      <div className="drawer-header">
        <div className="drawer-title-group">
          <div className="drawer-title">Real-Time Telemetry</div>
          <div className="drawer-badge">AUDITED</div>
        </div>
        <button
          type="button"
          className="btn-icon-drawer-close"
          onClick={() => setIsDrawerOpen(false)}
          title="Close Telemetry Panel"
          aria-label="Close Telemetry Panel"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="drawer-content">
        {/* Metric 1: Total GWP */}
        <div className="telemetry-card primary-card">
          <div className="card-caption">Total Lifecycle GWP (A1–D)</div>
          <div className="card-value">
            {Math.round(lca.total_gwp).toLocaleString()} <span className="card-unit">kg CO₂ eq</span>
          </div>
          <div className="card-sub">
            Gross: {Math.round(grossGwp).toLocaleString()} kg · Net Credit: {Math.round(lca.module_d_gwp).toLocaleString()} kg
          </div>
        </div>

        {/* Metric 2: Primary Energy & Circularity */}
        <div className="telemetry-grid">
          <div className="telemetry-card">
            <div className="card-caption">Primary Energy (PENRT)</div>
            <div className="card-value-sm">
              {(lca.total_penrt / 1000).toFixed(1)} <span className="card-unit">GJ</span>
            </div>
            <div className="card-sub">Non-renewable resources</div>
          </div>

          <div className="telemetry-card">
            <div className="card-caption">Recyclability Rate</div>
            <div className="card-value-sm text-emerald">
              {lca.recRate.toFixed(1)}<span className="card-unit">%</span>
            </div>
            <div className="card-sub">Annex A credit eligible</div>
          </div>
        </div>

        {/* Metric 3: Cutoff Compliance */}
        <div className={`telemetry-card cutoff-card ${lca.isMassCutoffValid ? 'pass' : 'fail'}`}>
          <div className="cutoff-header">
            <span className="card-caption">Mass Cut-off Compliance</span>
            <span className="cutoff-tag">{lca.isMassCutoffValid ? 'PASS' : 'FAIL'}</span>
          </div>
          <div className="cutoff-bar-bg">
            <div
              className="cutoff-bar-fill"
              style={{ width: `${Math.min(100, lca.massCutoff)}%` }}
            />
          </div>
          <div className="cutoff-footer">
            <span>Declared: {lca.massCutoff.toFixed(2)}%</span>
            <span>Target: ≥ 99.0%</span>
          </div>
        </div>

        {/* GWP Stage Breakdown Distribution */}
        <div className="telemetry-section">
          <div className="section-title">GWP Stage Distribution</div>
          <div className="distribution-bars">
            <div className="dist-row">
              <div className="dist-labels">
                <span>A1–A3 Production</span>
                <span className="dist-val">{Math.round(a1a3Total).toLocaleString()} kg ({a1a3Pct}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill a1a3-bar" style={{ width: `${a1a3Pct}%` }} />
              </div>
            </div>

            <div className="dist-row">
              <div className="dist-labels">
                <span>A4 Logistics</span>
                <span className="dist-val">{Math.round(a4Total).toLocaleString()} kg ({a4Pct}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill a4-bar" style={{ width: `${a4Pct}%` }} />
              </div>
            </div>

            <div className="dist-row">
              <div className="dist-labels">
                <span>B Use Phase (15y)</span>
                <span className="dist-val">{Math.round(bTotal).toLocaleString()} kg ({bPct}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill b-bar" style={{ width: `${bPct}%` }} />
              </div>
            </div>

            <div className="dist-row">
              <div className="dist-labels">
                <span>C End-of-Life</span>
                <span className="dist-val">{Math.round(cTotal).toLocaleString()} kg ({cPct}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill c-bar" style={{ width: `${cPct}%` }} />
              </div>
            </div>

            <div className="dist-row">
              <div className="dist-labels text-emerald">
                <span>Module D Net Credits</span>
                <span className="dist-val">{Math.round(lca.module_d_gwp).toLocaleString()} kg</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill d-bar" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Pre-Audit Status Chips */}
        <div className="telemetry-section">
          <div className="section-title">Pre-Audit Quality Gate</div>
          <div className="audit-chips-list">
            {lca.auditRules.map(rule => (
              <div key={rule.id} className={`audit-chip ${rule.passed ? 'passed' : 'failed'}`}>
                <div className="chip-icon">
                  {rule.passed ? <CheckIcon className="w-3 h-3" /> : <AlertIcon className="w-3 h-3" />}
                </div>
                <div className="chip-info">
                  <div className="chip-title">{rule.title}</div>
                  <div className="chip-meta">
                    {rule.value} (Req: {rule.target})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
