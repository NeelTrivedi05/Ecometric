"""
Seal Service — core sealing logic for EcoMetric file exports.

Public entry point:
    export_finalize(file_bytes, file_type, meta, mode, db) -> ExportResult

This function is called AFTER a file has been generated and BEFORE it is
returned to the client.  The generators, calculation engine, and report layout
are not touched.

Certificate ID format:  ECM-XXXX-XXXX-XXXX-XXXX  (Crockford Base32, 80 bits)
Signature algorithm:    Ed25519 over canonical (sorted-key, compact JSON) manifest
Encryption:             AES-256-GCM with per-file DEK, DEK wrapped with KEK
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import secrets
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal, Optional

from sqlalchemy.orm import Session

from .container import write_container
from .key_provider import KeyProvider, get_key_provider
from .models import FileSeal, SealKey

# ─── Feature flag ───────────────────────────────────────────────────────────

SEALING_ENABLED = os.environ.get("FILE_SEALING_ENABLED", "false").lower() in (
    "1", "true", "yes"
)

# ─── Software version (single source of truth) ──────────────────────────────

SOFTWARE_VERSION = "1.0.0"
VERIFY_BASE_URL = os.environ.get("VERIFY_BASE_URL", "https://app.ecometric.io/verify")

# ─── Crockford Base32 alphabet ──────────────────────────────────────────────
# https://www.crockford.com/base32.html
_CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"


def _crockford_encode(data: bytes) -> str:
    """Encode bytes as Crockford Base32 (uppercase, no padding)."""
    n = int.from_bytes(data, "big")
    if n == 0:
        return "0"
    chars = []
    while n:
        chars.append(_CROCKFORD[n & 0x1F])
        n >>= 5
    return "".join(reversed(chars))


# ─── Data classes ───────────────────────────────────────────────────────────

@dataclass
class SealMeta:
    """
    Provenance metadata supplied by the caller at export time.
    All name fields are snapshots — renaming a user later never rewrites history.
    """
    organization_id:    str
    organization_name:  str
    created_by_user_id: str
    created_by_name:    str
    administrator_user_id: str
    administrator_name: str
    epd_id:             str
    epd_version:        str
    product_name:       str
    calculation_run_id: str
    lci_database:       str = "ecoinvent"
    lci_database_version: str = "3.12"
    original_file_name: str = "export"


@dataclass
class ExportResult:
    """Result returned by export_finalize()."""
    file_bytes:      bytes                # container (.ecmx) or plaintext
    content_type:    str                  # MIME type for the HTTP response
    filename:        str                  # suggested download filename
    certificate_id:  Optional[str]        # None if sealing is disabled
    verify_url:      Optional[str]        # None if sealing is disabled


# ─── Certificate ID generation ──────────────────────────────────────────────

def generate_certificate_id() -> str:
    """
    Generate a unique, non-sequential certificate ID.
    Format: ECM-XXXX-XXXX-XXXX-XXXX  (80 bits of randomness, Crockford Base32)
    """
    raw = secrets.token_bytes(10)  # 80 bits
    encoded = _crockford_encode(raw).zfill(16)  # pad to 16 chars
    groups = [encoded[i: i + 4] for i in range(0, 16, 4)]
    return "ECM-" + "-".join(groups)


# ─── Manifest build & signing ───────────────────────────────────────────────

def _canonical_json(obj: dict) -> bytes:
    """
    Produce a deterministic JSON representation.
    Keys sorted, no insignificant whitespace, UTF-8.
    (JCS / RFC 8785 compatible for simple objects without floats/unicode escapes.)
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def build_manifest(
    certificate_id: str,
    file_type: str,
    file_sha256: str,
    meta: SealMeta,
    mode: str,
    signing_key_id: str,
) -> dict:
    """Build the provenance manifest dict (without signature — added after signing)."""
    return {
        "certificate_id":        certificate_id,
        "manifest_version":      "1",
        "file_type":             file_type,
        "original_file_name":    meta.original_file_name,
        "file_sha256":           file_sha256,
        "created_at":            datetime.now(timezone.utc).isoformat(),
        "organization_id":       meta.organization_id,
        "organization_name":     meta.organization_name,
        "created_by_user_id":    meta.created_by_user_id,
        "created_by_name":       meta.created_by_name,
        "administrator_user_id": meta.administrator_user_id,
        "administrator_name":    meta.administrator_name,
        "epd_id":                meta.epd_id,
        "epd_version":           meta.epd_version,
        "product_name":          meta.product_name,
        "calculation_run_id":    meta.calculation_run_id,
        "lci_database":          meta.lci_database,
        "lci_database_version":  meta.lci_database_version,
        "software_version":      SOFTWARE_VERSION,
        "export_mode":           mode,
        "signature_algorithm":   "Ed25519",
        "signing_key_id":        signing_key_id,
    }


