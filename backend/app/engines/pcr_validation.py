"""
PCR compliance checks for the three points of the Studio workflow. All three run
the core ruleset (data/core_rulesets, common to every product) through
engines/pcr_ruleset_engine, each with only the rules of its own phase:

    validate_epd_compliance       step 4, before calculation   -> `input` rules
    evaluate_results_compliance   step 7, after calculation    -> `results` rules
    evaluate_publication          step 8, on the rendered EPD  -> `document` rules. It also re-applies
                                  the `input` rules (Report Details such as EPD type, scope and verifier
                                  are only completed at export) and the `results` rules (the sidebar lets
                                  users reach export without passing step 7), so this is the gate that
                                  decides whether the PDF is final or a draft.
"""

import html as html_lib
import json
import os
import re
from typing import Any, Dict, List, Optional

from app.engines.pcr_payload import build_payload, results_by_method_from
from app.engines.pcr_ruleset_engine import calculation_prerequisites, evaluate_phase

PCR_RULES_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "pcr_rules.json")


def load_pcr_rules() -> Dict[str, Any]:
    if os.path.exists(PCR_RULES_PATH):
        try:
            with open(PCR_RULES_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "pcr_name": "UL 10010-4 Part B v2.0 (2018)",
        "gpi_name": "International EPD System GPI v5.0.1 / ISO 21930:2017",
        "total_modules_count": 16
    }


def _extracted(payload: Dict[str, Any]) -> Dict[str, Any]:
    data = payload.get("extracted_data", payload) if isinstance(payload, dict) else {}
    return data if isinstance(data, dict) else {}


def _product_id(payload: Dict[str, Any], data: Dict[str, Any]) -> Optional[str]:
    return payload.get("product_category") or (data.get("project_info") or {}).get("product_category")


def validate_epd_compliance(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Step 4: `input` rules plus the calculation prerequisites. Critical failures block calculation;
    critical data that is still missing is reported as required before publishing."""
    payload = payload or {}
    data = _extracted(payload)
    pid = _product_id(payload, data)
    canonical = build_payload(data, payload.get("report_details"), product_id=pid)
    report = evaluate_phase(canonical, pid, "input", block_on_missing=False,
                            prerequisites=calculation_prerequisites(data))
    report["overall_pass"] = report["passed"]
    return report


def evaluate_results_compliance(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Step 7: `results` rules on the calculation output. Critical failures or missing results block export."""
    payload = payload or {}
    data = _extracted(payload)
    pid = _product_id(payload, data)
    by_method = results_by_method_from(payload.get("results"), payload.get("methodology"),
                                       payload.get("results_by_method"))
    canonical = build_payload(data, payload.get("report_details"), by_method, product_id=pid)
    return evaluate_phase(canonical, pid, "results", block_on_missing=True)


def html_to_text(html: str) -> str:
    text = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", html or "")
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", html_lib.unescape(text)).strip()


# Rendered report sections (epd_report/sections) -> the section names PCR rules use.
REPORT_SECTION_NAMES = {
    "cover": ["cover_page"],
    "general": ["programme_information", "product_information", "pcr_and_verification"],
    "methodology": ["lca_information"],
    "results": ["environmental_performance"],
    "interpretation": ["interpretation"],
    "references": ["references"],
}


def document_from_html(html: str) -> Dict[str, Any]:
    """{"text": full text, "sections": {rule section name: text}} from the rendered report HTML."""
    sections: Dict[str, str] = {}
    starts = list(re.finditer(r'<section[^>]*\bid="sec-([\w-]+)"', html or ""))
    for i, m in enumerate(starts):
        end = starts[i + 1].start() if i + 1 < len(starts) else len(html)
        text = html_to_text(html[m.start():end])
        for name in REPORT_SECTION_NAMES.get(m.group(1), []):
            sections[name] = (sections.get(name, "") + " " + text).strip()
    return {"text": html_to_text(html), "sections": sections}


def evaluate_publication(extracted_data: Dict[str, Any], report_details: Dict[str, Any],
                         results_by_method: Dict[str, Any], html: str) -> Dict[str, Any]:
    """Step 8: `document` rules on the rendered EPD, plus the input and results gates enforced on the
    final data. Every critical failure or missing item blocks publication."""
    data = extracted_data or {}
    pid = (data.get("project_info") or {}).get("product_category")
    canonical = build_payload(data, report_details, results_by_method,
                              document=document_from_html(html), product_id=pid)
    document = evaluate_phase(canonical, pid, "document", block_on_missing=True)
    inputs = evaluate_phase(canonical, pid, "input", block_on_missing=True)
    results = evaluate_phase(canonical, pid, "results", block_on_missing=True)
    blocking = sum(r["summary"]["blocking"] for r in (document, inputs, results))
    return {"document": document, "input": inputs, "results": results, "blocking": blocking, "passed": blocking == 0}


def publication_warnings(check: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Publication check -> report warnings: blocking items are errors (the PDF becomes a draft),
    other failed or missing rules are warnings."""
    out = []
    for phase in ("input", "results", "document"):
        for c in check[phase]["checks"]:
            if c["status"] not in ("fail", "missing"):
                continue
            src = c.get("source") or {}
            where = f" ({c['ruleset_id']} §{src['section']})" if src.get("section") else f" ({c['ruleset_id']})"
            out.append({
                "level": "error" if c["blocking"] else "warning",
                "code": f"pcr.{c['id']}",
                "path": f"pcr/{phase}",
                "message": f"{c['title']}: {c['message']}{where}",
            })
    return out


def validate_chiller_inputs(data: Dict[str, Any]) -> Dict[str, Any]:
    """Backward-compatible wrapper used by the legacy /api/epd/calculate endpoint."""
    res = validate_epd_compliance(data)
    errors = [c["message"] for c in res["checks"] if c["blocking"]]
    warnings = [c["message"] for c in res["checks"] if c["status"] in ("fail", "missing") and not c["blocking"]]
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "pcr_ref": res["pcr_label"],
        "total_modules_count": 16,
        "details": res
    }
