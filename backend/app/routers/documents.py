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
    clean_decimal_number,
    _parse_bom_rows,
)
from ..engines.material_matcher import assign_bom_providers, database_available, project_region
from ..products import get_product, is_chiller, normalize_product_id, project_info_defaults

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
def load_sample_file(filename: str, product_category: Optional[str] = None):
    """Parses a sample test file and returns live extracted data and PCR gap analysis."""
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(SAMPLES_DIR, safe_filename)
    if not os.path.isfile(file_path):
        file_path = os.path.join(TEST_DIR, safe_filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Sample file not found")
    
    with open(file_path, "rb") as f:
        contents = f.read()

    pid = normalize_product_id(product_category)
    extracted = build_extraction_template(pid)
    processed_files = []
    process_file_content(safe_filename, contents, extracted, processed_files)
    match_stats = finalize_extraction(extracted, pid)

    gaps = analyze_pcr_gaps(extracted, processed_files, pid, match_stats)
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
        { "id": "bom-1", "name": "Compressor Shell & Frame", "material": "steel_hot_rolled", "mass": 2100, "unit": "kg", "ecoinvent_id": "ecoinvent_row_15528", "supplier": "Midwest Steel Casting", "transport_km": 420 },
        { "id": "bom-2", "name": "Condenser & Evaporator Tubes", "material": "copper_tube_wire", "mass": 650, "unit": "kg", "ecoinvent_id": "ecoinvent_row_15830", "supplier": "Great Lakes Copper Corp", "transport_km": 280 },
        { "id": "bom-3", "name": "Semi-Hermetic Induction Motor", "material": "electric_motor_industrial", "mass": 450, "unit": "kg", "ecoinvent_id": "ecoinvent_row_16390", "supplier": "Precision ElectroMotors Ltd", "transport_km": 650 },
        { "id": "bom-4", "name": "Thermal Insulation Jackets", "material": "insulation_polyurethane_rigid", "mass": 150, "unit": "kg", "ecoinvent_id": "ecoinvent_row_17208", "supplier": "PolyFoam Systems", "transport_km": 190 },
        { "id": "bom-5", "name": "VFD & Solid-State Starter", "material": "electronics_vfd", "mass": 120, "unit": "kg", "ecoinvent_id": "ecoinvent_row_16422", "supplier": "Advantech Power Systems", "transport_km": 890 }
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
        "overall_recovery_rate_percent": 92.4,
        "virgin_material_provider_id": "ecoinvent_row_15528",
        "recycled_process_provider_id": "ecoinvent_row_15529"
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
        "overall_recovery_rate_percent": 0,
        "virgin_material_provider_id": "ecoinvent_row_15528",
        "recycled_process_provider_id": "ecoinvent_row_15529"
    }
}


CHILLER_ONLY_OPERATIONAL_KEYS = (
    "refrigerant_type", "refrigerant_charge_kg", "annual_leak_rate_percent", "fugitive_operational_leak_rate",
    "efficiency_kw_per_ton", "iplv_kw_per_ton", "capacity_rt", "target_cities", "cooling_tower_water_m3_yr",
)


def build_extraction_template(product_id: Optional[str]) -> Dict[str, Any]:
    """Empty extraction document carrying the selected product's PCR defaults."""
    product = get_product(product_id)
    template = json.loads(json.dumps(EMPTY_EXTRACTION_TEMPLATE))
    template["project_info"].update(project_info_defaults(product["id"]))
    template["project_info"]["product_name"] = f"Uploaded {product['name']}"
    template["project_info"]["fu_quantity"] = 1
    if not is_chiller(product["id"]):
        template["operational"] = {
            "annual_energy_kwh": 0,
            "annual_water_m3": 0,
            "use_phase_description": "",
        }
        template["installation"].pop("commissioning_refrigerant_loss_kg", None)
        template["circularity_d"] = {"overall_recovery_rate_percent": 0}
        template["technical_data"] = {f["key"]: "" for f in product["technical_fields"]}
    return template


