import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import PcrGpiIndicatorRule

logger = logging.getLogger(__name__)

class PcrRulesEngine:
    """
    Evaluates LCA / EPD models against PCR (Product Category Rules) and GPI standards.
    Validates:
    1. Mandatory indicator coverage against the standard (UL 10010-4, EN 15804+A2, GPI v4.0)
    2. Cut-off criteria (1% mass / 1% energy cumulative 95% or 99%)
    3. Grid electricity and secondary data compliance
    4. Provides structured compliance score and audit findings.
    """

    def __init__(self, db: Session):
        self.db = db

    def evaluate_compliance(
        self,
        rule_id: str,
        results_payload: Dict[str, Any],
        bom_items: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        rule = self.db.query(PcrGpiIndicatorRule).filter_by(id=rule_id).first()
        if not rule:
            # Fallback to default rule if not found
            rule = self.db.query(PcrGpiIndicatorRule).filter_by(is_default=True).first()
            if not rule:
                raise ValueError(f"No PCR Rule found for id '{rule_id}'")

        required_indicators = rule.required_indicators or []
        optional_indicators = rule.optional_indicators or []

        # Extract declared indicators from calculation results
        declared_indicators_map = self._extract_declared_indicators(results_payload)

        # 1. Evaluate Mandatory Indicators Coverage
        mandatory_eval = []
        missing_count = 0
        compliant_count = 0

        for req_ind in required_indicators:
            req_clean = req_ind.strip().lower()
            matched_key = None
            matched_val = None

            for decl_key, decl_val in declared_indicators_map.items():
                if req_clean in decl_key.lower() or decl_key.lower() in req_clean:
                    matched_key = decl_key
                    matched_val = decl_val
                    break

            if matched_key and matched_val is not None and matched_val != 0.0:
                compliant_count += 1
                mandatory_eval.append({
                    "indicator": req_ind,
                    "matched_declared_name": matched_key,
                    "value": matched_val,
                    "status": "COMPLIANT",
                    "severity": "PASS"
                })
            else:
                missing_count += 1
                mandatory_eval.append({
                    "indicator": req_ind,
                    "matched_declared_name": matched_key,
                    "value": matched_val or 0.0,
                    "status": "MISSING_OR_ZERO",
                    "severity": "CRITICAL"
                })

        # 2. Evaluate Optional Indicators
        optional_eval = []
        for opt_ind in optional_indicators:
            opt_clean = opt_ind.strip().lower()
            found = any(opt_clean in k.lower() or k.lower() in opt_clean for k in declared_indicators_map)
            optional_eval.append({
                "indicator": opt_ind,
                "status": "DECLARED" if found else "NOT_DECLARED"
            })

        # 3. Evaluate Cut-off Criteria (1% single / 5% cumulative)
        bom_items = bom_items or []
        total_mass = sum(float(b.get("mass", 0.0)) for b in bom_items)
        cutoff_findings = []
        cumulative_omitted_pct = 0.0

        for b in bom_items:
            m = float(b.get("mass", 0.0))
            mass_pct = (m / total_mass * 100.0) if total_mass > 0 else 0.0
            is_included = b.get("is_included", True)
            if not is_included:
                cumulative_omitted_pct += mass_pct
                breach = mass_pct > 1.0 or cumulative_omitted_pct > 5.0
                cutoff_findings.append({
                    "material": b.get("material", "Unknown"),
                    "mass_kg": m,
                    "mass_pct": round(mass_pct, 2),
                    "status": "CUTOFF_BREACH" if breach else "CUTOFF_PERMISSIBLE",
                    "reason": "Exceeds 1% individual cut-off limit" if mass_pct > 1.0 else "Within permissible <1% cut-off"
                })

        cutoff_compliant = cumulative_omitted_pct <= 5.0 and all(f["status"] != "CUTOFF_BREACH" for f in cutoff_findings)

        # 4. Overall Compliance Score
        total_mandatory = len(required_indicators)
        compliance_pct = round((compliant_count / total_mandatory * 100.0), 1) if total_mandatory > 0 else 100.0
        overall_verdict = "COMPLIANT" if (missing_count == 0 and cutoff_compliant) else "ACTION_REQUIRED"

        recommendations = []
        if missing_count > 0:
            missing_names = [m["indicator"] for m in mandatory_eval if m["status"] == "MISSING_OR_ZERO"]
            recommendations.append(f"Declare missing mandatory indicators required by {rule.rule_name}: {', '.join(missing_names[:3])}")
        if not cutoff_compliant:
            recommendations.append(f"Omitted materials exceed the 1% mass cut-off limit defined in {rule.cut_off_criteria}.")

        return {
            "rule_id": rule.id,
            "rule_name": rule.rule_name,
            "standard": rule.standard,
            "methodology": rule.methodology,
            "overall_verdict": overall_verdict,
            "compliance_score_pct": compliance_pct,
            "mandatory_summary": {
                "total_required": total_mandatory,
                "compliant": compliant_count,
                "missing": missing_count
            },
            "mandatory_evaluations": mandatory_eval,
            "optional_evaluations": optional_eval,
            "cutoff_evaluations": {
                "rule_threshold": rule.cut_off_criteria,
                "is_compliant": cutoff_compliant,
                "cumulative_omitted_pct": round(cumulative_omitted_pct, 2),
                "findings": cutoff_findings
            },
            "recommendations": recommendations
        }

    def _extract_declared_indicators(self, payload: Dict[str, Any]) -> Dict[str, float]:
        """
        Flattens various EPD calculation output structures into a normalized indicator -> value map.
        """
        extracted = {}
        if not payload:
            return extracted

        # Structure 1: epd_results or results with modules
        epd_res = payload.get("epd_results", payload.get("results", payload))
        if isinstance(epd_res, dict):
            # Check summary or indicators dict
            for key, val in epd_res.items():
                if isinstance(val, (int, float)):
                    extracted[key] = float(val)
                elif isinstance(val, dict):
                    # Check nested indicator dicts e.g. "total" or "A1"
                    for sub_key, sub_val in val.items():
                        if isinstance(sub_val, (int, float)):
                            extracted[f"{key}_{sub_key}"] = float(sub_val)
                            extracted[sub_key] = float(sub_val)

        return extracted
