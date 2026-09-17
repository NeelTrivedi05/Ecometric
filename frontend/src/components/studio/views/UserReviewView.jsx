import React, { useState } from 'react';
import { useStudio, STANDARD_DATABASE_PROVIDERS } from '../../../context/StudioContext';
import {
  EditIcon,
  DatabaseIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  ChevronRightIcon,
  SearchIcon,
  CloseIcon,
  AlertTriangleIcon,
  TruckIcon,
  LayersIcon,
  LeafIcon,
} from '../Icons';

export default function UserReviewView() {
  const {
    extractedData,
    updateBomItem,
    addBomItem,
    deleteBomItem,
    updateTransportLeg,
    addTransportLeg,
    deleteTransportLeg,
    updateManufacturing,
    updateInstallation,
    updateOperational,
    updateEndOfLife,
    updateCircularityD,
    setActivePhase,
    showNotif,
  } = useStudio();

  const bom = extractedData.bom || [];
  const transport = extractedData.transport || [];
  const manufacturing = extractedData.manufacturing || {};
  const installation = extractedData.installation || {};
  const operational = extractedData.operational || {};
  const end_of_life = extractedData.end_of_life || {};
  const circularity_d = extractedData.circularity_d || {};
  const project_info = extractedData.project_info || {};

  // Stage filter tab state
  const [activeStageTab, setActiveStageTab] = useState('all'); // 'all' | 'a1_a3' | 'a4_a5' | 'b1_b7' | 'c1_c4' | 'd'

  // Provider modal / popover state
  const [providerModalItemIndex, setProviderModalItemIndex] = useState(null);
  const [providerSearchQuery, setProviderSearchQuery] = useState('');
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState([]);

  // New component modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newComp, setNewComp] = useState({
    name: '',
    material: 'Steel',
    mass: 100,
    module: 'A1',
    supplier: '',
    dataset: 'Steel, low-alloyed, hot rolled [GLO]',
    ecoinvent_id: 'ecoinvent_steel_hot_rolled_glo',
  });

  // Calculate live total mass
  const totalMass = bom.reduce((sum, item) => sum + (Number(item.mass) || 0), 0);

  // Handle provider search
  const handleSearchProviders = async (q) => {
    setProviderSearchQuery(q);
    if (!q.trim()) {
      setLiveSearchResults([]);
      return;
    }
    setIsSearchingDb(true);
    try {
      const res = await fetch(`/api/documents/lcia-search?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.status === 'success' && data.results) {
        setLiveSearchResults(data.results);
      }
    } catch {
      // Offline fallback
      setLiveSearchResults([]);
    } finally {
      setIsSearchingDb(false);
    }
  };

  const handleSelectProvider = (targetIdx, provider) => {
    updateBomItem(targetIdx, {
      ecoinvent_id: provider.id || provider.row_index,
      dataset: provider.name || provider.activity_name,
      material: provider.name || provider.reference_product_name,
    });
    setProviderModalItemIndex(null);
    setProviderSearchQuery('');
    setLiveSearchResults([]);
    showNotif?.(`Updated dataset provider to "${provider.name || provider.activity_name}"`, 'Provider Updated');
  };

  const handleCreateComponent = (e) => {
    e.preventDefault();
    if (!newComp.name.trim()) return;
    addBomItem(newComp);
    setNewComp({
      name: '',
      material: 'Steel',
      mass: 100,
      module: 'A1',
      supplier: '',
      dataset: 'Steel, low-alloyed, hot rolled [GLO]',
      ecoinvent_id: 'ecoinvent_steel_hot_rolled_glo',
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="view-content-wrapper" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: '#FFF8F2',
        border: '1px solid #F5DEC8',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(184,83,29,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                backgroundColor: '#C25A23',
                color: '#FFF',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Phase 3: Interactive Workbench
              </span>
              <span style={{ fontSize: '13px', color: '#9C5832', fontWeight: 600 }}>
                Editable User Review & Provider Selection
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#2C221E', margin: '0 0 6px 0' }}>
              Verify & Refine Extracted Engineering Data
            </h1>
            <p style={{ fontSize: '13px', color: '#5C4E46', margin: 0, maxWidth: '820px', lineHeight: 1.5 }}>
              If any extracted values, weights, material classifications, or transport distances require corrections, you can edit them directly below. You can also pick or change the exact <strong>ecoinvent database activity / dataset provider</strong> for each material.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
          >
            <PlusIcon size={15} />
            <span>Add Component</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #C25A23' }}>
          <div style={{ fontSize: '11px', color: '#8A7A72', fontWeight: 600, textTransform: 'uppercase' }}>Declared Product Mass</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#2C221E', marginTop: '4px' }}>
            {totalMass.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 500 }}>kg</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8A7A72', marginTop: '2px' }}>Sum of {bom.length} declared components</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #2B6E4F' }}>
          <div style={{ fontSize: '11px', color: '#8A7A72', fontWeight: 600, textTransform: 'uppercase' }}>Database Providers Mapped</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#2B6E4F', marginTop: '4px' }}>
            {bom.filter(b => b.ecoinvent_id || b.dataset).length} / {bom.length}
          </div>
          <div style={{ fontSize: '11px', color: '#8A7A72', marginTop: '2px' }}>ecoinvent v3.12 Cutoff linked</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #D9822B' }}>
          <div style={{ fontSize: '11px', color: '#8A7A72', fontWeight: 600, textTransform: 'uppercase' }}>Inbound Freight Legs</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#2C221E', marginTop: '4px' }}>
            {transport.length || 1} <span style={{ fontSize: '13px', fontWeight: 500 }}>leg(s)</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8A7A72', marginTop: '2px' }}>Module A2 transport routes</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #5C4E46' }}>
          <div style={{ fontSize: '11px', color: '#8A7A72', fontWeight: 600, textTransform: 'uppercase' }}>Plant Utility Power</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#2C221E', marginTop: '4px' }}>
            {manufacturing.annual_facility_kwh ? Number(manufacturing.annual_facility_kwh).toLocaleString() : '34,000'} <span style={{ fontSize: '13px', fontWeight: 500 }}>kWh/yr</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8A7A72', marginTop: '2px' }}>Module A3 factory electricity</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #2E7D32' }}>
          <div style={{ fontSize: '11px', color: '#8A7A72', fontWeight: 600, textTransform: 'uppercase' }}>Circularity & Avoided Burden</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#2E7D32', marginTop: '4px' }}>
            {end_of_life.recycling_rate_percent || 92.4}%
          </div>
          <div style={{ fontSize: '11px', color: '#2E7D32', marginTop: '2px' }}>{circularity_d.net_avoided_burden_gwp_kg || -3210} kg CO₂e offset</div>
        </div>
      </div>

      {/* Stage Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '6px',
        marginBottom: '20px',
        borderBottom: '1px solid #EED8C5'
      }}>
        {[
          { id: 'all', label: 'All Modules (A1–D)', badge: 'Full Scope' },
          { id: 'a1_a3', label: 'A1–A3 Production', badge: 'BOM, Freight & Plant' },
          { id: 'a4_a5', label: 'A4–A5 Construction', badge: 'Outbound & Rigging' },
          { id: 'b1_b7', label: 'B1–B7 Operational', badge: 'Use Stage' },
          { id: 'c1_c4', label: 'C1–C4 End of Life', badge: 'Decommissioning' },
          { id: 'd', label: 'Module D Circularity', badge: 'Net Credits' },
        ].map(tab => {
          const isActive = activeStageTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveStageTab(tab.id)}
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

      {/* ── SECTION 1: EDITABLE BILL OF MATERIALS (BOM) & PROVIDER MAPPING (A1) ── */}
      {(activeStageTab === 'all' || activeStageTab === 'a1_a3') && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#2C221E', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DatabaseIcon size={18} style={{ color: '#C25A23' }} />
              <span>Bill of Materials (BOM) & Database Activity Provider Selection</span>
            </h2>
            <div style={{ fontSize: '12px', color: '#7A6B63', marginTop: '3px' }}>
              Click any field to edit directly. Click <strong>"Select Provider"</strong> to map the exact ecoinvent database activity/dataset.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <PlusIcon size={14} />
            <span>Add Row</span>
          </button>
        </div>

        {bom.length > 0 ? (
          <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', width: '22%' }}>Component Name</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', width: '15%' }}>Extracted Keyword</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', width: '32%' }}>Database Provider (ecoinvent Match)</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', width: '11%' }}>Mass (kg)</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', width: '8%' }}>Module</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', width: '12%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bom.map((item, idx) => (
                  <tr key={item.id || idx}>
                    {/* Component Name */}
                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => updateBomItem(idx, { name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #E2D9D2',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#2C221E',
                          backgroundColor: '#FFF'
                        }}
                      />
                    </td>

                    {/* Material Key */}
                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="text"
                        value={item.material || ''}
                        onChange={(e) => updateBomItem(idx, { material: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #E2D9D2',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#5C4E46',
                          backgroundColor: '#FFF'
                        }}
                      />
                    </td>

                    {/* Database Provider (ecoinvent match) */}
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#2C221E',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.dataset || item.name || 'Select Database Provider'}
                          </div>
                          <div style={{ fontSize: '10px', color: '#8A7A72' }}>
                            ID: <code style={{ backgroundColor: '#FAF0E6', padding: '1px 4px', borderRadius: '3px', color: '#9C5832' }}>
                              {item.ecoinvent_id || 'ecoinvent_proxy'}
                            </code>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProviderModalItemIndex(idx);
                            setProviderSearchQuery(item.material || item.name || '');
                            handleSearchProviders(item.material || item.name || '');
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#FAF0E6',
                            color: '#9C5832',
                            border: '1px solid #EED8C5',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0
                          }}
                          title="Click to choose a different provider from ecoinvent database"
                        >
                          <DatabaseIcon size={12} />
                          <span>Select Provider</span>
                        </button>
                      </div>
                    </td>

                    {/* Mass (kg) */}
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <input
                        type="number"
                        step="any"
                        value={item.mass != null ? item.mass : ''}
                        onChange={(e) => updateBomItem(idx, { mass: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: '90px',
                          textAlign: 'right',
                          padding: '6px 8px',
                          border: '1px solid #E2D9D2',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#2C221E',
                          backgroundColor: '#FFF'
                        }}
                      />
                    </td>

                    {/* Module */}
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <select
                        value={item.module || 'A1'}
                        onChange={(e) => updateBomItem(idx, { module: e.target.value })}
                        style={{
                          padding: '5px 8px',
                          border: '1px solid #E2D9D2',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#FAF0E6',
                          color: '#9C5832'
                        }}
                      >
                        <option value="A1">A1 (Raw)</option>
                        <option value="A2">A2 (Transport)</option>
                        <option value="A3">A3 (Mfg)</option>
                        <option value="B1">B1 (Use)</option>
                        <option value="C1">C1 (EoL)</option>
                      </select>
                    </td>

                    {/* Delete Action */}
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => deleteBomItem(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#C25A23',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          borderRadius: '4px'
                        }}
                        title="Delete component row"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#FCFAF8', borderRadius: '8px' }}>
            <AlertTriangleIcon size={24} style={{ color: '#D9822B', marginBottom: '8px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#2C221E' }}>No BOM Components Available</div>
            <p style={{ fontSize: '12px', color: '#7A6B63', margin: '4px 0 16px 0' }}>
              Upload engineering documents or click below to manually add components.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              + Add First Component
            </button>
          </div>
        )}
      </div>
      )}

      {/* ── SECTION 2 & 3: MODULE A2 (INBOUND FREIGHT) & MODULE A3 (MANUFACTURING UTILITIES) ── */}
      {(activeStageTab === 'all' || activeStageTab === 'a1_a3') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#FAF0E6', color: '#9C5832', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              MODULE A2 & A3
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
              Inbound Transport & Assembly Plant Utilities
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Logistics & Inbound Transport */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#2C221E', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TruckIcon size={15} style={{ color: '#C25A23' }} />
                  <span>Module A2: Inbound Logistics Legs</span>
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => addTransportLeg({ mode: 'Heavy lorry >32t EURO 6', distance: 350 })}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  + Add Leg
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {transport.length > 0 ? (
                  transport.map((leg, lIdx) => (
                    <div key={lIdx} style={{
                      padding: '10px 12px',
                      backgroundColor: '#FCFAF8',
                      borderRadius: '6px',
                      border: '1px solid #EED8C5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <input
                        type="text"
                        value={leg.mode || 'Freight transport'}
                        onChange={(e) => updateTransportLeg(lIdx, { mode: e.target.value })}
                        style={{ flex: 1, padding: '4px 6px', fontSize: '12px', border: '1px solid #E2D9D2', borderRadius: '4px' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={leg.dist || leg.distance || 0}
                          onChange={(e) => updateTransportLeg(lIdx, { dist: parseFloat(e.target.value) || 0, distance: parseFloat(e.target.value) || 0 })}
                          style={{ width: '75px', textAlign: 'right', padding: '4px 6px', fontSize: '12px', border: '1px solid #E2D9D2', borderRadius: '4px', fontWeight: 600 }}
                        />
                        <span style={{ fontSize: '11px', color: '#7A6B63' }}>km</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteTransportLeg(lIdx)}
                        style={{ background: 'none', border: 'none', color: '#C25A23', cursor: 'pointer', padding: '2px' }}
                        title="Remove leg"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '12px', backgroundColor: '#FCFAF8', borderRadius: '6px', fontSize: '12px', color: '#7A6B63' }}>
                    Defaulting to UL 10010-4 regional standard: <strong>500 km heavy lorry</strong> to plant gate.
                  </div>
                )}
              </div>
            </div>

            {/* Manufacturing Energy & Utilities */}
            <div className="card">
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#2C221E', margin: '0 0 12px 0' }}>
                Module A3: Factory Utilities & Consumables
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Annual Electricity (kWh)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={manufacturing.annual_facility_kwh || ''}
                    onChange={(e) => updateManufacturing({ annual_facility_kwh: parseFloat(e.target.value) || 0 })}
                    placeholder="34000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Natural Gas (MJ)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={manufacturing.natural_gas_mj || ''}
                    onChange={(e) => updateManufacturing({ natural_gas_mj: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => updateManufacturing({ water_m3: parseFloat(e.target.value) || 0 })}
                    placeholder="45.0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 4: MODULE A4–A5 (LOGISTICS TO SITE & INSTALLATION RIGGING) ── */}
      {(activeStageTab === 'all' || activeStageTab === 'a4_a5') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#FAF0E6', color: '#9C5832', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              MODULE A4 & A5
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
              Outbound Logistics & On-Site Installation / Rigging
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Module A4 */}
            <div className="card">
              <div className="card-title" style={{ fontSize: '13px', fontWeight: 700, color: '#2C221E', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TruckIcon size={15} style={{ color: '#C25A23' }} />
                <span>Module A4: Delivery to Installation Site</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Transit Distance to Site (km)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={installation.outbound_transport_km || ''}
                    onChange={(e) => updateInstallation({ outbound_transport_km: parseFloat(e.target.value) || 0 })}
                    placeholder="500"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Delivery Fleet Mode</label>
                  <input
                    type="text"
                    className="form-input"
                    value={installation.transport_mode || ''}
                    onChange={(e) => updateInstallation({ transport_mode: e.target.value })}
                    placeholder="Heavy Lorry >32t (EURO 6)"
                  />
                </div>
              </div>
            </div>

            {/* Module A5 */}
            <div className="card">
              <div className="card-title" style={{ fontSize: '13px', fontWeight: 700, color: '#2C221E', marginBottom: '12px' }}>
                Module A5: Rigging & Commissioning
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Installation Power (kWh)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={installation.installation_energy_kwh || ''}
                    onChange={(e) => updateInstallation({ installation_energy_kwh: parseFloat(e.target.value) || 0 })}
                    placeholder="350"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Commissioning Loss (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={installation.commissioning_refrigerant_loss_kg || ''}
                    onChange={(e) => updateInstallation({ commissioning_refrigerant_loss_kg: parseFloat(e.target.value) || 0 })}
                    placeholder="0.5"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Crane Rigging Diesel (liters)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={installation.rigging_crane_diesel_liters || ''}
                    onChange={(e) => updateInstallation({ rigging_crane_diesel_liters: parseFloat(e.target.value) || 0 })}
                    placeholder="25.0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 5: MODULE B1–B7 (OPERATIONAL USE STAGE) ── */}
      {(activeStageTab === 'all' || activeStageTab === 'b1_b7') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#FAF0E6', color: '#9C5832', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              MODULE B1–B7
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
              Operational Use Stage (Fugitive Leaks, Energy, Water & Overhaul)
            </h3>
          </div>

          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
              {/* B1: Fugitive Leaks */}
              <div style={{ padding: '12px', backgroundColor: '#FCFAF8', borderRadius: '8px', border: '1px solid #EED8C5' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#C25A23', marginBottom: '8px' }}>
                  B1: Fugitive Refrigerant
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Refrigerant Type</label>
                  <select
                    value={operational.refrigerant_type || 'R134a'}
                    onChange={(e) => updateOperational({ refrigerant_type: e.target.value })}
                    style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #E2D9D2', borderRadius: '4px' }}
                  >
                    <option value="R134a">R134a (GWP 1430)</option>
                    <option value="R1234ze">R1234ze (GWP 1.37)</option>
                    <option value="R513A">R513A (GWP 631)</option>
                    <option value="R1233zd">R1233zd (GWP 1)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Charge (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.refrigerant_charge_kg || ''}
                    onChange={(e) => updateOperational({ refrigerant_charge_kg: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => updateOperational({ annual_leak_rate_percent: parseFloat(e.target.value) || 0 })}
                    placeholder="2.0"
                  />
                </div>
              </div>

              {/* B2 & B3: Servicing */}
              <div style={{ padding: '12px', backgroundColor: '#FCFAF8', borderRadius: '8px', border: '1px solid #EED8C5' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#C25A23', marginBottom: '8px' }}>
                  B2 & B3: Maintenance & Repair
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Maintenance Power (kWh/yr)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.scheduled_maintenance_kwh_yr || ''}
                    onChange={(e) => updateOperational({ scheduled_maintenance_kwh_yr: parseFloat(e.target.value) || 0 })}
                    placeholder="180.0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Fugitive Operational Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={operational.fugitive_operational_leak_rate || ''}
                    onChange={(e) => updateOperational({ fugitive_operational_leak_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="0.5"
                  />
                </div>
              </div>

              {/* B4 & B5: Replacement & RSL */}
              <div style={{ padding: '12px', backgroundColor: '#FCFAF8', borderRadius: '8px', border: '1px solid #EED8C5' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#C25A23', marginBottom: '8px' }}>
                  B4 & B5: Replacement & RSL
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Major Overhaul (Year)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.major_component_replacement_year || ''}
                    onChange={(e) => updateOperational({ major_component_replacement_year: parseInt(e.target.value, 10) || 15 })}
                    placeholder="15"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Reference Service Life (Yrs)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={project_info.lifespan_years || ''}
                    onChange={(e) => updateOperational({ lifespan_years: parseInt(e.target.value, 10) || 25 })}
                    placeholder="25"
                  />
                </div>
              </div>

              {/* B6 & B7: Power & Water */}
              <div style={{ padding: '12px', backgroundColor: '#FCFAF8', borderRadius: '8px', border: '1px solid #EED8C5' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#C25A23', marginBottom: '8px' }}>
                  B6 & B7: Energy & Water
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Rated Efficiency (kW/ton)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={operational.efficiency_kw_per_ton || ''}
                    onChange={(e) => updateOperational({ efficiency_kw_per_ton: parseFloat(e.target.value) || 0 })}
                    placeholder="0.54"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Capacity (RT)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.capacity_rt || ''}
                    onChange={(e) => updateOperational({ capacity_rt: parseFloat(e.target.value) || 0 })}
                    placeholder="500.0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Cooling Tower Water (m³/yr)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.cooling_tower_water_m3_yr || ''}
                    onChange={(e) => updateOperational({ cooling_tower_water_m3_yr: parseFloat(e.target.value) || 0 })}
                    placeholder="120.0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 6: MODULE C1–C4 (END OF LIFE STAGE) ── */}
      {(activeStageTab === 'all' || activeStageTab === 'c1_c4') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#FAF0E6', color: '#9C5832', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              MODULE C1–C4
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
              End of Life Decommissioning, Waste Transport & Disposal
            </h3>
          </div>

          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Deconstruction Power (C1 kWh)</label>
                <input
                  type="number"
                  className="form-input"
                  value={end_of_life.decommissioning_energy_kwh || ''}
                  onChange={(e) => updateEndOfLife({ decommissioning_energy_kwh: parseFloat(e.target.value) || 0 })}
                  placeholder="120"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Waste Transit Distance (C2 km)</label>
                <input
                  type="number"
                  className="form-input"
                  value={end_of_life.waste_transport_km || ''}
                  onChange={(e) => updateEndOfLife({ waste_transport_km: parseFloat(e.target.value) || 0 })}
                  placeholder="100"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Metal Recycling Rate (C3 %)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={end_of_life.recycling_rate_percent || ''}
                  onChange={(e) => updateEndOfLife({ recycling_rate_percent: parseFloat(e.target.value) || 0 })}
                  placeholder="92.4"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Sanitary Landfill (C4 %)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={end_of_life.landfill_rate_percent || ''}
                  onChange={(e) => updateEndOfLife({ landfill_rate_percent: parseFloat(e.target.value) || 0 })}
                  placeholder="4.5"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Thermal Incineration (C4 %)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={end_of_life.incineration_rate_percent || ''}
                  onChange={(e) => updateEndOfLife({ incineration_rate_percent: parseFloat(e.target.value) || 0 })}
                  placeholder="3.1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 7: MODULE D (CIRCULARITY & NET AVOIDED BURDENS) ── */}
      {(activeStageTab === 'all' || activeStageTab === 'd') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              MODULE D
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
              Circularity & Loads Beyond System Boundary (Net Avoided Burdens)
            </h3>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #2E7D32' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Steel Scrap Recovery (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={circularity_d.steel_scrap_recovery_rate || ''}
                  onChange={(e) => updateCircularityD({ steel_scrap_recovery_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="95.0"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Copper Scrap Recovery (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={circularity_d.copper_scrap_recovery_rate || ''}
                  onChange={(e) => updateCircularityD({ copper_scrap_recovery_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="96.0"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Aluminium Recovery (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={circularity_d.aluminium_recovery_rate || ''}
                  onChange={(e) => updateCircularityD({ aluminium_recovery_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="90.0"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Refrigerant Reclaim (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={circularity_d.refrigerant_reclamation_rate || ''}
                  onChange={(e) => updateCircularityD({ refrigerant_reclamation_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="92.0"
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: '11px', color: '#5C4E46' }}>Net Avoided Carbon Burden Credit (kg CO₂e)</label>
                <input
                  type="number"
                  className="form-input"
                  value={circularity_d.net_avoided_burden_gwp_kg || ''}
                  onChange={(e) => updateCircularityD({ net_avoided_burden_gwp_kg: parseFloat(e.target.value) || 0 })}
                  placeholder="-3210.0"
                />
                <div style={{ fontSize: '11px', color: '#2E7D32', marginTop: '4px' }}>
                  Negative value offsets virgin raw material extraction per EN 15804+A2 & ISO 21930.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTION FOOTER ── */}
      <div style={{
        marginTop: '28px',
        paddingTop: '20px',
        borderTop: '1px solid #EED8C5',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <button
          type="button"
          className="btn btn-secondary btn-lg"
          onClick={() => setActivePhase('extract')}
        >
          Back to Extracted Data
        </button>

        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => {
            showNotif?.('Data changes confirmed. Proceeding to PCR & GPI rules validation.', 'Review Confirmed');
            setActivePhase('validate');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>Confirm Edits & Validate Rules (PCR & GPI)</span>
          <ChevronRightIcon size={16} />
        </button>
      </div>

      {/* ── MODAL: SELECT DATABASE ACTIVITY PROVIDER ── */}
      {providerModalItemIndex !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(44,34,30,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #EED8C5'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #EED8C5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FFF8F2'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2C221E', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DatabaseIcon size={18} style={{ color: '#C25A23' }} />
                  <span>Select ecoinvent Database Provider</span>
                </h3>
                <div style={{ fontSize: '12px', color: '#7A6B63', marginTop: '2px' }}>
                  Component: <strong>{bom[providerModalItemIndex]?.name || 'Component'}</strong> (Extracted Keyword: "{bom[providerModalItemIndex]?.material}")
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProviderModalItemIndex(null)}
                style={{ background: 'none', border: 'none', color: '#7A6B63', cursor: 'pointer' }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #EED8C5', backgroundColor: '#FCFAF8' }}>
              <div style={{ position: 'relative' }}>
                <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#7A6B63' }} />
                <input
                  type="text"
                  placeholder="Search ecoinvent activities (e.g., steel, stainless, copper, aluminium, motor)..."
                  value={providerSearchQuery}
                  onChange={(e) => handleSearchProviders(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    border: '1px solid #E2D9D2',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Provider List */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              {/* If search returns results from backend */}
              {liveSearchResults.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9C5832', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Live ecoinvent Search Results ({liveSearchResults.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {liveSearchResults.map((res, rIdx) => (
                      <div
                        key={rIdx}
                        onClick={() => handleSelectProvider(providerModalItemIndex, {
                          id: `ecoinvent_row_${res.row_index}`,
                          name: `${res.activity_name} [${res.geography}]`,
                          reference_product_name: res.reference_product_name,
                        })}
                        style={{
                          padding: '10px 12px',
                          border: '1px solid #EED8C5',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: '#FFF',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFF8F2'; e.currentTarget.style.borderColor = '#C25A23'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFF'; e.currentTarget.style.borderColor = '#EED8C5'; }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C221E' }}>{res.activity_name}</div>
                          <div style={{ fontSize: '11px', color: '#7A6B63' }}>Product: {res.reference_product_name}</div>
                        </div>
                        <span style={{
                          backgroundColor: '#FAF0E6',
                          color: '#9C5832',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {res.geography}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Standard Curated Database Providers */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9C5832', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Standard Core ecoinvent v3.12 Industrial Providers
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {STANDARD_DATABASE_PROVIDERS
                    .filter(p => !providerSearchQuery || p.name.toLowerCase().includes(providerSearchQuery.toLowerCase()) || p.category.toLowerCase().includes(providerSearchQuery.toLowerCase()))
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProvider(providerModalItemIndex, p)}
                        style={{
                          padding: '10px 12px',
                          border: '1px solid #EED8C5',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: '#FFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFF8F2'; e.currentTarget.style.borderColor = '#C25A23'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFF'; e.currentTarget.style.borderColor = '#EED8C5'; }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C221E' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#7A6B63' }}>{p.category} • Default Factor: {p.defaultEf} kg CO₂e/{p.unit}</div>
                        </div>
                        <span style={{
                          backgroundColor: '#FAF0E6',
                          color: '#9C5832',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {p.geography}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #EED8C5', backgroundColor: '#FCFAF8', textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setProviderModalItemIndex(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD CUSTOM COMPONENT ── */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(44,34,30,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <form
            onSubmit={handleCreateComponent}
            style={{
              backgroundColor: '#FFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '520px',
              overflow: 'hidden',
              border: '1px solid #EED8C5',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EED8C5', backgroundColor: '#FFF8F2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2C221E', margin: 0 }}>Add Custom Component to BOM</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A6B63' }}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5C4E46', marginBottom: '4px' }}>Component Name</label>
                <input
                  type="text"
                  placeholder="e.g. Copper Cooling Coil or Control Board"
                  value={newComp.name}
                  onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2D9D2', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5C4E46', marginBottom: '4px' }}>Material Keyword</label>
                  <input
                    type="text"
                    placeholder="e.g. Copper, Steel, Aluminum"
                    value={newComp.material}
                    onChange={(e) => setNewComp({ ...newComp, material: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2D9D2', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5C4E46', marginBottom: '4px' }}>Mass (kg)</label>
                  <input
                    type="number"
                    step="any"
                    value={newComp.mass}
                    onChange={(e) => setNewComp({ ...newComp, mass: parseFloat(e.target.value) || 0 })}
                    required
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2D9D2', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5C4E46', marginBottom: '4px' }}>Initial Database Provider</label>
                <select
                  value={newComp.ecoinvent_id}
                  onChange={(e) => {
                    const selected = STANDARD_DATABASE_PROVIDERS.find(p => p.id === e.target.value);
                    if (selected) {
                      setNewComp({
                        ...newComp,
                        ecoinvent_id: selected.id,
                        dataset: `${selected.name} [${selected.geography}]`,
                        material: selected.name,
                      });
                    }
                  }}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2D9D2', borderRadius: '6px', fontSize: '12px' }}
                >
                  {STANDARD_DATABASE_PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name} [{p.geography}]</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5C4E46', marginBottom: '4px' }}>Life Cycle Module</label>
                  <select
                    value={newComp.module}
                    onChange={(e) => setNewComp({ ...newComp, module: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2D9D2', borderRadius: '6px', fontSize: '12px' }}
                  >
                    <option value="A1">Module A1: Raw Materials</option>
                    <option value="A2">Module A2: Transport</option>
                    <option value="A3">Module A3: Manufacturing</option>
                    <option value="B1">Module B: Use Stage</option>
                    <option value="C1">Module C: End of Life</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5C4E46', marginBottom: '4px' }}>Supplier / Origin</label>
                  <input
                    type="text"
                    placeholder="e.g. Tier-1 OEM"
                    value={newComp.supplier}
                    onChange={(e) => setNewComp({ ...newComp, supplier: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2D9D2', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #EED8C5', backgroundColor: '#FCFAF8', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Add Component</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
