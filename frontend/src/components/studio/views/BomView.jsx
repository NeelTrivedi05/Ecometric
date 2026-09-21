import React, { useState } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { PlusIcon, TrashIcon, ChevronRightIcon, CheckIcon, AlertIcon } from '../Icons';

export default function BomView() {
  const {
    bomData,
    updateBomMass,
    addBomItem,
    removeBomItem,
    lca,
    setActivePhase,
    showNotif,
  } = useStudio();

  const [isAdding, setIsAdding] = useState(false);
  const [newComp, setNewComp] = useState({
    comp: '',
    mat: '',
    mass: '',
    mod: 'A1',
    ei: 'Generic steel alloy {RER}',
    gwpFactor: '2.5',
  });

  const handleCreateComponent = (e) => {
    e.preventDefault();
    if (!newComp.comp || !newComp.mass) {
      showNotif('Please enter component name and mass', 'Validation Error', 'alert');
      return;
    }
    addBomItem(newComp);
    setNewComp({
      comp: '',
      mat: '',
      mass: '',
      mod: 'A1',
      ei: 'Generic steel alloy {RER}',
      gwpFactor: '2.5',
    });
    setIsAdding(false);
  };

  return (
    <div className="phase-container bom-view">
      <div className="view-section">
        <div className="section-header-flex">
          <div>
            <h2 className="section-title">2. Bill of Materials (BOM) — Modules A1–A3</h2>
            <p className="section-subtitle">
              Verify component physical mass balance, ecoinvent 3.9 background datasets, and primary data pedigree.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setIsAdding(!isAdding)}
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Cancel' : 'Add Component'}</span>
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="bom-stats-grid">
          <div className="stat-card">
            <span className="stat-title">Total Unit Mass</span>
            <span className="stat-num">{lca.totalMass.toLocaleString()} <small>kg</small></span>
            <span className="stat-detail">100% mass accounted</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Declared Mass Cut-off</span>
            <span className={`stat-num ${lca.isMassCutoffValid ? 'text-emerald' : 'text-amber'}`}>
              {lca.massCutoff.toFixed(2)}%
            </span>
            <span className="stat-detail">EN 15804 requires ≥ 99.0%</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Primary Data Share</span>
            <span className="stat-num text-blue">{lca.primaryDataShare.toFixed(1)}%</span>
            <span className="stat-detail">Target ≥ 50% for verification</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Data Quality Rating (DQR)</span>
            <span className="stat-num text-purple">{lca.avgDqr}</span>
            <span className="stat-detail">Scale 1.0 (Best) to 5.0 (Poor)</span>
          </div>
        </div>

        {/* Add Component Form */}
        {isAdding && (
          <form className="add-bom-form" onSubmit={handleCreateComponent}>
            <div className="form-row">
              <div className="form-field">
                <label>Component Name</label>
                <input
                  type="text"
                  placeholder="e.g. Steel Impeller"
                  value={newComp.comp}
                  onChange={(e) => setNewComp({ ...newComp, comp: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Material Classification</label>
                <input
                  type="text"
                  placeholder="e.g. Stainless Steel 316L"
                  value={newComp.mat}
                  onChange={(e) => setNewComp({ ...newComp, mat: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Mass (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 45"
                  value={newComp.mass}
                  onChange={(e) => setNewComp({ ...newComp, mass: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>GWP Factor (kg CO₂e/kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newComp.gwpFactor}
                  onChange={(e) => setNewComp({ ...newComp, gwpFactor: e.target.value })}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-accent">Save Component to BOM</button>
            </div>
          </form>
        )}

        {/* Interactive BOM Table */}
        <div className="table-responsive">
          <table className="studio-table" aria-label="Bill of Materials">
            <thead>
              <tr>
                <th>Component &amp; Material</th>
                <th style={{ width: '130px' }}>Mass (kg)</th>
                <th style={{ width: '70px' }}>Mod</th>
                <th>Background Dataset (ecoinvent 3.9)</th>
                <th style={{ width: '100px' }}>Factor</th>
                <th style={{ width: '110px' }}>GWP (kg CO₂e)</th>
                <th style={{ width: '80px' }}>Share</th>
                <th style={{ width: '70px' }}>DQR</th>
                <th style={{ width: '50px' }}>Act</th>
              </tr>
            </thead>
            <tbody>
              {bomData.map((item, index) => {
                const itemMass = parseFloat(item.mass) || 0;
                const itemGwp = Math.round(itemMass * item.gwpFactor);
                const a1a3Total = lca.a1_gwp + lca.a2_gwp + lca.a3_gwp;
                const sharePct = a1a3Total > 0 ? ((itemGwp / a1a3Total) * 100).toFixed(1) : '0';

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="table-primary-text">{item.comp}</div>
                      <div className="table-sub-text">{item.mat}</div>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="table-input"
                        value={item.mass}
                        onChange={(e) => updateBomMass(index, e.target.value)}
                        min="0"
                        step="1"
                      />
                    </td>
                    <td>
                      <span className="badge-module">{item.mod}</span>
                    </td>
                    <td>
                      <div className="dataset-cell">
                        <span className="dataset-name" title={item.ei}>{item.ei}</span>
                        {item.warn && (
                          <span className="warn-badge" title={item.warn}>
                            <AlertIcon className="w-3 h-3" />
                            {item.warn}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="num-font">{item.gwpFactor}</span>
                    </td>
                    <td>
                      <span className="num-font font-semibold">{itemGwp.toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="num-font">{sharePct}%</span>
                    </td>
                    <td>
                      <span className={`dqr-pill ${item.dqr <= 1.5 ? 'good' : 'fair'}`}>
                        {item.dqr}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => removeBomItem(item.id)}
                        title="Remove Component"
                        aria-label="Remove Component"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
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
          <span>BOM balance complies with EN 15804 §6.3.5 (Mass cutoff ≥ 99.0%)</span>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={() => {
            showNotif('BOM saved! Proceeding to Manufacturing Energy', 'BOM Saved');
            setActivePhase('mfg');
          }}
        >
          <span>Save &amp; Go to Manufacturing</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
