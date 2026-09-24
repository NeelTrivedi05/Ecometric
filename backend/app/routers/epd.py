import sys
import os
import json
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

# Ensure backend root is in sys.path so imports resolve cleanly in any IDE environment
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from app.database import get_db
    from app.models import Project, TechnicalData, Result, Report
    from app.schemas import ProjectCreate, LcaCalculationInput, LcaSummaryResponse, ReportResponse
    from app.engines.pcr_validation import validate_chiller_inputs
    from app.engines.calc_engine import calculate_chiller_lca, calculate_anti_lca
    from app.engines.report_gen import generate_epd_report
    from app.engines.extract_ef_values import extract_ef_for_payload
except ImportError:
    from ..database import get_db
    from ..models import Project, TechnicalData, Result, Report
    from ..schemas import ProjectCreate, LcaCalculationInput, LcaSummaryResponse, ReportResponse
    from ..engines.pcr_validation import validate_chiller_inputs
    from ..engines.calc_engine import calculate_chiller_lca, calculate_anti_lca
    from ..engines.report_gen import generate_epd_report
    from ..engines.extract_ef_values import extract_ef_for_payload

router = APIRouter(prefix="/api/epd", tags=["EPD"])

@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_epd_project(data: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        name=data.name,
        product_category="water_cooled_chiller",
        pcr_ref="UL 10010-4 Part B v2.0 2018",
        status="DRAFT"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    tech = TechnicalData(
        project_id=project.id,
        chilling_capacity_rt=data.chilling_capacity_rt,
        chilling_capacity_kw=data.chilling_capacity_rt * 3.51685,
        refrigerant_type=data.refrigerant_type,
        refrigerant_charge_kg=data.refrigerant_charge_kg,
        mass_delivered_kg=data.mass_delivered_kg
    )
    db.add(tech)
    db.commit()

    return {"project_id": project.id, "name": project.name, "status": project.status}

@router.post("/calculate", response_model=LcaSummaryResponse)
def calculate_epd(input_data: LcaCalculationInput, db: Session = Depends(get_db)):
    data_dict = input_data.model_dump() if hasattr(input_data, 'model_dump') else input_data.dict()
    
    # Validate via PCR engine
    validation = validate_chiller_inputs(data_dict)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail={"errors": validation["errors"]})

    # Delegate calculation to calc_engine
    calc_result = calculate_chiller_lca(data_dict)

    # Save results to DB if project_id exists
    if input_data.project_id:
        project = db.query(Project).filter(Project.id == input_data.project_id).first()
        if project:
            db.query(Result).filter(Result.project_id == project.id).delete()
            for mod_name, mod_data in calc_result["by_module"].items():
                db.add(Result(
                    project_id=project.id,
                    module=mod_name,
                    impact_category="GWP-total",
                    methodology=mod_data.get("methodology", "TRACI 2.1"),
                    value=mod_data["gwp_kg_co2e"]
                ))
            project.status = "CALCULATED"
            db.commit()

    return calc_result

@router.post("/report", response_model=ReportResponse)
def generate_report(project_id: str = "demo_project", db: Session = Depends(get_db)):
    project_name = "Chiller_EPD_Assessment"
    if project_id != "demo_project":
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project_name = project.name
            project.status = "REPORTED"

    # Delegate report generation to engine
    report_data = generate_epd_report(project_id, project_name)

    if project_id != "demo_project":
        db.add(Report(
            project_id=project_id,
            pdf_url=report_data["pdf_url"],
            version="1.0",
            disclaimer_text_snapshot=report_data["disclaimer"]
        ))
        db.commit()

    return report_data

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
RESULTS_DIR = Path(os.getenv("RESULTS_DIR", str(REPO_ROOT / "results")))
os.makedirs(RESULTS_DIR, exist_ok=True)

REFRIGERANT_GWP_CF = {
    "R134a": 1430.0,
    "R134A": 1430.0,
    "R1234ze": 1.37,
    "R513A": 631.0,
    "R1233zd": 1.0,
    "R410A": 2088.0,
    "R32": 675.0,
}

def resolve_reference_unit(pid: str, default: str = "kg") -> str:
    pid_l = str(pid).lower()
    if "elec" in pid_l or "kwh" in pid_l:
        return "kWh"
    if "transport" in pid_l or "lorry" in pid_l or "ship" in pid_l or "train" in pid_l or "tkm" in pid_l:
        return "tkm"
    if "water" in pid_l or "m3" in pid_l:
        return "m3"
    if "gas" in pid_l or "heat" in pid_l or "boiler" in pid_l or "diesel" in pid_l or "mj" in pid_l:
        return "MJ"
    if "motor" in pid_l or "inverter" in pid_l or "electronics" in pid_l or "vfd" in pid_l:
        return "unit"
    return default

