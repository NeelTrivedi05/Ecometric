"""
EcoMetric Seal Key Rotation Utility
====================================
Generates new Ed25519 signing keys and AES-256 KEKs, and registers public keys
in the seal_keys table.

Usage:
    python scripts/seal_key_rotate.py --generate-signing [KEY_ID]
    python scripts/seal_key_rotate.py --generate-kek [KEK_ID]
    python scripts/seal_key_rotate.py --register-signing KEY_ID PUBLIC_KEY_B64
    python scripts/seal_key_rotate.py --retire KEY_ID
"""

import argparse
import base64
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add backend root to sys.path
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, PublicFormat, NoEncryption


def generate_signing_key(key_id: str):
    private_key = Ed25519PrivateKey.generate()
    der_bytes = private_key.private_bytes(
        Encoding.DER,
        PrivateFormat.PKCS8,
        NoEncryption(),
    )
    b64_private = base64.b64encode(der_bytes).decode("ascii")

    pub_key = private_key.public_key()
    raw_pub = pub_key.public_bytes(Encoding.Raw, PublicFormat.Raw)
    b64_public = base64.urlsafe_b64encode(raw_pub).decode("ascii")

    print("=" * 60)
    print(f"Generated Ed25519 Signing Key: {key_id}")
    print("=" * 60)
    print("Add this to your environment / .env file:")
    print(f"SEAL_SIGNING_KEY_{key_id}={b64_private}")
    print(f"SEAL_ACTIVE_SIGNING_KEY_ID={key_id}")
    print("\nPublic Key (Base64url):")
    print(b64_public)
    print("=" * 60)
    return b64_public


def generate_kek(kek_id: str):
    raw = os.urandom(32)
    b64_kek = base64.b64encode(raw).decode("ascii")

    print("=" * 60)
    print(f"Generated AES-256 KEK: {kek_id}")
    print("=" * 60)
    print("Add this to your environment / .env file:")
    print(f"SEAL_KEK_{kek_id}={b64_kek}")
    print(f"SEAL_ACTIVE_KEK_ID={kek_id}")
    print("=" * 60)
    return b64_kek


def register_signing_key(key_id: str, public_key_b64: str):
    from app.database import SessionLocal
    from app.seal.models import SealKey

    db = SessionLocal()
    try:
        existing = db.query(SealKey).filter(SealKey.key_id == key_id).first()
        if existing:
            existing.public_key_b64 = public_key_b64
            existing.status = "active"
            existing.retired_at = None
            db.commit()
            print(f"Updated existing SealKey: {key_id}")
        else:
            key = SealKey(
                key_id=key_id,
                purpose="signing",
                public_key_b64=public_key_b64,
                status="active",
            )
            db.add(key)
            db.commit()
            print(f"Registered new SealKey: {key_id}")
    finally:
        db.close()


def retire_key(key_id: str):
    from app.database import SessionLocal
    from app.seal.models import SealKey

    db = SessionLocal()
    try:
        existing = db.query(SealKey).filter(SealKey.key_id == key_id).first()
        if not existing:
            print(f"Key not found: {key_id}")
            return
        existing.status = "retired"
        existing.retired_at = datetime.now(timezone.utc)
        db.commit()
        print(f"Key {key_id} has been marked as retired.")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="EcoMetric Seal Key Manager")
    parser.add_argument("--generate-signing", nargs="?", const="k1", help="Generate Ed25519 signing key")
    parser.add_argument("--generate-kek", nargs="?", const="kek1", help="Generate AES-256 KEK")
    parser.add_argument("--register-signing", nargs=2, metavar=("KEY_ID", "PUB_B64"), help="Register signing key in DB")
    parser.add_argument("--retire", metavar="KEY_ID", help="Retire an active key")

    args = parser.parse_args()

    if args.generate_signing:
        pub = generate_signing_key(args.generate_signing)
        try:
            register_signing_key(args.generate_signing, pub)
        except Exception as e:
            print(f"Note: Could not register in DB automatically ({e}). Register manually with --register-signing.")
    elif args.generate_kek:
        generate_kek(args.generate_kek)
    elif args.register_signing:
        register_signing_key(args.register_signing[0], args.register_signing[1])
    elif args.retire:
        retire_key(args.retire)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
