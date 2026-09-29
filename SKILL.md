---
name: ecometric-epd-lca
description: >
  EcoMetric is an industrial Environmental Product Declaration (EPD) and Life-Cycle Assessment (LCA)
  platform for HVAC chillers. It ingests Bills of Materials, transport manifests, installation specs,
  operational parameters, and end-of-life circularity data to compute full cradle-to-grave impact
  assessments compliant with UL 10010-4 Part B v2.0, EN 15804+A2, ISO 14025/21930, and powered by
  ecoinvent v3.12 LCIA characterization factors. Use this skill for any task involving EPD generation,
  LCIA calculation, PCR compliance, PDF export, or data ingestion in this workspace.
---

# EcoMetric EPD / LCA Platform Skill

## Project Summary

EcoMetric is a monorepo platform with three layers:

- **`frontend/`** — Next.js 15 App Router web app with a 6-step EPD creation wizard, interactive 3D
  scrollytelling showcase, and real-time LCIA results dashboard.
- **`backend/`** — Python FastAPI service with pure computational LCA engines, ecoinvent v3.12
  emission factor lookup, PCR rule validation, and Playwright-based PDF export.
- **`database/`** — SQLAlchemy ORM, Alembic migrations, PCR rule seeds, and 50-city weather bin
  hour datasets in `database/seed/`.

## Standards & Compliance

All calculations and document outputs conform to:

| Standard | Scope |
|---|---|
| **UL 10010-4 Part B v2.0 (2018)** | Product Category Rules for Water-Cooled Chillers |
| **UL 10010 Part A v4.0 (2022)** | LCA Calculation Rules and Report Requirements |
| **ISO 14025 / ISO 21930:2017** | Type III Environmental Declarations |
| **EN 15804+A2** | Core rules for construction product EPDs |
| **AHRI 550/590 (2020)** | Performance Rating of Water-Chilling Packages |

## Architecture & Key Engine Files

### Backend Engines (`backend/app/engines/`)

| Engine File | Purpose |
|---|---|
| `calculate_epd.py` | Main LCIA calculation orchestrator — multiplies BOM masses by emission factors across all 16 modules |
| `calc_engine.py` | Legacy simplified GWP-only calculator |
| `extract_ef_values.py` | Resolves ecoinvent provider IDs to characterization factor vectors from `emission_factors.json` |
| `epd_pdf_generator.py` | Assembles `EpdReport` data object and renders 25-page HTML → Playwright PDF matching EPD11017 layout |
| `epd_document_generator.py` | Generates structured JSON EPD conforming to `epd_chiller_nsf_ul10010-4_v2` template schema |
| `epd_charts.py` | Matplotlib server-side chart generation (GWP stacked bar, AP bar, no-B6 bar, material contribution pie) |
| `epd_validator.py` | Pre-export validation gate: mass balance, module sum integrity, required field checks |
| `system_boundary_svg.py` | Programmatic vector SVG system boundary diagram (Figure 2 in the EPD) |
| `excel_extractor.py` | Multi-sheet XLSX ingestion with header detection and BOM/transport/installation parsing |
| `messy_data_parser.py` | CSV/JSON fuzzy field parser that maps heterogeneous uploads to canonical extracted_data schema |
| `pdf_extractor.py` | Vector PDF text extraction with regex for nameplate data, capacity, refrigerant charge |
| `pcr_validation.py` | PCR completeness gate — checks cut-off rules, missing transport, mandatory modules |
| `pcr_rules_engine.py` | Rule engine for UL 10010-4 compliance scoring |
| `process_chain_engine.py` | Process node graph builder for supply-chain entanglement tracking |
| `dqr_engine.py` | Data Quality Rating engine (temporal, geographical, technological representativeness) |
| `verification_package.py` | Generates third-party verification packages with SHA-256 lineage hashes |
| `openepd_serializer.py` | Serializes results to openEPD JSON-LD format |

### Data Flow

```
Upload Files (XLSX/CSV/JSON/PDF)
  → messy_data_parser / excel_extractor / pdf_extractor
  → Canonical extracted_data schema
  → extract_ef_values (resolve ecoinvent providers)
  → calculate_epd (multiply mass × EF across 16 modules)
  → epd_results.json (25 LCIA indicators × 16 life-cycle stages)
  → epd_pdf_generator (EpdReport + HTML + Playwright → PDF)
```

### Canonical `extracted_data` Schema

The unified data structure passed between ingestion and calculation:

```
extracted_data:
  project_info:       {product_name, manufacturer_name, functional_unit, lifespan_years, ...}
  bom:                [{id, name, material, mass, supplier, transport_km, provider_id}, ...]
  transport:          [{leg_id, mode, distance_km, mass_kg, provider_id}, ...]
  manufacturing:      {annual_facility_kwh, natural_gas_mj, grid_region, water_m3}
  installation:       {outbound_transport_km, rigging_crane_diesel_liters, installation_energy_kwh, ...}
  operational:        {refrigerant_type, refrigerant_charge_kg, annual_leak_rate_percent, efficiency_kw_per_ton, capacity_rt, iplv_kw_per_ton, ...}
  maintenance_b2:     {consumable_mass_kg, provider_id}
  repair_b3:          {repair_events_per_rsl, part_mass_kg, ...}
  replacement_b4:     {esl_years}
  refurbishment_b5:   {refurbishment_events_per_rsl, mass_kg, ...}
  end_of_life:        {recycling_rate_percent, landfill_rate_percent, incineration_rate_percent, decommissioning_energy_kwh, waste_transport_km}
  circularity_d:      {steel_scrap_recovery_rate, copper_scrap_recovery_rate, aluminium_recovery_rate, net_avoided_burden_gwp_kg}
```

