"""Compatibility helpers backed exclusively by the Supabase reference store."""

import re
from typing import Dict, Any, List, Optional

from app.engines import lca_store


def _gwp_code() -> str:
    for code, _method, _category, indicator, _unit in lca_store.indicators():
        if indicator and "global warming" in indicator.lower():
            return code
    raise lca_store.IndicatorNotFound("No global-warming indicator is present in Supabase")


def search_ecoinvent_activities(query: str = "", category: Optional[str] = None) -> List[Dict[str, Any]]:
    search = f"{query} {category or ''}".strip()
    return [
        {
            "activity_key": f"ecoinvent_row_{item['row_index']}",
            "id": f"ecoinvent_row_{item['row_index']}",
            "name": item["activity_name"],
            "category": category,
            "geography": item["geography"],
            "unit": item["reference_unit"],
        }
        for item in lca_store.search(search, limit=200)
    ]


def get_activity_lcia(activity_key: str, methodology: str = "ef31") -> Dict[str, float]:
    row = lca_store.provider_row(activity_key)
    values = lca_store.impact_values([row], [_gwp_code()]).get(row, {})
    if not values:
        raise lca_store.ProviderNotFound(f"No LCIA values are stored for {activity_key}")
    return {"GWP-total": float(next(iter(values.values())))}


def _factor(query: str) -> float:
    hit = lca_store.search(query, unit="kg", limit=1)
    if not hit:
        raise lca_store.ProviderNotFound(f"No Supabase ecoinvent activity matched '{query}'")
    values = get_activity_lcia(f"ecoinvent_row_{hit[0]['row_index']}")
    return values["GWP-total"]


def get_material_factor(material_key: str, methodology: str = "ef31") -> float:
    return _factor(re.sub(r"[_-]+", " ", material_key))


def get_refrigerant_gwp(refrigerant_type: str, methodology: str = "ef31") -> float:
    return _factor(refrigerant_type)


def get_grid_emission_factor(grid_key: str = "US_Average", methodology: str = "ef31") -> float:
    return _factor(f"electricity medium voltage {grid_key}")


def get_transport_factor(mode_key: str = "lorry >32t", methodology: str = "ef31") -> float:
    hit = lca_store.search(f"transport {mode_key}", unit="tkm", limit=1)
    if not hit:
        raise lca_store.ProviderNotFound(f"No Supabase transport activity matched '{mode_key}'")
    return get_activity_lcia(f"ecoinvent_row_{hit[0]['row_index']}")["GWP-total"]
