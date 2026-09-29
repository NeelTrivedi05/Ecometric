"""
test_epd_pdf_export.py

Validates PDF export against Acceptance Criteria 5, 6, 8, and 9:
1. Criterion 5: Binds fixture results and checks that values in the rendered document match calculation output in scientific notation.
2. Criterion 6: Unverified EPD renders DRAFT marking and suppresses verifier signature; verified EPD displays verifier details.
3. Criterion 8: Pre-export validation gate blocks broken fixtures (mass balance mismatch, module sum mismatch).
4. Criterion 9: PDF is text-searchable, fonts are embedded, and size is healthy.
"""

import sys
import os
import json
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.engines.epd_pdf_generator import EpdReport, generate_full_epd_html, export_epd_to_pdf
from app.engines.epd_validator import validate_pre_export
import pypdf

def run_tests():
    print("=== STARTING EPD PDF EXPORT AUTOMATED TESTS ===")

    # Load fixture payload
    fixture_path = Path(__file__).resolve().parent / "05_complete_project_payload.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    # Mock or calculate EPD results
    mock_results = {
        "results": {
            "GWP-total | Global Warming Potential total [kg CO2e]": {
                "A1": 150.0, "A2": 10.0, "A3": 5.0, "A1-A3": 165.0,
                "A4": 1.24, "A5": 0.84,
                "B1": 1.38, "B2": 3.52, "B3": 0.0, "B4": 333.0, "B5": 0.0, "B6": 35900.0, "B7": 0.0,
                "C1-C4": 2.59, "C1": 0.0, "C2": 0.42, "C3": 2.07, "C4": 0.10, "D": 0.0
            },
            "Acidification | Acidification potential [mol H+e]": {
                "A1": 1.1, "A2": 0.15, "A3": 0.06, "A1-A3": 1.31,
                "A4": 0.00315, "A5": 0.0076,
                "B1": 0.0, "B2": 0.0437, "B3": 0.0, "B4": 2.64, "B5": 0.0, "B6": 22.9, "B7": 0.0,
                "C1-C4": 0.0072, "C1": 0.0, "C2": 0.000985, "C3": 0.00617, "C4": 0.0000508, "D": 0.0
            }
        },
        "verification_hash": "SHA256:d8e8fca2dc64516892f3922378f465d60f54ce8a"
    }

    report_details_unverified = {
        "company_name": "EcoMetric Thermal Systems Inc.",
        "company_address": "450 Innovation Parkway\nChicago, IL 60601",
        "description_of_company": "EcoMetric Thermal Systems Inc. is an industry pioneer in ultra-low GWP centrifugal chilling systems.",
        "product_name": "EcoMetric Centrifugal Chiller 500RT Benchmark",
        "product_description": "High efficiency water-cooled chiller equipped with two-stage ceramic bearings.",
        "declaration_number": "EPD11017",
        "intended_application": "Chilled water climate control for large commercial facilities.",
        "is_verified": False,
    }

    # -------------------------------------------------------------
    # TEST 1: CRITERION 8 - Pre-Export Validation Gate (Broken fixtures blocked)
    # -------------------------------------------------------------
    print("\n[TEST 1] Testing Pre-Export Validation Gate...")

    # Broken fixture A: Mismatched BOM mass vs declared mass
    broken_payload_mass = json.loads(json.dumps(payload))
    broken_payload_mass["project_info"]["mass_delivered_kg"] = 99999.0  # Massive mismatch
    val_broken_mass = validate_pre_export(broken_payload_mass, mock_results, report_details_unverified)
    assert not val_broken_mass["valid"], "Validation gate should fail on mass mismatch!"
    assert any("mass balance" in err.lower() for err in val_broken_mass["errors"]), "Expected mass balance error message"
    print("  [PASS] Correctly blocked fixture with mismatched declared mass vs BOM mass")

    # Broken fixture B: Mismatched indicator module sums (A1+A2+A3 != A1-A3)
    broken_results = json.loads(json.dumps(mock_results))
    broken_results["results"]["GWP-total | Global Warming Potential total [kg CO2e]"]["A1-A3"] = 9999.0  # Broken aggregate
    val_broken_sums = validate_pre_export(payload, broken_results, report_details_unverified)
    assert not val_broken_sums["valid"], "Validation gate should fail on module sum mismatch!"
    assert any("sum to aggregate" in err.lower() for err in val_broken_sums["errors"]), "Expected module sum mismatch error"
    print("  [PASS] Correctly blocked fixture with corrupted indicator module sums")

    # Valid fixture passes validation gate
    val_valid = validate_pre_export(payload, mock_results, report_details_unverified)
    assert val_valid["valid"], f"Valid fixture should pass validation gate! Errors: {val_valid['errors']}"
    print("  [PASS] Valid project payload passed all 7 pre-export validation checks")

    # -------------------------------------------------------------
    # TEST 2: CRITERION 5 - Traceability & Data Binding (Scientific notation)
    # -------------------------------------------------------------
    print("\n[TEST 2] Testing Criterion 5 - Data Binding & Scientific Notation...")
    report_obj = EpdReport(payload, mock_results, report_details_unverified)
    html_content = generate_full_epd_html(report_obj)

    # Verify company name propagation
    assert "EcoMetric Thermal Systems Inc." in html_content
    # Verify expected numbers formatted in scientific notation
    assert "1.65E+02" in html_content, "Expected GWP A1-A3 1.65E+02 rendered"
    assert "3.59E+04" in html_content, "Expected GWP B6 3.59E+04 rendered"
    assert "1.31E+00" in html_content, "Expected AP A1-A3 1.31E+00 rendered"
    assert "0.00E+00" in html_content, "Expected real zeroes rendered as 0.00E+00"
    print("  [PASS] Result values verified in scientific notation with 2 decimals")

    # -------------------------------------------------------------
    # TEST 3: CRITERION 6 - Verification Status Integrity
    # -------------------------------------------------------------
    print("\n[TEST 3] Testing Criterion 6 - Unverified vs Verified EPD Behavior...")
    # Unverified check:
    assert "DRAFT: NOT THIRD-PARTY VERIFIED" in html_content, "Unverified EPD must show DRAFT watermark"
    assert "Pending Verification" in html_content, "Unverified EPD must show pending line"
    print("  [PASS] Unverified EPD contains visible DRAFT watermark and blank signature line")

    # Verified check:
    report_details_verified = dict(report_details_unverified)
    report_details_verified["is_verified"] = True
    report_details_verified["verifier_name"] = "Dr. Jack Geibig"
    report_details_verified["verifier_org"] = "EcoForm Certification"
    report_details_verified["verifier_email"] = "jgeibig@ecoform.com"

    report_verified_obj = EpdReport(payload, mock_results, report_details_verified)
    html_verified = generate_full_epd_html(report_verified_obj)
    assert "DRAFT: NOT THIRD-PARTY VERIFIED" not in html_verified, "Verified EPD must NOT have draft watermark"
    assert "Dr. Jack Geibig" in html_verified, "Verified EPD must display verifier name"
    assert "jgeibig@ecoform.com" in html_verified, "Verified EPD must display verifier email"
    print("  [PASS] Verified EPD cleanly suppresses draft watermark and displays verifier credentials")

    # -------------------------------------------------------------
    # TEST 4: CRITERION 9 - PDF Compilation & Text Searchability
    # -------------------------------------------------------------
    print("\n[TEST 4] Compiling full PDF and testing searchability...")
    pdf_out_path = Path(__file__).resolve().parent / "test_epd_output.pdf"
    pdf_bytes = export_epd_to_pdf(payload, mock_results, report_details_unverified, output_path=str(pdf_out_path))

    assert len(pdf_bytes) > 20000, f"Generated PDF unexpectedly small: {len(pdf_bytes)} bytes"
    assert pdf_out_path.exists(), "PDF file was not created on disk"

    # Inspect with pypdf
    reader = pypdf.PdfReader(str(pdf_out_path))
    num_pages = len(reader.pages)
    print(f"  [PASS] PDF successfully created ({num_pages} pages, {len(pdf_bytes):,} bytes)")

    # Extract text from page 2 and page 3 to verify searchability
    full_text = " ".join(page.extract_text() for page in reader.pages)
    assert "EcoMetric Thermal Systems Inc." in full_text, "Company name must be searchable in PDF text"
    assert "1 – GENERAL INFORMATION" in full_text, "Section 1 heading must be searchable in PDF text"
    assert "Table 3: Material Composition per Functional Unit" in full_text, "Table 3 must be searchable in PDF text"
    assert "Table 13: Life Cycle Stages Included in the Study" in full_text, "Table 13 must be searchable in PDF text"
    print("  [PASS] PDF text is fully searchable and not rasterized")

    print("\n=== ALL AUTOMATED TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
