export interface TopicPoint {
  heading: string;
  body: string;
}

export interface SourceLink {
  title: string;
  url: string;
}

export interface AboutTopic {
  id: string;
  tabLabel: string;
  title: string;
  intro: string;
  points: TopicPoint[];
  tags: string[];
  sources: SourceLink[];
}

export const aboutTopics: AboutTopic[] = [
  {
    id: "more-info",
    tabLabel: "More Info",
    title: "EcoMetric Mission & Platform Architecture",
    intro: "EcoMetric is an automated Environmental Product Declaration and Life Cycle Assessment platform built specifically for industrial manufacturers, HVAC engineering teams, and mechanical equipment producers. Our mission is to transform complex, multi-month environmental compliance workflows into an instantaneous, audit-ready digital process. By connecting production Bill of Materials directly to verified background databases, EcoMetric enables continuous decarbonization with total transparency.",
    points: [
      {
        heading: "Automated Life Cycle Inventory Engine",
        body: "EcoMetric ingests raw manufacturing Bills of Materials and energy logs, automatically linking component materials to ecoinvent v3.12 cutoff datasets. This eliminates manual data entry errors and standardizes material mapping across global supply chains."
      },
      {
        heading: "Multi-Standard Compliance Calculations",
        body: "The platform calculates environmental impacts across PEF 3.0, EF 3.1, and ISO 14040/44 characterization models. Generated reports adhere to ISO 14025 Type III rules, EN 15804+A2, and ISO 21930 building standards."
      },
      {
        heading: "End-to-End Modular Life Cycle Scope",
        body: "EcoMetric calculates mandatory cradle-to-gate (Modules A1–A3) impacts alongside transport, installation, operational use (B1–B7), and end-of-life treatment (C1–C4/D). This provides manufacturers with complete visibility into both embodied and operational carbon footprints."
      },
      {
        heading: "Cryptographic & Tabular Data Lineage",
        body: "Every metric generated carries complete cryptographic and tabular traceability back to its background unit process. Independent verifiers can inspect exact dataset UUIDs, allocation choices, and transport distances without relying on black-box assumptions."
      },
      {
        heading: "Instant Export to Global Registries",
        body: "Completed assessments export seamlessly into machine-readable ILCD+EPD XML, openEPD JSON, and published PDF formats. This ensures instant compatibility with international EPD registries and green building databases."
      }
    ],
    tags: ["Automated LCA", "HVAC & Mechanical", "Type III EPD", "Data Lineage", "openEPD Ready"],
    sources: [
      { title: "EcoMetric Platform Architecture & Specification", url: "#about" }
    ]
  },
  {
    id: "epd",
    tabLabel: "EPD Overview",
    title: "Environmental Product Declarations (ISO 14025)",
    intro: "An Environmental Product Declaration (EPD) is an independently verified document that communicates transparent, objective, and comparable data about a product's environmental impact across its life cycle. Unlike unverified green marketing claims, EPDs are grounded in rigorous Life Cycle Assessments governed by international standards. They serve as the definitive benchmark for sustainable procurement and green building compliance.",
    points: [
      {
        heading: "ISO 14025 Type III Declaration Framework",
        body: "EPDs are categorized under ISO 14025 as Type III environmental declarations. They differ from Type I ecolabels and Type II self-declared claims by providing quantified life cycle impact data rather than pass-fail threshold badges."
      },
      {
        heading: "Dual Report Structure",
        body: "An EPD workflow produces two key documents: a confidential LCA Background Report detailing inventory data and cut-off rules for the independent verifier, and a public EPD Document presenting verified impact indicators."
      },
      {
        heading: "Modular Life Cycle Stages",
        body: "Impacts are reported across standardized modules: raw material supply (A1), transport (A2), manufacturing (A3), construction (A4–A5), use (B1–B7), end-of-life (C1–C4), and circular benefits beyond the system boundary (D)."
      },
      {
        heading: "Independent Third-Party Verification",
        body: "Before publication, every EPD must undergo auditing by an accredited independent verifier or recognized verifier body. This guarantees data integrity, methodology compliance, and protection against greenwashing."
      },
      {
        heading: "Five-Year Validity & Registry Publication",
        body: "Once verified, EPDs are registered in program libraries like the International EPD System or UL Solutions with a standard 5-year validity. They provide standardized environmental data for architects, engineers, and public procurement officials."
      }
    ],
    tags: ["ISO 14025", "Type III Declaration", "Third-Party Verified", "Life Cycle Modules", "EPD Registry"],
    sources: [
      { title: "EPD International — What is an EPD", url: "https://www.environdec.com/getting-started/what-is-epd" },
      { title: "EPD International — PCR Library", url: "https://www.environdec.com/pcr-library" }
    ]
  },
  {
    id: "iso-standards",
    tabLabel: "ISO Standards",
    title: "Standardization Frameworks (ISO & EN Norms)",
    intro: "International and European standards establish the scientific methodology and reporting protocols required for verified environmental declarations. They define how data is collected, how system boundaries are drawn, and how impact calculations must be performed. Adherence to these standards ensures that EPDs produced globally remain directly comparable and legally defensible.",
    points: [
      {
        heading: "ISO 14040: Principles and Framework",
        body: "ISO 14040 defines the foundational principles and structural framework for conducting a Life Cycle Assessment. It outlines the four core phases: Goal & Scope, Inventory Analysis, Impact Assessment, and Interpretation."
      },
      {
        heading: "ISO 14044: Technical Requirements & Guidelines",
        body: "ISO 14044 specifies operational guidelines for executing LCAs. It mandates strict data quality metrics, allocation rules for co-products, cut-off criteria, and critical review procedures."
      },
      {
        heading: "ISO 14025: Type III Declaration Rules",
        body: "ISO 14025 governs the creation and operation of EPD programs. It defines procedures for developing Product Category Rules, managing public disclosures, and carrying out independent verification."
      },
      {
        heading: "EN 15804+A2: European Construction Core PCR",
        body: "EN 15804+A2 is the mandatory European standard for building product EPDs. It mandates modular reporting (A1–D), climate sub-indicators (fossil, biogenic, LULUC), and alignment with Environmental Footprint (EF 3.1) rules."
      },
      {
        heading: "ISO 21930: International Building Material Rules",
        body: "ISO 21930 provides the global counterpart to EN 15804 for construction products and civil engineering works. It establishes baseline requirements widely adopted across North American and Asian markets."
      }
    ],
    tags: ["ISO 14040/44", "ISO 14025", "EN 15804+A2", "ISO 21930", "Harmonized Norms"],
    sources: [
      { title: "ISO 14040:2006 Life Cycle Assessment Principles", url: "https://www.iso.org/standard/37456.html" },
      { title: "ISO 14044:2006 Life Cycle Assessment Requirements", url: "https://www.iso.org/standard/38498.html" },
      { title: "ISO 14025:2006 Environmental Declarations", url: "https://www.iso.org/standard/38131.html" },
      { title: "ISO 21930:2017 Building & Construction Rules", url: "https://www.iso.org/standard/61693.html" }
    ]
  },
  {
    id: "pcr",
    tabLabel: "Product Category Rules",
    title: "Product Category Rules (PCR)",
    intro: "Product Category Rules (PCR) serve as the specific instruction manuals for conducting LCAs and creating EPDs within a designated product group. Because different products require different evaluation rules, PCRs ensure that all manufacturers within a sector use identical functional units, allocation methods, and data boundaries. This standardization enables true apples-to-apples comparisons between competing products.",
    points: [
      {
        heading: "Two-Tier Hierarchical Structure",
        body: "PCR frameworks are divided into Part A and Part B documents. Part A defines general calculation rules for an entire sector, while Part B provides specific guidelines for individual product categories like insulation or chillers."
      },
      {
        heading: "Functional Unit & Declared Unit Definitions",
        body: "PCRs prescribe the exact unit of measurement used in the assessment. For example, an HVAC PCR may specify 1 kW of delivered cooling capacity over a 15-year service life, while an insulation PCR uses 1 m² of thermal resistance."
      },
      {
        heading: "System Boundaries & Cut-off Thresholds",
        body: "A PCR establishes which life cycle stages must be included and sets strict cut-off criteria. Typically, processes contributing less than 1% of total mass or energy may be excluded if cumulative exclusions stay below 5%."
      },
      {
        heading: "UL 10010 Framework Integration",
        body: "The UL 10010 PCR series provides standardized Part A rules alongside Part B sub-category rules for building envelope and mechanical products in North America, harmonizing regional reporting with global norms."
      },
      {
        heading: "Open Consultation & 5-Year Revision Cycle",
        body: "PCRs are developed through open public consultation involving industry stakeholders, verifiers, and LCA experts. They undergo mandatory review and re-authorization every 5 years to reflect evolving technological baselines."
      }
    ],
    tags: ["Part A & Part B", "Functional Unit", "UL 10010 Series", "Cut-off Criteria", "Program Operators"],
    sources: [
      { title: "EPD International — PCR Library & Rules", url: "https://www.environdec.com/pcr-library" },
      { title: "UL Solutions — EPD & PCR Program (UL 10010)", url: "https://www.ul.com" }
    ]
  },
  {
    id: "lca",
    tabLabel: "Life Cycle Assessment",
    title: "Life Cycle Assessment (LCA) Methodology",
    intro: "Life Cycle Assessment (LCA) is a science-based, quantitative methodology used to compile and evaluate all inputs, outputs, and environmental impacts of a product system across its life cycle. From raw material extraction through manufacturing, distribution, use, and final disposal, LCA provides a comprehensive view of environmental performance. It forms the technical backbone of every valid Environmental Product Declaration.",
    points: [
      {
        heading: "Phase 1: Goal and Scope Definition",
        body: "The initial phase establishes the purpose of the study, the target functional unit, system boundaries (cradle-to-gate vs. cradle-to-grave), data quality goals, and mandatory allocation principles."
      },
      {
        heading: "Phase 2: Life Cycle Inventory (LCI)",
        body: "LCI involves compiling raw material inputs, water, energy consumption, and emissions to air, water, and soil for every unit process within the system boundary across multi-tier supply chains."
      },
      {
        heading: "Phase 3: Life Cycle Impact Assessment (LCIA)",
        body: "LCIA models inventory flows into quantified environmental impact categories—such as Global Warming Potential and Eutrophication—using validated scientific characterization models like EF 3.1."
      },
      {
        heading: "Phase 4: Interpretation & Sensitivity Analysis",
        body: "The final phase evaluates hotspot drivers, verifies data quality, and performs scenario analysis to deliver actionable findings for design optimization and third-party auditing."
      },
      {
        heading: "System Boundaries & Scope Flexibility",
        body: "LCA studies can be configured as Cradle-to-Gate (Modules A1–A3) for business-to-business components, or Cradle-to-Grave (Modules A1–C4) for complete equipment subject to operational use phase analysis."
      }
    ],
    tags: ["4 Phase LCA", "Goal & Scope", "LCI Inventory", "LCIA Characterization", "System Boundaries"],
    sources: [
      { title: "European Platform on LCA (EPLCA / JRC)", url: "https://eplca.jrc.ec.europa.eu" },
      { title: "ISO 14040:2006 Life Cycle Assessment Principles", url: "https://www.iso.org/standard/37456.html" }
    ]
  },
  {
    id: "gwp-impacts",
    tabLabel: "GWP & Impacts",
    title: "Global Warming Potential & Impact Indicators",
    intro: "Environmental Product Declarations evaluate multiple environmental impact metrics beyond simple greenhouse gas emissions. Using standard characterization factors, LCAs convert complex chemical releases into standardized indicators such as CO2 equivalents or SO2 equivalents. Understanding these indicators allows engineering teams to minimize unintended environmental trade-offs during product re-design.",
    points: [
      {
        heading: "IPCC AR6 GWP100 Climate Metrics",
        body: "Global Warming Potential over a 100-year timeframe (GWP100) measures greenhouse gas heat retention relative to carbon dioxide. EcoMetric applies the latest IPCC Sixth Assessment Report (AR6) characterization factors."
      },
      {
        heading: "Disaggregated Climate Sub-Indicators",
        body: "Under EN 15804+A2 and EF 3.1, climate impact is split into four distinct sub-indicators: GWP-fossil (fossil fuel combustion), GWP-biogenic (biological carbon flows), GWP-luluc (land use change), and GWP-total."
      },
      {
        heading: "Acidification & Eutrophication Potentials",
        body: "Acidification Potential (AP) measures soil and water acidity caused by sulfur and nitrogen oxides. Eutrophication Potential (EP) measures excess nutrient enrichment in freshwater, marine, and terrestrial ecosystems."
      },
      {
        heading: "Ozone Depletion & Photochemical Smog",
        body: "Ozone Depletion Potential (ODP) quantifies damage to the stratospheric ozone layer in kg CFC-11 equivalents. Photochemical Ozone Creation Potential (POCP) measures ground-level smog formation in kg NMVOC equivalents."
      },
      {
        heading: "Abiotic Resource & Water Scarcity Depletion",
        body: "Abiotic Depletion Potential tracks the scarcity of non-fossil elements (ADPE in kg Sb eq) and fossil fuel reserves (ADPF in MJ). Water Deprivation Potential (WDP) evaluates net water consumption weighted by regional scarcity."
      }
    ],
    tags: ["IPCC AR6", "GWP100", "EF 3.1 Indicators", "Acidification & Smog", "Abiotic Depletion"],
    sources: [
      { title: "IPCC Sixth Assessment Report (AR6)", url: "https://www.ipcc.ch/assessment-report/ar6/" },
      { title: "European Platform on LCA — EF Node Data", url: "https://eplca.jrc.ec.europa.eu/EF-node/" }
    ]
  },
  {
    id: "sustainability",
    tabLabel: "Sustainability Frameworks",
    title: "Green Building & Climate Accounting Frameworks",
    intro: "EPDs play a pivotal role in major global sustainability certifications, corporate carbon reporting, and international policy frameworks. By converting complex environmental data into standardized, verified disclosures, EPDs bridge the gap between factory-floor manufacturing data and global climate commitments.",
    points: [
      {
        heading: "LEED v4.1 MR Credit Compliance",
        body: "USGBC LEED v4.1 awards Materials and Resources (MR) points for selecting products with Type III EPDs. Project teams earn credits for sourcing 20+ verified products and additional points for demonstrating embodied carbon reductions."
      },
      {
        heading: "GHG Protocol Scope 1, 2, and 3 Integration",
        body: "EPD life cycle modules map directly to GHG Protocol reporting scopes. Factory emissions (A1–A3) map to Scope 3 Category 1 (Purchased Goods), while equipment use (B1–B7) feeds into Scope 3 Category 11."
      },
      {
        heading: "UN SDG 9: Sustainable Industry & Infrastructure",
        body: "Verified EPD disclosures support SDG 9 by driving industrial innovation, encouraging sustainable manufacturing upgrades, and fostering resilient infrastructure supply chains."
      },
      {
        heading: "UN SDG 12: Responsible Consumption & Production",
        body: "EPDs enable transparent material accounting across global supply chains, directly supporting SDG 12 targets by eliminating greenwashing and promoting circular material reuse."
      },
      {
        heading: "UN SDG 13: Decarbonization & Climate Action",
        body: "By measuring embodied carbon alongside operational emissions, EPD disclosures empower specifiers and procurement teams to make climate-aligned material choices consistent with net-zero targets."
      }
    ],
    tags: ["LEED v4.1 MR Credit", "GHG Protocol Scope 3", "UN SDG 9", "UN SDG 12", "UN SDG 13"],
    sources: [
      { title: "USGBC LEED v4.1 Rating System", url: "https://www.usgbc.org/leed" },
      { title: "GHG Protocol Standards & Guidance", url: "https://ghgprotocol.org" },
      { title: "United Nations Sustainable Development Goals", url: "https://sdgs.un.org/goals" }
    ]
  },
  {
    id: "data-quality",
    tabLabel: "Data & Quality",
    title: "Background LCA Databases & Uncertainty Modeling",
    intro: "The accuracy of any LCA depends on the quality of its underlying secondary data and background databases. High-integrity EPD tools combine precise primary factory data with audited secondary background datasets. Quantitative data quality scoring and uncertainty propagation ensure that reported environmental footprints remain robust and audit-proof.",
    points: [
      {
        heading: "ecoinvent v3.12 LCI Database Integration",
        body: "ecoinvent is the world's leading background life cycle inventory database, containing over 20,000 international activity datasets covering energy, raw metals, plastics, industrial chemicals, and freight transport."
      },
      {
        heading: "Cutoff Allocation System Model",
        body: "The ecoinvent cutoff system model is the mandatory background data allocation method for EN 15804+A2 EPDs. Under cutoff rules, primary material producers bear environmental burdens through disposal, while recycled inputs enter burden-free."
      },
      {
        heading: "openLCA Engine Matrix Calculations",
        body: "openLCA provides an open-source, high-performance LCA calculation engine. It resolves supply chain linear algebra matrices (g = A⁻¹ · f) to trace multi-tier cumulative emissions across complex manufacturing processes."
      },
      {
        heading: "Pedigree Matrix Data Quality Assessment",
        body: "Data quality is evaluated across 5 key dimensions: Reliability, Completeness, Temporal representativeness, Geographic representativeness, and Technological representativeness. Each parameter receives a score from 1 (high) to 5 (proxy)."
      },
      {
        heading: "Monte Carlo Uncertainty Simulations",
        body: "Pedigree quality scores convert into standard lognormal geometric standard deviations (σ²). Running Monte Carlo simulations propagates background data uncertainties to establish statistical confidence intervals for final GWP figures."
      }
    ],
    tags: ["ecoinvent v3.12", "Cutoff System Model", "openLCA Engine", "Pedigree Matrix", "Monte Carlo Uncertainty"],
    sources: [
      { title: "ecoinvent Database v3.12 Overview", url: "https://ecoinvent.org" },
      { title: "openLCA Open Source LCA Software", url: "https://www.openlca.org" }
    ]
  }
];
