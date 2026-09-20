"""
extract_ef_values.py

Purpose
-------
Reads your EPD calculation input JSON (e.g. epd_calculation_input.json)
and your ecoinvent "LCIA Implementation" Excel file, and extracts the
emission factor (EF) value for every provider referenced in the JSON,
across EVERY impact category in the Excel (not just one).
"""

import argparse
import json
import re
import sys
from pathlib import Path

import pandas as pd

SHEET_NAME = "LCIA"
HEADER_ROWS = 4          # rows 0-3 (0-indexed) are the stacked headers
N_METADATA_COLS = 6      # Activity UUID_Product UUID .. Reference Product Amount

KNOWN_GEO_CODES = {
    "glo", "row", "rer", "us", "eu", "de", "cn", "in", "gb", "fr",
    "jp", "ca", "br", "au", "ww", "rna", "raf", "ras", "rla",
}

STOPWORDS = {
    "ecoinvent", "provider", "process", "the", "and", "of", "for",
    "a", "in", "with", "kg", "glo",
}


METHODOLOGY_MAP = {
    "cml_v4_8_2016": "CML v4.8 2016",
    "cml2016": "CML v4.8 2016",
    "cml_v4_8_2016_no_lt": "CML v4.8 2016 no LT",
    "crustal_scarcity_2020": "Crustal Scarcity Indicator 2020",
    "ced": "Cumulative Energy Demand (CED)",
    "cexd": "Cumulative Exergy Demand (CExD)",
    "ef_v3_0": "EF v3.0",
    "ef_v3_0_no_lt": "EF v3.0 no LT",
    "ef_v3_1": "EF v3.1",
    "ef31": "EF v3.1",
    "ef_v3_1_no_lt": "EF v3.1 no LT",
    "eps_2020d": "EPS 2020d",
    "eps_2020d_no_lt": "EPS 2020d no LT",
    "ecological_footprint": "Ecological Footprint",
    "ecological_scarcity_2021": "Ecological Scarcity 2021",
    "ecological_scarcity_2021_no_lt": "Ecological Scarcity 2021 no LT",
    "ecosystem_damage_potential": "Ecosystem Damage Potential",
    "impact_world_plus": "IMPACT World+ v2.1, footprint version",
    "ipcc_2013": "IPCC 2013",
    "ipcc_2013_no_lt": "IPCC 2013 no LT",
    "ipcc_2021": "IPCC 2021",
    "ipcc_2021_incl_biogenic": "IPCC 2021 (incl. biogenic CO2)",
    "ipcc_2021_incl_biogenic_no_lt": "IPCC 2021 (incl. biogenic CO2) no LT",
    "ipcc_2021_no_lt": "IPCC 2021 no LT",
    "inventory_results": "Inventory results and indicators",
    "recipe_2016_endpoint_e": "ReCiPe 2016 v1.03, endpoint (E)",
    "recipe_2016_endpoint_e_no_lt": "ReCiPe 2016 v1.03, endpoint (E) no LT",
    "recipe_2016_endpoint_h": "ReCiPe 2016 v1.03, endpoint (H)",
    "recipe_2016_endpoint_h_no_lt": "ReCiPe 2016 v1.03, endpoint (H) no LT",
    "recipe_2016_endpoint_i": "ReCiPe 2016 v1.03, endpoint (I)",
    "recipe_2016_endpoint_i_no_lt": "ReCiPe 2016 v1.03, endpoint (I) no LT",
    "recipe_2016_midpoint_e": "ReCiPe 2016 v1.03, midpoint (E)",
    "recipe_2016_midpoint_e_no_lt": "ReCiPe 2016 v1.03, midpoint (E) no LT",
    "recipe_2016_midpoint_h": "ReCiPe 2016 v1.03, midpoint (H)",
    "recipe2016": "ReCiPe 2016 v1.03, midpoint (H)",
    "recipe_2016_midpoint_h_no_lt": "ReCiPe 2016 v1.03, midpoint (H) no LT",
    "recipe_2016_midpoint_i": "ReCiPe 2016 v1.03, midpoint (I)",
    "recipe_2016_midpoint_i_no_lt": "ReCiPe 2016 v1.03, midpoint (I) no LT",
    "traci_v2_1": "TRACI v2.1",
    "traci21": "TRACI v2.1",
    "traci 2.1": "TRACI v2.1",
    "traci_v2_1_no_lt": "TRACI v2.1 no LT",
    "usetox_v2_13_endpoint": "USEtox v2.13, endpoint",
    "usetox_v2_13_endpoint_no_lt": "USEtox v2.13, endpoint no LT",
    "usetox_v2_13_midpoint": "USEtox v2.13, midpoint",
    "usetox_v2_13_midpoint_no_lt": "USEtox v2.13, midpoint no LT",
}


