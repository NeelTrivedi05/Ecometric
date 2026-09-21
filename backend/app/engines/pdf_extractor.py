import io
import re
from typing import Dict, Any, List, Optional
import pdfplumber

def _clean_number(val: Any) -> Optional[float]:
    if val is None:
        return None
    s = str(val).strip().replace(',', '')
    match = re.search(r'[-+]?\d*\.?\d+', s)
    if match:
        try:
            num = float(match.group())
            if 'lb' in s.lower():
                num = num * 0.453592
            elif 'ton' in s.lower() and 'rt' not in s.lower() and 'refriger' not in s.lower():
                num = num * 1000.0
            return num
        except ValueError:
            return None
    return None

def _map_material_to_ecoinvent(text: str) -> str:
    s = text.lower()
    if 'stainless' in s or '304' in s or '316' in s:
        return 'steel_stainless_304'
    elif 'copper' in s or re.search(r'\bcu\b', s) or ('tube' in s and 'steel' not in s):
        return 'copper_tube_wire'
    elif 'aluminium' in s or 'aluminum' in s or re.search(r'\bal\b', s):
        return 'aluminium_cast_alloy'
    elif 'motor' in s or 'compressor' in s or 'rotor' in s or 'stator' in s:
        return 'electric_motor_industrial'
    elif any(k in s for k in ['vfd', 'invert', 'pcb', 'circuit', 'control', 'electron']):
        return 'electronics_vfd'
    elif any(k in s for k in ['insulat', 'foam', 'polyurethane', 'puf']):
        return 'insulation_polyurethane_rigid'
    elif 'steel' in s or 'iron' in s:
        return 'steel_hot_rolled'
    else:
        return 'steel_hot_rolled'

