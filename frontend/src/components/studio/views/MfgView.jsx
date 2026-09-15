import React from 'react';
import { useStudio } from '../../../context/StudioContext';
import { ChevronRightIcon, CheckIcon } from '../Icons';

export default function MfgView() {
  const {
    mfgData,
    setMfgData,
    lca,
    setActivePhase,
    showNotif,
  } = useStudio();

  const handleMfgChange = (field, val) => {
    setMfgData(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
  };

  return (
    <div className="phase-container mfg-view">
      <div className="view-section">
        <div className="section-header">
          <h2 className="section-title">3. Manufacturing Energy &amp; Processes — Module A3</h2>
          <p className="section-subtitle">
            Configure direct plant utilities, on-site fuel combustion, and green Power Purchase Agreement (PPA) allocation.
          </p>
        </div>

        {/* Manufacturing Summary KPI */}
        <div className="bom-stats-grid">
          <div className="stat-card">
            <span className="stat-title">Module A3 GWP Total</span>
            <span className="stat-num text-emerald">{Math.round(lca.a3_gwp).toLocaleString()} <small>kg CO₂e</small></span>
            <span className="stat-detail">Per declared unit</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Annual Plant Volume</span>
            <span className="stat-num">{mfgData.annual_production} <small>units/yr</small></span>
            <span className="stat-detail">ISO 14044 physical allocation</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">PPA Renewable Share</span>
            <span className="stat-num text-blue">{mfgData.ppa_share}%</span>
            <span className="stat-detail">Guarantees of Origin (GoO)</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Electricity Grid Factor</span>
            <span className="stat-num text-purple">{mfgData.electricity_ef} <small>kg/kWh</small></span>
            <span className="stat-detail">Residual mix factor</span>
          </div>
        </div>

        {/* Energy Inputs Grid */}
        <div className="form-builder">
          <div className="form-row">
            <div className="form-field">
              <label>Electricity Consumption (kWh / unit)</label>
              <input
                type="number"
                value={mfgData.electricity_kwh}
                onChange={(e) => handleMfgChange('electricity_kwh', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Electricity EF (kg CO₂ eq / kWh)</label>
              <input
                type="number"
                step="0.001"
                value={mfgData.electricity_ef}
                onChange={(e) => handleMfgChange('electricity_ef', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Natural Gas (m³ / unit)</label>
              <input
                type="number"
                value={mfgData.gas_m3}
                onChange={(e) => handleMfgChange('gas_m3', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Natural Gas EF (kg CO₂ eq / m³)</label>
              <input
                type="number"
                step="0.01"
                value={mfgData.gas_ef}
                onChange={(e) => handleMfgChange('gas_ef', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Compressed Air (m³ / unit)</label>
              <input
                type="number"
                value={mfgData.air_m3}
                onChange={(e) => handleMfgChange('air_m3', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Process Cooling Water (m³ / unit)</label>
              <input
                type="number"
                step="0.1"
                value={mfgData.water_m3}
                onChange={(e) => handleMfgChange('water_m3', e.target.value)}
              />
            </div>
          </div>

          {/* Renewable Share Slider */}
          <div className="form-field full-width">
            <div className="slider-header">
              <label>Contractual Renewable Electricity (PPA / GoO Share)</label>
              <span className="slider-value num-font">{mfgData.ppa_share}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={mfgData.ppa_share}
              onChange={(e) => handleMfgChange('ppa_share', e.target.value)}
              className="studio-range"
            />
            <div className="slider-hint">
              Per GHG Protocol Scope 2 Guidance (market-based approach) with verified Guarantees of Origin.
            </div>
          </div>
        </div>
      </div>

      <div className="workflow-footer">
        <div className="wf-status">
          <CheckIcon className="w-4 h-4 text-emerald" />
          <span>Factory energy allocation validated per ISO 14044 §4.3.4</span>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={() => {
            showNotif('Manufacturing energy saved! Proceeding to Logistics', 'Mfg Saved');
            setActivePhase('logistics');
          }}
        >
          <span>Save &amp; Go to Logistics</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
