import io
import re
from typing import Dict, Any, List, Optional
import openpyxl
from .pdf_extractor import _clean_number, _map_material_to_ecoinvent
from .messy_data_parser import detect_transport_mode, parse_distance_km, clean_decimal_number

def extract_excel_data(excel_bytes: bytes) -> Dict[str, Any]:
    """
    Extracts structured LCA data from an uploaded Excel workbook (.xlsx / .xls).
    Supports multi-sheet engineering workbooks covering:
      - Bill of Materials (Module A1)
      - Inbound Transport / Logistics Manifests (Module A2)
      - Plant Utility & Manufacturing Data (Module A3)
      - Job Site Installation & Crane Rigging (Module A4 / A5)
      - Use Phase & Maintenance Operations (Modules B1–B7)
      - End-of-Life Deconstruction & Circularity (Modules C1–C4 & Module D)
    """
    wb = openpyxl.load_workbook(io.BytesIO(excel_bytes), data_only=True)
    
    extracted = {
        "bom": [],
        "transport": [],
        "manufacturing": {},
        "installation": {},
        "operational": {},
        "end_of_life": {},
        "circularity_d": {},
        "project_info": {}
    }

    for sheet in wb.worksheets:
        sheet_title = (sheet.title or "").strip().lower()
        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            continue

        # Check key-value property sheet vs tabular sheet
        kv_pairs = _extract_key_value_pairs(rows)
        if kv_pairs:
            _merge_key_value_specs(kv_pairs, extracted)

        # Tabular parsing
        _parse_sheet_table(sheet_title, rows, extracted)

    return extracted


def _extract_key_value_pairs(rows: List[tuple]) -> Dict[str, Any]:
    """Extracts metadata from 2-column or 4-column key-value header blocks with colons."""
    kv = {}
    for row in rows[:15]:
        if not row:
            continue
        # Only treat as key-value pair if col 0 or col 2 has ':' (standard property definition)
        if len(row) >= 2 and row[0] is not None and row[1] is not None:
            r0 = str(row[0]).strip()
            if ':' in r0:
                k = r0.lower().rstrip(':')
                kv[k] = row[1]
        if len(row) >= 4 and row[2] is not None and row[3] is not None:
            r2 = str(row[2]).strip()
            if ':' in r2:
                k = r2.lower().rstrip(':')
                kv[k] = row[3]
    return kv


def _merge_key_value_specs(kv: Dict[str, Any], extracted: Dict[str, Any]):
    """Populates lifecycle modules from key-value metadata rows."""
    proj = extracted["project_info"]
    op = extracted["operational"]
    mfg = extracted["manufacturing"]
    inst = extracted["installation"]

    for k, val in kv.items():
        val_str = str(val).strip()
        # Product & Manufacturer
        if any(w in k for w in ['product', 'equipment type', 'model']):
            if not proj.get("product_name") or "uploaded" in proj.get("product_name", "").lower():
                proj["product_name"] = val_str
        elif 'manufacturer' in k:
            proj["manufacturer_name"] = val_str
        elif any(w in k for w in ['lifespan', 'rsl', 'reference service life']):
            num = clean_decimal_number(val_str)
            if num:
                proj["lifespan_years"] = int(num)

        # Installation / Commissioning Loss (check before generic refrigerant)
        elif any(w in k for w in ['test loss', 'commissioning loss', 'refrigerant test loss', 'pressure loss']):
            num = clean_decimal_number(val_str)
            if num:
                inst["commissioning_refrigerant_loss_kg"] = round(num, 2)

        # Operational / Refrigerant
        elif 'refrigerant' in k:
            m = re.search(r'\b(R-?1233zd(?:\(E\))?|R-?134a|R-?410a|R-?32|R-?1234ze|R-?513a|R-?290|R-?717)\b', val_str, re.I)
            if m:
                op["refrigerant_type"] = m.group(1).upper().replace('-', '')
            charge_m = re.search(r'(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:kg|lbs|kilos)', val_str, re.I)
            if charge_m:
                charge = clean_decimal_number(charge_m.group(1)) or 0.0
                if 'lb' in val_str.lower():
                    charge *= 0.453592
                op["refrigerant_charge_kg"] = round(charge, 2)
        elif any(w in k for w in ['leak rate', 'leakage']):
            num = clean_decimal_number(val_str)
            if num is not None:
                op["annual_leak_rate_percent"] = round(num, 2)
        elif any(w in k for w in ['capacity', 'cooling capacity']):
            num = clean_decimal_number(val_str)
            if num:
                if 'kw' in val_str.lower() and 'rt' not in val_str.lower() and 'ton' not in val_str.lower():
                    num /= 3.51685
                op["capacity_rt"] = round(num, 1)
        elif any(w in k for w in ['efficiency', 'kw/ton', 'kw/tr', 'iplv', 'cop']):
            num = clean_decimal_number(val_str)
            if num:
                op["efficiency_kw_per_ton"] = round(num, 3)

        # Manufacturing / Facility
        elif any(w in k for w in ['facility electricity', 'assembly electricity', 'manufacturing power', 'annual power']):
            num = clean_decimal_number(val_str)
            if num:
                if 'mwh' in val_str.lower():
                    num *= 1000.0
                mfg["annual_facility_kwh"] = round(num, 1)

        # Installation / Crane
        elif any(w in k for w in ['crane diesel', 'rigging diesel', 'crane']):
            num = clean_decimal_number(val_str)
            if num:
                inst["rigging_crane_diesel_liters"] = round(num, 1)
        elif any(w in k for w in ['outbound distance', 'delivery distance', 'transit to site', 'outbound']):
            num = clean_decimal_number(val_str)
            if num:
                inst["outbound_transport_km"] = round(num, 1)
        elif any(w in k for w in ['commissioning power', 'installation power', 'commissioning elec']):
            num = clean_decimal_number(val_str)
            if num:
                inst["installation_energy_kwh"] = round(num, 1)


