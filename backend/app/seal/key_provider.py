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

For production, implement KMSKeyProvider backed by AWS KMS, GCP Cloud KMS, or
Azure Key Vault using the same interface.
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
    Reads key material from environment variables.

    Signing key env var:  SEAL_SIGNING_KEY_<key_id>
        Value: PKCS8 DER bytes of the Ed25519 private key, encoded as standard base64.
        Generate: python -c "
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
            from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption
            import base64
            k = Ed25519PrivateKey.generate()
            der = k.private_bytes(Encoding.DER, PrivateFormat.PKCS8, NoEncryption())
            print(base64.b64encode(der).decode())
        "

    KEK env var:  SEAL_KEK_<kek_id>
        Value: 32 random bytes encoded as standard base64.
        Generate: python -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"
    """

    def active_signing_key_id(self) -> str:
        kid = os.environ.get("SEAL_ACTIVE_SIGNING_KEY_ID", "k1")
        if not kid:
            raise RuntimeError("SEAL_ACTIVE_SIGNING_KEY_ID env var is not set")
        return kid

    def get_signing_private_key(self, key_id: str) -> Ed25519PrivateKey:
        env_var = f"SEAL_SIGNING_KEY_{key_id}"
        b64 = os.environ.get(env_var)
        if not b64:
            raise RuntimeError(
                f"Signing key not found: env var '{env_var}' is missing. "
                "See key_provider.py docstring for how to generate one."
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
        kid = os.environ.get("SEAL_ACTIVE_KEK_ID", "kek1")
        if not kid:
            raise RuntimeError("SEAL_ACTIVE_KEK_ID env var is not set")
        return kid

    def _get_kek_bytes(self, kek_id: str) -> bytes:
        env_var = f"SEAL_KEK_{kek_id}"
        b64 = os.environ.get(env_var)
        if not b64:
            raise RuntimeError(
                f"KEK not found: env var '{env_var}' is missing. "
                "See key_provider.py docstring for how to generate one."
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

