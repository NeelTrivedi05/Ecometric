// Benchmark EPD & LCA dataset reflecting EN 15804+A2, GPI 5.0.1, and PCR 2019:14 standards
export const BENCHMARK_PRODUCTS = [
  {
    id: "carrier-11017",
    name: "Carrier AquaForce® Water-Cooled Liquid Chiller",
    refDoc: "EPD11017.pdf",
    pcr: "PCR 2019:14 Construction products v2.0.1 (EN 15804+A2)",
    declaredUnit: "1 Unit of HVAC Liquid Chiller (500 kW Nominal Capacity)",
    lciaMethod: "EF 3.1 (Feb 2023) Characterization Matrix",
    database: "ecoinvent 3.10 with verified characterization factors",
    massKg: 4250,
    refrigerant: "R-134a (GWP 1430)",
    summaryGwp: "42,850",
    stages: {
      "all": {
        gwpTotal: "42,850 kg CO2 eq",
        gwpFossil: "42,120 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq (Net Mass Balance)",
        ap: "186.4 mol H+ eq",
        pocp: "142.8 kg NMVOC eq",
        odp: "3.42E-04 kg CFC-11 eq",
        adpMinerals: "0.842 kg Sb eq",
        adpFossil: "594,200 MJ",
        wdp: "1,240 m3 world eq"
      },
      "a1_a3": {
        gwpTotal: "18,450 kg CO2 eq",
        gwpFossil: "18,120 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq",
        ap: "94.2 mol H+ eq",
        pocp: "68.5 kg NMVOC eq",
        odp: "1.12E-05 kg CFC-11 eq",
        adpMinerals: "0.789 kg Sb eq",
        adpFossil: "245,000 MJ",
        wdp: "620 m3 world eq"
      },
      "b1_b7": {
        gwpTotal: "19,200 kg CO2 eq",
        gwpFossil: "18,900 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq",
        ap: "68.1 mol H+ eq",
        pocp: "56.2 kg NMVOC eq",
        odp: "3.20E-04 kg CFC-11 eq",
        adpMinerals: "0.038 kg Sb eq",
        adpFossil: "288,000 MJ",
        wdp: "480 m3 world eq"
      },
      "c1_c4": {
        gwpTotal: "5,200 kg CO2 eq",
        gwpFossil: "5,100 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq",
        ap: "24.1 mol H+ eq",
        pocp: "18.1 kg NMVOC eq",
        odp: "1.08E-05 kg CFC-11 eq",
        adpMinerals: "0.015 kg Sb eq",
        adpFossil: "61,200 MJ",
        wdp: "140 m3 world eq"
      },
      "d": {
        gwpTotal: "-7,840 kg CO2 eq",
        gwpFossil: "-7,650 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq",
        ap: "-31.2 mol H+ eq",
        pocp: "-22.4 kg NMVOC eq",
        odp: "-2.10E-06 kg CFC-11 eq",
        adpMinerals: "-0.412 kg Sb eq",
        adpFossil: "-112,000 MJ",
        wdp: "-210 m3 world eq"
      }
    }
  },
  {
    id: "heatpump-150",
    name: "Industrial Variable-Speed Air-to-Water Heat Pump",
    refDoc: "EPD-HP-2024.pdf",
    pcr: "PCR 2019:14 Construction products v2.0.1",
    declaredUnit: "1 Unit of Heat Pump (150 kW Capacity)",
    lciaMethod: "EF 3.1 Characterization Engine",
    database: "ecoinvent 3.10 with verified characterization factors",
    massKg: 1850,
    refrigerant: "R-32 (GWP 675)",
    summaryGwp: "16,420",
    stages: {
      "all": {
        gwpTotal: "16,420 kg CO2 eq",
        gwpFossil: "16,210 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq (Net Balanced)",
        ap: "64.8 mol H+ eq",
        pocp: "48.2 kg NMVOC eq",
        odp: "9.12E-05 kg CFC-11 eq",
        adpMinerals: "0.315 kg Sb eq",
        adpFossil: "214,800 MJ",
        wdp: "485 m3 world eq"
      },
      "a1_a3": {
        gwpTotal: "7,850 kg CO2 eq",
        gwpFossil: "7,720 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq",
        ap: "32.1 mol H+ eq",
        pocp: "24.0 kg NMVOC eq",
        odp: "3.45E-06 kg CFC-11 eq",
        adpMinerals: "0.295 kg Sb eq",
        adpFossil: "98,000 MJ",
        wdp: "240 m3 world eq"
      },
      "b1_b7": {
        gwpTotal: "6,920 kg CO2 eq",
        gwpFossil: "6,850 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq",
        ap: "25.2 mol H+ eq",
        pocp: "18.4 kg NMVOC eq",
        odp: "8.50E-05 kg CFC-11 eq",
        adpMinerals: "0.012 kg Sb eq",
        adpFossil: "92,400 MJ",
        wdp: "195 m3 world eq"
      },
      "c1_c4": {
        gwpTotal: "1,650 kg CO2 eq",
        gwpFossil: "1,640 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq",
        ap: "7.5 mol H+ eq",
        pocp: "5.8 kg NMVOC eq",
        odp: "2.75E-06 kg CFC-11 eq",
        adpMinerals: "0.008 kg Sb eq",
        adpFossil: "24,400 MJ",
        wdp: "50 m3 world eq"
      },
      "d": {
        gwpTotal: "-3,120 kg CO2 eq",
        gwpFossil: "-3,050 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq",
        ap: "-12.4 mol H+ eq",
        pocp: "-8.9 kg NMVOC eq",
        odp: "-6.20E-07 kg CFC-11 eq",
        adpMinerals: "-0.165 kg Sb eq",
        adpFossil: "-44,500 MJ",
        wdp: "-88 m3 world eq"
      }
    }
  },
  {
    id: "precast-concrete",
    name: "Architectural Precast Low-Carbon Concrete Slab",
    refDoc: "EPD-CONC-2024.pdf",
    pcr: "PCR 2019:14 Construction products v2.0.1",
    declaredUnit: "1 m³ of Precast Structural Concrete",
    lciaMethod: "EF 3.1 Characterization Engine",
    database: "ecoinvent 3.10 with verified characterization factors",
    massKg: 2400,
    refrigerant: "None",
    summaryGwp: "215",
    stages: {
      "all": {
        gwpTotal: "215 kg CO2 eq",
        gwpFossil: "212 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq (Net Zero)",
        ap: "0.85 mol H+ eq",
        pocp: "0.64 kg NMVOC eq",
        odp: "1.42E-07 kg CFC-11 eq",
        adpMinerals: "0.0028 kg Sb eq",
        adpFossil: "2,420 MJ",
        wdp: "5.8 m3 world eq"
      },
      "a1_a3": {
        gwpTotal: "178 kg CO2 eq",
        gwpFossil: "176 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq",
        ap: "0.72 mol H+ eq",
        pocp: "0.54 kg NMVOC eq",
        odp: "1.15E-07 kg CFC-11 eq",
        adpMinerals: "0.0026 kg Sb eq",
        adpFossil: "1,980 MJ",
        wdp: "4.9 m3 world eq"
      },
      "b1_b7": {
        gwpTotal: "0 kg CO2 eq",
        gwpFossil: "0 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq",
        ap: "0.00 mol H+ eq",
        pocp: "0.00 kg NMVOC eq",
        odp: "0.00 kg CFC-11 eq",
        adpMinerals: "0.0000 kg Sb eq",
        adpFossil: "0 MJ",
        wdp: "0.0 m3 world eq"
      },
      "c1_c4": {
        gwpTotal: "37 kg CO2 eq",
        gwpFossil: "36 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq",
        ap: "0.13 mol H+ eq",
        pocp: "0.10 kg NMVOC eq",
        odp: "2.70E-08 kg CFC-11 eq",
        adpMinerals: "0.0002 kg Sb eq",
        adpFossil: "440 MJ",
        wdp: "0.9 m3 world eq"
      },
      "d": {
        gwpTotal: "-18 kg CO2 eq",
        gwpFossil: "-18 kg CO2 eq",
        gwpBiogenic: "0.00 kg CO2 eq",
        ap: "-0.08 mol H+ eq",
        pocp: "-0.06 kg NMVOC eq",
        odp: "-1.20E-08 kg CFC-11 eq",
        adpMinerals: "-0.0008 kg Sb eq",
        adpFossil: "-190 MJ",
        wdp: "-0.4 m3 world eq"
      }
    }
  }
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Import product data",
    desc: "Upload Bill of Materials (BOM), manufacturing energy consumption, refrigerant leak rates, and packaging specifications in seconds via CSV, Excel, or API.",
    badge: "Auto BOM Parsing",
    details: [
      "Direct ERP/PLM integration (SAP, Siemens, Autodesk)",
      "Automated mass allocation & unit normalization",
      "Cut-off rule verification (< 1% total mass/energy)"
    ]
  },
  {
    step: "02",
    title: "Connect LCA datasets",
    desc: "Auto-match raw parts and processes directly to ecoinvent 3.10 and verified national grid datasets without tedious manual mapping.",
    badge: "ecoinvent 3.10 Certified",
    details: [
      "Semantic AI entity matching for raw materials & alloys",
      "Country-specific electricity grid mixes",
      "Traceable background datasets with openLCA sync"
    ]
  },
  {
    step: "03",
    title: "Calculate impacts",
    desc: "Apply official characterization factors (EF 3.1, EN 15804, CML 2001, AWARE water) across all life cycle stages: A1-A3, B1-B7, C1-C4, and D.",
    badge: "EF 3.1 Matrix Engine",
    details: [
      "Automated matrix calculation — eliminates manual formulas",
      "No raw LCI discrepancies (solves EPD11017 factor gaps)",
      "Multi-stage contribution breakdown & sensitivity checks"
    ]
  },
  {
    step: "04",
    title: "Validate results",
    desc: "Run automated audits against GPI 5.0.1 rules and PCR 2019:14 guidelines. Net-zero biogenic carbon mass balance checks run automatically.",
    badge: "GPI 5.0.1 Compliant",
    details: [
      "Biogenic carbon mass balance check (Annex 2 net-zero rule)",
      "Mandatory disclaimer text injector for ADP & Water indicators",
      "Pre-verification error and anomaly detector"
    ]
  },
  {
    step: "05",
    title: "Generate EPD",
    desc: "Export an official, publication-ready EPD document in PDF format plus machine-readable digital formats (ILCD+EPD XML, openLCA archive).",
    badge: "Verifier-Ready Output",
    details: [
      "International EPD® System ready template",
      "Digital machine-readable ILCD+EPD XML export",
      "One-click submission package for accredited third-party verifiers"
    ]
  }
];

