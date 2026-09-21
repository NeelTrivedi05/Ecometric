import os
import io
import csv
import json
import zipfile
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from ..engines.ecoinvent_lookup import search_ecoinvent_activities, get_activity_lcia
from ..engines.pdf_extractor import extract_pdf_data
from ..engines.excel_extractor import extract_excel_data
from ..engines.messy_data_parser import (
    parse_flexible_json,
    parse_messy_csv,
    synthesize_bom_from_declared_weight,
    clean_decimal_number
)

router = APIRouter(prefix="/api/documents", tags=["Document Ingestion & Gap Analysis"])

SAMPLES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "samples"))
TEST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "test"))

@router.get("/samples")
def list_sample_files():
    """List available test sample files covering all cradle-to-grave lifecycle stages."""
    samples = [
        {
            "filename": "06_multimodal_inbound_logistics_manifest_A2.csv",
            "type": "CSV",
            "module": "A2",
            "title": "Multi-Modal Inbound Logistics Manifest (Module A2)",
            "description": "Multi-modal supply chain legs: Sea shipping (6,200 km), Freight rail (900 km), and Heavy lorry (450 km) linked to suppliers.",
            "url": "/api/documents/samples/06_multimodal_inbound_logistics_manifest_A2.csv",
            "stages": ["A2"]
        },
        {
            "filename": "07_jobsite_installation_and_rigging_A4_A5.xlsx",
            "type": "Excel (XLSX)",
            "module": "A4/A5",
            "title": "Job Site Installation, Crane Rigging & Commissioning (A4/A5)",
            "description": "Outbound transit (750 km), 50-ton hydraulic mobile crane diesel (37.8 L), commissioning electricity (350 kWh), and test loss (0.5 kg).",
            "url": "/api/documents/samples/07_jobsite_installation_and_rigging_A4_A5.xlsx",
            "stages": ["A4", "A5"]
        },
        {
            "filename": "08_operational_use_and_maintenance_B1_to_B7.csv",
            "type": "CSV",
            "module": "B1-B7",
            "title": "Operational Life & Maintenance Schedule (Modules B1–B7)",
            "description": "R134a/R1233zd refrigerant fugitive leakage (B1), synthetic POE lubricant lube cycles (B2), AHRI 550/590 part-load kW/ton (B6), and cooling tower water (B7).",
            "url": "/api/documents/samples/08_operational_use_and_maintenance_B1_to_B7.csv",
            "stages": ["B1", "B2", "B3", "B4", "B6", "B7"]
        },
        {
            "filename": "09_end_of_life_and_circularity_C1_to_D.json",
            "type": "JSON",
            "module": "C1-C4 & D",
            "title": "End of Life Deconstruction & Circularity Recovery (C & D)",
            "description": "Deconstruction electricity (120 kWh), scrap transport (100 km), 92.4% metal recycling sorting, and Module D virgin steel/copper displacement credits.",
            "url": "/api/documents/samples/09_end_of_life_and_circularity_C1_to_D.json",
            "stages": ["C1", "C2", "C3", "C4", "D"]
        },
        {
            "filename": "11_water_cooled_centrifugal_multitab_master.xlsx",
            "type": "Excel (XLSX)",
            "module": "Full (A1-D)",
            "title": "Master Multi-Tab Chiller Engineering Workbook (Cradle-to-Grave)",
            "description": "Complete multi-tab workbook with BOM (A1), Freight (A2), Utilities (A3), Rigging (A4/A5), Operations (B), and Recycling (C/D) sheets.",
            "url": "/api/documents/samples/11_water_cooled_centrifugal_multitab_master.xlsx",
            "stages": ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B6", "B7", "C1", "C2", "C3", "C4", "D"]
        },
        {
            "filename": "10_complete_enterprise_chiller_package.zip",
            "type": "ZIP Archive",
            "module": "Full Suite",
            "title": "Complete Enterprise Chiller Documentation Package (.zip)",
            "description": "Multi-file engineering archive bundling BOM, logistics manifest, utility summary, AHRI test report, and rigging cut sheets.",
            "url": "/api/documents/samples/10_complete_enterprise_chiller_package.zip",
            "stages": ["A1", "A2", "A3", "A4", "A5", "B1-B7", "C1-C4", "D"]
        },
        {
            "filename": "sample_chiller_spec.pdf",
            "type": "PDF",
            "module": "A1/B1",
            "title": "Technical Specification PDF (Carrier AquaEdge Cutsheet)",
            "description": "Vector PDF with technical specs, nameplate data, R134a refrigerant charge, and 8-component parts list.",
            "url": "/api/documents/samples/sample_chiller_spec.pdf",
            "stages": ["A1", "A3", "B1"]
        },
        {
            "filename": "sample_chiller_bom.xlsx",
            "type": "Excel (XLSX)",
            "module": "A1",
            "title": "Standard Bill of Materials Spreadsheet (.xlsx)",
            "description": "Tabular BOM with component description, material classification, mass (kg), and Tier-1 suppliers.",
            "url": "/api/documents/samples/sample_chiller_bom.xlsx",
            "stages": ["A1"]
        },
        {
            "filename": "sample_chiller_bom.csv",
            "type": "CSV",
            "module": "A1",
            "title": "Standard Bill of Materials (.csv)",
            "description": "Comma-separated parts list ready for instant table parsing and ecoinvent activity matching.",
            "url": "/api/documents/samples/sample_chiller_bom.csv",
            "stages": ["A1"]
        }
    ]
    return {"samples": samples}

