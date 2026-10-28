"""
LCIA Data Extractor
====================
Interactively search a huge ecoinvent-style "Cumulative LCIA" Excel export
(thousands of rows, hundreds of impact-assessment columns organised under a
4-row hierarchical header: Method / Category / Indicator / Unit) by product
name, let the user pick the exact provider/activity, then choose an impact
assessment methodology (e.g. "TRACI 2.1") and print every indicator value
for that method for the selected row.

Usage:
    python lcia_extractor.py

Edit FILE_PATH below if your file lives somewhere else, or pass it as the
first command-line argument.
"""

import os
import sys
import pandas as pd

from pathlib import Path

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
_REPO_ROOT = Path(__file__).resolve().parent
CANDIDATE_PATHS = [
    str(_REPO_ROOT / "Ecoinvent database" / "ecoinvent 3.12_cut-off_cumulative_lcia_xlsx" / "Cut-off Cumulative LCIA v3.12.xlsx"),
    r"/Users/parth/Desktop/final year project/Cut-off Cumulative LCIA v3.12.xlsx",
    r"/Users/parth/Desktop/Ecometric/Cut-off Cumulative LCIA v3.12.xlsx",
    str(_REPO_ROOT / "database" / "ecoinvent_raw" / "LCIA Implementation 3.12.xlsx"),
]
FILE_PATH = next((p for p in CANDIDATE_PATHS if os.path.exists(p)), CANDIDATE_PATHS[0])

SHEET_NAME = "LCIA"          # the data sheet (your file also has a "Read me" sheet)
N_META_COLS = 6               # Activity UUID_Product UUID, Activity Name, Geography,
                               # Reference Product Name, Reference Product Unit,
                               # Reference Product Amount
META_COL_NAMES = [
    "Activity UUID_Product UUID",
    "Activity Name",
    "Geography",
    "Reference Product Name",
    "Reference Product Unit",
    "Reference Product Amount",
]

_GLOBAL_DATA_CACHE = None

def get_lcia_data(filepath: str = None) -> pd.DataFrame:
    global _GLOBAL_DATA_CACHE
    if _GLOBAL_DATA_CACHE is not None:
        return _GLOBAL_DATA_CACHE
    target_path = filepath or FILE_PATH
    _GLOBAL_DATA_CACHE = load_lcia_data(target_path)
    return _GLOBAL_DATA_CACHE


# ---------------------------------------------------------------------------
# LOADING (with caching, because the real file is huge)
# ---------------------------------------------------------------------------
def load_lcia_data(filepath: str, sheet_name: str = SHEET_NAME, use_cache: bool = True) -> pd.DataFrame:
    """
    Reads the 4-row hierarchical header + data body into a DataFrame whose
    columns are a MultiIndex: (Method, Category, Indicator, Unit).
    The 6 identification columns get Method/Category/Indicator = 'META'.
    Caches the parsed result next to the source file as a .pkl for fast
    reloads (only re-parses if the source file is newer than the cache).
    """
    cache_path = filepath + ".cache.pkl"

    if use_cache and os.path.exists(cache_path):
        try:
            if os.path.getmtime(cache_path) > os.path.getmtime(filepath):
                return pd.read_pickle(cache_path)
        except OSError:
            pass

    print(f"Reading '{filepath}' (sheet: {sheet_name}) ... this can take a while for a large file.")
    raw = pd.read_excel(filepath, sheet_name=sheet_name, header=None, engine="openpyxl")

    method_row = raw.iloc[0]
    category_row = raw.iloc[1]
    indicator_row = raw.iloc[2]
    fieldunit_row = raw.iloc[3]     # field name for meta cols, unit for LCIA cols
    data = raw.iloc[4:].reset_index(drop=True)

    tuples = []
    for i in range(raw.shape[1]):
        if i < N_META_COLS:
            field_name = META_COL_NAMES[i] if i < len(META_COL_NAMES) else str(fieldunit_row[i])
            tuples.append(("META", "META", "META", field_name))
        else:
            tuples.append((
                str(method_row[i]),
                str(category_row[i]),
                str(indicator_row[i]),
                str(fieldunit_row[i]),
            ))

    data.columns = pd.MultiIndex.from_tuples(tuples, names=["Method", "Category", "Indicator", "Unit"])

    # Convert every non-META column to numeric (values are emission factors)
    for col in data.columns:
        if col[0] != "META":
            data[col] = pd.to_numeric(data[col], errors="coerce")

    if use_cache:
        try:
            data.to_pickle(cache_path)
        except OSError:
            pass

    return data


