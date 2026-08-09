import json
import os
from typing import Dict, Any

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "emission_factors.json")

def load_emission_factors() -> Dict[str, Any]:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def get_material_factor(material_key: str) -> float:
    data = load_emission_factors()
    mat = data.get("materials", {}).get(material_key, {})
    return float(mat.get("gwp_kg_co2e_per_unit", 2.5))

def get_refrigerant_gwp(refrigerant_type: str) -> float:
    data = load_emission_factors()
    ref = data.get("refrigerants", {}).get(refrigerant_type, {})
    return float(ref.get("gwp_ar5", 1430.0))

def get_grid_emission_factor(grid_key: str = "US_Average") -> float:
    data = load_emission_factors()
    grid = data.get("electricity_grids", {}).get(grid_key, {})
    return float(grid.get("gwp_kg_co2e_per_kwh", 0.385))

def get_transport_factor(mode_key: str = "lorry >32t") -> float:
    data = load_emission_factors()
    mode = data.get("transport_modes", {}).get(mode_key, {})
    return float(mode.get("gwp_kg_co2e_per_tkm", 0.088))
