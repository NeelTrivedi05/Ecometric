"""
EcoMetric File Seal Package
============================
Provides cryptographic sealing (Ed25519 + AES-256-GCM) for all EPD exports.

Public surface:
    export_finalize(file_bytes, file_type, meta, mode, db) -> ExportResult
    SealMeta
    ExportResult
    KeyProvider / EnvSecretKeyProvider
"""
from .seal_service import export_finalize, SealMeta, ExportResult  # noqa: F401
from .key_provider import KeyProvider, EnvSecretKeyProvider         # noqa: F401