def finalize_extraction(extracted: Dict[str, Any], product_id: Optional[str]) -> Dict[str, Any]:
    """Product-aware clean-up after all files are parsed; returns provider-matching stats."""
    pid = normalize_product_id(product_id)
    info = extracted.setdefault("project_info", {})
    # Extractors may overwrite PCR/FU text with chiller wording; the selected product decides.
    for key, val in project_info_defaults(pid).items():
        if key in ("lifespan_years", "building_esl_years") and info.get(key):
            continue
        info[key] = val

    if is_chiller(pid):
        # Brochure without a BOM table: synthesize a baseline from declared weight (chiller split only)
        if len(extracted.get("bom", [])) == 0:
            declared_weight = extracted.get("_shipping_weight_kg", 0.0)
            if declared_weight <= 0 and extracted.get("operational", {}).get("capacity_rt", 0) > 0:
                cap = extracted["operational"]["capacity_rt"]
                declared_weight = round(cap * 20.214, 1)  # ~40,428 kg for 2000 TR water-cooled centrifugal
            if declared_weight > 0:
                extracted["bom"] = synthesize_bom_from_declared_weight(declared_weight)
                extracted["_shipping_weight_kg"] = declared_weight
                extracted["_bom_synthesized"] = True
    else:
        # Chiller-specific values that generic extractors may have filled in (refrigerant, RT, kW/ton)
        op = extracted.setdefault("operational", {})
        for key in CHILLER_ONLY_OPERATIONAL_KEYS:
            op.pop(key, None)
        extracted.get("installation", {}).pop("commissioning_refrigerant_loss_kg", None)

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

    return assign_bom_providers(extracted["bom"], pid, project_region(extracted))


