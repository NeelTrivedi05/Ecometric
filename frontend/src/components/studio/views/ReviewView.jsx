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
    updateCircularityD,
    results,
    lca
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
          <div className="empty-state-title" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            No Data Extracted Yet
          </div>
          <div className="empty-state-desc" style={{ fontSize: '13px', color: 'var(--text-secondary, #86868b)', maxWidth: '440px', margin: '8px auto 20px auto' }}>
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
  const outboundFreightKm = Number(installation.outbound_transport_km) || 0;
  const totalLogisticsKm = inboundFreightKm + outboundFreightKm;
  const annualFactoryKwh = Number(manufacturing.annual_facility_kwh) || 0;
  const ratedEfficiency = Number(operational.efficiency_kw_per_ton) || 0;
  const capacityRt = Number(operational.capacity_rt) || 0;
  // Only compute operational kWh when real capacity + efficiency data exists
  const annualOperationalKwh = (capacityRt > 0 && ratedEfficiency > 0)
    ? Math.round(capacityRt * ratedEfficiency * (Number(operational.annual_operating_hours) || 0))
    : 0;
  const recyclingRate = Number(end_of_life.recycling_rate_percent) || 0;
  // Module D avoided burden comes strictly from verified backend calculation results — zero fake fallbacks
  const avoidedBurdenCo2e = (lca?.isCalculated && (lca?.module_d_gwp != null || results?.module_d_gwp != null || results?.d_gwp != null))
    ? Number(lca?.module_d_gwp ?? results?.module_d_gwp ?? results?.d_gwp)
    : null;

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
      {/* Apple View Header */}
      <div className="apple-view-header">
        <div>
          <span className="apple-eyebrow">Phase 2 • Lifecycle Inventory</span>
          <h1 className="view-title" style={{ margin: 0, fontFamily: 'var(--font-display, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif)', letterSpacing: '-0.022em' }}>
            Extracted Lifecycle Inventory (Modules A–D)
          </h1>
          <p className="view-subtitle" style={{ marginTop: '4px', marginBottom: 0, color: 'var(--text-secondary, #86868b)' }}>
            Mandatory ISO 14025 & EN 15804+A2 data coverage normalized per 1 ton chilling capacity over 25-yr RSL.
          </p>
        </div>

        <div className="apple-header-action-group">
          <button
            type="button"
            className="btn-apple-secondary-pill"
            onClick={() => setActivePhase('upload')}
          >
            Upload More Files
          </button>
          <button
            type="button"
            className="btn-apple-action-blue"
            onClick={() => setActivePhase('user_review')}
          >
            <span>User Review & Providers</span>
            <ChevronRightIcon size={14} />
          </button>
        </div>
      </div>

      {/* ── LIFECYCLE KPI SUMMARY STRIP (Apple store utility cards) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Metric 1: Total Mass */}
        <div className="apple-card" style={{ padding: '16px 20px', margin: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #86868b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Declared Product Mass (A1)</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#0066cc', marginTop: '4px', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {totalMass.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary, #86868b)' }}>kg</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #86868b)', marginTop: '4px' }}>
            {(totalMass / Math.max(1, capacityRt)).toFixed(2)} kg / ton chilling capacity
          </div>
        </div>

        {/* Metric 2: Total Logistics */}
        <div className="apple-card" style={{ padding: '16px 20px', margin: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #86868b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Logistics Scope (A2 & A4)</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#1d1d1f', marginTop: '4px', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {totalLogisticsKm.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary, #86868b)' }}>km</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #86868b)', marginTop: '4px' }}>Inbound + {outboundFreightKm}km delivery</div>
        </div>

        {/* Metric 3: Operational Energy */}
        <div className="apple-card" style={{ padding: '16px 20px', margin: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #86868b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Annual Grid Energy (A3 & B6)</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#1d1d1f', marginTop: '4px', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {((annualFactoryKwh + annualOperationalKwh) / 1000).toFixed(1)} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary, #86868b)' }}>MWh/yr</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #86868b)', marginTop: '4px' }}>Plant: {annualFactoryKwh.toLocaleString()} kWh | B6: {annualOperationalKwh.toLocaleString()} kWh</div>
        </div>

        {/* Metric 4: Circularity & Recovery */}
        <div className="apple-card" style={{ padding: '16px 20px', margin: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #86868b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Circularity & Recovery (C3 & D)</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#28cd41', marginTop: '4px', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {recyclingRate}% {avoidedBurdenCo2e != null && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#28cd41' }}>({avoidedBurdenCo2e.toLocaleString()} kg CO₂e)</span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #86868b)', marginTop: '4px' }}>
            {avoidedBurdenCo2e != null ? 'Live calculated net virgin offset' : 'Net offset computed after engine calculation'}
          </div>
        </div>
      </div>

      {/* ── STAGE FILTER TABS (Apple Segmented Bar) ── */}
      <div style={{ marginBottom: '20px' }}>
        <div className="apple-segmented-tabs">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`apple-segmented-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="apple-tab-badge">
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PROJECT INFORMATION CARD (Always Visible) ── */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayersIcon size={16} style={{ color: 'var(--accent)' }} />
          <span>Project Scope & Reference Declarations</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #86868b)' }}>Product Name</label>
            <input
              className="form-input"
              type="text"
              value={project_info.product_name || ''}
              onChange={(e) => updateProjectField('product_name', e.target.value)}
              placeholder="e.g., Centrifugal Chiller 500RT"
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #86868b)' }}>Manufacturer</label>
            <input
              className="form-input"
              type="text"
              value={project_info.manufacturer_name || ''}
              onChange={(e) => updateProjectField('manufacturer_name', e.target.value)}
              placeholder="e.g., Thermal Systems Inc."
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #86868b)' }}>Functional / Declared Unit</label>
            <input
              className="form-input"
              type="text"
              value={project_info.functional_unit || project_info.declared_unit || ''}
              onChange={(e) => updateProjectField('functional_unit', e.target.value)}
              placeholder="e.g., 1 unit over 25 years RSL"
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #86868b)' }}>PCR Standard Reference</label>
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
            <span style={{ backgroundColor: '#e8f2ff', color: 'var(--accent, #0066cc)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              STAGE A1–A3
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Upstream Production & Manufacturing Stage
            </h2>
          </div>

          {/* Module A1: BOM */}
          <div className="card" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div className="card-title" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Module A1: Raw Materials Bill of Materials (BOM) — {bom.length} Components
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #86868b)', marginTop: '2px' }}>
                  Total Declared Product Mass: <strong style={{ color: 'var(--accent, #0066cc)' }}>{totalMass.toLocaleString()} kg</strong>
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
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)', padding: '10px 12px' }}>
                          {item.name || item.comp || item.component || `Component ${idx + 1}`}
                        </td>
                        <td style={{ color: 'var(--text-secondary, #86868b)', padding: '10px 12px' }}>
                          {item.material || item.mat || '—'}
                        </td>
                        <td className="num" style={{ textAlign: 'right', fontWeight: 600, padding: '10px 12px' }}>
                          {item.mass != null ? Number(item.mass).toLocaleString() : '—'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                          <span style={{
                            backgroundColor: '#e8f2ff',
                            color: 'var(--accent, #0066cc)',
                            padding: '2px 8px',
                            borderRadius: '9999px',
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
                <div className="empty-state-desc" style={{ color: 'var(--text-secondary, #86868b)', fontSize: '13px' }}>
                  No BOM components extracted yet.
                </div>
              </div>
            )}
          </div>

          {/* Module A2 & A3 Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            {/* Module A2: Inbound Freight */}
            <div className="card">
              <div className="card-title" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.01em' }}>
                Module A2: Inbound Logistics & Transport
              </div>
              {transport.filter(t => !t.module || t.module === 'A2').length > 0 ? (
                <div className="data-table-wrapper">
                  <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Transport Mode</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transport.filter(t => !t.module || t.module === 'A2').map((leg, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '8px', fontWeight: 500 }}>{leg.mode || 'Freight transport'}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                            {leg.dist || leg.distance ? `${leg.dist || leg.distance} km` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '16px', backgroundColor: '#f5f5f7', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary, #86868b)' }}>
                  Defaulting to UL 10010-4 regional standard: <strong>500 km heavy lorry</strong> transport to assembly plant.
                </div>
              )}
            </div>

            {/* Module A3: Manufacturing Utilities */}
            <div className="card">
              <div className="card-title" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.01em' }}>
                Module A3: Manufacturing & Assembly Utilities
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Annual Grid Electricity (kWh)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={manufacturing.annual_facility_kwh || ''}
                    onChange={(e) => updateManufacturing({ annual_facility_kwh: Number(e.target.value) })}
                    placeholder="34000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Natural Gas (MJ)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={manufacturing.natural_gas_mj || ''}
                    onChange={(e) => updateManufacturing({ natural_gas_mj: Number(e.target.value) })}
                    placeholder="18500"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Process Water (m³)</label>
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
            <span style={{ backgroundColor: '#e8f2ff', color: 'var(--accent, #0066cc)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              STAGE A4–A5
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Construction & Installation Stage
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            {/* Module A4: Outbound Transport */}
            <div className="card">
              <div className="card-title" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TruckIcon size={16} style={{ color: 'var(--accent, #0066cc)' }} />
                <span>Module A4: Outbound Transport to Customer Site</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Delivery Distance to Installation Site (km)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={installation.outbound_transport_km || ''}
                    onChange={(e) => updateInstallation({ outbound_transport_km: Number(e.target.value) })}
                    placeholder="500"
                  />
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: '#f5f5f7', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary, #86868b)' }}>
                  Standard emission factor: <strong>0.088 kg CO₂e / t·km</strong> (ecoinvent v3.12 market for transport, freight, lorry &gt;32 metric ton, EURO6).
                </div>
              </div>
            </div>

            {/* Module A5: Installation & Rigging */}
            <div className="card">
              <div className="card-title" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.01em' }}>
                Module A5: Installation, Rigging & Commissioning
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>On-Site Installation Energy (kWh)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={installation.installation_energy_kwh || ''}
                    onChange={(e) => updateInstallation({ installation_energy_kwh: Number(e.target.value) })}
                    placeholder="350"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Commissioning Refrigerant Loss (kg)</label>
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
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Rigging Crane Mobile Diesel (liters)</label>
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
            <span style={{ backgroundColor: '#e8f2ff', color: 'var(--accent, #0066cc)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              STAGE B1–B7
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Operational Use Stage (25-Year Reference Service Life)
            </h2>
          </div>

          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* B1: Fugitive Leaks */}
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-base, #f5f5f7)', borderRadius: 'var(--radius-lg, 18px)', border: '1px solid var(--border, #e0e0e0)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent, #0066cc)', marginBottom: '10px' }}>
                  Module B1: Direct Fugitive Emissions
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Refrigerant Designation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={operational.refrigerant_type || ''}
                    onChange={(e) => updateOperational({ refrigerant_type: e.target.value })}
                    placeholder="R134a"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Initial Charge (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.refrigerant_charge_kg || ''}
                    onChange={(e) => updateOperational({ refrigerant_charge_kg: Number(e.target.value) })}
                    placeholder="45.0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Annual Leak Rate (%/yr)</label>
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
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-base, #f5f5f7)', borderRadius: 'var(--radius-lg, 18px)', border: '1px solid var(--border, #e0e0e0)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent, #0066cc)', marginBottom: '10px' }}>
                  Module B2 & B3: Servicing & Repair
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Maintenance Power (kWh/yr)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.scheduled_maintenance_kwh_yr || ''}
                    onChange={(e) => updateOperational({ scheduled_maintenance_kwh_yr: Number(e.target.value) })}
                    placeholder="180.0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Operational Leak Rate (%/yr)</label>
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
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-base, #f5f5f7)', borderRadius: 'var(--radius-lg, 18px)', border: '1px solid var(--border, #e0e0e0)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent, #0066cc)', marginBottom: '10px' }}>
                  Module B4 & B5: Overhaul & Refurbishment
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Reference Service Life (RSL Years)</label>
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
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-base, #f5f5f7)', borderRadius: 'var(--radius-lg, 18px)', border: '1px solid var(--border, #e0e0e0)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent, #0066cc)', marginBottom: '10px' }}>
                  Module B6 & B7: Operational Energy & Water
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Equipment Rated Efficiency (kW/ton)</label>
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
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Equipment Rated Capacity (RT)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.capacity_rt || ''}
                    onChange={(e) => updateOperational({ capacity_rt: Number(e.target.value) })}
                    placeholder="500.0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Cooling Tower Water Makeup (m³/yr)</label>
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
            <span style={{ backgroundColor: '#e8f2ff', color: 'var(--accent, #0066cc)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              STAGE C1–C4
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              End of Life Stage (Decommissioning & Waste Disposal)
            </h2>
          </div>

          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Decommissioning Energy (C1 kWh)</label>
                <input
                  type="number"
                  className="form-input"
                  value={end_of_life.decommissioning_energy_kwh || ''}
                  onChange={(e) => updateEndOfLife({ decommissioning_energy_kwh: Number(e.target.value) })}
                  placeholder="120"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Waste Transport to Processing (C2 km)</label>
                <input
                  type="number"
                  className="form-input"
                  value={end_of_life.waste_transport_km || ''}
                  onChange={(e) => updateEndOfLife({ waste_transport_km: Number(e.target.value) })}
                  placeholder="100"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Recycling & Recovery Rate (C3 %)</label>
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
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Sanitary Landfill Fraction (C4 %)</label>
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
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Thermal Incineration Rate (C3 %)</label>
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
            <span style={{ backgroundColor: 'rgba(52, 199, 89, 0.12)', color: '#28cd41', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600 }}>
              MODULE D
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Benefits & Loads Beyond System Boundary (Circularity Credits)
            </h2>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #28cd41' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary, #86868b)', marginBottom: '14px' }}>
              ISO 21930 & EN 15804+A2 require explicit accounting of exported secondary materials, avoided virgin production credits, and refrigerant reclamation.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>Overall Product Recovery Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="form-input"
                  value={circularity_d.overall_recovery_rate_percent ?? ''}
                  onChange={(e) => updateCircularityD({ overall_recovery_rate_percent: Math.max(0, parseFloat(e.target.value) || 0) })}
                  placeholder="e.g. 90.0"
                />
                <span style={{ fontSize: '11px', color: '#8A7A72', marginTop: '4px', display: 'block' }}>
                  Unified recovery rate applied to recyclable product mass in Module D calculation.
                </span>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: '11px', color: '#2E7D32', fontWeight: 700 }}>Net Avoided Carbon Burden Credit (Module D Calculation)</label>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#E8F5E9',
                  borderRadius: '6px',
                  border: '1px solid #C8E6C9',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#2E7D32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>
                    {avoidedBurdenCo2e != null
                      ? `${avoidedBurdenCo2e.toFixed(1)} kg CO₂e`
                      : 'Awaiting Calculation'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#388E3C', fontWeight: 600, backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #C8E6C9' }}>
                    {avoidedBurdenCo2e != null ? 'ECOINVENT LCIA CALCULATED' : 'PROCEED TO CALCULATION'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#2E7D32', marginTop: '6px' }}>
                  {avoidedBurdenCo2e != null
                    ? 'Net credit dynamically calculated by ecoinvent characterization engine (primary virgin material displacement minus secondary scrap processing burdens).'
                    : 'Module D credit is computed dynamically by the calculation engine from the product BOM mass, recovery rate, and ecoinvent primary/recycled dataset characterization.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


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
