"""Export calculated impacts and product information for a draft declaration."""

from typing import Any, Dict, Optional
import hashlib
import json

from app.products import project_info_defaults


def serialize_openepd_json(
    extracted_data: Dict[str, Any],
    results_payload: Dict[str, Any],
    dqr_report: Optional[Dict[str, Any]] = None,
    methodology: str = "TRACI 2.1"
) -> Dict[str, Any]:
    """
    Constructs an openEPD v2.0 compliant digital declaration.
    """
    proj = extracted_data.get("project_info", {}) or {}
    defaults = project_info_defaults(proj.get("product_category"))
    product_name = proj.get("product_name") or defaults["product_category_name"]
    manufacturer_name = proj.get("manufacturer_name") or proj.get("manufacturer") or ""
    content = json.dumps([extracted_data, results_payload, methodology], sort_keys=True, default=str)
    draft_id = "DRAFT-" + hashlib.sha256(content.encode()).hexdigest()[:16]
    metadata = results_payload.get("epd_metadata") or results_payload.get("metadata") or {}
    row_units = metadata.get("row_units") or {}

    # Extract impact rows
    epd_res = results_payload.get("epd_results", results_payload.get("results", results_payload))
    openepd_impacts = {}
    
    # Map to canonical openEPD keys
    key_mapping = {
        "gwp": ["global warming", "climate change", "gwp100", "gwp - total"],
        "odp": ["ozone depletion", "odp"],
        "ap": ["acidification", "ap"],
        "ep": ["eutrophication", "ep"],
        "pocp": ["photochemical", "smog", "pocp", "mir"],
        "adpe": ["abiotic depletion - elements", "minerals", "metals", "adp-elements"],
        "adpf": ["abiotic depletion - fossil", "fossil resources", "energy resources", "adp-fossil"],
    }

    if isinstance(epd_res, dict):
        for oepd_key, match_patterns in key_mapping.items():
            matched_row_key = next((k for k in epd_res.keys() if any(p in k.lower() for p in match_patterns)), None)
            if matched_row_key and isinstance(epd_res[matched_row_key], dict):
                row = epd_res[matched_row_key]
                openepd_impacts[oepd_key] = {
                    "raw_indicator_name": matched_row_key,
                    "unit": row_units.get(matched_row_key),
                    "a1a3": float(row.get("A1-A3", 0.0) or (float(row.get("A1", 0)) + float(row.get("A2", 0)) + float(row.get("A3", 0)))),
                    "a1": float(row.get("A1", 0.0)),
                    "a2": float(row.get("A2", 0.0)),
                    "a3": float(row.get("A3", 0.0)),
                    "a4": float(row.get("A4", 0.0)),
                    "a5": float(row.get("A5", 0.0)),
                    "b1": float(row.get("B1", 0.0)),
                    "b2": float(row.get("B2", 0.0)),
                    "b3": float(row.get("B3", 0.0)),
                    "b4": float(row.get("B4", 0.0)),
                    "b5": float(row.get("B5", 0.0)),
                    "b6": float(row.get("B6", 0.0)),
                    "b7": float(row.get("B7", 0.0)),
                    "c1": float(row.get("C1", 0.0)),
                    "c2": float(row.get("C2", 0.0)),
                    "c3": float(row.get("C3", 0.0)),
                    "c4": float(row.get("C4", 0.0)),
                    "c1c4": float(row.get("C1-C4", 0.0) or sum(float(row.get(f"C{i}", 0.0)) for i in range(1, 5))),
                    "d": float(row.get("D", 0.0)),
                }

    return {
        "doctype": "openEPD",
        "openepd_version": "2.0",
        "id": draft_id,
        "status": "Draft",
        "declaration_type": "Product EPD",
        "product_name": product_name,
        "description": proj.get("product_description") or "",
        "manufacturer": {"name": manufacturer_name},
        "pcr": {"name": proj.get("pcr_ref") or defaults["pcr_ref"]},
        "declared_unit": {
            "qty": proj.get("fu_quantity") or 1,
            "unit": proj.get("fu_unit") or defaults["fu_unit"],
            "description": proj.get("functional_unit") or proj.get("declared_unit")
                or defaults["functional_unit"] or defaults["declared_unit"],
        },
        "lca_methodology": methodology,
        "third_party_verification": {"status": "Unverified"},
        "data_quality_assessment": dqr_report or {},
        "impacts": openepd_impacts,
    }
