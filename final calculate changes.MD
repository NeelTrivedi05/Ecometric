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

## Verification & Output Files

- Output CSV File: [`/Users/parth/Desktop/Ecometric/results/epd_results.csv`](file:///Users/parth/Desktop/Ecometric/results/epd_results.csv)
- Output JSON File: [`/Users/parth/Desktop/Ecometric/results/epd_results.json`](file:///Users/parth/Desktop/Ecometric/results/epd_results.json)
- Output TXT Report: [`/Users/parth/Desktop/Ecometric/results/epd_results.txt`](file:///Users/parth/Desktop/Ecometric/results/epd_results.txt)
- Calculation Input Payload: [`/Users/parth/Desktop/Ecometric/results/epd_calculation_input.json`](file:///Users/parth/Desktop/Ecometric/results/epd_calculation_input.json)