def sign_manifest(manifest: dict, key_provider: KeyProvider) -> str:
    """
    Sign the canonical manifest (without the 'signature' field) using Ed25519.
    Returns: base64url-encoded signature string.
    """
    key_id = manifest["signing_key_id"]
    private_key = key_provider.get_signing_private_key(key_id)
    canonical = _canonical_json(manifest)
    sig_bytes = private_key.sign(canonical)
    return base64.urlsafe_b64encode(sig_bytes).decode()


# ─── File embedding helpers ─────────────────────────────────────────────────

def _embed_certificate_id_pdf(pdf_bytes: bytes, certificate_id: str, verify_url: str) -> bytes:
    """
    Embed the certificate ID into a PDF via the Info dictionary.
    Uses pypdf to add a custom metadata entry without re-rendering pages.
    """
    try:
        import io
        from pypdf import PdfReader, PdfWriter
        reader = PdfReader(io.BytesIO(pdf_bytes))
        writer = PdfWriter()
        writer.append_pages_from_reader(reader)
        # Copy existing metadata
        if reader.metadata:
            writer.add_metadata(dict(reader.metadata))
        # Add seal metadata
        writer.add_metadata({
            "/EcoMetricCertificate": certificate_id,
            "/EcoMetricVerifyURL": verify_url,
        })
        buf = io.BytesIO()
        writer.write(buf)
        return buf.getvalue()
    except Exception:
        # Never block an export — return unmodified bytes if embedding fails
        return pdf_bytes


def _embed_certificate_id_json(json_bytes: bytes, certificate_id: str, verify_url: str) -> bytes:
    """Add _ecometric_seal top-level key to a JSON file."""
    try:
        obj = json.loads(json_bytes)
        obj["_ecometric_seal"] = {
            "certificate_id": certificate_id,
            "verify_url": verify_url,
        }
        return json.dumps(obj, indent=2, ensure_ascii=False).encode("utf-8")
    except Exception:
        return json_bytes


def _embed_certificate_id(
    file_bytes: bytes,
    file_type: str,
    certificate_id: str,
    verify_url: str,
) -> bytes:
    """Dispatch to the appropriate embedder for the file type."""
    if file_type == "pdf":
        return _embed_certificate_id_pdf(file_bytes, certificate_id, verify_url)
    if file_type == "json":
        return _embed_certificate_id_json(file_bytes, certificate_id, verify_url)
    # xlsx: would use openpyxl custom properties — not yet implemented (no xlsx export)
    return file_bytes


# ─── Registry helpers ────────────────────────────────────────────────────────

def _ensure_key_registered(key_id: str, key_provider: KeyProvider, db: Session) -> None:
    """Insert the signing key into seal_keys if not already there."""
    existing = db.query(SealKey).filter(SealKey.key_id == key_id).first()
    if not existing:
        pub_b64 = key_provider.get_signing_public_key_b64(key_id)
        db.add(SealKey(
            key_id=key_id,
            purpose="signing",
            public_key_b64=pub_b64,
            status="active",
        ))
        db.flush()


def _store_seal(
    manifest: dict,
    signature: str,
    container_sha256: Optional[str],
    export_mode: str,
    db: Session,
) -> None:
    """Persist the FileSeal record to the registry."""
    signed_manifest = {**manifest, "signature": signature}
    db.add(FileSeal(
        certificate_id=manifest["certificate_id"],
        manifest_version=manifest["manifest_version"],
        manifest=signed_manifest,
        signature=signature,
        signing_key_id=manifest["signing_key_id"],
        file_sha256=manifest["file_sha256"],
        container_sha256=container_sha256,
        export_mode=export_mode,
        status="valid",
    ))
    db.commit()