def extract_pdf_data(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Extracts structured BOM tables and operational parameters from a PDF document
    locally using pdfplumber without calling any external AI API.
    """
    extracted_bom: List[Dict[str, Any]] = []
    full_text = ""
    
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            page_text = page.extract_text() or ""
            full_text += "\n" + page_text
            
            # 1. Extract tables
            tables = page.extract_tables() or []
            for table in tables:
                if not table or len(table) < 2:
                    continue
                
                # Check if table represents general equipment specifications rather than a parts BOM
                all_table_text = " ".join(str(cell).lower() for r in table for cell in r if cell)
                spec_indicators = ['nominal capacity', 'rated input', 'efficiency', 'flow', 'dimensions', 'refrigerant', 'shipping weight', 'operating weight']
                is_spec_table = sum(1 for ind in spec_indicators if ind in all_table_text) >= 2
                
                if is_spec_table:
                    # Extract specs directly from key-value rows
                    for r in table:
                        if not r or len(r) < 2:
                            continue
                        k_str = str(r[0]).lower().strip()
                        v_str = str(r[1]).strip()
                        if 'shipping weight' in k_str:
                            w_match = re.search(r'([0-9,.]+)\s*(lb|lbs|kg|tons?|t)?', v_str, re.IGNORECASE)
                            if w_match:
                                val = _clean_number(w_match.group(1)) or 0.0
                                u = (w_match.group(2) or "lb").lower()
                                if 'lb' in u:
                                    val *= 0.453592
                                elif u in ['t', 'tons', 'ton']:
                                    val *= 1000.0
                                if val > 0:
                                    shipping_weight_kg = round(val, 1)
                        elif 'nominal capacity' in k_str:
                            c_m = re.search(r'([0-9,.]+)\s*(?:tons?|tr|rt)', v_str, re.IGNORECASE)
                            if c_m:
                                capacity_rt = _clean_number(c_m.group(1)) or capacity_rt
                        elif 'full-load efficiency' in k_str:
                            eff_m = re.search(r'([0-9,.]+)', v_str)
                            if eff_m:
                                eff_val = _clean_number(eff_m.group(1))
                                if eff_val:
                                    efficiency_kw_per_ton = eff_val
                        elif 'refrigerant' in k_str:
                            ref_m = re.search(r'\b(R-?1233zd(?:\(E\))?|R-?134a|R-?410a|R-?32|R-?1234ze|R-?513a|R-?290|R-?717|R-?454b)\b', v_str, re.IGNORECASE)
                            if ref_m:
                                refrigerant_type = ref_m.group(1).upper().replace('-', '')
                    continue

                # Identify header row for true BOM tables
                header = [str(c).lower().strip() if c else "" for c in table[0]]
                col_name_idx = -1
                col_mass_idx = -1
                col_mat_idx = -1
                col_km_idx = -1
                col_supp_idx = -1
                
                for idx, h in enumerate(header):
                    if any(k in h for k in ['part', 'component', 'item', 'desc', 'name']):
                        if col_name_idx == -1:
                            col_name_idx = idx
                    elif any(k in h for k in ['weight', 'mass', 'kg', 'lb', 'qty']):
                        if col_mass_idx == -1:
                            col_mass_idx = idx
                    elif any(k in h for k in ['mat', 'metal', 'alloy', 'substance', 'type']):
                        if col_mat_idx == -1:
                            col_mat_idx = idx
                    elif any(k in h for k in ['km', 'dist', 'distance', 'transit']):
                        if col_km_idx == -1:
                            col_km_idx = idx
                    elif any(k in h for k in ['suppl', 'vendor', 'origin', 'mfg']):
                        if col_supp_idx == -1:
                            col_supp_idx = idx
                            
                # Fallback: if columns not named standardly, check if col 0 has words, col 1 has numbers
                if col_name_idx == -1 and len(table[0]) >= 2:
                    col_name_idx = 0
                    col_mass_idx = 1
                elif col_mass_idx == -1 and len(table[0]) >= 2:
                    col_mass_idx = 1
                
                # Parse rows
                for row_idx, row in enumerate(table[1:]):
                    if not row or all(c is None or str(c).strip() == "" for c in row):
                        continue
                    
                    raw_name = str(row[col_name_idx]).strip() if col_name_idx < len(row) and row[col_name_idx] else f"Part {page_idx+1}-{row_idx+1}"
                    # Skip subheadings or summary lines
                    if any(skip in raw_name.lower() for skip in ['total', 'sum', 'page', 'subtotal']):
                        continue
                        
                    raw_mass = row[col_mass_idx] if col_mass_idx != -1 and col_mass_idx < len(row) else None
                    cleaned_mass = _clean_number(raw_mass)
                    if cleaned_mass is None or cleaned_mass <= 0:
                        continue
                        
                    raw_mat = str(row[col_mat_idx]).strip() if col_mat_idx != -1 and col_mat_idx < len(row) and row[col_mat_idx] else raw_name
                    ecoinvent_key = _map_material_to_ecoinvent(raw_mat)
                    
                    dist_km = _clean_number(row[col_km_idx]) if col_km_idx != -1 and col_km_idx < len(row) else 450.0
                    supplier = str(row[col_supp_idx]).strip() if col_supp_idx != -1 and col_supp_idx < len(row) and row[col_supp_idx] else "Tier-1 Partner"
                    
                    extracted_bom.append({
                        "id": f"pdf-{page_idx+1}-{row_idx+1}",
                        "name": raw_name,
                        "material": ecoinvent_key,
                        "mass": round(cleaned_mass, 2),
                        "unit": "kg",
                        "ecoinvent_id": f"ecoinvent_{ecoinvent_key}_glo",
                        "supplier": supplier,
                        "transport_km": dist_km or 450.0,
                        "module": "A1"
                    })

    # 2. Extract operational & project specs from text via regex
    product_name = "Industrial Product Model"
    p_match = re.search(r'(?:product|model|equipment|chiller)\s*(?:name|type)?\s*[:=]\s*([^\r\n]+)', full_text, re.IGNORECASE)
    if p_match:
        product_name = p_match.group(1).strip()[:60]
        
    capacity_rt = 500.0
    c_match = re.search(r'(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:rt|tons?|tr)\b', full_text, re.IGNORECASE)
    if c_match:
        try:
            val_clean = str(c_match.group(1)).replace(',', '')
            capacity_rt = float(val_clean)
        except ValueError:
            pass

    refrigerant_type = ""
    ref_match = re.search(r'\b(R-?1233zd(?:\(E\))?|R-?134a|R-?410a|R-?32|R-?1234ze|R-?513a|R-?290|R-?717|R-?454b)\b', full_text, re.IGNORECASE)
    if ref_match:
        refrigerant_type = ref_match.group(1).upper().replace('-', '')

    charge_kg = 0.0
    charge_match = re.search(r'(?:refrigerant\s*charge|charge)\s*[:=]?\s*([0-9,.]+)\s*(?:kg|lbs|kilos)', full_text, re.IGNORECASE)
    if charge_match:
        c_num = _clean_number(charge_match.group(1)) or 0.0
        if 'lb' in charge_match.group(0).lower():
            c_num *= 0.453592
        charge_kg = round(c_num, 1)

    # Shipping / Operating weight extraction
    shipping_weight_kg = 0.0
    weight_match = re.search(r'(?:shipping\s*weight|operating\s*weight|total\s*weight|weight)\s*[:=]?\s*([0-9,.]+)\s*(lb|lbs|kg|tons?|t)\b', full_text, re.IGNORECASE)
    if weight_match:
        w_val = _clean_number(weight_match.group(1)) or 0.0
        unit = weight_match.group(2).lower()
        if 'lb' in unit:
            w_val *= 0.453592
        elif unit in ['t', 'tons', 'ton']:
            w_val *= 1000.0
        shipping_weight_kg = round(w_val, 1)

    kwh = 0.0
    kwh_match = re.search(r'(\d+(?:,\d+)?)\s*kwh', full_text, re.IGNORECASE)
    if kwh_match:
        num = _clean_number(kwh_match.group(1))
        if num and num > 0:
            kwh = num

    result_payload: Dict[str, Any] = {
        "project_info": {
            "product_name": product_name or "Uploaded PDF Equipment Model",
            "functional_unit": f"1 unit over 25 years reference service life ({capacity_rt} RT)" if capacity_rt else "1 unit",
            "pcr_ref": "UL 10010-4 Part B & EN 15804+A2",
            "lifespan_years": 25
        },
        "bom": extracted_bom,
    }

    if shipping_weight_kg > 0:
        result_payload["_shipping_weight_kg"] = shipping_weight_kg

    if kwh > 0:
        result_payload["manufacturing"] = {
            "annual_facility_kwh": kwh,
            "natural_gas_mj": 0.0,
            "grid_region": "US_Average",
            "water_m3": 0.0
        }

    if refrigerant_type or charge_kg > 0 or capacity_rt > 0:
        result_payload["operational"] = {
            "refrigerant_type": refrigerant_type,
            "refrigerant_charge_kg": charge_kg,
            "efficiency_kw_per_ton": 0.54 if capacity_rt > 0 else 0.0,
            "capacity_rt": capacity_rt,
            "annual_leak_rate_percent": 2.0 if charge_kg > 0 else 0.0
        }

    return result_payload

