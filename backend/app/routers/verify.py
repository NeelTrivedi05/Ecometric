"""
Public Verification Endpoints
==============================

GET  /verify/{certificate_id}   — look up provenance by certificate ID
POST /verify                    — verify a file by uploading it (hash check)
GET  /.well-known/ecometric-seal-keys.json — published public signing keys

Rate limits (applied per hashed IP to protect against abuse):
    POST /verify           30 requests per 10 minutes
    GET  /verify/{id}      60 requests per minute

Privacy rules (strictly enforced):
    - Never return email addresses, internal UUIDs, raw IPs, or file content.
    - Only return: org name, product name, EPD standard, date, software version,
      certificate ID, export mode, and status.
"""

from __future__ import annotations

import hashlib
import io
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.seal.models import FileSeal, SealKey, SealVerificationLog
from app.seal.seal_service import verify_manifest_signature
from app.seal.key_provider import get_key_provider

router = APIRouter(tags=["Verification"])

# ─── Rate limiting setup ─────────────────────────────────────────────────────

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    limiter = Limiter(key_func=get_remote_address)
    _RATE_LIMITING = True
except ImportError:
    limiter = None
    _RATE_LIMITING = False

# ─── Helpers ─────────────────────────────────────────────────────────────────

_IP_HASH_SALT = os.environ.get("VERIFY_IP_HASH_SALT", "ecometric_verify_salt_change_in_prod")
_MAX_UPLOAD_BYTES = 64 * 1024 * 1024  # 64 MB


def _hash_ip(ip: str) -> str:
    """Salted SHA-256 of the remote IP — never store raw IPs."""
    raw = f"{_IP_HASH_SALT}:{ip}".encode()
    return hashlib.sha256(raw).hexdigest()


def _ua_family(user_agent: str) -> str:
    """Extract a coarse browser/tool family from a User-Agent string."""
    ua = (user_agent or "").lower()
    for token in ("curl", "python", "go-http", "postman", "axios", "fetch", "chrome", "firefox", "safari", "edge"):
        if token in ua:
            return token
    return "other"


def _safe_provenance(manifest: dict, show_names: bool) -> dict:
    """
    Return only public-safe provenance fields.
    Never returns: email, internal UUID, file content, raw IPs, calculation values.
    """
    result = {
        "certificate_id":     manifest.get("certificate_id"),
        "organization_name":  manifest.get("organization_name"),
        "product_name":       manifest.get("product_name"),
        "epd_id":             manifest.get("epd_id"),
        "epd_version":        manifest.get("epd_version"),
        "lci_database":       manifest.get("lci_database"),
        "lci_database_version": manifest.get("lci_database_version"),
        "export_mode":        manifest.get("export_mode"),
        "software_version":   manifest.get("software_version"),
        "file_type":          manifest.get("file_type"),
        "created_at":         manifest.get("created_at"),
        "signature_algorithm": manifest.get("signature_algorithm"),
    }
    if show_names:
        result["created_by_name"]    = manifest.get("created_by_name")
        result["administrator_name"] = manifest.get("administrator_name")
    return result


def _log_verification(
    db: Session,
    result: str,
    certificate_id: Optional[str],
    request: Request,
) -> None:
    """Append an entry to seal_verification_log (best-effort, never blocks response)."""
    try:
        ip = request.client.host if request.client else "unknown"
        ua = request.headers.get("user-agent", "")
        db.add(SealVerificationLog(
            id=str(uuid.uuid4()).replace("-", ""),
            result=result,
            certificate_id=certificate_id,
            ip_hash=_hash_ip(ip),
            user_agent_fam=_ua_family(ua),
        ))
        db.commit()
    except Exception:
        pass  # never let logging block a response


def _get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Public signing keys ──────────────────────────────────────────────────────

@router.get("/.well-known/ecometric-seal-keys.json")
def well_known_seal_keys():
    """
    Publish all active and retired Ed25519 signing public keys.
    Allows independent signature verification without contacting EcoMetric.
    """
    db = SessionLocal()
    try:
        keys = db.query(SealKey).filter(SealKey.purpose == "signing").all()
        return JSONResponse({
            "keys": [
                {
                    "key_id":        k.key_id,
                    "algorithm":     "Ed25519",
                    "public_key_b64": k.public_key_b64,
                    "status":        k.status,
                    "created_at":    k.created_at.isoformat() if k.created_at else None,
                    "retired_at":    k.retired_at.isoformat() if k.retired_at else None,
                }
                for k in keys
            ],
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
        })
    finally:
        db.close()


# ─── Verify by certificate ID ─────────────────────────────────────────────────

@router.get("/api/verify/{certificate_id}")
def verify_by_certificate_id(certificate_id: str, request: Request):
    """
    Look up a certificate ID and return its provenance status.
    Rate-limited; never returns file content or PII.
    """
    db = SessionLocal()
    try:
        seal = db.query(FileSeal).filter(FileSeal.certificate_id == certificate_id).first()
        if not seal:
            _log_verification(db, "not_found", certificate_id, request)
            return JSONResponse({"result": "not_found", "certificate_id": certificate_id}, status_code=404)

        manifest = seal.manifest or {}
        # Verify the stored signature is still intact
        kp = get_key_provider()
        sig_valid = verify_manifest_signature(manifest, kp)

        if seal.status == "revoked":
            _log_verification(db, "revoked", certificate_id, request)
            return JSONResponse({
                "result":         "revoked",
                "certificate_id": certificate_id,
                "revoked_at":     seal.revoked_at.isoformat() if seal.revoked_at else None,
                "revoke_reason":  seal.revoke_reason,
                "provenance":     _safe_provenance(manifest, show_names=False),
            })

        if seal.status == "superseded":
            _log_verification(db, "superseded", certificate_id, request)
            return JSONResponse({
                "result":            "superseded",
                "certificate_id":    certificate_id,
                "superseded_by":     seal.superseded_by,
                "provenance":        _safe_provenance(manifest, show_names=False),
            })

        if not sig_valid:
            _log_verification(db, "modified", certificate_id, request)
            return JSONResponse({
                "result":         "modified",
                "certificate_id": certificate_id,
                "detail":         "Registry record signature verification failed.",
            }, status_code=200)

        _log_verification(db, "authentic", certificate_id, request)
        return JSONResponse({
            "result":         "authentic",
            "certificate_id": certificate_id,
            "provenance":     _safe_provenance(manifest, show_names=False),
        })
    finally:
        db.close()


