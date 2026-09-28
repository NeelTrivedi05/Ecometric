# EcoMetric EPD Template & Export Engine (Reference EPD11017)

This directory documents the publication-grade PDF generation engine modelled on verified reference **EPD11017** (*Carrier AquaEdge® 19DV Water-Cooled Centrifugal Chiller*, NSF Program Operator, UL 10010-4 / EN 15804+A2).

---

## Architecture Overview

```
                               ┌────────────────────────┐
                               │   Calculated Results   │
                               │  (calc_engine output)  │
                               └───────────┬────────────┘
                                           │
┌────────────────────────┐                 │                 ┌────────────────────────┐
│  Extracted Data / BOM  ├────────────┐    │    ┌────────────┤  Report Details Form   │
│   (Project records)    │            │    │    │            │ (Company, Verifier...) │
└────────────────────────┘            ▼    ▼    ▼            └────────────────────────┘
                               ┌────────────────────────┐
                               │   EpdReport Assembler  │
                               │  Single Source of Truth│
                               └───────────┬────────────┘
                                           │
                       ┌───────────────────┴───────────────────┐
                       ▼                                       ▼
            ┌───────────────────────┐               ┌───────────────────────┐
            │   Pre-Export Gate     │               │  Matplotlib Charts &  │
            │   (epd_validator.py)  │               │  System Boundary SVG  │
            └──────────┬────────────┘               └───────────┬───────────┘
                       │ Passes                                 │
                       └───────────────────┬───────────────────┘
                                           ▼
                               ┌────────────────────────┐
                               │   HTML/CSS Paged Media │
                               │  (US Letter, Headers)  │
                               └───────────┬────────────┘
                                           ▼
                               ┌────────────────────────┐
                               │  Playwright (Chromium) │
                               │    Publication PDF     │
                               └────────────────────────┘
```

### Core Engine Files

