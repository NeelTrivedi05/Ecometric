# EcoMetric Backend — Chiller-Only Scope

## Stack recommendation
- **API layer:** Next.js 14 API routes (same repo as frontend). No separate service — team already knows TS, deadline is 15 weeks, calc logic is formula-based (not ML-heavy), so a second Python service adds ops overhead for no real gain at POC scale.
- **DB:** PostgreSQL + Prisma ORM. Relational fit is strong — PCR schema is literally tables of typed fields (see PCR_Implementation_Requirements doc).
- **Calc engine:** Pure TypeScript module in `src/lib/calc/`. Formulas are arithmetic, not statistical — no need for numpy/pandas.
- **Spec-sheet parsing ("NLP"):** Don't build classical NLP. Use an LLM API (Claude) with structured JSON output mode to extract fields from uploaded manufacturer spec sheets / reference EPDs. Cheaper to build, more robust to messy real-world PDFs than a custom NER pipeline. Always route extracted values through a user-confirmation step before they hit the DB — LLM extraction is a draft, not ground truth.
- **File storage:** local `/uploads` for dev, S3-compatible bucket for anything beyond localhost.
- **Report output:** PDF, generated server-side from the results table (see Report Generation).

---

## High-level architecture

```
[Frontend: EPD Wizard] 
      │  (form submit / file upload)
      ▼
[API Layer: Next.js routes]
      │
      ├─→ [Validation Layer] — schema check against PCR field requirements
      │
      ├─→ [LLM Extraction Service] — only when user uploads a spec sheet/PDF
      │        │
      │        ▼
      │   [Field Review UI] — user confirms/edits before save
      │
      ├─→ [PostgreSQL] — persists product + module inputs
      │
      ├─→ [Calc Engine] — reads inputs + impact_factors, computes per-module results
      │        │
      │        ▼
      │   [PostgreSQL: results table]
      │
      └─→ [Report Generation Engine] — renders results → EPD-format PDF
```

---

## User flow (wizard)

1. **Start project** — name, product category (locked to "water-cooled chiller" here), functional unit auto-set to 1 ton chilling capacity.
2. **Input method choice:**
   - Manual entry through form, OR
   - Upload spec sheet / reference EPD → LLM extracts candidate values → user reviews/edits in a diff-style UI (extracted value vs blank, accept/reject per field) → confirmed values populate the form.
