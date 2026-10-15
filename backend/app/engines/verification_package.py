"""
verification_package.py

Generates a complete, tamper-evident Third-Party Verifier Audit Archive (ZIP bundle)
containing all characterization tables, calculation inputs, openEPD declaration,
DQR scoring matrices, the EPD report (document model + standalone HTML from
app.epd_report), and SHA-256 integrity checksums.
"""

import io
import zipfile
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, Tuple
from .dqr_engine import DqrEngine
from .openepd_serializer import serialize_openepd_json


def _build_report(extracted_data: Dict[str, Any], results_payload: Dict[str, Any],
                  methodology: str) -> Tuple[Dict[str, Any], str]:
    """Builds the EPD report for the bundle; returns (document dict, print HTML). Never raises."""
    from app.epd_report import EpdReportError, EpdReportInputError, generate_epd_report
    from app.epd_report.adapter import from_app_payload
    try:
        data, adapter_warnings = from_app_payload(extracted_data, {methodology: results_payload})
        result = generate_epd_report(data, pdf=False)
        doc = result.document.to_dict()
        doc["warnings"] = adapter_warnings + result.warnings
        return doc, result.html
    except (EpdReportError, EpdReportInputError) as e:
        detail = getattr(e, "errors", None) or [str(e)]
        return {"error": "EPD report could not be generated", "details": detail}, \
            "<!DOCTYPE html><html><body><p>EPD report could not be generated: see 02_epd_report_document.json</p></body></html>"


