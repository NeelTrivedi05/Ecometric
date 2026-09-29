"""
dqr_engine.py

Data Quality Rating (DQR) Engine according to European Commission PEF 3.0
and EN 15804+A2 / ISO 14044 data quality guidelines.

Calculates the semi-quantitative Data Quality Rating:
    DQR = (TeR + GeR + TiR + P) / 4

Dimensions (1 = Best / Very Good, 5 = Worst / Poor):
- TeR: Technological Representativeness (degree to which dataset reflects actual process technology)
- GeR: Geographical Representativeness (degree to which dataset reflects regional geography / grid)
- TiR: Time-related Representativeness (age of data relative to reference period <= 3-5 yrs)
- P:   Parameter Uncertainty & Completeness (precision, measured vs proxy vs cut-off omissions)

Quality Classifications:
- DQR <= 1.6: Very Good quality (Level A)
- 1.6 < DQR <= 2.0: Good quality (Level B)
- 2.0 < DQR <= 3.0: Fair quality (Level C)
- DQR > 3.0: Poor quality (Level D)
"""

from typing import Dict, Any, List, Optional
import math


class DqrEngine:
    """
    Evaluates LCA/EPD datasets and user-specified supply chain inputs
    to calculate stage-by-stage and overall DQR compliance scores.
    """

    def __init__(self):
        pass

    def evaluate_dqr(
        self,
        extracted_data: Dict[str, Any],
        results_payload: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        extracted = extracted_data or {}
        bom = extracted.get("bom", []) or []
        mfg = extracted.get("manufacturing", {}) or {}
        transport = extracted.get("transport", []) or []
        op = extracted.get("operational", {}) or {}
        inst = extracted.get("installation", {}) or {}
        eol = extracted.get("end_of_life", {}) or {}
        circ = extracted.get("circularity_d", {}) or {}

        # 1. Evaluate Stage A1: Raw Material Extraction & BOM
        a1_scores = self._evaluate_a1_dqr(bom)

        # 2. Evaluate Stage A2: Inbound Logistics
        a2_scores = self._evaluate_a2_dqr(transport)

        # 3. Evaluate Stage A3: Manufacturing Facility
        a3_scores = self._evaluate_a3_dqr(mfg)

        # 4. Evaluate Stage A4-A5: Installation & Commissioning
        a4a5_scores = self._evaluate_a4a5_dqr(inst)

        # 5. Evaluate Stage B1-B7: Use Phase & Energy
        b_scores = self._evaluate_b_dqr(op)

        # 6. Evaluate Stage C1-C4: End of Life Deconstruction
        c_scores = self._evaluate_c_dqr(eol)

        # 7. Evaluate Module D: Circularity & Benefits
        d_scores = self._evaluate_d_dqr(circ)

        stage_breakdowns = [
            {"stage": "A1", "name": "Raw Material Supply (BOM)", **a1_scores},
            {"stage": "A2", "name": "Inbound Transport", **a2_scores},
            {"stage": "A3", "name": "Manufacturing & Assembly", **a3_scores},
            {"stage": "A4-A5", "name": "Installation & Logistics", **a4a5_scores},
            {"stage": "B1-B7", "name": "Use & Operational Energy", **b_scores},
            {"stage": "C1-C4", "name": "End of Life & Recovery", **c_scores},
            {"stage": "Module D", "name": "Net Circularity & Recycling", **d_scores},
        ]

        # Weight overall DQR by importance / dominant contribution
        # Operations (B6) and Materials (A1) represent ~90% of chiller footprint
        weights = {"A1": 0.25, "A2": 0.05, "A3": 0.10, "A4-A5": 0.05, "B1-B7": 0.40, "C1-C4": 0.05, "Module D": 0.10}
        
        weighted_dqr = sum(s["dqr"] * weights.get(s["stage"], 0.14) for s in stage_breakdowns)
        weighted_dqr = round(weighted_dqr, 2)

        overall_rating = self._classify_dqr(weighted_dqr)

        # Criteria summary matrix
        criteria_summary = {
            "TeR": round(sum(s["TeR"] * weights.get(s["stage"], 0.14) for s in stage_breakdowns), 2),
            "GeR": round(sum(s["GeR"] * weights.get(s["stage"], 0.14) for s in stage_breakdowns), 2),
            "TiR": round(sum(s["TiR"] * weights.get(s["stage"], 0.14) for s in stage_breakdowns), 2),
            "P":   round(sum(s["P"]   * weights.get(s["stage"], 0.14) for s in stage_breakdowns), 2),
        }

        # Recommendations for data quality enhancement
        recommendations = []
        if criteria_summary["GeR"] > 1.8:
            recommendations.append("Specify regional electricity sub-grid or supplier-specific residual mix factors to improve Geographical Representativeness (GeR).")
        if criteria_summary["TeR"] > 1.8:
            recommendations.append("Obtain supplier-specific EPDs or primary Bill of Materials metallurgy specifications to improve Technological Representativeness (TeR).")
        if criteria_summary["P"] > 1.8:
            recommendations.append("Verify metering records for annual facility kWh and refrigerant annual leakage rates to minimize Parameter Uncertainty (P).")

        return {
            "overall_dqr": weighted_dqr,
            "quality_rating": overall_rating["level"],
            "quality_tier": overall_rating["tier"],
            "quality_description": overall_rating["description"],
            "is_pef_compliant": weighted_dqr <= 3.0,
            "criteria_summary": criteria_summary,
            "stage_breakdowns": stage_breakdowns,
            "recommendations": recommendations,
            "standard_reference": "PEF 3.0 Guide (2021) / EN 15804+A2 Annex E",
            "dqr_formula": "DQR = (TeR + GeR + TiR + P) / 4"
        }

    def _classify_dqr(self, score: float) -> Dict[str, str]:
        if score <= 1.6:
            return {
                "level": "Very Good Quality",
                "tier": "Level A",
                "description": "Meets strictest PEF 3.0 and ISO 14044 requirements for public EPD declaration with negligible proxy uncertainty."
            }
        elif score <= 2.0:
            return {
                "level": "Good Quality",
                "tier": "Level B",
                "description": "High-confidence environmental data suitable for third-party audited EPD publishing."
            }
        elif score <= 3.0:
            return {
                "level": "Fair Quality",
                "tier": "Level C",
                "description": "Acceptable under EN 15804+A2; minor proxy assumptions present in non-dominant lifecycle stages."
            }
        else:
            return {
                "level": "Poor Quality",
                "tier": "Level D",
                "description": "Data quality improvements required before formal verifier audit submission."
            }

    def _evaluate_a1_dqr(self, bom: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not bom:
            return {"TeR": 3.0, "GeR": 3.0, "TiR": 2.0, "P": 3.0, "dqr": 2.75, "rating": "Fair Quality"}

        has_specific_providers = all(bool(b.get("provider_id") or b.get("ecoinvent_id")) for b in bom)
        total_mass = sum(float(b.get("mass", b.get("mass_kg", 0)) or 0) for b in bom)
        
        ter = 1.2 if has_specific_providers else 2.0
        ger = 1.3 if any("rer" in str(b.get("provider_id", "")).lower() or "us" in str(b.get("provider_id", "")).lower() for b in bom) else 1.5
        tir = 1.0  # ecoinvent 3.12 release
        p = 1.1 if total_mass > 0 else 2.5

        dqr = round((ter + ger + tir + p) / 4.0, 2)
        return {"TeR": ter, "GeR": ger, "TiR": tir, "P": p, "dqr": dqr, "rating": self._classify_dqr(dqr)["level"]}

    def _evaluate_a2_dqr(self, transport: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not transport:
            return {"TeR": 2.0, "GeR": 2.0, "TiR": 1.0, "P": 2.0, "dqr": 1.75, "rating": "Good Quality"}
        
        has_distance = all(float(t.get("distance_km", 0) or 0) > 0 for t in transport)
        ter = 1.2
        ger = 1.2 if any("rer" in str(t.get("provider_id", "")).lower() for t in transport) else 1.5
        tir = 1.0
        p = 1.2 if has_distance else 2.5

        dqr = round((ter + ger + tir + p) / 4.0, 2)
        return {"TeR": ter, "GeR": ger, "TiR": tir, "P": p, "dqr": dqr, "rating": self._classify_dqr(dqr)["level"]}

    def _evaluate_a3_dqr(self, mfg: Dict[str, Any]) -> Dict[str, Any]:
        kwh = float(mfg.get("annual_facility_kwh", 0) or 0)
        grid = mfg.get("grid_region") or mfg.get("electricity_provider_id")

        ter = 1.1 if kwh > 0 else 2.5
        ger = 1.0 if grid and grid != "GLO" else 2.0
        tir = 1.0
        p = 1.2 if kwh > 0 else 3.0

        dqr = round((ter + ger + tir + p) / 4.0, 2)
        return {"TeR": ter, "GeR": ger, "TiR": tir, "P": p, "dqr": dqr, "rating": self._classify_dqr(dqr)["level"]}

    def _evaluate_a4a5_dqr(self, inst: Dict[str, Any]) -> Dict[str, Any]:
        refrig = inst.get("refrigerant_type")
        charge = float(inst.get("refrigerant_charge_kg", 0) or 0)

        ter = 1.1 if refrig and charge > 0 else 2.0
        ger = 1.2
        tir = 1.0
        p = 1.2 if charge > 0 else 2.5

        dqr = round((ter + ger + tir + p) / 4.0, 2)
        return {"TeR": ter, "GeR": ger, "TiR": tir, "P": p, "dqr": dqr, "rating": self._classify_dqr(dqr)["level"]}

    def _evaluate_b_dqr(self, op: Dict[str, Any]) -> Dict[str, Any]:
        hours = float(op.get("annual_operating_hours", 0) or 0)
        eff = float(op.get("efficiency_kw_per_ton", 0) or 0)
        cap = float(op.get("capacity_rt", 0) or 0)

        has_specs = hours > 0 and eff > 0 and cap > 0
        ter = 1.1 if has_specs else 2.5
        ger = 1.2
        tir = 1.0
        p = 1.1 if has_specs else 3.0

        dqr = round((ter + ger + tir + p) / 4.0, 2)
        return {"TeR": ter, "GeR": ger, "TiR": tir, "P": p, "dqr": dqr, "rating": self._classify_dqr(dqr)["level"]}

    def _evaluate_c_dqr(self, eol: Dict[str, Any]) -> Dict[str, Any]:
        rec_rate = float(eol.get("recycling_rate_percent", 0) or 0)
        ter = 1.3
        ger = 1.4
        tir = 1.0
        p = 1.3 if rec_rate > 0 else 2.2

        dqr = round((ter + ger + tir + p) / 4.0, 2)
        return {"TeR": ter, "GeR": ger, "TiR": tir, "P": p, "dqr": dqr, "rating": self._classify_dqr(dqr)["level"]}

    def _evaluate_d_dqr(self, circ: Dict[str, Any]) -> Dict[str, Any]:
        rate = float(circ.get("overall_recovery_rate_percent", 0) or 0)
        ter = 1.2
        ger = 1.3
        tir = 1.0
        p = 1.2 if rate > 0 else 2.0

        dqr = round((ter + ger + tir + p) / 4.0, 2)
        return {"TeR": ter, "GeR": ger, "TiR": tir, "P": p, "dqr": dqr, "rating": self._classify_dqr(dqr)["level"]}
