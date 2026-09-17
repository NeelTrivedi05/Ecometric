import os
import csv
import json
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

TEST_DIR = os.path.dirname(os.path.abspath(__file__))

def create_pdf():
    pdf_path = os.path.join(TEST_DIR, "01_centrifugal_chiller_spec.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155')
    )
    bold_style = ParagraphStyle(
        'DocBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    story = []
    
    # Header
    story.append(Paragraph("<b>Technical Specification &amp; Engineering Cut Sheet</b>", title_style))
    story.append(Paragraph("Equipment Cut Sheet for Environmental Product Declaration (ISO 14025 / EN 15804+A2)", body_style))
    story.append(Spacer(1, 10))
    
    # Specs
    specs_text = """
    <b>Product Name:</b> Carrier AquaEdge 19DV Centrifugal Chiller<br/>
    <b>Model Capacity:</b> 500 RT (1,758 kW Nominal Chilled Water)<br/>
    <b>Refrigerant Type:</b> R134a (Initial Factory Charge: 45.0 kg, fugacity leak rate: 2.0%/yr)<br/>
    <b>Plant Utility Power:</b> 34,000 kWh annual manufacturing electricity allocated to unit<br/>
    <b>PCR Category Standard:</b> UL 10010-4 Part B &amp; EN 15804+A2 (Industrial HVAC Systems)<br/>
    <b>Reference Service Life (RSL):</b> 25 Years with standard maintenance intervals
    """
    story.append(Paragraph(specs_text, body_style))
    story.append(Spacer(1, 14))
    
    # Table data
    table_data = [
        ["Component", "Material", "Weight (kg)", "Supplier", "Transport (km)"],
        ["Compressor Volute & Casting", "Structural Steel", "2,250", "Midwest Iron Works", "420"],
        ["Evaporator & Condenser Tubes", "Copper", "720", "Great Lakes Copper Corp", "280"],
        ["Semi-Hermetic Induction Motor", "Electric Motor", "480", "ElectroMotors Industrial", "650"],
        ["Shell Thermal PUF Insulation", "Polyurethane Foam", "140", "FoamTech Insulation", "190"],
        ["Power Inverter & Solid-State VFD", "Power Electronics", "110", "Advantech Power Systems", "890"],
        ["Microchannel Subcooler Coil", "Aluminium Alloy", "95", "Alloy Heat Exchangers", "350"],
        ["Refrigerant High-Pressure Piping", "Stainless Steel 304", "85", "Precision Alloy Tubing", "340"],
        ["Base Skid Frame & Mounts", "Structural Steel", "540", "ArcelorMittal Midwest", "260"]
    ]
    
    col_widths = [160, 110, 75, 125, 70]
    t = Table(table_data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#F8FAFC'), colors.white]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('ALIGN', (4, 0), (4, -1), 'RIGHT'),
    ]))
    
    story.append(t)
    doc.build(story)
    print(f"Created: {pdf_path}")

