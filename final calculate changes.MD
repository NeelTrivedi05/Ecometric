# EcoMetric EPD Calculation Engine & UI Integration - Summary of Changes

## Overview
This document summarizes all technical updates, backend integration changes, database lookup enhancements, payload restructuring, and frontend UI updates implemented in the EcoMetric platform.

---

## 1. Separation of Life Cycle Stages (A1, A2, A3)

### Background & Objective
Previously, production stages A1 (Raw Material Supply), A2 (Inbound Transport), and A3 (Manufacturing) were aggregated into a single combined `A1-A3` column in calculation results and exported CSV files. The requirements specified showing `A1`, `A2`, and `A3` independently in all EPD outputs.

### Implementation Details
- **Updated Order & Export Schemas**:
  - Files modified:
    - [`/Users/parth/Desktop/Ecometric/calculate_epd.py`](file:///Users/parth/Desktop/Ecometric/calculate_epd.py)
    - [`/Users/parth/Desktop/Ecometric/backend/app/engines/calculate_epd.py`](file:///Users/parth/Desktop/Ecometric/backend/app/engines/calculate_epd.py)
  - Updated `COL_ORDER` definition to:
    ```python
    COL_ORDER = [
        "A1", "A2", "A3", "A1-A3", "A4", "A5",
        "B1", "B2", "B3", "B4", "B5", "B6", "B7",
        "C1-C4", "C1", "C2", "C3", "C4", "D"
    ]
    ```
  - Added individual dictionary keys `"A1": A1`, `"A2": A2`, `"A3": A3` into the `columns` map prior to output generation.
- **Output File Formats**:
  - `epd_results.csv`: Generates columns `Impact category, A1, A2, A3, A1-A3, A4, A5, B1, B2, B3, B4, B5, B6, B7, C1-C4, C1, C2, C3, C4, D`.
  - `epd_results.json` & `epd_results.txt`: Structured with full stage breakdown.

---

## 2. Inbound Logistics Legs (Stage A2) Updates

### Implementation Details
- **Frontend UI & Context**:
  - Modified [`StudioContext.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/context/StudioContext.jsx) and User Review step UI to allow multi-select linking of BOM components to specific inbound transport legs.
  - Automatically calculates `mass_kg` per leg based on selected component masses.
- **Exported JSON Payload**:
  - Extracted fields per transport leg in `stages_data.A2_Transport`:
    - `linked_material_ids`: List of BOM item IDs (e.g. `["xlsx-9"]`).
    - `mass_kg`: Read-only auto-summed mass of linked components.

---

## 3. Dynamic EF Extraction & User-Input Filtering

### Background & Objective
Previous calculations erroneously extracted emission factors for pre-populated demo data across unused stages, causing inflated impact values in stages B and C when users only entered BOM data.

### Implementation Details
- **Filtering by Active Quantities**:
  - Modified `collect_provider_contexts` in [`extract_ef_values.py`](file:///Users/parth/Desktop/Ecometric/backend/app/engines/extract_ef_values.py) to check for non-zero stage quantities (`mass > 0`, `distance > 0`, `kwh > 0`, etc.) before gathering ecoinvent provider IDs.
- **Frontend State Reset**:
  - Updated initial state in [`StudioContext.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/context/StudioContext.jsx) to zero out default quantities across all stages. Full demo values are loaded strictly when the user clicks **Load Sample Data**.
- **Enhanced `ecoinvent_row_<int>` Direct Matching**:
  - Improved `find_best_match` in [`extract_ef_values.py`](file:///Users/parth/Desktop/Ecometric/backend/app/engines/extract_ef_values.py):
    - Recognizes `ecoinvent_row_<int>` provider IDs (e.g. `ecoinvent_row_15528`) and maps them directly to the corresponding row index in the ecoinvent LCIA database (e.g., `market for steel, low-alloyed, hot rolled`).
    - Fallback keyword search parses user item context fields (`dataset`, `material`, `name`, `reference_product_name`) to perform accurate fuzzy matching when row IDs are absent.

---

## 4. Automatic Integration Flow in Backend

### Implementation Details
- **Route Handler Updates**:
  - File: [`/Users/parth/Desktop/Ecometric/backend/app/routers/epd.py`](file:///Users/parth/Desktop/Ecometric/backend/app/routers/epd.py) (Endpoint `/api/epd/calculate-anti`)
  - Execution Flow:
    1. Reads user inputs from payload.
    2. Dynamically locates the LCIA Excel database using candidate fallback paths.
    3. Runs `extract_ef_for_payload()` in-process and embeds extracted EF values into `calculation_record["extracted_ef_values"]`.
    4. Saves `results/epd_calculation_input.json`.
    5. Calls `run_epd_calculation()` to generate `epd_results.csv`, `epd_results.json`, and `epd_results.txt`.
    6. Attaches `epd_results` directly to the API response object.

---

## 5. UI Results Section Update (`ResultsView.jsx` & `StudioContext.jsx`)

### Implementation Details
- **Dynamic Context Parsing**:
  - Updated `lca` memo in [`StudioContext.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/context/StudioContext.jsx) to dynamically parse `epd_results` returned by the backend API.
- **Independent Stage Columns Matrix Table**:
  - File: [`/Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/ResultsView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/ResultsView.jsx)
  - Table Columns:
    `Indicator | Impact Category Name | Unit | A1 | A2 | A3 | A1–A3 | A4 | A5 | B1 | B2 | B3 | B4 | B5 | B6 | B7 | C1 | C2 | C3 | C4 | C1–C4 | Module D | Total`
- **Formatting & Interactivity**:
  - Numbers format with thousand separators for large numbers and scientific notation (e.g. `9.60e-5`) for small values to prevent truncation to `0.00`.
  - Added **Recalculate EPD** action button and **✓ Synced with epd_results.csv** indicator badge.
  - Configured sticky indicator headers and horizontal scrolling for full table visibility.

---

## 6. UI Component Removals & Calculation Engine Refinements

### Background & Objective
To streamline frontend data entry, remove redundant input fields, and ensure full alignment between UI inputs, stage payload data, and the `calculate_epd.py` engine.

### Implementation Details
- **A1 BOM**:
  - Removed `Module` dropdown ("A1 (Raw)") from the BOM table in [`UserReviewView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/UserReviewView.jsx) and the new component creation form in [`BomView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/BomView.jsx).
  - Rebalanced BOM table column widths (Component Name 24%, Extracted Keyword 16%, Database Provider 35%, Mass 13%, Actions 12%).

- **A2 Inbound Transport Legs**:
  - Removed `Transport Mode` text field, `Materials Carried` multi-select checkboxes, and `Mass Carried (kg)` read-only display field from transport leg cards in [`UserReviewView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/UserReviewView.jsx).
  - Removed third default transport leg (*"Heavy Delivery Lorry >32t to Customer Site" (500 km)*) from initial context state in [`StudioContext.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/context/StudioContext.jsx).

- **A3 Manufacturing**:
  - Removed `Grid Sub-region` input field from [`UserReviewView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/UserReviewView.jsx) and [`ReviewView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/ReviewView.jsx).
  - Updated `calc_A3` in [`calculate_epd.py`](file:///Users/parth/Desktop/Ecometric/backend/app/engines/calculate_epd.py) to scale annual facility utilities by `annual_production_units`.

- **A4 Outbound Transport**:
  - Removed `Transport Mode` input field from [`UserReviewView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/UserReviewView.jsx) and [`ReviewView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/ReviewView.jsx).

- **A5 Rigging & Commissioning**:
  - Renamed `Install Waste (kg)` label to `Commissioning Refrigerant Loss (kg)` in [`UserReviewView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/UserReviewView.jsx).
  - Added unit conversion in `calc_A5` in [`calculate_epd.py`](file:///Users/parth/Desktop/Ecometric/backend/app/engines/calculate_epd.py) to convert crane diesel litres to provider reference units.

- **B2 Maintenance**:
  - Updated `Material/Energy Used per Cycle (kWh)` field to `Consumable Mass per Cycle (kg)` and re-bound it to `maintenance_b2.consumable_mass_kg`.

- **B3 Repair**:
  - Removed `Replaced Part Name` and `Material Type` input fields in [`UserReviewView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/UserReviewView.jsx).

- **B4 Replacement**:
  - Removed `Major Overhaul (Year)` field from [`UserReviewView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/UserReviewView.jsx) and `Major Replacement Milestone (Year)` from [`ReviewView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/ReviewView.jsx).

- **B5 Refurbishment**:
  - Removed `Material/Energy Name` input field in [`UserReviewView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/UserReviewView.jsx).

- **B6 & B7 Operational**:
  - Removed `Load Basis` dropdown select.
  - Removed the entire `City-Specific Grid Providers` section along with all 4 provider cards in [`UserReviewView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/UserReviewView.jsx).

- **C1 Deconstruction**:
  - Implemented unit conversion helper `convert_amount` in `calc_C1` in [`calculate_epd.py`](file:///Users/parth/Desktop/Ecometric/backend/app/engines/calculate_epd.py) to convert decommissioning energy (kWh) to matching provider reference units (MJ).

---

## 7. Exponential (Scientific) Form Results Conversion & Display

### Background & Objective
To format EPD calculation output values into standard exponential (scientific) notation (e.g. `1.120e+08`) across exported CSV files and the UI View Results section.

### Implementation Details
- **Standalone Conversion Script**:
  - Created [`convert_results_to_exponential.py`](file:///Users/parth/Desktop/Ecometric/convert_results_to_exponential.py) and backend helper [`convert_results_to_exponential.py`](file:///Users/parth/Desktop/Ecometric/backend/app/engines/convert_results_to_exponential.py).
  - Converts every numeric cell in `epd_results.csv` to exponential form (`to_exponential(cell, digits=3)`), preserving column 1 category headers and non-numeric labels.
- **Backend Integration**:
  - Updated `write_csv` and `run_epd_calculation` in [`calculate_epd.py`](file:///Users/parth/Desktop/Ecometric/backend/app/engines/calculate_epd.py) to generate `epd_results_exp.csv` alongside `epd_results.csv`.
- **Frontend View Results Display**:
  - Updated `formatValue()` in [`ResultsView.jsx`](file:///Users/parth/Desktop/Ecometric/frontend/src/components/studio/views/ResultsView.jsx) to format all numeric indicator values into exponential notation using `num.toExponential(digits)`.

---

## 8. Bugfix: Missing `math` Import in `calculate_epd.py`

### Background & Root Cause
The `convert_csv_to_exponential` function within [`calculate_epd.py`](file:///Users/parth/Desktop/Ecometric/backend/app/engines/calculate_epd.py) calls `to_exponential()`, which uses `math.isfinite()`. However, the `math` module was not imported in the file, causing a `NameError` at runtime. This silently failed during API-triggered calculations (caught by the `try/except` in the EPD router), resulting in `epd_results_exp.csv` containing only the header row with no data.

### Fix Applied
- Added `import math` to the imports section of [`calculate_epd.py`](file:///Users/parth/Desktop/Ecometric/backend/app/engines/calculate_epd.py).
- Updated the EPD router log line in [`epd.py`](file:///Users/parth/Desktop/Ecometric/backend/app/routers/epd.py) to include `csv_exp_path` in the output log for better debugging visibility.

### Verification
- Running `run_epd_calculation()` now successfully generates both `epd_results.csv` and `epd_results_exp.csv` with all 16 impact categories converted to exponential notation (304 numeric values).

---

## Verification & Output Files

- Output CSV File: [`/Users/parth/Desktop/Ecometric/results/epd_results.csv`](file:///Users/parth/Desktop/Ecometric/results/epd_results.csv)
- Exponential Output CSV: [`/Users/parth/Desktop/Ecometric/results/epd_results_exp.csv`](file:///Users/parth/Desktop/Ecometric/results/epd_results_exp.csv)
- Output JSON File: [`/Users/parth/Desktop/Ecometric/results/epd_results.json`](file:///Users/parth/Desktop/Ecometric/results/epd_results.json)
- Output TXT Report: [`/Users/parth/Desktop/Ecometric/results/epd_results.txt`](file:///Users/parth/Desktop/Ecometric/results/epd_results.txt)
- Calculation Input Payload: [`/Users/parth/Desktop/Ecometric/results/epd_calculation_input.json`](file:///Users/parth/Desktop/Ecometric/results/epd_calculation_input.json)

