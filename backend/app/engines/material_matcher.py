"""
Assigns ecoinvent datasets to BOM lines and stage defaults by name.

Read-only: loads the parsed LCIA cache (.cache.pkl next to the ecoinvent
"Cut-off Cumulative LCIA" workbook) and never writes to that folder. When the
cache is not available, items are left unmatched so the existing seed fallback
in extract_ef_values still applies.

Matching order for a BOM line:
  1. already matched to an ecoinvent row by the user -> kept
  2. product material keyword library (app/products.py) -> exact activity name,
     best geography for the project region
  3. ranked free-text search on the line's material / name (kg datasets only)
"""

import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.products import ENERGY_DATASETS, get_product, material_rules

REPO_ROOT = Path(__file__).resolve().parents[3]
WORKBOOK_CANDIDATES = [
    REPO_ROOT / "Ecoinvent database" / "ecoinvent 3.12_cut-off_cumulative_lcia_xlsx" / "Cut-off Cumulative LCIA v3.12.xlsx",
    REPO_ROOT / "Cut-off Cumulative LCIA v3.12.xlsx",
    Path("/Users/parth/Desktop/final year project/Cut-off Cumulative LCIA v3.12.xlsx"),
    Path("/Users/parth/Desktop/Ecometric/Cut-off Cumulative LCIA v3.12.xlsx"),
]

META = ("META", "META", "META")
EUROPE = {"RER", "DE", "FR", "GB", "IT", "ES", "NL", "AT", "BE", "PL", "SE", "DK", "FI", "NO", "PT", "IE", "CZ"}
ROW_ID_RE = re.compile(r"^ecoinvent_row_(\d+)$")

REGION_ALIASES = {
    "us": "US", "usa": "US", "united states": "US", "us_average": "US", "north america": "US", "rna": "US",
    "ca": "CA", "canada": "CA",
    "eu": "RER", "europe": "RER", "eu_grid_mix": "RER", "rer": "RER",
    "in": "IN", "india": "IN", "india_grid": "IN",
    "cn": "CN", "china": "CN", "china_grid": "CN",
    "br": "BR", "brazil": "BR",
    "de": "DE", "germany": "DE", "fr": "FR", "france": "FR", "gb": "GB", "uk": "GB",
    "ae": "AE", "uae": "AE", "uae_dubai_grid": "AE",
    "glo": "GLO", "global": "GLO", "": "GLO",
}


@lru_cache(maxsize=1)
def _load_table():
    """Returns a compact metadata DataFrame (row index = ecoinvent row) or None."""
    try:
        import pandas as pd
    except ImportError:
        return None
    env_path = os.getenv("ECOINVENT_LCIA_XLSX")
    candidates = ([Path(env_path)] if env_path else []) + WORKBOOK_CANDIDATES
    for wb in candidates:
        cache = Path(str(wb) + ".cache.pkl")
        if cache.exists():
            try:
                data = pd.read_pickle(cache)
            except Exception:
                continue
            meta = pd.DataFrame({
                "activity": data[META + ("Activity Name",)].astype(str),
                "geo": data[META + ("Geography",)].astype(str),
                "product": data[META + ("Reference Product Name",)].astype(str),
                "unit": data[META + ("Reference Product Unit",)].astype(str),
            }, index=data.index)
            meta["activity_l"] = meta["activity"].str.lower()
            meta["product_l"] = meta["product"].str.lower()
            return meta
    return None


def database_available() -> bool:
    return _load_table() is not None


def row_reference_unit(row: int) -> Optional[str]:
    """Reference unit of an ecoinvent row (e.g. 'kg', 'kWh', 'metric ton*km'), if the database is loaded."""
    t = _load_table()
    if t is None or row not in t.index:
        return None
    return t.at[row, "unit"]


def normalize_region(value: Optional[str]) -> str:
    v = (value or "").strip()
    return REGION_ALIASES.get(v.lower(), v.upper() if len(v) <= 3 else "GLO")


def project_region(extracted: Dict[str, Any]) -> str:
    info = extracted.get("project_info") or {}
    mfg = extracted.get("manufacturing") or {}
    return normalize_region(info.get("geography") or mfg.get("grid_region") or "GLO")


def _geo_order(preferred: List[str], region: str) -> List[str]:
    order = []
    if region and region != "GLO":
        order.append(region)
        if region in EUROPE:
            order += ["RER", "Europe without Switzerland"]
    order += preferred + ["GLO", "RoW", "RER", "Europe without Switzerland"]
    seen, out = set(), []
    for g in order:
        if g not in seen:
            seen.add(g)
            out.append(g)
    return out


def _row_payload(idx: int, method: str, query: str) -> Dict[str, Any]:
    t = _load_table()
    r = t.loc[idx]
    return {
        "provider_id": f"ecoinvent_row_{int(idx)}",
        "ecoinvent_row": int(idx),
        "activity_name": r["activity"],
        "geography": r["geo"],
        "reference_product_name": r["product"],
        "reference_unit": r["unit"],
        "match_method": method,
        "match_query": query,
    }


def resolve_dataset(dataset: Optional[Dict[str, Any]], region: str = "GLO",
                    method: str = "pcr_default") -> Optional[Dict[str, Any]]:
    """Exact activity-name lookup with geography preference."""
    t = _load_table()
    if t is None or not dataset:
        return None
    name = dataset["activity"].lower()
    rows = t[t["activity_l"] == name]
    if dataset.get("product"):
        rows = rows[rows["product_l"] == dataset["product"].lower()]
    if rows.empty:
        return None
    for g in _geo_order(dataset.get("geos", []), region):
        hit = rows[rows["geo"] == g]
        if not hit.empty:
            return _row_payload(hit.index[0], method, dataset["activity"])
    return _row_payload(rows.index[0], method, dataset["activity"])


