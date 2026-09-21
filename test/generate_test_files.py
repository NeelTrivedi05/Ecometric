import os
import csv
import json
import zipfile
import shutil
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLES_DIR = os.path.abspath(os.path.join(TEST_DIR, "..", "backend", "data", "samples"))
os.makedirs(SAMPLES_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Styling Helpers for Excel
# ---------------------------------------------------------------------------
HEADER_FILL_DARK = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
HEADER_FILL_SLATE = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
HEADER_FILL_AMBER = PatternFill(start_color="B45309", end_color="B45309", fill_type="solid")
HEADER_FILL_EMERALD = PatternFill(start_color="047857", end_color="047857", fill_type="solid")
HEADER_FILL_BLUE = PatternFill(start_color="1D4ED8", end_color="1D4ED8", fill_type="solid")
ZEBRA_FILL = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
WHITE_FILL = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

FONT_TITLE = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
FONT_HEADER = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
FONT_CELL = Font(name="Calibri", size=9.5)
FONT_BOLD = Font(name="Calibri", size=9.5, bold=True)

THIN_BORDER = Border(
    left=Side(style='thin', color='CBD5E1'),
    right=Side(style='thin', color='CBD5E1'),
    top=Side(style='thin', color='CBD5E1'),
    bottom=Side(style='thin', color='CBD5E1')
)

# ---------------------------------------------------------------------------
# 01. PDF Cutsheet
# ---------------------------------------------------------------------------
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
        'DocTitle', parent=styles['Heading1'], fontSize=16, leading=20, textColor=colors.HexColor('#0F172A'), spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocBody', parent=styles['Normal'], fontSize=9.5, leading=14, textColor=colors.HexColor('#334155')
    )
    story = [
        Paragraph("<b>Technical Specification &amp; Engineering Cut Sheet</b>", title_style),
        Paragraph("Equipment Cut Sheet for Environmental Product Declaration (ISO 14025 / EN 15804+A2)", body_style),
        Spacer(1, 10),
        Paragraph("""
        <b>Product Name:</b> Carrier AquaEdge 19DV Centrifugal Chiller<br/>
        <b>Model Capacity:</b> 500 RT (1,758 kW Nominal Chilled Water)<br/>
        <b>Refrigerant Type:</b> R134a (Initial Factory Charge: 45.0 kg, fugitive leak rate: 2.0%/yr)<br/>
        <b>Plant Utility Power:</b> 34,000 kWh annual manufacturing electricity allocated to unit<br/>
        <b>PCR Category Standard:</b> UL 10010-4 Part B &amp; EN 15804+A2 (Industrial HVAC Systems)<br/>
        <b>Reference Service Life (RSL):</b> 25 Years with standard maintenance intervals
        """, body_style),
        Spacer(1, 14)
    ]
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
    t = Table(table_data, colWidths=[160, 110, 75, 125, 70])
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

# ---------------------------------------------------------------------------
# 02. Air-Cooled Screw Chiller BOM (Excel)
# ---------------------------------------------------------------------------
def create_excel():
    xlsx_path = os.path.join(TEST_DIR, "02_air_cooled_screw_chiller_bom.xlsx")
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Engineering BOM"
    ws.merge_cells("A1:E1")
    ws["A1"] = "ECO-METRIC BILL OF MATERIALS (BOM) - AIR-COOLED SCREW CHILLER 300RT"
    ws["A1"].font = FONT_TITLE
    ws["A1"].fill = HEADER_FILL_DARK
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 28

    metadata = [
        ("Equipment Type:", "Air-Cooled Screw Chiller (300 RT / 1,055 kW)", "PCR Standard:", "UL 10010-4 Part B"),
        ("Manufacturer:", "EcoMetric Thermal Solutions", "Refrigerant:", "R134a (55 kg Charge)"),
        ("Reference Service Life:", "25 Years", "Assembly Electricity:", "28,500 kWh/year")
    ]
    for r_idx, (k1, v1, k2, v2) in enumerate(metadata, start=2):
        ws.cell(row=r_idx, column=1, value=k1).font = FONT_BOLD
        ws.cell(row=r_idx, column=2, value=v1).font = FONT_CELL
        ws.cell(row=r_idx, column=3, value=k2).font = FONT_BOLD
        ws.cell(row=r_idx, column=4, value=v2).font = FONT_CELL
        ws.row_dimensions[r_idx].height = 18

    headers = ["Component Description", "Raw Material", "Weight (kg)", "Tier-1 Supplier", "Transport Distance (km)"]
    ws.row_dimensions[6].height = 22
    for col_idx, h in enumerate(headers, start=1):
        c = ws.cell(row=6, column=col_idx, value=h)
        c.fill = HEADER_FILL_SLATE
        c.font = FONT_HEADER
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border = THIN_BORDER

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
    for r_idx, row in enumerate(rows, start=7):
        ws.row_dimensions[r_idx].height = 18
        fill = ZEBRA_FILL if r_idx % 2 == 1 else WHITE_FILL
        for c_idx, val in enumerate(row, start=1):
            cell = ws.cell(row=r_idx, column=c_idx, value=val)
            cell.font = FONT_CELL
            cell.fill = fill
            cell.border = THIN_BORDER
            if c_idx in [3, 5]:
                cell.alignment = Alignment(horizontal="right", vertical="center")
                cell.number_format = "#,##0"
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

    for col_idx, width in {1: 34, 2: 24, 3: 16, 4: 26, 5: 24}.items():
        ws.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = width

    wb.save(xlsx_path)
    print(f"Created: {xlsx_path}")

