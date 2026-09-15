import json
import os
from typing import Dict, Any, List, Optional

SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "ecoinvent_seed.json")
LEGACY_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "emission_factors.json")

_seed_cache: Optional[Dict[str, Any]] = None
_legacy_cache: Optional[Dict[str, Any]] = None

def load_seed_database() -> Dict[str, Any]:
    global _seed_cache
    if _seed_cache is None:
        if os.path.exists(SEED_PATH):
            with open(SEED_PATH, "r", encoding="utf-8") as f:
                _seed_cache = json.load(f)
        else:
            _seed_cache = {"activities": {}}
    return _seed_cache

def load_legacy_factors() -> Dict[str, Any]:
    global _legacy_cache
    if _legacy_cache is None:
        if os.path.exists(LEGACY_PATH):
            with open(LEGACY_PATH, "r", encoding="utf-8") as f:
                _legacy_cache = json.load(f)
        else:
            _legacy_cache = {}
    return _legacy_cache

def search_ecoinvent_activities(query: str = "", category: Optional[str] = None) -> List[Dict[str, Any]]:
    seed = load_seed_database()
    activities = seed.get("activities", {})
    results = []
    q = query.lower().strip()
    
    for key, item in activities.items():
        name = item.get("name", "").lower()
        cat = item.get("category", "").lower()
        if category and category.lower() not in cat:
            continue
        if not q or q in name or q in cat or q in key:
            results.append({
                "activity_key": key,
                "id": item.get("id"),
                "name": item.get("name"),
                "category": item.get("category"),
                "geography": item.get("geography"),
                "unit": item.get("unit"),
                "gwp_ef31": item.get("lcia", {}).get("ef31", {}).get("GWP-total", 0.0)
            })
    return results

def get_activity_lcia(activity_key: str, methodology: str = "ef31") -> Dict[str, float]:
    seed = load_seed_database()
    act = seed.get("activities", {}).get(activity_key)
    method_key = methodology.lower().replace(" ", "").replace("-", "").replace(".", "")
    if "recipe" in method_key:
        method_norm = "recipe2016"
    elif "cml" in method_key:
        method_norm = "cml2016"
    elif "traci" in method_key:
        method_norm = "traci21"
    else:
        method_norm = "ef31"
        
    if act and "lcia" in act:
        return act["lcia"].get(method_norm, act["lcia"].get("ef31", {}))
    return {}

def get_material_factor(material_key: str, methodology: str = "ef31") -> float:
    # Direct seed lookup
    lcia = get_activity_lcia(material_key, methodology)
    if "GWP-total" in lcia:
        return float(lcia["GWP-total"])
    
    # Common mappings
    mapping = {
        "steel_enclosure": "steel_hot_rolled",
        "copper_coils": "copper_tube_wire",
        "compressor_motor": "electric_motor_industrial",
        "insulation_puf": "insulation_polyurethane_rigid",
        "electronics_vfd": "electronics_vfd"
    }
    mapped_key = mapping.get(material_key)
    if mapped_key:
        lcia = get_activity_lcia(mapped_key, methodology)
        if "GWP-total" in lcia:
            return float(lcia["GWP-total"])

    # Fallback to legacy
    legacy = load_legacy_factors()
    mat = legacy.get("materials", {}).get(material_key, {})
    return float(mat.get("gwp_kg_co2e_per_unit", 2.5))

def get_refrigerant_gwp(refrigerant_type: str, methodology: str = "ef31") -> float:
    ref_norm = refrigerant_type.lower().replace("-", "")
    key = "refrigerant_r134a" if "134" in ref_norm else "refrigerant_r1234ze" if "1234" in ref_norm else None
    if key:
        lcia = get_activity_lcia(key, methodology)
        if "GWP-total" in lcia:
            return float(lcia["GWP-total"])

    legacy = load_legacy_factors()
    ref = legacy.get("refrigerants", {}).get(refrigerant_type, {})
    return float(ref.get("gwp_ar5", 1430.0))

def get_grid_emission_factor(grid_key: str = "US_Average", methodology: str = "ef31") -> float:
    grid_norm = grid_key.lower()
    key = "grid_electricity_germany" if "de" in grid_norm or "germany" in grid_norm else "grid_electricity_france" if "fr" in grid_norm or "france" in grid_norm else "grid_electricity_us_average"
    lcia = get_activity_lcia(key, methodology)
    if "GWP-total" in lcia:
        return float(lcia["GWP-total"])

    legacy = load_legacy_factors()
    grid = legacy.get("electricity_grids", {}).get(grid_key, {})
    return float(grid.get("gwp_kg_co2e_per_kwh", 0.385))

def get_transport_factor(mode_key: str = "lorry >32t", methodology: str = "ef31") -> float:
    mode_norm = mode_key.lower()
    key = "transport_container_ship" if "ship" in mode_norm or "sea" in mode_norm else "transport_lorry_32t"
    lcia = get_activity_lcia(key, methodology)
    if "GWP-total" in lcia:
        return float(lcia["GWP-total"])

    legacy = load_legacy_factors()
    mode = legacy.get("transport_modes", {}).get(mode_key, {})
    return float(mode.get("gwp_kg_co2e_per_tkm", 0.088))