export const FEATURES_DATA = [
  {
    icon: "⚡",
    title: "Automated LCA",
    desc: "Calculate complete Life Cycle Inventories without manual matrix inversions. Seamlessly bridges raw ecoinvent flows with mandatory characterization factors.",
    pills: ["Matrix Inversion", "EF 3.1 Engine", "openLCA Sync"]
  },
  {
    icon: "📑",
    title: "EPD Generation",
    desc: "Transform verified LCA calculation models into branded, compliant Environmental Product Declarations meeting International EPD® System guidelines.",
    pills: ["GPI 5.0.1", "PCR 2019:14", "Pre-Verified"]
  },
  {
    icon: "🛡️",
    title: "Data Validation",
    desc: "Automated pre-audit verification engine checks biogenic carbon mass balance (PCR Annex 2), cut-off rules, and data quality requirements before submission.",
    pills: ["Biogenic Mass Balance", "Cut-off Audits", "Data Quality DQRs"]
  },
  {
    icon: "🔬",
    title: "Impact Assessment",
    desc: "Generate all EN 15804+A2 mandatory indicators: GWP (fossil, biogenic, luluc), AP, Eutrophication, POCP, ODP, ADP minerals/fossil, and AWARE water.",
    pills: ["GWP100", "AWARE Water", "CML ADP", "Accredited Factors"]
  },
  {
    icon: "🖨️",
    title: "PDF Generation",
    desc: "Produce pixel-perfect, verifier-ready 30-page declaration PDFs with automatically injected mandatory disclaimers, company branding, and methodology citations.",
    pills: ["Branded Templates", "Auto Disclaimers", "One-Click Export"]
  },
  {
    icon: "🗄️",
    title: "EPD Management",
    desc: "Centralize your company's full environmental product portfolio. Track 5-year renewal dates, product line updates, and verifier audit trails in one hub.",
    pills: ["Portfolio Dashboard", "5-Yr Validity Tracker", "Audit History"]
  }
];