def is_methodology_match(excel_method: str, target_method: str | None) -> bool:
    if not target_method or str(target_method).strip().lower() in ("all", "none", "*", ""):
        return True
    
    t_clean = str(target_method).strip().lower()
    e_clean = str(excel_method).strip().lower()

    if t_clean in METHODOLOGY_MAP:
        return METHODOLOGY_MAP[t_clean].lower() == e_clean
        
    if t_clean == e_clean:
        return True

    # Normalize by replacing underscores, dots, hyphens and extra spaces
    e_norm = re.sub(r"[._\-\s]+", " ", e_clean).strip()
    t_norm = re.sub(r"[._\-\s]+", " ", t_clean).strip()
    if e_norm == t_norm:
        return True

    return False


def load_headers_and_data(excel_path: str, target_methodology: str | None = None):
    """Reads the LCIA sheet raw (no header inference) and splits it into
    the 4 header rows + the data rows, filtering for target_methodology if specified.
    Tries multiple sheet names to be resilient across ecoinvent file variants."""
    raw = None
    for sheet in [SHEET_NAME, "CFs", "Indicators", 1]:
        try:
            raw = pd.read_excel(excel_path, sheet_name=sheet, header=None)
            break
        except (ValueError, KeyError):
            continue
    if raw is None:
        raise ValueError(f"Could not find a usable sheet in {excel_path}. Tried: {SHEET_NAME}, CFs, Indicators, index 1")

    method_row = raw.iloc[0]
    category_row = raw.iloc[1]
    indicator_row = raw.iloc[2]
    unit_or_key_row = raw.iloc[3]
    data = raw.iloc[HEADER_ROWS:].reset_index(drop=True)

    metadata_names = [
        str(unit_or_key_row[c]) for c in range(N_METADATA_COLS)
    ]

    indicator_labels = {}
    for c in range(N_METADATA_COLS, raw.shape[1]):
        method = method_row[c]
        category = category_row[c]
        indicator = indicator_row[c]
        unit = unit_or_key_row[c]
        if pd.isna(indicator):
            continue
        if target_methodology and not is_methodology_match(str(method), target_methodology):
            continue
        label = f"{method} | {category} | {indicator} [{unit}]"
        indicator_labels[c] = label

    data.columns = list(range(raw.shape[1]))
    return metadata_names, indicator_labels, data


def slug_to_keywords(slug: str) -> tuple[list[str], str | None]:
    """
    Turns 'ecoinvent_steel_hot_rolled_glo' into (['steel','hot','rolled'], 'glo').
    Strips a leading 'ecoinvent_' and a trailing known geography code.
    """
    parts = slug.lower().replace("-", "_").split("_")
    parts = [p for p in parts if p and p not in STOPWORDS]

    geo = None
    if parts and parts[-1] in KNOWN_GEO_CODES:
        geo = parts.pop()

    return parts, geo


def text_to_keywords(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z]+", text.lower())
    return [w for w in words if w not in STOPWORDS and len(w) > 2]


