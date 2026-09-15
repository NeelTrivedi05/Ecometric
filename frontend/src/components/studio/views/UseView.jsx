import React from 'react';
import { useStudio } from '../../../context/StudioContext';
import { ChevronRightIcon, CheckIcon } from '../Icons';

export default function UseView() {
  const {
    useData,
    setUseData,
    lca,
    setActivePhase,
    showNotif,
  } = useStudio();

  const handleUseChange = (field, val) => {
    setUseData(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
  };

  const lifetimeElecKwh = useData.b6_kwh_yr * useData.b6_rsl;
  const lifetimeWaterM3 = useData.b7_water_m3_yr * useData.b6_rsl;

  return (
    <div className="phase-container use-view">
      <div className="view-section">
        <div className="section-header">
          <h2 className="section-title">5. Use Phase Scenarios — Modules B1–B7</h2>
          <p className="section-subtitle">
            Model operational electricity (B6), process water consumption (B7), and scheduled maintenance over the Reference Service Life (RSL).
          </p>
        </div>

        {/* Use Phase KPI Summary */}
        <div className="bom-stats-grid">
          <div className="stat-card">
            <span className="stat-title">Stage B Lifetime GWP</span>
            <span className="stat-num text-emerald">{Math.round(lca.b_stage_gwp).toLocaleString()} <small>kg CO₂e</small></span>
            <span className="stat-detail">Over {useData.b6_rsl} years RSL</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Lifetime Electricity</span>
            <span className="stat-num">{lifetimeElecKwh.toLocaleString()} <small>kWh</small></span>
            <span className="stat-detail">Annual: {useData.b6_kwh_yr.toLocaleString()} kWh/yr</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Lifetime Cooling Water</span>
            <span className="stat-num text-blue">{lifetimeWaterM3.toLocaleString()} <small>m³</small></span>
            <span className="stat-detail">Annual: {useData.b7_water_m3_yr} m³/yr</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Grid Carbon Intensity</span>
            <span className="stat-num text-purple">{useData.b6_ef} <small>kg CO₂/kWh</small></span>
            <span className="stat-detail">EU-27 average grid mix</span>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="form-builder">
          <div className="form-row">
            <div className="form-field">
              <label>Module B6: Annual Electricity (kWh/year)</label>
              <input
                type="number"
                value={useData.b6_kwh_yr}
                onChange={(e) => handleUseChange('b6_kwh_yr', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Electricity Grid Factor (kg CO₂ eq / kWh)</label>
              <input
                type="number"
                step="0.001"
                value={useData.b6_ef}
                onChange={(e) => handleUseChange('b6_ef', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Module B7: Operational Water (m³/year)</label>
              <input
                type="number"
                value={useData.b7_water_m3_yr}
                onChange={(e) => handleUseChange('b7_water_m3_yr', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Water Supply &amp; Treatment EF (kg CO₂ eq / m³)</label>
              <input
                type="number"
                step="0.001"
                value={useData.b7_water_ef}
                onChange={(e) => handleUseChange('b7_water_ef', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Reference Service Life (RSL in Years)</label>
              <input
                type="number"
                value={useData.b6_rsl}
                onChange={(e) => handleUseChange('b6_rsl', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Module B2: Annual Scheduled Maintenance (kWh/year)</label>
              <input
                type="number"
                value={useData.b2_kwh_yr}
                onChange={(e) => handleUseChange('b2_kwh_yr', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="workflow-footer">
        <div className="wf-status">
          <CheckIcon className="w-4 h-4 text-emerald" />
          <span>Operational energy &amp; water scenarios adhere to PCR 2019:14 Annex 3</span>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={() => {
            showNotif('Use phase saved! Proceeding to End-of-Life', 'Use Phase Saved');
            setActivePhase('eol');
          }}
        >
          <span>Save &amp; Go to End-of-Life</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
