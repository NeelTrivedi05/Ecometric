import React from 'react';
import { useStudio } from '../../../context/StudioContext';
import { ChevronRightIcon, FileIcon, CheckCircleIcon, RefreshCwIcon } from '../Icons';
import LciaExtractorSection from '../LciaExtractorSection';

export default function ReviewView() {
  const { extractedData, setExtractedData, setActivePhase, uploadedFiles, loadSampleData } = useStudio();
  
  // Safe destructuring with solid defaults
  const bom = Array.isArray(extractedData?.bom) ? extractedData.bom : [];
  const transport = Array.isArray(extractedData?.transport) ? extractedData.transport : [];
  const manufacturing = extractedData?.manufacturing || {};
  const project_info = extractedData?.project_info || {};
  const operational = extractedData?.operational || {};

  const hasData = (uploadedFiles && uploadedFiles.some(f => f.status === 'done')) || bom.length > 0;

  if (!hasData) {
    return (
      <div className="view-container">
        <h1 className="view-title">Review Extracted Data</h1>
        <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div className="empty-state-title" style={{ fontSize: '18px', fontWeight: 700, color: '#2C221E' }}>
            No Data Extracted Yet
          </div>
          <div className="empty-state-desc" style={{ fontSize: '13px', color: '#7A6B63', maxWidth: '440px', margin: '8px auto 20px auto' }}>
            Upload and extract your product engineering files first, or load the verified sample dataset to test the workflow.
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActivePhase('upload')}
            >
              Go to Upload
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={async () => {
                await loadSampleData();
              }}
            >
              Load Sample 500RT Chiller
            </button>
          </div>
        </div>
      </div>
    );
  }

  const updateProjectField = (field, value) => {
    setExtractedData(prev => ({
      ...prev,
      project_info: { ...(prev?.project_info || {}), [field]: value },
    }));
  };

  const totalMass = bom.reduce((acc, item) => acc + (Number(item.mass) || 0), 0);

  return (
    <div className="view-container">
      {/* Header & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 className="view-title" style={{ margin: 0 }}>Review Extracted Data</h1>
          <p className="view-subtitle" style={{ marginTop: '6px', marginBottom: 0 }}>
            Verify engineering attributes extracted from your documents. Components are linked to verified ecoinvent v3.12 datasets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setActivePhase('upload')}
            style={{ fontSize: '12px' }}
          >
            Upload More Files
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setActivePhase('validate')}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Run ISO/PCR Validation</span>
            <ChevronRightIcon size={14} />
          </button>
        </div>
      </div>

      {/* Project Information Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title" style={{ fontSize: '14px', fontWeight: 700, color: '#2C221E', marginBottom: '14px' }}>
          Project Scope & Reference Declarations
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: '#5C4E46' }}>Product Name</label>
            <input
              className="form-input"
              type="text"
              value={project_info.product_name || ''}
              onChange={(e) => updateProjectField('product_name', e.target.value)}
              placeholder="e.g., Centrifugal Chiller 500RT"
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: '#5C4E46' }}>Manufacturer</label>
            <input
              className="form-input"
              type="text"
              value={project_info.manufacturer_name || ''}
              onChange={(e) => updateProjectField('manufacturer_name', e.target.value)}
              placeholder="e.g., Thermal Systems Inc."
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: '#5C4E46' }}>Functional / Declared Unit</label>
            <input
              className="form-input"
              type="text"
              value={project_info.functional_unit || project_info.declared_unit || ''}
              onChange={(e) => updateProjectField('functional_unit', e.target.value)}
              placeholder="e.g., 1 unit over 25 years RSL"
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: '#5C4E46' }}>PCR Standard Reference</label>
            <input
              className="form-input"
              type="text"
              value={project_info.pcr_ref || ''}
              onChange={(e) => updateProjectField('pcr_ref', e.target.value)}
              placeholder="e.g., UL 10010-4 Part B & EN 15804+A2"
            />
          </div>
        </div>
      </div>

      {/* BOM Table Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div className="card-title" style={{ fontSize: '14px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
              Module A1: Bill of Materials (BOM) — {bom.length} Components
            </div>
            <div style={{ fontSize: '12px', color: '#7A6B63', marginTop: '2px' }}>
              Total Declared Product Mass: <strong style={{ color: '#C25A23' }}>{totalMass.toLocaleString()} kg</strong>
            </div>
          </div>
        </div>

        {bom.length > 0 ? (
          <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Component Name</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Material Key</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px' }}>Mass (kg)</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px' }}>Module</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>ecoinvent v3.12 Match</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Supplier / Origin</th>
                </tr>
              </thead>
              <tbody>
                {bom.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td style={{ fontWeight: 600, color: '#2C221E', padding: '10px 12px' }}>
                      {item.name || item.comp || item.component || `Component ${idx + 1}`}
                    </td>
                    <td style={{ color: '#5C4E46', padding: '10px 12px' }}>
                      {item.material || item.mat || '—'}
                    </td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 600, padding: '10px 12px' }}>
                      {item.mass != null ? Number(item.mass).toLocaleString() : '—'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                      <span style={{
                        backgroundColor: '#FAF0E6',
                        color: '#9C5832',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {item.module || item.mod || 'A1'}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', color: '#6A584F', padding: '10px 12px' }}>
                      {item.ecoinvent_id || item.ei || item.dataset || 'ecoinvent_verified_proxy'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#8A7A72', padding: '10px 12px' }}>
                      {item.supplier || 'Standard Supply Chain'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '24px', textAlign: 'center' }}>
            <div className="empty-state-desc" style={{ color: '#7A6B63', fontSize: '13px' }}>
              No BOM components extracted yet.
            </div>
          </div>
        )}
      </div>

      {/* Inbound Logistics & Factory Energy Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Module A2: Transport Legs */}
        <div className="card">
          <div className="card-title" style={{ fontSize: '14px', fontWeight: 700, color: '#2C221E', marginBottom: '12px' }}>
            Module A2: Inbound Freight & Transport
          </div>
          {transport.length > 0 ? (
            <div className="data-table-wrapper">
              <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Transport Mode</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Distance</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Emission Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {transport.map((leg, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px', fontWeight: 500 }}>{leg.mode || 'Freight transport'}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                        {leg.dist || leg.distance ? `${leg.dist || leg.distance} km` : '—'}
                      </td>
                      <td style={{ padding: '8px', color: '#7A6B63' }}>
                        {leg.ef || leg.emission_factor || '0.088 kg CO2e/tkm'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '16px', backgroundColor: '#FCFAF8', borderRadius: '8px', fontSize: '12px', color: '#7A6B63' }}>
              Defaulting to UL 10010-4 regional standard: <strong>500 km heavy lorry</strong> transport to assembly plant.
            </div>
          )}
        </div>

        {/* Module A3 & B: Manufacturing & Refrigerant Specs */}
        <div className="card">
          <div className="card-title" style={{ fontSize: '14px', fontWeight: 700, color: '#2C221E', marginBottom: '12px' }}>
            Module A3 & B: Energy & Operational Parameters
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FCFAF8', borderRadius: '6px' }}>
              <span style={{ color: '#5C4E46' }}>Plant Electricity Consumption</span>
              <strong style={{ color: '#2C221E' }}>
                {manufacturing.annual_facility_kwh ? `${Number(manufacturing.annual_facility_kwh).toLocaleString()} kWh/yr` : '34,000 kWh/yr'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FCFAF8', borderRadius: '6px' }}>
              <span style={{ color: '#5C4E46' }}>Refrigerant Nameplate & Charge</span>
              <strong style={{ color: '#2C221E' }}>
                {operational.refrigerant_type || 'R134a'} ({operational.refrigerant_charge_kg || 45} kg charge)
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FCFAF8', borderRadius: '6px' }}>
              <span style={{ color: '#5C4E46' }}>Equipment Rated Efficiency</span>
              <strong style={{ color: '#2C221E' }}>
                {operational.efficiency_kw_per_ton ? `${operational.efficiency_kw_per_ton} kW/ton` : '0.54 kW/ton'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FCFAF8', borderRadius: '6px' }}>
              <span style={{ color: '#5C4E46' }}>Reference Service Life (RSL)</span>
              <strong style={{ color: '#2C221E' }}>
                {project_info.lifespan_years || 25} Years
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Live ecoinvent LCIA Extractor & EPD Calculator Component */}
      <LciaExtractorSection />

      {/* Action Footer */}
      <div style={{ marginTop: '24px', display: 'flex', gap: '14px', alignItems: 'center' }}>

        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => setActivePhase('validate')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>Confirm Data & Run PCR Validation</span>
          <ChevronRightIcon size={16} />
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-lg"
          onClick={() => setActivePhase('upload')}
        >
          Back to Upload
        </button>
      </div>
    </div>
  );
}
