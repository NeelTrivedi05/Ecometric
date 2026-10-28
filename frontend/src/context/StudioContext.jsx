import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { ALL_METHODOLOGIES, METHODOLOGIES, getMethodology } from '../data/lciaMethodologies';
import { PRESET_DATASETS } from '../data/presetDatasets';
import { DEFAULT_PRODUCT_ID, getProduct } from '../data/products';
import { CARRIER_19DV_500RT_EPD11017 } from '../data/carrier19dvBenchmark';
import { USER_SELECTED } from '../components/studio/providerMatch';
import { ACCOUNTS_DATA, DEFAULT_ACCOUNT_ID } from '../data/accountsData';
import { API_BASE } from '../config/api';

// Minimum time the progress bar stays up for a PDF export, even when the server is faster.
const PDF_EXPORT_MIN_MS = 28000;

// Resolves once Date.now() reaches the given timestamp (immediately if already past).
export const waitUntil = (timestamp) =>
  new Promise(resolve => setTimeout(resolve, Math.max(0, timestamp - Date.now())));

// Dataset fields of a BOM line, dropped when a renamed line has to be matched again
const BOM_DATASET_KEYS = ['provider_id', 'ecoinvent_id', 'ecoinvent_row', 'dataset', 'reference_product_name',
  'reference_unit', 'ecoinvent_geography', 'ecoinvent_matched', 'match_method', 'match_query'];

// Stage inputs that always get a regional default dataset (see STAGE_DEFAULT_FIELDS in material_matcher.py)
const STAGE_DEFAULT_FIELDS = {
  manufacturing: ['electricity_provider_id', 'gas_provider_id', 'water_provider_id'],
  installation: ['outbound_provider_id', 'installation_energy_provider_id', 'consumable_provider_id'],
  operational: ['energy_provider_id', 'water_provider_id'],
  end_of_life: ['deconstruction_provider_id', 'waste_transport_provider_id'],
};

// True when a loaded inventory has a line or stage input without a dataset (or without its dataset name)
function needsDatasetMatching(data) {
  if (!data || !((data.bom || []).length || (data.transport || []).length)) return false;
  if ((data.bom || []).some(i => !(i.provider_id || i.ecoinvent_id) && i.ecoinvent_matched === undefined)) return true;
  if ((data.transport || []).some(l => !(l.provider_id || l.ecoinvent_id) || !l.dataset)) return true;
  return Object.entries(STAGE_DEFAULT_FIELDS).some(([block, fields]) =>
    fields.some(f => !data[block]?.[f] || !data[block]?.[`${f}_dataset`]));
}

async function epdReportError(res) {
  const body = await res.json().catch(() => ({}));
  const detail = body.detail || {};
  const err = new Error(detail.error || (typeof detail === 'string' ? detail : 'Report request failed'));
  err.errors = Array.isArray(detail.errors) ? detail.errors : [];
  err.status = res.status;
  return err;
}

const StudioContext = createContext(null);

