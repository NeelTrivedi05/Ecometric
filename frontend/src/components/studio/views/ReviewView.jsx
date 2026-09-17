import React, { useState } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { 
  ChevronRightIcon, 
  CheckCircleIcon, 
  LayersIcon, 
  TruckIcon, 
  LeafIcon, 
  DatabaseIcon, 
  EditIcon, 
  AlertIcon 
} from '../Icons';
import LciaExtractorSection from '../LciaExtractorSection';

export default function ReviewView() {
  const { 
    extractedData, 
    setExtractedData, 
    setActivePhase, 
    uploadedFiles, 
    loadSampleData,
    updateManufacturing,
    updateInstallation,
    updateOperational,
    updateEndOfLife,
    updateCircularityD
  } = useStudio();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'a1_a3' | 'a4_a5' | 'b1_b7' | 'c1_c4' | 'd'

  // Safe destructuring with explicit fallbacks
  const bom = Array.isArray(extractedData?.bom) ? extractedData.bom : [];
  const transport = Array.isArray(extractedData?.transport) ? extractedData.transport : [];
  const manufacturing = extractedData?.manufacturing || {};
  const project_info = extractedData?.project_info || {};
  const installation = extractedData?.installation || {};
  const operational = extractedData?.operational || {};
  const end_of_life = extractedData?.end_of_life || {};
  const circularity_d = extractedData?.circularity_d || {};

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
            Upload and extract your product engineering files first, or load the verified sample dataset to inspect the full cradle-to-grave lifecycle data.
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

  // Aggregated KPI Metrics
  const totalMass = bom.reduce((acc, item) => acc + (Number(item.mass) || 0), 0);
  const inboundFreightKm = transport
    .filter(t => !t.module || t.module === 'A2')
    .reduce((acc, t) => acc + (Number(t.distance || t.dist) || 0), 0);
  const outboundFreightKm = Number(installation.outbound_transport_km) || 500;
  const totalLogisticsKm = inboundFreightKm + outboundFreightKm;
  const annualFactoryKwh = Number(manufacturing.annual_facility_kwh) || 34000;
  const ratedEfficiency = Number(operational.efficiency_kw_per_ton) || 0.54;
  const capacityRt = Number(operational.capacity_rt) || 500;
  const annualOperationalKwh = Math.round(capacityRt * ratedEfficiency * 2000); // 2000 full-load equivalent hours
  const recyclingRate = Number(end_of_life.recycling_rate_percent) || 92.4;
  const avoidedBurdenCo2e = Number(circularity_d.net_avoided_burden_gwp_kg) || -3210;

  const tabs = [
    { id: 'all', label: 'All Modules (A1–D)', badge: 'Full Lifecycle' },
    { id: 'a1_a3', label: 'A1–A3 Production', badge: 'Upstream & Factory' },
    { id: 'a4_a5', label: 'A4–A5 Construction', badge: 'Delivery & Rigging' },
    { id: 'b1_b7', label: 'B1–B7 Operational Use', badge: 'Refrigerant & Power' },
    { id: 'c1_c4', label: 'C1–C4 End of Life', badge: 'Decommissioning' },
    { id: 'd', label: 'Module D Circularity', badge: 'Avoided Burdens' },
  ];

  return (
    <div className="view-container">
      {/* Header & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              backgroundColor: '#FAF0E6',
              color: '#9C5832',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase'
            }}>
              Phase 2
            </span>
            <h1 className="view-title" style={{ margin: 0 }}>Extracted Lifecycle Inventory (Modules A–D)</h1>
          </div>
          <p className="view-subtitle" style={{ marginTop: '4px', marginBottom: 0 }}>
            Mandatory ISO 14025 & EN 15804+A2 data coverage from raw material extraction (A1) through circularity offsets (Module D).
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
            onClick={() => setActivePhase('user_review')}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Proceed to User Review & Providers</span>
            <ChevronRightIcon size={14} />
          </button>
        </div>
      </div>

      {/* ── LIFECYCLE KPI SUMMARY STRIP ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Metric 1: Total Mass */}
        <div style={{
          backgroundColor: '#FFF',
          border: '1px solid #EED8C5',
          borderRadius: '10px',
          padding: '14px 16px',
          boxShadow: '0 2px 6px rgba(44,34,30,0.03)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8A7A72', textTransform: 'uppercase' }}>Declared Product Mass (A1)</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#C25A23', marginTop: '4px' }}>
            {totalMass.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 500, color: '#7A6B63' }}>kg</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8A7A72', marginTop: '2px' }}>{bom.length} BOM components extracted</div>
        </div>

        {/* Metric 2: Total Logistics */}
        <div style={{
          backgroundColor: '#FFF',
          border: '1px solid #EED8C5',
          borderRadius: '10px',
          padding: '14px 16px',
          boxShadow: '0 2px 6px rgba(44,34,30,0.03)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8A7A72', textTransform: 'uppercase' }}>Total Logistics Scope (A2 & A4)</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#2C221E', marginTop: '4px' }}>
            {totalLogisticsKm.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 500, color: '#7A6B63' }}>km</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8A7A72', marginTop: '2px' }}>Inbound + {outboundFreightKm}km delivery</div>
        </div>

        {/* Metric 3: Operational Energy */}
        <div style={{
          backgroundColor: '#FFF',
          border: '1px solid #EED8C5',
          borderRadius: '10px',
          padding: '14px 16px',
          boxShadow: '0 2px 6px rgba(44,34,30,0.03)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8A7A72', textTransform: 'uppercase' }}>Annual Grid Energy (A3 & B6)</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#2C221E', marginTop: '4px' }}>
            {((annualFactoryKwh + annualOperationalKwh) / 1000).toFixed(1)} <span style={{ fontSize: '13px', fontWeight: 500, color: '#7A6B63' }}>MWh/yr</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8A7A72', marginTop: '2px' }}>Plant: {annualFactoryKwh.toLocaleString()} kWh | B6: {annualOperationalKwh.toLocaleString()} kWh</div>
        </div>

        {/* Metric 4: Circularity & Recovery */}
        <div style={{
          backgroundColor: '#FFF',
          border: '1px solid #EED8C5',
          borderRadius: '10px',
          padding: '14px 16px',
          boxShadow: '0 2px 6px rgba(44,34,30,0.03)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8A7A72', textTransform: 'uppercase' }}>Circularity & Recovery (C3 & D)</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#2E7D32', marginTop: '4px' }}>
            {recyclingRate}% <span style={{ fontSize: '12px', fontWeight: 600, color: '#2E7D32' }}>({avoidedBurdenCo2e.toLocaleString()} kg CO₂e)</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8A7A72', marginTop: '2px' }}>Net avoided burden virgin offset</div>
        </div>
      </div>

      {/* ── STAGE FILTER TABS ── */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '6px',
        marginBottom: '20px',
        borderBottom: '1px solid #EED8C5'
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px 8px 0 0',
                border: isActive ? '1px solid #EED8C5' : '1px solid transparent',
                borderBottom: isActive ? '2px solid #C25A23' : 'none',
                backgroundColor: isActive ? '#FFF' : 'transparent',
                color: isActive ? '#C25A23' : '#7A6B63',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: isActive ? '#FAF0E6' : '#F2EBE5',
                color: isActive ? '#9C5832' : '#8A7A72',
                fontWeight: 600
              }}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── PROJECT INFORMATION CARD (Always Visible) ── */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title" style={{ fontSize: '14px', fontWeight: 700, color: '#2C221E', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayersIcon size={16} style={{ color: '#C25A23' }} />
          <span>Project Scope & Reference Declarations</span>
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

      {/* ── TAB: MODULE A1–A3 (Production Stage) ── */}
      {(activeTab === 'all' || activeTab === 'a1_a3') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#FAF0E6', color: '#9C5832', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              STAGE A1–A3
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
              Upstream Production & Manufacturing Stage
            </h2>
          </div>

          {/* Module A1: BOM */}
          <div className="card" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div className="card-title" style={{ fontSize: '14px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
                  Module A1: Raw Materials Bill of Materials (BOM) — {bom.length} Components
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

          {/* Module A2 & A3 Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            {/* Module A2: Inbound Freight */}
            <div className="card">
              <div className="card-title" style={{ fontSize: '14px', fontWeight: 700, color: '#2C221E', marginBottom: '12px' }}>
                Module A2: Inbound Logistics & Transport
              </div>
              {transport.filter(t => !t.module || t.module === 'A2').length > 0 ? (
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
                      {transport.filter(t => !t.module || t.module === 'A2').map((leg, idx) => (
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

            {/* Module A3: Manufacturing Utilities */}
            <div className="card">
              <div className="card-title" style={{ fontSize: '14px', fontWeight: 700, color: '#2C221E', marginBottom: '12px' }}>
                Module A3: Manufacturing & Assembly Utilities
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Annual Grid Electricity (kWh)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={manufacturing.annual_facility_kwh || ''}
                    onChange={(e) => updateManufacturing({ annual_facility_kwh: Number(e.target.value) })}
                    placeholder="34000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Natural Gas (MJ)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={manufacturing.natural_gas_mj || ''}
                    onChange={(e) => updateManufacturing({ natural_gas_mj: Number(e.target.value) })}
                    placeholder="18500"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Grid Sub-region</label>
                  <input
                    type="text"
                    className="form-input"
                    value={manufacturing.grid_region || ''}
                    onChange={(e) => updateManufacturing({ grid_region: e.target.value })}
                    placeholder="US_Average"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Process Water (m³)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={manufacturing.water_m3 || ''}
                    onChange={(e) => updateManufacturing({ water_m3: Number(e.target.value) })}
                    placeholder="45.0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MODULE A4–A5 (Construction / Installation Stage) ── */}
      {(activeTab === 'all' || activeTab === 'a4_a5') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#FAF0E6', color: '#9C5832', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              STAGE A4–A5
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
              Construction & Installation Stage
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            {/* Module A4: Outbound Transport */}
            <div className="card">
              <div className="card-title" style={{ fontSize: '14px', fontWeight: 700, color: '#2C221E', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TruckIcon size={16} style={{ color: '#C25A23' }} />
                <span>Module A4: Outbound Transport to Customer Site</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Delivery Distance to Installation Site (km)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={installation.outbound_transport_km || ''}
                    onChange={(e) => updateInstallation({ outbound_transport_km: Number(e.target.value) })}
                    placeholder="500"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Transport Mode & Fleet Type</label>
                  <input
                    type="text"
                    className="form-input"
                    value={installation.transport_mode || ''}
                    onChange={(e) => updateInstallation({ transport_mode: e.target.value })}
                    placeholder="Heavy Lorry >32t (EURO 6)"
                  />
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: '#FCFAF8', borderRadius: '6px', fontSize: '12px', color: '#7A6B63' }}>
                  Standard emission factor: <strong>0.088 kg CO₂e / t·km</strong> (ecoinvent v3.12 market for transport, freight, lorry &gt;32 metric ton, EURO6).
                </div>
              </div>
            </div>

            {/* Module A5: Installation & Rigging */}
            <div className="card">
              <div className="card-title" style={{ fontSize: '14px', fontWeight: 700, color: '#2C221E', marginBottom: '12px' }}>
                Module A5: Installation, Rigging & Commissioning
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>On-Site Installation Energy (kWh)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={installation.installation_energy_kwh || ''}
                    onChange={(e) => updateInstallation({ installation_energy_kwh: Number(e.target.value) })}
                    placeholder="350"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Commissioning Refrigerant Loss (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={installation.commissioning_refrigerant_loss_kg || ''}
                    onChange={(e) => updateInstallation({ commissioning_refrigerant_loss_kg: Number(e.target.value) })}
                    placeholder="0.5"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Rigging Crane Mobile Diesel (liters)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={installation.rigging_crane_diesel_liters || ''}
                    onChange={(e) => updateInstallation({ rigging_crane_diesel_liters: Number(e.target.value) })}
                    placeholder="25.0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MODULE B1–B7 (Operational Use Stage) ── */}
      {(activeTab === 'all' || activeTab === 'b1_b7') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#FAF0E6', color: '#9C5832', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              STAGE B1–B7
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
              Operational Use Stage (25-Year Reference Service Life)
            </h2>
          </div>

          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* B1: Fugitive Leaks */}
              <div style={{ padding: '12px', backgroundColor: '#FCFAF8', borderRadius: '8px', border: '1px solid #EED8C5' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#C25A23', marginBottom: '8px' }}>
                  Module B1: Direct Fugitive Emissions
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Refrigerant Designation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={operational.refrigerant_type || ''}
                    onChange={(e) => updateOperational({ refrigerant_type: e.target.value })}
                    placeholder="R134a"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Initial Charge (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.refrigerant_charge_kg || ''}
                    onChange={(e) => updateOperational({ refrigerant_charge_kg: Number(e.target.value) })}
                    placeholder="45.0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Annual Leak Rate (%/yr)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={operational.annual_leak_rate_percent || ''}
                    onChange={(e) => updateOperational({ annual_leak_rate_percent: Number(e.target.value) })}
                    placeholder="2.0"
                  />
                </div>
              </div>

              {/* B2 & B3: Maintenance & Repair */}
              <div style={{ padding: '12px', backgroundColor: '#FCFAF8', borderRadius: '8px', border: '1px solid #EED8C5' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#C25A23', marginBottom: '8px' }}>
                  Module B2 & B3: Servicing & Repair
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Maintenance Power (kWh/yr)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.scheduled_maintenance_kwh_yr || ''}
                    onChange={(e) => updateOperational({ scheduled_maintenance_kwh_yr: Number(e.target.value) })}
                    placeholder="180.0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Operational Leak Rate (%/yr)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={operational.fugitive_operational_leak_rate || ''}
                    onChange={(e) => updateOperational({ fugitive_operational_leak_rate: Number(e.target.value) })}
                    placeholder="0.5"
                  />
                </div>
              </div>

              {/* B4 & B5: Replacement & Refurbishment */}
              <div style={{ padding: '12px', backgroundColor: '#FCFAF8', borderRadius: '8px', border: '1px solid #EED8C5' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#C25A23', marginBottom: '8px' }}>
                  Module B4 & B5: Overhaul & Refurbishment
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Major Replacement Milestone (Year)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.major_component_replacement_year || ''}
                    onChange={(e) => updateOperational({ major_component_replacement_year: Number(e.target.value) })}
                    placeholder="15"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Reference Service Life (RSL Years)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={project_info.lifespan_years || ''}
                    onChange={(e) => updateProjectField('lifespan_years', Number(e.target.value))}
                    placeholder="25"
                  />
                </div>
              </div>

              {/* B6 & B7: Operational Energy & Water */}
              <div style={{ padding: '12px', backgroundColor: '#FCFAF8', borderRadius: '8px', border: '1px solid #EED8C5' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#C25A23', marginBottom: '8px' }}>
                  Module B6 & B7: Operational Energy & Water
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Equipment Rated Efficiency (kW/ton)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={operational.efficiency_kw_per_ton || ''}
                    onChange={(e) => updateOperational({ efficiency_kw_per_ton: Number(e.target.value) })}
                    placeholder="0.54"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Equipment Rated Capacity (RT)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.capacity_rt || ''}
                    onChange={(e) => updateOperational({ capacity_rt: Number(e.target.value) })}
                    placeholder="500.0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Cooling Tower Water Makeup (m³/yr)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.cooling_tower_water_m3_yr || ''}
                    onChange={(e) => updateOperational({ cooling_tower_water_m3_yr: Number(e.target.value) })}
                    placeholder="120.0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MODULE C1–C4 (End-of-Life Stage) ── */}
      {(activeTab === 'all' || activeTab === 'c1_c4') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#FAF0E6', color: '#9C5832', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              STAGE C1–C4
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
              End of Life Stage (Decommissioning & Waste Disposal)
            </h2>
          </div>

          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Decommissioning Energy (C1 kWh)</label>
                <input
                  type="number"
                  className="form-input"
                  value={end_of_life.decommissioning_energy_kwh || ''}
                  onChange={(e) => updateEndOfLife({ decommissioning_energy_kwh: Number(e.target.value) })}
                  placeholder="120"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Waste Transport to Processing (C2 km)</label>
                <input
                  type="number"
                  className="form-input"
                  value={end_of_life.waste_transport_km || ''}
                  onChange={(e) => updateEndOfLife({ waste_transport_km: Number(e.target.value) })}
                  placeholder="100"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Recycling & Recovery Rate (C3 %)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={end_of_life.recycling_rate_percent || ''}
                  onChange={(e) => updateEndOfLife({ recycling_rate_percent: Number(e.target.value) })}
                  placeholder="92.4"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Sanitary Landfill Fraction (C4 %)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={end_of_life.landfill_rate_percent || ''}
                  onChange={(e) => updateEndOfLife({ landfill_rate_percent: Number(e.target.value) })}
                  placeholder="4.5"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Thermal Incineration Rate (C4 %)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={end_of_life.incineration_rate_percent || ''}
                  onChange={(e) => updateEndOfLife({ incineration_rate_percent: Number(e.target.value) })}
                  placeholder="3.1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MODULE D (Circularity & Benefits Beyond System Boundary) ── */}
      {(activeTab === 'all' || activeTab === 'd') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              MODULE D
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
              Benefits & Loads Beyond System Boundary (Circularity Credits)
            </h2>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #2E7D32' }}>
            <div style={{ fontSize: '13px', color: '#5C4E46', marginBottom: '14px' }}>
              ISO 21930 & EN 15804+A2 require explicit accounting of exported secondary materials, avoided virgin production credits, and refrigerant reclamation.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Steel Scrap Recovery Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={circularity_d.steel_scrap_recovery_rate || ''}
                  onChange={(e) => updateCircularityD({ steel_scrap_recovery_rate: Number(e.target.value) })}
                  placeholder="95.0"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Copper Scrap Recovery Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={circularity_d.copper_scrap_recovery_rate || ''}
                  onChange={(e) => updateCircularityD({ copper_scrap_recovery_rate: Number(e.target.value) })}
                  placeholder="96.0"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Aluminium Recovery Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={circularity_d.aluminium_recovery_rate || ''}
                  onChange={(e) => updateCircularityD({ aluminium_recovery_rate: Number(e.target.value) })}
                  placeholder="90.0"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Refrigerant Reclamation Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={circularity_d.refrigerant_reclamation_rate || ''}
                  onChange={(e) => updateCircularityD({ refrigerant_reclamation_rate: Number(e.target.value) })}
                  placeholder="92.0"
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Net Avoided Carbon Burden Credit (kg CO₂e)</label>
                <input
                  type="number"
                  className="form-input"
                  value={circularity_d.net_avoided_burden_gwp_kg || ''}
                  onChange={(e) => updateCircularityD({ net_avoided_burden_gwp_kg: Number(e.target.value) })}
                  placeholder="-3210.0"
                />
                <div style={{ fontSize: '11px', color: '#2E7D32', marginTop: '4px' }}>
                  Negative value indicates a net environmental credit offset against virgin raw material extraction.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live ecoinvent LCIA Extractor & EPD Calculator Component */}
      <LciaExtractorSection />

      {/* Action Footer */}
      <div style={{ marginTop: '24px', display: 'flex', gap: '14px', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => setActivePhase('user_review')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>Proceed to User Review & Provider Selection</span>
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