# ---------------------------------------------------------------------------
# 03. Modular Heat Pump BOM (CSV)
# ---------------------------------------------------------------------------
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
        csv.writer(f).writerows(rows)
    print(f"Created: {csv_path}")

# ---------------------------------------------------------------------------
# 04. Gap Analysis Test File (CSV)
# ---------------------------------------------------------------------------
def create_gap_test_file():
    gap_csv = os.path.join(TEST_DIR, "04_incomplete_bom_for_gap_analysis.csv")
    rows = [
        ["Component", "Material", "Mass (kg)", "Supplier", "Distance (km)"],
        ["Control Circuit Board", "Power Electronics", "12", "Shenzhen Controls", "0"],
        ["Small Bracket", "Structural Steel", "8", "Local Machine Shop", "0"]
    ]
    with open(gap_csv, "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(rows)
    print(f"Created: {gap_csv}")

# ---------------------------------------------------------------------------
# 05. Complete JSON Project Payload
# ---------------------------------------------------------------------------
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
        "installation": {
            "outbound_transport_km": 650,
            "rigging_crane_diesel_liters": 37.8,
            "installation_energy_kwh": 350,
            "commissioning_refrigerant_loss_kg": 0.50
        },
        "operational": {
            "refrigerant_type": "R134a",
            "refrigerant_charge_kg": 45.0,
            "annual_leak_rate_percent": 2.0,
            "efficiency_kw_per_ton": 0.54,
            "capacity_rt": 500.0,
            "cooling_tower_water_m3_yr": 120.0,
            "scheduled_maintenance_kwh_yr": 180.0,
            "target_cities": ["Chicago", "Houston", "Frankfurt", "Dubai"]
        },
        "end_of_life": {
            "recycling_rate_percent": 92.4,
            "landfill_rate_percent": 4.5,
            "incineration_rate_percent": 3.1,
            "decommissioning_energy_kwh": 120,
            "waste_transport_km": 100
        },
        "circularity_d": {
            "steel_scrap_recovery_rate": 95.0,
            "copper_scrap_recovery_rate": 96.0,
            "aluminium_recovery_rate": 90.0,
            "refrigerant_reclamation_rate": 92.0,
            "net_avoided_burden_gwp_kg": -3210.0
        }
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"Created: {json_path}")

