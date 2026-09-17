# EcoMetric Test Documents Suite

This directory contains verified sample test documents covering all supported formats and testing scenarios for the **EcoMetric** Life Cycle Assessment (LCA) web application.

You can drag and drop any of these files into the **Document Ingestion** zone (`/app` -> **Data Sources** / **Ingestion** tab) or upload them via the REST API endpoint `POST /api/documents/upload`.

---

## 📁 Included Test Documents

| File | Format | Scenario Tested | Key Ingestion Features Verified |
| :--- | :---: | :--- | :--- |
| **`01_centrifugal_chiller_spec.pdf`** | **PDF** | 500 RT Water-Cooled Chiller Cutsheet | • Local `pdfplumber` vector table parsing<br/>• Regex nameplate extraction (`500 RT`, `R134a 45kg`)<br/>• 8-component BOM mapped to ecoinvent v3.12 |
| **`02_air_cooled_screw_chiller_bom.xlsx`** | **Excel (XLSX)** | 300 RT Air-Cooled Screw Chiller | • Multi-column `openpyxl` table extraction<br/>• Supplier & Inbound freight mileage parsing<br/>• Automated material class normalization |
| **`03_modular_heat_pump_bom.csv`** | **CSV** | 150 RT Industrial Heat Pump / Chiller | • Fast zero-overhead tabular CSV ingestion<br/>• Direct column header mapping (`Component`, `Mass (kg)`)<br/>• Instant material linking to ecoinvent seed records |
| **`04_incomplete_bom_for_gap_analysis.csv`** | **CSV (Audit)** | Incomplete BOM purposefully triggering PCR gap warnings | • Tests the UL 10010-4 / ISO 14025 Gap Analysis engine<br/>• Triggers **BOM Mass Under-Declared** warning (&lt;50 kg)<br/>• Triggers **Missing Inbound Freight** warning (`0 km`) |
| **`05_complete_project_payload.json`** | **JSON** | Full Project State Payload | • Tests full project state restoration<br/>• Covers Modules A1–A3, B1–B7, C1–C4, and Module D circularity |

---

## 🧪 Quick Test Commands

### 1. Test via Python Backend Extractors
```bash
# Verify PDF extraction
python -c "from backend.app.engines.pdf_extractor import extract_pdf_data; res = extract_pdf_data(open('test/01_centrifugal_chiller_spec.pdf','rb').read()); print(f'Extracted {len(res["bom"])} parts, Refrigerant: {res["operational"]["refrigerant_type"]}, Capacity: {res["operational"]["capacity_rt"]} RT')"

# Verify Excel extraction
python -c "from backend.app.engines.excel_extractor import extract_excel_data; res = extract_excel_data(open('test/02_air_cooled_screw_chiller_bom.xlsx','rb').read()); print(f'Extracted {len(res["bom"])} parts')"
```

### 2. Test via REST API (`POST /api/documents/upload`)
```bash
curl -X POST "http://localhost:8000/api/documents/upload"   -F "files=@test/01_centrifugal_chiller_spec.pdf"   -F "files=@test/02_air_cooled_screw_chiller_bom.xlsx"
```
