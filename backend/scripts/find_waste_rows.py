import sys
from pathlib import Path
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))
from app.engines.extract_ef_values import load_headers_and_data

excel_path = REPO_ROOT / "Ecoinvent database" / "ecoinvent 3.12_cut-off_cumulative_lcia_xlsx" / "Cut-off Cumulative LCIA v3.12.xlsx"
metadata_names, indicator_labels, data = load_headers_and_data(str(excel_path), "ef_v3_1")

act_idx = metadata_names.index("Activity Name")
geo_idx = metadata_names.index("Geography")
unit_idx = metadata_names.index("Reference Product Unit")

print("--- RECYCLING / SCRAP SORTING ---")
m = data[act_idx].astype(str).str.contains("treatment of scrap|sorting of metal|recycling of steel|treatment of waste.*metal", case=False, na=False)
for idx, r in data[m].head(15).iterrows():
    print(f"Row {idx}: {r[act_idx]} | {r[geo_idx]} | Unit: {r[unit_idx]}")

print("\n--- LANDFILL INERT / SANITARY ---")
m = data[act_idx].astype(str).str.contains("sanitary landfill|inert waste landfill|treatment of inert waste", case=False, na=False)
for idx, r in data[m].head(15).iterrows():
    print(f"Row {idx}: {r[act_idx]} | {r[geo_idx]} | Unit: {r[unit_idx]}")

print("\n--- INCINERATION MUNICIPAL SOLID WASTE ---")
m = data[act_idx].astype(str).str.contains("treatment of municipal solid waste.*incineration", case=False, na=False)
glo_m = m & (data[geo_idx].astype(str).str.upper().isin(["GLO", "ROW", "CH", "DE", "RER"]))
for idx, r in data[glo_m].head(15).iterrows():
    print(f"Row {idx}: {r[act_idx]} | {r[geo_idx]} | Unit: {r[unit_idx]}")
