export const BENCHMARK_PRODUCTS = [
  {
    id: "carrier-11017",
    name: "Carrier AquaForce® Liquid Chiller 30KAV",
    refDoc: "EPD11017.pdf",
    pcr: "PCR 2019:14 Construction products v2.0.1 (EN 15804+A2)",
    declaredUnit: "1 Unit of HVAC Liquid Chiller (500 kW Nominal Capacity)",
    lciaMethod: "EF 3.1 Characterization Matrix",
    summaryGwp: "42,850 kg CO₂e",
    stages: {
      all: { gwp: "42,850 kg CO₂e", ap: "186.4 mol H⁺", adp: "0.842 kg Sb", wdp: "1,240 m³" },
      a1_a3: { gwp: "18,450 kg CO₂e", ap: "94.2 mol H⁺", adp: "0.789 kg Sb", wdp: "620 m³" },
      b1_b7: { gwp: "19,200 kg CO₂e", ap: "68.1 mol H⁺", adp: "0.038 kg Sb", wdp: "480 m³" },
      c1_c4: { gwp: "5,200 kg CO₂e", ap: "24.1 mol H⁺", adp: "0.015 kg Sb", wdp: "140 m³" },
      d: { gwp: "-7,840 kg CO₂e", ap: "-31.2 mol H⁺", adp: "-0.412 kg Sb", wdp: "-210 m³" }
    }
  },
  {
    id: "heatpump-150",
    name: "Industrial Air-to-Water Heat Pump",
    refDoc: "EPD-HP-2024.pdf",
    pcr: "PCR 2019:14 Construction products v2.0.1",
    declaredUnit: "1 Unit of Heat Pump (150 kW Capacity)",
    lciaMethod: "EF 3.1 Characterization Engine",
    summaryGwp: "16,420 kg CO₂e",
    stages: {
      all: { gwp: "16,420 kg CO₂e", ap: "64.8 mol H⁺", adp: "0.315 kg Sb", wdp: "485 m³" },
      a1_a3: { gwp: "7,850 kg CO₂e", ap: "32.1 mol H⁺", adp: "0.295 kg Sb", wdp: "240 m³" },
      b1_b7: { gwp: "6,920 kg CO₂e", ap: "25.2 mol H⁺", adp: "0.012 kg Sb", wdp: "195 m³" },
      c1_c4: { gwp: "1,650 kg CO₂e", ap: "7.5 mol H⁺", adp: "0.008 kg Sb", wdp: "50 m³" },
      d: { gwp: "-3,120 kg CO₂e", ap: "-12.4 mol H⁺", adp: "-0.165 kg Sb", wdp: "-88 m³" }
    }
  }
];

export const LCA_STAGES = [
  {
    id: "a1_a3",
    code: "A1–A3",
    name: "Product Stage",
    boundary: "Cradle to Gate",
    desc: "Raw material extraction, inbound logistics to factory & component manufacturing.",
    standard: "EN 15804+A2 Clause 6.2.2 (Mandatory)",
    gwpShare: "43%",
    badgeColor: "#C25A23"
  },
  {
    id: "a4_a5",
    code: "A4–A5",
    name: "Construction Stage",
    boundary: "Transport & Install",
    desc: "Freight logistics from plant gate to building site & commissioning rigging.",
    standard: "PCR 2019:14 Construction Products v2.0.1",
    gwpShare: "5%",
    badgeColor: "#8F4A14"
  },
  {
    id: "b1_b7",
    code: "B1–B7",
    name: "Use Stage",
    boundary: "Operation & Maintenance",
    desc: "25-year grid electricity, refrigerant fugitive leakage, and filter refurbishment.",
    standard: "EN 15804+A2 Clause 6.2.3 (Operational)",
    gwpShare: "45%",
    badgeColor: "#D97706"
  },
  {
    id: "c1_c4",
    code: "C1–C4",
    name: "End of Life Stage",
    boundary: "Deconstruction & Disposal",
    desc: "Refrigerant recovery/destruction, dismantling, sorting, and final disposal.",
    standard: "EN 15804+A2 Clause 6.2.4 (Mandatory)",
    gwpShare: "7%",
    badgeColor: "#5C4E46"
  },
  {
    id: "d",
    code: "Module D",
    name: "Benefits Beyond Boundary",
    boundary: "Circular Net Scrap",
    desc: "Credits for avoided virgin raw material production via steel and copper recycling.",
    standard: "EN 15804+A2 Annex D",
    gwpShare: "-18% (Credit)",
    badgeColor: "#2E7D32"
  }
];

export const PROBLEM_CARDS = [
  {
    title: "Months of Consultant Delays",
    desc: "Traditional environmental consulting takes 3 to 6 months per EPD, creating critical bottlenecks for product commercial launches.",
    icon: "Clock"
  },
  {
    title: "$20,000+ Cost Per Declaration",
    desc: "Manual LCA modeling fees quickly scale to tens of thousands per SKU, making comprehensive portfolio declarations cost-prohibitive.",
    icon: "Dollar"
  },
  {
    title: "Third-Party Audit Rejections",
    desc: "Minor cut-off calculation flaws or outdated characterization factors cause painful verification re-audits and registry rejections.",
    icon: "Alert"
  },
  {
    title: "Broken Spreadsheet Lineage",
    desc: "Fragile Excel formulas with thousands of unlinked cells make it nearly impossible to trace which BOM item generated which elementary flow.",
    icon: "FileText"
  },
  {
    title: "Ecoinvent Uncharacterized Mismatches",
    desc: "Raw LCI background databases provide inventory flows, not weighted EPD indicators. Manual matrix multiplication produces human error.",
    icon: "Database"
  },
  {
    title: "Strict EF 3.1 Mandates",
    desc: "Global registries like Environdec now require strict EF 3.1 & EN 15804+A2 indicators, rendering older CML calculations non-compliant.",
    icon: "Shield"
  }
];

