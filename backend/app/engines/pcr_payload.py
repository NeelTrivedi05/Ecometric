"""
Builds the canonical payload the PCR ruleset engine evaluates (field paths are
listed in data/pcr_rulesets/README.md) from the Studio's own data:

    extracted_data    inventory (project_info, bom, transport, manufacturing, installation,
                      operational, end_of_life, maintenance_b2 ... circularity_d)
    report_details    the Report Details form (program operator, verifier, dates ...)
    results_by_method calculation output per LCIA method ({method: {epd_results, epd_metadata}})
    document          rendered EPD ({"text": ..., "sections": {...}})

Only values the user (or the calculation) actually provided are mapped. Nothing
is defaulted here, so a rule whose data is absent reports `missing` instead of
passing on an invented value.
"""

import re
from datetime import date
from typing import Any, Dict, List, Optional

from app.epd_report.adapter import infer_modules, map_results
from app.epd_report.modules import AGGREGATES
from app.epd_report.registry import get_registry
from app.epd_report.validation import add_years
from app.products import get_product

ECOINVENT_DATABASE = {"name": "ecoinvent", "version": "3.12", "system_model": "cut-off"}

UNIT_ALIASES = {
    "m²": "m2", "sqm": "m2", "m^2": "m2", "square": "m2",
    "metre": "m", "meter": "m", "metres": "m", "meters": "m", "lm": "m",
    "pc": "piece", "pcs": "piece", "pieces": "piece", "unit": "piece", "units": "piece", "item": "piece",
    "packaged": "piece", "ton": "RT", "tons": "RT", "rt": "RT",
    "kilogram": "kg", "kilograms": "kg", "tonne": "t", "tonnes": "t",
}


