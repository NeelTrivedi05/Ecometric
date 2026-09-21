# EcoMetric Comprehensive Test Documents Suite

This directory contains the verified sample test suite covering all cradle-to-grave lifecycle stages (**Modules A1–A5, B1–B7, C1–C4, and Module D Circularity**) for the **EcoMetric** Life Cycle Assessment (LCA) web application.

All test documents are engineered in compliance with:
- **UL 10010-4 Part B v2.0 (2018)**: Product Category Rules for Centrifugal and Water-Cooled Chillers
- **ISO 14025 / ISO 21930 / EN 15804+A2**: Environmental Product Declarations core calculation rules
- **AHRI 550/590 (2020)**: Performance Rating of Water-Chilling and Heat Pump Water-Heating Packages

You can upload these files individually or together via drag-and-drop into the **Studio Ingestion** zone (`/app`), load them via the interactive **Test & Sample Explorer** directly on the web page, or use the REST API endpoint `POST /api/documents/upload`.

---

## 📁 Test Documents Directory & Life Cycle Stage Coverage

| File | Format | Life Cycle Stage | Key Parameters & Testing Scenario |
| :--- | :---: | :---: | :--- |
| **`06_multimodal_inbound_logistics_manifest_A2.csv`** | **CSV** | **Module A2** (Inbound Logistics) | • Multi-modal freight: Transoceanic container ship (6,200 km), Electric freight train (900 km), Heavy lorry >32t (450 km)<br/>• Component-to-transport mass linkage (Compressor volute, copper tubes, VFD drive) |
| **`07_jobsite_installation_and_rigging_A4_A5.xlsx`** | **Excel (XLSX)** | **Modules A4 & A5** (Installation) | • Outbound transit to job site (750 km Heavy Lorry >32t)<br/>• 50-ton hydraulic mobile crane unloading (37.8 L diesel fuel)<br/>• Commissioning electricity (350 kWh) & refrigerant test purge loss (0.50 kg R134a) |
| **`08_operational_use_and_maintenance_B1_to_B7.csv`** | **CSV** | **Modules B1–B7** (Operational Phase) | • B1/B2: R134a fugitive leakage (45 kg charge @ 2.0%/yr = 0.90 kg/yr)<br/>• B2: Synthetic POE lubricating oil replacement (25.0 kg / 2 yrs)<br/>• B3/B4: Tube brush cleaning & Year 15 major rebuild<br/>• B6: AHRI 550/590 part-load rating (100%: 0.58, 75%: 0.44, 50%: 0.38, 25%: 0.49 -> IPLV: 0.435 kW/TR)<br/>• B7: Cooling tower evaporation water (120 m³/yr) |
| **`09_end_of_life_and_circularity_C1_to_D.json`** | **JSON** | **Modules C1–C4 & Module D** | • C1: Deconstruction & safe dismantling electrical energy (120 kWh)<br/>• C2: Waste transport to certified metal scrap shredder (100 km)<br/>• C3/C4: 92.4% metal recycling sorting, 4.5% inert landfill disposal<br/>• Module D: Net circularity credits displacing virgin steel, copper, and aluminium (-3,210 kg CO₂e) |
| **`11_water_cooled_centrifugal_multitab_master.xlsx`** | **Excel (XLSX)** | **Full Cradle-to-Grave** (A1–D) | • 6-tab comprehensive engineering workbook testing multi-sheet automated ingestion:<br/>  1. `General_Specs`<br/>  2. `BOM_A1`<br/>  3. `Logistics_A2`<br/>  4. `Installation_A4_A5`<br/>  5. `Operations_B1_B7`<br/>  6. `Circularity_C_D` |
| **`10_complete_enterprise_chiller_package.zip`** | **ZIP Archive** | **Full Enterprise Suite** | • Bundled archive containing all modular files for 1-click drag-and-drop end-to-end testing |
| **`01_centrifugal_chiller_spec.pdf`** | **PDF** | **Modules A1 / A3 / B1** | • Vector PDF parsing, nameplate regex extraction (500 RT, R134a 45kg), 8-part BOM |
| **`02_air_cooled_screw_chiller_bom.xlsx`** | **Excel (XLSX)** | **Module A1** | • 300 RT Air-Cooled Screw Chiller engineering parts list |
| **`03_modular_heat_pump_bom.csv`** | **CSV** | **Module A1** | • 150 RT Industrial Heat Pump bill of materials |
| **`04_incomplete_bom_for_gap_analysis.csv`** | **CSV (Audit)** | **PCR Gap Gate** | • Purposefully triggers UL 10010-4 cut-off and missing transport warnings |
| **`05_complete_project_payload.json`** | **JSON** | **Complete State** | • Full JSON project state payload |

---

## 🧪 Verification Commands

### 1. Verify Excel Multi-Sheet Extraction
```bash
python -c "from backend.app.engines.excel_extractor import extract_excel_data; res = extract_excel_data(open('test/11_water_cooled_centrifugal_multitab_master.xlsx','rb').read()); print('BOM parts:', len(res['bom']), '| Transport legs:', len(res['transport']), '| Crane diesel:', res['installation'].get('rigging_crane_diesel_liters'))"
```

### 2. Verify CSV Multi-Stage Extraction (A2, B1-B7)
```bash
python -c "from backend.app.engines.messy_data_parser import parse_messy_csv; ext = {}; parse_messy_csv(open('test/06_multimodal_inbound_logistics_manifest_A2.csv').read(), 'a2.csv', ext); print('A2 legs:', len(ext.get('transport', [])))"
```

### 3. Test Full Upload API (`POST /api/documents/upload`)
```bash
curl -X POST "http://localhost:8000/api/documents/upload"   -F "files=@test/11_water_cooled_centrifugal_multitab_master.xlsx"
```
