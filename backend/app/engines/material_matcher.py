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

from app.products import ENERGY_DATASETS, get_product, is_chiller, material_rules

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

# match_method values. A user's choice is never replaced; automatic picks are refreshed on request.
USER_SELECTED = "user_selected"
AUTO_DEFAULT = "auto_default"                      # stage default (energy, water, transport, EOL, D)
AUTO_METHODS = {"material_library", "name_search", AUTO_DEFAULT}
BOM_PROVIDER_KEYS = ("provider_id", "ecoinvent_id", "ecoinvent_row", "dataset", "reference_product_name",
                     "reference_unit", "ecoinvent_geography", "match_method", "match_query")

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
                    method: str = "pcr_default", unit: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Exact activity-name lookup with geography preference. For multi-output activities without an
    explicit product, `unit` picks the output the input is measured in (e.g. the kg waste-treatment
    output of an incineration activity, not its kWh electricity co-product).
    """
    t = _load_table()
    if t is None or not dataset:
        return None
    name = dataset["activity"].lower()
    rows = t[t["activity_l"] == name]
    if dataset.get("product"):
        rows = rows[rows["product_l"] == dataset["product"].lower()]
    elif unit and rows["unit"].nunique() > 1 and (rows["unit"] == unit).any():
        rows = rows[rows["unit"] == unit]
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


# Waste flows and by-products: only what the user wants when the query says so. Recycled-content
# products such as "steel, structural, 100% scrap" are materials, not waste.
WASTE_PRODUCT_RE = r"^(?:waste|used|spent|scrap)\b|\b(?:slag|sludge|residue|ash)\b|(?<!100% )\bscrap\b"
WASTE_QUERY_WORDS = ("waste", "scrap", "used", "recycl", "treatment", "landfill", "incinerat",
                     "slag", "sludge", "disposal", "cullet", "sorting")


def rank_datasets(query: str, region: str = "GLO", unit: Optional[str] = None, limit: int = 50,
                  strict_unit: bool = False, allow_waste: bool = True) -> List[Dict[str, Any]]:
    """
    Ranked free-text search over activity / reference product names (one ranking for the automatic
    matcher and the provider pickers). Prefers: the phrase as the product name, market activities,
    the expected reference unit, the project region; demotes waste / treatment rows unless the query
    asks for them (allow_waste=False drops them). strict_unit keeps only rows in `unit`.
    """
    import pandas as pd
    t = _load_table()
    words = _clean_query(query)
    if t is None or not words:
        return []
    pool = t[t["unit"] == unit] if (unit and strict_unit) else t

    hits_per_word = [
        pool["activity_l"].str.contains(w, regex=False) | pool["product_l"].str.contains(w, regex=False)
        for w in words
    ]
    word_hits = sum(h.astype(int) for h in hits_per_word)
    if (word_hits == len(words)).any():
        hits = pool[word_hits == len(words)]
    elif word_hits.max() > 0:
        hits = pool[word_hits == word_hits.max()]     # best partial match, not one arbitrary word
    else:
        return []

    phrase = " ".join(words)
    product, activity = hits["product_l"], hits["activity_l"]
    plain = product.str.replace(r"[^a-z0-9 ]", " ", regex=True).str.split().str.join(" ")
    score = pd.Series(0.0, index=hits.index)
    exact = plain == phrase
    variant = ~exact & product.str.startswith(phrase + ",")          # "copper, cathode" for "copper"
    starts = ~exact & ~variant & plain.str.startswith(phrase)         # "copper cake"
    score += exact * 100 + variant * 70 + starts * 40
    score += (~exact & ~variant & ~starts & plain.str.contains(phrase, regex=False)) * 25
    score += activity.str.startswith("market for") * 30
    score += activity.str.startswith("market group for") * 20
    waste_like = None
    if not any(w in query.lower() for w in WASTE_QUERY_WORDS):
        waste_like = product.str.contains(WASTE_PRODUCT_RE, regex=True) | activity.str.startswith("treatment of")
        score -= waste_like * 80
    if unit:
        # a different unit usually means another kind of thing (the ship, not the freight service)
        score += (hits["unit"] == unit) * 60 - (hits["unit"] != unit) * 40
    geo_rank = {g: i for i, g in enumerate(_geo_order([], region))}
    score += hits["geo"].map(lambda g: max(0, 12 - geo_rank.get(g, 12)))
    score -= product.str.len().clip(upper=80) * 0.2

    if waste_like is not None and not allow_waste:
        score = score[~waste_like]
    order = score.sort_values(ascending=False, kind="stable").index[:limit]
    return [_row_payload(i, "name_search", query) for i in order]


def search_dataset(query: str, region: str = "GLO", unit: str = "kg") -> Optional[Dict[str, Any]]:
    """Best dataset for a free-text material name (reference unit `unit` only)."""
    # an automatic pick is never a waste flow: no real match is better left for the user
    hits = rank_datasets(query, region, unit, limit=1, strict_unit=True, allow_waste=False)
    return hits[0] if hits else None


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


def _bom_line_locked(item: Dict[str, Any], overwrite: bool) -> bool:
    """True when a BOM line's dataset must be kept: the user picked it, or it came with the document."""
    if item.get("match_method") == USER_SELECTED:
        return True
    current = str(item.get("provider_id") or item.get("ecoinvent_id") or "")
    if not (ROW_ID_RE.match(current) and item.get("ecoinvent_matched")):
        return False
    # overwrite refreshes automatic matches only; datasets stated in the document are kept
    return not overwrite or item.get("match_method") not in AUTO_METHODS