def _num(v: Any) -> Optional[float]:
    if isinstance(v, bool) or v is None:
        return None
    try:
        return float(str(v).replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def _set(d: Dict[str, Any], key: str, value: Any) -> None:
    """Sets d[key] only when there is a real value."""
    if value is None or (isinstance(value, str) and not value.strip()) or (isinstance(value, (list, dict)) and not value):
        return
    d[key] = value


def _iso_date(s: Any) -> Optional[str]:
    from app.epd_report.adapter import _date_iso
    out = _date_iso(s) if s else None
    return out if out and re.match(r"^\d{4}-\d{2}-\d{2}$", out) else None


def _parse_unit(text: Optional[str]) -> Dict[str, Any]:
    """'1 m² of ceramic tile' -> {value: 1, unit: 'm2'}; '1 piece of 500 RT chiller' -> {value: 1, unit: 'piece'}."""
    out: Dict[str, Any] = {}
    if not text:
        return out
    m = re.match(r"^\s*([\d.,]+)\s*([^\s,()]+)?", str(text))
    if not m:
        return out
    out["value"] = _num(m.group(1))
    tok = (m.group(2) or "").strip().rstrip(".")
    if tok and tok.lower() not in ("of", "x"):
        out["unit"] = UNIT_ALIASES.get(tok.lower(), UNIT_ALIASES.get(tok, tok))
    return {k: v for k, v in out.items() if v is not None}


def _pcr_refs(text: Optional[str]) -> List[Dict[str, Any]]:
    refs = []
    for line in str(text or "").splitlines():
        line = line.strip()
        if not line:
            continue
        ver = re.search(r"\b[vV](?:ersion)?\s?(\d+(?:\.\d+)*)", line)
        ref = {"name": line}
        _set(ref, "version", ver.group(1) if ver else None)
        refs.append(ref)
    return refs


def _valid_until(rd: Dict[str, Any], issue: Optional[str]) -> Optional[str]:
    if rd.get("valid_until"):
        return _iso_date(rd["valid_until"])
    hit = re.search(r"(\d+)\s*(year|yr)", str(rd.get("validity_period") or ""), re.I)
    if issue and hit:
        return add_years(date.fromisoformat(issue), int(hit.group(1))).isoformat()
    return None


def _bom_mass(item: Dict[str, Any]) -> float:
    return _num(item.get("mass", item.get("mass_kg"))) or 0.0


def _is_mapped(item: Dict[str, Any]) -> bool:
    return bool(item.get("provider_id") or item.get("ecoinvent_id") or item.get("ef_id"))


def build_epd(rd: Dict[str, Any], pi: Dict[str, Any], product: Dict[str, Any]) -> Dict[str, Any]:
    epd: Dict[str, Any] = {}
    po: Dict[str, Any] = {}
    _set(po, "name", rd.get("program_operator_name"))
    _set(po, "address", rd.get("program_operator_address"))
    _set(po, "website", rd.get("program_operator_website"))
    _set(epd, "program_operator", po)
    _set(epd, "general_program_instructions", rd.get("general_program_instructions"))
    holder: Dict[str, Any] = {}
    _set(holder, "name", rd.get("company_name") or pi.get("manufacturer_name"))
    _set(holder, "address", rd.get("company_address"))
    _set(holder, "logo", rd.get("company_logo"))
    _set(epd, "declaration_holder", holder)
    _set(epd, "declaration_number", rd.get("declaration_number"))
    _set(epd, "reference_pcr", _pcr_refs(rd.get("reference_pcr") or pi.get("pcr_ref")))
    _set(epd, "type", rd.get("epd_type"))
    # 'Cradle-to-gate with options' -> 'cradle-to-gate-with-options' (README vocabulary)
    _set(epd, "scope", re.sub(r"[\s_]+", "-", str(rd.get("scope") or "").strip().lower()) or None)
    issue = _iso_date(rd.get("date_of_issue"))
    _set(epd, "date_of_issue", issue)
    _set(epd, "valid_until", _valid_until(rd, issue))
    markets = rd.get("markets") or pi.get("geography") or ""
    _set(epd, "markets", [m.strip() for m in str(markets).split(",") if m.strip()])
    ver: Dict[str, Any] = {}
    vtype = str(rd.get("verification_type") or "").strip().lower()
    _set(ver, "type", vtype or None)
    _set(ver, "verifier", rd.get("verifier_name"))
    _set(ver, "pcr_review_by", [p for p in (rd.get("pcr_review_panel") or []) if p])
    _set(ver, "lca_by", rd.get("lca_practitioner_name"))
    _set(epd, "verification", ver)
    _set(epd, "limitations_text", rd.get("limitations_text"))
    return epd


def build_product(ed: Dict[str, Any], rd: Dict[str, Any], pi: Dict[str, Any], product: Dict[str, Any]) -> Dict[str, Any]:
    op = ed.get("operational") or {}
    bom = ed.get("bom") or []
    out: Dict[str, Any] = {}
    _set(out, "name", rd.get("product_name") or pi.get("product_name"))
    _set(out, "description", rd.get("product_description") or pi.get("product_description"))
    _set(out, "image", rd.get("product_image"))
    if rd.get("csi_code"):
        out["classification_codes"] = [{"system": "CSI", "code": rd["csi_code"]}]

    # Technical data: product-specific fields the Studio collects, from whichever block holds them.
    tech: Dict[str, Any] = {}
    for f in product.get("technical_fields", []):
        block = ed.get(f.get("section")) or {}
        _set(tech, f["key"], block.get(f["key"], pi.get(f["key"])))
    for t in pi.get("technical_data") or []:
        if isinstance(t, dict) and t.get("key"):
            _set(tech, t["key"], t.get("value"))
    if product["id"] == "water_cooled_chiller":
        # Selecting the "water-cooled chiller" category is the user's statement of the condenser type.
        tech["condenser_type"] = "water-cooled"
    _set(out, "technical_data", tech)

    mass = _num(pi.get("mass_delivered_kg") or op.get("mass_delivered_kg"))
    total_bom = sum(_bom_mass(b) for b in bom if (b.get("unit") or "kg") == "kg")
    _set(out, "mass_per_unit_kg", mass or (total_bom or None))
    if total_bom:
        out["material_composition"] = [
            {"material": b.get("name") or b.get("material"), "mass_kg": _bom_mass(b),
             "mass_pct": round(_bom_mass(b) / total_bom * 100, 4)}
            for b in bom if (b.get("unit") or "kg") == "kg"
        ]

    rulesets = product["pcr"]["rulesets"]
    from app.engines.pcr_ruleset_engine import load_ruleset
    subtypes = {s for rid in rulesets for s in ((load_ruleset(rid) or {}).get("product_subtypes") or [])}
    if product["id"] in subtypes:
        out["sub_category"] = product["id"]
    return out


def build_lca(ed: Dict[str, Any], results_by_method: Dict[str, Any]) -> Dict[str, Any]:
    lca: Dict[str, Any] = {"databases": [dict(ECOINVENT_DATABASE)]}
    reg = get_registry()
    methods = []
    for key, calc in (results_by_method or {}).items():
        meta = (calc or {}).get("epd_metadata") or {}
        m = reg.method(meta.get("methodology_label") or key) or reg.method(key)
        if m:
            methods.append({"name": m.name, "version": m.version})
    _set(lca, "lcia_methods", methods)

    bom = ed.get("bom") or []
    total = sum(_bom_mass(b) for b in bom)
    if bom and total > 0:
        excluded = []
        for b in bom:
            if b.get("is_included", True) is False or not _is_mapped(b):
                excluded.append({"name": b.get("name") or b.get("material") or "Material", "module": "A1-A3",
                                 "mass_kg": _bom_mass(b), "mass_pct": _bom_mass(b) / total * 100})
        lca["cutoff"] = {"excluded_flows": excluded}
    return lca


def build_scenarios(ed: Dict[str, Any], pi: Dict[str, Any], product: Dict[str, Any],
                    calc_meta: Dict[str, Any]) -> Dict[str, Any]:
    inst = ed.get("installation") or {}
    op = ed.get("operational") or {}
    eol = ed.get("end_of_life") or {}
    sc: Dict[str, Dict[str, Any]] = {k: {} for k in ("A4", "A5", "B2", "B4", "B6", "C1", "C2", "C3", "C4")}

    _set(sc["A4"], "distance_km", _num(inst.get("outbound_transport_km")))
    _set(sc["A4"], "vehicle", inst.get("transport_mode"))
    _set(sc["A5"], "electricity_kwh", _num(inst.get("installation_energy_kwh")))
    _set(sc["B2"], "refrigerant_loss_pct_per_year", _num(op.get("annual_leak_rate_percent")))
    rsl = _num(pi.get("lifespan_years"))
    _set(sc["B2"], "refrigerant_replacement_kg",
         _num(op.get("refrigerant_charge_kg")) * _num(op.get("annual_leak_rate_percent")) / 100 * rsl
         if rsl and _num(op.get("refrigerant_charge_kg")) is not None and _num(op.get("annual_leak_rate_percent")) is not None
         else None)

    # B4 replacement cycles exactly as the calculation engine derives them (engines/calculate_epd.calc_B4),
    # or the value the calculation reported.
    esl = _num((ed.get("replacement_b4") or {}).get("esl_years") or pi.get("building_esl_years"))
    cycles = _num(calc_meta.get("replacement_cycles"))
    if cycles is None and rsl and esl:
        cycles = max(0.0, esl / rsl - 1)
    _set(sc["B4"], "replacement_cycles", cycles)

    hours, eff, cap = (_num(op.get(k)) for k in ("annual_operating_hours", "efficiency_kw_per_ton", "capacity_rt"))
    _set(sc["B6"], "annual_operating_hours", hours)
    _set(sc["B6"], "efficiency_kw_per_ton", eff)
    _set(sc["B6"], "capacity_rt", cap)
    _set(sc["B6"], "city", [c for c in (op.get("target_cities") or []) if c])
    if product["use_stage"].get("b6_model") == "chiller_kw_per_ton" and None not in (hours, eff, cap, rsl):
        # Lifetime B6 electricity exactly as engines/calculate_epd.calc_B6 computes it.
        sc["B6"]["electricity_kwh"] = eff * cap * hours * rsl
    _set(sc["C1"], "deconstruction_energy_kwh", _num(eol.get("decommissioning_energy_kwh")))
    _set(sc["C2"], "distance_km", _num(eol.get("waste_transport_km")))
    _set(sc["C3"], "recycling_share_pct", _num(eol.get("recycling_rate_percent")))
    _set(sc["C3"], "incineration_share_pct", _num(eol.get("incineration_rate_percent")))
    _set(sc["C4"], "landfill_share_pct", _num(eol.get("landfill_rate_percent")))
    return {k: v for k, v in sc.items() if v}


def build_results(results_by_method: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """results.<method>.<indicator code>.<module>, results.modules_declared and the shortcuts rules use."""
    if not results_by_method:
        return None
    warnings: List[Dict[str, Any]] = []
    mapped = map_results(results_by_method, "default", "default", warnings)
    if not mapped:
        return None
    reg = get_registry()
    out: Dict[str, Any] = {}
    for rs in mapped:
        m = reg.method(rs["method"])
        table = {row["indicatorCode"]: {k: v for k, v in row["values"].items() if v is not None} for row in rs["rows"]}
        for key in {m.name, m.id, *(m.aliases or [])}:
            out[key] = table
        if m.id.startswith("traci"):
            out["TRACI_2_1"] = table
        if m.id.startswith("cml"):
            out["CML"] = table
        if "GWP" not in out and table.get(m.primary_indicator):
            gwp = dict(table[m.primary_indicator])
            subs = [gwp.get(k) for k in AGGREGATES["A1-A3"] if gwp.get(k) is not None]
            if gwp.get("A1-A3") is None and subs:
                gwp["A1-A3"] = sum(subs)
            out["GWP"] = gwp
        # Mandatory core impact indicators of the method with no result at all
        missing = [i.code for i in m.indicators if i.group == "core impact" and i.mandatory
                   and not any(v is not None for v in (table.get(i.code) or {}).values())]
        out.setdefault("core_indicators_missing", []).extend(f"{c} ({m.name})" for c in missing)
        for group, key in (("resource use", "resource_use"), ("waste", "output_flows_waste"),
                           ("output flows", "output_flows_waste")):
            rows = {i.code: table[i.code] for i in m.indicators if i.group == group and i.code in table}
            if rows:
                out.setdefault(key, {}).update(rows)

    declared = [m["code"] for m in infer_modules(mapped) if m["status"] == "declared"]
    # The report shows A1-A3 / C1-C4 aggregate columns next to their sub-modules (column_mode "both").
    for agg, subs in AGGREGATES.items():
        if any(s in declared for s in subs):
            declared.append(agg)
    out["modules_declared"] = declared
    return out


def build_payload(
    extracted_data: Optional[Dict[str, Any]],
    report_details: Optional[Dict[str, Any]] = None,
    results_by_method: Optional[Dict[str, Any]] = None,
    document: Optional[Dict[str, Any]] = None,
    product_id: Optional[str] = None,
) -> Dict[str, Any]:
    ed = extracted_data or {}
    rd = report_details or {}
    pi = ed.get("project_info") or {}
    op = ed.get("operational") or {}
    product = get_product(product_id or pi.get("product_category"))
    calc_meta = next((((c or {}).get("epd_metadata") or {}) for c in (results_by_method or {}).values()), {})

    payload: Dict[str, Any] = {
        "profile": {"id": product["id"], "modules": product["modules"], "fu_unit": product.get("fu_unit")},
        "epd": build_epd(rd, pi, product),
        "manufacturer": {},
        "product": build_product(ed, rd, pi, product),
        "lca": build_lca(ed, results_by_method or {}),
        "scenarios": build_scenarios(ed, pi, product, calc_meta),
    }
    _set(payload["manufacturer"], "name", rd.get("company_name") or pi.get("manufacturer_name"))
    if pi.get("geography"):
        payload["manufacturer"]["production_sites"] = [{"name": pi["geography"]}]

    fu: Dict[str, Any] = {}
    _set(fu, "description", pi.get("functional_unit"))
    if pi.get("functional_unit"):
        parsed = _parse_unit(pi["functional_unit"])
        _set(fu, "value", _num(pi.get("fu_quantity")) or parsed.get("value"))
        _set(fu, "unit", pi.get("fu_unit") or product.get("fu_unit") or parsed.get("unit"))
    _set(payload, "functional_unit", fu)
    du: Dict[str, Any] = {}
    _set(du, "description", pi.get("declared_unit"))
    du.update(_parse_unit(pi.get("declared_unit")))
    _set(payload, "declared_unit", du)

    _set(payload, "conversion_factor_to_kg",
         _num(pi.get("conversion_factor_kg_per_fu") or op.get("conversion_factor_kg_per_fu")))
    _set(payload, "rsl_years", _num(pi.get("lifespan_years")))
    _set(payload, "esl_years", _num((ed.get("replacement_b4") or {}).get("esl_years") or pi.get("building_esl_years")))
    _set(payload, "rsl_justification", pi.get("rsl_justification"))

    results = build_results(results_by_method or {})
    if results:
        payload["results"] = results
    if document:
        payload["document"] = document
    return payload


def results_by_method_from(results: Optional[Dict[str, Any]], methodology: Optional[str],
                           results_by_method: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Accepts either the Studio's resultsByMethod map or a single calculation response."""
    if results_by_method:
        return results_by_method
    if results and results.get("epd_results"):
        return {methodology or "default": {"epd_results": results["epd_results"],
                                           "epd_metadata": results.get("epd_metadata") or {}}}
    return {}