# ─── Verify by file upload (hash check) ──────────────────────────────────────

@router.post("/api/verify")
async def verify_by_file(request: Request, file: UploadFile = File(...)):
    """
    Verify an uploaded file by computing its SHA-256 and matching it against the registry.
    Also accepts .ecmx sealed containers (checks container_sha256).

    Max upload size: 64 MB.
    Rate-limited: 30 requests per 10 minutes per IP.
    Never returns file content.
    """
    db = SessionLocal()
    try:
        # Read with size limit
        content = await file.read(_MAX_UPLOAD_BYTES + 1)
        if len(content) > _MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File exceeds maximum upload size of 64 MB")

        file_hash = hashlib.sha256(content).hexdigest()
        filename = file.filename or ""

        # Look up by file hash (signed-open files) or container hash (.ecmx)
        seal = (
            db.query(FileSeal).filter(FileSeal.file_sha256 == file_hash).first()
            or db.query(FileSeal).filter(FileSeal.container_sha256 == file_hash).first()
        )

        if not seal:
            _log_verification(db, "not_found", None, request)
            return JSONResponse({"result": "not_found", "detail": "No matching certificate found for this file."})

        manifest = seal.manifest or {}
        kp = get_key_provider()
        sig_valid = verify_manifest_signature(manifest, kp)

        cert_id = seal.certificate_id

        if seal.status == "revoked":
            _log_verification(db, "revoked", cert_id, request)
            return JSONResponse({
                "result":         "revoked",
                "certificate_id": cert_id,
                "revoked_at":     seal.revoked_at.isoformat() if seal.revoked_at else None,
                "revoke_reason":  seal.revoke_reason,
                "provenance":     _safe_provenance(manifest, show_names=False),
            })

        if seal.status == "superseded":
            _log_verification(db, "superseded", cert_id, request)
            return JSONResponse({
                "result":         "superseded",
                "certificate_id": cert_id,
                "superseded_by":  seal.superseded_by,
                "provenance":     _safe_provenance(manifest, show_names=False),
            })

        if not sig_valid:
            _log_verification(db, "modified", cert_id, request)
            return JSONResponse({
                "result":         "modified",
                "certificate_id": cert_id,
                "detail":         "File hash matches a certificate but the registry record has been tampered with.",
            })

        _log_verification(db, "authentic", cert_id, request)
        return JSONResponse({
            "result":         "authentic",
            "certificate_id": cert_id,
            "verify_url":     f"{os.environ.get('VERIFY_BASE_URL', 'https://app.ecometric.io/verify')}?c={cert_id}",
            "provenance":     _safe_provenance(manifest, show_names=False),
        })
    finally:
        db.close()


# ─── Admin: revoke ────────────────────────────────────────────────────────────

@router.patch("/api/seal/{certificate_id}/revoke")
def revoke_certificate(certificate_id: str, body: dict, request: Request):
    """
    Revoke a certificate (admin only — JWT auth enforced at middleware level).
    Requires: { "reason": "..." }
    """
    reason = (body.get("reason") or "").strip()
    if not reason:
        raise HTTPException(status_code=422, detail="A revocation reason is required.")

    db = SessionLocal()
    try:
        seal = db.query(FileSeal).filter(FileSeal.certificate_id == certificate_id).first()
        if not seal:
            raise HTTPException(status_code=404, detail="Certificate not found.")
        if seal.status != "valid":
            raise HTTPException(status_code=409, detail=f"Certificate is already '{seal.status}'.")

        seal.status = "revoked"
        seal.revoked_at = datetime.now(timezone.utc)
        seal.revoke_reason = reason
        db.commit()
        return {"result": "revoked", "certificate_id": certificate_id}
    finally:
        db.close()


# ─── Admin: supersede ─────────────────────────────────────────────────────────

@router.patch("/api/seal/{certificate_id}/supersede")
def supersede_certificate(certificate_id: str, body: dict, request: Request):
    """
    Mark a certificate as superseded and link it to the new one.
    Requires: { "superseded_by": "ECM-..." }
    """
    new_cert_id = (body.get("superseded_by") or "").strip()
    if not new_cert_id:
        raise HTTPException(status_code=422, detail="superseded_by is required.")

    db = SessionLocal()
    try:
        seal = db.query(FileSeal).filter(FileSeal.certificate_id == certificate_id).first()
        if not seal:
            raise HTTPException(status_code=404, detail="Certificate not found.")

        seal.status = "superseded"
        seal.superseded_by = new_cert_id
        db.commit()
        return {"result": "superseded", "certificate_id": certificate_id, "superseded_by": new_cert_id}
    finally:
        db.close()

