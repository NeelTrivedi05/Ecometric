'use client';

import React from 'react';

export default function MethodologyStrip() {
  const standards = [
    { label: 'ISO 14025', desc: 'Type III EPD' },
    { label: 'UL 10010-4 Part B', desc: 'HVAC Equipment PCR' },
    { label: 'EN 15804+A2', desc: 'Construction Sustainability' },
    { label: 'AHRI 550/590', desc: '4-Point Chiller Standard' },
    { label: 'ecoinvent v3.12', desc: 'LCI Background Database' },
    { label: 'EU CPR 2024/3110', desc: 'Digital Product Passport' },
  ];

  return (
    <div className="w-full border-y border-[#2A2A2A] bg-[#141414] py-6">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#81BD01]" />
            <span className="font-display text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#F2EFE9]/70">
              Methodology & Compliance Standards
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {standards.map((s) => (
              <div
                key={s.label}
                className="group flex items-center gap-2 rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-1.5 transition-all hover:border-[#81BD01]/60 hover:bg-[#181818]"
              >
                <span className="font-display text-[0.7rem] font-bold text-[#81BD01]">
                  {s.label}
                </span>
                <span className="font-mono text-[0.6rem] uppercase tracking-wider text-[#F2EFE9]/40 group-hover:text-[#F2EFE9]/60">
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
