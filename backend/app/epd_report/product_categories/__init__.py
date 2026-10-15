"""
Product category profiles: everything that differs between product types
(functional unit wording, PCR, default modules, scenario sections, technical
data fields, charts, narrative overrides). Unknown ids fall back to 'generic'.
"""

from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..registry.loader import load_entries

_HERE = Path(__file__).resolve().parent
FALLBACK_ID = "generic"

# Blocks of EpdReportInput whose content is specific to the product category the
# data was entered for. When the selected category differs from the data's
# category these are not carried over (manufacturer, program operator,
# verification etc. always are).
CATEGORY_BOUND_FIELDS = ("functional_unit", "scenarios", "modules", "material_composition", "packaging",
                         "technical_data", "dimensions", "material_contribution", "supplemental_results")


@lru_cache(maxsize=1)
def _profiles() -> Dict[str, Dict[str, Any]]:
    return {p["id"]: p for p in load_entries(_HERE / "profiles", "PROFILE")}


def get_profile(category_id: Optional[str]) -> Dict[str, Any]:
    profiles = _profiles()
    return profiles.get(category_id or FALLBACK_ID) or profiles[FALLBACK_ID]


def list_profiles() -> List[Dict[str, Any]]:
    return [{"id": p["id"], "name": p.get("name", p["id"]),
             "defaultMethods": p.get("defaultMethods", []), "defaultStandard": p.get("defaultStandard")}
            for p in _profiles().values()]
