"""
Seal Export Endpoints
======================

Thin backend wrappers that receive JSON payloads assembled on the frontend,
apply export_finalize(), and return the signed/sealed file.

POST /api/seal/export/ilcd     — ILCD+EPD JSON
POST /api/seal/export/openepd  — openEPD v2.0 JSON

Both endpoints require a valid JWT (existing app auth).
The assembled JSON data is not re-processed — only sealed.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, Literal, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.seal.seal_service import SealMeta, export_finalize

router = APIRouter(prefix="/api/seal/export", tags=["Seal Export"])

# ─── Helpers ─────────────────────────────────────────────────────────────────

def _build_meta(payload: dict) -> SealMeta:
    """Extract SealMeta from a frontend payload."""
    return SealMeta(
        organization_id=payload.get("organization_id") or "unknown",
        organization_name=payload.get("organization_name") or "Unknown Organization",
        created_by_user_id=payload.get("user_id") or "unknown",
        created_by_name=payload.get("user_name") or "Unknown User",
        administrator_user_id=payload.get("admin_user_id") or "unknown",
        administrator_name=payload.get("admin_name") or "Unknown Admin",
        epd_id=payload.get("epd_id") or "unknown",
        epd_version=payload.get("epd_version") or "1.0",
        product_name=payload.get("product_name") or "Unknown Product",
        calculation_run_id=payload.get("calculation_run_id") or "unknown",
        lci_database=payload.get("lci_database") or "ecoinvent",
        lci_database_version=payload.get("lci_database_version") or "3.12",
        original_file_name=payload.get("filename") or "export.json",
    )


def _make_response(result, original_filename: str) -> Response:
    headers = {
        "Content-Disposition": f'attachment; filename="{result.filename}"',
        "X-Certificate-ID":    result.certificate_id or "",
        "X-Verify-URL":        result.verify_url or "",
        "Access-Control-Expose-Headers": (
            "Content-Disposition, X-Certificate-ID, X-Verify-URL"
        ),
    }
    return Response(
        content=result.file_bytes,
        media_type=result.content_type,
        headers=headers,
    )


# ─── ILCD+EPD JSON ───────────────────────────────────────────────────────────

@router.post("/ilcd")
def export_ilcd_sealed(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
):
    """
    Receive an assembled ILCD+EPD JSON document from the frontend,
    apply sealing, and return the file.

    Expected payload fields:
        epd_data         dict   The full ILCD+EPD document to export
        export_mode      str    "sealed" | "signed_open"  (default: org preference or "signed_open")
        organization_id  str
        organization_name str
        user_id          str
        user_name        str
        admin_user_id    str
        admin_name       str
        epd_id           str
        epd_version      str
        product_name     str
        calculation_run_id str
        filename         str    e.g. "EPD_AquaEdge_ILCD.json"
    """
    epd_data = payload.get("epd_data")
    if not epd_data:
        raise HTTPException(status_code=422, detail="epd_data is required")

    mode = payload.get("export_mode", "signed_open")
    if mode not in ("sealed", "signed_open"):
        mode = "signed_open"

    file_bytes = json.dumps(epd_data, indent=2, ensure_ascii=False).encode("utf-8")
    meta = _build_meta(payload)

    result = export_finalize(
        file_bytes=file_bytes,
        file_type="json",
        meta=meta,
        mode=mode,
        db=db,
    )

    return _make_response(result, meta.original_file_name)


# ─── openEPD v2.0 JSON ───────────────────────────────────────────────────────

@router.post("/openepd")
def export_openepd_sealed(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
):
    """
    Receive an assembled openEPD v2.0 JSON document from the frontend,
    apply sealing, and return the file.

    Same payload shape as /ilcd, with epd_data containing the openEPD document.
    """
    epd_data = payload.get("epd_data")
    if not epd_data:
        raise HTTPException(status_code=422, detail="epd_data is required")

    mode = payload.get("export_mode", "signed_open")
    if mode not in ("sealed", "signed_open"):
        mode = "signed_open"

    file_bytes = json.dumps(epd_data, indent=2, ensure_ascii=False).encode("utf-8")
    meta = _build_meta(payload)

    result = export_finalize(
        file_bytes=file_bytes,
        file_type="json",
        meta=meta,
        mode=mode,
        db=db,
    )

    return _make_response(result, meta.original_file_name)

