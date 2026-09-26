import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCwIcon,
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
    updateMaintenanceB2,
    updateRepairB3,
    updateReplacementB4,
    updateRefurbishmentB5,
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
  const maintenance_b2 = extractedData.maintenance_b2 || {};
  const repair_b3 = extractedData.repair_b3 || {};
  const replacement_b4 = extractedData.replacement_b4 || {};
  const refurbishment_b5 = extractedData.refurbishment_b5 || {};
  const project_info = extractedData.project_info || {};

  const STANDARD_DATABASE_PROVIDERS_MAP = {
    ecoinvent_steel_hot_rolled_glo: { activity_name: 'steel production, low-alloyed, hot rolled', geography: 'GLO', reference_unit: 'kg' },
    ecoinvent_copper_tube_wire_glo: { activity_name: 'wire drawing, copper', geography: 'GLO', reference_unit: 'kg' },
    ecoinvent_electric_motor_industrial_glo: { activity_name: 'electric motor production, vehicle auxiliary engine', geography: 'GLO', reference_unit: 'unit' },
    ecoinvent_insulation_pu_rigid_rer: { activity_name: 'polyurethane foam production, rigid', geography: 'RER', reference_unit: 'kg' },
    ecoinvent_electronics_vfd_glo: { activity_name: 'inverter production, for electric drive', geography: 'GLO', reference_unit: 'unit' },
    ecoinvent_transport_lorry_32t_rer: { activity_name: 'transport, freight, lorry >32 metric ton, EURO 6', geography: 'RER', reference_unit: 'tkm' },
    ecoinvent_transport_container_ship_glo: { activity_name: 'transport, freight, sea, container ship', geography: 'GLO', reference_unit: 'tkm' },
    ecoinvent_transport_freight_train_rer: { activity_name: 'transport, freight train', geography: 'RER', reference_unit: 'tkm' },
    ecoinvent_elec_mv_us: { activity_name: 'market for electricity, medium voltage', geography: 'US', reference_unit: 'kWh' },
    ecoinvent_elec_tx: { activity_name: 'market for electricity, medium voltage [US-TRE]', geography: 'US-TRE', reference_unit: 'kWh' },
    ecoinvent_elec_de: { activity_name: 'market for electricity, medium voltage [DE]', geography: 'DE', reference_unit: 'kWh' },
    ecoinvent_elec_ae: { activity_name: 'market for electricity, medium voltage [AE]', geography: 'AE', reference_unit: 'kWh' },
    ecoinvent_gas_burned_boiler_glo: { activity_name: 'heat production, natural gas, at boiler industrial >100kW', geography: 'GLO', reference_unit: 'MJ' },
    ecoinvent_water_deionised_glo: { activity_name: 'deionised water production', geography: 'GLO', reference_unit: 'm3' },
    ecoinvent_diesel_burned_building_machine_glo: { activity_name: 'diesel, burned in building machine', geography: 'GLO', reference_unit: 'MJ' },
    ecoinvent_lubricating_oil_glo: { activity_name: 'lubricating oil production', geography: 'GLO', reference_unit: 'kg' },
    ecoinvent_diesel_dismantling_glo: { activity_name: 'diesel, burned in building machine for dismantling', geography: 'GLO', reference_unit: 'MJ' },
    ecoinvent_waste_metal_recycling_glo: { activity_name: 'treatment of scrap steel, sorting and pressing', geography: 'GLO', reference_unit: 'kg' },
    ecoinvent_waste_incineration_glo: { activity_name: 'treatment of municipal solid waste, incineration', geography: 'GLO', reference_unit: 'kg' },
    ecoinvent_waste_landfill_glo: { activity_name: 'treatment of inert waste, sanitary landfill', geography: 'GLO', reference_unit: 'kg' },
    ecoinvent_virgin_steel_primary_glo: { activity_name: 'steel production, converter, unalloyed', geography: 'GLO', reference_unit: 'kg' },
    ecoinvent_secondary_steel_electric_glo: { activity_name: 'steel production, electric, unalloyed', geography: 'GLO', reference_unit: 'kg' },
  };

  const getRefUnitForPid = (pid) => {
    const p = String(pid || '').toLowerCase();
    if (p.includes('elec') || p.includes('kwh')) return 'kWh';
    if (p.includes('transport') || p.includes('lorry') || p.includes('ship') || p.includes('train') || p.includes('tkm')) return 'tkm';
    if (p.includes('water') || p.includes('m3')) return 'm3';
    if (p.includes('gas') || p.includes('heat') || p.includes('boiler') || p.includes('diesel') || p.includes('mj')) return 'MJ';
    if (p.includes('motor') || p.includes('inverter') || p.includes('electronics') || p.includes('vfd')) return 'unit';
    return 'kg';
  };

  const getProviderInfo = (val) => {
    if (!val) return { name: 'No provider selected', geography: '', id: '', unit: 'kg' };
    const dbInfo = moduleProviderInfo[val];
    if (dbInfo) {
      return {
        name: dbInfo.activity_name || dbInfo.name || val,
        geography: dbInfo.geography || 'GLO',
        id: val,
        unit: dbInfo.reference_unit || dbInfo.unit || getRefUnitForPid(val),
      };
    }
    const std = STANDARD_DATABASE_PROVIDERS_MAP[val];
    if (std) {
      return {
        name: std.activity_name,
        geography: std.geography,
        id: val,
        unit: std.reference_unit,
      };
    }
    return {
      name: val.replace(/^ecoinvent_/, '').replace(/_/g, ' '),
      geography: 'GLO',
      id: val,
      unit: getRefUnitForPid(val),
    };
  };

  // Reusable provider dataset selector helper - opens ecoinvent database search modal
  const renderProviderSelector = (label, value, onChange, categoryFilter) => {
    const info = getProviderInfo(value);
    const searchHint = categoryFilter || (label || '').replace(/Provider|Emission Factor|Dataset|Process/gi, '').trim();

    return (
      <div className="form-group" style={{ marginTop: '6px', minWidth: 0 }}>
        <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>
          {label || 'Emission Factor Provider / Dataset'}
        </label>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '8px 10px',
          border: '1px solid #d2d2d7',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{ minWidth: 0, width: '100%' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: '1.3',
            }} title={info.name}>
              {info.name}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary, #86868b)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap', minWidth: 0 }}>
              <span>ID:</span>
              <code style={{ backgroundColor: 'rgba(0,0,0,0.04)', padding: '1px 6px', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '9px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-block', whiteSpace: 'nowrap', verticalAlign: 'middle', border: '1px solid #e5e5ea' }}>
                {info.id || 'ecoinvent_proxy'}
              </code>
              {info.geography && (
                <span style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)', color: '#34c759', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, fontSize: '9px', flexShrink: 0 }}>
                  {info.geography}
                </span>
              )}
              <span style={{ backgroundColor: 'rgba(0, 102, 204, 0.08)', color: 'var(--accent, #0066cc)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, fontSize: '9px', flexShrink: 0 }} title="Read-only reference unit">
                Ref Unit: {info.unit}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setGenericProviderModal({ label, currentValue: value, onSelect: onChange, searchHint });
              handleGenericImmediateSearch(searchHint);
            }}
            style={{
              padding: '4px 12px',
              backgroundColor: 'rgba(0, 102, 204, 0.08)',
              color: 'var(--accent, #0066cc)',
              border: '1px solid rgba(0, 102, 204, 0.2)',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              alignSelf: 'flex-start',
              transition: 'all 0.15s ease'
            }}
            title="Click to choose a provider from ecoinvent database"
          >
            <DatabaseIcon size={12} />
            <span>Select Provider</span>
          </button>
        </div>
      </div>
    );
  };

  // Stage filter tab state
  const [activeStageTab, setActiveStageTab] = useState('all'); // 'all' | 'a1_a3' | 'a4_a5' | 'b1_b7' | 'c1_c4' | 'd'

  // Provider modal / popover state
  const [providerModalItemIndex, setProviderModalItemIndex] = useState(null);
  const [providerSearchQuery, setProviderSearchQuery] = useState('');
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState([]);
  const [visibleMatchesCount, setVisibleMatchesCount] = useState(20);
  const [isAutoMatching, setIsAutoMatching] = useState(false);

  // Generic provider modal for non-BOM module provider selections (opens DB search)
  const [genericProviderModal, setGenericProviderModal] = useState(null);
  // Map of provider IDs to display info (populated when user selects from DB search)
  const [moduleProviderInfo, setModuleProviderInfo] = useState({});
  // Generic provider search state (separate from BOM provider search)
  const [genericSearchQuery, setGenericSearchQuery] = useState('');
  const [genericSearchResults, setGenericSearchResults] = useState([]);
  const [isGenericSearching, setIsGenericSearching] = useState(false);
  const [genericVisibleCount, setGenericVisibleCount] = useState(20);
  const genericSearchDebounceRef = useRef(null);

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

  // Auto-match all BOM items to their best ecoinvent database match
  const autoMatchAllProviders = async () => {
    setIsAutoMatching(true);
    let count = 0;
    try {
      for (let idx = 0; idx < bom.length; idx++) {
        const item = bom[idx];
        const rawKw = item.material || item.name || '';
        const cleanKw = rawKw.replace(/_/g, ' ').trim();
        if (!cleanKw) continue;
        try {
          const res = await fetch(`/api/documents/lcia-search?query=${encodeURIComponent(cleanKw)}&limit=1`);
          const d = await res.json();
          if (d.status === 'success' && d.results && d.results.length > 0) {
            const best = d.results[0];
            updateBomItem(idx, {
              ecoinvent_id: `ecoinvent_row_${best.row_index}`,
              dataset: `${best.activity_name} [${best.geography}]`,
              reference_product_name: best.reference_product_name,
              ecoinvent_row: best.row_index,
              ecoinvent_geography: best.geography,
              ecoinvent_matched: true,
            });
            count++;
          }
        } catch {}
      }
      if (count > 0) {
        showNotif?.(`Auto-selected best ecoinvent provider for ${count} component(s)`, 'Auto-Match Complete');
      }
    } finally {
      setIsAutoMatching(false);
    }
  };

  // By default, auto-select best ecoinvent search match on mount if not matched yet
  useEffect(() => {
    if (bom.length > 0) {
      const hasUnmatched = bom.some(item => !item.ecoinvent_matched && !item.ecoinvent_row);
      if (hasUnmatched) {
        autoMatchAllProviders();
      }
    }
  }, []);

  const searchDebounceRef = useRef(null);

  // Debounced provider search execution
  const executeSearch = async (queryText) => {
    const q = (queryText || '').trim();
    if (!q) {
      setLiveSearchResults([]);
      setIsSearchingDb(false);
      return;
    }
    setIsSearchingDb(true);
    try {
      const res = await fetch(`/api/documents/lcia-search?query=${encodeURIComponent(q)}&limit=200`);
      const data = await res.json();
      if (data.status === 'success' && data.results) {
        setLiveSearchResults(data.results);
      }
    } catch {
      // Offline fallback
    } finally {
      setIsSearchingDb(false);
    }
  };

  // Called on keyboard typing in the search box - debounced to stop blinking
  const handleSearchInputChange = (val) => {
    setProviderSearchQuery(val);
    setVisibleMatchesCount(20);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      executeSearch(val);
    }, 280);
  };

  // Immediate search for button clicks, quick tags, or opening modal
  const handleImmediateSearch = (val) => {
    setProviderSearchQuery(val);
    setVisibleMatchesCount(20);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    executeSearch(val);
  };

  // ── Generic Provider Search (for all module provider fields) ──
  const executeGenericSearch = async (queryText) => {
    const q = (queryText || '').trim();
    if (!q) {
      setGenericSearchResults([]);
      setIsGenericSearching(false);
      return;
    }
    setIsGenericSearching(true);
    try {
      const res = await fetch(`/api/documents/lcia-search?query=${encodeURIComponent(q)}&limit=200`);
      const data = await res.json();
      if (data.status === 'success' && data.results) {
        setGenericSearchResults(data.results);
      }
    } catch {
      // Offline fallback
    } finally {
      setIsGenericSearching(false);
    }
  };

  const handleGenericSearchInputChange = (val) => {
    setGenericSearchQuery(val);
    setGenericVisibleCount(20);
    if (genericSearchDebounceRef.current) {
      clearTimeout(genericSearchDebounceRef.current);
    }
    genericSearchDebounceRef.current = setTimeout(() => {
      executeGenericSearch(val);
    }, 280);
  };

  const handleGenericImmediateSearch = (val) => {
    setGenericSearchQuery(val);
    setGenericVisibleCount(20);
    if (genericSearchDebounceRef.current) {
      clearTimeout(genericSearchDebounceRef.current);
    }
    executeGenericSearch(val);
  };

  const handleGenericSelectProvider = (provider) => {
    if (!genericProviderModal) return;
    const providerId = provider.id || `ecoinvent_row_${provider.row_index}`;
    const providerName = provider.name || `${provider.activity_name} [${provider.geography || 'GLO'}]`;
    const providerGeo = provider.geography || '';

    // Store display info for future lookups
    setModuleProviderInfo(prev => ({
      ...prev,
      [providerId]: { name: providerName, geography: providerGeo },
    }));

    // Call the onChange callback with the provider ID
    genericProviderModal.onSelect(providerId);

    // Close modal and reset
    setGenericProviderModal(null);
    setGenericSearchQuery('');
    setGenericSearchResults([]);
    showNotif?.(`Updated provider to "${providerName}"`, 'Provider Updated');
  };

  const handleSelectProvider = (targetIdx, provider) => {
    updateBomItem(targetIdx, {
      ecoinvent_id: provider.id || `ecoinvent_row_${provider.row_index}`,
      dataset: provider.name || `${provider.activity_name} [${provider.geography || 'GLO'}]`,
      material: provider.reference_product_name || provider.name || provider.material,
      ecoinvent_row: provider.row_index,
      ecoinvent_geography: provider.geography,
      ecoinvent_matched: true,
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
        backgroundColor: '#f5f5f7',
        border: '1px solid #d2d2d7',
        borderRadius: '18px',
        padding: '24px 28px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                backgroundColor: 'var(--accent, #0066cc)',
                color: '#FFF',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Phase 3: Interactive Workbench
              </span>
              <span style={{ fontSize: '13px', color: 'var(--accent, #0066cc)', fontWeight: 600 }}>
                Editable User Review & Provider Selection
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Verify & Refine Extracted Engineering Data
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #86868b)', margin: 0, maxWidth: '820px', lineHeight: 1.47 }}>
              If any extracted values, weights, material classifications, or transport distances require corrections, you can edit them directly below. You can also pick or change the exact <strong>ecoinvent database activity / dataset provider</strong> for each material.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px', borderRadius: '9999px' }}
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
        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid var(--accent, #0066cc)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Declared Product Mass</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {totalMass.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary, #86868b)' }}>kg</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', marginTop: '2px' }}>Sum of {bom.length} declared components</div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #34c759' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Database Providers Mapped</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#34c759', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {bom.filter(b => b.ecoinvent_id || b.dataset).length} / {bom.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', marginTop: '2px' }}>ecoinvent v3.12 Cutoff linked</div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #5856d6' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Inbound Freight Legs</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {transport.length || 1} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary, #86868b)' }}>leg(s)</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', marginTop: '2px' }}>Module A2 transport routes</div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #ff9500' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Plant Utility Power</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {manufacturing.annual_facility_kwh ? Number(manufacturing.annual_facility_kwh).toLocaleString() : '34,000'} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary, #86868b)' }}>kWh/yr</span>
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
        borderBottom: '1px solid #d2d2d7'
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
                padding: '8px 16px',
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: isActive ? 'var(--accent, #0066cc)' : 'transparent',
                backgroundColor: isActive ? 'var(--accent, #0066cc)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary, #86868b)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
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
                padding: '1px 8px',
                borderRadius: '9999px',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary, #86868b)',
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
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.01em' }}>
              <DatabaseIcon size={18} style={{ color: 'var(--accent, #0066cc)' }} />
              <span>Bill of Materials (BOM) & Database Activity Provider Selection</span>
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary, #86868b)', marginTop: '3px' }}>
              By default, each component is auto-matched to the best ecoinvent v3.12 provider as per keyword. Click <strong>"Select Provider"</strong> to explore and customize providers.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={autoMatchAllProviders}
              disabled={isAutoMatching}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              title="Automatically query ecoinvent v3.12 database and assign the best search match for each extracted keyword"
            >
              <RefreshCwIcon size={13} className={isAutoMatching ? 'spin-anim' : ''} />
              <span>{isAutoMatching ? 'Auto-Matching...' : '⚡ Auto-Match All Providers'}</span>
            </button>
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
        </div>

        {bom.length > 0 ? (
          <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', width: '24%' }}>Component Name</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', width: '16%' }}>Extracted Keyword</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', width: '35%' }}>Database Provider (ecoinvent Match)</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', width: '13%' }}>Mass (kg)</th>
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
                          border: '1px solid #d2d2d7',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
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
                          border: '1px solid #d2d2d7',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'var(--text-secondary, #86868b)',
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
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.dataset || item.name || 'Select Database Provider'}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary, #86868b)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span>ID:</span>
                            <code style={{ backgroundColor: 'rgba(0,0,0,0.04)', padding: '1px 6px', borderRadius: '4px', color: 'var(--text-primary)', border: '1px solid #e5e5ea' }}>
                              {item.ecoinvent_id || 'ecoinvent_proxy'}
                            </code>
                            {item.ecoinvent_geography && (
                              <span style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)', color: '#34c759', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, fontSize: '9px' }}>
                                {item.ecoinvent_geography}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProviderModalItemIndex(idx);
                            const cleanKw = (item.material || item.name || '').replace(/_/g, ' ').trim();
                            handleImmediateSearch(cleanKw);
                          }}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: 'rgba(0, 102, 204, 0.08)',
                            color: 'var(--accent, #0066cc)',
                            border: '1px solid rgba(0, 102, 204, 0.2)',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
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
                          border: '1px solid #d2d2d7',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          backgroundColor: '#FFF'
                        }}
                      />
                    </td>

                    {/* Delete Action */}
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => deleteBomItem(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff3b30',
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
          <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f5f5f7', borderRadius: '18px' }}>
            <AlertTriangleIcon size={24} style={{ color: '#ff9500', marginBottom: '8px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No BOM Components Available</div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary, #86868b)', margin: '4px 0 16px 0' }}>
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
            <span style={{ backgroundColor: '#e8f2ff', color: 'var(--accent, #0066cc)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              MODULE A2 & A3
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Inbound Transport & Assembly Plant Utilities
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Logistics & Inbound Transport */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TruckIcon size={15} style={{ color: 'var(--accent, #0066cc)' }} />
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
                      padding: '14px',
                      backgroundColor: '#f5f5f7',
                      borderRadius: '11px',
                      border: '1px solid #e5e5ea',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <label className="form-label" style={{ fontSize: '10px', color: 'var(--text-secondary, #86868b)', fontWeight: 600, margin: '0 0 2px 0' }}>Distance (km)</label>
                          <input
                            type="number"
                            min="0"
                            value={leg.dist || leg.distance || 0}
                            onChange={(e) => updateTransportLeg(lIdx, { dist: Math.max(0, parseFloat(e.target.value) || 0), distance: Math.max(0, parseFloat(e.target.value) || 0) })}
                            style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #d2d2d7', borderRadius: '6px', fontWeight: 600, boxSizing: 'border-box' }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteTransportLeg(lIdx)}
                          style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', padding: '4px', marginBottom: '2px' }}
                          title="Remove leg"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>

                      {/* Leg-Specific Provider Selection */}
                      {renderProviderSelector(
                        'Leg Emission Factor Provider',
                        leg.provider_id || (leg.mode?.toLowerCase().includes('ship') ? 'ecoinvent_transport_container_ship_glo' : 'ecoinvent_transport_lorry_32t_rer'),
                        (val) => updateTransportLeg(lIdx, { provider_id: val }),
                        'Transport'
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '12px', backgroundColor: '#f5f5f7', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary, #86868b)' }}>
                    Defaulting to UL 10010-4 regional standard: <strong>500 km heavy lorry</strong> to plant gate.
                  </div>
                )}
              </div>
            </div>

            {/* Manufacturing Energy & Utilities */}
            <div className="card">
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
                Module A3: Factory Utilities & Consumables
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Annual production volume (units/year)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={manufacturing.annual_production_units != null ? manufacturing.annual_production_units : 1000}
                    onChange={(e) => updateManufacturing({ annual_production_units: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="1000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Energy Used – Electricity (kWh)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={manufacturing.annual_facility_kwh || ''}
                    onChange={(e) => updateManufacturing({ annual_facility_kwh: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="34000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Energy Used – Fuel/Gas (MJ)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={manufacturing.natural_gas_mj || ''}
                    onChange={(e) => updateManufacturing({ natural_gas_mj: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="18500"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Auxiliary Input – Process Water (m³)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={manufacturing.water_m3 || ''}
                    onChange={(e) => updateManufacturing({ water_m3: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="45.0"
                  />
                </div>
              </div>

              {/* A3 Providers: Electricity, Fuel, and Process Water */}
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e5e5ea', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', minWidth: 0 }}>
                {renderProviderSelector(
                  'Grid Electricity Provider',
                  manufacturing.electricity_provider_id || 'ecoinvent_elec_mv_us',
                  (val) => updateManufacturing({ electricity_provider_id: val }),
                  'Grids'
                )}
                {renderProviderSelector(
                  'Fuel / Gas Provider',
                  manufacturing.gas_provider_id || 'ecoinvent_gas_burned_boiler_glo',
                  (val) => updateManufacturing({ gas_provider_id: val }),
                  'Fuels'
                )}
                {renderProviderSelector(
                  'Process Water Provider',
                  manufacturing.water_provider_id || 'ecoinvent_water_deionised_glo',
                  (val) => updateManufacturing({ water_provider_id: val }),
                  'Water'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

             {/* ── SECTION 4: MODULE A4–A5 (LOGISTICS TO SITE & INSTALLATION RIGGING) ── */}
      {(activeStageTab === 'all' || activeStageTab === 'a4_a5') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#e8f2ff', color: 'var(--accent, #0066cc)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              MODULE A4 & A5
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Outbound Logistics & On-Site Installation / Rigging
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Module A4 */}
            <div className="card">
              <div className="card-title" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TruckIcon size={15} style={{ color: 'var(--accent, #0066cc)' }} />
                <span>Module A4: Delivery to Installation Site</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Distance (km)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={installation.outbound_transport_km || ''}
                    onChange={(e) => updateInstallation({ outbound_transport_km: parseFloat(e.target.value) || 0 })}
                    placeholder="500"
                  />
                </div>
                {renderProviderSelector(
                  'A4 Delivery Transport Provider',
                  installation.outbound_provider_id || 'ecoinvent_transport_lorry_32t_rer',
                  (val) => updateInstallation({ outbound_provider_id: val }),
                  'Transport'
                )}
              </div>
            </div>

            {/* Module A5 */}
            <div className="card">
              <div className="card-title" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Module A5: Rigging & Commissioning
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Install Energy (kWh)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={installation.installation_energy_kwh || ''}
                    onChange={(e) => updateInstallation({ installation_energy_kwh: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => updateInstallation({ commissioning_refrigerant_loss_kg: parseFloat(e.target.value) || 0 })}
                    placeholder="0.5"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Install Consumables (liters)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={installation.rigging_crane_diesel_liters || ''}
                    onChange={(e) => updateInstallation({ rigging_crane_diesel_liters: parseFloat(e.target.value) || 0 })}
                    placeholder="25.0"
                  />
                </div>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e5e5ea', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', minWidth: 0 }}>
                {renderProviderSelector(
                  'Installation Energy Provider',
                  installation.installation_energy_provider_id || 'ecoinvent_elec_mv_us',
                  (val) => updateInstallation({ installation_energy_provider_id: val }),
                  'Grids'
                )}
                {renderProviderSelector(
                  'Consumables / Crane Diesel Provider',
                  installation.consumable_provider_id || 'ecoinvent_diesel_burned_building_machine_glo',
                  (val) => updateInstallation({ consumable_provider_id: val }),
                  'Fuels'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 5: MODULE B1–B7 (OPERATIONAL USE STAGE) ── */}
      {(activeStageTab === 'all' || activeStageTab === 'b1_b7') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#e8f2ff', color: 'var(--accent, #0066cc)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              MODULE B1–B7
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Operational Use Stage (Fugitive Leaks, Maintenance, Repair, Replacement, Refurbishment & Energy)
            </h3>
          </div>

          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* B1: Fugitive Leaks */}
              <div style={{ padding: '14px', backgroundColor: '#f5f5f7', borderRadius: '11px', border: '1px solid #e5e5ea' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent, #0066cc)', marginBottom: '8px' }}>
                  B1: Fugitive Refrigerant
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Refrigerant Type</label>
                  <select
                    value={operational.refrigerant_type || 'R134a'}
                    onChange={(e) => updateOperational({ refrigerant_type: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '11px', border: '1px solid #d2d2d7', borderRadius: '6px' }}
                  >
                    <option value="R134a">R134a (GWP 1430)</option>
                    <option value="R1234ze">R1234ze (GWP 1.37)</option>
                    <option value="R513A">R513A (GWP 631)</option>
                    <option value="R1233zd">R1233zd (GWP 1)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Charge (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={operational.refrigerant_charge_kg || ''}
                    onChange={(e) => updateOperational({ refrigerant_charge_kg: parseFloat(e.target.value) || 0 })}
                    placeholder="45.0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Annual Leak Rate (%/yr)</label>
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

              {/* B2: Maintenance */}
              <div style={{ padding: '14px', backgroundColor: '#f5f5f7', borderRadius: '11px', border: '1px solid #e5e5ea' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent, #0066cc)', marginBottom: '8px' }}>
                  B2: Maintenance
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>
                    Maintenance Cycles (per RSL)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={maintenance_b2.maintenance_cycles_per_rsl || 25}
                    onChange={(e) => updateMaintenanceB2({ maintenance_cycles_per_rsl: parseInt(e.target.value, 10) || 0 })}
                    placeholder="25"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Consumable Mass per Cycle (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={maintenance_b2.consumable_mass_kg || ''}
                    onChange={(e) => updateMaintenanceB2({ consumable_mass_kg: parseFloat(e.target.value) || 0 })}
                    placeholder="5.0"
                  />
                </div>
                {renderProviderSelector(
                  'Maintenance Material Provider',
                  maintenance_b2.provider_id || 'ecoinvent_lubricating_oil_glo',
                  (val) => updateMaintenanceB2({ provider_id: val }),
                  'Consumables'
                )}
              </div>

              {/* B3: Repair */}
              <div style={{ padding: '14px', backgroundColor: '#f5f5f7', borderRadius: '11px', border: '1px solid #e5e5ea' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent, #0066cc)', marginBottom: '8px' }}>
                  B3: Repair (Repeatable Row)
                </div>
                <div className="form-group" style={{ marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>
                    Repair Events (per RSL)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={repair_b3.repair_events_per_rsl || 2}
                    onChange={(e) => updateRepairB3({ repair_events_per_rsl: parseInt(e.target.value, 10) || 0 })}
                    placeholder="2"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>
                    Part Mass (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={repair_b3.part_mass_kg || 18.5}
                    onChange={(e) => updateRepairB3({ part_mass_kg: parseFloat(e.target.value) || 0 })}
                    placeholder="18.5"
                  />
                </div>
                {renderProviderSelector(
                  'Replaced Part Material Provider',
                  repair_b3.provider_id || 'ecoinvent_steel_hot_rolled_glo',
                  (val) => updateRepairB3({ provider_id: val }),
                  'Metals'
                )}
              </div>

              {/* B4: Replacement */}
              <div style={{ padding: '14px', backgroundColor: '#f5f5f7', borderRadius: '11px', border: '1px solid #e5e5ea' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent, #0066cc)', marginBottom: '8px' }}>
                  B4: Replacement
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>
                    Estimated Service Life (ESL, years)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={replacement_b4.esl_years || project_info.lifespan_years || 25}
                    onChange={(e) => updateReplacementB4({ esl_years: parseInt(e.target.value, 10) || 1 })}
                    placeholder="25"
                  />
                </div>
                {/* Replacement Cycles Derived Display: (ESL ÷ RSL − 1) */}
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #e5e5ea',
                  fontSize: '11px',
                  marginBottom: '8px'
                }}>
                  <div style={{ color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>Derived Replacement Cycles:</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent, #0066cc)' }}>
                    {Math.max(0, (replacement_b4.esl_years || project_info.lifespan_years || 25) / (project_info.lifespan_years || 25) - 1).toFixed(2)} cycle(s)
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary, #86868b)' }}>
                    Formula: (ESL {replacement_b4.esl_years || 25} yrs ÷ RSL {project_info.lifespan_years || 25} yrs − 1)
                  </div>
                </div>
              </div>

              {/* B5: Refurbishment */}
              <div style={{ padding: '14px', backgroundColor: '#f5f5f7', borderRadius: '11px', border: '1px solid #e5e5ea' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent, #0066cc)', marginBottom: '8px' }}>
                  B5: Refurbishment (Repeatable Row)
                </div>
                <div className="form-group" style={{ marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>
                    Refurbishment Events (per RSL)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={refurbishment_b5.refurbishment_events_per_rsl || 1}
                    onChange={(e) => updateRefurbishmentB5({ refurbishment_events_per_rsl: parseInt(e.target.value, 10) || 0 })}
                    placeholder="1"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>
                    Mass / Qty (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={refurbishment_b5.mass_kg || 45.0}
                    onChange={(e) => updateRefurbishmentB5({ mass_kg: parseFloat(e.target.value) || 0 })}
                    placeholder="45.0"
                  />
                </div>
                {renderProviderSelector(
                  'Refurbishment Material/Energy Provider',
                  refurbishment_b5.provider_id || 'ecoinvent_copper_tube_wire_glo',
                  (val) => updateRefurbishmentB5({ provider_id: val }),
                  'Metals'
                )}
              </div>

              {/* B6 & B7: Power & Water */}
              <div style={{ padding: '14px', backgroundColor: '#f5f5f7', borderRadius: '11px', border: '1px solid #e5e5ea' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent, #0066cc)', marginBottom: '8px' }}>
                  B6 & B7: Operational Energy & Water
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Rated Efficiency (kW/ton)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      value={operational.efficiency_kw_per_ton || ''}
                      onChange={(e) => updateOperational({ efficiency_kw_per_ton: Math.max(0, parseFloat(e.target.value) || 0) })}
                      placeholder="0.54"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>Annual operating hours (h/year)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={operational.annual_operating_hours != null ? operational.annual_operating_hours : 8760}
                      onChange={(e) => updateOperational({ annual_operating_hours: Math.max(0, parseFloat(e.target.value) || 0) })}
                      placeholder="8760"
                    />
                  </div>
                </div>

                {renderProviderSelector(
                  'B6 Main Operational Grid Provider',
                  operational.energy_provider_id || 'ecoinvent_elec_mv_us',
                  (val) => updateOperational({ energy_provider_id: val }),
                  'Grids'
                )}

                <div className="form-group" style={{ marginTop: '10px', marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Annual Water Use (m³/yr)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={operational.cooling_tower_water_m3_yr || ''}
                    onChange={(e) => updateOperational({ cooling_tower_water_m3_yr: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="120.0"
                  />
                </div>
                {renderProviderSelector(
                  'B7 Operational Water Provider',
                  operational.water_provider_id || 'ecoinvent_water_deionised_glo',
                  (val) => updateOperational({ water_provider_id: val }),
                  'Water'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 6: MODULE C1–C4 (END OF LIFE STAGE) ── */}
      {(activeStageTab === 'all' || activeStageTab === 'c1_c4') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#e8f2ff', color: 'var(--accent, #0066cc)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              MODULE C1–C4
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              End of Life Decommissioning, Waste Transport, Processing & Disposal
            </h3>
          </div>

          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* C1 & C2 */}
              <div style={{ padding: '14px', backgroundColor: '#f5f5f7', borderRadius: '11px', border: '1px solid #e5e5ea' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent, #0066cc)', marginBottom: '8px' }}>
                  C1 Deconstruction & C2 Waste Transport
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Deconstruction Energy (kWh)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={end_of_life.decommissioning_energy_kwh || ''}
                    onChange={(e) => updateEndOfLife({ decommissioning_energy_kwh: parseFloat(e.target.value) || 0 })}
                    placeholder="120"
                  />
                </div>
                {renderProviderSelector(
                  'C1 Deconstruction Power Provider',
                  end_of_life.deconstruction_provider_id || 'ecoinvent_diesel_dismantling_glo',
                  (val) => updateEndOfLife({ deconstruction_provider_id: val }),
                  'Decommissioning'
                )}
                <div className="form-group" style={{ marginTop: '8px', marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Distance to Waste Processing (km)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={end_of_life.waste_transport_km || ''}
                    onChange={(e) => updateEndOfLife({ waste_transport_km: parseFloat(e.target.value) || 0 })}
                    placeholder="100"
                  />
                </div>
                {renderProviderSelector(
                  'C2 Waste Transport Provider',
                  end_of_life.waste_transport_provider_id || 'ecoinvent_transport_lorry_32t_rer',
                  (val) => updateEndOfLife({ waste_transport_provider_id: val }),
                  'Transport'
                )}
              </div>

              {/* C3 & C4 */}
              <div style={{ padding: '14px', backgroundColor: '#f5f5f7', borderRadius: '11px', border: '1px solid #e5e5ea' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent, #0066cc)', marginBottom: '8px' }}>
                  C3 Waste Processing & C4 Final Disposal
                </div>

                {/* Validation Banner for 100% Sum Requirement */}
                {(() => {
                  const rRate = Number(end_of_life.recycling_rate_percent) || 0;
                  const iRate = Number(end_of_life.incineration_rate_percent) || 0;
                  const lRate = Number(end_of_life.landfill_rate_percent) || 0;
                  const eolSum = Math.round((rRate + iRate + lRate) * 10) / 10;
                  const isValid = Math.abs(eolSum - 100) <= 0.01;
                  return (
                    <div style={{
                      marginBottom: '10px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: isValid ? '#E8F5E9' : '#FFEBEE',
                      color: isValid ? '#2E7D32' : '#C62828',
                      border: `1px solid ${isValid ? '#A5D6A7' : '#EF9A9A'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertTriangleIcon size={14} style={{ color: isValid ? '#2E7D32' : '#C62828' }} />
                      <span>
                        {isValid
                          ? `Sum of End-of-Life pathways = 100% (${rRate}% + ${iRate}% + ${lRate}%)`
                          : `Validation Error: Recycling (${rRate}%), Incineration (${iRate}%), and Landfill (${lRate}%) must equal 100% (Current total: ${eolSum}%). Export is blocked until corrected.`
                        }
                      </span>
                    </div>
                  );
                })()}

                <div className="form-group" style={{ marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Recycling Rate (C3 %)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="form-input"
                    value={end_of_life.recycling_rate_percent != null ? end_of_life.recycling_rate_percent : ''}
                    onChange={(e) => updateEndOfLife({ recycling_rate_percent: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="92.4"
                  />
                </div>
                {renderProviderSelector(
                  'C3 Recycling Process Provider',
                  end_of_life.recycling_process_provider_id || 'ecoinvent_waste_metal_recycling_glo',
                  (val) => updateEndOfLife({ recycling_process_provider_id: val }),
                  'Waste Processing'
                )}

                <div className="form-group" style={{ marginTop: '8px', marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Thermal Incineration (C3 %)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="form-input"
                    value={end_of_life.incineration_rate_percent != null ? end_of_life.incineration_rate_percent : ''}
                    onChange={(e) => updateEndOfLife({ incineration_rate_percent: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="3.1"
                  />
                </div>
                {renderProviderSelector(
                  'C3 Incineration Process Provider',
                  end_of_life.incineration_process_provider_id || 'ecoinvent_waste_incineration_glo',
                  (val) => updateEndOfLife({ incineration_process_provider_id: val }),
                  'Waste Processing'
                )}

                <div className="form-group" style={{ marginTop: '8px', marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>Sanitary Landfill (C4 %)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="form-input"
                    value={end_of_life.landfill_rate_percent != null ? end_of_life.landfill_rate_percent : ''}
                    onChange={(e) => updateEndOfLife({ landfill_rate_percent: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="4.5"
                  />
                </div>
                {renderProviderSelector(
                  'C4 Landfill Process Provider',
                  end_of_life.landfill_process_provider_id || 'ecoinvent_waste_landfill_glo',
                  (val) => updateEndOfLife({ landfill_process_provider_id: val }),
                  'Disposal'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 7: MODULE D (CIRCULARITY & NET AVOIDED BURDENS) ── */}
      {(activeStageTab === 'all' || activeStageTab === 'd') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ backgroundColor: 'rgba(52, 199, 89, 0.12)', color: '#28cd41', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600 }}>
              MODULE D
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Circularity & Loads Beyond System Boundary (Net Avoided Burdens)
            </h3>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #28cd41' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {/* Single Overall Recovery Rate (%) Field */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>Overall recovery rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="form-input"
                  value={circularity_d.overall_recovery_rate_percent != null ? circularity_d.overall_recovery_rate_percent : 90.0}
                  onChange={(e) => updateCircularityD({ overall_recovery_rate_percent: Math.max(0, parseFloat(e.target.value) || 0) })}
                  placeholder="90.0"
                />
              </div>

              {/* Module D Provider Selectors: Virgin Material vs Secondary Recycled Process */}
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', paddingTop: '8px', borderTop: '1px solid #e5e5ea' }}>
                {renderProviderSelector(
                  'Module D Virgin Material Provider (Displaced Primary)',
                  circularity_d.virgin_material_provider_id || 'ecoinvent_virgin_steel_primary_glo',
                  (val) => updateCircularityD({ virgin_material_provider_id: val }),
                  'Virgin'
                )}
                {renderProviderSelector(
                  'Module D Secondary Recycled Process Provider',
                  circularity_d.recycled_process_provider_id || 'ecoinvent_secondary_steel_electric_glo',
                  (val) => updateCircularityD({ recycled_process_provider_id: val }),
                  'Recycled'
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={{
        marginTop: '28px',
        paddingTop: '20px',
        borderTop: '1px solid #d2d2d7',
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
            const rRate = Number(end_of_life.recycling_rate_percent) || 0;
            const iRate = Number(end_of_life.incineration_rate_percent) || 0;
            const lRate = Number(end_of_life.landfill_rate_percent) || 0;
            const eolSum = Math.round((rRate + iRate + lRate) * 10) / 10;
            if (Math.abs(eolSum - 100) > 0.01) {
              showNotif?.(`Validation Error: Recycling (${rRate}%), Incineration (${iRate}%), and Landfill (${lRate}%) must equal 100% (Current: ${eolSum}%). Export/Confirm blocked.`, 'Validation Error');
              return;
            }
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
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '18px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #d2d2d7'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #d2d2d7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f5f5f7'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.01em' }}>
                  <DatabaseIcon size={18} style={{ color: 'var(--accent, #0066cc)' }} />
                  <span>Select ecoinvent Database Provider</span>
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #86868b)', marginTop: '2px' }}>
                  Component: <strong>{bom[providerModalItemIndex]?.name || 'Component'}</strong> (Extracted Keyword: "{bom[providerModalItemIndex]?.material}")
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProviderModalItemIndex(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary, #86868b)', cursor: 'pointer' }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Search Input & Quick Keyword Chips */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #d2d2d7', backgroundColor: '#FFFFFF' }}>
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <SearchIcon size={16} style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-secondary, #86868b)' }} />
                <input
                  type="text"
                  placeholder="Search 26,533 ecoinvent activities (e.g., steel, copper, motor, polyurethane, inverter)..."
                  value={providerSearchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 58px 8px 38px',
                    border: '1px solid #d2d2d7',
                    borderRadius: '9999px',
                    fontSize: '13px'
                  }}
                  autoFocus
                />
                <div style={{ position: 'absolute', right: '12px', top: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isSearchingDb && (
                    <RefreshCwIcon size={14} className="spin-anim" style={{ color: 'var(--accent, #0066cc)' }} />
                  )}
                  {providerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => handleImmediateSearch('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary, #86868b)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '2px'
                      }}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Suggested Quick Keywords */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>Quick search:</span>
                {['steel', 'copper', 'motor', 'polyurethane', 'inverter', 'stainless steel', 'aluminium', 'refrigerant'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleImmediateSearch(tag)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      border: '1px solid',
                      borderColor: providerSearchQuery.toLowerCase() === tag ? 'var(--accent, #0066cc)' : '#d2d2d7',
                      backgroundColor: providerSearchQuery.toLowerCase() === tag ? 'var(--accent, #0066cc)' : '#f5f5f7',
                      color: providerSearchQuery.toLowerCase() === tag ? '#FFFFFF' : 'var(--text-primary)',
                      fontWeight: providerSearchQuery.toLowerCase() === tag ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider List with Stable DOM Height and Smooth Transitions */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, minHeight: '320px' }}>
              {/* If search returns results from backend */}
              {liveSearchResults.length > 0 && (
                <div style={{
                  marginBottom: '16px',
                  opacity: isSearchingDb ? 0.6 : 1,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: isSearchingDb ? 'none' : 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, #86868b)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.04em' }}>
                      <span>Live ecoinvent Search Results (Showing {Math.min(visibleMatchesCount, liveSearchResults.length)} of {liveSearchResults.length})</span>
                      {isSearchingDb && <span style={{ fontSize: '10px', color: 'var(--accent, #0066cc)', fontWeight: 500 }}>(updating...)</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#34c759', fontWeight: 600 }}>
                      ★ Best match ranked first
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {liveSearchResults.slice(0, visibleMatchesCount).map((res, rIdx) => {
                      const isBestMatch = rIdx === 0;
                      const isCurrentlySelected =
                        bom[providerModalItemIndex]?.ecoinvent_id === `ecoinvent_row_${res.row_index}` ||
                        bom[providerModalItemIndex]?.ecoinvent_row === res.row_index;

                      return (
                        <div
                          key={rIdx}
                          onClick={() => handleSelectProvider(providerModalItemIndex, {
                            id: `ecoinvent_row_${res.row_index}`,
                            row_index: res.row_index,
                            activity_name: res.activity_name,
                            geography: res.geography,
                            reference_product_name: res.reference_product_name,
                          })}
                          style={{
                            padding: '12px 16px',
                            border: isCurrentlySelected
                              ? '2px solid #34c759'
                              : isBestMatch
                              ? '2px solid var(--accent, #0066cc)'
                              : '1px solid #e5e5ea',
                            borderRadius: '11px',
                            cursor: 'pointer',
                            backgroundColor: isCurrentlySelected
                              ? 'rgba(52, 199, 89, 0.05)'
                              : isBestMatch
                              ? 'rgba(0, 102, 204, 0.04)'
                              : '#FFF',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                          onMouseEnter={(e) => {
                            if (!isCurrentlySelected && !isBestMatch) {
                              e.currentTarget.style.backgroundColor = '#f5f5f7';
                              e.currentTarget.style.borderColor = 'var(--accent, #0066cc)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isCurrentlySelected && !isBestMatch) {
                              e.currentTarget.style.backgroundColor = '#FFF';
                              e.currentTarget.style.borderColor = '#e5e5ea';
                            }
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              {isBestMatch && (
                                <span style={{
                                  backgroundColor: 'rgba(0, 102, 204, 0.08)',
                                  color: 'var(--accent, #0066cc)',
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em'
                                }}>
                                  ★ Best Match (Default)
                                </span>
                              )}
                              {isCurrentlySelected && (
                                <span style={{
                                  backgroundColor: 'rgba(52, 199, 89, 0.1)',
                                  color: '#34c759',
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  textTransform: 'uppercase'
                                }}>
                                  ✓ Selected
                                </span>
                              )}
                              <span style={{
                                fontSize: '10px',
                                color: 'var(--text-secondary, #86868b)',
                                fontFamily: 'SFMono-Regular, Consolas, monospace'
                              }}>
                                Row #{res.row_index}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                              {res.activity_name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', marginTop: '2px' }}>
                              Reference Product: <strong>{res.reference_product_name}</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{
                              backgroundColor: '#f5f5f7',
                              color: 'var(--text-secondary, #86868b)',
                              border: '1px solid #e5e5ea',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              {res.geography}
                            </span>
                            <button
                              type="button"
                              style={{
                                padding: '5px 14px',
                                backgroundColor: isCurrentlySelected ? '#34c759' : isBestMatch ? 'var(--accent, #0066cc)' : 'rgba(0, 102, 204, 0.08)',
                                color: isCurrentlySelected || isBestMatch ? '#FFF' : 'var(--accent, #0066cc)',
                                border: 'none',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isCurrentlySelected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load more matches controls */}
                  {liveSearchResults.length > visibleMatchesCount && (
                    <div style={{ marginTop: '14px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setVisibleMatchesCount(prev => Math.min(prev + 20, liveSearchResults.length))}
                        style={{ fontSize: '12px', padding: '6px 14px' }}
                      >
                        + Show 20 More Matches (Showing {Math.min(visibleMatchesCount, liveSearchResults.length)} of {liveSearchResults.length})
                      </button>
                      {liveSearchResults.length > visibleMatchesCount + 20 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setVisibleMatchesCount(liveSearchResults.length)}
                          style={{ fontSize: '12px', padding: '6px 14px' }}
                        >
                          Show All ({liveSearchResults.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* If no search results */}
              {!isSearchingDb && providerSearchQuery && liveSearchResults.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary, #86868b)', fontSize: '13px', backgroundColor: '#FFF', borderRadius: '11px', border: '1px dashed #d2d2d7', marginBottom: '16px' }}>
                  No exact ecoinvent activities found for "{providerSearchQuery}".
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    Try searching for broader keywords like <code>steel</code>, <code>copper</code>, <code>motor</code>, or select from the core industrial providers below.
                  </div>
                </div>
              )}

              {/* Standard Curated Database Providers */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, #86868b)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
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
                          padding: '12px 16px',
                          border: '1px solid #e5e5ea',
                          borderRadius: '11px',
                          cursor: 'pointer',
                          backgroundColor: '#FFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f7'; e.currentTarget.style.borderColor = 'var(--accent, #0066cc)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFF'; e.currentTarget.style.borderColor = '#e5e5ea'; }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>{p.category} • Default Factor: {p.defaultEf} kg CO₂e/{p.unit}</div>
                        </div>
                        <span style={{
                          backgroundColor: '#f5f5f7',
                          color: 'var(--text-secondary, #86868b)',
                          border: '1px solid #e5e5ea',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {p.geography}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #d2d2d7', backgroundColor: '#f5f5f7', textAlign: 'right' }}>
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

      {/* ── MODAL: GENERIC DATABASE PROVIDER SELECTOR (for all module providers) ── */}
      {genericProviderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '18px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #d2d2d7'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #d2d2d7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f5f5f7'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.01em' }}>
                  <DatabaseIcon size={18} style={{ color: 'var(--accent, #0066cc)' }} />
                  <span>Select ecoinvent Database Provider</span>
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #86868b)', marginTop: '2px' }}>
                  Field: <strong>{genericProviderModal.label || 'Provider'}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setGenericProviderModal(null); setGenericSearchQuery(''); setGenericSearchResults([]); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary, #86868b)', cursor: 'pointer' }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Search Input & Quick Keyword Chips */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #d2d2d7', backgroundColor: '#FFFFFF' }}>
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <SearchIcon size={16} style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-secondary, #86868b)' }} />
                <input
                  type="text"
                  placeholder="Search 26,533 ecoinvent activities (e.g., steel, copper, transport, electricity, diesel)..."
                  value={genericSearchQuery}
                  onChange={(e) => handleGenericSearchInputChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 58px 8px 38px',
                    border: '1px solid #d2d2d7',
                    borderRadius: '9999px',
                    fontSize: '13px'
                  }}
                  autoFocus
                />
                <div style={{ position: 'absolute', right: '12px', top: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isGenericSearching && (
                    <RefreshCwIcon size={14} className="spin-anim" style={{ color: 'var(--accent, #0066cc)' }} />
                  )}
                  {genericSearchQuery && (
                    <button
                      type="button"
                      onClick={() => handleGenericImmediateSearch('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary, #86868b)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '2px'
                      }}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Suggested Quick Keywords */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>Quick search:</span>
                {['steel', 'copper', 'transport', 'electricity', 'diesel', 'aluminium', 'water', 'waste', 'incineration', 'landfill', 'recycling', 'lubricating oil'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleGenericImmediateSearch(tag)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      border: '1px solid',
                      borderColor: genericSearchQuery.toLowerCase() === tag ? 'var(--accent, #0066cc)' : '#d2d2d7',
                      backgroundColor: genericSearchQuery.toLowerCase() === tag ? 'var(--accent, #0066cc)' : '#f5f5f7',
                      color: genericSearchQuery.toLowerCase() === tag ? '#FFFFFF' : 'var(--text-primary)',
                      fontWeight: genericSearchQuery.toLowerCase() === tag ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider List */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, minHeight: '320px' }}>
              {/* Live search results from backend */}
              {genericSearchResults.length > 0 && (
                <div style={{
                  marginBottom: '16px',
                  opacity: isGenericSearching ? 0.6 : 1,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: isGenericSearching ? 'none' : 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, #86868b)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.04em' }}>
                      <span>Live ecoinvent Search Results (Showing {Math.min(genericVisibleCount, genericSearchResults.length)} of {genericSearchResults.length})</span>
                      {isGenericSearching && <span style={{ fontSize: '10px', color: 'var(--accent, #0066cc)', fontWeight: 500 }}>(updating...)</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#34c759', fontWeight: 600 }}>
                      ★ Best match ranked first
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {genericSearchResults.slice(0, genericVisibleCount).map((res, rIdx) => {
                      const isBestMatch = rIdx === 0;
                      const isCurrentlySelected = genericProviderModal.currentValue === `ecoinvent_row_${res.row_index}`;

                      return (
                        <div
                          key={rIdx}
                          onClick={() => handleGenericSelectProvider({
                            id: `ecoinvent_row_${res.row_index}`,
                            row_index: res.row_index,
                            activity_name: res.activity_name,
                            geography: res.geography,
                            reference_product_name: res.reference_product_name,
                          })}
                          style={{
                            padding: '12px 16px',
                            border: isCurrentlySelected
                              ? '2px solid #34c759'
                              : isBestMatch
                              ? '2px solid var(--accent, #0066cc)'
                              : '1px solid #e5e5ea',
                            borderRadius: '11px',
                            cursor: 'pointer',
                            backgroundColor: isCurrentlySelected
                              ? 'rgba(52, 199, 89, 0.05)'
                              : isBestMatch
                              ? 'rgba(0, 102, 204, 0.04)'
                              : '#FFF',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                          onMouseEnter={(e) => {
                            if (!isCurrentlySelected && !isBestMatch) {
                              e.currentTarget.style.backgroundColor = '#f5f5f7';
                              e.currentTarget.style.borderColor = 'var(--accent, #0066cc)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isCurrentlySelected && !isBestMatch) {
                              e.currentTarget.style.backgroundColor = '#FFF';
                              e.currentTarget.style.borderColor = '#e5e5ea';
                            }
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              {isBestMatch && (
                                <span style={{
                                  backgroundColor: 'rgba(0, 102, 204, 0.08)',
                                  color: 'var(--accent, #0066cc)',
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em'
                                }}>
                                  ★ Best Match
                                </span>
                              )}
                              {isCurrentlySelected && (
                                <span style={{
                                  backgroundColor: 'rgba(52, 199, 89, 0.1)',
                                  color: '#34c759',
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  textTransform: 'uppercase'
                                }}>
                                  ✓ Selected
                                </span>
                              )}
                              <span style={{
                                fontSize: '10px',
                                color: 'var(--text-secondary, #86868b)',
                                fontFamily: 'SFMono-Regular, Consolas, monospace'
                              }}>
                                Row #{res.row_index}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                              {res.activity_name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', marginTop: '2px' }}>
                              Reference Product: <strong>{res.reference_product_name}</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{
                              backgroundColor: '#f5f5f7',
                              color: 'var(--text-secondary, #86868b)',
                              border: '1px solid #e5e5ea',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              {res.geography}
                            </span>
                            <button
                              type="button"
                              style={{
                                padding: '5px 14px',
                                backgroundColor: isCurrentlySelected ? '#34c759' : isBestMatch ? 'var(--accent, #0066cc)' : 'rgba(0, 102, 204, 0.08)',
                                color: isCurrentlySelected || isBestMatch ? '#FFF' : 'var(--accent, #0066cc)',
                                border: 'none',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isCurrentlySelected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load more matches */}
                  {genericSearchResults.length > genericVisibleCount && (
                    <div style={{ marginTop: '14px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setGenericVisibleCount(prev => Math.min(prev + 20, genericSearchResults.length))}
                        style={{ fontSize: '12px', padding: '6px 14px' }}
                      >
                        + Show 20 More (Showing {Math.min(genericVisibleCount, genericSearchResults.length)} of {genericSearchResults.length})
                      </button>
                      {genericSearchResults.length > genericVisibleCount + 20 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setGenericVisibleCount(genericSearchResults.length)}
                          style={{ fontSize: '12px', padding: '6px 14px' }}
                        >
                          Show All ({genericSearchResults.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* No results message */}
              {!isGenericSearching && genericSearchQuery && genericSearchResults.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary, #86868b)', fontSize: '13px', backgroundColor: '#FFF', borderRadius: '11px', border: '1px dashed #d2d2d7', marginBottom: '16px' }}>
                  No ecoinvent activities found for "{genericSearchQuery}".
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    Try broader keywords like <code>steel</code>, <code>transport</code>, <code>electricity</code>.
                  </div>
                </div>
              )}

              {/* Standard Curated Providers Fallback */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, #86868b)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  Standard Core ecoinvent v3.12 Industrial Providers
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {STANDARD_DATABASE_PROVIDERS
                    .filter(p => !genericSearchQuery || p.name.toLowerCase().includes(genericSearchQuery.toLowerCase()) || p.category.toLowerCase().includes(genericSearchQuery.toLowerCase()))
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleGenericSelectProvider(p)}
                        style={{
                          padding: '12px 16px',
                          border: '1px solid #e5e5ea',
                          borderRadius: '11px',
                          cursor: 'pointer',
                          backgroundColor: '#FFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f7'; e.currentTarget.style.borderColor = 'var(--accent, #0066cc)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFF'; e.currentTarget.style.borderColor = '#e5e5ea'; }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)' }}>{p.category} • Default Factor: {p.defaultEf} kg CO₂e/{p.unit}</div>
                        </div>
                        <span style={{
                          backgroundColor: '#f5f5f7',
                          color: 'var(--text-secondary, #86868b)',
                          border: '1px solid #e5e5ea',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {p.geography}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #d2d2d7', backgroundColor: '#f5f5f7', textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { setGenericProviderModal(null); setGenericSearchQuery(''); setGenericSearchResults([]); }}
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
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
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
              borderRadius: '18px',
              width: '100%',
              maxWidth: '520px',
              overflow: 'hidden',
              border: '1px solid #d2d2d7',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #d2d2d7', backgroundColor: '#f5f5f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>Add Custom Component to BOM</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #86868b)' }}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #86868b)', marginBottom: '4px' }}>Component Name</label>
                <input
                  type="text"
                  placeholder="e.g. Copper Cooling Coil or Control Board"
                  value={newComp.name}
                  onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d2d2d7', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #86868b)', marginBottom: '4px' }}>Material Keyword</label>
                  <input
                    type="text"
                    placeholder="e.g. Copper, Steel, Aluminum"
                    value={newComp.material}
                    onChange={(e) => setNewComp({ ...newComp, material: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d2d2d7', borderRadius: '8px', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #86868b)', marginBottom: '4px' }}>Mass (kg)</label>
                  <input
                    type="number"
                    step="any"
                    value={newComp.mass}
                    onChange={(e) => setNewComp({ ...newComp, mass: parseFloat(e.target.value) || 0 })}
                    required
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d2d2d7', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #86868b)', marginBottom: '4px' }}>Initial Database Provider</label>
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
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d2d2d7', borderRadius: '8px', fontSize: '12px' }}
                >
                  {STANDARD_DATABASE_PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name} [{p.geography}]</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #86868b)', marginBottom: '4px' }}>Life Cycle Module</label>
                  <select
                    value={newComp.module}
                    onChange={(e) => setNewComp({ ...newComp, module: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d2d2d7', borderRadius: '8px', fontSize: '12px' }}
                  >
                    <option value="A1">Module A1: Raw Materials</option>
                    <option value="A2">Module A2: Transport</option>
                    <option value="A3">Module A3: Manufacturing</option>
                    <option value="B1">Module B: Use Stage</option>
                    <option value="C1">Module C: End of Life</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #86868b)', marginBottom: '4px' }}>Supplier / Origin</label>
                  <input
                    type="text"
                    placeholder="e.g. Tier-1 OEM"
                    value={newComp.supplier}
                    onChange={(e) => setNewComp({ ...newComp, supplier: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d2d2d7', borderRadius: '8px', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #d2d2d7', backgroundColor: '#f5f5f7', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Add Component</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
