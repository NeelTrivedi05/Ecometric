import os
import sys
from pathlib import Path
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

from app.engines.extract_ef_values import load_headers_and_data, find_best_match

excel_candidates = [
    REPO_ROOT / "Ecoinvent database" / "ecoinvent 3.12_cut-off_cumulative_lcia_xlsx" / "Cut-off Cumulative LCIA v3.12.xlsx",
    REPO_ROOT / "backend" / "data" / "Cut-off Cumulative LCIA v3.12.xlsx",
]
excel_path = next((p for p in excel_candidates if p.exists() or Path(str(p) + ".cache.pkl").exists()), None)
print(f"Using excel_path: {excel_path}")

metadata_names, indicator_labels, data = load_headers_and_data(str(excel_path), "ef_v3_1")
print(f"Data loaded: {data.shape} rows x cols")
print(f"Metadata names: {metadata_names}")

act_idx = metadata_names.index("Activity Name")
geo_idx = metadata_names.index("Geography")
unit_idx = metadata_names.index("Reference Product Unit")

slugs_to_test = [
    ("ecoinvent_diesel_dismantling_glo", {"deconstruction energy"}),
    ("ecoinvent_diesel_burned_building_machine_glo", {"crane diesel"}),
    ("ecoinvent_waste_metal_recycling_glo", {"recycling process"}),
    ("ecoinvent_waste_incineration_glo", {"incineration process"}),
    ("ecoinvent_waste_landfill_glo", {"landfill process"}),
    ("ecoinvent_virgin_steel_primary_glo", {"virgin material credit"}),
    ("ecoinvent_secondary_steel_electric_glo", {"secondary material process"}),
]

print("\n--- TESTING SLUG MATCHES ---")
for slug, ctx in slugs_to_test:
    match = find_best_match(slug, ctx, data, metadata_names)
    if match:
        row = match["row"]
        row_id = row.name if hasattr(row, 'name') else 'N/A'
        print(f"SLUG: {slug}")
        print(f"  Matched: Row {row_id} | {row[act_idx]} | Geo: {row[geo_idx]} | Unit: {row[unit_idx]}")
        print(f"  Confidence: {match['match_confidence']}")
    else:
        print(f"SLUG: {slug} -> NO MATCH")

print("\n--- SEARCHING CANDIDATES FOR DECONSTRUCTION / DIESEL ---")
# Search diesel activities
diesel_mask = data[act_idx].astype(str).str.contains("diesel", case=False, na=False)
diesel_df = data[diesel_mask]
print(f"Found {len(diesel_df)} diesel activities.")
for idx, r in diesel_df.head(15).iterrows():
    print(f"  Row {idx}: {r[act_idx]} | {r[geo_idx]} | Unit: {r[unit_idx]}")

# Look specifically for diesel burned in machine / building machine / machine operation
print("\n--- SEARCHING DIESEL BURNED / MACHINE OPERATION ---")
m_mask = data[act_idx].astype(str).str.contains("diesel.*machine|machine.*diesel|building machine", case=False, na=False)
m_df = data[m_mask]
for idx, r in m_df.head(10).iterrows():
    print(f"  Row {idx}: {r[act_idx]} | {r[geo_idx]} | Unit: {r[unit_idx]}")

# Look for diesel, burned
b_mask = data[act_idx].astype(str).str.contains("diesel.*burned|burned.*diesel", case=False, na=False)
b_df = data[b_mask]
for idx, r in b_df.head(10).iterrows():
    print(f"  Row {idx}: {r[act_idx]} | {r[geo_idx]} | Unit: {r[unit_idx]}")

print("\n--- SEARCHING STEEL RECYCLING / SCRAP ---")
scrap_mask = data[act_idx].astype(str).str.contains("scrap.*steel|steel.*scrap|sorting.*metal", case=False, na=False)
for idx, r in data[scrap_mask].head(10).iterrows():
    print(f"  Row {idx}: {r[act_idx]} | {r[geo_idx]} | Unit: {r[unit_idx]}")

print("\n--- SEARCHING MUNICIPAL / INERT WASTE LANDFILL & INCINERATION ---")
waste_mask = data[act_idx].astype(str).str.contains("treatment of municipal solid waste|treatment of waste.*landfill|treatment of waste.*incineration", case=False, na=False)
for idx, r in data[waste_mask].head(10).iterrows():
    print(f"  Row {idx}: {r[act_idx]} | {r[geo_idx]} | Unit: {r[unit_idx]}")

print("\n--- SEARCHING STEEL PRODUCTION (VIRGIN / CONVERTER vs ELECTRIC) ---")
st_mask = data[act_idx].astype(str).str.contains("steel, low-alloyed|steel, unalloyed", case=False, na=False)
for idx, r in data[st_mask].head(10).iterrows():
    print(f"  Row {idx}: {r[act_idx]} | {r[geo_idx]} | Unit: {r[unit_idx]}")
