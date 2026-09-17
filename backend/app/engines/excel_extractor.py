import io
import re
from typing import Dict, Any, List, Optional
import openpyxl
from .pdf_extractor import _clean_number, _map_material_to_ecoinvent

def extract_excel_data(excel_bytes: bytes) -> Dict[str, Any]:
    """
    Extracts structured BOM components from an uploaded Excel file using openpyxl.
    """
    wb = openpyxl.load_workbook(io.BytesIO(excel_bytes), data_only=True)
    sheet = wb.active
    
    extracted_bom: List[Dict[str, Any]] = []
    
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return {"bom": []}
        
    header_idx = 0
    col_name_idx = -1
    col_mass_idx = -1
    col_mat_idx = -1
    col_km_idx = -1
    col_supp_idx = -1
    
    # Search for header row
    for r_idx, row in enumerate(rows[:10]):
        row_str = [str(c).lower().strip() if c is not None else "" for c in row]
        cand_name_idx = -1
        cand_mass_idx = -1
        cand_mat_idx = -1
        cand_km_idx = -1
        cand_supp_idx = -1
        for c_idx, val in enumerate(row_str):
            if any(k in val for k in ['part', 'component', 'item', 'desc', 'name']):
                if cand_name_idx == -1:
                    cand_name_idx = c_idx
            elif any(k in val for k in ['weight', 'mass', 'kg', 'lb', 'qty']):
                if cand_mass_idx == -1:
                    cand_mass_idx = c_idx
            elif any(k in val for k in ['mat', 'metal', 'alloy', 'substance', 'type']):
                if cand_mat_idx == -1:
                    cand_mat_idx = c_idx
            elif any(k in val for k in ['km', 'dist', 'distance', 'transit']):
                if cand_km_idx == -1:
                    cand_km_idx = c_idx
            elif any(k in val for k in ['suppl', 'vendor', 'origin', 'mfg']):
                if cand_supp_idx == -1:
                    cand_supp_idx = c_idx
        if cand_name_idx != -1 and cand_mass_idx != -1:
            header_idx = r_idx
            col_name_idx = cand_name_idx
            col_mass_idx = cand_mass_idx
            col_mat_idx = cand_mat_idx
            col_km_idx = cand_km_idx
            col_supp_idx = cand_supp_idx
            break

    # Fallback column indexes
    if col_name_idx == -1:
        col_name_idx = 0
    if col_mass_idx == -1:
        col_mass_idx = 1

    for idx, row in enumerate(rows[header_idx + 1:]):
        if not row or all(c is None for c in row):
            continue
            
        raw_name = str(row[col_name_idx]).strip() if col_name_idx < len(row) and row[col_name_idx] is not None else f"Component {idx+1}"
        if any(skip in raw_name.lower() for skip in ['total', 'sum', 'page', 'subtotal', 'signature']):
            continue
            
        raw_mass = row[col_mass_idx] if col_mass_idx < len(row) else None
        cleaned_mass = _clean_number(raw_mass)
        if cleaned_mass is None or cleaned_mass <= 0:
            continue
            
        raw_mat = str(row[col_mat_idx]).strip() if col_mat_idx != -1 and col_mat_idx < len(row) and row[col_mat_idx] is not None else raw_name
        ecoinvent_key = _map_material_to_ecoinvent(raw_mat)
        
        dist_km = _clean_number(row[col_km_idx]) if col_km_idx != -1 and col_km_idx < len(row) else 450.0
        supplier = str(row[col_supp_idx]).strip() if col_supp_idx != -1 and col_supp_idx < len(row) and row[col_supp_idx] is not None else "Tier-1 Partner"
        
        extracted_bom.append({
            "id": f"xlsx-{idx+1}",
            "name": raw_name,
            "material": ecoinvent_key,
            "mass": round(cleaned_mass, 2),
            "unit": "kg",
            "ecoinvent_id": f"ecoinvent_{ecoinvent_key}_glo",
            "supplier": supplier,
            "transport_km": dist_km or 450.0,
            "module": "A1"
        })

    return {
        "bom": extracted_bom,
        "manufacturing": {
            "annual_facility_kwh": 34000,
            "natural_gas_mj": 18500,
            "grid_region": "US_Average",
            "water_m3": 45.0
        },
        "transport": [
            { "mode": "Heavy Lorry >32t (EURO 6)", "distance": 485, "dist": 485, "emission_factor": 0.088, "ef": 0.088, "module": "A2" },
            { "mode": "Heavy Delivery Lorry >32t to Customer Site", "distance": 500, "dist": 500, "emission_factor": 0.088, "ef": 0.088, "module": "A4" }
        ],
        "installation": {
            "outbound_transport_km": 500,
            "transport_mode": "Heavy Lorry >32t (EURO 6)",
            "installation_energy_kwh": 350,
            "commissioning_refrigerant_loss_kg": 0.5,
            "rigging_crane_diesel_liters": 25.0
        },
        "operational": {
            "refrigerant_type": "R134a",
            "refrigerant_charge_kg": 45.0,
            "annual_leak_rate_percent": 2.0,
            "fugitive_operational_leak_rate": 0.5,
            "efficiency_kw_per_ton": 0.54,
            "capacity_rt": 500.0,
            "target_cities": ["Chicago", "Houston", "Frankfurt", "Dubai"],
            "cooling_tower_water_m3_yr": 120.0,
            "scheduled_maintenance_kwh_yr": 180.0,
            "major_component_replacement_year": 15
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
