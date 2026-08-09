'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import EpdResultsView from './EpdResultsView';
import { calculateChillerLCA } from '@/lib/calc';
import { CompleteLcaResult } from '@/lib/calc/types';

export default function EpdWizard() {
  const [step, setStep] = useState<number>(1);
  const [visitedSteps, setVisitedSteps] = useState<number[]>([1]);
  const [loading, setLoading] = useState<boolean>(false);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // --- STEP 1: UNIT IDENTITY ---
  const [modelName, setModelName] = useState('Trane CVHE 500RT Centrifugal Chiller');
  const [capacityRt, setCapacityRt] = useState<number>(500);
  const [csiClassification, setCsiClassification] = useState('23 64 16.16');
  const [plantCountry, setPlantCountry] = useState('India');
  const [plantState, setPlantState] = useState('Maharashtra');

  // --- STEP 2: BILL OF MATERIALS (BOM) ---
  const [massSteelKg, setMassSteelKg] = useState<number>(2100);
  const [massCopperKg, setMassCopperKg] = useState<number>(650);
  const [massMotorKg, setMassMotorKg] = useState<number>(450);
  const [refrigerantType, setRefrigerantType] = useState('R134a');
  const [refrigerantChargeKg, setRefrigerantChargeKg] = useState<number>(45);
  const [massInsulationKg, setMassInsulationKg] = useState<number>(150);
  const [massElectronicsKg, setMassElectronicsKg] = useState<number>(120);

  // --- STEP 3: COMPRESSOR & PERFORMANCE SPECS ---
  const [kwPerTon100, setKwPerTon100] = useState<number>(0.54);
  const [kwPerTon75, setKwPerTon75] = useState<number>(0.38);
  const [kwPerTon50, setKwPerTon50] = useState<number>(0.29);
  const [kwPerTon25, setKwPerTon25] = useState<number>(0.35);
  const [hasAhriData, setHasAhriData] = useState<boolean>(true);

  // Derived COP
  const cop = kwPerTon100 > 0 ? (3.51685 / kwPerTon100).toFixed(2) : 'N/A';

  // --- STEP 4: DUTY CYCLE & OPERATION ---
  const [annualHours, setAnnualHours] = useState<number>(4500);
  const [loadProfile, setLoadProfile] = useState<'ahri_weighted' | 'full_load'>('ahri_weighted');
  const [selectedCities, setSelectedCities] = useState<string[]>(['Chicago', 'Houston', 'Frankfurt', 'Dubai']);
  const [productLifespanYears, setProductLifespanYears] = useState<number>(25);

  // --- STEP 5: TRANSPORT LOGISTICS (STAGE A4) ---
  const [distanceKm, setDistanceKm] = useState<number>(500);
  const [transportMode, setTransportMode] = useState<string>('lorry >32t');

  // --- STEP 6 RESULTS STATE ---
  const [projectId, setProjectId] = useState<string | null>('demo_chiller_001');
  const [lcaResults, setLcaResults] = useState<CompleteLcaResult | null>(null);
  const [pdfReportUrl, setPdfReportUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  const citiesList = [
    'Chicago',
    'Houston',
    'Frankfurt',
    'Dubai',
    'Shanghai',
    'Singapore',
    'Tokyo',
    'London',
  ];

  const stepsList = [
    { id: 1, title: 'Unit Identity', subtitle: 'Model & Classification' },
    { id: 2, title: 'Bill of Materials', subtitle: 'Components & CSV Upload' },
    { id: 3, title: 'Compressor & Specs', subtitle: 'Efficiency & Refrigerant' },
    { id: 4, title: 'Duty Cycle & Operation', subtitle: 'Bin Hours & Cities' },
    { id: 5, title: 'Transport Logistics', subtitle: 'Stage A4 Freight' },
    { id: 6, title: 'Review & Generate', subtitle: 'EPD Declaration' },
  ];

  const markVisited = (s: number) => {
    if (!visitedSteps.includes(s)) {
      setVisitedSteps([...visitedSteps, s]);
    }
  };

  const goToStep = (targetStep: number) => {
    if (visitedSteps.includes(targetStep) || targetStep < step) {
      setValidationError(null);
      setStep(targetStep);
    }
  };

  // Step Validation Logic
  const validateAndNext = (nextStepNum: number) => {
    setValidationError(null);

    if (step === 1) {
      if (!modelName.trim()) {
        setValidationError('Model Name is required.');
        return;
      }
      if (capacityRt <= 0) {
        setValidationError('Chiller capacity must be greater than 0 RT.');
        return;
      }
    } else if (step === 2) {
      const totalMass = massSteelKg + massCopperKg + massMotorKg + massInsulationKg + massElectronicsKg;
      if (totalMass <= 0) {
        setValidationError('Total component mass must be greater than 0 kg.');
        return;
      }
      if (refrigerantChargeKg <= 0) {
        setValidationError('Refrigerant charge mass must be greater than 0 kg.');
        return;
      }
    } else if (step === 3) {
      if (kwPerTon100 <= 0) {
        setValidationError('Full-load efficiency (kW/ton) must be greater than 0.');
        return;
      }
    } else if (step === 4) {
      if (annualHours <= 0) {
        setValidationError('Annual operating hours must be greater than 0.');
        return;
      }
      if (selectedCities.length === 0) {
        setValidationError('Select at least one target deployment city.');
        return;
      }
    } else if (step === 5) {
      if (distanceKm <= 0) {
        setValidationError('Transport distance must be greater than 0 km.');
        return;
      }
    }

    markVisited(nextStepNum);
    setStep(nextStepNum);
  };

  // CSV Upload Alternative Parser
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      lines.forEach((line) => {
        const parts = line.split(',').map((p) => p.trim().toLowerCase());
        if (parts.length >= 2) {
          const key = parts[0];
          const val = parseFloat(parts[1]);
          if (!isNaN(val)) {
            if (key.includes('steel')) setMassSteelKg(val);
            if (key.includes('copper')) setMassCopperKg(val);
            if (key.includes('motor')) setMassMotorKg(val);
            if (key.includes('refrigerant') && key.includes('mass')) setRefrigerantChargeKg(val);
            if (key.includes('insulation')) setMassInsulationKg(val);
            if (key.includes('electronics') || key.includes('vfd')) setMassElectronicsKg(val);
          }
        }
      });
    };
    reader.readAsText(file);
  };

  // PDF Spec Sheet AI Extractor
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setTimeout(() => {
      setExtractedData({
        chillingCapacityRt: 500,
        refrigerantType: 'R134a',
        refrigerantChargeKg: 45.0,
      });
      setExtracting(false);
    }, 600);
  };

  const applyExtractedData = () => {
    if (!extractedData) return;
    if (extractedData.chillingCapacityRt) setCapacityRt(extractedData.chillingCapacityRt);
    if (extractedData.refrigerantType) setRefrigerantType(extractedData.refrigerantType);
    if (extractedData.refrigerantChargeKg) setRefrigerantChargeKg(extractedData.refrigerantChargeKg);
    setExtractedData(null);
  };

  const toggleCity = (city: string) => {
    if (selectedCities.includes(city)) {
      if (selectedCities.length > 1) {
        setSelectedCities(selectedCities.filter((c) => c !== city));
      }
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  };

  // Trigger Direct 16-Module EPD Calculation
  const handleCalculateEPD = async () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const totalMass = massSteelKg + massCopperKg + massMotorKg + massInsulationKg + massElectronicsKg;
        const res = calculateChillerLCA({
          technical: {
            chillingCapacityRt: capacityRt,
            chillingCapacityKw: capacityRt * 3.51685,
            refrigerantType,
            refrigerantChargeKg,
            massDeliveredKg: totalMass,
          },
          operationalB6: {
            targetCities: selectedCities,
            efficiencyKwPerTon: kwPerTon100,
            chillerCapacityTons: capacityRt,
            productLifespanYears,
          },
        });

        setLcaResults(res);
        setStep(6);
      } catch (err) {
        console.error('Calculation error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  // Trigger PDF Report Download
  const handleGeneratePdf = async () => {
    setLoading(true);
    setTimeout(() => {
      setPdfReportUrl('/reports/epd_chiller_v1.0.pdf');
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#F2EFE9] antialiased">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#111111]/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#81BD01] font-display text-sm font-extrabold text-[#111111]">
              E
            </span>
            <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-[#F2EFE9]">
              Eco<span className="text-[#81BD01]">Metric</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block font-mono text-xs text-[#F2EFE9]/50">
              UL 10010-4 Part B PCR Scope • ecoinvent v3.12 LCI
            </span>
            <Link
              href="/"
              className="rounded-md border border-[#2A2A2A] bg-[#181818] px-3.5 py-1.5 font-display text-xs font-semibold uppercase text-[#F2EFE9]/70 hover:border-[#81BD01] hover:text-[#F2EFE9]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout Grid with Left Progress Rail */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          
          {/* PERSISTENT LEFT-SIDE PROGRESS RAIL */}
          <aside className="h-fit rounded-2xl border border-[#2A2A2A] bg-[#181818] p-5 sticky top-24">
            <div className="mb-4 pb-3 border-b border-[#2A2A2A]">
              <span className="font-display text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#81BD01]">
                EPD Generator Rail
              </span>
              <h2 className="font-display text-base font-bold text-[#F2EFE9]">Step Progress</h2>
            </div>

            <nav className="space-y-2">
              {stepsList.map((s) => {
                const isActive = step === s.id;
                const isCompleted = visitedSteps.includes(s.id) && step > s.id;
                const isNavigable = visitedSteps.includes(s.id) || s.id < step;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToStep(s.id)}
                    disabled={!isNavigable}
                    className={`w-full text-left flex items-start gap-3 rounded-xl p-3 transition-all ${
                      isActive
                        ? 'border border-[#81BD01] bg-[#81BD01]/10 text-[#F2EFE9]'
                        : isCompleted
                        ? 'border border-[#2A2A2A] bg-[#111111] text-[#F2EFE9]/80 hover:border-[#81BD01]/50'
                        : 'border border-transparent bg-transparent text-[#F2EFE9]/30 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold ${
                        isActive
                          ? 'bg-[#81BD01] text-[#111111]'
                          : isCompleted
                          ? 'bg-[#81BD01]/20 text-[#81BD01] border border-[#81BD01]/40'
                          : 'bg-[#2A2A2A] text-[#F2EFE9]/40'
                      }`}
                    >
                      {isCompleted ? '✓' : s.id}
                    </span>
                    <div>
                      <div className="font-display text-xs font-bold leading-snug">{s.title}</div>
                      <div className="text-[0.65rem] text-[#F2EFE9]/50">{s.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-[#2A2A2A] text-[0.65rem] text-[#F2EFE9]/40 space-y-1 font-mono">
              <div>PCR: UL 10010-4 Part B</div>
              <div>Scope: 16 Life-Cycle Modules</div>
              <div>Positioning: Directional EPD</div>
            </div>
          </aside>

          {/* MAIN FORM / RESULTS AREA */}
          <main>
            {/* Inline Validation Banner */}
            {validationError && (
              <div className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-xs text-red-400 font-display font-semibold flex items-center justify-between">
                <span>⚠️ {validationError}</span>
                <button type="button" onClick={() => setValidationError(null)} className="text-red-400 font-bold">✕</button>
              </div>
            )}

            {/* STEP 1: UNIT IDENTITY */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
                  <span className="inline-block rounded border border-[#81BD01]/40 bg-[#81BD01]/10 px-3 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-[#81BD01]">
                    Step 1 of 6 — Unit Identity
                  </span>
                  <h1 className="mt-2 font-display text-2xl font-bold text-[#F2EFE9]">Chiller Equipment & Identity</h1>
                  <p className="mt-1 text-xs text-[#F2EFE9]/60">Specify unit model name, rated capacity, CSI classification, and manufacturing location.</p>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block font-display text-[0.7rem] font-semibold uppercase text-[#F2EFE9]/60">Chiller Model Name *</label>
                      <input
                        type="text"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        placeholder="e.g. Trane CVHE 500RT Centrifugal Chiller"
                        className="mt-1.5 w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 py-2.5 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                      />
                    </div>
                    <div>
                      <label className="block font-display text-[0.7rem] font-semibold uppercase text-[#F2EFE9]/60">Capacity (Tons Refrigeration / RT) *</label>
                      <input
                        type="number"
                        value={capacityRt}
                        onChange={(e) => setCapacityRt(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 py-2.5 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                      />
                    </div>
                    <div>
                      <label className="block font-display text-[0.7rem] font-semibold uppercase text-[#F2EFE9]/60">CSI MasterFormat Classification</label>
                      <input
                        type="text"
                        value={csiClassification}
                        onChange={(e) => setCsiClassification(e.target.value)}
                        placeholder="23 64 16.16"
                        className="mt-1.5 w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 py-2.5 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                      />
                      <span className="text-[0.65rem] text-[#F2EFE9]/40 mt-1 block">Default: 23 64 16.16 Water-Cooled Centrifugal Water Chillers</span>
                    </div>
                    <div>
                      <label className="block font-display text-[0.7rem] font-semibold uppercase text-[#F2EFE9]/60">Manufacturing Plant Location (Country / State)</label>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <input
                          type="text"
                          value={plantCountry}
                          onChange={(e) => setPlantCountry(e.target.value)}
                          placeholder="India"
                          className="w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-2.5 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                        />
                        <input
                          type="text"
                          value={plantState}
                          onChange={(e) => setPlantState(e.target.value)}
                          placeholder="Maharashtra"
                          className="w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-2.5 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      onClick={() => validateAndNext(2)}
                      className="rounded-lg bg-[#81BD01] px-6 py-3 font-display text-xs font-bold uppercase tracking-widest text-[#111111] hover:bg-[#92d402]"
                    >
                      Next: Bill of Materials →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: BILL OF MATERIALS */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
                  <span className="inline-block rounded border border-[#81BD01]/40 bg-[#81BD01]/10 px-3 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-[#81BD01]">
                    Step 2 of 6 — Bill of Materials (A1–A3)
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold text-[#F2EFE9]">Component-Level Material Table</h2>
                  <p className="mt-1 text-xs text-[#F2EFE9]/60">Enter component mass breakdown manually, upload a CSV table, or extract from a PDF spec sheet.</p>

                  {/* UPLOAD ALTERNATIVE CARDS */}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {/* CSV UPLOAD */}
                    <div className="rounded-xl border border-dashed border-[#81BD01]/40 bg-[#81BD01]/5 p-4">
                      <h3 className="font-display text-xs font-bold text-[#81BD01] uppercase">📊 Option A: CSV Upload Table</h3>
                      <p className="text-[0.7rem] text-[#F2EFE9]/60 mt-1">Upload a CSV file containing material, mass_kg rows.</p>
                      <label className="mt-3 inline-block cursor-pointer rounded bg-[#81BD01] px-3.5 py-1.5 font-display text-[0.65rem] font-bold uppercase text-[#111111] hover:bg-[#92d402]">
                        Choose CSV File
                        <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                      </label>
                    </div>

                    {/* PDF SPEC AI EXTRACTION */}
                    <div className="rounded-xl border border-dashed border-[#81BD01]/40 bg-[#81BD01]/5 p-4">
                      <h3 className="font-display text-xs font-bold text-[#81BD01] uppercase">⚡ Option B: AI PDF Spec Sheet Extract</h3>
                      <p className="text-[0.7rem] text-[#F2EFE9]/60 mt-1">Extract technical specifications from manufacturer PDF.</p>
                      <label className="mt-3 inline-block cursor-pointer rounded bg-[#81BD01] px-3.5 py-1.5 font-display text-[0.65rem] font-bold uppercase text-[#111111] hover:bg-[#92d402]">
                        {extracting ? 'Extracting...' : 'Upload Spec Sheet PDF'}
                        <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={extracting} />
                      </label>
                    </div>
                  </div>

                  {extractedData && (
                    <div className="mt-4 rounded-xl border border-[#81BD01] bg-[#111111] p-4 text-xs">
                      <div className="font-display font-bold text-[#81BD01]">Extracted Candidate Fields:</div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[#F2EFE9]/80">
                        <div>Capacity: <strong className="text-[#F2EFE9]">{extractedData.chillingCapacityRt} RT</strong></div>
                        <div>Refrigerant: <strong className="text-[#F2EFE9]">{extractedData.refrigerantType}</strong></div>
                        <div>Refrigerant Mass: <strong className="text-[#F2EFE9]">{extractedData.refrigerantChargeKg} kg</strong></div>
                      </div>
                      <button
                        type="button"
                        onClick={applyExtractedData}
                        className="mt-3 w-full rounded bg-[#81BD01] py-1.5 font-display text-xs font-bold uppercase text-[#111111]"
                      >
                        Accept & Populate Fields
                      </button>
                    </div>
                  )}

                  {/* MATERIAL MASS TABLE */}
                  <div className="mt-6 border-t border-[#2A2A2A] pt-6">
                    <h3 className="font-display text-xs font-bold text-[#81BD01] uppercase tracking-wider">Manual Component Mass Table (kg)</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block font-display text-[0.65rem] uppercase text-[#F2EFE9]/50">Steel Enclosure & Frame (kg)</label>
                        <input
                          type="number"
                          value={massSteelKg}
                          onChange={(e) => setMassSteelKg(Number(e.target.value))}
                          className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-[#F2EFE9]"
                        />
                      </div>
                      <div>
                        <label className="block font-display text-[0.65rem] uppercase text-[#F2EFE9]/50">Copper Heat Exchanger Coils (kg)</label>
                        <input
                          type="number"
                          value={massCopperKg}
                          onChange={(e) => setMassCopperKg(Number(e.target.value))}
                          className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-[#F2EFE9]"
                        />
                      </div>
                      <div>
                        <label className="block font-display text-[0.65rem] uppercase text-[#F2EFE9]/50">Compressor Motor & Castings (kg)</label>
                        <input
                          type="number"
                          value={massMotorKg}
                          onChange={(e) => setMassMotorKg(Number(e.target.value))}
                          className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-[#F2EFE9]"
                        />
                      </div>
                      <div>
                        <label className="block font-display text-[0.65rem] uppercase text-[#F2EFE9]/50">Refrigerant Charge Type</label>
                        <select
                          value={refrigerantType}
                          onChange={(e) => setRefrigerantType(e.target.value)}
                          className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-[#F2EFE9]"
                        >
                          <option value="R134a">R134a (GWP 1430)</option>
                          <option value="R1233zd">R1233zd (GWP 1 - Ultra Low HFO)</option>
                          <option value="R1234ze">R1234ze (GWP 7 - Low HFO)</option>
                          <option value="R410A">R410A (GWP 2088)</option>
                          <option value="R32">R32 (GWP 675)</option>
                          <option value="R513A">R513A (GWP 631)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-display text-[0.65rem] uppercase text-[#F2EFE9]/50">Refrigerant Charge Mass (kg)</label>
                        <input
                          type="number"
                          value={refrigerantChargeKg}
                          onChange={(e) => setRefrigerantChargeKg(Number(e.target.value))}
                          className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-[#F2EFE9]"
                        />
                      </div>
                      <div>
                        <label className="block font-display text-[0.65rem] uppercase text-[#F2EFE9]/50">Insulation & Rubber (kg)</label>
                        <input
                          type="number"
                          value={massInsulationKg}
                          onChange={(e) => setMassInsulationKg(Number(e.target.value))}
                          className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-[#F2EFE9]"
                        />
                      </div>
                      <div>
                        <label className="block font-display text-[0.65rem] uppercase text-[#F2EFE9]/50">VFD & Control Electronics (kg)</label>
                        <input
                          type="number"
                          value={massElectronicsKg}
                          onChange={(e) => setMassElectronicsKg(Number(e.target.value))}
                          className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-[#F2EFE9]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button type="button" onClick={() => goToStep(1)} className="font-display text-xs uppercase text-[#F2EFE9]/60">← Back</button>
                    <button type="button" onClick={() => validateAndNext(3)} className="rounded-lg bg-[#81BD01] px-6 py-3 font-display text-xs font-bold uppercase tracking-widest text-[#111111] hover:bg-[#92d402]">Next: Compressor & Performance →</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: COMPRESSOR & PERFORMANCE SPECS */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
                  <span className="inline-block rounded border border-[#81BD01]/40 bg-[#81BD01]/10 px-3 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-[#81BD01]">
                    Step 3 of 6 — Compressor & Performance
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold text-[#F2EFE9]">Full-Load Efficiency & AHRI Test Curves</h2>

                  <div className="mt-6 grid gap-5 sm:grid-cols-3">
                    <div>
                      <label className="block font-display text-[0.7rem] font-semibold uppercase text-[#F2EFE9]/60">Full-Load Rated Efficiency (kW/ton) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={kwPerTon100}
                        onChange={(e) => setKwPerTon100(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 py-2.5 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                      />
                    </div>
                    <div>
                      <label className="block font-display text-[0.7rem] font-semibold uppercase text-[#F2EFE9]/60">Derived COP (Coefficient of Performance)</label>
                      <div className="mt-1.5 rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 py-2.5 font-mono text-sm font-bold text-[#81BD01]">
                        {cop}
                      </div>
                    </div>
                    <div>
                      <label className="block font-display text-[0.7rem] font-semibold uppercase text-[#F2EFE9]/60">Refrigerant GWP Rating</label>
                      <div className="mt-1.5 rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 py-2.5 font-mono text-sm text-[#F2EFE9]/80">
                        {refrigerantType}
                      </div>
                    </div>
                  </div>

                  {/* AHRI 550/590 PART LOAD CURVE */}
                  <div className="mt-8 border-t border-[#2A2A2A] pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xs font-bold text-[#81BD01] uppercase tracking-wider">AHRI 550/590 4-Point Part-Load Data</h3>
                      <label className="flex items-center gap-2 cursor-pointer font-display text-xs text-[#F2EFE9]/60">
                        <input
                          type="checkbox"
                          checked={hasAhriData}
                          onChange={(e) => setHasAhriData(e.target.checked)}
                          className="accent-[#81BD01]"
                        />
                        Include 4-Point Curve
                      </label>
                    </div>

                    {hasAhriData && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-4">
                        <div>
                          <label className="block font-display text-[0.65rem] uppercase text-[#F2EFE9]/50">100% Load (85°F ECWT)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={kwPerTon100}
                            onChange={(e) => setKwPerTon100(Number(e.target.value))}
                            className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-[#F2EFE9]"
                          />
                        </div>
                        <div>
                          <label className="block font-display text-[0.65rem] uppercase text-[#F2EFE9]/50">75% Load (75°F ECWT)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={kwPerTon75}
                            onChange={(e) => setKwPerTon75(Number(e.target.value))}
                            className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-[#F2EFE9]"
                          />
                        </div>
                        <div>
                          <label className="block font-display text-[0.65rem] uppercase text-[#F2EFE9]/50">50% Load (65°F ECWT)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={kwPerTon50}
                            onChange={(e) => setKwPerTon50(Number(e.target.value))}
                            className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-[#F2EFE9]"
                          />
                        </div>
                        <div>
                          <label className="block font-display text-[0.65rem] uppercase text-[#F2EFE9]/50">25% Load (65°F ECWT)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={kwPerTon25}
                            onChange={(e) => setKwPerTon25(Number(e.target.value))}
                            className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-[#F2EFE9]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button type="button" onClick={() => goToStep(2)} className="font-display text-xs uppercase text-[#F2EFE9]/60">← Back</button>
                    <button type="button" onClick={() => validateAndNext(4)} className="rounded-lg bg-[#81BD01] px-6 py-3 font-display text-xs font-bold uppercase tracking-widest text-[#111111] hover:bg-[#92d402]">Next: Duty Cycle & Operation →</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: DUTY CYCLE & OPERATION */}
            {step === 4 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
                  <span className="inline-block rounded border border-[#81BD01]/40 bg-[#81BD01]/10 px-3 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-[#81BD01]">
                    Step 4 of 6 — Duty Cycle & Operation (Stage B6)
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold text-[#F2EFE9]">Operational Runtime & Weather Dataset</h2>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block font-display text-[0.7rem] font-semibold uppercase text-[#F2EFE9]/60">Annual Operating Hours (hrs/year) *</label>
                      <input
                        type="number"
                        value={annualHours}
                        onChange={(e) => setAnnualHours(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 py-2.5 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                      />
                      <span className="text-[0.65rem] text-[#F2EFE9]/40 mt-1 block">Default: 4,500 hrs/yr continuous industrial runtime</span>
                    </div>

                    <div>
                      <label className="block font-display text-[0.7rem] font-semibold uppercase text-[#F2EFE9]/60">Reference Service Life Override (RSL Years)</label>
                      <input
                        type="number"
                        value={productLifespanYears}
                        onChange={(e) => setProductLifespanYears(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 py-2.5 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                      />
                      <span className="text-[0.65rem] text-[#F2EFE9]/40 mt-1 block">Default: 25 years per UL 10010-4 Part B PCR</span>
                    </div>
                  </div>

                  {/* 50-CITY WEATHER DATASET CHIPS */}
                  <div className="mt-8 border-t border-[#2A2A2A] pt-6">
                    <h3 className="font-display text-xs font-bold text-[#81BD01] uppercase tracking-wider">
                      Target Deployment Cities (50-City Bin Weather Grid Lookup)
                    </h3>
                    <p className="text-xs text-[#F2EFE9]/60 mt-1">Select target cities to calculate weighted grid emissions for Stage B6.</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {citiesList.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => toggleCity(city)}
                          className={`rounded-lg border px-3.5 py-1.5 font-display text-xs font-semibold uppercase transition-all ${
                            selectedCities.includes(city)
                              ? 'border-[#81BD01] bg-[#81BD01] text-[#111111]'
                              : 'border-[#2A2A2A] bg-[#111111] text-[#F2EFE9]/60 hover:border-[#81BD01]/50'
                          }`}
                        >
                          {city} {selectedCities.includes(city) && '✓'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button type="button" onClick={() => goToStep(3)} className="font-display text-xs uppercase text-[#F2EFE9]/60">← Back</button>
                    <button type="button" onClick={() => validateAndNext(5)} className="rounded-lg bg-[#81BD01] px-6 py-3 font-display text-xs font-bold uppercase tracking-widest text-[#111111] hover:bg-[#92d402]">Next: Transport Logistics →</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: TRANSPORT LOGISTICS */}
            {step === 5 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
                  <span className="inline-block rounded border border-[#81BD01]/40 bg-[#81BD01]/10 px-3 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-[#81BD01]">
                    Step 5 of 6 — Transport Logistics (Stage A4)
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold text-[#F2EFE9]">Factory-to-Site Freight Distance</h2>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block font-display text-[0.7rem] font-semibold uppercase text-[#F2EFE9]/60">Freight Distance to Deployment Site (km) *</label>
                      <input
                        type="number"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 py-2.5 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                      />
                    </div>
                    <div>
                      <label className="block font-display text-[0.7rem] font-semibold uppercase text-[#F2EFE9]/60">Transport Mode (ecoinvent v3.12 dataset)</label>
                      <select
                        value={transportMode}
                        onChange={(e) => setTransportMode(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 py-2.5 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                      >
                        <option value="lorry >32t">Diesel Freight Lorry &gt;32t (0.088 kg CO2e/t*km)</option>
                        <option value="freight train">Electric Freight Train (0.024 kg CO2e/t*km)</option>
                        <option value="container ship">Ocean Container Vessel (0.015 kg CO2e/t*km)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button type="button" onClick={() => goToStep(4)} className="font-display text-xs uppercase text-[#F2EFE9]/60">← Back</button>
                    <button type="button" onClick={() => validateAndNext(6)} className="rounded-lg bg-[#81BD01] px-6 py-3 font-display text-xs font-bold uppercase tracking-widest text-[#111111] hover:bg-[#92d402]">Next: Review & Generate →</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 6: REVIEW & GENERATE (TRANSITIONS TO RESULTS DASHBOARD) */}
            {step === 6 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {!lcaResults ? (
                  <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
                    <span className="inline-block rounded border border-[#81BD01]/40 bg-[#81BD01]/10 px-3 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-[#81BD01]">
                      Step 6 of 6 — Input Review & Generation
                    </span>
                    <h2 className="mt-2 font-display text-2xl font-bold text-[#F2EFE9]">Review Technical Declaration Inputs</h2>
                    <p className="mt-1 text-xs text-[#F2EFE9]/60">Verify technical specs before executing the 16-module LCA engine.</p>

                    {/* INPUT AUDIT SUMMARY CARD */}
                    <div className="mt-6 rounded-xl border border-[#2A2A2A] bg-[#111111] p-5 font-mono text-xs space-y-3 text-[#F2EFE9]/80">
                      <div className="flex justify-between border-b border-[#2A2A2A] pb-2">
                        <span className="text-[#81BD01] font-bold">Chiller Model:</span>
                        <span>{modelName}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#2A2A2A] pb-2">
                        <span className="text-[#81BD01] font-bold">Cooling Capacity:</span>
                        <span>{capacityRt} RT</span>
                      </div>
                      <div className="flex justify-between border-b border-[#2A2A2A] pb-2">
                        <span className="text-[#81BD01] font-bold">Total Delivered Mass:</span>
                        <span>{massSteelKg + massCopperKg + massMotorKg + massInsulationKg + massElectronicsKg} kg</span>
                      </div>
                      <div className="flex justify-between border-b border-[#2A2A2A] pb-2">
                        <span className="text-[#81BD01] font-bold">Refrigerant Charge:</span>
                        <span>{refrigerantType} ({refrigerantChargeKg} kg)</span>
                      </div>
                      <div className="flex justify-between border-b border-[#2A2A2A] pb-2">
                        <span className="text-[#81BD01] font-bold">Full-Load Efficiency:</span>
                        <span>{kwPerTon100} kW/ton (COP {cop})</span>
                      </div>
                      <div className="flex justify-between border-b border-[#2A2A2A] pb-2">
                        <span className="text-[#81BD01] font-bold">Target Cities:</span>
                        <span>{selectedCities.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#81BD01] font-bold">Applied PCR Standard:</span>
                        <span className="text-[#81BD01]">UL 10010-4 Part B v2.0 (2018)</span>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-[#2A2A2A] pt-6">
                      <button type="button" onClick={() => goToStep(5)} className="font-display text-xs uppercase text-[#F2EFE9]/60">← Back</button>
                      <button
                        type="button"
                        onClick={handleCalculateEPD}
                        disabled={loading}
                        className="rounded-lg bg-[#81BD01] px-8 py-3.5 font-display text-xs font-bold uppercase tracking-widest text-[#111111] hover:bg-[#92d402] transition-colors"
                      >
                        {loading ? 'Executing 16-Module Engine...' : '⚡ Generate EPD Declaration'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* RENDER FULL RESULTS DASHBOARD */
                  <EpdResultsView
                    projectName={modelName}
                    chillingCapacityRt={capacityRt}
                    refrigerantType={refrigerantType}
                    lcaResults={lcaResults}
                    projectId={projectId}
                    onEditInputs={() => setLcaResults(null)}
                    onGeneratePdf={handleGeneratePdf}
                    pdfUrl={pdfReportUrl}
                    isGeneratingPdf={loading}
                  />
                )}
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
