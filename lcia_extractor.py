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
PRIMARY_FILE_PATH = str(_REPO_ROOT / "Ecoinvent database" / "ecoinvent 3.12_cut-off_cumulative_lcia_xlsx" / "Cut-off Cumulative LCIA v3.12.xlsx")
FALLBACK_FILE_PATH = r"/Users/parth/Desktop/Ecometric/Cut-off Cumulative LCIA v3.12.xlsx"

FILE_PATH = PRIMARY_FILE_PATH if os.path.exists(PRIMARY_FILE_PATH) else FALLBACK_FILE_PATH

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
def search_product(data: pd.DataFrame, keyword: str) -> pd.DataFrame:
    """
    Case-insensitive substring search across Reference Product Name AND
    Activity Name. Returns a small lookup table of distinct matches with
    their ORIGINAL row index (so we can pull the full row later), ready to
    show the user as a numbered list.
    """
    ref_name = data[("META", "META", "META", "Reference Product Name")].astype(str)
    act_name = data[("META", "META", "META", "Activity Name")].astype(str)

    mask = ref_name.str.contains(keyword, case=False, na=False) | \
           act_name.str.contains(keyword, case=False, na=False)

    meta_cols = [
        ("META", "META", "META", "Activity Name"),
        ("META", "META", "META", "Geography"),
        ("META", "META", "META", "Reference Product Name"),
    ]
    subset = data.loc[mask, meta_cols].copy()
    subset.columns = ["Activity Name", "Geography", "Reference Product Name"]
    subset = subset.drop_duplicates().reset_index()  # keeps original df index in a column called 'index'
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

