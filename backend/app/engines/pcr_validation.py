import json
import os
from typing import Dict, Any, List

PCR_RULES_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "pcr_rules.json")

def load_pcr_rules() -> Dict[str, Any]:
    with open(PCR_RULES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def validate_chiller_inputs(data: Dict[str, Any]) -> Dict[str, Any]:
    rules = load_pcr_rules()
    errors: List[str] = []
    warnings: List[str] = []

    capacity_rt = float(data.get("chilling_capacity_rt", 0))
    if capacity_rt <= 0:
        errors.append("Chilling capacity must be greater than 0 RT.")

    kw_per_ton = float(data.get("efficiency_kw_per_ton", 0))
    if kw_per_ton <= 0 or kw_per_ton > 2.0:
        errors.append("Full-load efficiency (kW/ton) must be between 0.1 and 2.0 kW/ton.")

    refrigerant_charge = float(data.get("refrigerant_charge_kg", 0))
    if refrigerant_charge <= 0:
        errors.append("Refrigerant charge mass must be greater than 0 kg.")

    target_cities = data.get("target_cities", [])
    if not target_cities:
        warnings.append("No target deployment cities selected; default 50-city bin hours will be used.")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "pcr_ref": rules.get("pcr_name", "UL 10010-4 Part B v2.0 (2018)"),
        "total_modules_count": rules.get("total_modules_count", 16)
    }
