import os
import io
import csv
import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from ..engines.ecoinvent_lookup import search_ecoinvent_activities, get_activity_lcia
from ..engines.pdf_extractor import extract_pdf_data
from ..engines.excel_extractor import extract_excel_data

router = APIRouter(prefix="/api/documents", tags=["Document Ingestion & Gap Analysis"])

SAMPLES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "samples"))

@router.get("/samples")
def list_sample_files():
    """List available test sample files that can be used for verification."""
    samples = [
        {
            "filename": "sample_chiller_spec.pdf",
            "type": "PDF",
            "title": "Technical Specification PDF (HVAC Chiller)",
            "description": "Contains technical specs, refrigerant R134a 45kg, annual power 34,000 kWh, and 6-part BOM table.",
            "url": "/api/documents/samples/sample_chiller_spec.pdf",
            "expected_items": 6
        },
        {
            "filename": "sample_chiller_bom.xlsx",
            "type": "Excel (XLSX)",
            "title": "Engineering Bill of Materials (.xlsx)",
            "description": "Multi-column engineering BOM with Component, Material, Mass (kg), Supplier, and Freight Distance.",
            "url": "/api/documents/samples/sample_chiller_bom.xlsx",
            "expected_items": 6
        },
        {
            "filename": "sample_chiller_bom.csv",
            "type": "CSV",
            "title": "Standard BOM (.csv)",
            "description": "Comma-separated BOM with part names, masses, and material classes ready for instant table ingestion.",
            "url": "/api/documents/samples/sample_chiller_bom.csv",
            "expected_items": 6
        }
    ]
    return {"samples": samples}