# ─── MIME types ─────────────────────────────────────────────────────────────

_MIME = {
    "pdf":  "application/pdf",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "json": "application/json",
    "ecmx": "application/octet-stream",
}

_EXT = {"pdf": ".pdf", "xlsx": ".xlsx", "json": ".json"}


# ─── Main entry point ────────────────────────────────────────────────────────

def export_finalize(
    file_bytes: bytes,
    file_type: Literal["pdf", "xlsx", "json"],
    meta: SealMeta,
    mode: Literal["sealed", "signed_open"],
    db: Session,
    key_provider: Optional[KeyProvider] = None,
) -> ExportResult:
    """
    Post-generation sealing step.  Called once per export, after the file has
    been produced by the generator.

    If FILE_SEALING_ENABLED=false (default), this is a pass-through.

    Steps (when enabled):
      1. Generate certificate ID
      2. Embed certificate ID into the file (without altering layout/content)
      3. Compute file_sha256 over the embedded bytes
      4. Build & sign the manifest with Ed25519
      5. Persist the registry record
      6a. Sealed mode  → wrap in ECMSEAL AES-256-GCM container
      6b. Signed-open  → return the plaintext bytes (already has cert ID embedded)
    """
    base_name = meta.original_file_name.rsplit(".", 1)[0]
    ext = _EXT.get(file_type, "")

    if not SEALING_ENABLED:
        return ExportResult(
            file_bytes=file_bytes,
            content_type=_MIME[file_type],
            filename=f"{base_name}{ext}",
            certificate_id=None,
            verify_url=None,
        )

    kp = key_provider or get_key_provider()
    signing_key_id = kp.active_signing_key_id()

    # Ensure key is in the registry
    _ensure_key_registered(signing_key_id, kp, db)

    # 1. Certificate ID
    cert_id = generate_certificate_id()
    verify_url = f"{VERIFY_BASE_URL}?c={cert_id}"

    # 2. Embed certificate ID
    embedded_bytes = _embed_certificate_id(file_bytes, file_type, cert_id, verify_url)

    # 3. SHA-256 of the final plaintext
    file_sha256 = hashlib.sha256(embedded_bytes).hexdigest()

    # 4. Build + sign manifest
    manifest = build_manifest(
        certificate_id=cert_id,
        file_type=file_type,
        file_sha256=file_sha256,
        meta=meta,
        mode=mode,
        signing_key_id=signing_key_id,
    )
    signature = sign_manifest(manifest, kp)

    if mode == "sealed":
        # 5a. Encrypt into ECMSEAL container
        container_bytes = write_container(
            embedded_bytes,
            cert_id,
            file_type,
            f"{base_name}{ext}",
            kp,
        )
        container_sha256 = hashlib.sha256(container_bytes).hexdigest()
        _store_seal(manifest, signature, container_sha256, mode, db)

        return ExportResult(
            file_bytes=container_bytes,
            content_type=_MIME["ecmx"],
            filename=f"{base_name}{ext}.ecmx",
            certificate_id=cert_id,
            verify_url=verify_url,
        )
    else:  # signed_open
        _store_seal(manifest, signature, None, mode, db)

        return ExportResult(
            file_bytes=embedded_bytes,
            content_type=_MIME[file_type],
            filename=f"{base_name}{ext}",
            certificate_id=cert_id,
            verify_url=verify_url,
        )


# ─── Signature verification helper (used by /verify endpoint) ───────────────

def verify_manifest_signature(manifest_with_sig: dict, key_provider: KeyProvider) -> bool:
    """
    Verify the Ed25519 signature stored in manifest_with_sig["signature"].
    Returns True if authentic, False otherwise.
    """
    try:
        signature_b64 = manifest_with_sig.get("signature")
        if not signature_b64:
            return False
        sig_bytes = base64.urlsafe_b64decode(signature_b64)
        key_id = manifest_with_sig.get("signing_key_id", "")
        pub_key = key_provider.get_signing_public_key(key_id)

        # Canonical manifest WITHOUT the signature field
        manifest_no_sig = {k: v for k, v in manifest_with_sig.items() if k != "signature"}
        canonical = _canonical_json(manifest_no_sig)
        pub_key.verify(sig_bytes, canonical)
        return True
    except Exception:
        return False

