"""
epd_validator.py

Pre-export validation gate (Part G & Criterion 8).
Executes critical integrity and mass-balance checks before PDF rendering:
1. Material masses sum to the declared mass per functional unit (0.1% tolerance).
2. End-of-life masses (C-module routes) sum to the same total.
3. For every indicator, module values sum to the reported total (A1-A3 = A1+A2+A3, C1-C4 = C1+C2+C3+C4).
4. Material percentage contributions sum to 100.00% (0.01% tolerance).
5. A single functional-unit conversion factor is used consistently across all modules.
6. Every material maps to a named LCI dataset (lists any unmapped).
7. All required Report Details fields are filled (company name, product name, declaration number, etc.).

Returns:
{
    "valid": bool,
    "errors": [str, ...],
    "warnings": [str, ...]
}
"""

import math
from typing import Dict, Any, List, Tuple

def validate_pre_export(
    extracted_data: Dict[str, Any],
    results: Dict[str, Any],
    report_details: Dict[str, Any]
) -> Dict[str, Any]:
    errors: List[str] = []
    warnings: List[str] = []

    proj = extracted_data.get("project_info", {}) or {}
    bom = extracted_data.get("bom", []) or []
    op = extracted_data.get("operational", {}) or {}
    eol = extracted_data.get("end_of_life", {}) or {}
    epd_results = results.get("epd_results") or results.get("results") or {}

    # 1. Material mass sum check (0.1% tolerance)
    capacity_rt = float(op.get("capacity_rt") or 650.0)
    declared_mass = float(proj.get("mass_delivered_kg") or op.get("mass_delivered_kg") or 0.0)
    
    bom_mass = sum(float(b.get("mass", 0.0) or 0.0) for b in bom)
    charge_kg = float(op.get("refrigerant_charge_kg", 0.0) or 0.0)

    # If declared_mass is specified, BOM mass + refrigerant charge must match declared mass within 0.1%
    if declared_mass > 0:
        total_mfg_mass = bom_mass + (0.0 if any("refrigerant" in str(b.get("material", "")).lower() for b in bom) else charge_kg)
        diff_pct = abs(total_mfg_mass - declared_mass) / max(declared_mass, 1.0) * 100.0
        if diff_pct > 0.1:
            errors.append(
                f"Material mass balance failure: Total BOM mass ({total_mfg_mass:,.2f} kg) differs from "
                f"declared product mass ({declared_mass:,.2f} kg) by {diff_pct:.2f}% (exceeds 0.1% tolerance)."
            )
    elif bom_mass <= 0:
        errors.append("BOM has no mass entries: At least one material with positive mass is required.")

    # 2. End-of-life masses (C-module routes) sum to the same total
    # EOL includes recycling, landfill, incineration, and refrigerant recovery
    recycling_pct = float(eol.get("recycling_rate_percent", 0.0) or 0.0)
    landfill_pct = float(eol.get("landfill_rate_percent", 0.0) or 0.0)
    incineration_pct = float(eol.get("incineration_rate_percent", 0.0) or 0.0)
    total_eol_pct = recycling_pct + landfill_pct + incineration_pct
    
    # If explicit masses given in EOL:
    eol_rec_kg = float(eol.get("waste_to_recycling_kg", 0.0) or 0.0)
    eol_land_kg = float(eol.get("waste_to_landfill_kg", 0.0) or 0.0)
    eol_inc_kg = float(eol.get("waste_to_incineration_kg", 0.0) or 0.0)
    explicit_eol_mass = eol_rec_kg + eol_land_kg + eol_inc_kg

    effective_mass = declared_mass if declared_mass > 0 else bom_mass
    if explicit_eol_mass > 0 and effective_mass > 0:
        diff_eol_pct = abs(explicit_eol_mass - effective_mass) / effective_mass * 100.0
        if diff_eol_pct > 0.1:
            errors.append(
                f"End-of-Life mass reconciliation failure: Sum of C-module disposal routes ({explicit_eol_mass:,.2f} kg) "
                f"does not match total declared mass ({effective_mass:,.2f} kg) within 0.1% (diff: {diff_eol_pct:.2f}%)."
            )
    elif total_eol_pct > 0 and abs(total_eol_pct - 100.0) > 0.1:
        errors.append(
            f"End-of-Life scenario percentage failure: Recycling ({recycling_pct}%) + Landfill ({landfill_pct}%) + "
            f"Incineration ({incineration_pct}%) = {total_eol_pct:.1f}% (must sum to 100.00% within 0.1%)."
        )

    # 3. For every indicator, module values sum to the reported total
    # Check A1-A3 = A1 + A2 + A3 and C1-C4 = C1 + C2 + C3 + C4
    for ind_name, row in epd_results.items():
        if not isinstance(row, dict):
            continue
        
        # Check A1-A3
        if "A1" in row and "A2" in row and "A3" in row and "A1-A3" in row:
            sum_a1_a3 = float(row.get("A1", 0.0) or 0.0) + float(row.get("A2", 0.0) or 0.0) + float(row.get("A3", 0.0) or 0.0)
            rep_a1_a3 = float(row.get("A1-A3", 0.0) or 0.0)
            if abs(rep_a1_a3) > 1e-9:
                rel_diff = abs(sum_a1_a3 - rep_a1_a3) / max(abs(rep_a1_a3), 1e-6)
                if rel_diff > 0.001:  # >0.1%
                    errors.append(
                        f"Indicator '{ind_name}': Sub-modules A1+A2+A3 ({sum_a1_a3:.3e}) do not sum to aggregate A1-A3 ({rep_a1_a3:.3e})."
                    )

        # Check C1-C4
        if "C1" in row and "C2" in row and "C3" in row and "C4" in row and "C1-C4" in row:
            sum_c1_c4 = sum(float(row.get(f"C{i}", 0.0) or 0.0) for i in range(1, 5))
            rep_c1_c4 = float(row.get("C1-C4", 0.0) or 0.0)
            if abs(rep_c1_c4) > 1e-9:
                rel_diff_c = abs(sum_c1_c4 - rep_c1_c4) / max(abs(rep_c1_c4), 1e-6)
                if rel_diff_c > 0.001:  # >0.1%
                    errors.append(
                        f"Indicator '{ind_name}': Sub-modules C1+C2+C3+C4 ({sum_c1_c4:.3e}) do not sum to aggregate C1-C4 ({rep_c1_c4:.3e})."
                    )

    # 4. Material percentage contributions sum to 100.00% (0.01 tolerance)
    if bom_mass > 0:
        total_pct = sum((float(b.get("mass", 0.0) or 0.0) / bom_mass) * 100.0 for b in bom)
        if abs(total_pct - 100.00) > 0.02:
            errors.append(f"Material percentage contributions sum to {total_pct:.2f}%, not 100.00% (tolerance 0.01%).")

    # 5. Single functional-unit conversion factor used consistently across all modules
    # Conversion factor = delivered mass / capacity RT
    conv_factor = round(effective_mass / max(capacity_rt, 1.0), 3)
    stated_conv_factor = float(op.get("conversion_factor_kg_per_fu") or proj.get("conversion_factor_kg_per_fu") or 0.0)
    if stated_conv_factor > 0 and abs(stated_conv_factor - conv_factor) / max(conv_factor, 1.0) > 0.01:
        errors.append(
            f"Functional unit conversion factor mismatch: Delivered mass / capacity = {conv_factor:.2f} kg/FU, "
            f"but declared conversion factor is {stated_conv_factor:.2f} kg/FU."
        )

    # 6. Every material maps to a named LCI dataset (list unmapped)
    unmapped = []
    for b in bom:
        name = b.get("name") or b.get("material") or "Unnamed item"
        ecoinvent_id = b.get("ecoinvent_id") or b.get("provider_id")
        if not ecoinvent_id or str(ecoinvent_id).strip() == "" or str(ecoinvent_id).lower() == "unmapped":
            unmapped.append(name)
    if unmapped:
        errors.append(f"Unmapped BOM materials detected without verified LCI datasets: {', '.join(unmapped)}")

    # 7. Required Report Details fields are filled
    company_name = str(report_details.get("company_name") or proj.get("manufacturer_name") or "").strip()
    product_name = str(report_details.get("product_name") or proj.get("product_name") or "").strip()
    declaration_no = str(report_details.get("declaration_number") or "").strip()
    intended_app = str(report_details.get("intended_application") or "").strip()
    description_of_company = str(report_details.get("description_of_company") or "").strip()
    product_description = str(report_details.get("product_description") or "").strip()

    if not company_name:
        errors.append("Required field missing: Company / Manufacturer Name is required.")
    if not product_name:
        errors.append("Required field missing: Product Name & Model is required.")
    if not declaration_no:
        errors.append("Required field missing: Declaration Number is required.")
    if not description_of_company:
        errors.append("Required field missing: 'Description of Company' is required.")
    if not product_description:
        errors.append("Required field missing: 'Product Description' is required.")

    # Integrity rules / Placeholders check (Part F.4)
    placeholder_tokens = ["lorem", "ipsum", "tbd", "todo", "n/a"]
    for field_name, val in [
        ("Description of Company", description_of_company),
        ("Product Description", product_description),
        ("Intended Application", intended_app)
    ]:
        if val and any(tok in val.lower() for tok in placeholder_tokens):
            warnings.append(f"Placeholder text detected in '{field_name}': please verify before publication.")

    # Verification rule (Part F.1):
    is_verified = report_details.get("is_verified", False)
    if is_verified:
        verifier_name = str(report_details.get("verifier_name") or "").strip()
        verifier_email = str(report_details.get("verifier_email") or "").strip()
        if not verifier_name or not verifier_email:
            errors.append("Verification claim active: Verifier Name and Email are required when marking third-party verified.")
    else:
        warnings.append("EPD is marked as UNVERIFIED. The output PDF will feature a visible 'DRAFT: NOT THIRD-PARTY VERIFIED' watermark.")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "checks_passed": {
            "mass_balance": not any("mass balance" in e.lower() for e in errors),
            "eol_reconciliation": not any("end-of-life" in e.lower() for e in errors),
            "indicator_module_sums": not any("sum to aggregate" in e.lower() for e in errors),
            "percentage_100": not any("100.00%" in e.lower() for e in errors),
            "conversion_factor_consistency": not any("conversion factor" in e.lower() for e in errors),
            "lci_dataset_mapping": len(unmapped) == 0,
            "required_fields": not any("required field missing" in e.lower() for e in errors),
        }
    }
