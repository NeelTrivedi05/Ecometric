"""
EPD report API.

    GET  /api/epd-reports/options   methods, standards, product categories, filters, templates
    POST /api/epd-reports/preview   -> {html, warnings, filename, meta}         (live preview, no PDF)
    POST /api/epd-reports           -> application/pdf (Content-Disposition carries the filename)

Request body (either form):
    {"input": {...EpdReportInput...}, "options": {...}}
    {"extractedData": {...}, "resultsByMethod": {"traci_v2_1": <calc output>, ...},
     "reportDetails": {...}, "selection": {...}, "overrides": {...}, "options": {...}, "projectId": "..."}
"""

import json
import os
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Body, HTTPException, Response

from app.epd_report import EpdReportError, EpdReportInputError, generate_epd_report, preview_epd_report
from app.epd_report.adapter import from_app_payload
from app.epd_report.product_categories import list_profiles
from app.epd_report.registry import get_registry
from app.seal.seal_service import export_finalize, SealMeta, is_sealing_enabled

router = APIRouter(prefix="/api/epd-reports", tags=["EPD Reports"])

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
PDF_DIR = Path(os.getenv("RESULTS_DIR", str(REPO_ROOT / "results"))) / "pdfs"


def _resolve(payload: Dict[str, Any]) -> Tuple[Dict[str, Any], List[Dict[str, Any]], Dict[str, Any]]:
    options = dict(payload.get("options") or {})
    options.setdefault("build_date", date.today().isoformat())
    if payload.get("input"):
        return payload["input"], [], options
    results_by_method = payload.get("resultsByMethod")
    extracted_data = payload.get("extractedData")
    if not results_by_method:
        fallback_file = REPO_ROOT / "results" / "epd_results.json"
        if fallback_file.exists():
            try:
                calc_json = json.loads(fallback_file.read_text(encoding="utf-8"))
                method_key = calc_json.get("methodology", {}).get("payload_key", "ef31")
                results_by_method = {method_key: calc_json}
            except Exception:
                pass
        if not extracted_data:
            input_file = REPO_ROOT / "results" / "epd_calculation_input.json"
            if input_file.exists():
                try:
                    inp_json = json.loads(input_file.read_text(encoding="utf-8"))
                    extracted_data = inp_json.get("extractedData") or inp_json
                except Exception:
                    pass
    if not results_by_method:
        raise HTTPException(status_code=422, detail={
            "error": "No calculation results",
            "errors": [{"level": "error", "code": "request.no_results", "path": "resultsByMethod",
                        "message": "Run the LCA calculation before generating a report."}]})
    data, adapter_warnings = from_app_payload(
        extracted_data or {}, results_by_method, payload.get("reportDetails") or {},
        payload.get("selection") or {}, payload.get("overrides") or {})
    return data, adapter_warnings, options


def _publication_check(payload: Dict[str, Any], holder: Dict[str, Any]):
    """PCR `document` rules on the rendered EPD (+ `input` rules with the final Report Details)."""
    def run(html: str) -> List[Dict[str, Any]]:
        from app.engines.pcr_validation import evaluate_publication, publication_warnings
        check = evaluate_publication(payload.get("extractedData") or {}, payload.get("reportDetails") or {},
                                     payload.get("resultsByMethod") or {}, html)
        holder["pcr"] = check
        return publication_warnings(check)
    return run


def _run(payload: Dict[str, Any], fn, holder: Optional[Dict[str, Any]] = None):
    data, adapter_warnings, options = _resolve(payload)
    # Studio payloads (not a raw report `input`) are checked against the product's PCR before publishing.
    extra = _publication_check(payload, holder if holder is not None else {}) if not payload.get("input") else None
    try:
        result = fn(data, options, extra_checks=extra)
    except EpdReportInputError as e:
        raise HTTPException(status_code=422, detail={"error": "Invalid report input", "errors": e.errors})
    except EpdReportError as e:
        raise HTTPException(status_code=422, detail={
            "error": str(e), "errors": [w.model_dump(by_alias=True) for w in e.warnings] + adapter_warnings})
    result.warnings = adapter_warnings + result.warnings
    return result


