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

router = APIRouter(prefix="/api/epd-reports", tags=["EPD Reports"])

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
PDF_DIR = Path(os.getenv("RESULTS_DIR", str(REPO_ROOT / "results"))) / "pdfs"


def _resolve(payload: Dict[str, Any]) -> Tuple[Dict[str, Any], List[Dict[str, Any]], Dict[str, Any]]:
    options = dict(payload.get("options") or {})
    options.setdefault("build_date", date.today().isoformat())
    if payload.get("input"):
        return payload["input"], [], options
    if not payload.get("resultsByMethod"):
        raise HTTPException(status_code=422, detail={
            "error": "No calculation results",
            "errors": [{"level": "error", "code": "request.no_results", "path": "resultsByMethod",
                        "message": "Run the LCA calculation before generating a report."}]})
    data, adapter_warnings = from_app_payload(
        payload.get("extractedData") or {}, payload["resultsByMethod"], payload.get("reportDetails") or {},
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
    r = _run(payload, generate_epd_report)
    project_id = payload.get("projectId")
    if project_id:
        _store(project_id, r)
    errors = sum(1 for w in r.warnings if w.get("level") == "error")
    return Response(content=r.pdf, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="{r.filename}"',
        "X-EPD-Filename": r.filename,
        "X-EPD-Warning-Count": str(len(r.warnings)),
        "X-EPD-Error-Count": str(errors),
        "Access-Control-Expose-Headers": "Content-Disposition, X-EPD-Filename, X-EPD-Warning-Count, X-EPD-Error-Count",
    })


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
