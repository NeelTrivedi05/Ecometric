"""Convert the ecoinvent Cut-off Cumulative LCIA workbook into the files in backend/database.

Writes:
  lca_activities_1.parquet, lca_activities_2.parquet
      one row per activity / product, split in two halves to stay under GitHub's 100 MB
      file limit. Columns: row, activity, geo, product, unit, then one float column per
      impact indicator (col_007 ...). `row` is the row's position in the LCIA sheet after
      the header rows (0 = Excel row 5), so provider ids stay "ecoinvent_row_<n>".
  impact_indicators.json
      [indicator_code, method, category, indicator, unit] of every impact column.

Re-run whenever the workbook changes. Read by app/engines/lca_store.py.

Usage:
    python backend/scripts/build_lca_files.py
    python backend/scripts/build_lca_files.py --excel "/path/to/Cut-off Cumulative LCIA v3.12.xlsx"
"""
import argparse
import json
from pathlib import Path

import pandas as pd
from openpyxl import load_workbook

DEFAULT_EXCEL = Path.home() / "Downloads" / "Cut-off Cumulative LCIA v3.12.xlsx"
OUT_DIR = Path(__file__).resolve().parents[1] / "database"
SHEET_NAME = "LCIA"
HEADER_ROWS = 4          # Method, Category, Indicator, Unit (+ column names)
FIRST_IMPACT_COL = 6     # 0-based: columns A-F are activity/product info
PARTS = 2


def indicator_code(col_idx):
    # Excel column number, e.g. column G (index 6) -> "col_007"
    return f"col_{col_idx + 1:03d}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--excel", default=str(DEFAULT_EXCEL))
    args = parser.parse_args()

    print(f"Reading {args.excel} (this takes a minute)...")
    workbook = load_workbook(args.excel, read_only=True, data_only=True)
    rows = workbook[SHEET_NAME].iter_rows(values_only=True)
    methods, categories, indicators, units = [next(rows) for _ in range(HEADER_ROWS)]
    codes = [indicator_code(i) for i in range(FIRST_IMPACT_COL, len(units))]

    records = []
    for row_index, row in enumerate(rows):
        if not row[0]:
            continue
        values = [v if isinstance(v, (int, float)) else None for v in row[FIRST_IMPACT_COL:]]
        records.append([row_index, *(str(v) for v in row[1:5]), *values])
    workbook.close()

    df = pd.DataFrame(records, columns=["row", "activity", "geo", "product", "unit", *codes])
    df["row"] = df["row"].astype("int32")
    df[codes] = df[codes].astype("float64")

    OUT_DIR.mkdir(exist_ok=True)
    size = -(-len(df) // PARTS)
    for part in range(PARTS):
        path = OUT_DIR / f"lca_activities_{part + 1}.parquet"
        df.iloc[part * size:(part + 1) * size].to_parquet(path, index=False, compression="zstd")
        print(f"Wrote {path.name}: {path.stat().st_size / 1e6:.1f} MB")

    indicator_rows = [
        [indicator_code(i), methods[i], categories[i], indicators[i], units[i]]
        for i in range(FIRST_IMPACT_COL, len(units))
    ]
    (OUT_DIR / "impact_indicators.json").write_text(json.dumps(indicator_rows, indent=1), encoding="utf-8")
    print(f"Done. {len(df)} activities, {len(indicator_rows)} impact indicators.")


if __name__ == "__main__":
    main()