def assign_bom_providers(bom: List[Dict[str, Any]], product_id: Optional[str], region: str = "GLO",
                         overwrite: bool = False) -> Dict[str, int]:
    """Mutates BOM items in place. Returns counts of matched / kept / unmatched."""
    stats = {"matched": 0, "kept": 0, "unmatched": 0}
    if not database_available():
        stats["unmatched"] = len(bom)
        return stats
    for item in bom:
        if _bom_line_locked(item, overwrite):
            stats["kept"] += 1
            continue
        hit = match_material(item.get("name", ""), item.get("material", ""), product_id, region)
        if not hit:
            stats["unmatched"] += 1
            if item.get("match_method") in AUTO_METHODS:
                # an earlier automatic match no longer fits the line's name - don't calculate with it
                for k in BOM_PROVIDER_KEYS:
                    item.pop(k, None)
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
    # end-of-life treatment and module D are applied per kg of product
    return resolve_dataset(table.get(key), region, unit="kg") if table.get(key) else None


# ---------------------------------------------------------------------------
# Stage providers (A2-A5, B, C, D): one dataset per input field
# ---------------------------------------------------------------------------

# (block, provider field, default kind). Kinds resolve through ENERGY_DATASETS.
STAGE_DEFAULT_FIELDS = [
    ("manufacturing", "electricity_provider_id", "electricity"),
    ("manufacturing", "gas_provider_id", "natural_gas"),
    ("manufacturing", "water_provider_id", "water"),
    ("installation", "outbound_provider_id", "lorry"),
    ("installation", "installation_energy_provider_id", "electricity"),
    ("installation", "consumable_provider_id", "diesel_machine"),
    ("operational", "energy_provider_id", "electricity"),
    ("operational", "water_provider_id", "water"),
    ("end_of_life", "deconstruction_provider_id", "diesel_machine"),
    ("end_of_life", "waste_transport_provider_id", "waste_lorry"),
]

# (block, provider field, product dataset group, key)
STAGE_PRODUCT_FIELDS = [
    ("end_of_life", "recycling_process_provider_id", "eol_datasets", "recycling"),
    ("end_of_life", "incineration_process_provider_id", "eol_datasets", "incineration"),
    ("end_of_life", "landfill_process_provider_id", "eol_datasets", "landfill"),
    ("circularity_d", "virgin_material_provider_id", "d_datasets", "virgin"),
    ("circularity_d", "recycled_process_provider_id", "d_datasets", "recycled"),
]

# (block, name fields used to match by name, chiller default: ("kind", ENERGY_DATASETS key) or ("material", text))
STAGE_NAMED_FIELDS = [
    ("maintenance_b2", ("consumable_name",), ("kind", "lubricating_oil")),
    ("repair_b3", ("replaced_part_name", "material_type"), ("material", "steel")),
    ("refurbishment_b5", ("material_name",), ("material", "copper")),
]


def meta_key(field: str, suffix: str) -> str:
    """Key holding a provider's dataset / reference_unit / match_method next to its id field."""
    return suffix if field == "provider_id" else f"{field}_{suffix}"


def transport_kind(mode: Optional[str]) -> str:
    m = str(mode or "").lower()
    if any(w in m for w in ("ship", "sea", "ocean", "vessel", "barge")):
        return "ship"
    if any(w in m for w in ("rail", "train")):
        return "train"
    return "lorry"