@router.get("/options")
def report_options():
    reg = get_registry()
    return {
        "methods": reg.list_methods(),
        "standards": reg.list_standards(),
        "productCategories": list_profiles(),
        "indicatorFilters": [{"id": "all", "label": "All indicators"},
                             {"id": "pcrMandatory", "label": "PCR mandatory"},
                             {"id": "core", "label": "Core"}],
        "templates": [{"id": "default", "label": "Default"}],
        "papers": ["Letter", "A4"],
    }


@router.post("/preview")
def preview_report(payload: Dict[str, Any] = Body(...)):
    holder: Dict[str, Any] = {}
    r = _run(payload, preview_epd_report, holder)
    return {"html": r.html, "warnings": r.warnings, "filename": r.filename, "meta": r.meta,
            "pcr": holder.get("pcr")}


@router.post("")
def generate_report(payload: Dict[str, Any] = Body(...)):
    from app.database import SessionLocal
    r = _run(payload, generate_epd_report)
    project_id = payload.get("projectId")
    if project_id:
        _store(project_id, r)
    errors = sum(1 for w in r.warnings if w.get("level") == "error")

    # ── File Sealing (post-generation step, does not alter generators) ──────
    export_mode = payload.get("exportMode", "signed_open")
    if export_mode not in ("sealed", "signed_open"):
        export_mode = "signed_open"

    cert_id = None
    verify_url = None
    final_bytes = r.pdf
    content_type = "application/pdf"
    filename = r.filename

    if is_sealing_enabled():
        try:
            db = SessionLocal()
            try:
                meta = SealMeta(
                    organization_id=payload.get("organizationId") or "unknown",
                    organization_name=payload.get("organizationName") or "Unknown Organization",
                    created_by_user_id=payload.get("userId") or "unknown",
                    created_by_name=payload.get("userName") or "Unknown User",
                    administrator_user_id=payload.get("adminUserId") or "unknown",
                    administrator_name=payload.get("adminName") or "Unknown Admin",
                    epd_id=project_id or "unknown",
                    epd_version=payload.get("epdVersion") or "1.0",
                    product_name=(
                        payload.get("reportDetails", {}).get("product_name")
                        or payload.get("extractedData", {}).get("project_info", {}).get("product_name")
                        or "Unknown Product"
                    ),
                    calculation_run_id=project_id or "unknown",
                    original_file_name=r.filename,
                )
                seal_result = export_finalize(r.pdf, "pdf", meta, export_mode, db)
                final_bytes = seal_result.file_bytes
                content_type = seal_result.content_type
                filename = seal_result.filename
                cert_id = seal_result.certificate_id
                verify_url = seal_result.verify_url
            finally:
                db.close()
        except Exception as seal_err:
            # Sealing must never block the download
            print(f"[Seal] Warning: sealing failed, returning unsigned PDF: {seal_err}")

    expose = "Content-Disposition, X-EPD-Filename, X-EPD-Warning-Count, X-EPD-Error-Count"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "X-EPD-Filename": filename,
        "X-EPD-Warning-Count": str(len(r.warnings)),
        "X-EPD-Error-Count": str(errors),
        "Access-Control-Expose-Headers": expose,
    }
    if cert_id:
        headers["X-Certificate-ID"] = cert_id
        headers["X-Verify-URL"] = verify_url or ""
        headers["Access-Control-Expose-Headers"] = expose + ", X-Certificate-ID, X-Verify-URL"

    return Response(content=final_bytes, media_type=content_type, headers=headers)


def _store(project_id: str, r) -> None:
    """Keeps a copy of the PDF and a Report record for the project (best effort)."""
    try:
        from app.database import SessionLocal
        from app.models import Project, Report
        PDF_DIR.mkdir(parents=True, exist_ok=True)
        (PDF_DIR / r.filename).write_bytes(r.pdf)
        db = SessionLocal()
        try:
            if db.query(Project).filter(Project.id == project_id).first():
                db.add(Report(project_id=project_id, pdf_url=f"/results/pdfs/{r.filename}", version="1.0",
                              disclaimer_text_snapshot=json.dumps(r.meta.get("selection", {}))))
                db.commit()
        finally:
            db.close()
    except Exception as e:  # storage must never block the download
        print(f"[EPD Reports] Could not store report for {project_id}: {e}")
