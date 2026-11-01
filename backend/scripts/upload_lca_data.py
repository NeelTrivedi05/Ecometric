"""Upload the ecoinvent Cut-off Cumulative LCIA workbook into Supabase.

Fills the `impact_indicators` and `lca_activities` tables. Safe to re-run:
both tables are upserted, so existing rows are updated, not duplicated.

Usage:
    export SUPABASE_DB_URL="postgresql://..."
    python backend/scripts/upload_lca_data.py            # first 1000 activities (test)
    python backend/scripts/upload_lca_data.py --all      # full dataset
    python backend/scripts/upload_lca_data.py --all --skip-existing   # resume after a failure
    python backend/scripts/upload_lca_data.py --excel "/path/to/file.xlsx"
"""
import argparse
import os
import sys
from pathlib import Path

import psycopg
from openpyxl import load_workbook
from psycopg.types.json import Jsonb

DEFAULT_EXCEL = Path.home() / "Downloads" / "Cut-off Cumulative LCIA v3.12.xlsx"
SHEET_NAME = "LCIA"
HEADER_ROWS = 4          # Method, Category, Indicator, Unit (+ column names)
FIRST_IMPACT_COL = 6     # 0-based: columns A-F are activity/product info
BATCH_SIZE = 500

UPSERT_INDICATOR = """
    INSERT INTO impact_indicators
        (indicator_code, excel_column_number, method, category, indicator, unit)
    VALUES (%s, %s, %s, %s, %s, %s)
    ON CONFLICT (indicator_code) DO UPDATE SET
        excel_column_number = EXCLUDED.excel_column_number,
        method = EXCLUDED.method,
        category = EXCLUDED.category,
        indicator = EXCLUDED.indicator,
        unit = EXCLUDED.unit
"""

UPSERT_ACTIVITY = """
    INSERT INTO lca_activities
        (activity_uuid, product_uuid, activity_name, geography,
         reference_product_name, reference_product_unit,
         reference_product_amount, impact_values, row_index)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (activity_uuid, product_uuid) DO UPDATE SET
        row_index = EXCLUDED.row_index,
        activity_name = EXCLUDED.activity_name,
        geography = EXCLUDED.geography,
        reference_product_name = EXCLUDED.reference_product_name,
        reference_product_unit = EXCLUDED.reference_product_unit,
        reference_product_amount = EXCLUDED.reference_product_amount,
        impact_values = EXCLUDED.impact_values
"""


def indicator_code(col_idx):
    # Excel column number, e.g. column G (index 6) -> "col_007"
    return f"col_{col_idx + 1:03d}"


def read_indicators(header):
    methods, categories, indicators, units = header
    return [
        (indicator_code(i), i + 1, methods[i], categories[i], indicators[i], units[i])
        for i in range(FIRST_IMPACT_COL, len(units))
    ]


def parse_activity(row, row_index):
    """row_index: position in the LCIA sheet after the header rows (0 = Excel row 5)."""
    combined_id = row[0]
    if not combined_id:
        return None
    activity_uuid, product_uuid = str(combined_id).split("_", 1)
    impact_values = {
        indicator_code(i): float(v)
        for i in range(FIRST_IMPACT_COL, len(row))
        if isinstance(v := row[i], (int, float))
    }
    return (
        activity_uuid, product_uuid,
        row[1], row[2], row[3], row[4], row[5],
        Jsonb(impact_values),
        row_index,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--excel", default=str(DEFAULT_EXCEL))
    parser.add_argument("--limit", type=int, default=1000, help="max activities to upload")
    parser.add_argument("--all", action="store_true", help="upload every activity")
    parser.add_argument("--skip-existing", action="store_true",
                        help="only upload activities not already in the database")
    args = parser.parse_args()
    max_rows = None if args.all else args.limit

    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        sys.exit("SUPABASE_DB_URL is not set. Run: export SUPABASE_DB_URL=\"postgresql://...\"")

    print(f"Reading {args.excel} (this takes a minute)...")
    workbook = load_workbook(args.excel, read_only=True, data_only=True)
    rows = workbook[SHEET_NAME].iter_rows(values_only=True)
    header = [next(rows) for _ in range(HEADER_ROWS)]
    indicators = read_indicators(header)

    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.executemany(UPSERT_INDICATOR, indicators)
        conn.commit()
        print(f"Upserted {len(indicators)} impact indicators.")

        existing = set()
        if args.skip_existing:
            with conn.cursor() as cur:
                cur.execute("SELECT activity_uuid::text, product_uuid::text FROM lca_activities")
                existing = set(cur.fetchall())
            print(f"Skipping {len(existing)} activities already in the database.")

        uploaded = 0
        batch = []
        for row_index, row in enumerate(rows):
            if max_rows is not None and uploaded + len(batch) >= max_rows:
                break
            activity = parse_activity(row, row_index)
            if activity and activity[:2] not in existing:
                batch.append(activity)
            if len(batch) == BATCH_SIZE:
                with conn.cursor() as cur:
                    cur.executemany(UPSERT_ACTIVITY, batch)
                conn.commit()
                uploaded += len(batch)
                batch = []
                print(f"  {uploaded} activities uploaded...")
        if batch:
            with conn.cursor() as cur:
                cur.executemany(UPSERT_ACTIVITY, batch)
            conn.commit()
            uploaded += len(batch)

        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*), pg_size_pretty(pg_total_relation_size('lca_activities')) FROM lca_activities")
            total, size = cur.fetchone()
        print(f"Done. Uploaded {uploaded} activities this run.")
        print(f"lca_activities now has {total} rows, using {size} of storage.")

    workbook.close()


if __name__ == "__main__":
    main()