## Life-Cycle Modules (16 + Module D)

| Module | Description | Source Stage |
|---|---|---|
| A1 | Raw Material Supply (BOM) | `bom` items × material EFs |
| A2 | Inbound Transport | `transport` legs × tkm EFs |
| A3 | Manufacturing | Facility energy × grid EFs |
| A4 | Outbound Transport to Site | `installation.outbound_transport_km` |
| A5 | Installation & Commissioning | Crane diesel + commissioning kWh + refrigerant test loss |
| B1 | Fugitive Emissions | Refrigerant leak: charge × annual_leak_rate × RSL × GWP |
| B2 | Maintenance | Lubricant replacement cycles |
| B3 | Repair | Tube re-tubing, anode replacement |
| B4 | Replacement | Major overhaul at year 15, full chiller replacement for ESL > RSL |
| B5 | Refurbishment | Condenser tube bundle replacement |
| B6 | Operational Energy | capacity_rt × efficiency × annual_hours × RSL × grid EF |
| B7 | Operational Water | Cooling tower evaporation |
| C1 | Deconstruction | Dismantling energy (torch cutting, refrigerant recovery) |
| C2 | Waste Transport | To recycling/landfill facility |
| C3 | Waste Processing | Metal recycling sorting |
| C4 | Final Disposal | Inert landfill of non-recyclable fraction |
| D | Benefits Beyond System Boundary | Net avoided burden credits (secondary steel, copper, aluminium) |

## LCIA Methodologies Supported

The platform supports three impact assessment methodologies:

- **EF v3.1 (EN 15804+A2)** — 25 impact categories (default)
- **TRACI v2.1** — 6 impact categories (US EPA)
- **CML-IA v4.1** — European baseline

## Test Suite (`test/`)

| File | Covers |
|---|---|
| `02_air_cooled_screw_chiller_bom.xlsx` | Module A1: 9-part BOM for 300 RT screw chiller |
| `03_modular_heat_pump_bom.csv` | Module A1: 8-part BOM for 150 RT heat pump |
| `04_incomplete_bom_for_gap_analysis.csv` | PCR gap gate: triggers cut-off warnings |
| `05_complete_project_payload.json` | Full JSON project state with all lifecycle stages |
| `06_multimodal_inbound_logistics_manifest_A2.csv` | Module A2: 9 multimodal transport legs |
| `07_jobsite_installation_and_rigging_A4_A5.xlsx` | Modules A4–A5: 3-sheet workbook |
| `08_operational_use_and_maintenance_B1_to_B7.csv` | Modules B1–B7: 15-row operational CSV |
| `09_end_of_life_and_circularity_C1_to_D.json` | Modules C1–C4 + D: recycling, landfill, credits |
| `11_water_cooled_centrifugal_multitab_master.xlsx` | Full A1–D: 6-tab master workbook |

## Known Conventions & Gotchas

1. **Functional Unit**: Always `1 ton chilling capacity`. All LCIA table values must be divided by
   `capacity_rt` before display.
2. **Scientific Notation**: All numeric results in tables use `X.XXE±XX` format (3 significant
   digits), generated by `format_scientific()` / `to_sci()`.
3. **Material Classification Order**: When categorizing BOM materials into Steel/Aluminium/Iron/
   Copper/Other groups, always check `"alum"` before `"iron"/"cast"` to prevent
   `aluminium_cast_alloy` from matching the `"cast"` substring in the Iron check.
4. **Module D**: Classified as MND (Module Not Declared) per UL 10010-4 baseline. Displayed
   separately from the A1–C4 cradle-to-grave totals.
5. **Operating Hours**: File 08 may specify continuous duty (8,760 hrs/yr) vs. the PCR standard
   2,200 hrs/yr. The value from `operational.annual_operating_hours` takes precedence when present.
6. **EOL Rates**: End-of-life recovery fractions (recycling %, landfill %, incineration %) must
   come from `end_of_life` data, not hardcoded defaults.
7. **Emission Factor Resolution**: All providers are resolved through `extract_ef_values.py` which
   maps canonical `provider_id` strings (e.g. `ecoinvent_steel_hot_rolled_glo`) to the full EF v3.1
   characterization vector stored in `backend/data/emission_factors.json`.
8. **PDF Export**: Uses Playwright Chromium headless to render paged-media HTML into US Letter PDF.
   Requires `playwright install chromium` on first run.
9. **Verification Hash**: SHA-256 lineage hash computed from declaration number + product name +
   methodology + calculation fingerprint. Stamped into the PDF footer.
10. **DRAFT Watermark**: Unverified EPDs render a prominent "DRAFT: NOT THIRD-PARTY VERIFIED"
    watermark across all pages. Verified EPDs display the verifier name, org, and email.
