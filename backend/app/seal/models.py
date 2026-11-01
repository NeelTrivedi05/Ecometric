"""
SQLAlchemy models for the file sealing registry.

Three tables (matching migration 004_file_sealing.sql):
    FileSeal             — one row per exported file (provenance record)
    SealKey              — public signing key / KEK registry
    SealVerificationLog  — public verify endpoint audit log (no PII)
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    JSON,
    String,
    Text,
)

from app.database import Base

def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class SealKey(Base):
    __tablename__ = "seal_keys"

    key_id         = Column(String, primary_key=True)
    purpose        = Column(String, nullable=False)          # "signing" | "kek"
    public_key_b64 = Column(Text, nullable=True)             # Ed25519 raw public key, base64url
    status         = Column(String, nullable=False, default="active")
    created_at     = Column(DateTime, default=utcnow)
    retired_at     = Column(DateTime, nullable=True)


class FileSeal(Base):
    __tablename__ = "file_seals"

    certificate_id   = Column(String, primary_key=True)
    manifest_version = Column(String, nullable=False, default="1")
    manifest         = Column(JSON, nullable=False)           # full provenance snapshot
    signature        = Column(Text, nullable=False)           # base64url Ed25519 signature
    signing_key_id   = Column(String, ForeignKey("seal_keys.key_id"), nullable=False)
    file_sha256      = Column(String, nullable=False, index=True)
    container_sha256 = Column(String, nullable=True,  index=True)
    export_mode      = Column(String, nullable=False)         # "sealed" | "signed_open"
    status           = Column(String, nullable=False, default="valid")
    revoked_at       = Column(DateTime, nullable=True)
    revoked_by       = Column(String, nullable=True)          # user id string
    revoke_reason    = Column(Text, nullable=True)
    superseded_by    = Column(String, ForeignKey("file_seals.certificate_id"), nullable=True)
    created_at       = Column(DateTime, default=utcnow)


class SealVerificationLog(Base):
    __tablename__ = "seal_verification_log"

    id             = Column(String, primary_key=True)
    verified_at    = Column(DateTime, default=utcnow, index=True)
    result         = Column(String, nullable=False)
    certificate_id = Column(String, nullable=True, index=True)
    ip_hash        = Column(String, nullable=True)
    user_agent_fam = Column(String, nullable=True)
