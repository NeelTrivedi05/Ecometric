'use client';

import React from 'react';

interface MethodologyDocsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MethodologyDocsModal({ isOpen, onClose }: MethodologyDocsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#111111] shadow-2xl text-[#F2EFE9]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2A2A] bg-[#181818] px-6 py-4">
          <div>
            <span className="font-display text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#81BD01]">
              PCR UL 10010-4 Part B & EN 15804+A2 Standard
            </span>
            <h2 className="font-display text-xl font-bold text-[#F2EFE9]">
              EcoMetric Methodology & Technical Rules
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2A2A2A] bg-[#111111] font-mono text-sm font-bold text-[#F2EFE9]/70 hover:border-[#81BD01] hover:text-[#81BD01]"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-6 overflow-y-auto p-6 text-sm leading-relaxed text-[#F2EFE9]/80">
          <section className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-5">
            <h3 className="font-display text-sm font-bold text-[#81BD01] uppercase tracking-wider">
              1. Regulatory Drivers (CPR 2024/3110 & ESPR / DPP)
            </h3>
            <p className="mt-2 text-xs leading-6 text-[#F2EFE9]/70">
              Under the revised <strong>EU Construction Products Regulation (EU) 2024/3110</strong> and the 
              <strong>Ecodesign for Sustainable Products Regulation (ESPR)</strong>, industrial HVAC and cooling equipment 
              exported to the European Union require mandatory Environmental Product Declarations (EPDs) linked to a 
              <strong>Digital Product Passport (DPP)</strong>. EcoMetric automates 16-module life-cycle calculations for OEMs.
            </p>
          </section>

          <section className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-5">
            <h3 className="font-display text-sm font-bold text-[#81BD01] uppercase tracking-wider">
              2. Product Category Rules (UL 10010-4 Part B v2.0 2018)
            </h3>
            <p className="mt-2 text-xs leading-6 text-[#F2EFE9]/70">
              Calculations strictly follow <strong>UL 10010-4 Part B v2.0 (2018)</strong> for Building Envelope and HVAC Equipment:
            </p>
            <ul className="mt-3 space-y-1.5 font-mono text-xs text-[#F2EFE9]/60">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#81BD01]" />
                <strong>A1–A3 Production:</strong> Raw material extraction, component fabrication, refrigerant initial charge.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#81BD01]" />
                <strong>A4 Transport & A5 Installation:</strong> Freight distance from plant to installation site and commissioning power.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#81BD01]" />
                <strong>B1–B7 Use Phase:</strong> Annual refrigerant leakage (2%/yr default), maintenance, VFD overhauls, and operational electricity (B6).
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#81BD01]" />
                <strong>C1–C4 End-of-Life:</strong> Deconstruction energy, transport to treatment, refrigerant recovery (90% target), landfill/incineration.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#81BD01]" />
                <strong>Module D (Separate):</strong> Scrap metal recycling and net energy recovery credits. Kept distinct from main sum per PCR §4.3.
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-5">
            <h3 className="font-display text-sm font-bold text-[#81BD01] uppercase tracking-wider">
              3. AHRI 550/590 50-City Bin Climate Calculation Logic (Stage B6)
            </h3>
            <p className="mt-2 text-xs leading-6 text-[#F2EFE9]/70">
              Stage B6 Operational Energy dominates overall chiller lifecycle impact by ~200× over raw materials. EcoMetric models annual kilowatt-hour consumption using AHRI 550/590 4-point part-load efficiency curves cross-referenced against 50 global city weather bin data and regional grid carbon factors (ecoinvent v3.12).
            </p>
          </section>

          <section className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-5">
            <h3 className="font-display text-sm font-bold text-[#81BD01] uppercase tracking-wider">
              4. Impact Assessment Methodologies Supported
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[#2A2A2A] bg-[#111111] p-3 text-xs">
                <div className="font-display font-bold text-[#81BD01]">TRACI 2.1</div>
                <div className="mt-1 text-[#F2EFE9]/60">US EPA Tool for Reduction and Assessment of Chemical Impacts. Required for North American specs.</div>
              </div>
              <div className="rounded-lg border border-[#2A2A2A] bg-[#111111] p-3 text-xs">
                <div className="font-display font-bold text-[#81BD01]">CML-IA Baseline</div>
                <div className="mt-1 text-[#F2EFE9]/60">University of Leiden methodology widely accepted across international ISO 14025 declarations.</div>
              </div>
              <div className="rounded-lg border border-[#2A2A2A] bg-[#111111] p-3 text-xs">
                <div className="font-display font-bold text-[#81BD01]">PEF EF 3.1</div>
                <div className="mt-1 text-[#F2EFE9]/60">European Commission Product Environmental Footprint standard for EU Single Market compliance.</div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#2A2A2A] bg-[#181818] px-6 py-4">
          <span className="font-mono text-xs text-[#F2EFE9]/40">
            EcoMetric Engine v1.0 • Directional Comparative Platform
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#81BD01] px-5 py-2 font-display text-xs font-bold uppercase text-[#111111] hover:bg-[#92d402]"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
