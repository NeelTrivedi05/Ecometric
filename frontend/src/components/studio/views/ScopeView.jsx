import React from 'react';
import { useStudio } from '../../../context/StudioContext';
import { ChevronRightIcon, CheckIcon } from '../Icons';

const SCOPE_OPTIONS = [
  { id: 'cradletogate', label: 'A1–A3 Cradle-to-Gate', desc: 'Manufacturing only. Typical for raw material EPDs.' },
  { id: 'cradletosite', label: 'A1–A5 Cradle-to-Site', desc: 'Includes construction and installation process.' },
  { id: 'cradletograve', label: 'A1–C4 Cradle-to-Grave', desc: 'Full lifecycle. Standard for building equipment EPDs.' },
  { id: 'module-d', label: 'A1–C4 + Module D', desc: 'Includes circularity and reuse credits beyond boundary.' },
];

export default function ScopeView() {
  const {
    projectInfo,
    setProjectInfo,
    declaredModules,
    toggleModule,
    setActivePhase,
    showNotif,
  } = useStudio();

  const handleScopeSelect = (scopeId) => {
    setProjectInfo(prev => ({ ...prev, systemBoundary: scopeId }));
    showNotif(`System boundary updated to ${scopeId}`, 'Scope Updated');
  };

  const handleInputChange = (field, val) => {
    setProjectInfo(prev => ({ ...prev, [field]: val }));
  };

  return (
    <div className="phase-container scope-view">
      <div className="view-section">
        <div className="section-header">
          <h2 className="section-title">1. System Boundary &amp; Module Scope</h2>
          <p className="section-subtitle">
            Select the lifecycle boundary model per EN 15804+A2, then fine-tune individual module declarations below.
          </p>
        </div>

        <div className="boundary-grid" role="radiogroup" aria-label="System boundary options">
          {SCOPE_OPTIONS.map((opt) => {
            const isSelected = projectInfo.systemBoundary === opt.id;
            return (
              <div
                key={opt.id}
                className={`boundary-card ${isSelected ? 'selected' : ''}`}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleScopeSelect(opt.id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleScopeSelect(opt.id);
                  }
                }}
              >
                <div className="b-header">
                  <span className="b-label">{opt.label}</span>
                  <span className="b-radio-circle">
                    {isSelected && <span className="b-radio-dot" />}
                  </span>
                </div>
                <p className="b-desc">{opt.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="modules-declaration-block">
          <div className="modules-label">
            <span>Declared EN 15804+A2 Modules:</span>
            <span className="modules-hint">(Click any tile to toggle between Declared and MND)</span>
          </div>

          <div className="module-toggle-grid">
            {declaredModules.map((m) => {
              const isOn = m.on;
              return (
                <div
                  key={m.id}
                  className={`mt-cell ${isOn ? 'on' : 'off'}`}
                  id={`mt-${m.id}`}
                  onClick={() => toggleModule(m.id)}
                  role="checkbox"
                  aria-checked={isOn}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleModule(m.id);
                    }
                  }}
                  title={isOn ? `${m.id} is Declared in this assessment` : `${m.id} is MND (Module Not Declared)`}
                >
                  <div className="mt-id">{m.id}</div>
                  <div className="mt-name">{m.name}</div>
                  <div className="mt-status-tag">{isOn ? 'DECLARED' : 'MND'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="view-section">
        <div className="section-header">
          <h2 className="section-title">2. Declared / Functional Unit &amp; PCR</h2>
          <p className="section-subtitle">
            Configure the reference Product Category Rule (PCR) and operational service life for verifier certification.
          </p>
        </div>

        <div className="form-builder">
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="productName">Product Name</label>
              <input
                id="productName"
                type="text"
                value={projectInfo.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="operator">Program Operator</label>
              <select
                id="operator"
                value={projectInfo.operator}
                onChange={(e) => handleInputChange('operator', e.target.value)}
              >
                <option>International EPD System (Environdec)</option>
                <option>UL Environment</option>
                <option>IBU - Institut Bauen und Umwelt</option>
                <option>INIES (France)</option>
                <option>EPD Australasia</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="capacity">Declared Capacity</label>
              <input
                id="capacity"
                type="text"
                value={projectInfo.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="rsl">Reference Service Life (RSL)</label>
              <select
                id="rsl"
                value={projectInfo.rsl}
                onChange={(e) => handleInputChange('rsl', e.target.value)}
              >
                <option>10 years</option>
                <option>15 years</option>
                <option>20 years</option>
                <option>25 years</option>
                <option>30 years</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="declaredUnitStatement">Full Declared Unit Statement</label>
            <input
              id="declaredUnitStatement"
              type="text"
              value={projectInfo.declaredUnitStatement}
              onChange={(e) => handleInputChange('declaredUnitStatement', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="pcrRef">PCR Reference</label>
              <input
                id="pcrRef"
                type="text"
                value={projectInfo.pcrRef}
                onChange={(e) => handleInputChange('pcrRef', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="lciaMethod">LCIA Method</label>
              <select
                id="lciaMethod"
                value={projectInfo.lciaMethod}
                onChange={(e) => handleInputChange('lciaMethod', e.target.value)}
              >
                <option>EF 3.1 (recommended)</option>
                <option>CML 2016</option>
                <option>ReCiPe 2016</option>
                <option>TRACI 2.1</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="workflow-footer">
        <div className="wf-status">
          <CheckIcon className="w-4 h-4 text-emerald" />
          <span>System boundary &amp; functional unit validated per EN 15804+A2</span>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={() => {
            showNotif('Scope saved! Proceeding to Bill of Materials', 'Scope Saved');
            setActivePhase('bom');
          }}
        >
          <span>Save &amp; Go to BOM</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