def _add_pid(contexts, pid, *hints):
    """Helper to add a provider_id with context hints."""
    if pid:
        ctx = contexts.setdefault(pid, set())
        for h in hints:
            if h:
                ctx.add(str(h))


def collect_provider_contexts(payload: dict) -> dict[str, set[str]]:
    """
    Walks the stages_data block and gathers only the provider IDs that correspond
    to user-entered data with non-zero quantities. This prevents extracting EF
    values for unused default/fallback providers.
    Returns {provider_id: set(context_strings)}.
    """
    contexts: dict[str, set[str]] = {}
    stages = payload.get("stages_data", {})

    # ── A1: BOM items ──
    for item in stages.get("A1_BOM", []):
        mass = float(item.get("mass", 0) or 0)
        if mass > 0:
            pid = item.get("provider_id") or item.get("ecoinvent_id")
            _add_pid(contexts, pid, item.get("name"), item.get("material"), item.get("dataset"))

    # ── A2: Transport legs ──
    for leg in stages.get("A2_Transport", []):
        dist = float(leg.get("distance", 0) or leg.get("dist", 0) or 0)
        if dist > 0:
            _add_pid(contexts, leg.get("provider_id"), leg.get("mode"))

    # ── A3: Manufacturing ──
    mfg = stages.get("A3_Manufacturing", {})
    if float(mfg.get("annual_facility_kwh", 0) or 0) > 0:
        _add_pid(contexts, mfg.get("electricity_provider_id"), "electricity")
    if float(mfg.get("natural_gas_mj", 0) or 0) > 0:
        _add_pid(contexts, mfg.get("gas_provider_id"), "natural gas boiler")
    if float(mfg.get("water_m3", 0) or 0) > 0:
        _add_pid(contexts, mfg.get("water_provider_id"), "water deionised")

    # ── A4/A5: Installation ──
    inst = stages.get("A4_A5_Installation", {})
    if float(inst.get("outbound_transport_km", 0) or 0) > 0:
        _add_pid(contexts, inst.get("outbound_provider_id"), "outbound transport")
    if float(inst.get("installation_energy_kwh", 0) or 0) > 0:
        _add_pid(contexts, inst.get("installation_energy_provider_id"), "installation energy")
    if float(inst.get("rigging_crane_diesel_liters", 0) or 0) > 0:
        _add_pid(contexts, inst.get("consumable_provider_id"), "crane diesel")

    # ── B1-B7: Operational ──
    op = stages.get("B1_B7_Operational", {})
    if float(op.get("capacity_rt", 0) or 0) > 0 or float(op.get("annual_operating_hours", 0) or 0) > 0:
        _add_pid(contexts, op.get("energy_provider_id"), "operational energy")
        # City grid providers
        city_grids = op.get("city_grid_providers", {})
        if isinstance(city_grids, dict):
            for city, cpid in city_grids.items():
                _add_pid(contexts, cpid, f"grid {city}")
    if float(op.get("cooling_tower_water_m3_yr", 0) or 0) > 0:
        _add_pid(contexts, op.get("water_provider_id"), "cooling tower water")

    b2 = stages.get("B2_Maintenance", {})
    if float(b2.get("maintenance_cycles_per_rsl", 0) or 0) > 0 or float(b2.get("consumable_mass_kg", 0) or 0) > 0:
        _add_pid(contexts, b2.get("provider_id"), "maintenance consumable")

    b3 = stages.get("B3_Repair", {})
    if float(b3.get("repair_events_per_rsl", 0) or 0) > 0 or float(b3.get("part_mass_kg", 0) or 0) > 0:
        _add_pid(contexts, b3.get("provider_id"), "repair part")

    b5 = stages.get("B5_Refurbishment", {})
    if float(b5.get("refurbishment_events_per_rsl", 0) or 0) > 0 or float(b5.get("mass_kg", 0) or 0) > 0:
        _add_pid(contexts, b5.get("provider_id"), "refurbishment material")

    # ── C1-C4: End of Life ──
    eol = stages.get("C1_C4_EndOfLife", {})
    if float(eol.get("decommissioning_energy_kwh", 0) or 0) > 0:
        _add_pid(contexts, eol.get("deconstruction_provider_id"), "deconstruction energy")
    if float(eol.get("waste_transport_km", 0) or 0) > 0:
        _add_pid(contexts, eol.get("waste_transport_provider_id"), "waste transport")
    if float(eol.get("recycling_rate_percent", 0) or 0) > 0:
        _add_pid(contexts, eol.get("recycling_process_provider_id"), "recycling process")
    if float(eol.get("incineration_rate_percent", 0) or 0) > 0:
        _add_pid(contexts, eol.get("incineration_process_provider_id"), "incineration process")
    if float(eol.get("landfill_rate_percent", 0) or 0) > 0:
        _add_pid(contexts, eol.get("landfill_process_provider_id"), "landfill process")

    # ── Module D: Circularity ──
    circ_d = stages.get("D_Circularity", {})
    if float(circ_d.get("overall_recovery_rate_percent", 0) or 0) > 0:
        _add_pid(contexts, circ_d.get("virgin_material_provider_id"), "virgin material credit")
        _add_pid(contexts, circ_d.get("recycled_process_provider_id"), "secondary material process")

    # ── Fallback: generic walk if nothing was found above ──
    if not contexts:
        def walk(node):
            if isinstance(node, dict):
                pids = set()
                for key, val in node.items():
                    if isinstance(val, str) and val.startswith("ecoinvent_"):
                        pids.add(val)
                for pid in pids:
                    ctx = contexts.setdefault(pid, set())
                    for k, v in node.items():
                        if k in ("provider_id", "ecoinvent_id", "id", "module", "unit") or (isinstance(v, str) and v.startswith("ecoinvent_")):
                            continue
                        if isinstance(v, (str, int, float)):
                            ctx.add(str(v))
                for val in node.values():
                    walk(val)
            elif isinstance(node, list):
                for item in node:
                    walk(item)
        walk(payload)

    return contexts