@router.get("/samples/{filename}")
def get_sample_file(filename: str):
    safe_filename = os.path.basename(filename)
    # Check in SAMPLES_DIR first, then TEST_DIR
    file_path = os.path.join(SAMPLES_DIR, safe_filename)
    if not os.path.isfile(file_path):
        file_path = os.path.join(TEST_DIR, safe_filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Sample file not found")
    
    media_types = {
        ".pdf": "application/pdf",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xls": "application/vnd.ms-excel",
        ".csv": "text/csv",
        ".json": "application/json",
        ".zip": "application/zip",
        ".txt": "text/plain"
    }
    _, ext = os.path.splitext(safe_filename)
    return FileResponse(file_path, media_type=media_types.get(ext.lower(), "application/octet-stream"), filename=safe_filename)

@router.post("/load-sample/{filename}")
def load_sample_file(filename: str):
    """Parses a sample test file and returns live extracted data and PCR gap analysis."""
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(SAMPLES_DIR, safe_filename)
    if not os.path.isfile(file_path):
        file_path = os.path.join(TEST_DIR, safe_filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Sample file not found")
    
    with open(file_path, "rb") as f:
        contents = f.read()

    extracted = json.loads(json.dumps(EMPTY_EXTRACTION_TEMPLATE))
    processed_files = []
    process_file_content(safe_filename, contents, extracted, processed_files)

    gaps = analyze_pcr_gaps(extracted, processed_files)
    flow = build_traceability_flow(extracted, processed_files)

    return {
        "extracted": extracted,
        "gaps": gaps,
        "traceability_flow": flow,
        "processed_files": processed_files,
        "filename": safe_filename
    }


SAMPLE_BOM_DATA = {
    "project_info": {
        "product_name": "EcoMetric Centrifugal Chiller 500RT",
        "manufacturer_name": "EcoMetric Thermal Systems Inc.",
        "functional_unit": "1 unit of HVAC water-cooled chiller over 25 years reference service life",
        "declared_unit": "1 piece of 500 RT chiller",
        "pcr_ref": "UL 10010-4 Part B v2.0 & EN 15804+A2",
        "geography": "US-Midwest",
        "lifespan_years": 25
    },
    "bom": [
        { "id": "bom-1", "name": "Compressor Shell & Frame", "material": "steel_hot_rolled", "mass": 2100, "unit": "kg", "ecoinvent_id": "ecoinvent_steel_hot_rolled_glo", "supplier": "Midwest Steel Casting", "transport_km": 420 },
        { "id": "bom-2", "name": "Condenser & Evaporator Tubes", "material": "copper_tube_wire", "mass": 650, "unit": "kg", "ecoinvent_id": "ecoinvent_copper_tube_wire_glo", "supplier": "Great Lakes Copper Corp", "transport_km": 280 },
        { "id": "bom-3", "name": "Semi-Hermetic Induction Motor", "material": "electric_motor_industrial", "mass": 450, "unit": "kg", "ecoinvent_id": "ecoinvent_electric_motor_industrial_glo", "supplier": "Precision ElectroMotors Ltd", "transport_km": 650 },
        { "id": "bom-4", "name": "Thermal Insulation Jackets", "material": "insulation_polyurethane_rigid", "mass": 150, "unit": "kg", "ecoinvent_id": "ecoinvent_insulation_pu_rigid_rer", "supplier": "PolyFoam Systems", "transport_km": 190 },
        { "id": "bom-5", "name": "VFD & Solid-State Starter", "material": "electronics_vfd", "mass": 120, "unit": "kg", "ecoinvent_id": "ecoinvent_electronics_vfd_glo", "supplier": "Advantech Power Systems", "transport_km": 890 }
    ],
    "manufacturing": {
        "annual_facility_kwh": 34000,
        "natural_gas_mj": 18500,
        "grid_region": "US_Average",
        "water_m3": 45.0
    },
    "transport": [
        { "mode": "Heavy Lorry >32t (EURO 6)", "distance": 485, "dist": 485, "emission_factor": 0.088, "ef": 0.088, "module": "A2" },
        { "mode": "Transoceanic Container Ship", "distance": 1200, "dist": 1200, "emission_factor": 0.0145, "ef": 0.0145, "module": "A2" },
        { "mode": "Heavy Delivery Lorry >32t to Customer Site", "distance": 500, "dist": 500, "emission_factor": 0.088, "ef": 0.088, "module": "A4" }
    ],
    "installation": {
        "outbound_transport_km": 500,
        "transport_mode": "Heavy Lorry >32t (EURO 6)",
        "installation_energy_kwh": 350,
        "commissioning_refrigerant_loss_kg": 0.5,
        "rigging_crane_diesel_liters": 25.0
    },
    "operational": {
        "refrigerant_type": "R134a",
        "refrigerant_charge_kg": 45.0,
        "annual_leak_rate_percent": 2.0,
        "fugitive_operational_leak_rate": 0.5,
        "efficiency_kw_per_ton": 0.54,
        "capacity_rt": 500.0,
        "target_cities": ["Chicago", "Houston", "Frankfurt", "Dubai"],
        "cooling_tower_water_m3_yr": 120.0,
        "scheduled_maintenance_kwh_yr": 180.0,
        "major_component_replacement_year": 15
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

EMPTY_EXTRACTION_TEMPLATE = {
    "project_info": {
        "product_name": "Uploaded Equipment Model",
        "manufacturer_name": "Declared Manufacturer",
        "functional_unit": "1 unit over declared reference service life",
        "declared_unit": "1 piece",
        "pcr_ref": "UL 10010-4 Part B v2.0 & EN 15804+A2",
        "geography": "Global",
        "lifespan_years": 25
    },
    "bom": [],
    "manufacturing": {
        "annual_facility_kwh": 0,
        "natural_gas_mj": 0,
        "grid_region": "US_Average",
        "water_m3": 0
    },
    "transport": [],
    "installation": {
        "outbound_transport_km": 0,
        "transport_mode": "Heavy Lorry >32t (EURO 6)",
        "installation_energy_kwh": 0,
        "commissioning_refrigerant_loss_kg": 0,
        "rigging_crane_diesel_liters": 0
    },
    "operational": {
        "refrigerant_type": "",
        "refrigerant_charge_kg": 0,
        "annual_leak_rate_percent": 0,
        "fugitive_operational_leak_rate": 0,
        "efficiency_kw_per_ton": 0,
        "capacity_rt": 0,
        "target_cities": [],
        "cooling_tower_water_m3_yr": 0,
        "scheduled_maintenance_kwh_yr": 0,
        "major_component_replacement_year": 0
    },
    "end_of_life": {
        "recycling_rate_percent": 0,
        "landfill_rate_percent": 0,
        "incineration_rate_percent": 0,
        "decommissioning_energy_kwh": 0,
        "waste_transport_km": 0
    },
    "circularity_d": {
        "steel_scrap_recovery_rate": 0,
        "copper_scrap_recovery_rate": 0,
        "aluminium_recovery_rate": 0,
        "refrigerant_reclamation_rate": 0,
        "net_avoided_burden_gwp_kg": 0
    }
}


def analyze_pcr_gaps(extracted: Dict[str, Any], file_names: List[str]) -> List[Dict[str, Any]]:
    """
    Audits extracted data against UL 10010-4 and ISO 14025 mandatory declarations.
    Generates actionable missing data gap reports with guidance.
    """
    gaps = []
    bom = extracted.get("bom", [])
    total_mass = sum(float(item.get("mass", 0)) for item in bom)
    
    # Gap 1: Total BOM Mass check (ISO 14025 Cut-off gate)
    if extracted.get("_bom_synthesized"):
        gaps.append({
            "id": "notice-bom-synthesized",
            "module": "A1",
            "category": "Bill of Materials",
            "severity": "medium",
            "title": "BOM Baseline Synthesized from Declared Weight",
            "message": f"Source document declared equipment shipping weight of {extracted.get('_shipping_weight_kg', 40428):,.0f} kg without component-level breakdown. Baseline bill of materials was synthesized using UL 10010-4 / AHRI standard industrial chiller material distribution.",
            "action": "Upload engineering BOM export (XLSX/CSV) if Tier-1 primary components are available."
        })
    elif total_mass < 50:
        gaps.append({
            "id": "gap-bom-mass",
            "module": "A1",
            "category": "Bill of Materials",
            "severity": "critical",
            "title": "BOM Mass Under-Declared",
            "message": f"Extracted BOM total mass is only {total_mass} kg. Heavy equipment requires full component declaration to meet the 99% mass cut-off rule.",
            "action": "Upload comprehensive assembly BOM or engineering parts list."
        })
    
    # Gap 2: Inbound Transport Distance (A2 Module)
    missing_transport = [item["name"] for item in bom if not item.get("transport_km") or float(item.get("transport_km", 0)) <= 0]
    if missing_transport:
        gaps.append({
            "id": "gap-transport-a2",
            "module": "A2",
            "category": "Logistics Manifest",
            "severity": "high",
            "title": f"Missing Inbound Freight Distances ({len(missing_transport)} items)",
            "message": f"Inbound freight distances are missing for: {', '.join(missing_transport[:3])}{'...' if len(missing_transport) > 3 else ''}.",
            "action": "Upload Tier-1 supplier freight manifest or use default regional logistics proxy (500 km)."
        })
        
    # Gap 3: Manufacturing Facility Energy (A3 Module)
    mfg = extracted.get("manufacturing", {})
    if not mfg.get("annual_facility_kwh") and not mfg.get("electricity_kwh"):
        gaps.append({
            "id": "gap-energy-a3",
            "module": "A3",
            "category": "Factory Utility Bills",
            "severity": "high",
            "title": "Missing Assembly Facility Electricity (A3)",
            "message": "Specific kWh consumption allocated to product manufacturing was not detected.",
            "action": "Upload recent utility electricity bill or sub-metered energy report."
        })
        
    # Gap 4: Refrigerant Charge & Leak Rate (B1-B2 Modules for Chiller PCR)
    op = extracted.get("operational", {})
    if not op.get("refrigerant_charge_kg") or float(op.get("refrigerant_charge_kg", 0)) <= 0:
        gaps.append({
            "id": "gap-refrigerant-b1",
            "module": "B1-B2",
            "category": "Refrigeration Specs",
            "severity": "critical",
            "title": "Refrigerant Charge Missing",
            "message": "UL 10010-4 Part B explicitly requires initial factory refrigerant charge (kg) and annual fugitive leakage rate.",
            "action": "Specify refrigerant type and factory charge on equipment nameplate."
        })
        
    # Gap 5: Reference Service Life (RSL)
    proj = extracted.get("project_info", {})
    if not proj.get("lifespan_years"):
        gaps.append({
            "id": "gap-rsl",
            "module": "Scope",
            "category": "PCR Scoping",
            "severity": "medium",
            "title": "Reference Service Life (RSL) Unconfirmed",
            "message": "Defaulting to 25 years per UL 10010-4 benchmark. Please confirm manufacturer warranty lifetime.",
            "action": "Confirm equipment design lifetime (typically 20-30 years)."
        })
        
    return gaps

def build_traceability_flow(extracted: Dict[str, Any], file_names: List[str]) -> Dict[str, Any]:
    """
    Builds a dynamic interactive graph showing which file fed which parameter into which lifecycle stage.
    """
    primary_file = file_names[0] if file_names else "Uploaded_Document"
    nodes = [
        { "id": "doc-1", "type": "document", "label": primary_file, "desc": "Ingested Source Document" }
    ]
    edges = []

    bom = extracted.get("bom", [])
    if bom:
        nodes.append({ "id": "stage-a1", "type": "stage", "label": "Module A1: Raw Materials" })
        for i, item in enumerate(bom[:4]):
            p_id = f"param-bom-{i}"
            nodes.append({
                "id": p_id,
                "type": "parameter",
                "label": f"{item.get('name', 'Component')} ({item.get('mass', 0)} kg)",
                "module": "A1"
            })
            edges.append({ "from": "doc-1", "to": p_id })
            edges.append({ "from": p_id, "to": "stage-a1" })

    transport = extracted.get("transport", [])
    if transport:
        nodes.append({ "id": "stage-a2", "type": "stage", "label": "Module A2: Transport" })
        for i, leg in enumerate(transport[:2]):
            p_id = f"param-tr-{i}"
            nodes.append({
                "id": p_id,
                "type": "parameter",
                "label": f"{leg.get('mode', 'Freight')} ({leg.get('distance', 0)} km)",
                "module": "A2"
            })
            edges.append({ "from": "doc-1", "to": p_id })
            edges.append({ "from": p_id, "to": "stage-a2" })

    mfg = extracted.get("manufacturing", {})
    kwh = float(mfg.get("annual_facility_kwh", 0) or mfg.get("electricity_kwh", 0))
    if kwh > 0:
        nodes.append({ "id": "stage-a3", "type": "stage", "label": "Module A3: Manufacturing" })
        nodes.append({
            "id": "param-elec",
            "type": "parameter",
            "label": f"Facility Electricity ({kwh:,.0f} kWh)",
            "module": "A3"
        })
        edges.append({ "from": "doc-1", "to": "param-elec" })
        edges.append({ "from": "param-elec", "to": "stage-a3" })

    op = extracted.get("operational", {})
    ref_type = op.get("refrigerant_type")
    charge = float(op.get("refrigerant_charge_kg", 0))
    if ref_type or charge > 0:
        nodes.append({ "id": "stage-b", "type": "stage", "label": "Module B: Operational Use" })
        nodes.append({
            "id": "param-ref",
            "type": "parameter",
            "label": f"{ref_type or 'Refrigerant'} ({charge:,.1f} kg)",
            "module": "B1-B2"
        })
        edges.append({ "from": "doc-1", "to": "param-ref" })
        edges.append({ "from": "param-ref", "to": "stage-b" })

    return { "nodes": nodes, "edges": edges }

@router.get("/sample-bom")
def get_sample_bom():
    """Returns a realistic, verified sample BOM ready for testing."""
    return SAMPLE_BOM_DATA

@router.get("/factors")
def search_factors(query: str = "", category: Optional[str] = None):
    """Searches the curated ecoinvent seed database."""
    return search_ecoinvent_activities(query=query, category=category)

def process_file_content(filename: str, contents: bytes, extracted: Dict[str, Any], processed_files: List[str]):
    fname = (filename or "").lower()
    
    # ZIP extraction (handles multi-file nested packages)
    if fname.endswith(".zip"):
        try:
            with zipfile.ZipFile(io.BytesIO(contents)) as z:
                for info in z.infolist():
                    if info.is_dir():
                        continue
                    base_n = os.path.basename(info.filename)
                    # Ignore macOS metadata or hidden files
                    if base_n.startswith(".") or base_n.startswith("__"):
                        continue
                    sub_contents = z.read(info.filename)
                    process_file_content(base_n, sub_contents, extracted, processed_files)
        except Exception as e:
            print(f"[Documents Router] Error extracting ZIP {filename}: {e}")
        return

    processed_files.append(filename)

    # PDF parsing via local pdfplumber
    if fname.endswith(".pdf"):
        try:
            pdf_res = extract_pdf_data(contents)
            if pdf_res.get("bom"):
                extracted["bom"].extend(pdf_res["bom"])
            if pdf_res.get("project_info"):
                extracted["project_info"].update(pdf_res["project_info"])
            if pdf_res.get("operational"):
                extracted["operational"].update(pdf_res["operational"])
            if pdf_res.get("manufacturing"):
                extracted["manufacturing"].update(pdf_res["manufacturing"])
            if pdf_res.get("_shipping_weight_kg"):
                extracted["_shipping_weight_kg"] = pdf_res["_shipping_weight_kg"]
        except Exception as e:
            print(f"[Documents Router] Error parsing PDF {filename}: {e}")

    # Excel parsing via openpyxl
    elif fname.endswith((".xlsx", ".xls")):
        try:
            excel_res = extract_excel_data(contents)
            if excel_res.get("bom"):
                extracted["bom"].extend(excel_res["bom"])
            if excel_res.get("transport"):
                extracted.setdefault("transport", []).extend(excel_res["transport"])
            if excel_res.get("manufacturing"):
                extracted.setdefault("manufacturing", {}).update(excel_res["manufacturing"])
            if excel_res.get("installation"):
                extracted.setdefault("installation", {}).update(excel_res["installation"])
            if excel_res.get("operational"):
                extracted.setdefault("operational", {}).update(excel_res["operational"])
            if excel_res.get("end_of_life"):
                extracted.setdefault("end_of_life", {}).update(excel_res["end_of_life"])
            if excel_res.get("circularity_d"):
                extracted.setdefault("circularity_d", {}).update(excel_res["circularity_d"])
            if excel_res.get("project_info"):
                extracted.setdefault("project_info", {}).update(excel_res["project_info"])
            if excel_res.get("maintenance_b2"):
                extracted.setdefault("maintenance_b2", {}).update(excel_res["maintenance_b2"])
        except Exception as e:
            print(f"[Documents Router] Error parsing Excel {filename}: {e}")

    # CSV / TXT parsing (Intelligent routing for utility summaries, freight manifests, test reports, or BOMs)
    elif fname.endswith((".csv", ".txt", ".tsv")):
        try:
            try:
                decoded = contents.decode("utf-8-sig")
            except UnicodeDecodeError:
                decoded = contents.decode("latin-1", errors="replace")
                
            detected_type = parse_messy_csv(decoded, filename, extracted)
            if detected_type == "unknown":
                # Fallback: standard BOM CSV
                reader = csv.DictReader(io.StringIO(decoded))
                custom_bom = []
                base_idx = len(extracted.get("bom", []))
                for idx, row in enumerate(reader):
                    row_clean = {str(k).strip().lower(): v for k, v in row.items() if k}
                    name = row_clean.get("name") or row_clean.get("component") or row_clean.get("part") or f"Part {base_idx+idx+1}"
                    raw_mass = row_clean.get("mass") or row_clean.get("weight") or row_clean.get("mass_kg")
                    mass = clean_decimal_number(raw_mass) or 10.0
                    mat = row_clean.get("material") or "steel_hot_rolled"
                    km = clean_decimal_number(row_clean.get("transport_km") or row_clean.get("distance_km") or 0.0) or 0.0
                    custom_bom.append({
                        "id": f"bom-upload-{base_idx+idx+1}",
                        "name": name,
                        "material": mat,
                        "mass": mass,
                        "unit": "kg",
                        "ecoinvent_id": f"ecoinvent_{mat}_glo",
                        "supplier": row_clean.get("supplier") or "Declared Supplier",
                        "transport_km": km
                    })
                if custom_bom:
                    extracted["bom"].extend(custom_bom)
        except Exception as e:
            print(f"[Documents Router] Error parsing CSV {filename}: {e}")

    # JSON parsing (handles standard schemas and messy customer keys)
    elif fname.endswith(".json"):
        try:
            parsed = json.loads(contents.decode("utf-8"))
            if isinstance(parsed, dict):
                if "bom" in parsed and isinstance(parsed["bom"], list):
                    extracted["bom"].extend(parsed["bom"])
                if "transport" in parsed and isinstance(parsed["transport"], list):
                    extracted["transport"].extend(parsed["transport"])
                if "manufacturing" in parsed and isinstance(parsed["manufacturing"], dict):
                    extracted["manufacturing"].update(parsed["manufacturing"])
                if "installation" in parsed and isinstance(parsed["installation"], dict):
                    extracted["installation"].update(parsed["installation"])
                if "operational" in parsed and isinstance(parsed["operational"], dict):
                    extracted["operational"].update(parsed["operational"])
                if "end_of_life" in parsed and isinstance(parsed["end_of_life"], dict):
                    extracted["end_of_life"].update(parsed["end_of_life"])
                if "circularity_d" in parsed and isinstance(parsed["circularity_d"], dict):
                    extracted["circularity_d"].update(parsed["circularity_d"])
                if "project_info" in parsed and isinstance(parsed["project_info"], dict):
                    extracted["project_info"].update(parsed["project_info"])
                
                # Flexible parser for customer key variants
                parse_flexible_json(parsed, extracted)
        except Exception as e:
            print(f"[Documents Router] Error parsing JSON {filename}: {e}")

@router.post("/upload")
async def upload_and_extract_documents(
    files: List[UploadFile] = File(...),
    custom_notes: Optional[str] = Form(None)
):
    """
    Parses uploaded files (ZIP archives, CSV, JSON, Excel, PDF), performs PCR gap analysis,
    and returns structured LCA input data with the traceability graph.
    """
    extracted = json.loads(json.dumps(EMPTY_EXTRACTION_TEMPLATE))
    processed_files: List[str] = []
    
    # Process uploaded files (unpacking any ZIP files recursively)
    for file in files:
        contents = await file.read()
        process_file_content(file.filename or "upload", contents, extracted, processed_files)
    
    # Intelligent baseline BOM synthesis if brochure/JSON lacked raw BOM table but declared equipment mass
    if len(extracted.get("bom", [])) == 0:
        declared_weight = extracted.get("_shipping_weight_kg", 0.0)
        if declared_weight <= 0 and extracted.get("operational", {}).get("capacity_rt", 0) > 0:
            cap = extracted["operational"]["capacity_rt"]
            declared_weight = round(cap * 20.214, 1)  # ~40,428 kg for 2000 TR water-cooled centrifugal
        if declared_weight > 0:
            extracted["bom"] = synthesize_bom_from_declared_weight(declared_weight)
            extracted["_shipping_weight_kg"] = declared_weight
            extracted["_bom_synthesized"] = True

    # Deduplicate IDs in extracted BOM if needed
    seen_ids = set()
    deduped_bom = []
    for i, item in enumerate(extracted.get("bom", [])):
        item_id = item.get("id") or f"bom-item-{i+1}"
        if item_id in seen_ids:
            item_id = f"{item_id}-{i+1}"
        seen_ids.add(item_id)
        item_copy = dict(item)
        item_copy["id"] = item_id
        deduped_bom.append(item_copy)
    extracted["bom"] = deduped_bom

    gaps = analyze_pcr_gaps(extracted, processed_files)
    traceability = build_traceability_flow(extracted, processed_files)
    
    return {
        "status": "success",
        "files_processed": processed_files,
        "extracted": extracted,
        "gaps": gaps,
        "gap_count": len(gaps),
        "critical_gaps": len([g for g in gaps if g.get("severity") == "critical"]),
        "traceability_flow": traceability
    }

@router.post("/validate")
def validate_documents_data(payload: Dict[str, Any] = None):
    """Audits extracted documents data against PCR and GPI criteria."""
    from ..engines.pcr_validation import validate_epd_compliance
    return validate_epd_compliance(payload or {})


# ---------------------------------------------------------------------------
# LCIA Excel Extractor & EPD Calculation API Endpoints
# ---------------------------------------------------------------------------
import sys
from pathlib import Path
root_dir = str(Path(__file__).resolve().parent.parent.parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    import lcia_extractor
except ImportError:
    lcia_extractor = None

@router.get("/lcia-methodologies")
def get_lcia_methodologies():
    """Returns the list of all 41 LCIA methodologies available in the Excel dataset."""
    if not lcia_extractor:
        raise HTTPException(status_code=500, detail="lcia_extractor module not available")
    data = lcia_extractor.get_lcia_data()
    methods = lcia_extractor.get_available_methods(data)
    return {"status": "success", "count": len(methods), "methodologies": methods}

@router.get("/lcia-search")
def search_lcia_products(query: str = "", limit: int = 200):
    """Searches for products / activities in the ecoinvent LCIA Excel file with intelligent ranking."""
    if not query.strip():
        return {"status": "success", "query": query, "count": 0, "results": []}
    if not lcia_extractor:
        raise HTTPException(status_code=500, detail="lcia_extractor module not available")
    
    data = lcia_extractor.get_lcia_data()
    matches = lcia_extractor.search_product(data, query.strip())
    
    results = []
    for idx, row in matches.head(limit).iterrows():
        ref_unit = ""
        try:
            if "Reference Product Unit" in row:
                ref_unit = str(row["Reference Product Unit"])
        except Exception:
            ref_unit = "kg"
        results.append({
            "option_number": idx,
            "row_index": int(row["index"]),
            "activity_name": str(row["Activity Name"]),
            "geography": str(row["Geography"]),
            "reference_product_name": str(row["Reference Product Name"]),
            "reference_unit": ref_unit or "kg",
        })
    
    return {
        "status": "success",
        "query": query,
        "count": len(matches),
        "results": results
    }

@router.post("/lcia-calculate")
def calculate_lcia_epd(payload: Dict[str, Any]):
    """
    Runs lcia_extractor calculation for a selected row_index and methodology.
    """
    row_index = payload.get("row_index")
    methodology = payload.get("methodology")
    
    if row_index is None:
        raise HTTPException(status_code=400, detail="row_index is required")
    if not lcia_extractor:
        raise HTTPException(status_code=500, detail="lcia_extractor module not available")
    
    data = lcia_extractor.get_lcia_data()
    if row_index < 0 or row_index >= len(data):
        raise HTTPException(status_code=400, detail=f"Invalid row_index {row_index}")
    
    res = lcia_extractor.extract_lcia_results_dict(data, int(row_index), methodology or None)
    return {
        "status": "success",
        "result": res
    }

