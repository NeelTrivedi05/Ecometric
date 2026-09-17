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
                
                # Identify header row
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
    c_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:rt|tons?|tr)\b', full_text, re.IGNORECASE)
    if c_match:
        try:
            capacity_rt = float(c_match.group(1))
        except ValueError:
            pass

    refrigerant_type = "R134a"
    ref_match = re.search(r'\b(R-?134a|R-?410a|R-?32|R-?1234ze|R-?290|R-?717)\b', full_text, re.IGNORECASE)
    if ref_match:
        refrigerant_type = ref_match.group(1).upper().replace('-', '')

    charge_kg = 45.0
    charge_match = re.search(r'(?:refrigerant\s*charge|charge)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:kg|lbs)', full_text, re.IGNORECASE)
    if charge_match:
        charge_kg = _clean_number(charge_match.group(1)) or 45.0

    kwh = 34000
    kwh_match = re.search(r'(\d+(?:,\d+)?)\s*kwh', full_text, re.IGNORECASE)
    if kwh_match:
        num = _clean_number(kwh_match.group(1))
        if num and num > 100:
            kwh = num

    return {
        "project_info": {
            "product_name": product_name,
            "functional_unit": f"1 unit over 25 years reference service life ({capacity_rt} RT)",
            "pcr_ref": "UL 10010-4 Part B & EN 15804+A2",
            "lifespan_years": 25
        },
        "bom": extracted_bom,
        "manufacturing": {
            "annual_facility_kwh": kwh,
            "natural_gas_mj": 18500,
            "grid_region": "US_Average",
            "water_m3": 45.0
        },
        "operational": {
            "refrigerant_type": refrigerant_type,
            "refrigerant_charge_kg": charge_kg,
            "efficiency_kw_per_ton": 0.54,
            "capacity_rt": capacity_rt,
            "annual_leak_rate_percent": 2.0
        },
        "transport": [
            { "mode": "Heavy Lorry >32t (EURO 6)", "distance": 485, "dist": 485, "emission_factor": 0.088, "ef": 0.088, "module": "A2" },
            { "mode": "Transoceanic Container Ship", "distance": 1200, "dist": 1200, "emission_factor": 0.0145, "ef": 0.0145, "module": "A2" },
            { "mode": "Heavy Delivery Lorry >32t to Customer Site", "distance": 500, "dist": 500, "emission_factor": 0.088, "ef": 0.088, "module": "A4" }
        ],
        "installation": {
            "outbound_transport_km": 500,
            "transport_mode": "Heavy Lorry >32t (EURO 6)",
            "installation_energy_kwh": 350,
            "commissioning_refrigerant_loss_kg": 0.5,
            "rigging_crane_diesel_liters": 25.0
        },
        "end_of_life": {
            "recycling_rate_percent": 92.4,
            "landfill_rate_percent": 4.5,
            "incineration_rate_percent": 3.1,
            "decommissioning_energy_kwh": 120,
            "waste_transport_km": 100
        },
        "circularity_d": {
            "steel_scrap_recovery_rate": 95.0,
            "copper_scrap_recovery_rate": 96.0,
            "aluminium_recovery_rate": 90.0,
            "refrigerant_reclamation_rate": 92.0,
            "net_avoided_burden_gwp_kg": -3210.0
        }
    }
