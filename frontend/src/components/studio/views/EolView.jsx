import React from 'react';
import { useStudio } from '../../../context/StudioContext';
import { ChevronRightIcon, CheckIcon } from '../Icons';

export default function EolView() {
  const {
    eolData,
    setEolData,
    lca,
    setActivePhase,
    showNotif,
  } = useStudio();

  const handleEolRateChange = (index, newRate) => {
    const val = Math.max(0, Math.min(1, parseFloat(newRate) / 100 || 0));
    setEolData(prev => prev.map((item, i) => i === index ? { ...item, recRate: val } : item));
  };

  return (
    <div className="phase-container eol-view">
      <div className="view-section">
        <div className="section-header">
          <h2 className="section-title">6. End-of-Life &amp; Circularity — Modules C1–C4 &amp; Module D</h2>
          <p className="section-subtitle">
            Configure deconstruction, transport to waste processing, recycling fractions, and Annex A circularity credits beyond system boundary.
          </p>
        </div>

        {/* EoL Summary KPI */}
        <div className="bom-stats-grid">
          <div className="stat-card">
            <span className="stat-title">Module C Stage GWP</span>
            <span className="stat-num text-amber">{Math.round(lca.c_stage_gwp).toLocaleString()} <small>kg CO₂e</small></span>
            <span className="stat-detail">Disposal &amp; processing</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Module D Net Credits</span>
            <span className="stat-num text-emerald">{Math.round(lca.module_d_gwp).toLocaleString()} <small>kg CO₂e</small></span>
            <span className="stat-detail">Avoided virgin production</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Overall Recyclability Rate</span>
            <span className="stat-num text-blue">{lca.recRate.toFixed(1)}%</span>
            <span className="stat-detail">Recoverable product mass</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Circularity Protocol</span>
            <span className="stat-num text-purple">Annex A</span>
            <span className="stat-detail">EN 15804+A2 formula</span>
          </div>
        </div>

        {/* EoL Material Pathways Table */}
        <div className="table-responsive">
          <table className="studio-table" aria-label="End of life material pathways">
            <thead>
              <tr>
                <th>Material Fraction</th>
                <th style={{ width: '110px' }}>Mass (kg)</th>
                <th>Recovery &amp; Waste Pathway</th>
                <th style={{ width: '140px' }}>Recycling Rate (%)</th>
                <th style={{ width: '130px' }}>Waste EF (C3)</th>
                <th style={{ width: '130px' }}>Credit Factor (D)</th>
                <th style={{ width: '120px' }}>Net Credit (kg)</th>
              </tr>
            </thead>
            <tbody>
              {eolData.map((item, idx) => {
                const netCredit = Math.round(item.mass * item.recRate * item.creditEf);

                return (
                  <tr key={item.id || idx}>
                    <td>
                      <div className="table-primary-text">{item.mat}</div>
                    </td>
                    <td><span className="num-font font-medium">{item.mass.toLocaleString()} kg</span></td>
                    <td><div className="table-sub-text">{item.pathway}</div></td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="table-input"
                        value={Math.round(item.recRate * 100)}
                        onChange={(e) => handleEolRateChange(idx, e.target.value)}
                      />
                    </td>
                    <td><span className="num-font">{item.wasteEf.toFixed(3)}</span></td>
                    <td><span className="num-font">{item.creditEf.toFixed(2)}</span></td>
                    <td>
                      <span className={`num-font font-semibold ${netCredit < 0 ? 'text-emerald' : ''}`}>
                        {netCredit.toLocaleString()} kg
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="workflow-footer">
        <div className="wf-status">
          <CheckIcon className="w-4 h-4 text-emerald" />
          <span>Module D circularity credits computed per EN 15804+A2 Annex A substitution methodology</span>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={() => {
            showNotif('End-of-Life saved! Proceeding to LCIA Results', 'EoL Saved');
            setActivePhase('results');
          }}
        >
          <span>Save &amp; View Characterized Results</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
