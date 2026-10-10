"""
Adapter: the ONLY layer that knows the app's internal models.

Maps the Studio payload — ``extracted_data`` (project_info, bom, manufacturing,
transport, installation, operational, end_of_life, circularity_d), one
calculation output per LCIA method (``calculate_epd`` / ``/api/epd/calculate-anti``
shape) and the Report Details form — into an ``EpdReportInput`` dict.

Values are passed through exactly as calculated: no per-functional-unit
normalisation is applied here.
"""

import copy
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from .modules import CANONICAL_ORDER, SUBMODULES, is_number, normalize_module_code
from .registry import get_registry

Warning_ = Dict[str, str]

# Known scalar fields in the Studio 'operational' block → technical data rows (label, unit).
OPERATIONAL_TECH_FIELDS = {
    "capacity_rt": ("Chilling capacity", "tons of refrigeration"),
    "efficiency_kw_per_ton": ("Full-load efficiency", "kW/ton"),
    "iplv_kw_per_ton": ("Integrated part-load value (IPLV)", "kW/ton"),
    "refrigerant_type": ("Refrigerant", None),
    "refrigerant_charge_kg": ("Refrigerant charge", "kg"),
}


def _date_iso(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d.%m.%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(str(s).strip(), fmt).date().isoformat()
        except ValueError:
            continue
    return str(s)


def _num(v) -> Optional[float]:
    try:
        f = float(v)
        return f if is_number(f) else None
    except (TypeError, ValueError):
        return None


def _person(text: Optional[str], org: Optional[str] = None, email: Optional[str] = None,
            signature: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if not (text or org):
        return None
    name = text
    if text and not org and "," in text:
        name, org = [x.strip() for x in text.split(",", 1)]
    elif text and not org and " - " in text:
        name, org = [x.strip() for x in text.split(" - ", 1)]
    return {k: v for k, v in {"name": name, "organization": org, "email": email, "signatureImage": signature}.items() if v}


def _results_payload(calc: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    rows = calc.get("epd_results") or calc.get("results") or {}
    meta = calc.get("epd_metadata") or calc.get("metadata") or {}
    return rows, meta


def _method_label(key: str, meta: Dict[str, Any], calc: Dict[str, Any]) -> str:
    m = calc.get("methodology")
    return (meta.get("methodology_label") or (m.get("label") if isinstance(m, dict) else m) or key)


def map_results(results_by_method: Dict[str, Dict[str, Any]], variant_id: str, variant_label: str,
                warnings: List[Warning_]) -> List[Dict[str, Any]]:
    reg = get_registry()
    out = []
    for key, calc in (results_by_method or {}).items():
        rows, meta = _results_payload(calc or {})
        if not rows:
            continue
        label = _method_label(key, meta, calc)
        method = reg.method(label) or reg.method(key)
        if not method:
            warnings.append({"level": "warning", "code": "adapter.method_unmapped",
                             "message": f"Calculation results for '{label}' do not match any registry method; "
                                        f"they are not included in the report."})
            continue
        mapped, unmapped = [], []
        for raw, values in rows.items():
            if not isinstance(values, dict):
                continue
            ind = method.match_raw_key(raw)
            if not ind:
                unmapped.append(raw)
                continue
            vals = {normalize_module_code(k): _num(v) for k, v in values.items()
                    if normalize_module_code(k) in CANONICAL_ORDER}
            mapped.append({"indicatorCode": ind.code, "values": vals})
        for raw in unmapped:
            warnings.append({"level": "warning", "code": "adapter.indicator_unmapped",
                             "message": f"{method.name}: calculated indicator '{raw}' has no registry entry and "
                                        f"is not shown."})
        out.append({"variantId": variant_id, "variantLabel": variant_label, "method": method.name, "rows": mapped})
    return out


def infer_modules(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Declared = at least one non-zero value in any indicator; otherwise MND."""
    nonzero = set()
    for rs in results:
        for row in rs["rows"]:
            for k, v in row["values"].items():
                if is_number(v) and v != 0:
                    nonzero.add(k)
    mods = []
    for code in SUBMODULES:
        agg_hit = (code in ("A1", "A2", "A3") and "A1-A3" in nonzero) or \
                  (code in ("C1", "C2", "C3", "C4") and "C1-C4" in nonzero)
        mods.append({"code": code, "status": "declared" if (code in nonzero or agg_hit) else "MND"})
    return mods


def _scenarios(ed: Dict[str, Any]) -> Dict[str, Any]:
    inst = ed.get("installation") or {}
    op = ed.get("operational") or {}
    eol = ed.get("end_of_life") or {}
    circ = ed.get("circularity_d") or {}
    sc: Dict[str, Any] = {}

    legs = []
    for t in ed.get("transport") or []:
        if str(t.get("module", "")).upper() == "A4":
            legs.append({"mode": t.get("mode"), "distanceKm": _num(t.get("distance") or t.get("dist"))})
    if _num(inst.get("outbound_transport_km")):
        legs.append({"mode": inst.get("transport_mode") or "Road", "distanceKm": _num(inst.get("outbound_transport_km"))})
    if legs:
        sc["A4"] = {"legs": legs}

    a5: Dict[str, Any] = {}
    energy = []
    if _num(inst.get("installation_energy_kwh")):
        energy.append({"type": "Electricity", "amount": _num(inst["installation_energy_kwh"]), "unit": "kWh"})
    if _num(inst.get("rigging_crane_diesel_liters")):
        energy.append({"type": "Diesel (equipment)", "amount": _num(inst["rigging_crane_diesel_liters"]), "unit": "l"})
    if energy:
        a5["energyCarriers"] = energy
    if _num(inst.get("commissioning_refrigerant_loss_kg")):
        a5["directEmissions"] = [{"name": "Refrigerant loss", "amount": _num(inst["commissioning_refrigerant_loss_kg"]),
                                  "unit": "kg"}]
    if a5:
        sc["A5"] = a5

    charge, leak = _num(op.get("refrigerant_charge_kg")), _num(op.get("annual_leak_rate_percent"))
    if charge and leak:
        sc["B2"] = {"description": f"An annual refrigerant leakage and replacement rate of {leak:g}% is assumed.",
                    "items": [{"name": f"Refrigerant replacement{', ' + op['refrigerant_type'] if op.get('refrigerant_type') else ''}",
                               "amount": round(charge * leak / 100.0, 6), "unit": "kg/year"}]}
    b6: Dict[str, Any] = {}
    if _num(op.get("efficiency_kw_per_ton")):
        b6["extraParameters"] = [{"name": "Full-load efficiency", "value": _num(op["efficiency_kw_per_ton"]),
                                  "unit": "kW/ton"}]
    cities = op.get("target_cities") or []
    if cities:
        b6["gridMix"] = [{"region": c} for c in cities]
    if b6:
        sc["B6"] = b6
    if _num(op.get("cooling_tower_water_m3_yr")):
        sc["B7"] = {"annualWater": _num(op["cooling_tower_water_m3_yr"]), "unit": "m³/year"}

    eol_s: Dict[str, Any] = {}
    for src, dst in (("recycling_rate_percent", "recycling"), ("landfill_rate_percent", "landfill"),
                     ("incineration_rate_percent", "incineration")):
        if _num(eol.get(src)) is not None and _num(eol.get(src)) > 0:
            eol_s[dst] = {"amount": _num(eol[src]), "unit": "%"}
    if _num(eol.get("waste_transport_km")):
        eol_s["distances"] = {"to waste processing": {"amount": _num(eol["waste_transport_km"]), "unit": "km"}}
    if _num(eol.get("decommissioning_energy_kwh")):
        eol_s["extraParameters"] = [{"name": "De-construction energy", "value": _num(eol["decommissioning_energy_kwh"]),
                                     "unit": "kWh"}]
    if eol_s:
        sc["C1_C4"] = eol_s
    rates = [f"{k.replace('_', ' ').replace(' rate', '')}: {v:g}%" for k, v in circ.items()
             if k.endswith("_rate") and _num(v)]
    if rates:
        sc["D"] = {"description": "Module D accounts for net benefits of material recovery (" + "; ".join(rates) + ")."}
    return sc


def deep_merge(base: Dict[str, Any], over: Dict[str, Any]) -> Dict[str, Any]:
    out = copy.deepcopy(base)
    for k, v in (over or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = copy.deepcopy(v)
    return out


def from_app_payload(
    extracted_data: Dict[str, Any],
    results_by_method: Dict[str, Dict[str, Any]],
    report_details: Optional[Dict[str, Any]] = None,
    selection: Optional[Dict[str, Any]] = None,
    overrides: Optional[Dict[str, Any]] = None,
) -> Tuple[Dict[str, Any], List[Warning_]]:
    """Returns (EpdReportInput dict, adapter warnings)."""
    ed = extracted_data or {}
    rd = report_details or {}
    pi = ed.get("project_info") or {}
    op = ed.get("operational") or {}
    warnings: List[Warning_] = []

    product_name = rd.get("product_name") or pi.get("product_name") or "Product"
    results = map_results(results_by_method, "default", product_name, warnings)

    description = rd.get("product_description") or pi.get("product_description")
    bullets = [b for b in (rd.get("technical_data_bullets") or []) if b]
    tech = [{"name": label, "value": op[k], "unit": unit} for k, (label, unit) in OPERATIONAL_TECH_FIELDS.items()
            if op.get(k) not in (None, "", 0)]
    tech += [t for t in (pi.get("technical_data") or []) if isinstance(t, dict) and t.get("name")]

    bom = ed.get("bom") or []
    masses = [(_num(b.get("mass")), (b.get("unit") or "kg")) for b in bom]
    total_kg = sum(m for m, u in masses if m and u == "kg")
    items = []
    for b, (m, u) in zip(bom, masses):
        items.append({"material": b.get("name") or b.get("material") or "Material", "mass": m, "unit": u,
                      "percentage": round(m / total_kg * 100, 2) if m and u == "kg" and total_kg else None})

    mf = ed.get("manufacturing") or {}
    energy = []
    if _num(mf.get("annual_facility_kwh")):
        energy.append({"carrier": "Electricity", "amount": _num(mf["annual_facility_kwh"]), "unit": "kWh/year"})
    if _num(mf.get("natural_gas_mj")):
        energy.append({"carrier": "Natural gas", "amount": _num(mf["natural_gas_mj"]), "unit": "MJ/year"})
    if _num(mf.get("water_m3")):
        energy.append({"carrier": "Water", "amount": _num(mf["water_m3"]), "unit": "m³/year"})

    rsl = _num(pi.get("lifespan_years") or op.get("product_lifespan_years"))
    esl = _num((ed.get("B4_Replacement") or {}).get("esl_years") or pi.get("building_service_life_years"))
    fu_text = pi.get("functional_unit") or pi.get("declared_unit")
    pcr_lines = [l.strip() for l in str(rd.get("reference_pcr") or pi.get("pcr_ref") or "").splitlines() if l.strip()]
    vtype = str(rd.get("verification_type") or "").lower() or None

    methods_present = [rs["method"] for rs in results]
    sel = {"methods": list(dict.fromkeys(methods_present)) or ["TRACI 2.1"], "productCategoryId": "generic"}
    sel.update({k: v for k, v in (selection or {}).items() if v not in (None, [], "")})

    data: Dict[str, Any] = {
        "selection": sel,
        "dataCategoryId": pi.get("product_category_id"),
        "meta": {
            "declarationNumber": rd.get("declaration_number"),
            "issueDate": _date_iso(rd.get("date_of_issue")),
            "validityPeriodText": rd.get("validity_period"),
            "marketsOfApplicability": [m.strip() for m in str(rd.get("markets") or "").split(",") if m.strip()],
            "scope": rd.get("scope"),
            "epdType": rd.get("epd_type"),
            "branding": {"logo": rd.get("company_logo") or None},
        },
        "programOperator": {"name": rd.get("program_operator_name"), "address": rd.get("program_operator_address"),
                            "website": rd.get("program_operator_website"),
                            "logo": rd.get("program_operator_logo") or None,
                            "generalProgramInstructions": rd.get("general_program_instructions")},
        "manufacturer": {"name": rd.get("company_name") or pi.get("manufacturer_name"),
                         "address": rd.get("company_address"), "website": rd.get("company_website"),
                         "logo": rd.get("company_logo") or None, "description": rd.get("description_of_company")},
        "pcr": {"parts": [{"name": l} for l in pcr_lines],
                "reviewPanel": [p for p in (_person(x) for x in rd.get("pcr_review_panel") or []) if p]},
        "verification": {
            "type": vtype if vtype in ("internal", "external") else None,
            "verified": bool(rd.get("is_verified")),
            "epdVerifier": _person(rd.get("verifier_name"), rd.get("verifier_org"), rd.get("verifier_email"),
                                   rd.get("verifier_signature") or None),
            "lcaPractitioner": _person(rd.get("lca_practitioner_name"), rd.get("lca_practitioner_org")),
        },
        "lcaSetup": {
            "software": {"name": "EcoMetric", "version": "1.0"},
            "lciDatabases": [{"name": "ecoinvent", "version": "3.12 cut-off"}],
            "limitationsText": rd.get("limitations_text") or None,
            "assumptionsText": rd.get("assumptions_limitations_text") or None,
        },
        "product": {
            "name": product_name,
            "description": "\n\n".join(x for x in [description, *bullets] if x) or None,
            "intendedApplication": rd.get("intended_application"),
            "classificationCodes": [{"system": "CSI", "code": rd["csi_code"]}] if rd.get("csi_code") else [],
            "images": [{"caption": product_name, "data": rd["product_image"]}] if rd.get("product_image") else [],
            "technicalData": tech,
            "referenceServiceLife": {"value": rsl, "unit": "years"} if rsl else None,
            "buildingEstimatedServiceLife": {"value": esl, "unit": "years"} if esl else None,
            "hazardousSubstancesStatement": rd.get("hazardous_substances_statement"),
        },
        "functionalUnit": {"type": "functional" if pi.get("functional_unit") else "declared",
                           "description": fu_text} if fu_text else None,
        "materialComposition": {"basis": "per product (as entered)", "items": items} if items else None,
        "manufacturing": {"energyInputs": energy,
                          "sites": [{"name": pi["geography"], "location": pi["geography"]}] if pi.get("geography") else []}
        if (energy or pi.get("geography")) else None,
        "scenarios": _scenarios(ed),
        "modules": infer_modules(results),
        "results": results,
        "references": [{"citation": r} if isinstance(r, str) else r for r in (rd.get("extra_references") or []) if r],
    }
    data = _drop_none(data)
    if overrides:
        data = deep_merge(data, overrides)
    return data, warnings


def _drop_none(o):
    if isinstance(o, dict):
        return {k: _drop_none(v) for k, v in o.items() if v is not None}
    if isinstance(o, list):
        return [_drop_none(x) for x in o]
    return o