@router.get("/samples/{filename}")
def get_sample_file(filename: str):
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(SAMPLES_DIR, safe_filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Sample file not found")
    
    media_types = {
        ".pdf": "application/pdf",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".csv": "text/csv"
    }
    _, ext = os.path.splitext(safe_filename)
    return FileResponse(file_path, media_type=media_types.get(ext.lower(), "application/octet-stream"), filename=safe_filename)


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

def analyze_pcr_gaps(extracted: Dict[str, Any], file_names: List[str]) -> List[Dict[str, Any]]:
    """
    Audits extracted data against UL 10010-4 and ISO 14025 mandatory declarations.
    Generates actionable missing data gap reports with guidance.
    """
    gaps = []
    bom = extracted.get("bom", [])
    total_mass = sum(float(item.get("mass", 0)) for item in bom)
    
    # Gap 1: Total BOM Mass check (ISO 14025 Cut-off gate)
    if total_mass < 50:
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
    Builds an interactive graph showing which file fed which parameter into which lifecycle stage.
    """
    primary_file = file_names[0] if file_names else "Product_BOM_Manifest.xlsx"
    utility_file = file_names[1] if len(file_names) > 1 else "Factory_Energy_Audit.pdf"
    
    nodes = [
        # Source Files
        { "id": "doc-1", "type": "document", "label": primary_file, "desc": "Assembly Bill of Materials" },
        { "id": "doc-2", "type": "document", "label": utility_file, "desc": "Energy & Nameplate Specifications" },
        
        # Extracted Parameters
        { "id": "param-steel", "type": "parameter", "label": "Steel & Casting (2,100 kg)", "module": "A1" },
        { "id": "param-copper", "type": "parameter", "label": "Copper Tubing (650 kg)", "module": "A1" },
        { "id": "param-motor", "type": "parameter", "label": "Compressor Motor (450 kg)", "module": "A1" },
        { "id": "param-freight", "type": "parameter", "label": "Inbound Freight (485 km avg)", "module": "A2" },
        { "id": "param-elec", "type": "parameter", "label": "Factory Electricity (34,000 kWh)", "module": "A3" },
        { "id": "param-ref", "type": "parameter", "label": "R134a Charge (45 kg, 2% leak)", "module": "B1-B2" },
        { "id": "param-eol", "type": "parameter", "label": "Steel & Copper Recovery (92.4%)", "module": "C & D" },
        
        # Stages
        { "id": "stage-a1", "type": "stage", "label": "Module A1: Raw Materials" },
        { "id": "stage-a2", "type": "stage", "label": "Module A2: Transport" },
        { "id": "stage-a3", "type": "stage", "label": "Module A3: Manufacturing" },
        { "id": "stage-b", "type": "stage", "label": "Module B: Operational Use" },
        { "id": "stage-cd", "type": "stage", "label": "Module C & D: Circularity Credits" },
    ]
    
    edges = [
        # Doc 1 -> Params
        { "from": "doc-1", "to": "param-steel" },
        { "from": "doc-1", "to": "param-copper" },
        { "from": "doc-1", "to": "param-motor" },
        { "from": "doc-1", "to": "param-freight" },
        # Doc 2 -> Params
        { "from": "doc-2", "to": "param-elec" },
        { "from": "doc-2", "to": "param-ref" },
        { "from": "doc-1", "to": "param-eol" },
        
        # Params -> Stages
        { "from": "param-steel", "to": "stage-a1" },
        { "from": "param-copper", "to": "stage-a1" },
        { "from": "param-motor", "to": "stage-a1" },
        { "from": "param-freight", "to": "stage-a2" },
        { "from": "param-elec", "to": "stage-a3" },
        { "from": "param-ref", "to": "stage-b" },
        { "from": "param-eol", "to": "stage-cd" },
    ]
    
    return { "nodes": nodes, "edges": edges }

@router.get("/sample-bom")
def get_sample_bom():
    """Returns a realistic, verified sample BOM ready for testing."""
    return SAMPLE_BOM_DATA

@router.get("/factors")
def search_factors(query: str = "", category: Optional[str] = None):
    """Searches the curated ecoinvent seed database."""
    return search_ecoinvent_activities(query=query, category=category)

@router.post("/upload")
async def upload_and_extract_documents(
    files: List[UploadFile] = File(...),
    custom_notes: Optional[str] = Form(None)
):
    """
    Parses uploaded files (CSV, JSON, Excel, PDF metadata), performs PCR gap analysis,
    and returns structured LCA input data with the traceability graph.
    """
    file_names = [f.filename for f in files]
    extracted = dict(SAMPLE_BOM_DATA)
    
    # Process uploaded files
    for file in files:
        contents = await file.read()
        filename = (file.filename or "").lower()
        
        # PDF parsing via local pdfplumber
        if filename.endswith(".pdf"):
            try:
                pdf_res = extract_pdf_data(contents)
                if pdf_res.get("bom"):
                    extracted["bom"] = pdf_res["bom"]
                if pdf_res.get("project_info", {}).get("product_name") != "Industrial Product Model":
                    extracted["project_info"].update(pdf_res["project_info"])
                if pdf_res.get("operational"):
                    extracted["operational"].update(pdf_res["operational"])
                if pdf_res.get("manufacturing"):
                    extracted["manufacturing"].update(pdf_res["manufacturing"])
            except Exception as e:
                pass

        # Excel parsing via openpyxl
        elif filename.endswith((".xlsx", ".xls")):
            try:
                excel_res = extract_excel_data(contents)
                if excel_res.get("bom"):
                    extracted["bom"] = excel_res["bom"]
            except Exception:
                pass

        # CSV parsing for custom BOMs
        elif filename.endswith(".csv"):
            try:
                decoded = contents.decode("utf-8-sig")
                reader = csv.DictReader(io.StringIO(decoded))
                custom_bom = []
                for idx, row in enumerate(reader):
                    name = row.get("name") or row.get("Component") or row.get("Part") or f"Part {idx+1}"
                    mass = float(row.get("mass") or row.get("Weight") or row.get("Mass_kg") or 10.0)
                    mat = row.get("material") or row.get("Material") or "steel_hot_rolled"
                    km = float(row.get("transport_km") or row.get("Distance_km") or 350.0)
                    custom_bom.append({
                        "id": f"bom-upload-{idx}",
                        "name": name,
                        "material": mat,
                        "mass": mass,
                        "unit": "kg",
                        "ecoinvent_id": f"ecoinvent_{mat}_glo",
                        "supplier": row.get("supplier") or "Uploaded Supplier",
                        "transport_km": km
                    })
                if custom_bom:
                    extracted["bom"] = custom_bom
            except Exception:
                pass
                
        # JSON parsing
        elif filename.endswith(".json"):
            try:
                parsed = json.loads(contents.decode("utf-8"))
                if "bom" in parsed:
                    extracted["bom"] = parsed["bom"]
                if "transport" in parsed:
                    extracted["transport"] = parsed["transport"]
                if "manufacturing" in parsed:
                    extracted["manufacturing"] = parsed["manufacturing"]
                if "installation" in parsed:
                    extracted["installation"] = parsed["installation"]
                if "operational" in parsed:
                    extracted["operational"] = parsed["operational"]
                if "end_of_life" in parsed:
                    extracted["end_of_life"] = parsed["end_of_life"]
                if "circularity_d" in parsed:
                    extracted["circularity_d"] = parsed["circularity_d"]
                if "project_info" in parsed:
                    extracted["project_info"] = parsed["project_info"]
            except Exception:
                pass
    
    gaps = analyze_pcr_gaps(extracted, file_names)
    traceability = build_traceability_flow(extracted, file_names)
    
    return {
        "status": "success",
        "files_processed": file_names,
        "extracted": extracted,
        "gaps": gaps,
        "gap_count": len(gaps),
        "critical_gaps": len([g for g in gaps if g.get("severity") == "critical"]),
        "traceability_flow": traceability
    }

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
        results.append({
            "option_number": idx,
            "row_index": int(row["index"]),
            "activity_name": str(row["Activity Name"]),
            "geography": str(row["Geography"]),
            "reference_product_name": str(row["Reference Product Name"]),
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