def _stage_field_locked(block: Dict[str, Any], field: str, overwrite: bool) -> bool:
    pid = block.get(field)
    if not pid:
        return False
    method = block.get(meta_key(field, "match_method"))
    if method == USER_SELECTED:
        return True
    if method == AUTO_DEFAULT:
        return not overwrite
    # an ecoinvent row stated in the document is kept; legacy slug ids are re-resolved
    return bool(ROW_ID_RE.match(str(pid)))


def _apply_hit(block: Dict[str, Any], field: str, hit: Dict[str, Any]):
    block[field] = hit["provider_id"]
    block[meta_key(field, "dataset")] = f"{hit['activity_name']} [{hit['geography']}]"
    block[meta_key(field, "reference_unit")] = hit["reference_unit"]
    block[meta_key(field, "match_method")] = AUTO_DEFAULT


def _describe_kept(block: Dict[str, Any], field: str):
    """Adds the dataset name / unit to a kept ecoinvent row that arrived without them."""
    m = ROW_ID_RE.match(str(block.get(field) or ""))
    t = _load_table()
    if not m or t is None or int(m.group(1)) not in t.index or block.get(meta_key(field, "dataset")):
        return
    r = t.loc[int(m.group(1))]
    block[meta_key(field, "dataset")] = f"{r['activity']} [{r['geo']}]"
    block[meta_key(field, "reference_unit")] = block.get(meta_key(field, "reference_unit")) or r["unit"]


def _assign(block: Dict[str, Any], field: str, resolve, overwrite: bool, stats: Dict[str, int]):
    if _stage_field_locked(block, field, overwrite):
        _describe_kept(block, field)
        stats["kept"] += 1
        return
    hit = resolve()
    if hit:
        _apply_hit(block, field, hit)
        stats["matched"] += 1
    else:
        stats["unmatched"] += 1


def assign_stage_providers(extracted: Dict[str, Any], product_id: Optional[str], region: Optional[str] = None,
                           overwrite: bool = False) -> Dict[str, int]:
    """
    Picks the default ecoinvent dataset for every stage input (transport legs, energy, water,
    end-of-life, module D, B2/B3/B5 materials). Mutates `extracted` in place. User choices are
    never replaced; overwrite=True refreshes earlier automatic picks (e.g. after a region change).
    """
    stats = {"matched": 0, "kept": 0, "unmatched": 0}
    if not database_available():
        return stats
    region = region or project_region(extracted)
    product = get_product(product_id)
    chiller = is_chiller(product_id)

    for leg in extracted.get("transport") or []:
        if not leg.get("provider_id") and leg.get("ecoinvent_id"):
            leg["provider_id"] = leg["ecoinvent_id"]
        _assign(leg, "provider_id", lambda leg=leg: default_provider(transport_kind(leg.get("mode")), region),
                overwrite, stats)

    waste_kind = "lorry" if product["pcr"]["program_operator"] == "UL Environment" else "lorry_16_32"
    for block_key, field, kind in STAGE_DEFAULT_FIELDS:
        block = extracted.setdefault(block_key, {})
        k = waste_kind if kind == "waste_lorry" else kind
        _assign(block, field, lambda k=k: default_provider(k, region), overwrite, stats)

    for block_key, field, group, key in STAGE_PRODUCT_FIELDS:
        if not (product.get(group) or {}).get(key):
            continue   # e.g. products without a module D scenario
        block = extracted.setdefault(block_key, {})
        _assign(block, field, lambda g=group, k=key: product_dataset(product_id, g, k, region), overwrite, stats)

    for block_key, name_fields, chiller_default in STAGE_NAMED_FIELDS:
        block = extracted.get(block_key)
        if block is None:
            if not chiller:
                continue
            block = extracted.setdefault(block_key, {})
        label = " ".join(str(block.get(f) or "") for f in name_fields).strip()
        if label:
            resolve = lambda label=label, b=block: match_material(label, b.get("material_type", ""), product_id, region)
        elif chiller and chiller_default[0] == "kind":
            resolve = lambda k=chiller_default[1]: default_provider(k, region)
        elif chiller:
            resolve = lambda t=chiller_default[1]: match_material(t, "", product_id, region)
        else:
            continue
        _assign(block, "provider_id", resolve, overwrite, stats)

    return stats