# ---------------------------------------------------------------------------
# SEARCH / SELECT
# ---------------------------------------------------------------------------
KEYWORD_SYNONYMS = {
    "steel_hot_rolled": "steel, low-alloyed, hot rolled",
    "copper_tube_wire": "copper, cathode",
    "electric_motor_industrial": "electric motor",
    "insulation_polyurethane": "polyurethane, rigid foam",
    "electronics_vfd": "inverter",
    "steel_stainless_304": "steel, chromium steel 18/8",
    "aluminium_cast_alloy": "aluminium, cast alloy",
    "refrigerant_r134a": "refrigerant R134a",
    "refrigerant_r1234ze": "refrigerant",
}

def search_product(data: pd.DataFrame, keyword: str) -> pd.DataFrame:
    """
    Intelligent case-insensitive search across Reference Product Name AND
    Activity Name. Handles underscores, multiple tokens, known synonyms, and ranks best matches first.
    """
    raw_key = keyword.strip().lower()
    target_query = KEYWORD_SYNONYMS.get(raw_key, keyword)
    clean_kw = target_query.replace("_", " ").replace("-", " ").strip()
    words = [w for w in clean_kw.split() if len(w) > 1]
    if not words:
        words = [clean_kw] if clean_kw else []

    ref_name = data[("META", "META", "META", "Reference Product Name")].astype(str)
    act_name = data[("META", "META", "META", "Activity Name")].astype(str)
    geog = data[("META", "META", "META", "Geography")].astype(str)

    # First attempt: all words must match in either ref_name or act_name
    all_mask = pd.Series(True, index=data.index)
    for w in words:
        all_mask &= (ref_name.str.contains(w, case=False, na=False) | act_name.str.contains(w, case=False, na=False))

    if all_mask.sum() > 0:
        mask = all_mask
    else:
        # Fallback attempt: any word matches
        any_mask = pd.Series(False, index=data.index)
        for w in words:
            any_mask |= (ref_name.str.contains(w, case=False, na=False) | act_name.str.contains(w, case=False, na=False))
        mask = any_mask

    meta_cols = [
        ("META", "META", "META", "Activity Name"),
        ("META", "META", "META", "Geography"),
        ("META", "META", "META", "Reference Product Name"),
    ]
    subset = data.loc[mask, meta_cols].copy()
    subset.columns = ["Activity Name", "Geography", "Reference Product Name"]
    subset = subset.drop_duplicates().reset_index()

    if subset.empty:
        return subset

    # Calculate match relevance score (higher is better)
    def calc_score(row):
        score = 0
        r_lower = str(row["Reference Product Name"]).lower()
        a_lower = str(row["Activity Name"]).lower()
        g = str(row["Geography"]).upper()
        kw_lower = clean_kw.lower()

        # Exact matches
        if r_lower == kw_lower:
            score += 100
        elif r_lower.startswith(kw_lower):
            score += 60
        elif kw_lower in r_lower:
            score += 40

        # Market activities preferred in ecoinvent
        if a_lower.startswith("market for"):
            score += 25
        elif "market" in a_lower:
            score += 10

        # Global or European geography preferred
        if g in ["GLO", "RER"]:
            score += 15

        # Shorter names often mean cleaner baseline commodities
        score -= min(len(r_lower), 60) * 0.2
        return score

    scores = subset.apply(calc_score, axis=1)
    subset["_score"] = scores
    subset = subset.sort_values(by="_score", ascending=False).drop(columns=["_score"]).reset_index(drop=True)
    return subset


def get_available_methods(data: pd.DataFrame):
    methods = sorted({c[0] for c in data.columns if c[0] != "META"})
    return methods


