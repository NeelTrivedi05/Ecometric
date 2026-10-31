"""
Key Provider
============
Abstract base class + environment-secret implementation for Ed25519 signing
keys and AES-256 key-encryption keys (KEKs).

Private key material never leaves this module — it is never stored in the
database, logs, or client bundle.

Environment variables (dev / single-server):
    SEAL_ACTIVE_SIGNING_KEY_ID   e.g. "k1"
    SEAL_SIGNING_KEY_k1          Ed25519 private key, base64url-encoded DER (PKCS8)
    SEAL_ACTIVE_KEK_ID           e.g. "kek1"
    SEAL_KEK_kek1                32 random bytes, base64url-encoded (AES-256 KEK)
"""

from __future__ import annotations

import base64
import os
from abc import ABC, abstractmethod

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives.keywrap import aes_key_wrap, aes_key_unwrap
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    PublicFormat,
    PrivateFormat,
    NoEncryption,
    load_der_private_key,
)
from cryptography.hazmat.backends import default_backend


# Fallback development keys if environment variables are not explicitly provided
_DEFAULT_DEV_SIGNING_KEYS = {
    "k1": "MC4CAQAwBQYDK2VwBCIEIGeQ1PZBPLs84aBYEwrPDWjGzIYFrxmOahJ87gZj6QTf",
}
_DEFAULT_DEV_KEKS = {
    "kek1": "yBVCNpXXH2T+9CzEYnFGlHYeVTcKVKbtDycCq46Jh40=",
}


# ---------------------------------------------------------------------------
# Abstract interface
# ---------------------------------------------------------------------------

class KeyProvider(ABC):
    """Interface for cryptographic key access."""

    @abstractmethod
    def active_signing_key_id(self) -> str:
        """Return the key_id of the currently active Ed25519 signing key."""

    @abstractmethod
    def get_signing_private_key(self, key_id: str) -> Ed25519PrivateKey:
        """Return the Ed25519 private key for the given key_id."""

    @abstractmethod
    def get_signing_public_key(self, key_id: str) -> Ed25519PublicKey:
        """Return the Ed25519 public key for the given key_id."""

    @abstractmethod
    def get_signing_public_key_b64(self, key_id: str) -> str:
        """Return the Ed25519 public key as base64url-encoded raw bytes (32 bytes)."""

    @abstractmethod
    def active_kek_id(self) -> str:
        """Return the key_id of the currently active KEK."""

    @abstractmethod
    def wrap_dek(self, dek: bytes, kek_id: str) -> bytes:
        """Wrap (encrypt) a 32-byte DEK with the KEK identified by kek_id."""

    @abstractmethod
    def unwrap_dek(self, wrapped: bytes, kek_id: str) -> bytes:
        """Unwrap (decrypt) a wrapped DEK using the KEK identified by kek_id."""


# ---------------------------------------------------------------------------
# Environment-secret implementation (dev / single-server)
# ---------------------------------------------------------------------------

class EnvSecretKeyProvider(KeyProvider):
    """
    Reads key material from environment variables, with fallback to built-in dev keys.
    """

    def active_signing_key_id(self) -> str:
        return os.environ.get("SEAL_ACTIVE_SIGNING_KEY_ID", "k1")

    def get_signing_private_key(self, key_id: str) -> Ed25519PrivateKey:
        env_var = f"SEAL_SIGNING_KEY_{key_id}"
        b64 = os.environ.get(env_var) or _DEFAULT_DEV_SIGNING_KEYS.get(key_id)
        if not b64:
            raise RuntimeError(
                f"Signing key not found: env var '{env_var}' is missing and no default configured."
            )
        der = base64.b64decode(b64)
        return load_der_private_key(der, password=None, backend=default_backend())

    def get_signing_public_key(self, key_id: str) -> Ed25519PublicKey:
        return self.get_signing_private_key(key_id).public_key()

    def get_signing_public_key_b64(self, key_id: str) -> str:
        pub = self.get_signing_public_key(key_id)
        raw = pub.public_bytes(Encoding.Raw, PublicFormat.Raw)  # 32 bytes
        return base64.urlsafe_b64encode(raw).decode()

    def active_kek_id(self) -> str:
        return os.environ.get("SEAL_ACTIVE_KEK_ID", "kek1")

    def _get_kek_bytes(self, kek_id: str) -> bytes:
        env_var = f"SEAL_KEK_{kek_id}"
        b64 = os.environ.get(env_var) or _DEFAULT_DEV_KEKS.get(kek_id)
        if not b64:
            raise RuntimeError(
                f"KEK not found: env var '{env_var}' is missing and no default configured."
            )
        key = base64.b64decode(b64)
        if len(key) != 32:
            raise RuntimeError(f"KEK '{kek_id}' must be 32 bytes; got {len(key)}")
        return key

    def wrap_dek(self, dek: bytes, kek_id: str) -> bytes:
        """AES key-wrap (RFC 3394) of the 32-byte DEK."""
        kek = self._get_kek_bytes(kek_id)
        return aes_key_wrap(kek, dek, default_backend())

    def unwrap_dek(self, wrapped: bytes, kek_id: str) -> bytes:
        """AES key-unwrap (RFC 3394) of a wrapped DEK."""
        kek = self._get_kek_bytes(kek_id)
        return aes_key_unwrap(kek, wrapped, default_backend())


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

_provider: KeyProvider | None = None


def get_key_provider() -> KeyProvider:
    """Return the active KeyProvider singleton (lazy-initialised)."""
    global _provider
    if _provider is None:
        _provider = EnvSecretKeyProvider()
    return _provider