export const SOLUTION_POINTS = [
  {
    feature: "BOM Ingestion & Parsing",
    oldWay: "Manually retyping hundreds of rows from ERP PDFs into specialized LCA software",
    ecoWay: "Instant multi-format parser for Excel, CSV, and PDFs with automated component matching"
  },
  {
    feature: "Ecoinvent Factor Mapping",
    oldWay: "Browsing 20,000 datasets by hand and guessing proxy activities",
    ecoWay: "Curated and verified seed database with smart fuzzy matching and automated fallback"
  },
  {
    feature: "PCR Compliance Verification",
    oldWay: "Manual checklist audits against 100-page UL and GPI regulatory documents",
    ecoWay: "Automated 5-gate pre-audit checking mass cut-off rules, transport legs, and DQI scores"
  },
  {
    feature: "LCIA Methodology Engine",
    oldWay: "Re-running complex matrix inversion scripts for each regional standard",
    ecoWay: "Dynamic 2-stage characterization switcher (EF 3.1, TRACI 2.1, CML-IA, ReCiPe 2016)"
  },
  {
    feature: "Export & Delivery",
    oldWay: "Hiring graphic designers to format 30-page PDF tables and hand-coding ILCD XML",
    ecoWay: "Single-click export of third-party verifier ready PDF and machine-readable ILCD+EPD JSON"
  }
];

export const PIPELINE_STEPS = [
  {
    step: "01",
    title: "Ingest Engineering Documents",
    desc: "Drag and drop assembly BOMs, factory utility electricity bills, and Tier-1 logistics manifests in Excel, CSV, or PDF."
  },
  {
    step: "02",
    title: "Automated PCR Gap Audit",
    desc: "The rules engine scans for missing data against UL 10010-4 and ISO 14025 cut-off requirements before proceeding."
  },
  {
    step: "03",
    title: "Ecoinvent Dataset Linking",
    desc: "Extracted components are linked to verified background datasets for structural metals, polymers, and regional electricity grids."
  },
  {
    step: "04",
    title: "LCIA Characterization",
    desc: "Apply official characterization factor matrices (EF 3.1, TRACI 2.1) across all modules (A1–A3, A4–A5, B1–B7, C1–C4, Module D)."
  },
  {
    step: "05",
    title: "Generate Verifier Package",
    desc: "Download publication-ready EPD PDF reports with verified indicator tables and ILCD+EPD compliant XML/JSON for registry submission."
  }
];

export const USER_PERSONAS = [
  {
    role: "Sustainability & LCA Engineers",
    benefit: "Accelerate declaration workflows from 4 months to under 15 minutes with verified characterization matrices."
  },
  {
    role: "HVAC & Industrial Product Managers",
    benefit: "Meet mandatory green building procurement specs (LEED v4.1, BREEAM) without waiting on third-party consultants."
  },
  {
    role: "Third-Party EPD Verifiers",
    benefit: "Audit mathematical calculations with a clear cryptographic data lineage trail from raw BOM to final GWP indicator."
  },
  {
    role: "OEM Executive Leadership",
    benefit: "Publish compliant Type III declarations across hundreds of product variants at a fraction of the cost."
  }
];

export const FAQS = [
  {
    q: "Why do raw ecoinvent numbers differ from published EPDs like Carrier Chiller EPD11017?",
    a: "Raw ecoinvent LCI contains unweighted elementary flows without characterization factors. To match certified declarations, the correct LCIA methodology (EF 3.1, EN 15804+A2) must be applied. EcoMetric automates this characterization matrix."
  },
  {
    q: "How does the platform enforce EF 3.1 requirements?",
    a: "Since September 2024, EF 3.1 characterization factors are mandatory for International EPD System declarations under GPI 5.0.1. EcoMetric includes pre-validated EF 3.1 matrices covering all 13 core indicators."
  },
  {
    q: "What is the biogenic carbon net-zero mass balance rule?",
    a: "Under PCR 2019:14 Annex 2, biogenic carbon uptake during raw material growth must balance out to net-zero across the complete cradle-to-grave cycle unless permanent capture is proven."
  },
  {
    q: "Are exports third-party verifier ready?",
    a: "Yes. Declarations include all required modules (A1-A3, B1-B7, C1-C4, D), data quality ratings (DQRs), and mandatory GPI indicator disclaimers in both PDF and ILCD+EPD JSON formats."
  },
  {
    q: "Can I use my own supplier-specific emission factors?",
    a: "Yes. The system allows you to override default ecoinvent datasets with Tier-1 supplier verified EPD data for high-impact components like compressors and heat exchangers."
  }
];
