# Ecometric — Recent Changes Changelog

**Date:** 2026-09-16 / 2026-09-17  
**Scope:** Live ecoinvent LCIA Extractor & EPD Calculator feature

---

## 1. `lcia_extractor.py`  *(Modified)*

**Path:** `/Users/parth/Desktop/Ecometric/lcia_extractor.py`

### Changes
- **Updated `FILE_PATH`** — Now auto-detects the Excel file at
  `/Users/parth/Desktop/Ecometric/Cut-off Cumulative LCIA v3.12.xlsx` first,
  falling back to the old `final year project/` path if not found.
- **Added `_GLOBAL_DATA_CACHE` + `get_lcia_data()`** — In-memory singleton cache
  so the 188 MB Excel file is loaded only once per process (0.017s vs 34s cold).
- **Added `extract_lcia_results_dict()`** — Returns a JSON-serialisable dict of
  all LCIA indicators for a given row and methodology filter; used by the backend API.

---

## 2. `backend/app/routers/documents.py`  *(Modified)*

**Path:** `/Users/parth/Desktop/Ecometric/backend/app/routers/documents.py`

### New API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/documents/lcia-methodologies` | Returns all **41 LCIA methodologies** from the Excel file |
| `GET`  | `/api/documents/lcia-search?query=` | Full-text search across ecoinvent activity & product names |
| `POST` | `/api/documents/lcia-calculate`     | Runs `lcia_extractor.py` calculation; returns indicators + metadata |

The router imports `lcia_extractor` from the project root via `sys.path` injection.

---

## 3. `frontend/src/components/studio/Icons.jsx`  *(Modified)*

**Path:** `/Users/parth/Desktop/Ecometric/frontend/src/components/studio/Icons.jsx`

### Changes
- **Exported `SearchIcon`** — New magnifying-glass SVG component used in the
  LCIA Extractor search input and button.

---

## 4. `frontend/src/components/studio/LciaExtractorSection.jsx`  *(New File)*

**Path:** `/Users/parth/Desktop/Ecometric/frontend/src/components/studio/LciaExtractorSection.jsx`

### Description
A self-contained React component that provides a 4-step interactive EPD
calculation workflow, embedded in multiple views.

### Workflow Steps

| Step | UI Element | Behaviour |
|------|-----------|-----------|
| **1** | Keyword search input + Search button | Calls `/api/documents/lcia-search`; shows matching ecoinvent providers |
| **2** | Scrollable provider / activity list | Click-to-select with highlighted row index |
| **3** | Amount input + Reference unit display | Quantity field; scales all indicator values by `userAmount / refAmount` |
| **4** | Methodology dropdown (41 options) + **Calculate EPD** button | Calls `/api/documents/lcia-calculate`; renders results table |

### Results Table Columns (when amount ≠ 1)

| Column | Description |
|--------|-------------|
| Methodology | LCIA method name |
| Impact Category | e.g. global warming, acidification |
| Indicator | Full indicator name |
| Unit | ecoinvent reference unit |
| Per 1 [unit] | Raw ecoinvent value |
| **For X [unit]** | Scaled value = raw × (userAmount / refAmount) |

A **SCALED** badge and scale-factor annotation appear below the amount field
whenever `userAmount ≠ refAmount`.

---

## 5. `frontend/src/components/studio/views/MethodologyView.jsx`  *(Modified)*

**Path:** `…/views/MethodologyView.jsx`

- Imported `LciaExtractorSection`
- Rendered `<LciaExtractorSection />` below the methodology cards, above the action footer

---

## 6. `frontend/src/components/studio/views/ReviewView.jsx`  *(Modified)*

**Path:** `…/views/ReviewView.jsx`

- Imported `LciaExtractorSection`
- Rendered `<LciaExtractorSection />` below the BOM and Energy/Transport cards

---

## 7. `frontend/src/components/studio/views/ResultsView.jsx`  *(Modified)*

**Path:** `…/views/ResultsView.jsx`

- Imported `LciaExtractorSection`
- Rendered `<LciaExtractorSection />` below the Core Environmental Indicators table

---

## Data Flow