def _parse_sheet_table(sheet_title: str, rows: List[tuple], extracted: Dict[str, Any]):
    """Classifies table columns and extracts records into the matching module."""
    header_idx = -1
    headers = []
    
    header_keywords = [
        'parameter', 'scope', 'value', 'unit', 'activity', 'resource', 'description', 'benchmark',
        'part', 'component', 'material', 'mass', 'weight', 'supplier', 'distance', 'km',
        'leg', 'mode', 'origin', 'destination', 'transport', 'crane', 'diesel', 'fuel',
        'energy', 'kwh', 'water', 'refrigerant', 'recycling', 'landfill', 'recovery', 'stream',
        'rate', 'cycle', 'specification', 'reading'
    ]

    # Find the header row
    for r_idx, row in enumerate(rows[:15]):
        row_str = [str(c).lower().strip() if c is not None else "" for c in row]
        matches = sum(1 for c in row_str if any(w in c for w in header_keywords))
        if matches >= 2:
            header_idx = r_idx
            headers = row_str
            break

    if header_idx == -1:
        return

    data_rows = rows[header_idx + 1:]
    header_text = " ".join(headers)

    # 1. Installation & Rigging Sheet (A4 / A5) - check first before generic transport
    if any(term in sheet_title for term in ['install', 'rigging', 'crane', 'jobsite', 'a4', 'a5', 'outbound']) or \
       any(w in header_text for w in ['crane', 'rigging', 'outbound', 'commissioning']):
        _extract_installation_table(headers, data_rows, extracted["installation"])
        return

    # 2. Inbound Transport / Logistics Manifest Sheet (A2)
    if any(term in sheet_title for term in ['logistics', 'transport', 'freight', 'a2']) or \
       (any(w in header_text for w in ['mode', 'origin', 'destination', 'freight']) and 'material' not in header_text):
        _extract_transport_table(headers, data_rows, extracted["transport"])
        return

    # 3. Operational Use & Maintenance Sheet (B1–B7)
    if any(term in sheet_title for term in ['operat', 'use_phase', 'maintenance', 'b1', 'b6', 'b7']) or \
       any(w in header_text for w in ['load %', 'kw/tr', 'cooling tower', 'lubricant', 'tube overhaul']):
        _extract_operational_table(headers, data_rows, extracted)
        return

    # 4. End of Life & Circularity Sheet (C1–C4, D)
    if any(term in sheet_title for term in ['end_of_life', 'eol', 'circularity', 'c1', 'c4', 'module_d']) or \
       any(w in header_text for w in ['recycling rate', 'landfill', 'decommissioning', 'scrap recovery']):
        _extract_eol_table(headers, data_rows, extracted)
        return

    # 5. Plant Utilities / Manufacturing (A3)
    if any(term in sheet_title for term in ['utility', 'factory', 'energy', 'manufacturing', 'a3']):
        _extract_utilities_table(headers, data_rows, extracted["manufacturing"])
        return

    # Default / Standard BOM Sheet (A1)
    _extract_bom_table(headers, data_rows, extracted["bom"], extracted["transport"])