def create_excel():
    xlsx_path = os.path.join(TEST_DIR, "02_air_cooled_screw_chiller_bom.xlsx")
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Engineering BOM"
    
    # Title Block
    ws.merge_cells("A1:E1")
    ws["A1"] = "ECO-METRIC BILL OF MATERIALS (BOM) - AIR-COOLED SCREW CHILLER 300RT"
    ws["A1"].font = Font(name="Calibri", size=13, bold=True, color="FFFFFF")
    ws["A1"].fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 28
    
    # Metadata rows
    metadata = [
        ("Equipment Type:", "Air-Cooled Screw Chiller (300 RT / 1,055 kW)", "PCR Standard:", "UL 10010-4 Part B"),
        ("Manufacturer:", "EcoMetric Thermal Solutions", "Refrigerant:", "R134a (55 kg Charge)"),
        ("Reference Service Life:", "25 Years", "Assembly Electricity:", "28,500 kWh/year")
    ]
    for r_idx, (k1, v1, k2, v2) in enumerate(metadata, start=2):
        ws.cell(row=r_idx, column=1, value=k1).font = Font(bold=True, size=9)
        ws.cell(row=r_idx, column=2, value=v1).font = Font(size=9)
        ws.cell(row=r_idx, column=3, value=k2).font = Font(bold=True, size=9)
        ws.cell(row=r_idx, column=4, value=v2).font = Font(size=9)
        ws.row_dimensions[r_idx].height = 18

    # Table Header Row (Row 6)
    headers = ["Component Description", "Raw Material", "Weight (kg)", "Tier-1 Supplier", "Transport Distance (km)"]
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )
    
    ws.row_dimensions[6].height = 22
    for col_idx, h in enumerate(headers, start=1):
        c = ws.cell(row=6, column=col_idx, value=h)
        c.fill = header_fill
        c.font = header_font
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border = thin_border
        
    rows = [
        ["Twin-Screw Compressor Casing", "Structural Steel", 1450, "Frascold SpA", 620],
        ["Condenser Heat Exchanger Tubes", "Copper", 580, "Wieland Rolled Products", 310],
        ["Condenser Fan Blades & Shrouds", "Aluminium Alloy", 210, "ebm-papst Group", 450],
        ["Dual Inverter Drive System", "Power Electronics", 135, "Danfoss Drives", 780],
        ["Dual Induction Fan Motors", "Electric Motor", 320, "WEG Electric Corp", 540],
        ["Acoustic PUF Enclosure Panels", "Polyurethane Foam", 95, "Armacell Enterprise", 210],
        ["High-Pressure Suction Manifold", "Stainless Steel 304", 65, "Swagelok Co", 390],
        ["Structural Base Skid & C-Channels", "Structural Steel", 880, "ArcelorMittal", 280],
        ["Oil Separator & Coalescent Vessel", "Carbon Steel", 140, "Kelvion Thermal", 430]
    ]
    
    zebra_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
    
    for r_idx, row in enumerate(rows, start=7):
        ws.row_dimensions[r_idx].height = 18
        fill = zebra_fill if r_idx % 2 == 1 else white_fill
        for c_idx, val in enumerate(row, start=1):
            cell = ws.cell(row=r_idx, column=c_idx, value=val)
            cell.font = Font(name="Calibri", size=9.5)
            cell.fill = fill
            cell.border = thin_border
            if c_idx in [3, 5]:
                cell.alignment = Alignment(horizontal="right", vertical="center")
                cell.number_format = "#,##0"
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")
                
    # Column auto widths
    col_widths = {1: 34, 2: 24, 3: 16, 4: 26, 5: 24}
    for col_idx, width in col_widths.items():
        ws.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = width
        
    wb.save(xlsx_path)
    print(f"Created: {xlsx_path}")

