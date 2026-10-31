"""
ECMSEAL Container — AES-256-GCM encrypted file format.

Binary layout:
    magic       7 bytes  "ECMSEAL"
    version     1 byte   0x01
    header_len  4 bytes  big-endian uint32 — length of the header JSON in bytes
    header      N bytes  UTF-8 JSON (see below)
    ciphertext  M bytes  AES-256-GCM encrypted file bytes followed by 16-byte GCM auth tag

Header JSON fields:
    certificate_id   str   ECM-XXXX-XXXX-XXXX-XXXX
    kek_id           str   identifier of the KEK used to wrap the DEK
    alg              str   "AES-256-GCM"
    nonce_b64        str   base64url-encoded 96-bit (12-byte) nonce
    wrapped_dek_b64  str   base64url-encoded AES key-wrapped DEK
    original_type    str   "pdf" | "xlsx" | "json"
    original_name    str   original filename (without .ecmx extension)
    container_version str  "1"

Associated data (AAD) for GCM authentication:
    magic + version_byte + big-endian header_len + header_bytes
    (binds ciphertext to this exact header — swapping a header fails auth)
"""

from __future__ import annotations

import base64
import json
import os
import struct

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .key_provider import KeyProvider

# ─── Constants ──────────────────────────────────────────────────────────────
MAGIC = b"ECMSEAL"
VERSION = b"\x01"
CONTAINER_VERSION = "1"
DEK_LEN = 32    # 256-bit data encryption key
NONCE_LEN = 12  # 96-bit nonce for AES-GCM


# ─── Write (encrypt) ────────────────────────────────────────────────────────

def write_container(
    file_bytes: bytes,
    certificate_id: str,
    original_type: str,
    original_name: str,
    key_provider: KeyProvider,
) -> bytes:
    """
    Encrypt *file_bytes* and return the full ECMSEAL container as bytes.

    A fresh random 256-bit DEK and 96-bit nonce are generated per call.
    The DEK is wrapped with the active KEK before being stored in the header.
    """
    kek_id = key_provider.active_kek_id()

    # 1. Fresh per-file key material
    dek = os.urandom(DEK_LEN)
    nonce = os.urandom(NONCE_LEN)

    # 2. Wrap DEK
    wrapped_dek = key_provider.wrap_dek(dek, kek_id)

    # 3. Build header (no ciphertext yet — needed for AAD)
    header_obj = {
        "certificate_id": certificate_id,
        "kek_id": kek_id,
        "alg": "AES-256-GCM",
        "nonce_b64": base64.urlsafe_b64encode(nonce).decode(),
        "wrapped_dek_b64": base64.urlsafe_b64encode(wrapped_dek).decode(),
        "original_type": original_type,
        "original_name": original_name,
        "container_version": CONTAINER_VERSION,
    }
    header_bytes = json.dumps(header_obj, separators=(",", ":"), sort_keys=True).encode("utf-8")
    header_len_bytes = struct.pack(">I", len(header_bytes))

    # 4. Compute AAD = magic + version + header_len + header
    aad = MAGIC + VERSION + header_len_bytes + header_bytes

    # 5. Encrypt with AAD
    aesgcm = AESGCM(dek)
    # AESGCM.encrypt returns ciphertext || 16-byte tag
    ciphertext_with_tag = aesgcm.encrypt(nonce, file_bytes, aad)

    # 6. Assemble container
    return MAGIC + VERSION + header_len_bytes + header_bytes + ciphertext_with_tag


# ─── Read (decrypt) ─────────────────────────────────────────────────────────

class ContainerReadError(Exception):
    """Raised when a container cannot be parsed or decrypted."""


def read_container(container_bytes: bytes, key_provider: KeyProvider) -> tuple[bytes, dict]:
    """
    Decrypt an ECMSEAL container.

    Returns:
        (plaintext_bytes, header_dict)

    Raises:
        ContainerReadError on any format, authentication, or key error.
    """
    try:
        # 1. Parse magic + version
        if len(container_bytes) < 12:
            raise ContainerReadError("Container too short to be valid")
        if container_bytes[:7] != MAGIC:
            raise ContainerReadError("Not an ECMSEAL container (bad magic bytes)")
        if container_bytes[7:8] != VERSION:
            raise ContainerReadError(
                f"Unsupported container version: {container_bytes[7]:02x}"
            )

        # 2. Parse header length
        header_len = struct.unpack(">I", container_bytes[8:12])[0]
        if 12 + header_len > len(container_bytes):
            raise ContainerReadError("Container truncated: header extends past end of data")

        # 3. Parse header JSON
        header_bytes = container_bytes[12: 12 + header_len]
        try:
            header = json.loads(header_bytes.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise ContainerReadError(f"Invalid header JSON: {exc}") from exc

        # 4. Reconstruct AAD (must match what was used during encryption)
        header_len_bytes = struct.pack(">I", header_len)
        aad = MAGIC + VERSION + header_len_bytes + header_bytes

        # 5. Extract key material from header
        try:
            kek_id = header["kek_id"]
            nonce = base64.urlsafe_b64decode(header["nonce_b64"])
            wrapped_dek = base64.urlsafe_b64decode(header["wrapped_dek_b64"])
        except (KeyError, Exception) as exc:
            raise ContainerReadError(f"Missing or malformed header field: {exc}") from exc

        # 6. Unwrap DEK
        try:
            dek = key_provider.unwrap_dek(wrapped_dek, kek_id)
        except Exception as exc:
            raise ContainerReadError(f"DEK unwrap failed (wrong KEK?): {exc}") from exc

        # 7. Decrypt ciphertext (last 16 bytes are GCM tag — included in ciphertext_with_tag)
        ciphertext_with_tag = container_bytes[12 + header_len:]
        try:
            aesgcm = AESGCM(dek)
            plaintext = aesgcm.decrypt(nonce, ciphertext_with_tag, aad)
        except Exception as exc:
            raise ContainerReadError(
                "Decryption failed: ciphertext or header has been tampered with"
            ) from exc

        return plaintext, header

    except ContainerReadError:
        raise
    except Exception as exc:
        raise ContainerReadError(f"Unexpected error reading container: {exc}") from exc