def find_best_match(provider_id: str, context_strings: set[str],
                     data: pd.DataFrame, metadata_names: list[str]) -> dict | None:
    activity_col = metadata_names.index("Activity Name")
    geo_col = metadata_names.index("Geography")

    # 1. Direct row index lookup if provider_id is ecoinvent_row_<int>
    m_row = re.match(r"^ecoinvent_row_(\d+)$", str(provider_id).strip(), re.IGNORECASE)
    if m_row:
        row_idx = int(m_row.group(1))
        if row_idx in data.index:
            row = data.loc[row_idx]
            return {
                "row": row,
                "matched_activity_name": row[activity_col],
                "matched_geography": row[geo_col],
                "match_confidence": f"row_index (row {row_idx})",
            }

    # 2. Extract keywords from provider_id and context strings
    slug_keywords, slug_geo = slug_to_keywords(provider_id)
    slug_keywords = [kw for kw in slug_keywords if kw != "row" and not kw.isdigit()]

    if not slug_keywords:
        for ctx_str in context_strings:
            kws = text_to_keywords(ctx_str)
            for kw in kws:
                if kw not in slug_keywords:
                    slug_keywords.append(kw)

    if not slug_keywords:
        return None

    activity_series = data[activity_col].astype(str).str.lower()
    geo_series = data[geo_col].astype(str).str.upper()

    # Match primarily on slug keywords
    mask = pd.Series(True, index=data.index)
    for kw in slug_keywords:
        mask &= activity_series.str.contains(re.escape(kw), na=False)

    # Filter by geography if specified
    if slug_geo and mask.any():
        geo_mask = mask & (geo_series == slug_geo.upper())
        if geo_mask.any():
            mask = geo_mask
        else:
            # Fallback geo priorities
            for g in ["GLO", "ROW", "RER", "US"]:
                fallback_mask = mask & (geo_series == g)
                if fallback_mask.any():
                    mask = fallback_mask
                    break

    matches = data[mask]

    # If all slug keywords together didn't match, relax to requiring at least 2 or 1 keyword
    if matches.empty and len(slug_keywords) > 1:
        hit_counts = pd.Series(0, index=data.index)
        for kw in slug_keywords:
            hit_counts += activity_series.str.contains(re.escape(kw), na=False).astype(int)
        max_hits = hit_counts.max()
        if max_hits > 0:
            mask = hit_counts == max_hits
            if slug_geo:
                geo_mask = mask & (geo_series == slug_geo.upper())
                if geo_mask.any():
                    mask = geo_mask
            matches = data[mask]

    if matches.empty:
        return None

    row = matches.iloc[0]
    return {
        "row": row,
        "matched_activity_name": row[activity_col],
        "matched_geography": row[geo_col],
        "match_confidence": "keyword" if len(matches) == 1 else f"keyword (1 of {len(matches)} candidates)",
    }