def _extract_bom_table(headers: List[str], data_rows: List[tuple], bom: List[Dict[str, Any]], transport: List[Dict[str, Any]]):
    """Extracts BOM rows from engineering bill of materials."""
    name_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['part', 'component', 'item', 'desc', 'name'])), 0)
    mass_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['weight', 'mass', 'kg', 'qty'])), 1)
    mat_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['mat', 'metal', 'alloy', 'substance', 'type'])), -1)
    supp_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['suppl', 'vendor', 'origin', 'mfg'])), -1)
    km_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['km', 'dist', 'distance', 'transit'])), -1)

    base_idx = len(bom)
    for idx, row in enumerate(data_rows):
        if not row or all(c is None for c in row):
            continue
        raw_name = str(row[name_idx]).strip() if name_idx < len(row) and row[name_idx] is not None else f"Component {base_idx+idx+1}"
        if any(skip in raw_name.lower() for skip in ['total', 'sum', 'page', 'subtotal', 'signature', 'equipment']):
            continue

        raw_mass = row[mass_idx] if mass_idx < len(row) else None
        cleaned_mass = _clean_number(raw_mass)
        if cleaned_mass is None or cleaned_mass <= 0:
            continue

        raw_mat = str(row[mat_idx]).strip() if mat_idx != -1 and mat_idx < len(row) and row[mat_idx] is not None else raw_name
        ecoinvent_key = _map_material_to_ecoinvent(raw_mat)

        dist_km = _clean_number(row[km_idx]) if km_idx != -1 and km_idx < len(row) else 0.0
        supplier = str(row[supp_idx]).strip() if supp_idx != -1 and supp_idx < len(row) and row[supp_idx] is not None else "Declared Supplier"

        part_id = f"xlsx-bom-{base_idx+idx+1}"
        bom.append({
            "id": part_id,
            "name": raw_name,
            "material": ecoinvent_key,
            "mass": round(cleaned_mass, 2),
            "unit": "kg",
            "ecoinvent_id": f"ecoinvent_{ecoinvent_key}_glo",
            "supplier": supplier,
            "transport_km": dist_km if dist_km is not None else 0.0,
            "module": "A1"
        })

        # If BOM includes an inbound freight distance, auto-register an A2 transport leg
        if dist_km and dist_km > 0:
            transport.append({
                "id": f"a2-from-bom-{base_idx+idx+1}",
                "name": f"{supplier} -> Plant ({raw_name})",
                "mode": "Heavy Lorry >32t (EURO 6)",
                "distance": dist_km,
                "dist": dist_km,
                "mass_kg": round(cleaned_mass, 2),
                "linked_material_ids": [part_id],
                "emission_factor": 0.088,
                "ef": 0.088,
                "module": "A2"
            })


def _extract_transport_table(headers: List[str], data_rows: List[tuple], transport: List[Dict[str, Any]]):
    """Extracts explicit A2 transport manifest legs."""
    mode_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['mode', 'type', 'vehicle'])), -1)
    dist_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['dist', 'km', 'mile'])), -1)
    supp_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['supplier', 'vendor', 'carrier', 'name'])), -1)
    route_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['from', 'origin', 'route', 'destination'])), -1)
    mass_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['mass', 'weight', 'tonnes', 'kg'])), -1)

    base_idx = len(transport)
    for idx, row in enumerate(data_rows):
        if not row or all(c is None for c in row):
            continue
        dist_val = _clean_number(row[dist_idx]) if dist_idx != -1 and dist_idx < len(row) else 0.0
        if not dist_val or dist_val <= 0:
            continue

        mode_raw = str(row[mode_idx]).strip() if mode_idx != -1 and mode_idx < len(row) and row[mode_idx] is not None else ""
        supp_name = str(row[supp_idx]).strip() if supp_idx != -1 and supp_idx < len(row) and row[supp_idx] is not None else f"Logistics Partner {idx+1}"
        route = str(row[route_idx]).strip() if route_idx != -1 and route_idx < len(row) and row[route_idx] is not None else "Inbound Route"
        mass_val = _clean_number(row[mass_idx]) if mass_idx != -1 and mass_idx < len(row) else 0.0

        mode = detect_transport_mode(mode_raw, route)
        ef = 0.088 if "lorry" in mode.lower() else (0.0145 if "ship" in mode.lower() else 0.035)

        transport.append({
            "id": f"xlsx-a2-{base_idx+idx+1}",
            "name": f"{supp_name} ({route})",
            "mode": mode,
            "distance": round(dist_val, 1),
            "dist": round(dist_val, 1),
            "mass_kg": round(mass_val, 2) if mass_val else 0.0,
            "emission_factor": ef,
            "ef": ef,
            "module": "A2"
        })


