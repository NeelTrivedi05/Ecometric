import sys
import os
import re
import json
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Body, Response
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

# Ensure backend root is in sys.path so imports resolve cleanly in any IDE environment
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from app.database import get_db
    from app.models import Project, TechnicalData, Result, Report
    from app.schemas import ProjectCreate, LcaCalculationInput, LcaSummaryResponse
    from app.engines.pcr_validation import validate_chiller_inputs
    from app.engines.calc_engine import calculate_chiller_lca, calculate_anti_lca
    from app.engines.extract_ef_values import extract_ef_for_payload
    from app.engines.material_matcher import (assign_bom_providers, default_provider, match_material,
                                              product_dataset, project_region, row_reference_unit)
    from app.products import get_product, is_chiller, normalize_product_id
except ImportError:
    from ..database import get_db
    from ..models import Project, TechnicalData, Result, Report
    from ..schemas import ProjectCreate, LcaCalculationInput, LcaSummaryResponse
    from ..engines.pcr_validation import validate_chiller_inputs
    from ..engines.calc_engine import calculate_chiller_lca, calculate_anti_lca
    from ..engines.extract_ef_values import extract_ef_for_payload
    from ..engines.material_matcher import (assign_bom_providers, default_provider, match_material,
                                            product_dataset, project_region, row_reference_unit)
    from ..products import get_product, is_chiller, normalize_product_id

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

