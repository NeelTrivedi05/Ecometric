import React, { useState } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { PlusIcon, TrashIcon, ChevronRightIcon, CheckIcon } from '../Icons';

export default function LogisticsView() {
  const {
    transportLegs,
    setTransportLegs,
    lca,
    setActivePhase,
    showNotif,
  } = useStudio();

  const [isAdding, setIsAdding] = useState(false);
  const [newLeg, setNewLeg] = useState({
    from: '',
    to: '',
    dist: 300,
    mode: '26t Truck, EURO VI',
    loadFactor: '80%',
    ef: 0.088,
  });

  const handleUpdateLeg = (index, field, val) => {
    setTransportLegs(prev => prev.map((leg, i) => i === index ? { ...leg, [field]: val } : leg));
  };

  const handleAddLeg = (e) => {
    e.preventDefault();
    if (!newLeg.from || !newLeg.to) {
      showNotif('Please enter origin and destination', 'Validation Error', 'alert');
      return;
    }
    const created = {
      ...newLeg,
      id: Date.now(),
      leg: `${transportLegs.length + 1}`,
      dist: parseFloat(newLeg.dist) || 100,
      ef: parseFloat(newLeg.ef) || 0.088,
    };
    setTransportLegs(prev => [...prev, created]);
    setIsAdding(false);
    showNotif(`Added transport leg ${created.leg}`, 'Leg Added');
  };

  const handleRemoveLeg = (id) => {
    setTransportLegs(prev => prev.filter(leg => leg.id !== id));
    showNotif('Transport leg removed', 'Route Updated');
  };

  const totalTons = lca.totalMass / 1000;
  const totalDist = transportLegs.reduce((acc, l) => acc + (parseFloat(l.dist) || 0), 0);
  const totalTonKm = totalTons * totalDist;

  return (
    <div className="phase-container logistics-view">
      <div className="view-section">
        <div className="section-header-flex">
          <div>
            <h2 className="section-title">4. Logistics &amp; Transport — Module A4</h2>
            <p className="section-subtitle">
              Model outbound freight distribution from manufacturing facility to installation site across multi-modal legs.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setIsAdding(!isAdding)}
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Cancel' : 'Add Freight Leg'}</span>
          </button>
        </div>

        {/* Logistics KPI Header */}
        <div className="bom-stats-grid">
          <div className="stat-card">
            <span className="stat-title">Module A4 GWP Total</span>
            <span className="stat-num text-emerald">{Math.round(lca.a4_gwp).toLocaleString()} <small>kg CO₂e</small></span>
            <span className="stat-detail">Outbound logistics</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Total Freight Distance</span>
            <span className="stat-num">{totalDist.toLocaleString()} <small>km</small></span>
            <span className="stat-detail">Cumulative journey</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Freight Work Performed</span>
            <span className="stat-num text-blue">{Math.round(totalTonKm).toLocaleString()} <small>t·km</small></span>
            <span className="stat-detail">Payload mass: {totalTons.toFixed(2)} t</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Average Carbon Intensity</span>
            <span className="stat-num text-purple">
              {totalTonKm > 0 ? (lca.a4_gwp / totalTonKm).toFixed(3) : '0.000'} <small>kg/t·km</small>
            </span>
            <span className="stat-detail">Fleet average efficiency</span>
          </div>
        </div>

        {/* Add Leg Form */}
        {isAdding && (
          <form className="add-bom-form" onSubmit={handleAddLeg}>
            <div className="form-row">
              <div className="form-field">
                <label>Origin Location</label>
                <input
                  type="text"
                  placeholder="e.g. Frankfurt Central Hub"
                  value={newLeg.from}
                  onChange={(e) => setNewLeg({ ...newLeg, from: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Destination Location</label>
                <input
                  type="text"
                  placeholder="e.g. Project Site Munich"
                  value={newLeg.to}
                  onChange={(e) => setNewLeg({ ...newLeg, to: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Distance (km)</label>
                <input
                  type="number"
                  value={newLeg.dist}
                  onChange={(e) => setNewLeg({ ...newLeg, dist: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Transport Mode</label>
                <select
                  value={newLeg.mode}
                  onChange={(e) => {
                    const m = e.target.value;
                    let ef = 0.088;
                    if (m.includes('Vessel')) ef = 0.024;
                    if (m.includes('Train')) ef = 0.035;
                    setNewLeg({ ...newLeg, mode: m, ef });
                  }}
                >
                  <option>26t Truck, EURO VI</option>
                  <option>Cargo Vessel (RoRo)</option>
                  <option>Freight Train, Electric</option>
                  <option>Van &lt; 3.5t, EURO VI</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-accent">Save Transport Leg</button>
            </div>
          </form>
        )}

        {/* Legs Table */}
        <div className="table-responsive">
          <table className="studio-table" aria-label="Transport legs table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Leg</th>
                <th>Route (From → To)</th>
                <th style={{ width: '120px' }}>Distance (km)</th>
                <th>Mode &amp; Vehicle Spec</th>
                <th style={{ width: '110px' }}>Load Factor</th>
                <th style={{ width: '130px' }}>EF (kg CO₂e/t·km)</th>
                <th style={{ width: '120px' }}>Leg Emissions</th>
                <th style={{ width: '50px' }}>Act</th>
              </tr>
            </thead>
            <tbody>
              {transportLegs.map((leg, idx) => {
                const distVal = parseFloat(leg.dist) || 0;
                const legGwp = Math.round(totalTons * distVal * leg.ef);

                return (
                  <tr key={leg.id || idx}>
                    <td><span className="badge-module">#{idx + 1}</span></td>
                    <td>
                      <div className="table-primary-text">{leg.from} → {leg.to}</div>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="table-input"
                        value={leg.dist}
                        onChange={(e) => handleUpdateLeg(idx, 'dist', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td><div className="table-sub-text">{leg.mode}</div></td>
                    <td><span className="num-font">{leg.loadFactor}</span></td>
                    <td><span className="num-font">{leg.ef}</span></td>
                    <td><span className="num-font font-semibold">{legGwp.toLocaleString()} kg</span></td>
                    <td>
                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => handleRemoveLeg(leg.id)}
                        title="Remove Leg"
                        aria-label="Remove Leg"
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
          <span>Transport scenarios configured according to EN 15804 §6.3.4.2</span>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={() => {
            showNotif('Logistics saved! Proceeding to Use Phase', 'Logistics Saved');
            setActivePhase('use');
          }}
        >
          <span>Save &amp; Go to Use Phase</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