def build_enriched_stages_data(extracted_data: dict) -> dict:
    # A1 BOM
    bom = extracted_data.get("bom", [])
    a1_bom = []
    bom_mass_map = {}
    for item in bom:
        item_copy = dict(item)
        if "ecoinvent_id" not in item_copy and "provider_id" in item_copy:
            item_copy["ecoinvent_id"] = item_copy["provider_id"]
        elif "provider_id" not in item_copy and "ecoinvent_id" in item_copy:
            item_copy["provider_id"] = item_copy["ecoinvent_id"]
        pid = item_copy.get("provider_id", "ecoinvent_steel_hot_rolled_glo")
        item_copy["reference_unit"] = item_copy.get("reference_unit") or resolve_reference_unit(pid, "kg")
        a1_bom.append(item_copy)
        if item_copy.get("id"):
            try:
                bom_mass_map[str(item_copy["id"])] = float(item_copy.get("mass", 0))
            except (ValueError, TypeError):
                bom_mass_map[str(item_copy["id"])] = 0.0

    # A2 Transport
    raw_transport = extracted_data.get("transport", [])
    a2_transport = []
    for leg in raw_transport:
        leg_copy = dict(leg)
        mode_str = str(leg_copy.get("mode", "")).lower()
        if not leg_copy.get("provider_id") and not leg_copy.get("ecoinvent_id"):
            if "ship" in mode_str or "sea" in mode_str or "ocean" in mode_str:
                leg_copy["provider_id"] = "ecoinvent_transport_container_ship_glo"
            elif "rail" in mode_str or "train" in mode_str:
                leg_copy["provider_id"] = "ecoinvent_transport_freight_train_rer"
            else:
                leg_copy["provider_id"] = "ecoinvent_transport_lorry_32t_rer"
        pid = leg_copy.get("provider_id", "ecoinvent_transport_lorry_32t_rer")
        leg_copy["reference_unit"] = leg_copy.get("reference_unit") or resolve_reference_unit(pid, "tkm")
        
        # linked_material_ids & mass_kg
        linked_ids = leg_copy.get("linked_material_ids", leg_copy.get("linked_materials", []))
        if not isinstance(linked_ids, list):
            linked_ids = []
        leg_copy["linked_material_ids"] = linked_ids
        
        if linked_ids and bom_mass_map:
            calculated_mass = sum(bom_mass_map.get(str(mid), 0.0) for mid in linked_ids)
            leg_copy["mass_kg"] = round(calculated_mass, 2)
        else:
            leg_copy["mass_kg"] = float(leg_copy.get("mass_kg", leg_copy.get("mass", 0.0)))

        a2_transport.append(leg_copy)

    # A3 Manufacturing
    mfg = dict(extracted_data.get("manufacturing", {}))
    if not mfg.get("electricity_provider_id"):
        mfg["electricity_provider_id"] = "ecoinvent_elec_mv_us"
    if not mfg.get("gas_provider_id"):
        mfg["gas_provider_id"] = "ecoinvent_gas_burned_boiler_glo"
    if not mfg.get("water_provider_id"):
        mfg["water_provider_id"] = "ecoinvent_water_deionised_glo"
    mfg["annual_production_units"] = float(mfg.get("annual_production_units", 1000))
    mfg["electricity_provider_id_reference_unit"] = resolve_reference_unit(mfg["electricity_provider_id"], "kWh")
    mfg["gas_provider_id_reference_unit"] = resolve_reference_unit(mfg["gas_provider_id"], "MJ")
    mfg["water_provider_id_reference_unit"] = resolve_reference_unit(mfg["water_provider_id"], "m3")

    # A4/A5 Installation & Logistics
    inst = dict(extracted_data.get("installation", {}))
    if not inst.get("outbound_provider_id"):
        inst["outbound_provider_id"] = "ecoinvent_transport_lorry_32t_rer"
    if not inst.get("outbound_transport_km"):
        inst["outbound_transport_km"] = 500.0  # UL 10010-4 default: 500 km truck
    if not inst.get("installation_energy_provider_id"):
        inst["installation_energy_provider_id"] = "ecoinvent_elec_mv_us"
    if not inst.get("consumable_provider_id"):
        inst["consumable_provider_id"] = "ecoinvent_diesel_burned_building_machine_glo"
    if not inst.get("rigging_crane_diesel_liters"):
        inst["rigging_crane_diesel_liters"] = 37.8  # UL 10010-4: 3 hrs * 12.6 L/hr crane unloading
    inst["outbound_provider_id_reference_unit"] = resolve_reference_unit(inst["outbound_provider_id"], "tkm")
    inst["installation_energy_provider_id_reference_unit"] = resolve_reference_unit(inst["installation_energy_provider_id"], "kWh")
    inst["consumable_provider_id_reference_unit"] = resolve_reference_unit(inst["consumable_provider_id"], "MJ")

    # B1-B7 Operational Use
    op = dict(extracted_data.get("operational", {}))
    ref_type = op.get("refrigerant_type", "R134a")
    op["refrigerant_gwp_cf"] = REFRIGERANT_GWP_CF.get(ref_type, 1430.0)
    if not op.get("energy_provider_id"):
        op["energy_provider_id"] = "ecoinvent_elec_mv_us"
    if not op.get("water_provider_id"):
        op["water_provider_id"] = "ecoinvent_water_deionised_glo"
    op["energy_provider_id_reference_unit"] = resolve_reference_unit(op["energy_provider_id"], "kWh")
    op["water_provider_id_reference_unit"] = resolve_reference_unit(op["water_provider_id"], "m3")

    op["annual_operating_hours"] = float(op.get("annual_operating_hours", 8760))
    op["load_basis"] = str(op.get("load_basis", "full_load")).lower()

    # Populate capacity_rt and efficiency_kw_per_ton for B6 calculation
    cap = (
        op.get("capacity_rt")
        or op.get("cooling_capacity_tons")
        or op.get("capacity_tons")
        or op.get("rated_capacity_tons")
        or extracted_data.get("operational_characteristics", {}).get("cooling_capacity_tons")
    )
    if not cap:
        kw = op.get("cooling_capacity_kw") or op.get("capacity_kw") or extracted_data.get("operational_characteristics", {}).get("cooling_capacity_kw")
        if kw:
            cap = float(kw) / 3.51685
    op["capacity_rt"] = float(cap or 800.0)

    eff = (
        op.get("efficiency_kw_per_ton")
        or op.get("kw_per_ton")
        or extracted_data.get("operational_characteristics", {}).get("efficiency_kw_per_ton")
    )
    op["efficiency_kw_per_ton"] = float(eff or 0.54)
    op["rsl_years"] = float(extracted_data.get("project_info", {}).get("lifespan_years") or op.get("rsl_years") or 25.0)
    
    city_grids = op.get("city_grid_providers", {})
    if not isinstance(city_grids, dict) or not city_grids:
        city_grids = {
            "Chicago": "ecoinvent_elec_mv_us",
            "Houston": "ecoinvent_elec_tx",
            "Frankfurt": "ecoinvent_elec_de",
            "Dubai": "ecoinvent_elec_ae",
        }
    op["city_grid_providers"] = city_grids
    op["city_grid_providers_reference_units"] = {city: resolve_reference_unit(pid, "kWh") for city, pid in city_grids.items()}

    b2 = dict(extracted_data.get("maintenance_b2", {}))
    if not b2.get("provider_id"):
        b2["provider_id"] = "ecoinvent_lubricating_oil_glo"
    if not b2.get("maintenance_cycles_per_rsl"):
        b2["maintenance_cycles_per_rsl"] = 25.0
    if not b2.get("consumable_mass_kg"):
        # Refrigerant top-up per UL 10010-4 Table 8: 2% annual leak rate
        b2["consumable_mass_kg"] = round(float(op.get("refrigerant_charge_kg", 45.0)) * 0.02, 3)
    b2["reference_unit"] = resolve_reference_unit(b2["provider_id"], "kg")

    b3 = dict(extracted_data.get("repair_b3", {}))
    if not b3.get("provider_id"):
        b3["provider_id"] = "ecoinvent_steel_hot_rolled_glo"
    b3["reference_unit"] = resolve_reference_unit(b3["provider_id"], "kg")

    b4 = dict(extracted_data.get("replacement_b4", {}))
    if not b4.get("esl_years"):
        b4["esl_years"] = float(extracted_data.get("project_info", {}).get("building_esl_years", 75))

    b5 = dict(extracted_data.get("refurbishment_b5", {}))
    if not b5.get("provider_id"):
        b5["provider_id"] = "ecoinvent_copper_tube_wire_glo"
    b5["reference_unit"] = resolve_reference_unit(b5["provider_id"], "kg")

    # C1-C4 End of Life
    eol = dict(extracted_data.get("end_of_life", {}))
    if not eol.get("deconstruction_provider_id"):
        eol["deconstruction_provider_id"] = "ecoinvent_diesel_dismantling_glo"
    if not eol.get("waste_transport_provider_id"):
        eol["waste_transport_provider_id"] = "ecoinvent_transport_lorry_32t_rer"
    if not eol.get("waste_transport_km"):
        eol["waste_transport_km"] = 100.0  # UL 10010-4 Table 12: 100 km disposal transport
    if eol.get("recycling_rate_percent") is None:
        eol["recycling_rate_percent"] = 90.0
    if eol.get("landfill_rate_percent") is None:
        eol["landfill_rate_percent"] = 10.0
    if not eol.get("recycling_process_provider_id"):
        eol["recycling_process_provider_id"] = "ecoinvent_waste_metal_recycling_glo"
    if not eol.get("incineration_process_provider_id"):
        eol["incineration_process_provider_id"] = "ecoinvent_waste_incineration_glo"
    if not eol.get("landfill_process_provider_id"):
        eol["landfill_process_provider_id"] = "ecoinvent_waste_landfill_glo"
    
    eol["deconstruction_provider_id_reference_unit"] = resolve_reference_unit(eol["deconstruction_provider_id"], "MJ")
    eol["waste_transport_provider_id_reference_unit"] = resolve_reference_unit(eol["waste_transport_provider_id"], "tkm")
    eol["recycling_process_provider_id_reference_unit"] = resolve_reference_unit(eol["recycling_process_provider_id"], "kg")
    eol["incineration_process_provider_id_reference_unit"] = resolve_reference_unit(eol["incineration_process_provider_id"], "kg")
    eol["landfill_process_provider_id_reference_unit"] = resolve_reference_unit(eol["landfill_process_provider_id"], "kg")

    # Module D Circularity
    circ_d = dict(extracted_data.get("circularity_d", {}))
    if not circ_d.get("virgin_material_provider_id"):
        circ_d["virgin_material_provider_id"] = "ecoinvent_virgin_steel_primary_glo"
    if not circ_d.get("recycled_process_provider_id"):
        circ_d["recycled_process_provider_id"] = "ecoinvent_secondary_steel_electric_glo"
    
    # Replace per-material recovery fields with overall_recovery_rate_percent
    overall_rate = circ_d.get("overall_recovery_rate_percent")
    if overall_rate is None:
        overall_rate = 90.0
    circ_d["overall_recovery_rate_percent"] = float(overall_rate)
    
    # Remove old per-material recovery rates & hardcoded credit
    circ_d.pop("steel_scrap_recovery_rate", None)
    circ_d.pop("copper_scrap_recovery_rate", None)
    circ_d.pop("aluminium_recovery_rate", None)
    circ_d.pop("refrigerant_reclamation_rate", None)
    circ_d.pop("net_avoided_burden_gwp_kg", None)

    circ_d["virgin_material_provider_id_reference_unit"] = resolve_reference_unit(circ_d["virgin_material_provider_id"], "kg")
    circ_d["recycled_process_provider_id_reference_unit"] = resolve_reference_unit(circ_d["recycled_process_provider_id"], "kg")

    return {
        "A1_BOM": a1_bom,
        "A2_Transport": a2_transport,
        "A3_Manufacturing": mfg,
        "A4_A5_Installation": inst,
        "B1_B7_Operational": op,
        "B2_Maintenance": b2,
        "B3_Repair": b3,
        "B4_Replacement": b4,
        "B5_Refurbishment": b5,
        "C1_C4_EndOfLife": eol,
        "D_Circularity": circ_d
    }

