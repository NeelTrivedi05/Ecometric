# Field Mapping Table: Reference EPD (EPD11017) to EcoMetric Data Model

This table maps every section, table, and data field from the reference document `EPD11017.pdf` (Carrier AquaEdge 19DV) to the EcoMetric application data model and the new Report Details input form.

| # | Template Field / Section | Source in Data Model / Schema | Data Type | Req/Opt | Fallback if Missing | Notes |
|---|---|---|---|---|---|---|
| **Cover Page (Page 1)** |
| 1.1 | Company Logo | `ReportDetails.company_logo` / `Organization.logo` | Image (PNG/SVG/DataURI) | Optional | Render company name as styled text | Top left of cover page & running footer |
| 1.2 | Document Title | Static: "Environmental\nProduct\nDeclaration" | Text | Required | Fixed standard title | 3-line bold title top right |
| 1.3 | Product Image | `ReportDetails.product_image` | Image (PNG/JPEG/DataURI) | Optional | Clean placeholder box or schematic | Large product image centered |
| 1.4 | Program Operator / Certification Badge | `ReportDetails.program_operator_logo` | Image | Optional | Omitted unless verified & uploaded | Bottom left of cover; Part F rule: only show if verified |
| 1.5 | Draft Watermark | Dynamic verification status | Boolean / Overlay | Required | "DRAFT: NOT THIRD-PARTY VERIFIED" | Rendered on all pages when `is_verified == False` |
| **Declaration Information Table (Page 2)** |
| 2.1 | Program Operator (Name, Address, Logo, Web) | `ReportDetails.program_operator_name`, `address`, `website`, `logo` | Text / URL | Optional | Omit row if not declared | NSF Certification, LLC in reference |
| 2.2 | General Program Instructions & Version | `ReportDetails.general_program_instructions` | Text | Required | "Part A: Life Cycle Assessment Calculations and Report Requirements Version 4.0" | Standard UL/NSF GPI |
| 2.3 | Manufacturer Name and Address | `ReportDetails.company_name`, `company_address` (prefilled from `extracted_data.project_info.manufacturer_name` / `User`) | Text | Required | Block export if company name missing | Propagated across all sections |
| 2.4 | Declaration Number | `ReportDetails.declaration_number` | Text | Required | Auto-generated: `EPD{timestamp}` | e.g. EPD11017 |
| 2.5 | Product and Functional Unit | `ReportDetails.product_name` + `extracted_data.project_info.functional_unit` | Text | Required | Product name + "1 ton chilling capacity" | e.g. AquaEdge 19DV, 1 ton chilling capacity |
| 2.6 | Reference PCR and Version Number | `ReportDetails.reference_pcr` (prefilled from `extracted_data.project_info.pcr_ref`) | Text | Required | "Part A: UL 10010 V4.0 (2022) / Part B: Water Cooled Chiller EPD Requirements (UL Environment V2.0, 2018)" | Standard PCR reference |
| 2.7 | Product's Intended Application and Use | `ReportDetails.intended_application` | Text | Required | "Chilled water generation for interior building climate control" | Application narrative |
| 2.8 | Product RSL | `extracted_data.operational.rsl_years` or `project_info.lifespan_years` | Integer / Text | Required | "25 years" | Reference service life |
| 2.9 | Markets of Applicability | `ReportDetails.markets` | Text | Required | "North America, Global" | Market scope |
| 2.10 | Date of Issue / Period of Validity | `ReportDetails.date_of_issue`, `validity_period` | Date / Text | Required | Issue: Current date; Validity: 5 Years | Standard 5-year validity |
| 2.11 | EPD Type | Static / `ReportDetails.epd_type` | Text | Required | "Product Specific" | Type III EPD |
| 2.12 | Range of Dataset Variability | `ReportDetails.dataset_variability` | Text | Required | "N/A" | Dataset variability |
| 2.13 | EPD Scope | `ReportDetails.epd_scope` | Text | Required | "Cradle-to-Grave" | Cradle-to-grave or cradle-to-gate |
| 2.14 | Year of reported primary data | `ReportDetails.primary_data_year` | Integer | Required | Current year - 1 (e.g. 2023) | Data temporal coverage |
| 2.15 | LCA Software and Version Number | Static | Text | Required | "EcoMetric EPD Platform v2.4 (OpenLCA & Ecoinvent Engine)" | LCA software provenance |
| 2.16 | LCI Database and Version Number | `epd_results.metadata.database_version` | Text | Required | "Ecoinvent v3.12 (Cut-off system model)" | Exact LCI database version |
| 2.17 | LCIA Methodology and Version Number | `results.methodology` | Text | Required | "TRACI 2.1 + CML-IA v4.1 + PEF" | Selected methodologies |
| 2.18 | PCR Review Panel | `ReportDetails.pcr_review_panel` | List[Text] | Optional | Omit row if empty | Panel chair & members |
| 2.19 | Independent Verification Statement | `ReportDetails.is_verified`, `verification_type` (INTERNAL/EXTERNAL) | Boolean / Enum | Required | `[ ] INTERNAL [ ] EXTERNAL` with draft warning | Checkboxes |
| 2.20 | LCA Conductor / Practitioner | `ReportDetails.lca_practitioner_name`, `org` (prefill from `User.full_name`) | Text | Required | User full name / organization | Practitioner name |
| 2.21 | LCA Independent Verifier | `ReportDetails.verifier_name`, `org`, `email`, `signature` | Text / Image | Optional (Required if verified) | Blank line if unverified | Hidden/blank unless `is_verified` |
| 2.22 | Limitations Text Box | `ReportDetails.limitations_text` | Rich Text | Required | Standard ISO 14025 / building-level comparability disclaimer | Bordered box beneath table |
| **Section 1: General Information (Pages 3-8)** |
| 3.1 | Description of Company | `ReportDetails.description_of_company` | Text (~600 chars) | Required | Company overview statement | Free-text paragraph |
| 3.2 | Product Description | `ReportDetails.product_description` | Text | Required | Technical description of product line | Product summary |
| 3.3 | CSI Division / Coverage | `project_info.csi_code` / `ReportDetails.csi_code` | Text | Optional | "CSI division 23 64 16.16" | Standard CSI code |
| 3.4 | Company Website Link | `ReportDetails.company_website` | URL | Optional | Omit link line if not provided | Clean link |
| 3.5 | Figure 1: Product Image + Caption | `ReportDetails.product_image` | Image + Text | Optional | Schematic illustration | Center-aligned with italic caption |
| 3.6 | Refrigerant & Charge Details | `extracted_data.operational.refrigerant_type`, `charge_kg` | Text / Float | Optional | Omit if not present | e.g. R-1233zd(E) |
| 3.7 | Hazardous Substances Statement | `ReportDetails.hazardous_substances_statement` | Text | Optional | Omit if empty | RCRA Subtitle 3 compliance |
| 3.8 | Technical Data Bullets | `ReportDetails.technical_data_bullets` | List[Text] | Optional | Standard chiller certification bullets | AHRI, ASME, IEEE compliance |
| 3.9 | Table 1: Technical Data | `extracted_data.operational` & `technical_data` | Table | Required | Chilling capacity, kW/ton at 100/75/50/25% load | AHRI 550/590 ratings |
| 3.10 | Table 2: Product Dimensions | `extracted_data.operational.dimensions` | Float (L, W, H) | Required | Length, Width, Height (m) | Physical envelope |
| 3.11 | Application Narrative | Computed: FU, RSL, ESL, Replacement Count | Text | Required | Formatted string with variables | 1 ton, 25 yr RSL, 75 yr ESL, 2 cycles |
| 3.12 | Table 3: Material Composition per FU | `extracted_data.bom` | Table | Required | Steel, Iron, Copper, Aluminum, Refrigerant, Other (kg & %) | Percentages sum to 100.00% |
| 3.13 | Manufacturing Narrative | `extracted_data.manufacturing` | Text | Required | Locations narrative & capital goods exclusion (0.12 kg CO2e/ton) | Charlotte, NC & Shanghai |
| 3.14 | Table 4: Functional Unit Details | Computed: Delivered Mass, Capacity, kg/FU | Table | Required | 1 ton FU, Total Mass (kg), Conversion factor (kg/FU) | Normalization baseline |
| 3.15 | Transportation Narrative & Table 5 | `extracted_data.transport`, `installation` | Table | Required | Truck >32t, distance km, ocean freight, capacity util 24% | Table 5 parameters |
| 3.16 | Installation Narrative & Table 6 | `extracted_data.installation` | Table | Required | Crane hours (3.0), diesel fuel (MJ/kg), packaging waste | Table 6 parameters |
| 3.17 | RSL & ESL Narrative & Table 7 | `operational.rsl_years`, `esl_years`, `annual_kwh` | Table | Required | RSL 25 yr, ESL 75 yr, 2 replacements, annual demand | Table 7 parameters |
| 3.18 | Modules B2-B5 Narrative & Tables 8-9 | `maintenance_b2`, `replacement_b4` | Tables | Required | Table 8 (B2: 2% leak rate, replacement kg) & Table 9 (B4: 2 cycles, refrigerant recovery 90%) | Maintenance & replacement |
| 3.19 | Operational Energy Use B6 & Tables 10-11 | `operational.annual_kwh`, `lifetime_kwh`, `grid_ef` | Tables | Required | Table 10 (annual/lifetime kWh) & Table 11 (grid mix & emission factor) | B6 operational profile |
| 3.20 | Disposal C1-C4 & Table 12 | `extracted_data.end_of_life`, `bom` | Table | Required | Mixed waste kg, reuse, landfill kg, recycling kg, distances | Must reconcile to total mass |
| **Section 2: LCA Methodology (Pages 9-10)** |
| 4.1 | Intro & Scope Narrative | `lca_methodology.system_boundary` | Text | Required | "This LCA is a Cradle-to-Grave study..." | Section 2 header |
| 4.2 | Figure 2: System Boundary Diagram | Programmatic SVG Generator | Diagram | Required | Dynamic 5-column stage flow diagram (A1-A2, A3, A4-A5, B1-B7, C1-C4) | Code-generated SVG, no static image |
| 4.3 | Table 13: Life Cycle Stages Included | Modules in scope (`A1`..`D`) | Table | Required | Columns A1-A5, B1-B7, C1-C4, D with 'x' and 'MND', plus Geographies | Table 13 matrix |
| 4.4 | Cut-off Criteria | `ReportDetails.cutoff_criteria_text` | Text | Required | 1% individual / 5% cumulative cutoff criteria text | Editable default |
| 4.5 | Allocation | `ReportDetails.allocation_text` | Text | Required | Cut-off method per ISO 14040/44 | Editable default |
| 4.6 | Data Quality | `ReportDetails.data_quality_text` | Text | Required | Primary BOM 2023 + secondary Ecoinvent v3.12 | Editable default |
| **Section 3: LCA Results (Pages 11-21)** |
| 5.1 | Parameter Definition Tables 14-17 | Static definitions for active methods | Tables | Required | CML, EN 15804+A2, Resource Flows, TRACI 2.1 | Only show for active methods |
| 5.2 | Core & Additional Indicators (Table 18/23) | `results.epd_results` (PEF/EN15804+A2) | Wide Table | Required | Scientific notation `1.65E+02`, modules A1-A3, A4, A5, B1-B7, C1-C4, C1-C4 breakdown, D | Repeated headers on page break |
| 5.3 | Resource Use & Waste Flows (Table 19/24) | `results.resource_flows` | Wide Table | Required | Renewable/non-renewable PER, secondary materials, hazardous/non-haz waste | Scientific notation |
| 5.4 | Alternate Method Tables (Table 20/21/25/26) | `results.cml_results`, `results.traci_results` | Wide Tables | Optional | CML-IA, TRACI 2.1 tables when calculated | Scientific notation |
| 5.5 | ISO 21930 Additional Categories (Table 22/27) | `results.iso21930_results` | Table | Optional | RW-high level, RW-intermediate, Recovered energy | Scientific notation |
| 5.6 | Table Footnotes & Disclaimers | Standard disclaimers 1-9 | Text | Required | ADP/Water uncertainty, Ionizing radiation, Eutrophication unit note | Footnotes below tables |
| **Section 4: Interpretation & Charts (Pages 22-24)** |
| 6.1 | Figure 3: GWP per FU by Module | Matplotlib Chart from `results` | Image/Chart | Required | Stacked bar chart of modules (A1-A3, A4, A5, B2, B4, B6, C1-C4) | Clean palette matching reference |
| 6.2 | Figure 4: Acidification (AP) per FU | Matplotlib Chart from `results` | Image/Chart | Required | Stacked bar chart of modules for AP | Matched styling |
| 6.3 | Figure 5: Contribution excluding B6 | Matplotlib Chart from `results` | Image/Chart | Optional | 100% stacked bar across GWP, ODP, AP, EP, POCP | Shown when B6 dominates |
| 6.4 | Figure 6: Material Contribution (A1-A3) | Matplotlib Chart from `bom` | Image/Chart | Required | Bar chart of % contribution by material (Steel, Iron, Copper, etc.) | High to low order |
| 6.5 | Figure 7: Multi-Location Comparison | Matplotlib Chart from variants | Image/Chart | Optional | US vs China (A1-A5) stacked bar | Only if multi-location declared |
| 6.6 | Table 28: Supplemental B6 Scenarios | `results.supplemental_b6` | Table | Optional | Electricity grid switching (Global, Europe, China) | Table 28 format |
| 6.7 | Interpretation Narrative | Dynamically filled templates | Text | Required | Computed shares (dominant module, material shares) | Factual, conditional text |
| **Closing & Integrity (Page 25)** |
| 7.1 | Assumptions and Limitations | `ReportDetails.assumptions_text` | Text | Required | Ecoinvent dataset selection, regional grid approximations | Editable default |
| 7.2 | References | Standard ISO/EN/PCR list + `ReportDetails.extra_references` | List[Text] | Required | ISO 14025, ISO 14040/44, ISO 21930, EN 15804, UL 10010-4, TRACI, AHRI, plus user refs | Consistent citation format |
| 7.3 | Traceability & Integrity Stamp | Generated UTC timestamp, version, DB version, SHA256 hash | Text / Block | Required | Stamped in footer and final page | Non-tamper proof audit trail |
