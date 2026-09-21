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
        
        dist_km = _clean_number(row[col_km_idx]) if col_km_idx != -1 and col_km_idx < len(row) else 0.0
        supplier = str(row[col_supp_idx]).strip() if col_supp_idx != -1 and col_supp_idx < len(row) and row[col_supp_idx] is not None else "Declared Supplier"
        
        extracted_bom.append({
            "id": f"xlsx-{idx+1}",
            "name": raw_name,
            "material": ecoinvent_key,
            "mass": round(cleaned_mass, 2),
            "unit": "kg",
            "ecoinvent_id": f"ecoinvent_{ecoinvent_key}_glo",
            "supplier": supplier,
            "transport_km": dist_km if dist_km is not None else 0.0,
            "module": "A1"
        })

    return {
        "bom": extracted_bom
    }