def create_csv():
    csv_path = os.path.join(TEST_DIR, "03_modular_heat_pump_bom.csv")
    rows = [
        ["Component", "Material", "Mass (kg)", "Supplier", "Distance (km)"],
        ["Scroll Compressor Assembly", "Structural Steel", "380", "Danfoss Scroll Corp", "450"],
        ["Brazed Plate Heat Exchanger", "Stainless Steel 304", "110", "Alfa Laval Lund", "520"],
        ["Hydronic Copper Manifold", "Copper", "85", "Mueller Industries", "310"],
        ["Axial Ventilation Fan Blades", "Aluminium Alloy", "45", "Rosenberg Vent", "280"],
        ["High-Efficiency EC Fan Motor", "Electric Motor", "65", "Ziehl-Abegg SE", "610"],
        ["PUF Acoustic & Thermal Blanket", "Polyurethane Foam", "28", "Kingspan Insulation", "180"],
        ["Microcontroller & Digital Inverter", "Power Electronics", "22", "Schneider Electric", "720"],
        ["Galvanized Weatherproof Chassis", "Structural Steel", "240", "ThyssenKrupp Steel", "340"]
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    print(f"Created: {csv_path}")

def create_gap_test_file():
    """File purposefully crafted with gaps to test the PCR Gap Analysis & Warning Badges."""
    gap_csv = os.path.join(TEST_DIR, "04_incomplete_bom_for_gap_analysis.csv")
    rows = [
        ["Component", "Material", "Mass (kg)", "Supplier", "Distance (km)"],
        # Low total mass (< 50kg total) triggers ISO 14025 cut-off warning
        # Missing transport distance (0 km) triggers A2 Inbound Logistics warning
        ["Control Circuit Board", "Power Electronics", "12", "Shenzhen Controls", "0"],
        ["Small Bracket", "Structural Steel", "8", "Local Machine Shop", "0"]
    ]
    with open(gap_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    print(f"Created: {gap_csv}")

def create_json_project():
    json_path = os.path.join(TEST_DIR, "05_complete_project_payload.json")
    payload = {
        "project_info": {
            "product_name": "EcoMetric Centrifugal Chiller 500RT Benchmark",
            "manufacturer_name": "EcoMetric Thermal Systems Inc.",
            "functional_unit": "1 unit of HVAC water-cooled chiller over 25 years reference service life",
            "declared_unit": "1 piece of 500 RT chiller",
            "pcr_ref": "UL 10010-4 Part B v2.0 & EN 15804+A2",
            "geography": "US-Midwest",
            "lifespan_years": 25
        },
        "bom": [
            { "id": "bom-1", "name": "Compressor Volute & Impeller", "material": "steel_hot_rolled", "mass": 2250, "unit": "kg", "ecoinvent_id": "ecoinvent_steel_hot_rolled_glo", "supplier": "Midwest Steel Casting", "transport_km": 420 },
            { "id": "bom-2", "name": "Evaporator & Condenser Tubes", "material": "copper_tube_wire", "mass": 720, "unit": "kg", "ecoinvent_id": "ecoinvent_copper_tube_wire_glo", "supplier": "Great Lakes Copper Corp", "transport_km": 280 },
            { "id": "bom-3", "name": "Semi-Hermetic Induction Motor", "material": "electric_motor_industrial", "mass": 480, "unit": "kg", "ecoinvent_id": "ecoinvent_electric_motor_industrial_glo", "supplier": "Precision ElectroMotors Ltd", "transport_km": 650 },
            { "id": "bom-4", "name": "Thermal PUF Insulation Jackets", "material": "insulation_polyurethane_rigid", "mass": 140, "unit": "kg", "ecoinvent_id": "ecoinvent_insulation_pu_rigid_rer", "supplier": "PolyFoam Systems", "transport_km": 190 },
            { "id": "bom-5", "name": "Solid-State Variable Frequency Drive", "material": "electronics_vfd", "mass": 110, "unit": "kg", "ecoinvent_id": "ecoinvent_electronics_vfd_glo", "supplier": "Advantech Power Systems", "transport_km": 890 },
            { "id": "bom-6", "name": "Subcooler Microchannel Coils", "material": "aluminium_cast_alloy", "mass": 95, "unit": "kg", "ecoinvent_id": "ecoinvent_aluminium_cast_alloy_glo", "supplier": "Alloy Heat Exchangers", "transport_km": 350 },
            { "id": "bom-7", "name": "Refrigerant High-Pressure Piping", "material": "steel_stainless_304", "mass": 85, "unit": "kg", "ecoinvent_id": "ecoinvent_steel_stainless_304_glo", "supplier": "Precision Alloy Tubing", "transport_km": 340 }
        ],
        "manufacturing": {
            "annual_facility_kwh": 38500,
            "natural_gas_mj": 21000,
            "grid_region": "US_Average",
            "water_m3": 52.0
        },
        "transport": [
            { "mode": "Heavy Lorry >32t (EURO 6)", "distance": 485, "dist": 485, "emission_factor": 0.088, "ef": 0.088, "module": "A2" },
            { "mode": "Transoceanic Container Ship", "distance": 1200, "dist": 1200, "emission_factor": 0.0145, "ef": 0.0145, "module": "A2" }
        ],
        "operational": {
            "refrigerant_type": "R134a",
            "refrigerant_charge_kg": 45.0,
            "annual_leak_rate_percent": 2.0,
            "efficiency_kw_per_ton": 0.54,
            "capacity_rt": 500.0,
            "target_cities": ["Chicago", "Houston", "Frankfurt", "Dubai"]
        },
        "end_of_life": {
            "recycling_rate_percent": 92.4,
            "landfill_rate_percent": 4.5,
            "incineration_rate_percent": 3.1,
            "decommissioning_energy_kwh": 120
        }
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"Created: {json_path}")

def create_readme():
    readme_path = os.path.join(TEST_DIR, "README.md")
    content = """# EcoMetric Test Documents Suite

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
python -c "from backend.app.engines.pdf_extractor import extract_pdf_data; res = extract_pdf_data(open('test/01_centrifugal_chiller_spec.pdf','rb').read()); print(f'Extracted {len(res[\"bom\"])} parts, Refrigerant: {res[\"operational\"][\"refrigerant_type\"]}, Capacity: {res[\"operational\"][\"capacity_rt\"]} RT')"

# Verify Excel extraction
python -c "from backend.app.engines.excel_extractor import extract_excel_data; res = extract_excel_data(open('test/02_air_cooled_screw_chiller_bom.xlsx','rb').read()); print(f'Extracted {len(res[\"bom\"])} parts')"
```

### 2. Test via REST API (`POST /api/documents/upload`)
```bash
curl -X POST "http://localhost:8000/api/documents/upload" \
  -F "files=@test/01_centrifugal_chiller_spec.pdf" \
  -F "files=@test/02_air_cooled_screw_chiller_bom.xlsx"
```
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created: {readme_path}")

if __name__ == "__main__":
    create_pdf()
    create_excel()
    create_csv()
    create_gap_test_file()
    create_json_project()
    create_readme()
    print("\nAll test documents created successfully in:", TEST_DIR)