export const WHO_ITS_FOR_DATA = [
  {
    avatar: "🏭",
    role: "Manufacturers",
    desc: "HVAC, industrial machinery, and building materials producers needing to publish certified EPDs to win commercial bids and meet EU climate rules.",
    perk: "Reduce EPD cycle from 6 months to 48 hours"
  },
  {
    avatar: "📐",
    role: "LCA Consultants",
    desc: "Sustainability and LCA specialists who want to multiply client throughput, eliminate tedious Excel formatting, and guarantee first-pass verifier approvals.",
    perk: "Scale client billable volume by 5x"
  },
  {
    avatar: "🌿",
    role: "Sustainability Teams",
    desc: "Corporate ESG leaders tracking product-level carbon footprints, decarbonization roadmaps, and verifiable Scope 3 upstream/downstream data.",
    perk: "Single source of truth for embodied carbon"
  },
  {
    avatar: "🏗️",
    role: "Construction Companies",
    desc: "General contractors and developers sourcing certified low-carbon materials to secure LEED v4.1, BREEAM, and DGNB project ratings.",
    perk: "Instant machine-readable EPD verification"
  }
];

export const FAQ_DATA = [
  {
    q: "Why did raw ecoinvent numbers differ from reference EPDs like Carrier Chiller EPD11017?",
    a: "Raw ecoinvent LCI contains unweighted elementary flows (thousands of raw emissions) with zero characterization factors applied. To match certified declarations, the correct LCIA methodology (EF 3.1, EN 15804+A2) must be applied in the calculation engine. EcoPulse automates this entire characterization matrix, guaranteeing exact indicator parity."
  },
  {
    q: "How does the platform handle the mandatory EF 3.1 version requirement?",
    a: "Since September 2024, EF 3.1 characterization factors are mandatory for International EPD System declarations under GPI 5.0.1. EcoPulse ships with the full EF 3.1 characterization matrix pre-loaded, preventing obsolete EF 3.0 or legacy CML factor mismatches."
  },
  {
    q: "What is the biogenic carbon net-zero mass balance rule?",
    a: "Under PCR 2019:14 (Annex 2), biogenic carbon uptake during raw material growth must balance out to net-zero across the complete product life cycle (cradle-to-grave) unless permanent carbon capture occurs. EcoPulse automatically verifies this mass balance, preventing common verifier rejections."
  },
  {
    q: "Is this platform compliant with PCR 2019:14 v2.0.1 for Chillers and HVAC?",
    a: "Yes! Because there is currently no dedicated c-PCR for HVAC chillers, base PCR 2019:14 (Construction products, EN 15804+A2) applies directly. EcoPulse enforces all base PCR rules, including the full suite of 10 mandatory resource use indicators."
  },
  {
    q: "Are the generated EPDs third-party verifier ready?",
    a: "Absolutely. Declarations generated by EcoPulse include all required sections, module breakdowns (A1-A3, B1-B7, C1-C4, D), mandatory GPI 5.0.1 indicator disclaimers, and data quality ratings (DQRs), formatted specifically for accredited verifiers."
  },
  {
    q: "Can I export digital machine-readable files as well as PDFs?",
    a: "Yes. Along with high-resolution publication PDFs, you can export digital machine-readable ILCD+EPD XML, openLCA project archives, and JSON payloads ready for BIM and digital building passport integrations."
  }
];

