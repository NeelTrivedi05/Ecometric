"""Report templates: section order, inclusion and page orientation."""

from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

from ..registry.loader import load_entries

_HERE = Path(__file__).resolve().parent


@lru_cache(maxsize=1)
def _templates() -> Dict[str, Dict[str, Any]]:
    return {t["id"]: t for t in load_entries(_HERE, "TEMPLATE")}


def get_template(template_id: str = "default") -> Dict[str, Any]:
    t = _templates()
    if template_id not in t:
        raise KeyError(f"unknown report template '{template_id}' (available: {sorted(t)})")
    return t[template_id]


def apply_overrides(template: Dict[str, Any], overrides: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Applies a product profile's {'exclude': [...], 'order': [...]} to the template's section list."""
    sections = [dict(s) for s in template["sections"] if s.get("include", True)]
    exclude = set((overrides or {}).get("exclude", []))
    sections = [s for s in sections if s["id"] not in exclude]
    order = (overrides or {}).get("order")
    if order:
        pos = {sid: i for i, sid in enumerate(order)}
        sections.sort(key=lambda s: pos.get(s["id"], len(pos)))
    return sections