def _normalize(s: str) -> str:
    return s.lower().replace(" ", "").replace(".", "").replace("_", "")


def get_row_for_method(data: pd.DataFrame, row_index: int, method_filter: str | None):
    """
    Returns a Series for the given row, restricted to the META columns plus
    every column whose Method label matches method_filter (substring,
    case/space/punctuation-insensitive) so "TRACI 2.1" also matches
    "TRACI v2.1" and "TRACI v2.1 no LT". Pass method_filter=None for the
    full row (every method).
    """
    row = data.loc[row_index]

    if method_filter:
        target = _normalize(method_filter)
        # Strip leading/trailing v or standard noise to maximize match flexibility
        target_clean = target.replace("v", "")
        cols = [
            c for c in data.columns 
            if c[0] != "META" and (
                target in _normalize(c[0]) or 
                target_clean in _normalize(c[0]).replace("v", "")
            )
        ]
    else:
        cols = [c for c in data.columns if c[0] != "META"]

    meta_cols = [c for c in data.columns if c[0] == "META"]
    return row[meta_cols + cols]


def extract_lcia_results_dict(data: pd.DataFrame, row_index: int, method_filter: str | None) -> dict:
    series = get_row_for_method(data, row_index, method_filter)
    meta_info = {}
    indicators = []

    for (method, category, indicator, unit), value in series.items():
        if method == "META":
            meta_info[unit] = str(value) if pd.notna(value) else ""
        else:
            if pd.notna(value):
                indicators.append({
                    "method": method,
                    "category": category,
                    "indicator": indicator,
                    "unit": unit,
                    "value": float(value)
                })

    return {
        "meta": meta_info,
        "method_filter": method_filter,
        "indicator_count": len(indicators),
        "indicators": indicators
    }


def print_row(series: pd.Series):
    print()
    for (method, category, indicator, unit), value in series.items():
        if method == "META":
            print(f"{unit:35s}: {value}")
    print("-" * 70)
    current_method = None
    for (method, category, indicator, unit), value in series.items():
        if method == "META":
            continue
        if pd.isna(value):
            continue
        if method != current_method:
            print(f"\n=== {method} ===")
            current_method = method
        print(f"  [{category}] {indicator} ({unit}): {value}")


# ---------------------------------------------------------------------------
# INTERACTIVE MAIN
# ---------------------------------------------------------------------------
def main():
    filepath = sys.argv[1] if len(sys.argv) > 1 else FILE_PATH

    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        print("Pass the correct path as an argument, e.g.:")
        print('  python lcia_extractor.py "/path/to/Cut-off Cumulative LCIA v3.12.xlsx"')
        return

    data = load_lcia_data(filepath)
    print(f"Loaded {len(data):,} rows and {sum(1 for c in data.columns if c[0] != 'META')} indicator columns.")

    while True:
        keyword = input("\nEnter product name to search (or 'quit' to exit): ").strip()
        if keyword.lower() in ("quit", "exit", "q"):
            break
        if not keyword:
            continue

        matches = search_product(data, keyword)
        if matches.empty:
            print("No matches found. Try a shorter/simpler keyword.")
            continue

        print(f"\nFound {len(matches)} matching provider(s):")
        for display_i, row in matches.iterrows():
            print(f"  [{display_i}] {row['Reference Product Name']}  |  {row['Activity Name']}  |  {row['Geography']}")

        sel = input("Select a number: ").strip()
        try:
            sel = int(sel)
            orig_index = matches.loc[sel, "index"]
        except (ValueError, KeyError):
            print("Invalid selection.")
            continue

        methods = get_available_methods(data)
        print(f"\nAvailable methodologies ({len(methods)}):")
        for m in methods:
            print("  -", m)

        method_choice = input("\nEnter methodology (e.g. 'TRACI 2.1'), or leave blank for ALL methods: ").strip()
        result = get_row_for_method(data, orig_index, method_choice or None)

        if method_choice and not any(c[0] != "META" for c in result.index):
            print(f"No columns matched methodology '{method_choice}'. Check spelling against the list above.")
            continue

        print_row(result)


if __name__ == "__main__":
    main()