def _clean_query(text: str) -> List[str]:
    words = re.sub(r"[^a-z0-9 ]", " ", (text or "").lower()).split()
    stop = {"the", "and", "of", "for", "with", "a", "an", "kg", "mm", "m", "unit", "part", "assembly", "component"}
    return [w for w in words if len(w) > 2 and w not in stop]


def search_dataset(query: str, region: str = "GLO", unit: str = "kg") -> Optional[Dict[str, Any]]:
    """Ranked free-text search over activity / reference product names."""
    t = _load_table()
    words = _clean_query(query)
    if t is None or not words:
        return None
    pool = t[t["unit"] == unit] if unit else t
    mask = None
    for w in words:
        m = pool["activity_l"].str.contains(w, regex=False) | pool["product_l"].str.contains(w, regex=False)
        mask = m if mask is None else (mask & m)
    hits = pool[mask]
    if hits.empty and len(words) > 1:
        # fall back to the longest word only
        w = max(words, key=len)
        hits = pool[pool["activity_l"].str.contains(w, regex=False) | pool["product_l"].str.contains(w, regex=False)]
    if hits.empty:
        return None
    phrase = " ".join(words)
    geo_rank = {g: i for i, g in enumerate(_geo_order([], region))}

    def score(i):
        r = hits.loc[i]
        s = 0.0
        if r["product_l"] == phrase:
            s += 100
        elif r["product_l"].startswith(phrase):
            s += 60
        elif phrase in r["product_l"]:
            s += 40
        if r["activity_l"].startswith("market for"):
            s += 30
        elif r["activity_l"].startswith("market group for"):
            s += 20
        if "recycled" in r["product_l"] or "waste" in r["product_l"] or "scrap" in r["product_l"]:
            s -= 25
        s += max(0, 12 - geo_rank.get(r["geo"], 12))
        s -= min(len(r["product_l"]), 80) * 0.2
        return s

    best = max(hits.index, key=score)
    return _row_payload(best, "name_search", query)


def match_material(name: str, material: str, product_id: Optional[str], region: str = "GLO") -> Optional[Dict[str, Any]]:
    text = f"{name or ''} {material or ''}".lower()
    for rule in material_rules(product_id):
        if any(k in text for k in rule["keywords"]):
            req = rule.get("requires")
            if req and not any(k in text for k in req):
                continue
            hit = resolve_dataset(rule["dataset"], region, method="material_library")
            if hit:
                hit["match_query"] = f"{rule['keywords'][0]} -> {rule['dataset']['activity']}"
                return hit
    for q in (material, name):
        if q and q.strip():
            hit = search_dataset(q, region)
            if hit:
                return hit
    return None


def assign_bom_providers(bom: List[Dict[str, Any]], product_id: Optional[str], region: str = "GLO",
                         overwrite: bool = False) -> Dict[str, int]:
    """Mutates BOM items in place. Returns counts of matched / kept / unmatched."""
    stats = {"matched": 0, "kept": 0, "unmatched": 0}
    if not database_available():
        stats["unmatched"] = len(bom)
        return stats
    for item in bom:
        current = str(item.get("provider_id") or item.get("ecoinvent_id") or "")
        if not overwrite and ROW_ID_RE.match(current) and item.get("ecoinvent_matched"):
            stats["kept"] += 1
            continue
        hit = match_material(item.get("name", ""), item.get("material", ""), product_id, region)
        if not hit:
            stats["unmatched"] += 1
            item["ecoinvent_matched"] = False
            continue
        item.update({
            "provider_id": hit["provider_id"],
            "ecoinvent_id": hit["provider_id"],
            "ecoinvent_row": hit["ecoinvent_row"],
            "dataset": f"{hit['activity_name']} [{hit['geography']}]",
            "reference_product_name": hit["reference_product_name"],
            "reference_unit": hit["reference_unit"],
            "ecoinvent_geography": hit["geography"],
            "ecoinvent_matched": True,
            "match_method": hit["match_method"],
            "match_query": hit["match_query"],
        })
        stats["matched"] += 1
    return stats


def default_provider(kind: str, region: str = "GLO") -> Optional[Dict[str, Any]]:
    """Resolves a default energy / water / transport dataset for a region."""
    spec = ENERGY_DATASETS.get(kind)
    if spec is None:
        return None
    if kind == "electricity":
        if region in spec:
            return resolve_dataset(spec[region], region)
        hit = resolve_dataset({"activity": spec["_country"], "geos": [region]}, region)
        if hit and hit["geography"] == region:
            return hit
        return resolve_dataset(spec["GLO"], "GLO")
    if kind == "train":
        return resolve_dataset(spec.get(region) or spec["_default"], region)
    return resolve_dataset(spec, region)


def product_dataset(product_id: Optional[str], group: str, key: str, region: str = "GLO") -> Optional[Dict[str, Any]]:
    """End-of-life ('eol_datasets') or module D ('d_datasets') dataset for a product."""
    p = get_product(product_id)
    table = p.get(group) or {}
    return resolve_dataset(table.get(key), region) if table.get(key) else None
