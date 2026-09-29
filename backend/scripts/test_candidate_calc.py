import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

from app.engines.extract_ef_values import extract_ef_for_payload
from app.engines.calculate_epd import calculate_epd

payload_path = REPO_ROOT / "results" / "epd_calculation_input.json"
with open(payload_path, "r", encoding="utf-8") as f:
    payload = json.load(f)

# Update stages_data with row indices
eol = payload["stages_data"]["C1_C4_EndOfLife"]
eol["deconstruction_provider_id"] = "ecoinvent_row_2621"  # diesel burned in building machine [MJ]
eol["recycling_process_provider_id"] = "ecoinvent_row_20713" # sorting and pressing of iron scrap [kg]
eol["incineration_process_provider_id"] = "ecoinvent_row_22918" # municipal incineration [kg]
eol["landfill_process_provider_id"] = "ecoinvent_row_14191" # sanitary landfill [kg]

circ = payload["stages_data"]["D_Circularity"]
circ["virgin_material_provider_id"] = "ecoinvent_row_15528" # market for steel, low-alloyed, hot rolled [kg]
circ["recycled_process_provider_id"] = "ecoinvent_row_15529" # market for steel, structural, 100% scrap [kg]
circ["recycled_process_provider_id_reference_unit"] = "kg"

excel_path = REPO_ROOT / "Ecoinvent database" / "ecoinvent 3.12_cut-off_cumulative_lcia_xlsx" / "Cut-off Cumulative LCIA v3.12.xlsx"

print("Extracting EF values...")
ef_lookup = extract_ef_for_payload(payload, excel_path, "ef_v3_1")
print(f"Extracted {len(ef_lookup)} providers.")

print("Calculating EPD...")
columns, warnings, meta = calculate_epd(payload, ef_lookup, "ef_v3_1")
print("\n--- RESULTS GWP - total ---")
gwp_key = "GWP - total"
for stage in ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B4", "B6", "B7", "C1", "C2", "C3", "C4", "D"]:
    val = columns.get(stage, {}).get(gwp_key, "N/A")
    print(f"  Stage {stage}: {val}")