3. **Module-by-module data entry** (matches PCR table structure exactly — see DB schema below): Technical Data → A4 Transport → A5 Installation → B1 Use → B2 Maintenance → B3 Repair → B4 Replacement → B5 Refurbishment → B6/B7 Operational Energy+Water → C1–C4 End of Life → (optional) Module D.
4. **B6 sub-flow:** user picks target city/cities from the 50-city PCR list (or "all" for full table like Carrier's supplemental results). System pulls climate data + runs the B6 formula. This is the highest-priority-accuracy module — flag it visually as such in UI.
5. **Review screen** — all modules summarized, flags any zero/missing fields (PCR requires stating "not applicable" explicitly, not silent omission).
6. **Calculate** — triggers calc engine, writes to `results` table.
7. **Results dashboard** — impact category breakdown by module (matches Carrier's Table 18-style layout), toggle PEF/CML/TRACI, toggle city if B6 was multi-city.
8. **Generate report** — PDF export, includes the mandatory "directional/comparative platform, not certified EPD generator" disclaimer and data-source citations (proxy vs primary).
9. **Save/version project** — user can return and re-run with edited inputs; old results versioned, not overwritten.

---

## Database schema

### `users`
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| email | text unique | |
| role | enum | student / guide / reviewer |

### `projects`
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| name | text | |
| product_category | text | fixed = 'water_cooled_chiller' in this scope |
| pcr_ref | text | 'UL 10010-4 Part B v2.0 2018' |
| created_at, updated_at | timestamp | |
| status | enum | draft / calculated / reported |

### `product_technical_data`
| field | type |
|---|---|
| project_id | FK |
| chilling_capacity_rt | numeric |
| chilling_capacity_kw | numeric (derived: RT × 0.2843) |
| energy_efficiency_json | jsonb — array of {load_pct, ecwt, kw_per_ton} |
| pressure_drop_ft | numeric |
| pressure_drop_kpa | numeric (derived: ft × 0.3346) |
| refrigerant_type | text |
| refrigerant_charge_kg | numeric |
| mass_delivered_kg | numeric |
| conversion_factor_kg_per_ton | numeric |

### `module_a4_transport`
project_id FK, fuel_l_per_100km, distance_km (default 500), fuel_type (default diesel), capacity_utilization_pct, gross_density_kg_m3, capacity_util_volume_factor, additional_ocean_freight_km (nullable)

### `module_a5_installation`
project_id FK, auxiliary_materials_kg, net_freshwater_m3, freshwater_evaporated_m3, freshwater_sewer_m3, electricity_kwh, other_energy_mj, product_loss_kg, construction_waste_kg, waste_output_by_route_json, direct_emissions_json (air/soil/water kg)

### `module_b1_use`
project_id FK, rsl_years (default 25)

### `module_b2_maintenance`
project_id FK, maintenance_cycles_per_rsl, maintenance_cycles_per_esl, refrigerant_replacement_kg, refrigerant_loss_rate_pct (default 2), water_consumption_m3, electricity_kwh, direct_emissions_kg

### `module_b3_repair`
project_id FK, repair_cycles_per_rsl, repair_cycles_per_esl, [same aux field set as B2]

### `module_b4_replacement`
project_id FK, replacement_cycles (derived: ceil((esl/rsl)-1), default 2), esl_years (default 75), electricity_kwh, water_m3, worn_parts_replaced_kg, direct_emissions_kg

### `module_b5_refurbishment`
same structure as B4, nullable — only populated if manufacturer confirms refurbishment process exists

### `module_b6_operational_energy`
project_id FK, target_cities text[] (from the 50-city list), annual_hours_operation_json (per city), efficiency_kw_per_ton, chiller_capacity_tons, product_lifespan_years, electricity_kwh_json (per city, computed), grid_emission_factor_source (US/Global/Europe/China), grid_emission_factor_kg_co2e_per_kwh

### `module_b7_water`
project_id FK, net_freshwater_m3

### `module_c1_c4_eol`
project_id FK, collected_separately_kg, collected_mixed_waste_kg, reuse_kg, distance_reuse_km, landfill_kg, distance_landfill_km, incineration_kg, distance_incineration_km, recycling_kg, distance_recycling_km, refrigerant_recovery_pct (default 90)

### `module_d_beyond_boundary` (optional)
project_id FK, energy_recovery_c3_mj, thermal_treatment_c4_mj, material_flow_c3_mj — never summed into `results.total`

### `impact_factors` (proxy dataset library)
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| source | enum | ecoinvent / epa / published_epd |
| material_or_process | text | e.g. "steel, low-alloyed" |
| impact_category | text | GWP-total, ODP, AP, EP-freshwater, etc |
| methodology | enum | PEF / CML / TRACI |
| unit | text | |
| value_per_kg | numeric | |
| region | text | US / China / Global / EU |
| dataset_version | text | e.g. "ecoinvent v3.10" |
| license_status | enum | proxy / licensed |

This table is the seam where a real ecoinvent license swaps in later — same schema, `license_status` flips from `proxy` to `licensed`, `source` becomes `ecoinvent` throughout instead of mixed EPA/published-EPD proxies. Calc engine never needs to change, only the data feeding this table.

### `refrigerant_gwp_factors`
refrigerant_name, gwp_ar5, gwp_ar6, source (IPCC AR5/AR6)

### `grid_emission_factors`
region/country, year, kg_co2e_per_kwh, source

### `city_climate_data` (B6 50-city table)
city_name, annual_hours_by_load_json, weather_data_source, ahri_conditions_ref

### `results`
project_id FK, module (A1-A3, A4, A5, B1...D), impact_category, methodology (PEF/CML/TRACI), unit, value, city (nullable, for B6 multi-city), calculated_at

### `reports`
project_id FK, generated_at, pdf_url, version, disclaimer_text_snapshot

---

## Calc engine logic (per module)

Implement as pure functions, one per module, in `src/lib/calc/`:

- `calcA1A3(materials, impact_factors)` → sum(material_kg × factor_per_kg) per impact category
- `calcA4(transport)` → standard transport LCA formula: fuel_l × distance_km / 100 × diesel_combustion_factor, adjusted by capacity_utilization
- `calcA5(installation)` → sum of aux material + energy + waste flows × factors
- `calcB2(maintenance)` → refrigerant_replacement_kg × refrigerant_gwp_factor + aux flows
- `calcB4(replacement)` → replacement_cycles × calcA1A3thruA5(same product) — enforce the "≈2× A1-A5" sanity check as an assertion, not just a comment
- `calcB6(b6_input, city_climate_data, grid_emission_factors)` → implements the mandatory formula:
  `kWh = annual_hours × efficiency_kw_per_ton × capacity_tons × lifespan_years`
  then `impact = kWh × grid_emission_factor_kg_co2e_per_kwh` (and other impact categories via factor table)
- `calcC1C4(eol)` → recycling/landfill/incineration mass × route-specific factors, refrigerant EOL loss × GWP factor
- `assembleResults(all module outputs)` → writes to `results` table, scientific notation 3 sig figs on output formatting (not storage — store full precision, format at render time)

Validation rules to hardcode:
- No module skipped silently — B3/B5 etc. must be explicit `not_applicable: true` records, not missing rows.
- Units enforced SI at storage; imperial is a display-layer conversion only, using the fixed PCR conversion table.
- Reject calc trigger if any mandatory module (A1-A5, B1-B7, C1-C4) has zero populated rows.

---

## API endpoints

```
POST   /api/projects                    create project
GET    /api/projects/:id                fetch project + all module data
PATCH  /api/projects/:id/module/:name   upsert one module's data
POST   /api/projects/:id/extract        upload file → LLM extraction → draft fields (not saved)
POST   /api/projects/:id/calculate      run calc engine, write results
GET    /api/projects/:id/results        fetch results, query params: methodology, city
POST   /api/projects/:id/report         generate PDF report
GET    /api/impact-factors              search/browse factor library (admin/debug)
```

---

## Report generation
Template-driven PDF (mirrors EPD11017 structure: general info table → limitations → product description → technical data → LCA methodology → results tables by methodology → interpretation charts → assumptions/limitations → references). Pull `results` rows grouped by module, format scientific notation, inject disclaimer text confirming directional/comparative status and proxy vs primary data sourcing per field.

---

## Auth (academic scope)
Keep minimal — team + guide + reviewer roles, session-based auth (NextAuth), no need for enterprise SSO. Guide/reviewer get read-only access to submitted projects.

---

## What's deliberately deferred
- Real ecoinvent license integration (schema is ready, data isn't licensed yet).
- Multi-tenant scaling / rate limiting — not needed at POC scale.
- Automated PCR-version-expiry flagging — noted in requirements doc as a future roadmap item, not MVP.
