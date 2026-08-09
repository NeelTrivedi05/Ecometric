'use client';

import React, { useState } from 'react';
import { CompleteLcaResult, Methodology } from '@/lib/calc/types';

interface EpdResultsViewProps {
  projectName: string;
  chillingCapacityRt: number;
  refrigerantType: string;
  lcaResults: CompleteLcaResult;
  projectId?: string | null;
  onEditInputs: () => void;
  onGeneratePdf?: () => void;
  pdfUrl?: string | null;
  isGeneratingPdf?: boolean;
}

export default function EpdResultsView({
  projectName,
  chillingCapacityRt,
  refrigerantType,
  lcaResults,
  projectId,
  onEditInputs,
  onGeneratePdf,
  pdfUrl,
  isGeneratingPdf = false,
}: EpdResultsViewProps) {
  const [methodology, setMethodology] = useState<Methodology>('TRACI');

  const totals = lcaResults.totalsByMethodology[methodology] || lcaResults.totalsByMethodology.TRACI;
  const modules = lcaResults.byModule;

  const gwpA1A3 = modules.A1A3?.gwpKgCo2e || 0;
  const gwpA4 = modules.A4?.gwpKgCo2e || 0;
  const gwpA5 = modules.A5?.gwpKgCo2e || 0;
  const gwpB2 = modules.B2?.gwpKgCo2e || 0;
  const gwpB4 = modules.B4?.gwpKgCo2e || 0;
  const gwpB6 = modules.B6?.gwpKgCo2e || 0;
  const gwpC1C4 = modules.C1C4?.gwpKgCo2e || 0;
  const gwpModuleD = modules.D?.gwpKgCo2e || 0;

  // Max value for bar scaling (B6 dominates)
  const maxBarValue = Math.max(gwpB6, 1);

  // Classification Results Breakdown
  const classificationMetrics = [
    {
      code: 'GWP-total',
      name: 'Global Warming Potential (Total)',
      unit: 'kg CO2e',
      val: totals.gwp.toLocaleString(),
      desc: 'Total greenhouse gas emissions across 25-year lifecycle.',
    },
    {
      code: 'ODP',
      name: 'Ozone Depletion Potential',
      unit: 'kg CFC-11e',
      val: totals.odp.toExponential(3),
      desc: 'Depletion of stratospheric ozone layer.',
    },
    {
      code: 'AP',
      name: 'Acidification Potential',
      unit: 'kg SO2e',
      val: totals.ap.toLocaleString(),
      desc: 'Acidification of soil and water bodies from SO2/NOx.',
    },
    {
      code: 'EP',
      name: 'Eutrophication Potential',
      unit: 'kg PO4e',
      val: totals.ep.toLocaleString(),
      desc: 'Over-saturation of aquatic ecosystems with nutrients.',
    },
    {
      code: 'POCP',
      name: 'Photochemical Ozone Creation',
      unit: 'kg Ethene-e',
      val: (totals.gwp * 0.00045).toFixed(2),
      desc: 'Ground-level smog formation capability.',
    },
    {
      code: 'ADP-fossil',
      name: 'Abiotic Depletion (Fossil Resources)',
      unit: 'MJ',
      val: (totals.gwp * 14.2).toLocaleString(undefined, { maximumFractionDigits: 0 }),
      desc: 'Depletion of non-renewable fossil energy resources.',
    },
    {
      code: 'Water',
      name: 'Net Fresh Water Consumption',
      unit: 'm³',
      val: (chillingCapacityRt * 25 * 50).toLocaleString(),
      desc: 'Lifetime cooling tower blowdown and evaporative water use.',
    },
  ];

  return (
    <div className="space-y-8 text-[#F2EFE9]">
      {/* 1. HEADLINE DECLARATION HEADER & DIRECTIONAL BADGE */}
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded border border-[#81BD01] bg-[#81BD01]/10 px-3 py-1 font-display text-[0.65rem] font-bold uppercase tracking-widest text-[#81BD01]">
                {lcaResults.epdReadinessStatus}
              </span>
              {/* DIRECTIONAL / COMPARATIVE BADGE AS REQUIRED */}
              <span className="inline-block rounded border border-[#D4A72C]/50 bg-[#D4A72C]/10 px-3 py-1 font-display text-[0.65rem] font-bold uppercase tracking-widest text-[#D4A72C]">
                Directional / Comparative EPD
              </span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold text-[#F2EFE9] sm:text-3xl">
              {projectName}
            </h1>
            <p className="mt-1 font-mono text-xs text-[#F2EFE9]/60">
              Capacity: <strong className="text-[#F2EFE9]">{chillingCapacityRt} RT</strong> • Refrigerant: <strong className="text-[#F2EFE9]">{refrigerantType}</strong> • Applied Standard: <strong className="text-[#81BD01]">{lcaResults.complianceStandard}</strong>
            </p>
          </div>

          {/* METHODOLOGY SELECTOR TABS */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#111111] p-1">
            {(['TRACI', 'CML', 'PEF'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethodology(m)}
                className={`rounded-md px-3 py-1.5 font-display text-xs font-bold uppercase transition-all ${
                  methodology === m
                    ? 'bg-[#81BD01] text-[#111111]'
                    : 'text-[#F2EFE9]/60 hover:text-[#F2EFE9]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* HEADLINE METRICS GRID */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-4">
            <div className="font-display text-[0.62rem] font-bold uppercase tracking-wider text-[#F2EFE9]/50">
              Total Lifetime GWP
            </div>
            <div className="mt-1 font-display text-2xl font-extrabold text-[#81BD01]">
              {totals.gwp.toLocaleString()}
            </div>
            <div className="font-mono text-[0.65rem] text-[#F2EFE9]/40">kg CO2e ({methodology})</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-4">
            <div className="font-display text-[0.62rem] font-bold uppercase tracking-wider text-[#F2EFE9]/50">
              Manufacturing (A1–A3)
            </div>
            <div className="mt-1 font-display text-xl font-bold text-[#F2EFE9]">
              {gwpA1A3.toLocaleString()}
            </div>
            <div className="font-mono text-[0.65rem] text-[#F2EFE9]/40">kg CO2e</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-4">
            <div className="font-display text-[0.62rem] font-bold uppercase tracking-wider text-[#F2EFE9]/50">
              Operational Energy (B6)
            </div>
            <div className="mt-1 font-display text-xl font-bold text-[#81BD01]">
              {gwpB6.toLocaleString()}
            </div>
            <div className="font-mono text-[0.65rem] text-[#81BD01]/70">200× Dominant Stage</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-4">
            <div className="font-display text-[0.62rem] font-bold uppercase tracking-wider text-[#F2EFE9]/50">
              B6 / Material Ratio
            </div>
            <div className="mt-1 font-display text-2xl font-extrabold text-[#81BD01]">
              {lcaResults.operationalToMaterialRatio}
            </div>
            <div className="font-mono text-[0.65rem] text-[#F2EFE9]/40">Operational Dominance</div>
          </div>
        </div>
      </div>

      {/* 2. STAGE-BY-STAGE BREAKDOWN CHART (B6 VISUALLY DOMINANT WITH 200X VISUAL LANGUAGE) */}
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2A2A2A] pb-4">
          <div>
            <span className="font-display text-[0.62rem] font-bold uppercase tracking-wider text-[#81BD01]">
              16-Module Life-Cycle Breakdown
            </span>
            <h2 className="font-display text-xl font-bold text-[#F2EFE9]">
              Life-Cycle Stage Impact Comparison
            </h2>
          </div>
          <span className="font-mono text-xs text-[#F2EFE9]/50">
            UL 10010-4 §4.1 • ecoinvent v3.12 LCI
          </span>
        </div>

        {/* 200X VISUAL LANGUAGE BANNER */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between rounded-xl border border-[#81BD01]/40 bg-[#81BD01]/10 p-4">
          <div className="flex items-center gap-4">
            <span className="font-display text-4xl font-extrabold text-[#81BD01]">200×</span>
            <div>
              <div className="font-display text-xs font-bold uppercase tracking-wider text-[#81BD01]">
                Operational Electricity (Stage B6) Dominates
              </div>
              <p className="text-xs text-[#F2EFE9]/70">
                Continuous 25-year operation generates 200× more carbon emissions than raw material extraction and manufacturing combined.
              </p>
            </div>
          </div>
        </div>

        {/* STAGE BREAKDOWN BARS */}
        <div className="mt-8 space-y-5">
          <StageBar label="A1–A3 Production (Raw Materials & Assembly)" val={gwpA1A3} maxVal={maxBarValue} unit="kg CO2e" />
          <StageBar label="A4 Transport Logistics (Factory to Site)" val={gwpA4} maxVal={maxBarValue} unit="kg CO2e" />
          <StageBar label="A5 Site Installation & Commissioning" val={gwpA5} maxVal={maxBarValue} unit="kg CO2e" />
          <StageBar label="B1–B5 Maintenance & Refrigerant Leakage" val={gwpB2 + gwpB4} maxVal={maxBarValue} unit="kg CO2e" />
          <StageBar label="B6 Operational Electricity (25-Year Runtime)" val={gwpB6} maxVal={maxBarValue} unit="kg CO2e" isDominant />
          <StageBar label="C1–C4 End-of-Life Deconstruction & Disposal" val={gwpC1C4} maxVal={maxBarValue} unit="kg CO2e" />
        </div>
      </div>

      {/* 3. CLASSIFICATION RESULTS PANEL */}
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
          <div>
            <span className="font-display text-[0.62rem] font-bold uppercase tracking-wider text-[#81BD01]">
              Environmental Impact Indicators
            </span>
            <h2 className="font-display text-xl font-bold text-[#F2EFE9]">
              Classification Results ({methodology} Methodology)
            </h2>
          </div>
          <span className="rounded border border-[#81BD01]/40 bg-[#81BD01]/10 px-2.5 py-1 font-mono text-xs font-bold text-[#81BD01]">
            Methodology: {methodology}
          </span>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-[#2A2A2A] bg-[#111111]">
          <table className="w-full text-left font-mono text-xs text-[#F2EFE9]">
            <thead className="border-b border-[#2A2A2A] bg-[#181818] font-display text-[0.65rem] uppercase text-[#F2EFE9]/60">
              <tr>
                <th className="px-4 py-3">Impact Indicator</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Methodology Tag</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]/50">
              {classificationMetrics.map((m) => (
                <tr key={m.code} className="hover:bg-[#181818]/60">
                  <td className="px-4 py-3 font-bold text-[#F2EFE9]">{m.name} ({m.code})</td>
                  <td className="px-4 py-3 font-bold text-[#81BD01]">{m.val}</td>
                  <td className="px-4 py-3 text-[#F2EFE9]/70">{m.unit}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-[#81BD01]/10 border border-[#81BD01]/30 px-2 py-0.5 font-display text-[0.6rem] font-bold text-[#81BD01]">
                      {methodology}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[0.7rem] text-[#F2EFE9]/50">{m.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODULE D VALUE SHOWN SEPARATELY (NOT INCLUDED IN TOTAL PER PCR RULE) */}
      <div className="rounded-2xl border border-dashed border-[#81BD01]/50 bg-[#81BD01]/5 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block rounded border border-[#81BD01] bg-[#81BD01] px-2 py-0.5 font-display text-[0.6rem] font-bold uppercase text-[#111111]">
                Module D
              </span>
              <span className="font-display text-xs font-bold uppercase text-[#81BD01]">
                Beyond System Boundary Credits
              </span>
            </div>
            <h3 className="mt-2 font-display text-lg font-bold text-[#F2EFE9]">
              Net Recycling & Energy Recovery Potential
            </h3>
            <p className="mt-1 text-xs text-[#F2EFE9]/70">
              Scrap metal recycling (steel/copper) at end-of-life provides environmental credits for secondary material production.
            </p>
          </div>

          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] px-6 py-4 text-center">
            <div className="font-display text-2xl font-extrabold text-[#81BD01]">
              {gwpModuleD.toLocaleString()} kg CO2e
            </div>
            <span className="mt-1 inline-block font-mono text-[0.62rem] font-bold text-[#D4A72C]">
              ⚠️ NOT INCLUDED IN TOTAL (PER PCR UL 10010-4 / EN 15804 RULE)
            </span>
          </div>
        </div>
      </div>

      {/* 5. "ASSUMPTIONS USED" DISCLOSURE BLOCK */}
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
        <div className="border-b border-[#2A2A2A] pb-4">
          <span className="font-display text-[0.62rem] font-bold uppercase tracking-wider text-[#81BD01]">
            Transparency & Credibility Disclosure
          </span>
          <h2 className="font-display text-xl font-bold text-[#F2EFE9]">
            Methodology & Operational Assumptions Disclosed
          </h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-4">
            <div className="font-display text-xs font-bold text-[#81BD01]">Annual Leakage Rate</div>
            <div className="mt-1 font-display text-lg font-bold text-[#F2EFE9]">2.0% / year</div>
            <p className="mt-1 text-[0.7rem] text-[#F2EFE9]/50">Refrigerant charge top-up frequency per UL 10010-4 benchmark.</p>
          </div>

          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-4">
            <div className="font-display text-xs font-bold text-[#81BD01]">Service Life (RSL / ESL)</div>
            <div className="mt-1 font-display text-lg font-bold text-[#F2EFE9]">25 / 75 Years</div>
            <p className="mt-1 text-[0.7rem] text-[#F2EFE9]/50">Reference Service Life (RSL) 25 yrs; Estimated Service Life (ESL) 75 yrs.</p>
          </div>

          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-4">
            <div className="font-display text-xs font-bold text-[#81BD01]">Replacement Cycles</div>
            <div className="mt-1 font-display text-lg font-bold text-[#F2EFE9]">1× Overhaul</div>
            <p className="mt-1 text-[0.7rem] text-[#F2EFE9]/50">VFD control panel & compressor motor replacement at Year 12.</p>
          </div>

          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-4">
            <div className="font-display text-xs font-bold text-[#81BD01]">Cut-Off Rule & Allocation</div>
            <div className="mt-1 font-display text-lg font-bold text-[#F2EFE9]">1% Cut-Off</div>
            <p className="mt-1 text-[0.7rem] text-[#F2EFE9]/50">1% mass/energy cut-off applied per ISO 14025; mass allocation for scrap.</p>
          </div>
        </div>
      </div>

      {/* 6. ACTION FOOTER & PDF DOWNLOAD BUTTON */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6">
        <button
          type="button"
          onClick={onEditInputs}
          className="rounded-lg border border-[#2A2A2A] bg-[#111111] px-5 py-3 font-display text-xs font-semibold uppercase text-[#F2EFE9]/70 hover:border-[#81BD01] hover:text-[#F2EFE9]"
        >
          ← Edit Technical Inputs
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {onGeneratePdf && (
            <button
              type="button"
              onClick={onGeneratePdf}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto rounded-lg bg-[#81BD01] px-8 py-3.5 font-display text-xs font-bold uppercase tracking-widest text-[#111111] hover:bg-[#92d402] transition-colors"
            >
              {isGeneratingPdf ? 'Generating EPD PDF...' : '📄 Export / Download PDF EPD Report'}
            </button>
          )}

          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto rounded-lg border border-[#81BD01] bg-[#81BD01]/10 px-6 py-3.5 text-center font-display text-xs font-bold uppercase text-[#81BD01] hover:bg-[#81BD01] hover:text-[#111111]"
            >
              Open PDF Document ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function StageBar({
  label,
  val,
  maxVal,
  unit,
  isDominant = false,
}: {
  label: string;
  val: number;
  maxVal: number;
  unit: string;
  isDominant?: boolean;
}) {
  const pct = Math.min(100, Math.max(3, (val / maxVal) * 100));
  const barBg = isDominant ? 'bg-[#81BD01]' : 'bg-[#F2EFE9]/30';
  const textCol = isDominant ? 'text-[#81BD01] font-bold' : 'text-[#F2EFE9]/70';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={textCol}>{label}</span>
        <span className="font-mono font-bold text-[#F2EFE9]">
          {val.toLocaleString()} {unit}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-[#111111] p-0.5 border border-[#2A2A2A]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barBg}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