def extract_ef_for_payload(payload: dict, excel_path: str | Path, target_methodology: str | None = None) -> dict:
    """
    Extracts emission factor values from LCIA Excel for all providers in payload
    and returns a dictionary mapping provider_id to matched values.
    """
    excel_path = Path(excel_path)
    if not excel_path.exists():
        raise FileNotFoundError(f"LCIA Excel file not found: {excel_path}")

    if not target_methodology:
        meta = payload.get("metadata", {})
        target_methodology = (
            meta.get("methodology") or
            meta.get("selectedMethodology") or
            payload.get("selectedMethodology") or
            payload.get("methodology")
        )

    metadata_names, indicator_labels, data = load_headers_and_data(str(excel_path), target_methodology)
    contexts = collect_provider_contexts(payload)

    results = {}
    for provider_id, context_strings in sorted(contexts.items()):
        match = find_best_match(provider_id, context_strings, data, metadata_names)
        if match is None:
            continue

        row = match["row"]
        values = {}
        for col_idx, label in indicator_labels.items():
            val = row[col_idx]
            if pd.notna(val):
                values[label] = val

        results[provider_id] = {
            "matched_activity_name": match["matched_activity_name"],
            "matched_geography": match["matched_geography"],
            "match_confidence": match["match_confidence"],
            "selected_methodology": target_methodology,
            "values": values,
        }

    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                      formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--excel", required=True, help="Path to LCIA Implementation Excel file.")
    parser.add_argument("--payload", required=True, help="Path to the EPD calculation input JSON.")
    parser.add_argument("--methodology", help="Target LCIA methodology to extract (e.g. 'ipcc_2021', 'TRACI v2.1').")
    parser.add_argument("--out", default="ef_values.json", help="Output JSON path.")
    args = parser.parse_args()

    excel_path = Path(args.excel)
    payload_path = Path(args.payload)

    if not excel_path.exists():
        print(f"Excel file not found: {excel_path}", file=sys.stderr)
        sys.exit(1)
    if not payload_path.exists():
        print(f"Payload JSON not found: {payload_path}", file=sys.stderr)
        sys.exit(1)

    with open(payload_path, "r") as f:
        payload = json.load(f)

    results = extract_ef_for_payload(payload, excel_path, args.methodology)

    with open(args.out, "w") as f:
        json.dump(results, f, indent=2, default=str)

    try:
        payload["extracted_ef_values"] = results
        with open(payload_path, "w") as f:
            json.dump(payload, f, indent=2, default=str)
        print(f"Embedded extracted EF values directly into {payload_path.name}")
    except Exception as e:
        print(f"Warning: Could not embed EF values into payload file: {e}")

    print(f"\nWrote {len(results)} matched provider(s) to {args.out}")


if __name__ == "__main__":
    main()