@router.post("/calculate-anti")
def calculate_anti_endpoint(payload: Dict[str, Any] = Body(default_factory=dict)):
    """
    Calculates audited EN 15804+A2 lifecycle assessment indicators and compliance gates,
    saving the complete input data, provider details, and methodology into results/epd_calculation_input.json
    and creating a new timestamped file for every calculation run in root results/ directory.
    """
    data = payload or {}
    methodology = data.get("methodology", "TRACI 2.1")
    extracted_data = data.get("extracted_data", data)
    
    stages_data = build_enriched_stages_data(extracted_data)

    # Structure the calculation input record
    calculation_record = {
        "metadata": {
            "title": "EPD Calculation Engine Input Payload",
            "generated_at": datetime.now().isoformat(),
            "methodology": methodology,
            "database_version": "ecoinvent v3.12 Cut-off",
            "standard": "EN 15804+A2:2019 / ISO 14025:2006"
        },
        "project_info": extracted_data.get("project_info", {}),
        "stages_data": stages_data,
        "full_payload": data
    }
    
    # Clean up existing JSON files in results/ folder before writing fresh calculation results
    try:
        if RESULTS_DIR.exists():
            for old_file in RESULTS_DIR.glob("*.json"):
                try:
                    old_file.unlink()
                except Exception:
                    pass
    except Exception as e:
        print(f"[EPD Router] Warning cleaning up old results files: {e}")

    # Extract EF values directly in-process and embed into calculation_record
    try:
        candidate_excel_paths = [
            REPO_ROOT / "Ecoinvent database" / "ecoinvent 3.12_cut-off_cumulative_lcia_xlsx" / "Cut-off Cumulative LCIA v3.12.xlsx",
            REPO_ROOT / "Cut-off Cumulative LCIA v3.12.xlsx",
            Path("/Users/parth/Desktop/final year project/Cut-off Cumulative LCIA v3.12.xlsx"),
            Path("/Users/parth/Desktop/Ecometric/Cut-off Cumulative LCIA v3.12.xlsx"),
        ]
        excel_path = next((p for p in candidate_excel_paths if p.exists()), None)
        ef_results = extract_ef_for_payload(calculation_record, str(excel_path) if excel_path else None, methodology)
        calculation_record["extracted_ef_values"] = ef_results
        print(f"[EPD Router] Extracted EF values for {len(ef_results)} providers ({methodology})")
    except Exception as e:
        print(f"[EPD Router] Warning: Could not extract EF values: {e}")

    # Save the consolidated JSON (user inputs + EF values) to results/ directory
    try:
        results_file = RESULTS_DIR / "epd_calculation_input.json"
        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(calculation_record, f, indent=2, ensure_ascii=False, default=str)

        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        timestamped_file = RESULTS_DIR / f"epd_calculation_input_{timestamp_str}.json"
        with open(timestamped_file, "w", encoding="utf-8") as f:
            json.dump(calculation_record, f, indent=2, ensure_ascii=False, default=str)
    except Exception as e:
        print(f"[EPD Router] Warning: Could not save results JSON file: {e}")

    # Automatically run calculate_epd engine right after saving epd_calculation_input.json
    calc_out = None
    try:
        from app.engines.calculate_epd import run_epd_calculation
        calc_out = run_epd_calculation(str(results_file), out_dir=str(RESULTS_DIR))
        print(f"[EPD Router] Automatically generated EPD calculation results:\n  CSV: {calc_out.get('csv_path')}\n  CSV (exp): {calc_out.get('csv_exp_path')}\n  JSON: {calc_out.get('json_path')}\n  TXT: {calc_out.get('txt_path')}")
    except Exception as e:
        print(f"[EPD Router] Warning: EPD calculation failed (non-blocking): {e}")

    res_anti = calculate_anti_lca(extracted_data)
    if calc_out and isinstance(calc_out, dict):
        epd_res = calc_out.get("results", {})
        mandatory_pcr = calc_out.get("mandatory_pcr_indicators", epd_res)
        all_indicators = calc_out.get("all_available_indicators", epd_res)

        res_anti["epd_results"] = epd_res
        res_anti["mandatory_pcr_indicators"] = mandatory_pcr
        res_anti["all_available_indicators"] = all_indicators
        res_anti["total_indicators_count"] = len(all_indicators)
        res_anti["mandatory_indicators_count"] = len(mandatory_pcr)
        res_anti["epd_metadata"] = calc_out.get("metadata")
        res_anti["epd_warnings"] = calc_out.get("warnings")

        # Allow user to request custom indicator subset
        selected_keys = data.get("selected_indicator_keys", [])
        if selected_keys and isinstance(selected_keys, list):
            res_anti["custom_selected_indicators"] = {
                k: all_indicators[k] for k in selected_keys if k in all_indicators
            }

        # Synchronize top-level summary metrics with calculated GWP row
        gwp_key = next((k for k in epd_res.keys() if "global warming" in k.lower() or "climate change" in k.lower()), None)
        if gwp_key and epd_res.get(gwp_key):
            row = epd_res[gwp_key]
            res_anti["a1_gwp"] = round(float(row.get("A1", 0)), 2)
            res_anti["a2_gwp"] = round(float(row.get("A2", 0)), 2)
            res_anti["a3_gwp"] = round(float(row.get("A3", 0)), 2)
            res_anti["a4_gwp"] = round(float(row.get("A4", 0)), 2)
            res_anti["a5_gwp"] = round(float(row.get("A5", 0)), 2)
            res_anti["b1_gwp"] = round(float(row.get("B1", 0)), 2)
            res_anti["b2_gwp"] = round(float(row.get("B2", 0)), 2)
            res_anti["b3_gwp"] = round(float(row.get("B3", 0)), 2)
            res_anti["b4_gwp"] = round(float(row.get("B4", 0)), 2)
            res_anti["b5_gwp"] = round(float(row.get("B5", 0)), 2)
            res_anti["b6_gwp"] = round(float(row.get("B6", 0)), 2)
            res_anti["b7_gwp"] = round(float(row.get("B7", 0)), 2)
            b_tot = sum(float(row.get(f"B{i}", 0)) for i in range(1, 8))
            res_anti["b_stage_gwp"] = round(b_tot, 2)
            res_anti["c1_gwp"] = round(float(row.get("C1", 0)), 2)
            res_anti["c2_gwp"] = round(float(row.get("C2", 0)), 2)
            res_anti["c3_gwp"] = round(float(row.get("C3", 0)), 2)
            res_anti["c4_gwp"] = round(float(row.get("C4", 0)), 2)
            c_tot = sum(float(row.get(f"C{i}", 0)) for i in range(1, 5))
            res_anti["c_stage_gwp"] = round(c_tot, 2)
            res_anti["d_gwp"] = round(float(row.get("D", 0)), 2)
            res_anti["module_d_gwp"] = round(float(row.get("D", 0)), 2)
            res_anti["total_gwp"] = round(
                float(row.get("A1-A3", 0)) + float(row.get("A4", 0)) + float(row.get("A5", 0)) + b_tot + c_tot + float(row.get("D", 0)), 2
            )

    return res_anti