def _extract_installation_table(headers: List[str], data_rows: List[tuple], installation: Dict[str, Any]):
    """Extracts job site rigging, crane diesel, and commissioning parameters."""
    val_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['quant', 'val', 'amount', 'liter', 'kwh', 'dist', 'consumption'])), -1)
    dist_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['dist', 'km', 'transit'])), -1)

    for row in data_rows:
        if not row or all(c is None for c in row):
            continue
        row_str = " ".join(str(c).lower() for c in row if c is not None)
        
        # Check outbound distance table
        if dist_idx != -1 and dist_idx < len(row):
            d = clean_decimal_number(row[dist_idx])
            if d and d > 0:
                cur_dist = installation.get("outbound_transport_km", 0.0)
                if d > cur_dist:
                    installation["outbound_transport_km"] = round(d, 1)

        # Get the actual value cell
        val = 0.0
        if val_idx != -1 and val_idx < len(row):
            val = clean_decimal_number(row[val_idx]) or 0.0
        else:
            for c in row:
                if isinstance(c, (int, float)) and not isinstance(c, bool):
                    val = float(c)
                    break
                elif c is not None and re.match(r'^\s*[-+]?\d+(?:\.\d+)?\s*$', str(c)):
                    val = float(str(c).strip())
                    break

        if val <= 0:
            continue

        if any(w in row_str for w in ['crane', 'diesel', 'fuel', 'hydraulic']):
            installation["rigging_crane_diesel_liters"] = round(val, 1)
        elif any(w in row_str for w in ['commissioning electricity', 'installation energy', 'power', 'hookup']):
            installation["installation_energy_kwh"] = round(val, 1)
        elif any(w in row_str for w in ['refrigerant loss', 'test loss', 'commissioning loss', 'pressure decay']):
            installation["commissioning_refrigerant_loss_kg"] = round(val, 2)
        elif any(w in row_str for w in ['outbound', 'transit to site', 'delivery distance']):
            installation["outbound_transport_km"] = round(val, 1)


def _extract_row_numeric_value(row: tuple, headers: List[str] = None) -> float:
    """Safely extracts the primary quantitative value from a table row, prioritizing numeric cells over text with digits."""
    # 1. First priority: native float/int cells
    for idx, c in enumerate(row):
        if isinstance(c, (int, float)) and not isinstance(c, bool):
            if headers and idx < len(headers):
                h = headers[idx].lower()
                if any(w in h for w in ['id', 'no', 'num', 'step', '#', 'seq', 'item']):
                    continue
            return float(c)

    # 2. Second priority: column designated by header
    if headers:
        val_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['val', 'quant', 'amount', 'reading', 'rate', 'metric', 'kw', 'spec', 'share', 'percent', '%'])), -1)
        if val_idx != -1 and val_idx < len(row):
            v = clean_decimal_number(row[val_idx])
            if v is not None:
                return float(v)

    # 3. Third priority: look at non-label columns (skip column 0 if multi-column)
    start_col = 1 if len(row) > 1 else 0
    for c in row[start_col:]:
        if c is not None:
            c_str = str(c).strip()
            if re.match(r'^[-+]?\d+(?:\.\d+)?%?$', c_str):
                v = clean_decimal_number(c_str)
                if v is not None:
                    return float(v)

    # 4. Fallback: clean_decimal_number on non-label columns
    for c in row[start_col:]:
        v = clean_decimal_number(c)
        if v is not None:
            return float(v)

    return 0.0