LEGACY_DEFAULT_SLUGS = {
    "electricity": "ecoinvent_elec_mv_us",
    "natural_gas": "ecoinvent_gas_burned_boiler_glo",
    "water": "ecoinvent_water_deionised_glo",
    "diesel_machine": "ecoinvent_row_2621",
    "lorry": "ecoinvent_transport_lorry_32t_rer",
    "lorry_16_32": "ecoinvent_transport_lorry_32t_rer",
    "ship": "ecoinvent_transport_container_ship_glo",
    "train": "ecoinvent_transport_freight_train_rer",
    "lubricating_oil": "ecoinvent_lubricating_oil_glo",
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

def _num(value, default=0.0) -> float:
    try:
        if value is None or value == "":
            return float(default)
        return float(str(value).replace(",", ""))
    except (TypeError, ValueError):
        return float(default)


def _set_default_provider(block: dict, field: str, kind: str, region: str, fallback_unit: str):
    """Fills block[field] with the regional default dataset unless the user picked one."""
    if not block.get(field):
        hit = default_provider(kind, region)
        if hit:
            block[field] = hit["provider_id"]
            block[f"{field}_reference_unit"] = hit["reference_unit"]
            block[f"{field}_dataset"] = f"{hit['activity_name']} [{hit['geography']}]"
            return
        block[field] = LEGACY_DEFAULT_SLUGS[kind]
    block[f"{field}_reference_unit"] = block.get(f"{field}_reference_unit") or _provider_unit(block[field], fallback_unit)


def _set_product_dataset(block: dict, field: str, pid: str, group: str, key: str, region: str, fallback_unit: str = "kg"):
    if not block.get(field):
        hit = product_dataset(pid, group, key, region)
        if hit:
            block[field] = hit["provider_id"]
            block[f"{field}_reference_unit"] = hit["reference_unit"]
            block[f"{field}_dataset"] = f"{hit['activity_name']} [{hit['geography']}]"
            return
    if block.get(field):
        block[f"{field}_reference_unit"] = block.get(f"{field}_reference_unit") or _provider_unit(block[field], fallback_unit)


def _provider_unit(pid: str, default: str) -> str:
    """Reference unit of a provider: database unit for ecoinvent_row_N ids, name heuristic otherwise."""
    m = re.match(r"^ecoinvent_row_(\d+)$", str(pid or ""))
    if m:
        unit = row_reference_unit(int(m.group(1)))
        if unit:
            return unit
    return resolve_reference_unit(pid, default)


def _match_named_input(block: dict, name_keys, pid: str, region: str):
    """For B2/B3/B5 consumables: match a dataset from the declared consumable/part name."""
    if block.get("provider_id"):
        block["reference_unit"] = block.get("reference_unit") or _provider_unit(block["provider_id"], "kg")
        return
    label = " ".join(str(block.get(k) or "") for k in name_keys).strip()
    if not label:
        return
    hit = match_material(label, block.get("material_type", ""), pid, region)
    if hit:
        block["provider_id"] = hit["provider_id"]
        block["reference_unit"] = hit["reference_unit"]
        block["dataset"] = f"{hit['activity_name']} [{hit['geography']}]"


def build_enriched_stages_data(extracted_data: dict, product_id: Optional[str] = None) -> dict:
    """
    Distributes the extracted inventory into life-cycle stages for the selected product and
    assigns ecoinvent datasets: BOM lines are matched by material name, energy / water /
    transport use regional market datasets, end-of-life and module D use the product's
    PCR scenario datasets. Chiller-only models (refrigerant, kW/ton x RT) apply to chillers only.
    """
    info = extracted_data.get("project_info", {}) or {}
    pid = normalize_product_id(product_id or info.get("product_category"))
    product = get_product(pid)
    defaults = product["defaults"]
    chiller = is_chiller(pid)
    region = project_region(extracted_data)

    # A1 BOM: match every line to a dataset by name (user-picked rows are kept)
    a1_bom = []
    bom_mass_map = {}
    for item in extracted_data.get("bom", []) or []:
        item_copy = dict(item)
        item_copy["mass"] = _num(item_copy.get("mass"))
        if "ecoinvent_id" not in item_copy and "provider_id" in item_copy:
            item_copy["ecoinvent_id"] = item_copy["provider_id"]
        elif "provider_id" not in item_copy and "ecoinvent_id" in item_copy:
            item_copy["provider_id"] = item_copy["ecoinvent_id"]
        if item_copy.get("ecoinvent_id") and str(item_copy["ecoinvent_id"]).startswith("ecoinvent_row_"):
            item_copy["provider_id"] = item_copy["ecoinvent_id"]
        a1_bom.append(item_copy)
        if item_copy.get("id"):
            bom_mass_map[str(item_copy["id"])] = item_copy["mass"]
    assign_bom_providers(a1_bom, pid, region)
    for item_copy in a1_bom:
        pid_item = item_copy.get("provider_id") or "ecoinvent_steel_hot_rolled_glo"
        item_copy["reference_unit"] = item_copy.get("reference_unit") or _provider_unit(pid_item, "kg")
    total_mass = sum(i["mass"] for i in a1_bom)

    # A2 Transport (inbound legs)
    a2_transport = []
    for leg in extracted_data.get("transport", []) or []:
        leg_copy = dict(leg)
        leg_copy["module"] = leg_copy.get("module") or "A2"
        leg_copy["distance"] = _num(leg_copy.get("distance", leg_copy.get("dist")))
        mode_str = str(leg_copy.get("mode", "")).lower()
        if not leg_copy.get("provider_id") and not leg_copy.get("ecoinvent_id"):
            kind = "ship" if any(w in mode_str for w in ("ship", "sea", "ocean", "vessel")) else \
                   "train" if any(w in mode_str for w in ("rail", "train")) else "lorry"
            _set_default_provider(leg_copy, "provider_id", kind, region, "tkm")
            leg_copy["reference_unit"] = leg_copy.pop("provider_id_reference_unit", "tkm")
        else:
            leg_copy["provider_id"] = leg_copy.get("provider_id") or leg_copy.get("ecoinvent_id")
            leg_copy["reference_unit"] = leg_copy.get("reference_unit") or _provider_unit(leg_copy["provider_id"], "tkm")

        linked_ids = leg_copy.get("linked_material_ids", leg_copy.get("linked_materials", []))
        if not isinstance(linked_ids, list):
            linked_ids = []
        leg_copy["linked_material_ids"] = linked_ids
        if linked_ids and bom_mass_map:
            leg_copy["mass_kg"] = round(sum(bom_mass_map.get(str(mid), 0.0) for mid in linked_ids), 2)
        else:
            leg_copy["mass_kg"] = _num(leg_copy.get("mass_kg", leg_copy.get("mass", 0.0)))
        a2_transport.append(leg_copy)

    # BOM lines that carry their own supplier distance become A2 legs when no manifest was given
    if not a2_transport:
        for item_copy in a1_bom:
            km = _num(item_copy.get("transport_km"))
            if km > 0 and item_copy["mass"] > 0:
                leg = {"id": f"a2-{item_copy.get('id')}", "name": f"{item_copy.get('supplier') or 'Supplier'} -> plant",
                       "mode": "Lorry", "distance": km, "module": "A2",
                       "linked_material_ids": [item_copy.get("id")], "mass_kg": item_copy["mass"]}
                _set_default_provider(leg, "provider_id", "lorry", region, "tkm")
                leg["reference_unit"] = leg.pop("provider_id_reference_unit", "tkm")
                a2_transport.append(leg)

    # A3 Manufacturing
    mfg = dict(extracted_data.get("manufacturing", {}) or {})
    _set_default_provider(mfg, "electricity_provider_id", "electricity", region, "kWh")
    _set_default_provider(mfg, "gas_provider_id", "natural_gas", region, "MJ")
    _set_default_provider(mfg, "water_provider_id", "water", region, "kg")
    mfg["annual_production_units"] = _num(mfg.get("annual_production_units"), 1000)
    for k in ("annual_facility_kwh", "natural_gas_mj", "water_m3"):
        mfg[k] = _num(mfg.get(k))

    # A4/A5 Transport to site and installation
    inst = dict(extracted_data.get("installation", {}) or {})
    _set_default_provider(inst, "outbound_provider_id", "lorry", region, "tkm")
    if not _num(inst.get("outbound_transport_km")) and defaults.get("a4_distance_km"):
        inst["outbound_transport_km"] = float(defaults["a4_distance_km"])   # PCR default scenario
        inst["outbound_transport_km_source"] = f"{product['pcr']['label']} default"
    inst["outbound_transport_km"] = _num(inst.get("outbound_transport_km"))
    _set_default_provider(inst, "installation_energy_provider_id", "electricity", region, "kWh")
    _set_default_provider(inst, "consumable_provider_id", "diesel_machine", region, "MJ")
    if not _num(inst.get("rigging_crane_diesel_liters")) and defaults.get("installation_crane_diesel_l"):
        inst["rigging_crane_diesel_liters"] = float(defaults["installation_crane_diesel_l"])  # UL 10010-4: 3 h x 12.6 L/h
    inst["rigging_crane_diesel_liters"] = _num(inst.get("rigging_crane_diesel_liters"))
    inst["installation_energy_kwh"] = _num(inst.get("installation_energy_kwh"))
    if not chiller:
        inst["commissioning_refrigerant_loss_kg"] = 0.0

    # B1-B7 Use stage
    op = dict(extracted_data.get("operational", {}) or {})
    _set_default_provider(op, "energy_provider_id", "electricity", region, "kWh")
    _set_default_provider(op, "water_provider_id", "water", region, "kg")
    rsl = _num(info.get("lifespan_years") or op.get("rsl_years"), product.get("default_rsl_years") or 25.0)
    op["rsl_years"] = rsl
    if chiller:
        ref_type = op.get("refrigerant_type", "R134a")
        op["refrigerant_gwp_cf"] = REFRIGERANT_GWP_CF.get(ref_type, 1430.0)
        op["annual_operating_hours"] = _num(op.get("annual_operating_hours"), 8760)
        op["load_basis"] = str(op.get("load_basis", "full_load")).lower()
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
        op["capacity_rt"] = _num(cap, 800.0)
        eff = (
            op.get("efficiency_kw_per_ton")
            or op.get("kw_per_ton")
            or extracted_data.get("operational_characteristics", {}).get("efficiency_kw_per_ton")
        )
        op["efficiency_kw_per_ton"] = _num(eff, 0.54)
        op["b6_model"] = "chiller_kw_per_ton"
        op["b7_model"] = "cooling_tower"
    else:
        # No refrigerant or kW/ton model outside chillers: B6/B7 come from declared annual use
        for k in ("refrigerant_charge_kg", "annual_leak_rate_percent", "capacity_rt", "efficiency_kw_per_ton"):
            op.pop(k, None)
        op["refrigerant_gwp_cf"] = None
        op["b6_model"] = product["use_stage"].get("b6_model", "none")
        op["b7_model"] = product["use_stage"].get("b7_model", "none")
        op["annual_energy_kwh"] = _num(op.get("annual_energy_kwh"))
        op["annual_water_m3"] = _num(op.get("annual_water_m3"))

    b2 = dict(extracted_data.get("maintenance_b2", {}) or {})
    if chiller:
        if not b2.get("provider_id"):
            _set_default_provider(b2, "provider_id", "lubricating_oil", region, "kg")
            b2["reference_unit"] = b2.pop("provider_id_reference_unit", "kg")
        if not b2.get("maintenance_cycles_per_rsl"):
            b2["maintenance_cycles_per_rsl"] = 25.0
        if not b2.get("consumable_mass_kg"):
            # Refrigerant top-up per UL 10010-4 Table 8: 2% annual leak rate
            b2["consumable_mass_kg"] = round(_num(op.get("refrigerant_charge_kg"), 45.0) * 0.02, 3)
    else:
        _match_named_input(b2, ("consumable_name",), pid, region)
    b2["reference_unit"] = b2.get("reference_unit") or _provider_unit(b2.get("provider_id"), "kg")

    b3 = dict(extracted_data.get("repair_b3", {}) or {})
    if chiller and not b3.get("provider_id") and not b3.get("replaced_part_name"):
        b3["provider_id"] = "ecoinvent_steel_hot_rolled_glo"
    _match_named_input(b3, ("replaced_part_name", "material_type"), pid, region)

    b4 = dict(extracted_data.get("replacement_b4", {}) or {})
    if not b4.get("esl_years"):
        b4["esl_years"] = _num(info.get("building_esl_years"), product.get("esl_years") or rsl)

    b5 = dict(extracted_data.get("refurbishment_b5", {}) or {})
    if chiller and not b5.get("provider_id") and not b5.get("material_name"):
        b5["provider_id"] = "ecoinvent_copper_tube_wire_glo"
    _match_named_input(b5, ("material_name",), pid, region)

    # C1-C4 End of life
    eol = dict(extracted_data.get("end_of_life", {}) or {})
    _set_default_provider(eol, "deconstruction_provider_id", "diesel_machine", region, "MJ")
    waste_kind = "lorry" if product["pcr"]["program_operator"] == "UL Environment" else "lorry_16_32"
    _set_default_provider(eol, "waste_transport_provider_id", waste_kind, region, "tkm")
    if not _num(eol.get("waste_transport_km")) and defaults.get("c2_distance_km"):
        eol["waste_transport_km"] = float(defaults["c2_distance_km"])
        eol["waste_transport_km_source"] = f"{product['pcr']['label']} default"
    eol["waste_transport_km"] = _num(eol.get("waste_transport_km"))
    if not _num(eol.get("decommissioning_energy_kwh")) and defaults.get("c1_diesel_kwh_per_tonne"):
        # PCR 2019:14 Table 4: demolition diesel per tonne of product
        eol["decommissioning_energy_kwh"] = round(defaults["c1_diesel_kwh_per_tonne"] * total_mass / 1000.0, 4)
        eol["decommissioning_energy_source"] = "PCR 2019:14 Table 4 default"
    eol["decommissioning_energy_kwh"] = _num(eol.get("decommissioning_energy_kwh"))
    eol_defaults = defaults.get("eol") or {}
    for k in ("recycling_rate_percent", "landfill_rate_percent", "incineration_rate_percent"):
        if eol.get(k) in (None, ""):
            eol[k] = eol_defaults.get(k, 0.0)
        eol[k] = _num(eol.get(k))
    _set_product_dataset(eol, "recycling_process_provider_id", pid, "eol_datasets", "recycling", region)
    _set_product_dataset(eol, "incineration_process_provider_id", pid, "eol_datasets", "incineration", region)
    _set_product_dataset(eol, "landfill_process_provider_id", pid, "eol_datasets", "landfill", region)

    # Module D
    circ_d = dict(extracted_data.get("circularity_d", {}) or {})
    if product.get("d_datasets"):
        _set_product_dataset(circ_d, "virgin_material_provider_id", pid, "d_datasets", "virgin", region)
        _set_product_dataset(circ_d, "recycled_process_provider_id", pid, "d_datasets", "recycled", region)
    else:
        circ_d.pop("virgin_material_provider_id", None)
        circ_d.pop("recycled_process_provider_id", None)
    overall_rate = circ_d.get("overall_recovery_rate_percent")
    if overall_rate in (None, "") or (not chiller and not _num(overall_rate)):
        overall_rate = defaults.get("recovery_rate_percent")
    circ_d["overall_recovery_rate_percent"] = None if overall_rate is None else _num(overall_rate)
    for k in ("steel_scrap_recovery_rate", "copper_scrap_recovery_rate", "aluminium_recovery_rate",
              "refrigerant_reclamation_rate", "net_avoided_burden_gwp_kg"):
        circ_d.pop(k, None)

    return {
        "product": {
            "id": pid, "name": product["name"], "pcr": product["pcr"]["label"],
            "functional_unit": product["functional_unit"], "declared_unit": product["declared_unit"],
            "fu_unit": product["fu_unit"], "fu_quantity": _num(info.get("fu_quantity"), 1) or 1,
            "region": region,
        },
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
    product_id = normalize_product_id(
        data.get("product_category") or (extracted_data.get("project_info") or {}).get("product_category")
    )
    extracted_data.setdefault("project_info", {})["product_category"] = product_id

    stages_data = build_enriched_stages_data(extracted_data, product_id)

    # Structure the calculation input record
    calculation_record = {
        "metadata": {
            "title": "EPD Calculation Engine Input Payload",
            "generated_at": datetime.now().isoformat(),
            "methodology": methodology,
            "product_category": product_id,
            "product": stages_data.get("product"),
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

    # PCR `results` rules (Studio step 7) on this calculation's output
    try:
        from app.engines.pcr_validation import evaluate_results_compliance
        res_anti["pcr_results_audit"] = evaluate_results_compliance({
            "extracted_data": extracted_data,
            "report_details": data.get("report_details") or {},
            "product_category": product_id,
            "methodology": methodology,
            "results": res_anti,
        })
    except Exception as pcr_err:
        print(f"[EPD Router] PCR results audit failed: {pcr_err}")

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


# =========================================================================
# Phase 4: DQR Scoring, openEPD Serializer & Third-Party Verification Bundle
# =========================================================================

@router.post("/dqr-evaluation")
def evaluate_dqr_endpoint(payload: Dict[str, Any] = Body(default_factory=dict)):
    """
    Evaluates Data Quality Rating (DQR) according to PEF 3.0 / EN 15804+A2 guidelines
    across TeR, GeR, TiR, and P for all lifecycle stages.
    """
    from app.engines.dqr_engine import DqrEngine
    data = payload or {}
    extracted = data.get("extracted_data", data)
    results = data.get("results")
    
    engine = DqrEngine()
    report = engine.evaluate_dqr(extracted, results)
    return report


@router.post("/openepd")
def generate_openepd_endpoint(payload: Dict[str, Any] = Body(default_factory=dict)):
    """
    Serializes LCA/EPD results into official openEPD standard v2.0 JSON format.
    """
    from app.engines.openepd_serializer import serialize_openepd_json
    from app.engines.dqr_engine import DqrEngine

    data = payload or {}
    extracted = data.get("extracted_data", data)
    methodology = data.get("methodology", "TRACI 2.1")

    results = data.get("results")
    if not results or not results.get("epd_results"):
        results = calculate_anti_endpoint(data)

    dqr_engine = DqrEngine()
    dqr_report = dqr_engine.evaluate_dqr(extracted, results)

    openepd_doc = serialize_openepd_json(extracted, results, dqr_report, methodology)
    return openepd_doc


@router.post("/export-verification-bundle")
def export_verification_bundle_endpoint(payload: Dict[str, Any] = Body(default_factory=dict)):
    """
    Generates and returns an audited Third-Party Verification ZIP package containing:
    1. 01_openepd_declaration_v2.json
    2. 02_epd_report_document.json
    3. 03_lcia_characterization_matrix.csv
    4. 04_data_quality_rating_pef3.json
    5. 05_pre_audit_quality_gates.json
    6. 06_official_epd_report.html (app.epd_report)
    7. checksums_sha256.txt
    """
    from app.engines.verification_package import build_verification_bundle
    from app.engines.pcr_rules_engine import PcrRulesEngine
    from app.database import SessionLocal

    data = payload or {}
    extracted = data.get("extracted_data", data)
    methodology = data.get("methodology", "TRACI 2.1")
    pcr_rule_id = data.get("pcr_rule_id", "rule-ul10010-4-traci")

    results = data.get("results")
    if not results or not results.get("epd_results"):
        results = calculate_anti_endpoint(data)

    db_sess = SessionLocal()
    try:
        pcr_engine = PcrRulesEngine(db_sess)
        pcr_evaluation = pcr_engine.evaluate_compliance(pcr_rule_id, results, extracted.get("bom", []))
    finally:
        db_sess.close()

    zip_bytes, filename, manifest = build_verification_bundle(
        extracted_data=extracted,
        results_payload=results,
        pcr_evaluation=pcr_evaluation,
        methodology=methodology
    )

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "X-Bundle-Hash": manifest["bundle_hash"],
        "X-Lineage-Hash": manifest["lineage_hash"],
        "X-Files-Count": str(manifest["file_count"])
    }

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers=headers
    )


# =========================================================================
# Verified Reference EPD (EPD11017) Export to PDF & Report Details API
# =========================================================================

@router.get("/report-details/{project_id}")
def get_report_details_endpoint(project_id: str, db: Session = Depends(get_db)):
    """
    Fetches persisted Report Details for a project, pre-filling with CompanyDefaults
    and project metadata where available.
    """
    from app.models import ReportDetails, CompanyDefaults, Project

    details = db.query(ReportDetails).filter(ReportDetails.project_id == project_id).first()
    if details:
        return {
            "company_name": details.company_name,
            "company_address": details.company_address,
            "company_logo": details.company_logo,
            "company_website": details.company_website,
            "description_of_company": details.description_of_company,
            "product_name": details.product_name,
            "product_description": details.product_description,
            "product_image": details.product_image,
            "csi_code": details.csi_code,
            "technical_data_bullets": details.technical_data_bullets or [],
            "intended_application": details.intended_application,
            "markets": details.markets,
            "declaration_number": details.declaration_number,
            "date_of_issue": details.date_of_issue,
            "validity_period": details.validity_period,
            "program_operator_name": details.program_operator_name,
            "program_operator_address": details.program_operator_address,
            "program_operator_website": details.program_operator_website,
            "program_operator_logo": details.program_operator_logo,
            "general_program_instructions": details.general_program_instructions,
            "reference_pcr": details.reference_pcr,
            "pcr_review_panel": details.pcr_review_panel or [],
            "lca_practitioner_name": details.lca_practitioner_name,
            "lca_practitioner_org": details.lca_practitioner_org,
            "is_verified": details.is_verified,
            "verification_type": details.verification_type,
            "verifier_name": details.verifier_name,
            "verifier_org": details.verifier_org,
            "verifier_email": details.verifier_email,
            "verifier_signature": details.verifier_signature,
            "limitations_text": details.limitations_text,
            "assumptions_limitations_text": details.assumptions_limitations_text,
            "hazardous_substances_statement": details.hazardous_substances_statement,
            "extra_references": details.extra_references or [],
            "save_as_company_defaults": details.save_as_company_defaults,
        }

    # If no details saved for this project, fetch company defaults or provide prefilled template
    defaults = db.query(CompanyDefaults).first()
    proj = db.query(Project).filter(Project.id == project_id).first()
    proj_name = proj.name if proj else "AquaEdge® 19DV Water-Cooled Centrifugal Chiller"

    return {
        "company_name": defaults.company_name if defaults else "Carrier Corporation",
        "company_address": defaults.company_address if defaults else "13995 Pasteur Boulevard\nPalm Beach Gardens, Florida 33418",
        "company_logo": defaults.company_logo if defaults else "",
        "company_website": defaults.company_website if defaults else "https://www.carrier.com",
        "description_of_company": defaults.description_of_company if defaults else "Carrier is the leading global provider of healthy, safe, and sustainable building and cold chain solutions with a world-class, diverse workforce. Through performance-driven culture, shareholder value is driven by growing earnings and investing strategically to strengthen its position in the market. Carrier’s industry leading solutions and services are designed to reduce energy consumption and facility operating costs in HVAC & Refrigeration.",
        "product_name": proj_name,
        "product_description": f"The {proj_name} is a water-cooled centrifugal chiller that utilizes a two-stage back-to-back compressor and an oil-free ceramic bearing system to deliver more operating range and consistent efficiency.",
        "product_image": "",
        "csi_code": "23 64 16.16",
        "technical_data_bullets": [
            "High tier variable speed starter equipped with harmonic filter (optional), total harmonic distortion (THD) ≤5% and fully complies with IEEE519 standard.",
            "AquaEdge® 19DV chillers can achieve up to 7.3 (0.4818 kW/Ton) full load COPR and 12.3 (0.2859 kW/Ton) IPLV.IP at AHRI conditions.",
            "AquaEdge® 19DV chillers can meet 18001 standards recommended by Occupational Health and Safety Advisory Services (OHSAS).",
            "ASME Section VIII Div. 1 “U” stamped certified.",
            "Certified in accordance with the AHRI Water-Cooled Water-Chilling and Heat Pump Water-Heating Packages Certification Program (AHRI Standard 550/590).",
            "Certified units may be found in the AHRI Directory at http://www.ahridirectory.org.",
        ],
        "intended_application": "The function of the chiller included within this study is to provide chilled water for use in cooling the interior of a building, for a functional unit of 1 ton chilling capacity.",
        "markets": "North America, Global",
        "declaration_number": f"EPD{datetime.now().strftime('%Y%m%d')}",
        "date_of_issue": datetime.now().strftime("%m/%d/%Y"),
        "validity_period": "5 Years from the date of issue",
        "program_operator_name": "NSF Certification, LLC",
        "program_operator_address": "789 North Dixboro Road, Ann Arbor, MI, 48105, United States",
        "program_operator_website": "https://www.nsf.org/",
        "program_operator_logo": "",
        "general_program_instructions": "Part A: Life Cycle Assessment Calculations and Report Requirements Version 4.0",
        "reference_pcr": "Part A: Life Cycle Assessment Calculation Rules and Report Requirements (UL Environment, V4.0, 2022)\nPart B: Water Cooled Chiller EPD Requirements (UL Environment V2.0, 2018)",
        "pcr_review_panel": [
            "Lise Laurin, EarthShift Global",
            "Sean Beilman, BCER Engineering, Inc.",
            "François Charron-Doucet, Group AGÉCO",
        ],
        "lca_practitioner_name": defaults.lca_practitioner_name if defaults else "Shashikumar M S, HCLTech",
        "lca_practitioner_org": defaults.lca_practitioner_org if defaults else "HCLTech",
        "is_verified": False,
        "verification_type": "EXTERNAL",
        "verifier_name": "Jack Geibig - EcoForm",
        "verifier_org": "EcoForm Certification",
        "verifier_email": "jgeibig@ecoform.com",
        "verifier_signature": "",
        "limitations_text": defaults.limitations_text if defaults else (
            "Environmental declarations from different programs (ISO 14025) may not be comparable.\n"
            "Comparison of the environmental performance of products using EPD information shall be based on the product’s use "
            "and impacts at the building level, and therefore EPDs may not be used for comparability purposes when not considering "
            "the building use phase as instructed under this PCR. Previous versions of the PCR vary in the prescribed default "
            "refrigerant leakage rate and do not necessitate the reporting of B4 impacts. These variations make it imperative to ensure "
            "that EPDs are aligned with all the following conformance requirements for comparisons.\n\n"
            "Full conformance with the PCR for Water Chillers allows EPD comparability only when all stages of a life cycle have been "
            "considered, when they comply with all referenced standards, use the same sub-category PCR, and use equivalent scenarios "
            "with respect to construction works. However, variations and deviations are possible. Example of variations: Different LCA software "
            "and background LCI datasets may lead to differences results for upstream or downstream of the life cycle stages declared.\n\n"
            "No use phase grid mix is explicitly defined by the PCR. As such, Carrier has elected to report multiple use phase electricity "
            "demand scenarios for increased reader utility. This reporting is described in the text of the EPD."
        ),
        "assumptions_limitations_text": defaults.assumptions_limitations_text if defaults else (
            "The use and selection of secondary datasets from Eco-Invent database. The selection of which generic dataset to use to represent an aspect of "
            "a supply chain is a significant value choice. However, no generic data can be a perfect fit. Improved supply chain specific data would improve the accuracy of results.\n\n"
            "Use phase calculations are based on default scenarios provided by an excel calculator sheet as described by the PCR and do not reflect actual consumption in a specific location.\n\n"
            "Availability of geographically more accurate datasets would have improved the accuracy of the study."
        ),
        "hazardous_substances_statement": "No substances required to be reported as hazardous according to the US Resources Conservation and Recovery Act, Subtitle 3 are associated with the production of this product.",
        "extra_references": [],
        "save_as_company_defaults": False,
    }


@router.post("/report-details/{project_id}")
def save_report_details_endpoint(
    project_id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Saves or updates Report Details for a project, optionally persisting company-level defaults.
    """
    from app.models import ReportDetails, CompanyDefaults, Project

    # Ensure project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        # Create lightweight project if not yet exists
        project = Project(id=project_id, name=payload.get("product_name", "EPD Project"))
        db.add(project)
        db.commit()

    details = db.query(ReportDetails).filter(ReportDetails.project_id == project_id).first()
    if not details:
        details = ReportDetails(project_id=project_id)
        db.add(details)

    # Assign fields
    fields = [
        "company_name", "company_address", "company_logo", "company_website",
        "description_of_company", "product_name", "product_description", "product_image",
        "csi_code", "technical_data_bullets", "intended_application", "markets",
        "declaration_number", "date_of_issue", "validity_period", "program_operator_name",
        "program_operator_address", "program_operator_website", "program_operator_logo",
        "general_program_instructions", "reference_pcr", "pcr_review_panel",
        "lca_practitioner_name", "lca_practitioner_org", "is_verified", "verification_type",
        "verifier_name", "verifier_org", "verifier_email", "verifier_signature",
        "limitations_text", "assumptions_limitations_text", "hazardous_substances_statement",
        "extra_references", "save_as_company_defaults"
    ]
    for field in fields:
        if field in payload:
            setattr(details, field, payload[field])

    # Save company defaults if requested
    if payload.get("save_as_company_defaults") and payload.get("company_name"):
        comp_name = payload["company_name"].strip()
        comp_def = db.query(CompanyDefaults).filter(CompanyDefaults.company_name == comp_name).first()
        if not comp_def:
            comp_def = CompanyDefaults(company_name=comp_name)
            db.add(comp_def)
        comp_def.company_address = payload.get("company_address")
        comp_def.company_logo = payload.get("company_logo")
        comp_def.company_website = payload.get("company_website")
        comp_def.description_of_company = payload.get("description_of_company")
        comp_def.lca_practitioner_name = payload.get("lca_practitioner_name")
        comp_def.lca_practitioner_org = payload.get("lca_practitioner_org")
        comp_def.limitations_text = payload.get("limitations_text")
        comp_def.assumptions_limitations_text = payload.get("assumptions_limitations_text")

    db.commit()
    return {"success": True, "message": "Report details saved successfully", "project_id": project_id}