@router.get("/lcia/search")
def search_lcia_indicators_endpoint(
    q: str = "",
    methodology: Optional[str] = None,
    category: Optional[str] = None,
    mandatory_only: bool = False,
    include_no_lt: bool = False,
    limit: int = 50,
):
    """
    Auto-suggest & fuzzy search across all ~633 LCIA indicators.
    Supports partial queries, canonical acronyms (GWP, CO2, ODP, AP, Smog, POCP),
    and returns indicators grouped by methodology and category in <2ms.
    """
    from app.engines.build_lcia_search_index import search_lcia_indicators

    results = search_lcia_indicators(
        query=q,
        methodology=methodology,
        category=category,
        mandatory_only=mandatory_only,
        include_no_lt=include_no_lt,
        limit=limit,
    )

    by_category = {}
    by_methodology = {}
    for ind in results:
        cat = ind.get("category", "General")
        meth = ind.get("methodology", "Unknown")
        by_category.setdefault(cat, []).append(ind)
        by_methodology.setdefault(meth, []).append(ind)

    return {
        "query": q,
        "methodology": methodology,
        "total_found": len(results),
        "indicators": results,
        "grouped_by_category": by_category,
        "grouped_by_methodology": by_methodology,
    }


@router.get("/lcia/methodologies")
def get_lcia_methodologies_endpoint():
    """
    Returns all 46 supported LCIA methodologies with indicator counts and metadata.
    """
    from app.engines.build_lcia_search_index import get_registry
    registry = get_registry()
    return {
        "total_methodologies": registry.get("metadata", {}).get("total_methodologies", 0),
        "total_indicators": registry.get("metadata", {}).get("total_indicators", 0),
        "methodologies": registry.get("methodologies", {}),
        "acronym_definitions": registry.get("acronym_definitions", {}),
    }


@router.post("/generate-nsf-document")
def generate_nsf_document_endpoint(payload: Dict[str, Any] = Body(default_factory=dict)):
    """
    Generates a full NSF / UL 10010-4 compliant EPD declaration document
    and HTML report based on template 'epd_chiller_nsf_ul10010-4_v2'.
    """
    from app.engines.epd_document_generator import generate_nsf_chiller_epd
    data = payload or {}
    methodology = data.get("methodology", "TRACI 2.1")

    # If calc results not passed directly in payload, calculate them
    results = data.get("results")
    if not results or not results.get("epd_results"):
        results = calculate_anti_endpoint(data)

    doc = generate_nsf_chiller_epd(data, results, methodology)
    return doc