def analyze_pcr_gaps(extracted: Dict[str, Any], file_names: List[str],
                     product_id: Optional[str] = None, match_stats: Optional[Dict[str, int]] = None) -> List[Dict[str, Any]]:
    """
    Audits extracted data against the selected product's PCR and ISO 14025 declarations.
    Generates actionable missing data gap reports with guidance.
    """
    pid = normalize_product_id(product_id or (extracted.get("project_info") or {}).get("product_category"))
    product = get_product(pid)
    pcr_label = product["pcr"]["label"]
    gaps = []
    bom = extracted.get("bom", [])
    total_mass = sum(float(item.get("mass", 0) or 0) for item in bom)

    # Gap 1: BOM present (ISO 14025 / PCR cut-off gate)
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
    elif not bom or total_mass <= 0:
        gaps.append({
            "id": "gap-bom-mass",
            "module": "A1",
            "category": "Bill of Materials",
            "severity": "critical",
            "title": "No Bill of Materials Found",
            "message": f"No material lines with a mass were extracted for this {product['name']}. The PCR cut-off rules require the full material composition.",
            "action": "Upload a BOM / recipe table with columns such as Component, Material, Mass (kg)."
        })
    elif is_chiller(pid) and total_mass < 50:
        gaps.append({
            "id": "gap-bom-mass",
            "module": "A1",
            "category": "Bill of Materials",
            "severity": "critical",
            "title": "BOM Mass Under-Declared",
            "message": f"Extracted BOM total mass is only {total_mass} kg. Heavy equipment requires full component declaration to meet the cut-off rule.",
            "action": "Upload comprehensive assembly BOM or engineering parts list."
        })

    # Gap 2: Database match for each material
    unmatched = [item.get("name") or item.get("material") for item in bom if item.get("ecoinvent_matched") is False]
    if unmatched:
        gaps.append({
            "id": "gap-ecoinvent-match",
            "module": "A1",
            "category": "Emission Factors",
            "severity": "high",
            "title": f"No ecoinvent dataset found for {len(unmatched)} material(s)",
            "message": f"Could not match: {', '.join(str(u) for u in unmatched[:4])}{'...' if len(unmatched) > 4 else ''}.",
            "action": "Pick a dataset for these lines in Review & Mapping (search by material name)."
        })
    if bom and match_stats is not None and not database_available():
        gaps.append({
            "id": "gap-ecoinvent-db",
            "module": "A1",
            "category": "Emission Factors",
            "severity": "high",
            "title": "ecoinvent LCIA database not found",
            "message": "The Cut-off Cumulative LCIA workbook cache is not available on this server, so materials could not be matched by name.",
            "action": "Place 'Cut-off Cumulative LCIA v3.12.xlsx' (and its .cache.pkl) in a configured location or set ECOINVENT_LCIA_XLSX."
        })

    # Gap 3: Inbound transport distance (A2)
    missing_transport = [item.get("name") for item in bom if not item.get("transport_km") or float(item.get("transport_km", 0)) <= 0]
    if missing_transport and not extracted.get("transport"):
        gaps.append({
            "id": "gap-transport-a2",
            "module": "A2",
            "category": "Logistics Manifest",
            "severity": "high",
            "title": f"Missing Inbound Freight Distances ({len(missing_transport)} items)",
            "message": f"Inbound freight distances are missing for: {', '.join(str(m) for m in missing_transport[:3])}{'...' if len(missing_transport) > 3 else ''}.",
            "action": "Upload supplier freight manifest or enter supplier distances in Review & Mapping."
        })

    # Gap 4: Manufacturing energy (A3)
    mfg = extracted.get("manufacturing", {})
    if not mfg.get("annual_facility_kwh") and not mfg.get("electricity_kwh"):
        gaps.append({
            "id": "gap-energy-a3",
            "module": "A3",
            "category": "Factory Utility Bills",
            "severity": "high",
            "title": "Missing Manufacturing Electricity (A3)",
            "message": "Specific kWh consumption allocated to product manufacturing was not detected.",
            "action": "Upload recent utility electricity bill or sub-metered energy report, with annual production volume."
        })

    info = extracted.get("project_info", {})
    if is_chiller(pid):
        # Gap 5: Refrigerant charge (UL 10010-4 B1-B2)
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
    else:
        # Gap 5: How many functional / declared units the BOM represents
        unit = product["fu_unit"]
        gaps.append({
            "id": "notice-fu-quantity",
            "module": "Scope",
            "category": "Functional / Declared Unit",
            "severity": "medium",
            "title": f"Confirm the BOM quantity in {unit}",
            "message": f"Results are reported per {product['declared_unit'] or product['functional_unit']}. The BOM is assumed to describe {info.get('fu_quantity', 1)} {unit}.",
            "action": f"Set 'Quantity represented by BOM ({unit})' in Review & Mapping if the BOM covers more or less than 1 {unit}."
        })
        # Gap 6: End-of-life split (no PCR default for these products)
        eol = extracted.get("end_of_life", {})
        eol_sum = sum(float(eol.get(k, 0) or 0) for k in ("recycling_rate_percent", "landfill_rate_percent", "incineration_rate_percent"))
        if eol_sum <= 0:
            gaps.append({
                "id": "gap-eol-split",
                "module": "C3-C4",
                "category": "End of Life",
                "severity": "high",
                "title": "End-of-Life Treatment Split Not Declared",
                "message": f"{pcr_label} requires end-of-life scenarios; no recycling / landfill / incineration shares were found.",
                "action": "Enter the end-of-life split (must total 100%) in Review & Mapping."
            })

    # Gap 7: Reference Service Life (RSL)
    if not info.get("lifespan_years"):
        default_rsl = product.get("default_rsl_years")
        gaps.append({
            "id": "gap-rsl",
            "module": "Scope",
            "category": "PCR Scoping",
            "severity": "medium" if default_rsl else "high",
            "title": "Reference Service Life (RSL) Unconfirmed",
            "message": (f"Defaulting to {default_rsl} years per {pcr_label}." if default_rsl
                        else f"{pcr_label} has no default RSL; the manufacturer must declare it."),
            "action": "Confirm the product's reference service life and its in-use conditions."
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
                # Fallback: generic BOM table (rows without a usable mass are skipped, not invented)
                custom_bom = _parse_bom_rows(csv.DictReader(io.StringIO(decoded)), extracted)
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
    product_category: str = Form("water_cooled_chiller"),
    custom_notes: Optional[str] = Form(None)
):
    """
    Parses uploaded files (ZIP archives, CSV, JSON, Excel, PDF) for the selected product,
    matches every BOM line to an ecoinvent dataset by name, performs PCR gap analysis,
    and returns structured LCA input data with the traceability graph.
    """
    pid = normalize_product_id(product_category)
    extracted = build_extraction_template(pid)
    processed_files: List[str] = []

    # Process uploaded files (unpacking any ZIP files recursively)
    for file in files:
        contents = await file.read()
        process_file_content(file.filename or "upload", contents, extracted, processed_files)

    match_stats = finalize_extraction(extracted, pid)
    gaps = analyze_pcr_gaps(extracted, processed_files, pid, match_stats)
    traceability = build_traceability_flow(extracted, processed_files)

    return {
        "status": "success",
        "product_category": pid,
        "files_processed": processed_files,
        "extracted": extracted,
        "provider_matching": {**match_stats, "database_available": database_available()},
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