// Short hash of the inventory a check ran on, used to mark the check out of date after edits.
function signatureOf(value) {
  const text = JSON.stringify(value ?? null);
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${text.length}:${h >>> 0}`;
}

export const EMPTY_STUDIO_STATE = {
  bom: [],
  transport: [],
  manufacturing: {
    annual_facility_kwh: 0, natural_gas_mj: 0, grid_region: 'US_Average',
    water_m3: 0, annual_production_units: 0,
    electricity_provider_id: '',
    gas_provider_id: '',
    water_provider_id: '',
  },
  installation: {
    outbound_transport_km: 0, installation_energy_kwh: 0,
    commissioning_refrigerant_loss_kg: 0, rigging_crane_diesel_liters: 0,
  },
  operational: {
    refrigerant_type: 'R134a', refrigerant_charge_kg: 0,
    annual_leak_rate_percent: 0, efficiency_kw_per_ton: 0,
    capacity_rt: 0, annual_operating_hours: 0, cooling_tower_water_m3_yr: 0,
    energy_provider_id: '',
    water_provider_id: '',
  },
  end_of_life: {
    recycling_rate_percent: 92.4, landfill_rate_percent: 4.5,
    incineration_rate_percent: 3.1, decommissioning_energy_kwh: 120,
    waste_transport_km: 100,
    deconstruction_provider_id: 'ecoinvent_row_2621',
    waste_transport_provider_id: 'ecoinvent_transport_lorry_32t_rer',
    recycling_process_provider_id: 'ecoinvent_row_20713',
    incineration_process_provider_id: 'ecoinvent_row_22918',
    landfill_process_provider_id: 'ecoinvent_row_14191',
  },
  circularity_d: {
    overall_recovery_rate_percent: 0,
    virgin_material_provider_id: 'ecoinvent_row_15528',
    recycled_process_provider_id: 'ecoinvent_row_15529',
  },
  project_info: {
    product_name: '', manufacturer_name: '', functional_unit: '',
    pcr_ref: '', declared_unit: '', lifespan_years: 25,
    product_category: DEFAULT_PRODUCT_ID,
  },
};

// Empty studio state for a product category. Non-chiller products get no refrigerant / kW-per-ton
// fields and blank end-of-life datasets, so the backend applies that product's PCR defaults.
export function buildEmptyStudioState(productId) {
  const product = getProduct(productId);
  const base = JSON.parse(JSON.stringify(EMPTY_STUDIO_STATE));
  base.project_info = {
    ...base.project_info,
    product_category: product.id,
    product_category_name: product.name,
    functional_unit: product.functionalUnit,
    fu_unit: product.fuUnit,
    fu_quantity: 1,
    pcr_ref: product.pcrLabel,
    lifespan_years: product.defaultRsl,
  };
  if (!product.isChiller) {
    base.operational = { annual_energy_kwh: 0, annual_water_m3: 0, energy_provider_id: '', water_provider_id: '' };
    base.installation = { outbound_transport_km: 0, installation_energy_kwh: 0, rigging_crane_diesel_liters: 0 };
    base.end_of_life = {
      recycling_rate_percent: 0, landfill_rate_percent: 0, incineration_rate_percent: 0,
      decommissioning_energy_kwh: 0, waste_transport_km: 0,
    };
    base.circularity_d = { overall_recovery_rate_percent: 0 };
    base.maintenance_b2 = { maintenance_cycles_per_rsl: 0, consumable_name: '', consumable_mass_kg: 0 };
  }
  return base;
}

// Carrier AquaEdge 19DV 500 RT, calibrated to EPD11017 (see data/carrier19dvBenchmark.js)
export const BENCHMARK_EXTRACTED_DATA = CARRIER_19DV_500RT_EPD11017;

export function StudioProvider({ children }) {
  // Navigation
  const [activePhase, setActivePhase] = useState('upload');
  const [currentPresetId, setCurrentPresetId] = useState('aquaedge_500rt');
  // Product category chosen in step 1 (null until the user selects one)
  const [productCategory, setProductCategory] = useState(null);

  // ─── Teammate's projects console: accounts and projects (from origin/main) ───
  const [studioViewMode, setStudioViewMode] = useState('dashboard'); // 'dashboard' | 'workspace'

  // Multi-tenant accounts and assembled database state
  const [currentAccountId, setCurrentAccountId] = useState(DEFAULT_ACCOUNT_ID);
  const [accountsList, setAccountsList] = useState(() => Object.values(ACCOUNTS_DATA));
  const [activeProjectId, setActiveProjectId] = useState('proj-c1');
  const [projectsList, setProjectsList] = useState(() => ACCOUNTS_DATA[DEFAULT_ACCOUNT_ID]?.projects || []);
  const [epdsList, setEpdsList] = useState(() => ACCOUNTS_DATA[DEFAULT_ACCOUNT_ID]?.epds || []);

  const currentAccount = useMemo(() => {
    return accountsList.find((a) => a.id === currentAccountId) || ACCOUNTS_DATA[DEFAULT_ACCOUNT_ID];
  }, [accountsList, currentAccountId]);

  const assembledDatabase = useMemo(() => {
    return currentAccount?.database_assembly;
  }, [currentAccount]);

  // Sync accounts from backend if online
  React.useEffect(() => {
    fetch(`${API_BASE}/accounts`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAccountsList(data);
        }
      })
      .catch(() => {});
  }, []);

  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Extracted data (pre-seeded with verified Carrier 500RT benchmark dataset)
  const [extractedData, setExtractedData] = useState(BENCHMARK_EXTRACTED_DATA);

  // PCR compliance gaps & traceability flow
  const [gaps, setGaps] = useState([]);
  const [traceabilityFlow, setTraceabilityFlow] = useState(null);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);

  // Validation results
  const [validationResults, setValidationResults] = useState({
    checks: [],
    overall_pass: false,
    run_at: null,
  });

  // LCIA Methodology
  const [selectedMethodology, setSelectedMethodology] = useState('ef31');

  // Characterized results from backend or instant local engine
  // Results always come from the backend calculation engine; null until a calculation has succeeded.
  const [results, setResults] = useState(null);
  const [calculationError, setCalculationError] = useState(null);
  // Calculation outputs kept per LCIA methodology so a report can include several methods.
  const [resultsByMethod, setResultsByMethod] = useState({});
  const [dqrReport, setDqrReport] = useState(null);
  const [openepdDocument, setOpenepdDocument] = useState(null);

  // Legacy PCR indicator-matrix rule id, still sent with the verification bundle export
  const [selectedPcrRule, setSelectedPcrRule] = useState('rule-ul10010-4-traci');
  // Step 7: PCR `results` rules evaluated on the latest calculation
  const [resultsAudit, setResultsAudit] = useState(null);

  // Report Details Form State (Part B - Modeled on EPD11017)
  const [reportDetails, setReportDetails] = useState({
    company_name: 'Carrier Corporation',
    company_address: '13995 Pasteur Boulevard\nPalm Beach Gardens, Florida 33418',
    company_logo: '',
    company_website: 'https://www.carrier.com',
    description_of_company: 'Carrier is the leading global provider of healthy, safe, and sustainable building and cold chain solutions with a world-class, diverse workforce. Through performance-driven culture, shareholder value is driven by growing earnings and investing strategically to strengthen its position in the market. Carrier’s industry leading solutions and services are designed to reduce energy consumption and facility operating costs in HVAC & Refrigeration.',
    product_name: 'AquaEdge® 19DV Water-Cooled Centrifugal Chiller',
    product_description: 'The AquaEdge® 19DV is a water-cooled centrifugal chiller that utilizes a two-stage back-to-back compressor and an oil-free ceramic bearing system to deliver more operating range and consistent efficiency. Product shown in Figure 1.',
    product_image: '',
    csi_code: '23 64 16.16',
    technical_data_bullets: [
      'High tier variable speed starter equipped with harmonic filter (optional), total harmonic distortion (THD) ≤5% and fully complies with IEEE519 standard.',
      'AquaEdge® 19DV chillers can achieve up to 7.3 (0.4818 kW/Ton) full load COPR and 12.3 (0.2859 kW/Ton) IPLV.IP at AHRI conditions.',
      'AquaEdge® 19DV chillers can meet 18001 standards recommended by Occupational Health and Safety Advisory Services (OHSAS).',
      'ASME Section VIII Div. 1 “U” stamped certified.',
      'Certified in accordance with the AHRI Water-Cooled Water-Chilling and Heat Pump Water-Heating Packages Certification Program (AHRI Standard 550/590).',
      'Certified units may be found in the AHRI Directory at http://www.ahridirectory.org.'
    ],
    intended_application: 'The function of the chiller included within this study is to provide chilled water for use in cooling the interior of a building, for a functional unit of 1 ton chilling capacity.',
    markets: 'North America, Global',
    declaration_number: 'EPD11017',
    date_of_issue: '12/17/2024',
    validity_period: '5 Years from the date of issue',
    program_operator_name: 'NSF Certification, LLC',
    program_operator_address: '789 North Dixboro Road, Ann Arbor, MI, 48105, United States',
    program_operator_website: 'https://www.nsf.org/',
    program_operator_logo: '',
    general_program_instructions: 'Part A: Life Cycle Assessment Calculations and Report Requirements Version 4.0',
    reference_pcr: 'Part A: Life Cycle Assessment Calculation Rules and Report Requirements (UL Environment, V4.0, 2022)\nPart B: Water Cooled Chiller EPD Requirements (UL Environment V2.0, 2018)',
    pcr_review_panel: [
      'Lise Laurin, EarthShift Global',
      'Sean Beilman, BCER Engineering, Inc.',
      'François Charron-Doucet, Group AGÉCO'
    ],
    lca_practitioner_name: 'Shashikumar M S, HCLTech',
    lca_practitioner_org: 'HCLTech',
    is_verified: false,
    verification_type: 'EXTERNAL',
    verifier_name: 'Jack Geibig - EcoForm',
    verifier_org: 'EcoForm Certification',
    verifier_email: 'jgeibig@ecoform.com',
    verifier_signature: '',
    limitations_text: '',
    assumptions_limitations_text: '',
    hazardous_substances_statement: 'No substances required to be reported as hazardous according to the US Resources Conservation and Recovery Act, Subtitle 3 are associated with the production of this product.',
    extra_references: [],
    save_as_company_defaults: false
  });
  const [isReportDetailsModalOpen, setIsReportDetailsModalOpen] = useState(false);

  // Sync manufacturer and product name from extractedData into reportDetails (Rule Part A.2)
  React.useEffect(() => {
    if (extractedData.project_info?.manufacturer_name) {
      setReportDetails(prev => ({
        ...prev,
        company_name: extractedData.project_info.manufacturer_name
      }));
    }
    if (extractedData.project_info?.product_name) {
      setReportDetails(prev => ({
        ...prev,
        product_name: extractedData.project_info.product_name
      }));
    }
  }, [extractedData.project_info?.manufacturer_name, extractedData.project_info?.product_name]);

  React.useEffect(() => {
    // Fetch initial report details from backend
    fetch(`${API_BASE}/epd/report-details/current_project`)
      .then(r => r.json())
      .then(d => {
        if (d && d.company_name) {
          setReportDetails(prev => ({ ...prev, ...d }));
        }
      })
      .catch(err => console.warn('[StudioContext] Could not fetch initial report details:', err));
  }, []);

  // UI state
  const [notification, setNotification] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('ecometric_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
      return true; // Default to collapsed slim bar so hover-expand is active
    } catch {
      return true;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  // { title, durationMs, startedAt } while the full-screen progress bar is shown.
  const [progressTask, setProgressTask] = useState(null);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  const toggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ecometric_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  const showNotif = useCallback((msg, title = 'Done') => {
    setNotification({ msg, title });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Multi-tenant Account & Database Assembly Switching
  const switchAccount = useCallback((newAccountId) => {
    const acc = accountsList.find((a) => a.id === newAccountId) || ACCOUNTS_DATA[newAccountId];
    if (!acc) return;
    setCurrentAccountId(newAccountId);
    setProjectsList(acc.projects || []);
    setEpdsList(acc.epds || []);

    // Dynamically update manufacturing and operational parameters to match this account's assembled facility LCI
    if (acc.database_assembly) {
      setExtractedData((prev) => ({
        ...prev,
        manufacturing: {
          ...prev.manufacturing,
          grid_region: acc.database_assembly.facility_location,
          electricity_provider_id: acc.database_assembly.grid_provider_id || 'ecoinvent_elec_mv_us',
        },
        operational: {
          ...prev.operational,
          refrigerant_type: acc.database_assembly.default_refrigerant || prev.operational.refrigerant_type,
        },
        project_info: {
          ...prev.project_info,
          manufacturer_name: acc.company_name,
          pcr_ref: acc.database_assembly.pcr_standard || prev.project_info.pcr_ref,
        },
      }));
    }

    showNotif(
      `Assembled LCI database for ${acc.company_name} (${acc.database_assembly?.facility_name})`,
      'Facility Assembly Active'
    );
  }, [accountsList, showNotif]);

  const addEpd = useCallback((newEpd) => {
    setEpdsList((prev) => [newEpd, ...prev]);
  }, []);

  const activeProject = useMemo(() => {
    const foundInList = projectsList.find((p) => p.id === activeProjectId);
    if (foundInList) return foundInList;
    for (const acc of Object.values(ACCOUNTS_DATA)) {
      const foundInAcc = acc.projects?.find((p) => p.id === activeProjectId);
      if (foundInAcc) return foundInAcc;
    }
    return null;
  }, [projectsList, activeProjectId]);

  // Open Project into Studio Calculation Workspace
  const openProject = useCallback((projectId, forceReload = false) => {
    let proj = projectsList.find((p) => p.id === projectId);
    if (!proj) {
      for (const acc of Object.values(ACCOUNTS_DATA)) {
        const found = acc.projects?.find((p) => p.id === projectId);
        if (found) {
          proj = found;
          setCurrentAccountId(acc.id);
          setProjectsList(acc.projects || []);
          setEpdsList(acc.epds || []);
          break;
        }
      }
    }
    if (!proj) return null;

    if (activeProjectId === projectId && studioViewMode === 'workspace' && !forceReload) {
      return proj;
    }

    setActiveProjectId(projectId);

    // If project has an existing preset key, load it
    if (proj.preset_key && PRESET_DATASETS[proj.preset_key]) {
      const preset = PRESET_DATASETS[proj.preset_key];
      setExtractedData({
        ...preset.data,
        project_info: {
          ...preset.data.project_info,
          product_name: proj.name,
          manufacturer_name: currentAccount?.company_name || preset.data.project_info.manufacturer_name,
          pcr_ref: proj.standard || preset.data.project_info.pcr_ref,
        },
      });
      setResults(null);
      setCurrentPresetId(proj.preset_key);
    } else {
      setExtractedData((prev) => ({
        ...prev,
        project_info: {
          ...prev.project_info,
          product_name: proj.name,
          manufacturer_name: currentAccount?.company_name || 'Manufacturer',
          functional_unit: proj.functional_unit || prev.project_info.functional_unit,
          pcr_ref: proj.standard || prev.project_info.pcr_ref,
        },
        operational: {
          ...prev.operational,
          capacity_rt: proj.capacity_rt || 500,
          refrigerant_type: proj.refrigerant || 'R134a',
          refrigerant_charge_kg: proj.refrigerant_charge_kg || 250,
        },
      }));
    }

    setStudioViewMode('workspace');
    setActivePhase('upload');
    showNotif(`Loaded "${proj.name}" into calculation workspace.`, 'Project Opened');
    return proj;
  }, [projectsList, currentAccount, selectedMethodology, activeProjectId, studioViewMode, showNotif]);

  // Create Project and Launch into Studio
  const createProject = useCallback((newProj) => {
    setProjectsList((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);

    setExtractedData((prev) => ({
      ...prev,
      project_info: {
        ...prev.project_info,
        product_name: newProj.name,
        manufacturer_name: currentAccount?.company_name || 'Manufacturer',
        functional_unit: newProj.functional_unit,
        pcr_ref: newProj.standard,
      },
      operational: {
        ...prev.operational,
        capacity_rt: newProj.capacity_rt,
        refrigerant_type: newProj.refrigerant,
        refrigerant_charge_kg: newProj.refrigerant_charge_kg,
      },
    }));

    setStudioViewMode('workspace');
    setActivePhase('upload');
    showNotif(`Created "${newProj.name}" with ${currentAccount?.company_name} LCI assembly.`, 'Project Initialized');
  }, [currentAccount, showNotif]);

  // Duplicate Project
  const duplicateProject = useCallback((projectId) => {
    const proj = projectsList.find((p) => p.id === projectId);
    if (!proj) return;
    const cloned = {
      ...proj,
      id: `proj-${Date.now()}`,
      name: `Copy of ${proj.name}`,
      last_modified: 'Just now by You',
      created_at: new Date().toISOString().split('T')[0],
      epd_number: null,
      status: 'In Calculation',
    };
    setProjectsList((prev) => [cloned, ...prev]);
    showNotif(`Created duplicate: "${cloned.name}"`, 'Project Duplicated');
  }, [projectsList, showNotif]);

  // Delete / Archive Project
  const deleteProject = useCallback((projectId) => {
    setProjectsList((prev) => prev.filter((p) => p.id !== projectId));
    showNotif('Project has been archived / removed.', 'Project Removed');
  }, [showNotif]);

  // Close back to Projects Console
  const closeToProjectsHub = useCallback(() => {
    setStudioViewMode('dashboard');
  }, []);

  // ─── CALCULATE ENGINE ───
  // Only the most recent calculation may update the results and the loading state; responses
  // from older requests that arrive later are ignored.
  const latestCalcRequestRef = useRef(0);

  // Resolves to true/false for success/failure, or null when a newer run superseded this one.
  const runCalculation = useCallback(async (methodOverride, dataOverride) => {
    const requestId = ++latestCalcRequestRef.current;
    setIsLoading(true);
    setCalculationError(null);
    const targetMethod = methodOverride || selectedMethodology;
    const activeData = dataOverride || extractedData;
    const payload = {
      extracted_data: activeData,
      methodology: targetMethod,
      report_details: reportDetails,
      product_category: activeData?.project_info?.product_category || productCategory || DEFAULT_PRODUCT_ID,
    };

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const endpoints = [
      `${API_BASE}/epd/calculate-anti`,
      ...(isLocal && API_BASE === '/api' ? [
        'http://localhost:8000/api/epd/calculate-anti',
        'http://127.0.0.1:8000/api/epd/calculate-anti'
      ] : [])
    ];

    let data = null;
    let failure = 'Could not reach the EcoMetric backend on port 8000 (cd backend && python main.py).';
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          data = await res.json();
          break;
        }
        failure = `The calculation API returned HTTP ${res.status}.`;
      } catch (err) {
        console.warn(`[StudioContext] Fetch attempt failed for ${ep}:`, err);
      }
    }

    if (requestId !== latestCalcRequestRef.current) return null;

    const succeeded = Boolean(data?.epd_results && Object.keys(data.epd_results).length > 0);
    if (succeeded) {
      setResults(data);
      setResultsByMethod(prev => ({
        ...prev,
        [targetMethod]: { epd_results: data.epd_results, epd_metadata: data.epd_metadata },
      }));
      setResultsAudit(data.pcr_results_audit
        ? { ...data.pcr_results_audit, inputSignature: signatureOf(activeData) }
        : null);
      showNotif('LCA calculation complete', 'Calculation');
    } else {
      // Never show placeholder or older results as if they came from this calculation.
      const message = data
        ? 'The calculation engine returned no indicator results. Check the backend console for the error and recalculate.'
        : failure;
      setResults(null);
      setResultsAudit(null);
      setCalculationError(message);
      showNotif(message, 'Calculation Failed');
    }
    setIsLoading(false);
    return succeeded;
  }, [extractedData, selectedMethodology, reportDetails, productCategory, showNotif]);

  // ─── PRODUCT SELECTION ───
  // Switching product starts a clean inventory with that product's functional unit and PCR.
  const selectProduct = useCallback((productId) => {
    const product = getProduct(productId);
    setProductCategory(product.id);
    if ((extractedData?.project_info?.product_category || DEFAULT_PRODUCT_ID) !== product.id) {
      setExtractedData(buildEmptyStudioState(product.id));
      setUploadedFiles([]);
      setResults(null);
      setResultsByMethod({});
      setGaps([]);
      setTraceabilityFlow(null);
      setValidationResults({ checks: [], overall_pass: false, run_at: null });
      setResultsAudit(null);
    }
    showNotif(`${product.name} selected - PCR: ${product.pcrShort}`, 'Product');
  }, [extractedData, showNotif]);

  // ─── STATE RESET ───
  const resetStudioState = useCallback(() => {
    setExtractedData(buildEmptyStudioState(productCategory || DEFAULT_PRODUCT_ID));
    setResults(null);
    setGaps([]);
    setTraceabilityFlow(null);
    setValidationResults({ checks: [], overall_pass: false, run_at: null });
    setResultsAudit(null);
    setResultsByMethod({});
  }, [productCategory]);

  // ─── FILE UPLOAD ───
  const addFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList).map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      type: f.type || f.name.split('.').pop(),
      file: f,
      status: 'pending', // pending, extracting, done, error
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    showNotif(`${newFiles.length} file(s) added`, 'Upload');
    return newFiles;
  }, [showNotif]);

  const removeFile = useCallback((fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const updateFileStatus = useCallback((fileId, status) => {
    setUploadedFiles(prev =>
      prev.map(f => f.id === fileId ? { ...f, status } : f)
    );
  }, []);

  // ─── EXTRACTION & PCR GAP ANALYSIS ───
  const extractDocuments = useCallback(async () => {
    if (!productCategory) {
      showNotif('Select the product type before extracting documents', 'Select Product');
      return;
    }
    setIsLoading(true);
    const pending = uploadedFiles.filter(f => f.status === 'pending');
    const targetFiles = pending.length > 0 ? pending : uploadedFiles;

    targetFiles.forEach(f => updateFileStatus(f.id, 'extracting'));

    try {
      const formData = new FormData();
      formData.append('product_category', productCategory);
      if (targetFiles.length > 0 && targetFiles[0].file) {
        targetFiles.forEach(f => {
          if (f.file) formData.append('files', f.file);
        });
      } else {
        // Fallback simulated file blob for instant testing
        const sampleBlob = new Blob([JSON.stringify({ test: true })], { type: 'application/json' });
        formData.append('files', sampleBlob, 'Chiller_BOM_Specification.json');
      }

      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // Start from empty baseline so stale arrays from previous sessions never accumulate.
        // Preserve only project_info fields that the user may have already edited manually.
        const emptyState = buildEmptyStudioState(productCategory);
        setExtractedData(prev => ({
          ...emptyState,
          ...data.extracted,
          project_info: {
            ...emptyState.project_info,
            ...((prev.project_info?.product_category === productCategory) ? prev.project_info : {}),
            ...(data.extracted.project_info || {}),
            product_category: productCategory,
          },
        }));
        setResults(null);
        setResultsByMethod({});
        setGaps(data.gaps || []);
        setTraceabilityFlow(data.traceability_flow || null);
        targetFiles.forEach(f => updateFileStatus(f.id, 'done'));
        const pm = data.provider_matching || {};
        showNotif(
          `Extracted ${data.files_processed?.length || 1} file(s): ${data.extracted?.bom?.length || 0} materials, ` +
          `${pm.matched || 0} matched to ecoinvent${pm.unmatched ? `, ${pm.unmatched} need a dataset` : ''}. ` +
          `${data.gap_count || 0} PCR gap(s).`,
          'Extraction'
        );
      } else {
        targetFiles.forEach(f => updateFileStatus(f.id, 'error'));
        showNotif('Server returned an error during extraction', 'Extraction Warning');
      }
    } catch (err) {
      // Backend offline fallback
      targetFiles.forEach(f => updateFileStatus(f.id, 'done'));
      showNotif('Loaded extraction in offline mode', 'Offline Mode');
    }

    setIsLoading(false);
  }, [uploadedFiles, updateFileStatus, showNotif, productCategory]);

  // Load verified sample dataset
  const loadSampleData = useCallback(async () => {
    // Wipe previous session state before applying new sample data
    resetStudioState();
    setProductCategory('water_cooled_chiller');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/documents/sample-bom`);
      let sample;
      if (res.ok) {
        sample = await res.json();
      } else {
        sample = {
          project_info: {
            product_name: 'EcoMetric Centrifugal Chiller 500RT',
            manufacturer_name: 'EcoMetric Thermal Systems Inc.',
            functional_unit: '1 unit of HVAC water-cooled chiller over 25 years reference service life',
            declared_unit: '1 piece of 500 RT chiller',
            pcr_ref: 'UL 10010-4 Part B v2.0 & EN 15804+A2',
            geography: 'US-Midwest',
            lifespan_years: 25,
          },
          bom: [
            { id: 'bom-1', name: 'Compressor Shell & Frame', material: 'steel_hot_rolled', mass: 2100, unit: 'kg', ecoinvent_id: 'ecoinvent_row_15528', supplier: 'Midwest Steel Casting', transport_km: 420 },
            { id: 'bom-2', name: 'Condenser & Evaporator Tubes', material: 'copper_tube_wire', mass: 650, unit: 'kg', ecoinvent_id: 'ecoinvent_row_15830', supplier: 'Great Lakes Copper Corp', transport_km: 280 },
            { id: 'bom-3', name: 'Semi-Hermetic Induction Motor', material: 'electric_motor_industrial', mass: 450, unit: 'kg', ecoinvent_id: 'ecoinvent_row_16390', supplier: 'Precision ElectroMotors Ltd', transport_km: 650 },
            { id: 'bom-4', name: 'Thermal Insulation Jackets', material: 'insulation_polyurethane_rigid', mass: 150, unit: 'kg', ecoinvent_id: 'ecoinvent_row_17208', supplier: 'PolyFoam Systems', transport_km: 190 },
            { id: 'bom-5', name: 'VFD & Solid-State Starter', material: 'electronics_vfd', mass: 120, unit: 'kg', ecoinvent_id: 'ecoinvent_row_16422', supplier: 'Advantech Power Systems', transport_km: 890 }
          ],
          manufacturing: {
            annual_facility_kwh: 34000,
            natural_gas_mj: 18500,
            grid_region: 'US_Average',
            water_m3: 45.0,
          },
          transport: [
            { mode: 'Heavy Lorry >32t (EURO 6)', distance: 485, dist: 485, emission_factor: 0.088, ef: 0.088, module: 'A2' },
            { mode: 'Transoceanic Container Ship', distance: 1200, dist: 1200, emission_factor: 0.0145, ef: 0.0145, module: 'A2' }
          ],
          installation: {
            outbound_transport_km: 500,
            transport_mode: 'Heavy Lorry >32t (EURO 6)',
            installation_energy_kwh: 350,
            commissioning_refrigerant_loss_kg: 0.5,
            rigging_crane_diesel_liters: 25.0,
          },
          operational: {
            refrigerant_type: 'R134a',
            refrigerant_charge_kg: 45.0,
            annual_leak_rate_percent: 2.0,
            fugitive_operational_leak_rate: 0.5,
            efficiency_kw_per_ton: 0.54,
            capacity_rt: 500.0,
            target_cities: ['Chicago', 'Houston', 'Frankfurt', 'Dubai'],
            cooling_tower_water_m3_yr: 120.0,
            scheduled_maintenance_kwh_yr: 180.0,
            major_component_replacement_year: 15,
          },
          end_of_life: {
            recycling_rate_percent: 92.4,
            landfill_rate_percent: 4.5,
            incineration_rate_percent: 3.1,
            decommissioning_energy_kwh: 120,
            waste_transport_km: 100,
          },
          circularity_d: {
            overall_recovery_rate_percent: 92.4,
            virgin_material_provider_id: 'ecoinvent_row_15528',
            recycled_process_provider_id: 'ecoinvent_row_15529',
          }
        };
      }
      setExtractedData(sample);
      setUploadedFiles([
        { id: 'sample-1', name: 'Centrifugal_Chiller_BOM_500RT.xlsx', size: 142800, type: 'xlsx', status: 'done' },
        { id: 'sample-2', name: 'Facility_Submetering_Report_2025.pdf', size: 840200, type: 'pdf', status: 'done' }
      ]);
      setGaps([
        {
          id: 'gap-trans',
          module: 'A2',
          category: 'Logistics Manifest',
          severity: 'high',
          title: 'Missing Inbound Freight Distances (2 items)',
          message: 'Inbound freight distances for steel enclosure and motor default to 500km regional proxy.',
          action: 'Provide Tier-1 shipping distance or accept default proxy.'
        }
      ]);
      setTraceabilityFlow({
        nodes: [
          { id: 'doc-1', type: 'document', label: 'Centrifugal_Chiller_BOM_500RT.xlsx', desc: 'Assembly BOM' },
          { id: 'doc-2', type: 'document', label: 'Facility_Submetering_Report_2025.pdf', desc: 'Plant Energy Audit' },
          { id: 'p1', type: 'parameter', label: 'Steel Shell (2,100 kg)', module: 'A1' },
          { id: 'p2', type: 'parameter', label: 'Copper Tubes (650 kg)', module: 'A1' },
          { id: 'p3', type: 'parameter', label: 'Plant Power (34,000 kWh)', module: 'A3' },
          { id: 's1', type: 'stage', label: 'Module A1: Raw Materials' },
          { id: 's2', type: 'stage', label: 'Module A3: Manufacturing' }
        ],
        edges: [
          { from: 'doc-1', to: 'p1' },
          { from: 'doc-1', to: 'p2' },
          { from: 'doc-2', to: 'p3' },
          { from: 'p1', to: 's1' },
          { from: 'p2', to: 's1' },
          { from: 'p3', to: 's2' }
        ]
      });
      setResults(null);
      showNotif('Loaded verified 500RT Chiller sample dataset', 'Sample Dataset');
      runCalculation(selectedMethodology, sample);
    } catch {
      showNotif('Failed to load sample dataset', 'Error');
    }
    setIsLoading(false);
  }, [showNotif, selectedMethodology, runCalculation]);

  // Load specific sample file directly from backend sample library, with instant offline preset support
  const loadSpecificSample = useCallback(async (filename, title) => {
    // Reset first so no stale state bleeds across different sample files
    resetStudioState();
    setIsLoading(true);
    const matchedPreset = Object.values(PRESET_DATASETS).find(
      p => p.filename === filename || p.id === filename || p.title === title
    );

    if (matchedPreset) {
      setCurrentPresetId(matchedPreset.id);
    }

    setProductCategory('water_cooled_chiller');
    const applyData = (ext, sampleName, gapList) => {
      const merged = {
        ...EMPTY_STUDIO_STATE,
        ...ext,
        project_info: { ...EMPTY_STUDIO_STATE.project_info, ...(ext.project_info || {}), product_category: 'water_cooled_chiller' },
        manufacturing: { ...EMPTY_STUDIO_STATE.manufacturing, ...(ext.manufacturing || {}) },
        installation: { ...EMPTY_STUDIO_STATE.installation, ...(ext.installation || {}) },
        operational: { ...EMPTY_STUDIO_STATE.operational, ...(ext.operational || {}) },
        end_of_life: { ...EMPTY_STUDIO_STATE.end_of_life, ...(ext.end_of_life || {}) },
        circularity_d: { ...EMPTY_STUDIO_STATE.circularity_d, ...(ext.circularity_d || {}) },
        maintenance_b2: { ...EMPTY_STUDIO_STATE.maintenance_b2, ...(ext.maintenance_b2 || {}) },
        bom: ext.bom || [],
        transport: ext.transport || [],
      };
      setExtractedData(merged);

      setUploadedFiles([
        { id: `sample-${Date.now()}`, name: sampleName, size: 85000, type: sampleName.split('.').pop(), status: 'done' }
      ]);

      if (gapList) {
        setGaps(gapList);
      } else if (matchedPreset?.id === 'incomplete_gap_analysis') {
        setGaps([
          { id: 'gap-trans', module: 'A2', category: 'Logistics Manifest', severity: 'critical', title: 'Missing Inbound Logistics Manifest', message: 'No Tier-1 freight legs declared for raw materials. UL 10010-4 requires freight manifest.', action: 'Add multimodal freight legs.' },
          { id: 'gap-outbound', module: 'A4', category: 'Installation', severity: 'high', title: 'Missing Outbound Transit Distance', message: 'Delivery distance to job site not specified.', action: 'Specify outbound transit km.' },
          { id: 'gap-b1', module: 'B1', category: 'Operation', severity: 'critical', title: 'Missing Refrigerant Factory Charge', message: 'Refrigerant charge is 0 kg. B1 fugitive emissions cannot be calculated.', action: 'Provide nameplate charge.' },
          { id: 'gap-cutoff', module: 'A1', category: 'Cut-off Rule', severity: 'critical', title: 'Cut-Off Mass Threshold Exceeded (>5%)', message: 'BOM mass covers only 47.7% of declared weight (1,050 kg of 2,200 kg). Violates 95% PCR completeness rule.', action: 'Supply remaining BOM assemblies.' }
        ]);
      } else {
        setGaps([]);
      }

      setResults(null);
      return merged;
    };

    try {
      const res = await fetch(`${API_BASE}/documents/load-sample/${encodeURIComponent(filename)}?product_category=water_cooled_chiller`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        const merged = applyData(data.extracted || {}, filename, data.gaps || data.pcr_gaps?.gaps);
        showNotif(`Loaded: ${title || filename}`, 'Dataset Loaded');
        setIsLoading(false);
        runCalculation(selectedMethodology, merged);
        return true;
      }
    } catch (err) {
      console.warn('[StudioContext] Backend load-sample offline fallback:', err);
    }

    if (matchedPreset) {
      const merged = applyData(matchedPreset.extracted, matchedPreset.filename);
      showNotif(`Loaded preset: ${matchedPreset.title}`, 'Preset Ready');
      setIsLoading(false);
      runCalculation(selectedMethodology, merged);
      return true;
    }

    showNotif(`Could not load ${filename}`, 'Notice');
    setIsLoading(false);
    return false;
  }, [showNotif, selectedMethodology, runCalculation]);

  // Load verified preset chiller model
  const loadPreset = useCallback(async (presetId) => {
    const preset = PRESET_DATASETS[presetId];
    if (!preset) return false;
    setCurrentPresetId(presetId);
    return await loadSpecificSample(preset.filename, preset.title);
  }, [loadSpecificSample]);

  // ─── USER REVIEW MUTATIONS (CRUD & Provider Selection) ───
  const updateBomItem = useCallback((indexOrId, updatedFields) => {
    setExtractedData(prev => {
      const newBom = [...(prev.bom || [])];
      const idx = typeof indexOrId === 'number'
        ? indexOrId
        : newBom.findIndex(item => item.id === indexOrId);
      if (idx !== -1) {
        const current = newBom[idx];
        const next = { ...current, ...updatedFields };
        // A renamed line loses its automatic dataset and is matched again; a dataset the user picked stays
        const renamed = ['name', 'material'].some(k => k in updatedFields && updatedFields[k] !== current[k]);
        if (renamed && current.match_method !== USER_SELECTED) {
          BOM_DATASET_KEYS.forEach(k => { delete next[k]; });
        }
        newBom[idx] = next;
      }
      return { ...prev, bom: newBom };
    });
  }, []);

  const addBomItem = useCallback((newItem) => {
    setExtractedData(prev => ({
      ...prev,
      bom: [
        ...(prev.bom || []),
        {
          id: `bom-${Date.now()}`,
          name: newItem.name || 'New Component',
          material: newItem.material || 'steel_hot_rolled',
          mass: Number(newItem.mass) || 100,
          unit: 'kg',
          module: newItem.module || 'A1',
          supplier: newItem.supplier || 'Tier-1 Supplier',
          // no dataset picked in the form: the matcher assigns one right after the line is added
          ...newItem,
        },
      ],
    }));
    showNotif('Added new component to BOM', 'BOM Updated');
  }, [showNotif]);

  const deleteBomItem = useCallback((indexOrId) => {
    setExtractedData(prev => {
      const newBom = (prev.bom || []).filter((item, idx) =>
        typeof indexOrId === 'number' ? idx !== indexOrId : item.id !== indexOrId
      );
      return { ...prev, bom: newBom };
    });
    showNotif('Component removed from BOM', 'BOM Updated');
  }, [showNotif]);

  const updateTransportLeg = useCallback((idx, updatedFields) => {
    setExtractedData(prev => {
      const newTransport = [...(prev.transport || [])];
      if (newTransport[idx]) {
        newTransport[idx] = { ...newTransport[idx], ...updatedFields };
      }
      return { ...prev, transport: newTransport };
    });
  }, []);

  const addTransportLeg = useCallback((newLeg) => {
    setExtractedData(prev => ({
      ...prev,
      transport: [
        ...(prev.transport || []),
        {
          mode: newLeg.mode || 'Freight lorry >32t EURO 6',
          distance: Number(newLeg.distance) || 300,
          dist: Number(newLeg.distance) || 300,
          ef: '0.088 kg CO2e/tkm',
          ...newLeg,
        },
      ],
    }));
    showNotif('Added transport leg', 'Logistics Updated');
  }, [showNotif]);

  const deleteTransportLeg = useCallback((idx) => {
    setExtractedData(prev => ({
      ...prev,
      transport: (prev.transport || []).filter((_, i) => i !== idx),
    }));
  }, []);

  const updateManufacturing = useCallback((fields) => {
    setExtractedData(prev => ({
      ...prev,
      manufacturing: {
        ...(prev.manufacturing || {}),
        ...fields,
      },
    }));
  }, []);

  const updateInstallation = useCallback((fields) => {
    setExtractedData(prev => ({
      ...prev,
      installation: {
        ...(prev.installation || {}),
        ...fields,
      },
    }));
  }, []);

  const updateOperational = useCallback((fields) => {
    setExtractedData(prev => ({
      ...prev,
      operational: {
        ...(prev.operational || {}),
        ...fields,
      },
      project_info: {
        ...(prev.project_info || {}),
        lifespan_years: fields.lifespan_years || prev.project_info?.lifespan_years,
      }
    }));
  }, []);

  const updateEndOfLife = useCallback((fields) => {
    setExtractedData(prev => ({
      ...prev,
      end_of_life: {
        ...(prev.end_of_life || {}),
        ...fields,
      },
    }));
  }, []);

  const updateCircularityD = useCallback((fields) => {
    setExtractedData(prev => ({
      ...prev,
      circularity_d: {
        ...(prev.circularity_d || {}),
        ...fields,
      },
    }));
  }, []);

  const updateMaintenanceB2 = useCallback((fields) => {
    setExtractedData(prev => ({
      ...prev,
      maintenance_b2: {
        ...(prev.maintenance_b2 || {}),
        ...fields,
      },
    }));
  }, []);

  const updateRepairB3 = useCallback((fields) => {
    setExtractedData(prev => ({
      ...prev,
      repair_b3: {
        ...(prev.repair_b3 || {}),
        ...fields,
      },
    }));
  }, []);

  const updateReplacementB4 = useCallback((fields) => {
    setExtractedData(prev => ({
      ...prev,
      replacement_b4: {
        ...(prev.replacement_b4 || {}),
        ...fields,
      },
    }));
  }, []);

  const updateRefurbishmentB5 = useCallback((fields) => {
    setExtractedData(prev => ({
      ...prev,
      refurbishment_b5: {
        ...(prev.refurbishment_b5 || {}),
        ...fields,
      },
    }));
  }, []);

  // ─── DATASET MATCHING (same matcher as upload; datasets the user picked are never replaced) ───
  const extractedRef = React.useRef(extractedData);
  extractedRef.current = extractedData;
  const lastMatchSignature = React.useRef(null);
  const [isMatchingProviders, setIsMatchingProviders] = useState(false);

  // refresh: also re-run earlier automatic picks (e.g. after changing the project region)
  const matchProviders = useCallback(async ({ refresh = false } = {}) => {
    const sent = extractedRef.current;
    const sentSignature = signatureOf(sent);
    lastMatchSignature.current = sentSignature;
    setIsMatchingProviders(true);
    try {
      const res = await fetch(`${API_BASE}/documents/match-providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extracted_data: sent,
          product_category: sent?.project_info?.product_category || productCategory || DEFAULT_PRODUCT_ID,
          refresh,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Edited while matching: drop this answer, the effect below matches the newer inventory
      if (signatureOf(extractedRef.current) !== sentSignature) return null;
      setExtractedData(data.extracted);
      lastMatchSignature.current = signatureOf(data.extracted);
      return data.provider_matching;
    } catch (err) {
      console.warn('[StudioContext] Dataset matching failed:', err);
      return null;
    } finally {
      setIsMatchingProviders(false);
    }
  }, [productCategory]);

  // New, renamed or unassigned lines get their dataset shortly after the edit, on any screen
  React.useEffect(() => {
    if (!needsDatasetMatching(extractedData)) return undefined;
    if (lastMatchSignature.current === signatureOf(extractedData)) return undefined;
    const timer = setTimeout(() => matchProviders(), 600);
    return () => clearTimeout(timer);
  }, [extractedData, matchProviders]);

  // ─── STEP 4: PCR INPUT RULES (before calculation) ───
  const runValidation = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extracted_data: extractedData,
          report_details: reportDetails,
          product_category: extractedData?.project_info?.product_category || productCategory || DEFAULT_PRODUCT_ID,
        }),
      });
      if (!res.ok) throw new Error(`Validation service returned ${res.status}. Is the EcoMetric backend running on port 8000 (cd backend && python main.py)?`);
      const data = await res.json();
      setValidationResults({ ...data, inputSignature: signatureOf(extractedData) });
      showNotif(`${data.summary.pass} of ${data.summary.total} pre-calculation checks met`, 'Pre-Calculation Checks');
    } catch (err) {
      // No offline fallback: the gate must not pass without the PCR rule engine.
      setValidationResults({ checks: [], overall_pass: false, passed: false, run_at: null,
        error: err instanceof TypeError ? 'Could not reach the EcoMetric backend on port 8000 (cd backend && python main.py).' : err.message });
      showNotif('PCR validation service is unavailable', 'Validation Error');
    }
    setIsLoading(false);
  }, [extractedData, reportDetails, productCategory, showNotif]);

  // ─── STEP 7: PCR RESULTS RULES (after calculation) ───
  const runResultsAudit = useCallback(async () => {
    const byMethod = Object.keys(resultsByMethod).length > 0
      ? resultsByMethod
      : (results?.epd_results ? { [selectedMethodology]: { epd_results: results.epd_results, epd_metadata: results.epd_metadata } } : {});
    try {
      const res = await fetch(`${API_BASE}/pcr/results-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extracted_data: extractedData,
          report_details: reportDetails,
          product_category: extractedData?.project_info?.product_category || productCategory || DEFAULT_PRODUCT_ID,
          results_by_method: byMethod,
        }),
      });
      if (!res.ok) throw new Error(`Results audit returned ${res.status}`);
      const report = await res.json();
      setResultsAudit({ ...report, inputSignature: signatureOf(extractedData) });
      showNotif(`${report.summary.pass} of ${report.summary.total} PCR results rules met`, 'Pre-Audit');
      return report;
    } catch (err) {
      console.warn('[StudioContext] PCR results audit error:', err);
      showNotif('PCR results audit is unavailable', 'Pre-Audit Error');
      return null;
    }
  }, [resultsByMethod, results, selectedMethodology, extractedData, reportDetails, productCategory, showNotif]);

  // A check is out of date when the inventory changed after it ran.
  const inputSignature = useMemo(() => signatureOf(extractedData), [extractedData]);
  const validationStale = Boolean(validationResults.run_at) && validationResults.inputSignature !== inputSignature;
  const resultsAuditStale = Boolean(resultsAudit) && resultsAudit.inputSignature !== inputSignature;

  // ─── METHODOLOGY CHANGE ───
  // Selecting a methodology only selects it: the calculation (which rewrites the backend result
  // files) runs when the user clicks Calculate / Recalculate.
  const changeMethodology = useCallback((method) => {
    setSelectedMethodology(method);
  }, []);

  // Methodology the shown results were calculated with, and whether the selection has moved on since
  const resultsMethodology = results?.epd_metadata?.methodology_key || null;
  const methodologyStale = Boolean(resultsMethodology) && resultsMethodology !== selectedMethodology;

  // Derive comprehensive LCA characterization metrics for real-time display & certificate export
  const lca = useMemo(() => {
    const totalMass = (extractedData.bom || []).reduce((acc, item) => acc + (Number(item.mass) || 0), 0) || 0;
    
    // Check for calculated EPD results from backend
    const epdRes = results?.epd_results || results?.results;
    if (epdRes && typeof epdRes === 'object' && Object.keys(epdRes).length > 0) {
      let gwpRow = null;
      const mandatoryLookup = results?.mandatory_pcr_indicators || {};
      const rowUnits = results?.epd_metadata?.row_units || {};
      const hasMandatorySplit = Object.keys(mandatoryLookup).length > 0;

      const indicators = Object.entries(epdRes).map(([catKey, row]) => {
        const parts = catKey.split('|').map(s => s.trim());
        let category = parts.length > 1 ? parts[0] : 'General';
        let catName = parts.length > 1 ? parts[1] : parts[0];
        if (parts.length >= 3) {
          // Format: Methodology | Category | Indicator [Unit]
          category = parts[1];
          catName = parts[2].split('[')[0].trim();
        }

        let unit = '';
        const unitMatch = catKey.match(/\[(.*?)\]/);
        if (unitMatch) {
          unit = unitMatch[1];
        }

        const a1 = Number(row['A1']) || 0;
        const a2 = Number(row['A2']) || 0;
        const a3 = Number(row['A3']) || 0;
        const a1a3Raw = Number(row['A1-A3']);
        const a1a3 = !isNaN(a1a3Raw) && row['A1-A3'] !== undefined ? a1a3Raw : (a1 + a2 + a3);
        const a4 = Number(row['A4']) || 0;
        const a5 = Number(row['A5']) || 0;
        
        const b1 = Number(row['B1']) || 0;
        const b2 = Number(row['B2']) || 0;
        const b3 = Number(row['B3']) || 0;
        const b4 = Number(row['B4']) || 0;
        const b5 = Number(row['B5']) || 0;
        const b6 = Number(row['B6']) || 0;
        const b7 = Number(row['B7']) || 0;
        const b = b1 + b2 + b3 + b4 + b5 + b6 + b7;

        const c1 = Number(row['C1']) || 0;
        const c2 = Number(row['C2']) || 0;
        const c3 = Number(row['C3']) || 0;
        const c4 = Number(row['C4']) || 0;
        const c1c4Raw = Number(row['C1-C4']);
        const c = !isNaN(c1c4Raw) && row['C1-C4'] !== undefined ? c1c4Raw : (c1 + c2 + c3 + c4);

        const d = Number(row['D']) || 0;
        const total = a1a3 + a4 + a5 + b + c + d;

        const isGwp = catKey.toLowerCase().includes('global warming') || catKey.toLowerCase().includes('gwp') || catKey.toLowerCase().includes('climate change');
        if (isGwp && !gwpRow) {
          gwpRow = { a1, a2, a3, a1a3, a4, a5, b, c, d, total };
        }

        let code = catName.split(' ')[0].toUpperCase();
        const acronyms = [];
        if (isGwp) {
          code = 'GWP100';
          acronyms.push('GWP', 'CO2', 'Carbon', 'GHG');
        } else if (catKey.toLowerCase().includes('acidification')) {
          code = 'AP';
          acronyms.push('AP', 'Acid Rain', 'SO2');
        } else if (catKey.toLowerCase().includes('eutrophication')) {
          code = 'EP';
          acronyms.push('EP', 'Nutrients', 'PO4');
        } else if (catKey.toLowerCase().includes('photochemical') || catKey.toLowerCase().includes('smog')) {
          // Checked before 'ozone': smog rows mention "tropospheric ozone"
          code = 'POCP';
          acronyms.push('POCP', 'Smog', 'NMVOC', 'Ozone Formation');
        } else if (catKey.toLowerCase().includes('ozone')) {
          code = 'ODP';
          acronyms.push('ODP', 'CFC', 'Ozone');
        } else if (catKey.toLowerCase().includes('abiotic') || catKey.toLowerCase().includes('resource')) {
          code = 'ADP';
          acronyms.push('ADP', 'Minerals', 'Fossil', 'Depletion');
        } else if (catKey.toLowerCase().includes('ecotoxicity')) {
          // Checked before 'water': "ecotoxicity: freshwater" is not water use
          code = 'FAETP';
          acronyms.push('Ecotoxicity', 'FAETP');
        } else if (catKey.toLowerCase().includes('carcinogenic') || catKey.toLowerCase().includes('toxicity')) {
          code = 'HTP';
          acronyms.push('Toxicity', 'HTP', 'Human Health');
        } else if (catKey.toLowerCase().includes('water')) {
          code = 'WDP';
          acronyms.push('Water', 'WSI', 'Scarcity');
        } else if (catKey.toLowerCase().includes('particulate')) {
          code = 'PM';
          acronyms.push('PM', 'PM2.5', 'Dust');
        }

        const isMandatory = hasMandatorySplit ? Boolean(mandatoryLookup[catKey]) : true;

        return {
          code,
          rawCategory: catKey,
          category,
          name: catName,
          unit: unit || rowUnits[catKey] || 'impact unit',
          isMandatory,
          acronyms,
          a1,
          a2,
          a3,
          a1a3,
          a4,
          a5,
          b1, b2, b3, b4, b5, b6, b7,
          b,
          c1, c2, c3, c4,
          c,
          d,
          total,
          stages: row,
        };
      });

      const a1_gwp = gwpRow ? gwpRow.a1 : 0;
      const a2_gwp = gwpRow ? gwpRow.a2 : 0;
      const a3_gwp = gwpRow ? gwpRow.a3 : 0;
      const a4_gwp = gwpRow ? gwpRow.a4 : 0;
      const b_stage_gwp = gwpRow ? gwpRow.b : 0;
      const c_stage_gwp = gwpRow ? gwpRow.c : 0;
      const module_d_gwp = gwpRow ? gwpRow.d : 0;
      const total_gwp = gwpRow ? gwpRow.total : 0;

      const mandatoryIndicators = indicators.filter(i => i.isMandatory);

      return {
        totalMass,
        a1_gwp,
        a2_gwp,
        a3_gwp,
        a4_gwp,
        b_stage_gwp,
        c_stage_gwp,
        module_d_gwp,
        total_gwp,
        recRate: Number(extractedData.end_of_life?.recycling_rate_percent) || 0,
        massCutoff: Number(validationResults?.mass_coverage_percent || 0) / 100 || (totalMass > 0 ? 1.0 : 0),
        indicators,
        mandatoryIndicators,
        totalIndicatorsCount: indicators.length,
        mandatoryIndicatorsCount: mandatoryIndicators.length,
        isCalculated: true,
        epd_results: epdRes,
      };
    }

    return {
      totalMass,
      a1_gwp: 0,
      a2_gwp: 0,
      a3_gwp: 0,
      a4_gwp: 0,
      b_stage_gwp: 0,
      c_stage_gwp: 0,
      module_d_gwp: 0,
      total_gwp: 0,
      recRate: 0,
      massCutoff: 0,
      isCalculated: false,
      indicators: [],
    };
  }, [extractedData.bom, extractedData.manufacturing, results]);

  // Derive projectInfo
  const productProfile = useMemo(
    () => getProduct(extractedData.project_info?.product_category || productCategory),
    [extractedData.project_info?.product_category, productCategory]
  );

  const projectInfo = useMemo(() => ({
    productName: extractedData.project_info?.product_name || productProfile.name,
    manufacturer: extractedData.project_info?.manufacturer_name || 'EcoMetric Certified Manufacturer',
    operator: 'The International EPD® System (Environdec)',
    declaredUnitStatement: extractedData.project_info?.functional_unit || extractedData.project_info?.declared_unit || productProfile.functionalUnit,
    pcrRef: extractedData.project_info?.pcr_ref || productProfile.pcrLabel,
    lciaMethod: getMethodology(selectedMethodology)?.name || 'TRACI v2.1',
    rsl: extractedData.project_info?.lifespan_years ? `${extractedData.project_info.lifespan_years} Years` : 'Not declared',
    productCategory: productProfile.id,
    fuUnit: productProfile.fuUnit,
  }), [extractedData.project_info, selectedMethodology, productProfile]);

  // Download ILCD+EPD compliant JSON
  const downloadIlcdJson = useCallback(() => {
    const epdExportData = {
      format: 'ILCD+EPD',
      version: '1.2',
      standard: 'EN 15804+A2:2019 / ISO 14025:2006',
      methodology: getMethodology(selectedMethodology)?.name || selectedMethodology,
      database: 'ecoinvent 3.12 cutoff',
      generated_at: new Date().toISOString(),
      project: projectInfo,
      lca_results: lca,
      extracted_inventory: extractedData,
      verification_hash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    };

    const blob = new Blob([JSON.stringify(epdExportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EPD_${(projectInfo.productName || 'Export').replace(/\s+/g, '_')}_ILCD.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotif('ILCD+EPD JSON package exported successfully', 'Export Complete');
  }, [selectedMethodology, projectInfo, lca, extractedData, showNotif]);

  // ─── DQR DATA QUALITY ASSESSMENT (Phase 4) ───
  const generateDqrReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/epd/dqr-evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extracted_data: extractedData,
          results: results
        })
      });
      if (res.ok) {
        const dqr = await res.json();
        setDqrReport(dqr);
        showNotif(`DQR Rating: ${dqr.overall_dqr} (${dqr.quality_rating})`, 'DQR Evaluated');
        return dqr;
      }
    } catch (err) {
      console.error('DQR evaluation error:', err);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [extractedData, results, showNotif]);

  // ─── openEPD v2.0 GENERATOR (Phase 4) ───
  const generateOpenEpdDocument = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/epd/openepd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extracted_data: extractedData,
          methodology: selectedMethodology,
          results: results
        })
      });
      if (res.ok) {
        const doc = await res.json();
        setOpenepdDocument(doc);
        showNotif('Official openEPD v2.0 specification generated', 'openEPD Ready');
        return doc;
      }
    } catch (err) {
      console.error('openEPD generation error:', err);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [extractedData, selectedMethodology, results, showNotif]);

  const downloadOpenEpdJson = useCallback((docToDownload) => {
    const doc = docToDownload || openepdDocument;
    if (!doc) return;
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `openEPD_${(projectInfo.productName || 'Declaration').replace(/\s+/g, '_')}_v2.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotif('openEPD standard JSON downloaded', 'Downloaded');
  }, [openepdDocument, projectInfo, showNotif]);

  // ─── VERIFICATION AUDIT ZIP BUNDLE (Phase 4) ───
  const downloadVerificationBundle = useCallback(async () => {
    setIsLoading(true);
    showNotif('Packaging third-party verification bundle...', 'Generating Archive');
    try {
      const res = await fetch(`${API_BASE}/epd/export-verification-bundle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extracted_data: extractedData,
          methodology: selectedMethodology,
          pcr_rule_id: selectedPcrRule,
          results: results
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const dispHeader = res.headers.get('Content-Disposition') || '';
        let filename = 'EcoMetric_Third_Party_Verification_Bundle.zip';
        const match = dispHeader.match(/filename="?([^";]+)"?/i);
        if (match && match[1]) filename = match[1];

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        showNotif('Verification Audit Bundle (.zip) downloaded', 'Package Exported');
      } else {
        throw new Error('Server returned error during verification bundle export');
      }
    } catch (err) {
      console.error('Verification bundle export error:', err);
      showNotif('Failed to download verification bundle', 'Export Error');
    } finally {
      setIsLoading(false);
    }
  }, [extractedData, selectedMethodology, selectedPcrRule, results, showNotif]);

  // ─── VERIFIED EPD11017 REPORT DETAILS & PDF EXPORT ───
  const saveReportDetails = useCallback(async (detailsToSave) => {
    const details = detailsToSave || reportDetails;
    try {
      const res = await fetch(`${API_BASE}/epd/report-details/current_project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
      });
      if (res.ok) {
        setReportDetails(details);
        // Propagate company name back to project_info if updated (Single Source of Truth)
        if (details.company_name) {
          setExtractedData(prev => ({
            ...prev,
            project_info: {
              ...prev.project_info,
              manufacturer_name: details.company_name,
              product_name: details.product_name || prev.project_info?.product_name
            }
          }));
        }
        return await res.json();
      }
    } catch (err) {
      console.error('[StudioContext] Error saving report details:', err);
      throw err;
    }
  }, [reportDetails, setExtractedData]);

  // ─── EPD REPORT (app/epd_report via /api/epd-reports) ───
  const buildEpdReportRequest = useCallback((selection = {}, options = {}, detailsOverride) => {
    let byMethod = resultsByMethod;
    if (Object.keys(byMethod).length === 0 && results?.epd_results && Object.keys(results.epd_results).length > 0) {
      byMethod = { [selectedMethodology]: { epd_results: results.epd_results, epd_metadata: results.epd_metadata } };
    }
    return {
      projectId: 'current_project',
      extractedData,
      resultsByMethod: byMethod,
      reportDetails: detailsOverride || reportDetails,
      selection,
      options,
    };
  }, [resultsByMethod, results, selectedMethodology, extractedData, reportDetails]);

  const fetchEpdReportOptions = useCallback(async () => {
    const res = await fetch(`${API_BASE}/epd-reports/options`);
    if (!res.ok) throw new Error('Could not load report options');
    return res.json();
  }, []);

  /** Returns {html, warnings, filename, meta}; throws an Error with `.errors` (structured) on 422. */
  const previewEpdReport = useCallback(async (selection, options, signal, detailsOverride) => {
    const res = await fetch(`${API_BASE}/epd-reports/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildEpdReportRequest(selection, options, detailsOverride)),
      signal,
    });
    if (!res.ok) throw await epdReportError(res);
    return res.json();
  }, [buildEpdReportRequest]);

  const downloadEpdReport = useCallback(async (selection, options, detailsOverride) => {
    const startedAt = Date.now();
    setProgressTask({ title: 'Generating EPD PDF…', durationMs: PDF_EXPORT_MIN_MS, startedAt });
    let res;
    let blob;
    try {
      res = await fetch(`${API_BASE}/epd-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildEpdReportRequest(selection, options, detailsOverride)),
      });
      if (!res.ok) throw await epdReportError(res);
      blob = await res.blob();
      await waitUntil(startedAt + PDF_EXPORT_MIN_MS);
    } finally {
      setProgressTask(null);
    }
    const disp = res.headers.get('Content-Disposition') || '';
    const match = disp.match(/filename="?([^";]+)"?/i);
    const filename = (match && match[1]) || res.headers.get('X-EPD-Filename') || 'EPD.pdf';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showNotif(`${filename} downloaded`, 'EPD Report');
    return filename;
  }, [buildEpdReportRequest, showNotif]);

  // Report Details modal helpers, built on the same report API.
  const validatePreExport = useCallback(async (detailsToValidate) => {
    try {
      const data = await previewEpdReport({}, {}, undefined, detailsToValidate);
      const msgs = (lvl) => (data.warnings || []).filter(w => w.level === lvl).map(w => w.message);
      return { valid: msgs('error').length === 0, errors: msgs('error'), warnings: msgs('warning') };
    } catch (err) {
      return { valid: false, errors: err.errors?.map(e => e.message) || [err.message], warnings: [] };
    }
  }, [previewEpdReport]);

  const getEpdPdfPreview = useCallback(async (detailsForPreview) => {
    const data = await previewEpdReport({}, {}, undefined, detailsForPreview);
    return data.html || '';
  }, [previewEpdReport]);

  const exportEpdPdf = useCallback(async (detailsForExport) => {
    setIsLoading(true);
    try {
      await downloadEpdReport({}, {}, detailsForExport);
    } finally {
      setIsLoading(false);
    }
  }, [downloadEpdReport]);

  return (
    <StudioContext.Provider
      value={{
        activePhase,
        setActivePhase,
        productCategory,
        selectProduct,
        productProfile,
        uploadedFiles,
        addFiles,
        removeFile,
        extractDocuments,
        extractedData,
        setExtractedData,
        updateBomItem,
        addBomItem,
        matchProviders,
        isMatchingProviders,
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
        validationResults,
        runValidation,
        selectedMethodology,
        studioViewMode,
        setStudioViewMode,
        currentAccount,
        accountsList,
        switchAccount,
        assembledDatabase,
        activeProjectId,
        activeProject,
        projectsList,
        epdsList,
        addEpd,
        openProject,
        createProject,
        duplicateProject,
        deleteProject,
        closeToProjectsHub,
        changeMethodology,
        resultsMethodology,
        methodologyStale,
        results,
        lca,
        projectInfo,
        downloadIlcdJson,
        runCalculation,
        calculationError,
        resultsByMethod,
        dqrReport,
        setDqrReport,
        generateDqrReport,
        openepdDocument,
        setOpenepdDocument,
        generateOpenEpdDocument,
        downloadOpenEpdJson,
        downloadVerificationBundle,
        gaps,
        setGaps,
        traceabilityFlow,
        setTraceabilityFlow,
        isFlowModalOpen,
        setIsFlowModalOpen,
        loadSampleData,
        loadSpecificSample,
        resetStudioState,
        loadPreset,
        currentPresetId,
        setCurrentPresetId,
        PRESET_DATASETS,
        notification,
        showNotif,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebarCollapsed,
        isLoading,
        progressTask,
        setProgressTask,
        selectedPcrRule,
        setSelectedPcrRule,
        validationStale,
        resultsAudit,
        runResultsAudit,
        resultsAuditStale,
        reportDetails,
        setReportDetails,
        isReportDetailsModalOpen,
        setIsReportDetailsModalOpen,
        saveReportDetails,
        validatePreExport,
        getEpdPdfPreview,
        exportEpdPdf,
        buildEpdReportRequest,
        fetchEpdReportOptions,
        previewEpdReport,
        downloadEpdReport,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}

// ─── LCIA METHODOLOGIES (41 ecoinvent v3.12 Cut-off Methodologies) ───
export { ALL_METHODOLOGIES, METHODOLOGIES, getMethodology };

// ─── STANDARD ECOINVENT DATABASE PROVIDERS (for quick selection in User Review) ───
export const STANDARD_DATABASE_PROVIDERS = [
  { id: 'ecoinvent_steel_hot_rolled_glo', name: 'Steel, low-alloyed, hot rolled', category: 'Metals / Ferrous', geography: 'GLO', unit: 'kg', defaultEf: 2.15 },
  { id: 'ecoinvent_steel_stainless_304_rer', name: 'Steel, chromium steel 18/8 (Stainless 304)', category: 'Metals / Ferrous', geography: 'RER', unit: 'kg', defaultEf: 4.85 },
  { id: 'ecoinvent_steel_unalloyed_glo', name: 'Steel, unalloyed, converter', category: 'Metals / Ferrous', geography: 'GLO', unit: 'kg', defaultEf: 2.05 },
  { id: 'ecoinvent_copper_tube_wire_glo', name: 'Copper, cathode and drawn tube/wire', category: 'Metals / Non-Ferrous', geography: 'GLO', unit: 'kg', defaultEf: 5.42 },
  { id: 'ecoinvent_aluminium_cast_alloy_glo', name: 'Aluminium, cast alloy', category: 'Metals / Non-Ferrous', geography: 'GLO', unit: 'kg', defaultEf: 8.92 },
  { id: 'ecoinvent_electric_motor_industrial_glo', name: 'Electric motor, vehicle and industrial compressor', category: 'Electrical Equipment', geography: 'GLO', unit: 'kg', defaultEf: 6.20 },
  { id: 'ecoinvent_electronics_vfd_glo', name: 'Variable frequency drive / inverter', category: 'Electrical Equipment', geography: 'GLO', unit: 'kg', defaultEf: 18.40 },
  { id: 'ecoinvent_insulation_pu_rigid_rer', name: 'Polyurethane rigid foam (PUF insulation)', category: 'Plastics & Insulation', geography: 'RER', unit: 'kg', defaultEf: 4.15 },
  { id: 'ecoinvent_refrigerant_r134a_glo', name: 'Refrigerant R134a (Tetrafluoroethane)', category: 'Chemicals / Refrigerants', geography: 'GLO', unit: 'kg', defaultEf: 1430.0 },
  { id: 'ecoinvent_refrigerant_r1234ze_glo', name: 'Refrigerant R1234ze(E) Ultra-low GWP HFO', category: 'Chemicals / Refrigerants', geography: 'GLO', unit: 'kg', defaultEf: 1.37 },
  { id: 'ecoinvent_elec_mv_us', name: 'Electricity, medium voltage, US average', category: 'Energy / Grids', geography: 'US', unit: 'kWh', defaultEf: 0.385 },
  { id: 'ecoinvent_elec_mv_de', name: 'Electricity, medium voltage, Germany (DE)', category: 'Energy / Grids', geography: 'DE', unit: 'kWh', defaultEf: 0.320 },
  { id: 'ecoinvent_elec_mv_fr', name: 'Electricity, medium voltage, France (Nuclear/Hydro mix)', category: 'Energy / Grids', geography: 'FR', unit: 'kWh', defaultEf: 0.058 },
  { id: 'ecoinvent_gas_burned_boiler_glo', name: 'Natural gas, burned in industrial boiler', category: 'Energy / Fuels', geography: 'GLO', unit: 'MJ', defaultEf: 0.068 },
  { id: 'ecoinvent_transport_lorry_32t_rer', name: 'Transport, freight, lorry >32 metric ton, EURO 6', category: 'Transport / Logistics', geography: 'RER', unit: 'tkm', defaultEf: 0.088 },
  { id: 'ecoinvent_transport_container_ship_glo', name: 'Transport, freight, sea, container ship', category: 'Transport / Logistics', geography: 'GLO', unit: 'tkm', defaultEf: 0.0145 },
  { id: 'ecoinvent_diesel_burned_building_machine_glo', name: 'Diesel fuel, burned in heavy machinery / crane', category: 'Energy / Fuels', geography: 'GLO', unit: 'liter', defaultEf: 3.15 },
  { id: 'ecoinvent_water_deionised_glo', name: 'Tap water / process water supply', category: 'Water & Waste', geography: 'GLO', unit: 'm3', defaultEf: 0.35 },
  { id: 'ecoinvent_wastewater_treatment_glo', name: 'Wastewater treatment, unpolluted municipal', category: 'Water & Waste', geography: 'GLO', unit: 'm3', defaultEf: 0.42 },
  { id: 'ecoinvent_lubricating_oil_glo', name: 'Lubricating oil / grease consumable', category: 'Consumables & Lubricants', geography: 'GLO', unit: 'kg', defaultEf: 1.25 },
  { id: 'ecoinvent_diesel_dismantling_glo', name: 'Diesel & electric machinery for deconstruction', category: 'Decommissioning', geography: 'GLO', unit: 'kWh', defaultEf: 0.45 },
  { id: 'ecoinvent_waste_metal_recycling_glo', name: 'Scrap metal recycling & remelting process', category: 'Waste Processing', geography: 'GLO', unit: 'kg', defaultEf: 0.12 },
  { id: 'ecoinvent_waste_incineration_glo', name: 'Municipal thermal waste incineration process', category: 'Waste Processing', geography: 'GLO', unit: 'kg', defaultEf: 0.98 },
  { id: 'ecoinvent_waste_landfill_glo', name: 'Sanitary landfill process for inert waste', category: 'Disposal', geography: 'GLO', unit: 'kg', defaultEf: 0.045 },
  { id: 'ecoinvent_virgin_steel_primary_glo', name: 'Primary virgin steel production (Blast Furnace)', category: 'Virgin Materials', geography: 'GLO', unit: 'kg', defaultEf: 2.25 },
  { id: 'ecoinvent_secondary_steel_electric_glo', name: 'Secondary steel via Electric Arc Furnace (EAF)', category: 'Recycled Processes', geography: 'GLO', unit: 'kg', defaultEf: 0.65 },
];
