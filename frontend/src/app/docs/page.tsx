'use client';

import React from 'react';
import Link from 'next/link';
import MethodologyStrip from '@/components/MethodologyStrip';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#111111] text-[#F2EFE9] antialiased">
      {/* Top Navigation Bar */}
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
            <Link
              href="/wizard"
              className="rounded-md border border-[#81BD01] bg-[#81BD01]/10 px-4 py-2 font-display text-xs font-bold uppercase text-[#81BD01] hover:bg-[#81BD01] hover:text-[#111111]"
            >
              Generate EPD Now →
            </Link>
            <Link
              href="/"
              className="rounded-md border border-[#2A2A2A] bg-[#181818] px-3.5 py-1.5 font-display text-xs font-semibold uppercase text-[#F2EFE9]/70 hover:border-[#81BD01] hover:text-[#F2EFE9]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Documentation Area */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <span className="inline-block rounded border border-[#81BD01]/40 bg-[#81BD01]/10 px-3 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-[#81BD01]">
            Methodology & Technical Specifications
          </span>
          <h1 className="font-display text-3xl font-extrabold text-[#F2EFE9] sm:text-4xl">
            Industrial Chiller EPD Calculation Methodology
          </h1>
          <p className="text-base text-[#F2EFE9]/60">
            A comprehensive guide to EcoMetric&apos;s 16-module Life-Cycle Assessment (LCA) engine, compliance standards (ISO 14025, EN 15804+A2, UL 10010-4 Part B), and European regulatory requirements (CPR 2024/3110).
          </p>
        </div>

        <div className="mt-10 space-y-8">
          <section className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold text-[#81BD01] uppercase tracking-wider">
              1. Regulatory Mandates: EU CPR 2024/3110 & Digital Product Passport
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#F2EFE9]/75">
              Beginning in 2026/2027, the revised <strong>EU Construction Products Regulation (CPR 2024/3110)</strong> and the 
              <strong>Ecodesign for Sustainable Products Regulation (ESPR)</strong> mandate verified Type III Environmental Product Declarations (EPDs) for HVAC and cooling equipment sold into the European Union. These declarations must be attached to a 
              <strong>Digital Product Passport (DPP)</strong> data carrier. EcoMetric provides Indian and global OEMs with a turnkey platform to calculate, disclose, and document these emissions.
            </p>
          </section>

          <section className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold text-[#81BD01] uppercase tracking-wider">
              2. PCR UL 10010-4 Part B System Boundaries
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#F2EFE9]/75">
              EcoMetric applies the <strong>UL 10010-4 Part B v2.0 (2018)</strong> Product Category Rules for Building Envelope and HVAC Equipment:
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-4">
                <div className="font-display text-xs font-bold text-[#81BD01]">Manufacturing Stage (A1–A3)</div>
                <p className="mt-1 text-xs text-[#F2EFE9]/60">Raw material extraction (steel enclosure, copper coils, aluminum fins, compressor motor), component assembly, and factory refrigerant charge.</p>
              </div>
              <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-4">
                <div className="font-display text-xs font-bold text-[#81BD01]">Logistics & Installation (A4–A5)</div>
                <p className="mt-1 text-xs text-[#F2EFE9]/60">Freight transport from factory to deployment site (diesel truck, train, or ship) and commissioning electrical consumption.</p>
              </div>
              <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-4">
                <div className="font-display text-xs font-bold text-[#81BD01]">Use & Operation (B1–B7)</div>
                <p className="mt-1 text-xs text-[#F2EFE9]/60">Annual refrigerant leakage (2%/yr default), lubricant replacement, component overhauls, and Stage B6 Operational Electricity.</p>
              </div>
              <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-4">
                <div className="font-display text-xs font-bold text-[#81BD01]">End-of-Life & Module D (C1–C4, D)</div>
                <p className="mt-1 text-xs text-[#F2EFE9]/60">Deconstruction, 90% refrigerant recovery target, scrap recycling. Module D recycling credits are reported separately per PCR §4.3.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold text-[#81BD01] uppercase tracking-wider">
              3. The 200× Operational Dominance Effect (Stage B6)
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#F2EFE9]/75">
              Empirical LCA data reveals that over a 20–25 year Reference Service Life (RSL), an industrial chiller&apos;s continuous operational electricity consumption (Stage B6) accounts for over <strong>99.5%</strong> of its total global warming footprint. Manufacturing materials (A1–A3) contribute less than 0.5%. EcoMetric models Stage B6 across 50 global city weather profiles using ecoinvent v3.12 regional grid carbon factors.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/wizard"
            className="inline-block rounded-lg bg-[#81BD01] px-8 py-4 font-display text-xs font-bold uppercase tracking-widest text-[#111111] hover:bg-[#92d402]"
          >
            Start EPD Input Wizard →
          </Link>
        </div>
      </main>

      <MethodologyStrip />
    </div>
  );
}