# ---------------------------------------------------------------------------
# 06. NEW: Multi-Modal Inbound Logistics Manifest (Module A2 CSV)
# ---------------------------------------------------------------------------
def create_a2_logistics_csv():
    csv_path = os.path.join(TEST_DIR, "06_multimodal_inbound_logistics_manifest_A2.csv")
    rows = [
        ["Supplier", "Origin", "Destination", "Mode", "Distance (km)", "Component Linked", "Allocated Mass (kg)"],
        ["Zurich Foundry Ltd", "Zurich, Switzerland", "Genoa Port, Italy", "Freight Train (Electric/Diesel)", "450", "Compressor Volute & Impeller", "2250"],
        ["Mediterranean Shipping Co", "Genoa, Italy", "Port of New York, USA", "Transoceanic Container Ship", "6200", "Compressor Volute & Impeller", "2250"],
        ["Great Lakes Intermodal", "Port of NY, USA", "Assembly Plant, Chicago IL", "Freight Train (Electric/Diesel)", "900", "Compressor Volute & Impeller", "2250"],
        ["Wieland Copper Mill", "Ulm, Germany", "Rotterdam Port, Netherlands", "Heavy Lorry >32t (EURO 6)", "620", "Evaporator & Condenser Tubes", "720"],
        ["Atlantic Carrier Line", "Rotterdam, Netherlands", "Montreal Port, Canada", "Transoceanic Container Ship", "5850", "Evaporator & Condenser Tubes", "720"],
        ["Advantech Electronics", "Kaohsiung, Taiwan", "Long Beach Port, USA", "Transoceanic Container Ship", "10800", "Solid-State Variable Frequency Drive", "110"],
        ["US Pacific Trucking", "Long Beach, CA", "Assembly Plant, Chicago IL", "Heavy Lorry >32t (EURO 6)", "3250", "Solid-State Variable Frequency Drive", "110"],
        ["ArcelorMittal Midwest", "Burns Harbor, IN", "Assembly Plant, Chicago IL", "Heavy Lorry >32t (EURO 6)", "85", "Base Skid & Structural Frame", "540"],
        ["Armacell Polymer Systems", "Mebane, NC", "Assembly Plant, Chicago IL", "Heavy Lorry >32t (EURO 6)", "1120", "Thermal Insulation Blankets", "140"]
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(rows)
    print(f"Created: {csv_path}")

# ---------------------------------------------------------------------------
# 07. NEW: Job Site Installation & Crane Rigging (Module A4 / A5 XLSX)
# ---------------------------------------------------------------------------
def create_a4_a5_installation_excel():
    xlsx_path = os.path.join(TEST_DIR, "07_jobsite_installation_and_rigging_A4_A5.xlsx")
    wb = openpyxl.Workbook()

    # Sheet 1: General Info
    ws1 = wb.active
    ws1.title = "General_Specs"
    ws1.merge_cells("A1:D1")
    ws1["A1"] = "HVAC CHILLER JOB SITE INSTALLATION & RIGGING SPECIFICATION (A4 & A5)"
    ws1["A1"].font = FONT_TITLE
    ws1["A1"].fill = HEADER_FILL_AMBER
    ws1["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws1.row_dimensions[1].height = 26

    specs = [
        ("Project Name:", "Commercial High-Rise District Cooling Plant", "PCR Standard:", "UL 10010-4 Part B v2.0"),
        ("Equipment Model:", "EcoMetric 500RT Centrifugal Chiller", "Job Site Location:", "Dallas-Fort Worth, TX"),
        ("Finished Weight (kg):", "4,380 kg (Dry Shipping Mass)", "Installation Season:", "Autumn Commissioning"),
        ("Outbound Distance (km):", "750 km (Heavy Lorry >32t)", "Crane Diesel (Liters):", "37.8 Liters (50-ton Hydraulic Crane)"),
        ("Commissioning Power:", "350 kWh Electricity", "Refrigerant Test Loss:", "0.50 kg R134a factory test loss")
    ]
    for r_idx, (k1, v1, k2, v2) in enumerate(specs, start=3):
        ws1.cell(row=r_idx, column=1, value=k1).font = FONT_BOLD
        ws1.cell(row=r_idx, column=2, value=v1).font = FONT_CELL
        ws1.cell(row=r_idx, column=3, value=k2).font = FONT_BOLD
        ws1.cell(row=r_idx, column=4, value=v2).font = FONT_CELL
        ws1.row_dimensions[r_idx].height = 18

    # Sheet 2: Outbound Transport (A4)
    ws2 = wb.create_sheet(title="Outbound_Transport_A4")
    ws2.merge_cells("A1:E1")
    ws2["A1"] = "MODULE A4: FACTORY-TO-SITE OUTBOUND FREIGHT LOGISTICS"
    ws2["A1"].font = FONT_TITLE
    ws2["A1"].fill = HEADER_FILL_SLATE
    ws2["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws2.row_dimensions[1].height = 24

    a4_headers = ["Leg ID", "Origin Facility", "Destination Site", "Transport Mode", "Distance (km)", "Equipment Weight (kg)"]
    for col_idx, h in enumerate(a4_headers, start=1):
        c = ws2.cell(row=3, column=col_idx, value=h)
        c.fill = HEADER_FILL_SLATE
        c.font = FONT_HEADER
        c.border = THIN_BORDER
        c.alignment = Alignment(horizontal="center", vertical="center")
    ws2.row_dimensions[3].height = 20

    a4_data = [
        ["A4-LEG-1", "Manufacturing Plant (Chicago IL)", "Regional Staging Yard (Dallas TX)", "Heavy Lorry >32t (EURO 6)", 750, 4380],
        ["A4-LEG-2", "Regional Staging Yard", "Building Mechanical Rooftop", "Heavy Lorry >32t (EURO 6)", 25, 4380]
    ]
    for r_idx, row in enumerate(a4_data, start=4):
        for c_idx, val in enumerate(row, start=1):
            c = ws2.cell(row=r_idx, column=c_idx, value=val)
            c.font = FONT_CELL
            c.border = THIN_BORDER
            c.fill = WHITE_FILL

    # Sheet 3: Installation & Crane Rigging (A5)
    ws3 = wb.create_sheet(title="Installation_Rigging_A5")
    ws3.merge_cells("A1:E1")
    ws3["A1"] = "MODULE A5: JOB SITE RIGGING, CRANE HOISTING & COMMISSIONING"
    ws3["A1"].font = FONT_TITLE
    ws3["A1"].fill = HEADER_FILL_AMBER
    ws3["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws3.row_dimensions[1].height = 24

    a5_headers = ["Activity Description", "Resource / Equipment", "Quantity Consumed", "Unit", "UL 10010-4 Baseline Basis"]
    for col_idx, h in enumerate(a5_headers, start=1):
        c = ws3.cell(row=3, column=col_idx, value=h)
        c.fill = HEADER_FILL_SLATE
        c.font = FONT_HEADER
        c.border = THIN_BORDER
        c.alignment = Alignment(horizontal="center", vertical="center")
    ws3.row_dimensions[3].height = 20

    a5_data = [
        ["Mobile Crane Unloading & Placement", "50-ton Hydraulic Mobile Crane", 37.8, "Liters Diesel", "3.0 crane operating hrs @ 12.6 L/hr fuel rate"],
        ["Job Site Electrical Hookup & Wiring", "Grid Electricity (US-ERCOT)", 350.0, "kWh", "Instrumentation, pump cycling, calibration power"],
        ["Pressure Decay Test & Refrigerant Loss", "R134a Fluorochemical", 0.50, "kg Loss", "0.5 kg factory commissioning gauge release"],
        ["Equipment Inert Pad Mount", "Elastomeric Vibration Pads", 45.0, "kg Neoprene", "Base structural isolation pad mounting"]
    ]
    for r_idx, row in enumerate(a5_data, start=4):
        for c_idx, val in enumerate(row, start=1):
            c = ws3.cell(row=r_idx, column=c_idx, value=val)
            c.font = FONT_CELL
            c.border = THIN_BORDER
            c.fill = ZEBRA_FILL if r_idx % 2 == 1 else WHITE_FILL

    for ws in [ws1, ws2, ws3]:
        for col_idx in range(1, 7):
            ws.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = 24

    wb.save(xlsx_path)
    print(f"Created: {xlsx_path}")

# ---------------------------------------------------------------------------
# 08. NEW: Operational Life & Maintenance Schedule (Modules B1–B7 CSV)
# ---------------------------------------------------------------------------
def create_b_operational_csv():
    csv_path = os.path.join(TEST_DIR, "08_operational_use_and_maintenance_B1_to_B7.csv")
    rows = [
        ["Lifecycle Stage", "Parameter Name", "Value", "Unit", "PCR Reference / Engineering Description"],
        ["B1 (Fugitive Emissions)", "Refrigerant Type", "R134a", "Type", "1,1,1,2-Tetrafluoroethane (GWP100 = 1430 kg CO2e/kg)"],
        ["B1 (Fugitive Emissions)", "Refrigerant Charge", "45.0", "kg", "Initial nameplate refrigerant charge sealed in factory"],
        ["B1 (Fugitive Emissions)", "Annual Leak Rate", "2.0", "% / year", "UL 10010-4 Table 8 benchmark fugitive rate (0.90 kg/yr)"],
        ["B2 (Maintenance)", "Synthetic POE Lubricant", "25.0", "kg / cycle", "Polyolester compressor oil replacement every 2 years"],
        ["B2 (Maintenance)", "Maintenance Cycles per RSL", "12", "Cycles", "12 oil changes over 25-year Reference Service Life"],
        ["B3 (Repair)", "Condenser Brush Re-Tubing", "45.0", "kg Copper", "Tube cleaning & sacrificial zinc anode replacement every 5 yrs"],
        ["B4 (Replacement)", "Major Overhaul Year", "15", "Year", "Motor bearing rebuild and expansion valve replacement at yr 15"],
        ["B6 (Operational Energy)", "Rated Capacity", "500.0", "RT", "Water-cooled nominal chilling capacity (1,758 kW thermal)"],
        ["B6 (Operational Energy)", "100% Full Load Efficiency", "0.580", "kW / TR", "Full load rated power consumption at standard conditions"],
        ["B6 (Operational Energy)", "75% Part Load Efficiency", "0.440", "kW / TR", "AHRI 550/590 Standard Part-Load rating (Weight: 42%)"],
        ["B6 (Operational Energy)", "50% Part Load Efficiency", "0.380", "kW / TR", "AHRI 550/590 Standard Part-Load rating (Weight: 45%)"],
        ["B6 (Operational Energy)", "25% Part Load Efficiency", "0.490", "kW / TR", "AHRI 550/590 Standard Part-Load rating (Weight: 12%)"],
        ["B6 (Operational Energy)", "Integrated Part-Load Value (IPLV)", "0.435", "kW / TR", "Weighted AHRI 550/590 seasonal efficiency formula"],
        ["B6 (Operational Energy)", "Annual Operating Hours", "8760", "Hours / year", "Continuous commercial data-center / hospital duty"],
        ["B7 (Operational Water)", "Cooling Tower Water Evaporation", "120.0", "m3 / year", "Make-up water consumed for heat rejection drift and blowdown"]
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(rows)
    print(f"Created: {csv_path}")

# ---------------------------------------------------------------------------
# 09. NEW: End of Life & Circularity Recovery (Modules C1–C4 & D JSON)
# ---------------------------------------------------------------------------
def create_c_d_circularity_json():
    json_path = os.path.join(TEST_DIR, "09_end_of_life_and_circularity_C1_to_D.json")
    payload = {
        "metadata": {
            "title": "HVAC Chiller End-of-Life & Circularity Inventory",
            "standard": "ISO 21930:2017 / EN 15804+A2 Module C & Module D",
            "equipment": "500 RT Centrifugal Water-Cooled Chiller",
            "total_deconstruction_mass_kg": 4380.0
        },
        "end_of_life_modules_c": {
            "c1_deconstruction": {
                "decommissioning_energy_kwh": 120.0,
                "refrigerant_recovery_pump_power_kwh": 35.0,
                "onsite_torch_cutting_energy_kwh": 85.0,
                "ecoinvent_provider": "ecoinvent_elec_mv_us",
                "description": "Safe recovery of fluorinated refrigerant into DOT cylinders and structural steel flame-cutting"
            },
            "c2_waste_transport": {
                "waste_transport_km": 100.0,
                "vehicle_type": "Heavy Lorry >32t (EURO 6)",
                "ecoinvent_provider": "ecoinvent_transport_lorry_32t_rer",
                "destination": "Certified Regional Metals Scrap Shredder & Recycling Facility"
            },
            "c3_waste_processing_sorting": {
                "recycling_rate_percent": 92.4,
                "incineration_rate_percent": 3.1,
                "materials_sorted": [
                    { "material": "Structural Steel & Cast Iron", "mass_kg": 2790.0, "route": "Electric Arc Furnace (EAF) Scrap Re-melting" },
                    { "material": "Copper Tubes & Electrical Windings", "mass_kg": 720.0, "route": "Electrolytic Copper Smelting Refining" },
                    { "material": "Aluminium Microchannels & Impellers", "mass_kg": 95.0, "route": "Secondary Aluminium Ingot Re-smelting" },
                    { "material": "R134a Recovered Refrigerant", "mass_kg": 41.4, "route": "AHRI 700 Reclamation & Certified Distillation" }
                ]
            },
            "c4_final_disposal": {
                "landfill_rate_percent": 4.5,
                "landfilled_mass_kg": 197.1,
                "materials": ["Degraded elastomeric PUF insulation foam", "Cured synthetic oil sludge", "Miscellaneous gasket seals"],
                "ecoinvent_provider": "ecoinvent_waste_plastic_mixture_landfill"
            }
        },
        "circularity_module_d": {
            "net_avoided_burdens": {
                "steel_scrap_recovery_rate": 95.0,
                "copper_scrap_recovery_rate": 96.0,
                "aluminium_recovery_rate": 90.0,
                "refrigerant_reclamation_rate": 92.0,
                "net_avoided_burden_gwp_kg": -3210.0,
                "displacement_credits": [
                    { "material": "Secondary Steel Scrap", "displaces": "Blast Furnace Primary Hot-Rolled Steel", "credit_gwp_kg": -1850.0 },
                    { "material": "Secondary Copper", "displaces": "Primary Electrolytic Copper Cathode", "credit_gwp_kg": -980.0 },
                    { "material": "Secondary Aluminium", "displaces": "Primary Smelted Ingot", "credit_gwp_kg": -380.0 }
                ]
            }
        }
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"Created: {json_path}")

# ---------------------------------------------------------------------------
# 11. NEW: Master Multi-Tab Chiller Engineering Workbook (All Modules XLSX)
# ---------------------------------------------------------------------------
def create_multitab_master_excel():
    xlsx_path = os.path.join(TEST_DIR, "11_water_cooled_centrifugal_multitab_master.xlsx")
    wb = openpyxl.Workbook()

    # Tab 1: General_Specs
    ws1 = wb.active
    ws1.title = "General_Specs"
    ws1.merge_cells("A1:D1")
    ws1["A1"] = "500 RT WATER-COOLED CENTRIFUGAL CHILLER - CRADLE-TO-GRAVE LCA MASTER"
    ws1["A1"].font = FONT_TITLE
    ws1["A1"].fill = HEADER_FILL_EMERALD
    ws1["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws1.row_dimensions[1].height = 28

    master_metadata = [
        ("Equipment Model:", "Carrier AquaEdge 19DV Centrifugal Chiller", "PCR Standard:", "UL 10010-4 Part B v2.0 (2018)"),
        ("Chiller Capacity:", "500 RT (1,758 kW Nominal)", "Declared Unit:", "1 unit over 25 years Reference Service Life"),
        ("Refrigerant Type:", "R134a (45.0 kg Charge)", "Annual Fugitive Leak:", "2.0% / year"),
        ("Annual Factory Power:", "34,000 kWh Electricity", "Natural Gas Consumed:", "18,500 MJ Thermal"),
        ("Outbound Freight:", "750 km Heavy Lorry >32t", "Rigging Crane Diesel:", "37.8 Liters (50-ton Hydraulic Crane)")
    ]
    for r_idx, (k1, v1, k2, v2) in enumerate(master_metadata, start=3):
        ws1.cell(row=r_idx, column=1, value=k1).font = FONT_BOLD
        ws1.cell(row=r_idx, column=2, value=v1).font = FONT_CELL
        ws1.cell(row=r_idx, column=3, value=k2).font = FONT_BOLD
        ws1.cell(row=r_idx, column=4, value=v2).font = FONT_CELL
        ws1.row_dimensions[r_idx].height = 18

    # Tab 2: BOM_A1
    ws2 = wb.create_sheet(title="BOM_A1")
    ws2.merge_cells("A1:E1")
    ws2["A1"] = "MODULE A1: RAW MATERIALS & BILL OF MATERIALS (BOM)"
    ws2["A1"].font = FONT_TITLE
    ws2["A1"].fill = HEADER_FILL_SLATE
    ws2["A1"].alignment = Alignment(horizontal="center", vertical="center")

    bom_headers = ["Part ID", "Component Description", "Material Class", "Weight (kg)", "Tier-1 Supplier"]
    for col_idx, h in enumerate(bom_headers, start=1):
        c = ws2.cell(row=3, column=col_idx, value=h)
        c.fill = HEADER_FILL_SLATE
        c.font = FONT_HEADER
        c.border = THIN_BORDER
        c.alignment = Alignment(horizontal="center", vertical="center")

    bom_rows = [
        ["BOM-01", "Compressor Volute & Casting", "Structural Steel", 2250, "Midwest Iron Works"],
        ["BOM-02", "Evaporator & Condenser Tubes", "Copper", 720, "Great Lakes Copper Corp"],
        ["BOM-03", "Semi-Hermetic Induction Motor", "Electric Motor", 480, "Precision ElectroMotors Ltd"],
        ["BOM-04", "Shell Thermal PUF Insulation", "Polyurethane Foam", 140, "PolyFoam Systems"],
        ["BOM-05", "Solid-State Variable Frequency Drive", "Power Electronics", 110, "Advantech Power Systems"],
        ["BOM-06", "Microchannel Subcooler Coil", "Aluminium Alloy", 95, "Alloy Heat Exchangers"],
        ["BOM-07", "Refrigerant High-Pressure Piping", "Stainless Steel 304", 85, "Precision Alloy Tubing"],
        ["BOM-08", "Structural Base Skid Frame", "Structural Steel", 540, "ArcelorMittal Midwest"]
    ]
    for r_idx, row in enumerate(bom_rows, start=4):
        for c_idx, val in enumerate(row, start=1):
            c = ws2.cell(row=r_idx, column=c_idx, value=val)
            c.font = FONT_CELL
            c.border = THIN_BORDER
            c.fill = ZEBRA_FILL if r_idx % 2 == 1 else WHITE_FILL

    # Tab 3: Logistics_A2
    ws3 = wb.create_sheet(title="Logistics_A2")
    ws3.merge_cells("A1:E1")
    ws3["A1"] = "MODULE A2: INBOUND FREIGHT LOGISTICS MANIFEST"
    ws3["A1"].font = FONT_TITLE
    ws3["A1"].fill = HEADER_FILL_AMBER
    ws3["A1"].alignment = Alignment(horizontal="center", vertical="center")

    a2_headers = ["Leg ID", "Supplier & Route", "Transport Mode", "Distance (km)", "Freight Mass (kg)"]
    for col_idx, h in enumerate(a2_headers, start=1):
        c = ws3.cell(row=3, column=col_idx, value=h)
        c.fill = HEADER_FILL_SLATE
        c.font = FONT_HEADER
        c.border = THIN_BORDER
        c.alignment = Alignment(horizontal="center", vertical="center")

    a2_rows = [
        ["A2-01", "Midwest Iron Works (Burns Harbor -> Chicago)", "Heavy Lorry >32t (EURO 6)", 420, 2250],
        ["A2-02", "Great Lakes Copper (Ulm -> Rotterdam Port)", "Heavy Lorry >32t (EURO 6)", 620, 720],
        ["A2-03", "Transatlantic Sea Route (Rotterdam -> Montreal)", "Transoceanic Container Ship", 5850, 720],
        ["A2-04", "Advantech Electronics (Kaohsiung -> Long Beach)", "Transoceanic Container Ship", 10800, 110],
        ["A2-05", "Advantech Rail (Long Beach -> Chicago Intermodal)", "Freight Train (Electric/Diesel)", 3250, 110],
        ["A2-06", "ElectroMotors (Graz Austria -> Hamburg)", "Freight Train (Electric/Diesel)", 840, 480]
    ]
    for r_idx, row in enumerate(a2_rows, start=4):
        for c_idx, val in enumerate(row, start=1):
            c = ws3.cell(row=r_idx, column=c_idx, value=val)
            c.font = FONT_CELL
            c.border = THIN_BORDER
            c.fill = ZEBRA_FILL if r_idx % 2 == 1 else WHITE_FILL

    # Tab 4: Installation_A4_A5
    ws4 = wb.create_sheet(title="Installation_A4_A5")
    ws4.merge_cells("A1:D1")
    ws4["A1"] = "MODULE A4 & A5: JOB SITE RIGGING & COMMISSIONING"
    ws4["A1"].font = FONT_TITLE
    ws4["A1"].fill = HEADER_FILL_BLUE
    ws4["A1"].alignment = Alignment(horizontal="center", vertical="center")

    inst_headers = ["Parameter / Scope", "Value", "Unit", "Engineering Benchmark"]
    for col_idx, h in enumerate(inst_headers, start=1):
        c = ws4.cell(row=3, column=col_idx, value=h)
        c.fill = HEADER_FILL_SLATE
        c.font = FONT_HEADER
        c.border = THIN_BORDER
        c.alignment = Alignment(horizontal="center", vertical="center")

    inst_rows = [
        ["Outbound Transit Distance to Jobsite (A4)", 750.0, "km", "Heavy Lorry >32t delivery from plant"],
        ["Hydraulic Mobile Crane Diesel Fuel (A5)", 37.8, "Liters", "3.0 hours @ 12.6 L/hr 50t hydraulic crane"],
        ["Jobsite Commissioning Power (A5)", 350.0, "kWh", "Instrumentation & motor rotation verification"],
        ["Commissioning Refrigerant Pressure Loss (A5)", 0.50, "kg", "Factory charging manifold test purge"]
    ]
    for r_idx, row in enumerate(inst_rows, start=4):
        for c_idx, val in enumerate(row, start=1):
            c = ws4.cell(row=r_idx, column=c_idx, value=val)
            c.font = FONT_CELL
            c.border = THIN_BORDER
            c.fill = ZEBRA_FILL if r_idx % 2 == 1 else WHITE_FILL

    # Tab 5: Operations_B1_B7
    ws5 = wb.create_sheet(title="Operations_B1_B7")
    ws5.merge_cells("A1:D1")
    ws5["A1"] = "MODULES B1–B7: 25-YEAR OPERATIONAL USE & MAINTENANCE"
    ws5["A1"].font = FONT_TITLE
    ws5["A1"].fill = HEADER_FILL_SLATE
    ws5["A1"].alignment = Alignment(horizontal="center", vertical="center")

    op_headers = ["Operational Parameter", "Value", "Unit", "Description"]
    for col_idx, h in enumerate(op_headers, start=1):
        c = ws5.cell(row=3, column=col_idx, value=h)
        c.fill = HEADER_FILL_SLATE
        c.font = FONT_HEADER
        c.border = THIN_BORDER
        c.alignment = Alignment(horizontal="center", vertical="center")

    op_rows = [
        ["100% Full Load Efficiency (B6)", 0.580, "kW / TR", "Full load nominal chilling rating"],
        ["75% Part Load Rating (B6)", 0.440, "kW / TR", "AHRI 550/590 75% load point"],
        ["Integrated Part Load Value (IPLV)", 0.435, "kW / TR", "Weighted seasonal rating (0.435 kW/TR)"],
        ["Cooling Tower Evaporation Water (B7)", 120.0, "m3 / yr", "Evaporative heat rejection make-up"],
        ["Synthetic POE Lubricating Oil (B2)", 25.0, "kg / 2yr", "Compressor lubrication service change"],
        ["Scheduled Maintenance Electricity (B2)", 180.0, "kWh / yr", "Annual preventive maintenance power"]
    ]
    for r_idx, row in enumerate(op_rows, start=4):
        for c_idx, val in enumerate(row, start=1):
            c = ws5.cell(row=r_idx, column=c_idx, value=val)
            c.font = FONT_CELL
            c.border = THIN_BORDER
            c.fill = ZEBRA_FILL if r_idx % 2 == 1 else WHITE_FILL

    # Tab 6: Circularity_C_D
    ws6 = wb.create_sheet(title="Circularity_C_D")
    ws6.merge_cells("A1:D1")
    ws6["A1"] = "MODULES C & D: END OF LIFE RECYCLING & RESOURCE RECOVERY"
    ws6["A1"].font = FONT_TITLE
    ws6["A1"].fill = HEADER_FILL_EMERALD
    ws6["A1"].alignment = Alignment(horizontal="center", vertical="center")

    cd_headers = ["End of Life Stream", "Rate (%)", "Recovery Benchmark", "Avoided Burden Credit"]
    for col_idx, h in enumerate(cd_headers, start=1):
        c = ws6.cell(row=3, column=col_idx, value=h)
        c.fill = HEADER_FILL_SLATE
        c.font = FONT_HEADER
        c.border = THIN_BORDER
        c.alignment = Alignment(horizontal="center", vertical="center")

    cd_rows = [
        ["Metal Recycling Rate (C3)", 92.4, "% Recovered", "Electric Arc Furnace scrap re-melting"],
        ["Non-Recyclable Inert Landfill (C4)", 4.5, "% Disposed", "Sanitary solid waste landfilling"],
        ["Thermal Incineration (C3)", 3.1, "% Energy Recovery", "Combustion with energy recovery"],
        ["Steel Scrap Recovery Rate (D)", 95.0, "% Replaced", "Displaces virgin blast-furnace steel"],
        ["Copper Scrap Recovery Rate (D)", 96.0, "% Replaced", "Displaces primary electrolytic copper"],
        ["Aluminium Recovery Rate (D)", 90.0, "% Replaced", "Displaces virgin smelted aluminium"]
    ]
    for r_idx, row in enumerate(cd_rows, start=4):
        for c_idx, val in enumerate(row, start=1):
            c = ws6.cell(row=r_idx, column=c_idx, value=val)
            c.font = FONT_CELL
            c.border = THIN_BORDER
            c.fill = ZEBRA_FILL if r_idx % 2 == 1 else WHITE_FILL

    for ws in [ws1, ws2, ws3, ws4, ws5, ws6]:
        for col_idx in range(1, 6):
            ws.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = 28

    wb.save(xlsx_path)
    print(f"Created: {xlsx_path}")

# ---------------------------------------------------------------------------
# 10. Complete Enterprise Chiller Package (.zip)
# ---------------------------------------------------------------------------
def create_enterprise_zip_package():
    zip_path = os.path.join(TEST_DIR, "10_complete_enterprise_chiller_package.zip")
    files_to_pack = [
        "01_centrifugal_chiller_spec.pdf",
        "02_air_cooled_screw_chiller_bom.xlsx",
        "06_multimodal_inbound_logistics_manifest_A2.csv",
        "07_jobsite_installation_and_rigging_A4_A5.xlsx",
        "08_operational_use_and_maintenance_B1_to_B7.csv",
        "09_end_of_life_and_circularity_C1_to_D.json",
        "11_water_cooled_centrifugal_multitab_master.xlsx"
    ]
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for fname in files_to_pack:
            fpath = os.path.join(TEST_DIR, fname)
            if os.path.isfile(fpath):
                z.write(fpath, arcname=fname)
    print(f"Created: {zip_path}")

def sync_to_backend_samples():
    """Syncs test documents to backend/data/samples for REST API availability."""
    for fname in os.listdir(TEST_DIR):
        if fname.startswith(("01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "sample")):
            src = os.path.join(TEST_DIR, fname)
            dst = os.path.join(SAMPLES_DIR, fname)
            shutil.copy2(src, dst)
    print(f"Synced test suite to {SAMPLES_DIR}")

def create_readme():
    readme_path = os.path.join(TEST_DIR, "README.md")
    content = """# EcoMetric Comprehensive Test Documents Suite

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
curl -X POST "http://localhost:8000/api/documents/upload" \
  -F "files=@test/11_water_cooled_centrifugal_multitab_master.xlsx"
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
    create_a2_logistics_csv()
    create_a4_a5_installation_excel()
    create_b_operational_csv()
    create_c_d_circularity_json()
    create_multitab_master_excel()
    create_enterprise_zip_package()
    sync_to_backend_samples()
    create_readme()
    print("\nAll test documents created and synced successfully!")