def _extract_operational_table(headers: List[str], data_rows: List[tuple], extracted: Dict[str, Any]):
    """Extracts use-phase operational specs (load curve, maintenance, water)."""
    op = extracted["operational"]
    fl_eff = 0.58
    iplv = 0.52
    
    for row in data_rows:
        if not row or all(c is None for c in row):
            continue
        row_str = " ".join(str(c).lower() for c in row if c is not None)
        val = _extract_row_numeric_value(row, headers)

        if '100%' in row_str or 'full load' in row_str:
            if val > 0:
                fl_eff = val
        elif '75%' in row_str or 'iplv' in row_str:
            if val > 0:
                iplv = val
        elif any(w in row_str for w in ['cooling tower', 'water evaporation', 'm3/yr', 'tower water']):
            if val > 0:
                op["cooling_tower_water_m3_yr"] = round(val, 1)
        elif any(w in row_str for w in ['scheduled maintenance', 'maintenance electricity']):
            if val > 0:
                op["scheduled_maintenance_kwh_yr"] = round(val, 1)
        elif any(w in row_str for w in ['lubricant', 'oil change', 'poe oil']):
            if val > 0:
                extracted.setdefault("maintenance_b2", {})["consumable_mass_kg"] = round(val, 2)
                extracted["maintenance_b2"]["provider_id"] = "ecoinvent_lubricating_oil_glo"

    op["efficiency_kw_per_ton"] = round(fl_eff, 3)
    op["iplv_kw_per_ton"] = round(iplv, 3)


def _extract_eol_table(headers: List[str], data_rows: List[tuple], extracted: Dict[str, Any]):
    """Extracts end-of-life rates (C1-C4) and circularity recovery (Module D)."""
    eol = extracted["end_of_life"]
    circ = extracted["circularity_d"]

    for row in data_rows:
        if not row or all(c is None for c in row):
            continue
        row_str = " ".join(str(c).lower() for c in row if c is not None)
        val = _extract_row_numeric_value(row, headers)

        if 'landfill' in row_str:
            eol["landfill_rate_percent"] = round(val, 1)
        elif 'incinerat' in row_str:
            eol["incineration_rate_percent"] = round(val, 1)
        elif 'recycl' in row_str and 'non-recycl' not in row_str and 'un-recycl' not in row_str:
            eol["recycling_rate_percent"] = round(val, 1)
        elif any(w in row_str for w in ['decommissioning', 'dismantling']):
            eol["decommissioning_energy_kwh"] = round(val, 1)
        elif any(w in row_str for w in ['waste transport', 'shredder distance']):
            eol["waste_transport_km"] = round(val, 1)
        elif 'steel' in row_str and 'recover' in row_str:
            circ["steel_scrap_recovery_rate"] = round(val, 1)
        elif 'copper' in row_str and 'recover' in row_str:
            circ["copper_scrap_recovery_rate"] = round(val, 1)
        elif 'aluminium' in row_str and 'recover' in row_str:
            circ["aluminium_recovery_rate"] = round(val, 1)




def _extract_utilities_table(headers: List[str], data_rows: List[tuple], mfg: Dict[str, Any]):
    """Extracts monthly or annual plant utility sums (A3)."""
    tot_kwh = 0.0
    tot_gas = 0.0
    tot_water = 0.0

    kwh_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['elec', 'kwh', 'power'])), -1)
    gas_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['gas', 'scm', 'mj'])), -1)
    water_idx = next((i for i, h in enumerate(headers) if any(w in h for w in ['water', 'kl', 'm3'])), -1)

    for row in data_rows:
        if not row or all(c is None for c in row):
            continue
        row_str = " ".join(str(c).lower() for c in row if c is not None)
        if 'total' in row_str:
            continue
        if kwh_idx != -1 and kwh_idx < len(row):
            val = _clean_number(row[kwh_idx])
            if val:
                tot_kwh += val
        if gas_idx != -1 and gas_idx < len(row):
            val = _clean_number(row[gas_idx])
            if val:
                tot_gas += val
        if water_idx != -1 and water_idx < len(row):
            val = _clean_number(row[water_idx])
            if val:
                tot_water += val

    if tot_kwh > 0:
        mfg["annual_facility_kwh"] = round(tot_kwh, 1)
    if tot_gas > 0:
        mfg["natural_gas_mj"] = round(tot_gas * 38.0 if tot_gas < 100000 else tot_gas, 1)
    if tot_water > 0:
        mfg["water_m3"] = round(tot_water, 1)