export const MACHINERY_EPD_DATA = [
  {
    id: "chiller",
    modelKey: "chiller",
    category: "HVAC & Thermal Systems",
    name: "Water-Cooled Centrifugal Chiller",
    image: "/machinery/chiller.jpg",
    tagline: "High-capacity district cooling and skyscraper central plant chiller",
    pcr: "PCR 2019:14 Construction products v2.0.1",
    standard: "EN 15804+A2 & UL 10010-4 Part B",
    drivers: ["LEED v4.1 Mat 01", "BREEAM International", "EPBD 2024 Mandate", "EU Taxonomy"],
    declaredUnit: "1 Complete Factory-Assembled Unit (500 kW Cooling)",
    typicalMass: "4,250 kg",
    typicalCapacity: "500 kW Nominal",
    refrigerantType: "R-134a (GWP 1430) / R-1234ze (GWP < 1)",
    gwpTypical: "42,850 kg CO₂e",
    gwpEmbodiedPct: 43,
    gwpOperationalPct: 45,
    gwpEndLifePct: 12,
    whyEpdRequired: "Chillers represent over 40% of building MEP embodied carbon and 30% of lifetime HVAC energy. Commercial tenders mandate PCR 2019:14 declarations to quantify refrigerant leakage (B1), auxiliary electrical draw (B6), and high-grade copper heat exchanger recycling (Module D).",
    keyHotspots: [
      { label: "B1 Fugitive Refrigerant", value: "Up to 2% annual charge leakage dominates GWP" },
      { label: "A1-A3 Copper & Shell", value: "1,200 kg drawn copper tube array in evaporator" },
      { label: "Module D Net Scrap", value: "Avoids 7,840 kg CO₂e via virgin metal displacement" }
    ],
    specs: [
      { label: "Operating Life", value: "20 Years" },
      { label: "Shell Pressure", value: "16 bar" },
      { label: "Acidification (AP)", value: "186 mol H⁺" },
      { label: "Water Deprivation", value: "1,240 m³ eq" }
    ]
  },
  {
    id: "heat-pump",
    modelKey: "heat_pump",
    category: "Decarbonized Heating",
    name: "Industrial Air-to-Water Heat Pump",
    image: "/machinery/heat_pump.jpg",
    tagline: "Large-scale reversible hydronic heat pump for building electrification",
    pcr: "PCR 2019:14 & EN 14825",
    standard: "EN 15804+A2 & Ecodesign Tier 2",
    drivers: ["Gas Boiler Phase-out EU", "F-Gas Regulation", "BREEAM Pol 01", "Level(s)"],
    declaredUnit: "1 Variable-Speed Hydronic Unit (150 kW Heating)",
    typicalMass: "1,850 kg",
    typicalCapacity: "150 kW Thermal",
    refrigerantType: "R-32 (GWP 675) / R-290 Propane (GWP 3)",
    gwpTypical: "14,600 kg CO₂e",
    gwpEmbodiedPct: 54,
    gwpOperationalPct: 38,
    gwpEndLifePct: 8,
    whyEpdRequired: "As public policy eliminates gas boilers, institutional procurements require verifiable cradle-to-grave EPDs to confirm that heat pump operational efficiency (SCOP > 4.2) outweighs manufacturing impacts from microchannel aluminum coils and inverter electronics.",
    keyHotspots: [
      { label: "A1 Inverter Power Board", value: "Rare earth magnets and silicon IGBT modules" },
      { label: "Low-GWP F-Gas Shift", value: "Transitioning to R-290 cuts EOL GWP by 98%" },
      { label: "Galvanized Chassis", value: "Polyester powder-coated steel frame durability" }
    ],
    specs: [
      { label: "SCOP Rating", value: "4.45 (35°C water)" },
      { label: "Airflow Fans", value: "Dual EC Axial" },
      { label: "Acidification (AP)", value: "68 mol H⁺" },
      { label: "Resource (ADP-F)", value: "192,000 MJ" }
    ]
  },
  {
    id: "ahu",
    modelKey: "ahu",
    category: "Air Management & Ventilation",
    name: "Commercial Air Handling Unit (AHU)",
    image: "/machinery/ahu.jpg",
    tagline: "Modular thermal-break ventilation unit with rotary heat recovery wheel",
    pcr: "Eurovent Air Handling Units EPD & PCR 2019:14",
    standard: "EN 1886 & EN 13053 / EN 15804+A2",
    drivers: ["WELL Building Standard", "Eurovent Certified", "DGNB Embodied Carbon", "ASHRAE 90.1"],
    declaredUnit: "1 Modular Air Handling Unit (12,000 m³/h Design Airflow)",
    typicalMass: "2,600 kg",
    typicalCapacity: "12,000 m³/h Airflow",
    refrigerantType: "Hydronic Coils (Zero Refrigerant)",
    gwpTypical: "11,800 kg CO₂e",
    gwpEmbodiedPct: 62,
    gwpOperationalPct: 29,
    gwpEndLifePct: 9,
    whyEpdRequired: "AHUs contain extensive double-skin sheet metal, mineral wool acoustic insulation, and aluminum sorption wheels. Green public procurement mandates certified EPDs to compare fan electrical efficiency (SFP) versus embodied carbon of the thermal-break casing.",
    keyHotspots: [
      { label: "A1 Casing Sheet Metal", value: "650 kg galvanized zinc-coated steel cladding" },
      { label: "Rotary Energy Recovery", value: "Aluminum desiccant matrix saves 78% thermal load" },
      { label: "Filtration Replacement", value: "B2 Maintenance: 40 filter changes across life" }
    ],
    specs: [
      { label: "Thermal Casing", value: "T2 / TB2 Class" },
      { label: "SFP Class", value: "SFP 1 (< 1.5 kW/m³/s)" },
      { label: "Acoustic Attenuation", value: "42 dB(A)" },
      { label: "Circular Credit D", value: "-3,400 kg CO₂e" }
    ]
  },
  {
    id: "transformer",
    modelKey: "transformer",
    category: "Electrical & Grid Infrastructure",
    name: "High-Voltage Power Transformer",
    image: "/machinery/transformer.jpg",
    tagline: "Eco-design mineral/ester oil-immersed medium-to-high voltage transformer",
    pcr: "PEP Ecopassport® PCR ed.4",
    standard: "IEC 60076 & EN 50588-1 Tier 2",
    drivers: ["EU Ecodesign Transformers", "Grid Utility Tenders", "ISO 14044 LCA", "CBAM"],
    declaredUnit: "1 Distribution Transformer (1,600 kVA / 20 kV)",
    typicalMass: "5,800 kg",
    typicalCapacity: "1,600 kVA Substation",
    refrigerantType: "Biodegradable Synthetic Ester Fluid",
    gwpTypical: "36,400 kg CO₂e",
    gwpEmbodiedPct: 35,
    gwpOperationalPct: 58,
    gwpEndLifePct: 7,
    whyEpdRequired: "Electrical distribution utilities mandate PEP Ecopassport declarations because transformer no-load and load core losses (B6) run continuously 24/7 for 30+ years. EPDs prove whether silicon-steel amorphous cores reduce total life cycle carbon.",
    keyHotspots: [
      { label: "Silicon Steel Core", value: "Grain-oriented magnetic core reduces load loss" },
      { label: "Dielectric Fluid", value: "Synthetic ester avoids toxic mineral oil spills" },
      { label: "Copper Windings", value: "2,100 kg oxygen-free copper conductor wire" }
    ],
    specs: [
      { label: "Voltage Class", value: "24 kV Primary" },
      { label: "Efficiency", value: "99.45% at Peak" },
      { label: "Reference Life", value: "30 Years" },
      { label: "Dielectric Volume", value: "1,800 Liters" }
    ]
  },
  {
    id: "boiler",
    modelKey: "boiler",
    category: "Industrial Process Heat",
    name: "Industrial Multi-Stage Steam Boiler",
    image: "/machinery/boiler.jpg",
    tagline: "Three-pass wetback firetube boiler with low-NOx modulating burner",
    pcr: "PCR Boilers and Combustors 2012:01",
    standard: "EN 12953 / EN 15804+A2",
    drivers: ["Industrial Emissions Directive", "ISO 50001", "Scope 1 Decarbonization", "BREEAM"],
    declaredUnit: "1 Shell Steam Boiler Unit (4,000 kg/h Steam)",
    typicalMass: "7,400 kg",
    typicalCapacity: "4,000 kg/h Steam (2.8 MW)",
    refrigerantType: "Natural Gas / Biomethane / H2-Ready",
    gwpTypical: "28,200 kg CO₂e (Manufacturing & Installation)",
    gwpEmbodiedPct: 78,
    gwpOperationalPct: 16,
    gwpEndLifePct: 6,
    whyEpdRequired: "Heavy manufacturing and food/pharma plants rely on high-pressure steam boilers. Industrial permit compliance and customer Scope 3 audits mandate verified EPDs documenting steel pressure vessel embodied carbon and hydrogen-blend readiness.",
    keyHotspots: [
      { label: "P265GH Boiler Steel", value: "Heavy forged carbon steel drum (22mm shell)" },
      { label: "Modulating Burner", value: "Digital combustion management with O2 trim" },
      { label: "Economizer Heat Recovery", value: "Flue gas heat exchanger cuts fuel intake 6%" }
    ],
    specs: [
      { label: "Design Pressure", value: "16 bar g" },
      { label: "Steam Purity", value: "99.5% Dryness" },
      { label: "Turn-Down Ratio", value: "1 : 8" },
      { label: "Circular Credit D", value: "-5,900 kg CO₂e" }
    ]
  },
  {
    id: "cooling-tower",
    modelKey: "cooling_tower",
    category: "Heat Rejection & Evaporative",
    name: "Induced-Draft Evaporative Cooling Tower",
    image: "/machinery/cooling_tower.jpg",
    tagline: "Counterflow cooling tower with low-drift aerofoil fan and PVC fill pack",
    pcr: "PCR 2019:14 & CTI STD-201",
    standard: "EN 15804+A2 & ASHRAE 90.1",
    drivers: ["Water Scarcity Footprint", "LEED Water Efficiency", "CTI Thermal Rating", "BREEAM"],
    declaredUnit: "1 Evaporative Cooling Tower Cell (1,200 kW Heat Rejection)",
    typicalMass: "2,900 kg (Dry Weight)",
    typicalCapacity: "1,200 kW Heat Rejection",
    refrigerantType: "Recirculating Water (Zero F-Gas)",
    gwpTypical: "9,700 kg CO₂e",
    gwpEmbodiedPct: 58,
    gwpOperationalPct: 32,
    gwpEndLifePct: 10,
    whyEpdRequired: "Cooling towers have unique environmental footprints dominated by the Water Deprivation Potential (WDP) metric rather than GWP. Verified EPDs provide independent validation of water drift elimination (<0.001%) and corrosion-resistant FRP/HDG materials.",
    keyHotspots: [
      { label: "Water Deprivation (WDP)", value: "Critical indicator under EF 3.1 evaluation" },
      { label: "Drift Eliminators", value: "Cellular PVC baffles stop aerosol droplet loss" },
      { label: "HDG Zinc Basin", value: "Hot-dip galvanized basin provides 25-yr service" }
    ],
    specs: [
      { label: "Water Flow Rate", value: "220 m³/h" },
      { label: "Fan Motor", value: "7.5 kW Direct Drive" },
      { label: "Drift Loss", value: "< 0.001% Circ." },
      { label: "Water Footprint", value: "3,850 m³ eq" }
    ]
  }
];