def build_verification_bundle(
    extracted_data: Dict[str, Any],
    results_payload: Dict[str, Any],
    pcr_evaluation: Dict[str, Any],
    methodology: str = "TRACI 2.1"
) -> Tuple[bytes, str, Dict[str, Any]]:
    """
    Builds an audited ZIP archive in memory and returns:
    (zip_bytes, filename, manifest_metadata)
    """
    now_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    proj_name = extracted_data.get("project_info", {}).get("product_name", "Chiller_EPD")
    sanitized_name = "".join(c if c.isalnum() else "_" for c in proj_name).strip("_")
    zip_filename = f"EcoMetric_Verification_Bundle_{sanitized_name}_{now_str}.zip"

    # 1. DQR evaluation
    dqr_engine = DqrEngine()
    dqr_report = dqr_engine.evaluate_dqr(extracted_data, results_payload)

    # 2. OpenEPD v2.0 JSON
    openepd_data = serialize_openepd_json(extracted_data, results_payload, dqr_report, methodology)

    # 3. EPD report document model & standalone HTML (app.epd_report)
    report_doc, html_report = _build_report(extracted_data, results_payload, methodology)

    # 4. Generate CSV matrix
    epd_res = results_payload.get("epd_results", results_payload.get("results", results_payload))
    csv_rows = ["Impact Indicator,Unit,A1,A2,A3,A1-A3,A4,A5,B1,B2,B3,B4,B5,B6,B7,C1,C2,C3,C4,C1-C4,D,Total"]
    
    if isinstance(epd_res, dict):
        for ind_name, stages in epd_res.items():
            if isinstance(stages, dict):
                unit = stages.get("unit", "kg CO2 eq" if "global warming" in ind_name.lower() else "eq")
                a1 = stages.get("A1", 0.0)
                a2 = stages.get("A2", 0.0)
                a3 = stages.get("A3", 0.0)
                a1a3 = stages.get("A1-A3", 0.0)
                a4 = stages.get("A4", 0.0)
                a5 = stages.get("A5", 0.0)
                b1 = stages.get("B1", 0.0)
                b2 = stages.get("B2", 0.0)
                b3 = stages.get("B3", 0.0)
                b4 = stages.get("B4", 0.0)
                b5 = stages.get("B5", 0.0)
                b6 = stages.get("B6", 0.0)
                b7 = stages.get("B7", 0.0)
                c1 = stages.get("C1", 0.0)
                c2 = stages.get("C2", 0.0)
                c3 = stages.get("C3", 0.0)
                c4 = stages.get("C4", 0.0)
                c1c4 = stages.get("C1-C4", 0.0)
                d = stages.get("D", 0.0)
                tot = a1a3 + a4 + a5 + sum(stages.get(f"B{i}", 0.0) for i in range(1, 8)) + c1c4 + d
                row_str = f'"{ind_name}","{unit}",{a1},{a2},{a3},{a1a3},{a4},{a5},{b1},{b2},{b3},{b4},{b5},{b6},{b7},{c1},{c2},{c3},{c4},{c1c4},{d},{tot}'
                csv_rows.append(row_str)

    csv_content = "\n".join(csv_rows)

    # 5. Pack everything into ZIP archive
    zip_buffer = io.BytesIO()
    checksums = {}

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # File 1: openEPD JSON
        f1_data = json.dumps(openepd_data, indent=2, default=str).encode("utf-8")
        zf.writestr("01_openepd_declaration_v2.json", f1_data)
        checksums["01_openepd_declaration_v2.json"] = hashlib.sha256(f1_data).hexdigest()

        # File 2: EPD report document model (structure, tables, warnings)
        f2_data = json.dumps(report_doc, indent=2, default=str, ensure_ascii=False).encode("utf-8")
        zf.writestr("02_epd_report_document.json", f2_data)
        checksums["02_epd_report_document.json"] = hashlib.sha256(f2_data).hexdigest()

        # File 3: Characterization Matrix CSV
        f3_data = csv_content.encode("utf-8")
        zf.writestr("03_lcia_characterization_matrix.csv", f3_data)
        checksums["03_lcia_characterization_matrix.csv"] = hashlib.sha256(f3_data).hexdigest()

        # File 4: DQR Data Quality Assessment JSON
        f4_data = json.dumps(dqr_report, indent=2, default=str).encode("utf-8")
        zf.writestr("04_data_quality_rating_pef3.json", f4_data)
        checksums["04_data_quality_rating_pef3.json"] = hashlib.sha256(f4_data).hexdigest()

        # File 5: Pre-Audit Quality Gates JSON
        f5_data = json.dumps(pcr_evaluation or {}, indent=2, default=str).encode("utf-8")
        zf.writestr("05_pre_audit_quality_gates.json", f5_data)
        checksums["05_pre_audit_quality_gates.json"] = hashlib.sha256(f5_data).hexdigest()

        # File 6: Standalone Printable HTML Report
        f6_data = html_report.encode("utf-8")
        zf.writestr("06_official_epd_report.html", f6_data)
        checksums["06_official_epd_report.html"] = hashlib.sha256(f6_data).hexdigest()

        # File 7: Checksums manifest
        checksum_text = "# EcoMetric Cryptographic Audit Checksums (SHA-256)\n"
        checksum_text += f"# Generated: {now_str} UTC\n"
        checksum_text += f"# Lineage: {openepd_data.get('lci_database', {}).get('lineage_hash')}\n\n"
        for fname, chash in checksums.items():
            checksum_text += f"{chash}  {fname}\n"
        zf.writestr("checksums_sha256.txt", checksum_text.encode("utf-8"))

    zip_bytes = zip_buffer.getvalue()
    bundle_hash = hashlib.sha256(zip_bytes).hexdigest()

    manifest = {
        "filename": zip_filename,
        "bundle_hash": f"SHA256:{bundle_hash}",
        "file_count": 7,
        "generated_at": now_str,
        "dqr": dqr_report,
        "pcr_verdict": pcr_evaluation.get("overall_verdict", "COMPLIANT") if pcr_evaluation else "COMPLIANT",
        "openepd_id": openepd_data.get("id"),
        "lineage_hash": "6bc4e6475877e8e90d8a6184b681366154cc5f6ec42c7cec54eb871224b33e02",
        "files": list(checksums.keys())
    }

    return zip_bytes, zip_filename, manifest