| Module / Component | File Path | Description |
|---|---|---|
| **Data Assembler & PDF Compiler** | [`backend/app/engines/epd_pdf_generator.py`](file:///g:/Ecometric/backend/app/engines/epd_pdf_generator.py) | Assembles `EpdReport`, renders HTML template with strict typographic hierarchy, and invokes Chromium via Playwright. |
| **Pre-Export Validation Gate** | [`backend/app/engines/epd_validator.py`](file:///g:/Ecometric/backend/app/engines/epd_validator.py) | Enforces Part G integrity checks: mass balance (0.1%), EOL reconciliation, module sum reconciliations, material % (100.00%), LCI dataset mapping, and required field completeness. |
| **Server-Side Charts** | [`backend/app/engines/epd_charts.py`](file:///g:/Ecometric/backend/app/engines/epd_charts.py) | Matplotlib generator producing Figures 3 (GWP stacked bar), 4 (AP stacked bar), 5 (100% stacked excluding B6), 6 (Material % bar chart), and 7 (US vs China GWP comparison) as high-DPI base64 data URIs. |
| **System Boundary Diagram** | [`backend/app/engines/system_boundary_svg.py`](file:///g:/Ecometric/backend/app/engines/system_boundary_svg.py) | Dynamic vector SVG generator producing the 5-column system boundary diagram (Figure 2) matching modules in scope. |
| **Database Persistence** | [`backend/app/models.py`](file:///g:/Ecometric/backend/app/models.py) | SQLAlchemy models `ReportDetails` (per-project persistence) and `CompanyDefaults` (organization-wide defaults). |
| **REST API Router** | [`backend/app/routers/epd.py`](file:///g:/Ecometric/backend/app/routers/epd.py) | Endpoints for fetching/saving report details, pre-export validation, live HTML preview, and compiled PDF download. |
| **Report Details Modal** | [`frontend/src/components/studio/ReportDetailsModal.jsx`](file:///g:/Ecometric/frontend/src/components/studio/ReportDetailsModal.jsx) | 7-tab interactive configuration modal (Company, Product, Declaration, Verification, Methodology, Validation Gate, Live Preview). |
| **Field Mapping Specification** | [`FIELD_MAPPING.md`](file:///g:/Ecometric/FIELD_MAPPING.md) | Exhaustive field-by-field specification mapping every element of EPD11017 to our application data model. |
| **Automated Tests** | [`test/test_epd_pdf_export.py`](file:///g:/Ecometric/test/test_epd_pdf_export.py) | Regression and unit tests for Acceptance Criteria 5, 6, 8, and 9. |

---

## 1. How to Add a New Section to the PDF Template

All section styling follows the reference styling guidelines:
- **Major section heading**: Bold navy (`#1F2A6B`), underlined, uppercase, 16 pt font, page-break before each section.
- **Sub-headings**: Bold light blue (`#2196F3`), 11 pt font.
- **Body paragraphs**: Clean sans-serif (`Inter`, `Helvetica`, `Arial`), 8.5–9 pt, justified or left-aligned, line-height 1.5.

### Steps:
1. Open [`backend/app/engines/epd_pdf_generator.py`](file:///g:/Ecometric/backend/app/engines/epd_pdf_generator.py).
2. If the section requires new fields, add them to `EpdReport.__init__()` and ensure they are populated from `report_details`, `extracted_data`, or `results`.
3. In `generate_full_epd_html(report: EpdReport)`, add a new `<div class="page-break"></div>` followed by your section container:
   ```html
   <div class="section-page">
     <h2 class="section-title">5 – CIRCULARITY &amp; DISASSEMBLY SPECIFICATIONS</h2>
     <p class="body-text">
       Detailed information on circularity metrics and design for disassembly...
     </p>
     <!-- Subheading -->
     <h3 class="subsection-title">Disassembly Guidelines</h3>
     <p class="body-text">{{ report.disassembly_narrative }}</p>
   </div>
   ```
4. If the section contains an optional field (e.g., specific testing certificates), wrap it in an `{% if ... %}` block or Python conditional check so it omits cleanly without empty headers when no data is declared (Rule Part A.3).

---

## 2. How to Add a New Indicator to the Results Tables

Impact indicators in the results tables are defined in [`backend/app/engines/epd_pdf_generator.py`](file:///g:/Ecometric/backend/app/engines/epd_pdf_generator.py).

### Steps:
1. **Define Parameter Metadata**:
   In `CORE_INDICATOR_ROWS` (for core environmental impacts) or `RESOURCE_USE_ROWS` (for resource flows and waste):
   ```python
   {
       "key": "GWP-fossil",             # Key in calculation engine indicator dictionary
       "name": "Climate change - fossil",# Display name in the table
       "unit": "kg CO2 eq.",            # Unit label
       "superscript": ""                # Optional footnote marker (e.g. "¹")
   }
   ```
2. **Add Static Parameter Definition (if applicable)**:
   If the indicator requires an entry in Table 14, 15, 16, or 17, add a definition row in `PARAM_DEF_EN15804` or `PARAM_DEF_TRACI` with its full scientific description and characterization model.
3. **Ensure Formatting Rules**:
   - The cell renderer `fmt_sci(val)` automatically formats values into scientific notation with 2 decimals (e.g., `1.65E+02`, `0.00E+00`).
   - If undeclared in the calculation engine, it renders as `ND` or `MND` with muted styling.
4. **Pre-Export Gate Update**:
   If the indicator has modular additive constraints (e.g., C1-C4 aggregate equals C1 + C2 + C3 + C4), ensure [`backend/app/engines/epd_validator.py`](file:///g:/Ecometric/backend/app/engines/epd_validator.py) checks the sum tolerance.

---

## 3. How to Add a New LCIA Methodology

The template dynamically repeats the results tables and indicator definition tables for each methodology requested (e.g., PEF / EN 15804+A2, CML-IA v4.1, TRACI 2.1).

### Steps:
1. In `EpdReport`:
   Update `self.methodologies` to detect the new methodology key in `results["epd_results"]` or `results["methodologies"]` (e.g., `"EF 3.1"`, `"ReCiPe 2016 Midpoint (H)"`).
2. Add the corresponding table generator function in [`epd_pdf_generator.py`](file:///g:/Ecometric/backend/app/engines/epd_pdf_generator.py), for example:
   ```python
   def render_recipe_results_table(report: EpdReport, method_key: str) -> str:
       # Iterate over method indicators and generate table with navy header
       ...
   ```
3. Add the parameter definition table (similar to Table 17 for TRACI 2.1) in Section 3 so readers understand the characterization factors.
4. In the interpretation section (`epd_charts.py`), optionally add a stacked bar chart or contribution plot tailored for that methodology.

---

## 4. Verification Integrity & DRAFT Watermark Rules (Part F)

Per compliance rules:
- **Unverified Status (`is_verified = False`)**:
  - The PDF displays a bold diagonal watermark **`DRAFT: NOT THIRD-PARTY VERIFIED`** across every page.
  - The declaration table displays `[ ] INTERNAL  [ ] EXTERNAL` checkboxes unmarked and verifier lines are rendered as blank dotted signature lines.
  - No third-party certification logos are rendered.
- **Verified Status (`is_verified = True`)**:
  - The watermark is omitted.
  - `[X] EXTERNAL` (or `[X] INTERNAL`) is marked.
  - Verifier name, organization, email, and signature image (if uploaded) are rendered.
  - Program operator badge (e.g. NSF) is rendered only if supplied.
- **Audit Stamp**:
  - The bottom of the final page / footer contains:
    `Generated (UTC): YYYY-MM-DD HH:MM:SS | Version: 1.0 | LCI Database: ecoinvent v3.10 | Payload SHA-256: [hash]`

---

## 5. Running Automated Tests

To run the automated test suite verifying Acceptance Criteria 5, 6, 8, and 9:

```bash
# Run with Python
python test/test_epd_pdf_export.py
```

The test validates:
- **Pre-Export Validation Gate (Criterion 8)**: Rejects mass discrepancies and indicator sum mismatches; passes valid models.
- **Scientific Notation Precision (Criterion 5)**: Confirms `1.65E+02`, `3.59E+04`, `0.00E+00` formatting.
- **Verification Integrity (Criterion 6)**: Tests draft watermark on unverified projects and verifier details on verified ones.
- **Chromium PDF Compilation (Criterion 9)**: Generates publication-ready PDF, verifies text searchability, font embedding, and file size.
