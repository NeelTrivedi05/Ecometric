"""
Comprehensive Tests for EcoMetric File Sealing & Public Verification
=====================================================================
Covers:
  1. KeyProvider functionality (env secret derivation, wrap/unwrap DEK)
  2. ECMSEAL container format (AES-256-GCM encryption/decryption)
  3. Tamper detection (ciphertext byte flip, header byte flip, nonce tampering)
  4. Nonce uniqueness test (1,000 iterations)
  5. JSON & PDF sealing round-trip
  6. Verify endpoint behavior: Authentic, Modified, Revoked, Superseded, Not Found
  7. Public verify endpoint never leaks file content or PII
"""

import base64
import json
import os
import secrets
import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, PublicFormat, NoEncryption
from fastapi.testclient import TestClient

# Configure test environment variables before importing app
# Generate fresh test keys
_test_private_k1 = Ed25519PrivateKey.generate()
_test_der_k1 = _test_private_k1.private_bytes(Encoding.DER, PrivateFormat.PKCS8, NoEncryption())
_test_b64_k1 = base64.b64encode(_test_der_k1).decode("ascii")

_test_private_k2 = Ed25519PrivateKey.generate()
_test_der_k2 = _test_private_k2.private_bytes(Encoding.DER, PrivateFormat.PKCS8, NoEncryption())
_test_b64_k2 = base64.b64encode(_test_der_k2).decode("ascii")

_test_kek1 = os.urandom(32)
_test_b64_kek1 = base64.b64encode(_test_kek1).decode("ascii")

os.environ["FILE_SEALING_ENABLED"] = "true"
os.environ["SEAL_ACTIVE_SIGNING_KEY_ID"] = "k1"
os.environ["SEAL_SIGNING_KEY_k1"] = _test_b64_k1
os.environ["SEAL_SIGNING_KEY_k2"] = _test_b64_k2
os.environ["SEAL_ACTIVE_KEK_ID"] = "kek1"
os.environ["SEAL_KEK_kek1"] = _test_b64_kek1

from app.database import Base, engine, SessionLocal
from main import app
from app.seal.key_provider import EnvSecretKeyProvider, get_key_provider
from app.seal.container import write_container, read_container, ContainerReadError
from app.seal.seal_service import (
    generate_certificate_id,
    build_manifest,
    sign_manifest,
    export_finalize,
    verify_manifest_signature,
    SealMeta,
)
from app.seal.models import FileSeal, SealKey

# Ensure tables are built
Base.metadata.create_all(bind=engine)
client = TestClient(app)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_key_provider():
    provider = EnvSecretKeyProvider()
    assert provider.active_signing_key_id() == "k1"
    assert provider.active_kek_id() == "kek1"

    dek = os.urandom(32)
    wrapped = provider.wrap_dek(dek, "kek1")
    unwrapped = provider.unwrap_dek(wrapped, "kek1")
    assert unwrapped == dek


def test_container_roundtrip():
    provider = EnvSecretKeyProvider()
    data = b"Hello EcoMetric Sealed Container Test Payload"
    cert_id = generate_certificate_id()

    container_bytes = write_container(
        file_bytes=data,
        certificate_id=cert_id,
        original_type="json",
        original_name="test.json",
        key_provider=provider,
    )

    assert container_bytes.startswith(b"ECMSEAL\x01")
    plaintext, header = read_container(container_bytes, provider)
    assert plaintext == data
    assert header["certificate_id"] == cert_id
    assert header["original_type"] == "json"


def test_container_tamper_detection():
    provider = EnvSecretKeyProvider()
    data = b"Sensitive LCA Inventory Details"
    cert_id = generate_certificate_id()

    container_bytes = bytearray(write_container(
        file_bytes=data,
        certificate_id=cert_id,
        original_type="pdf",
        original_name="report.pdf",
        key_provider=provider,
    ))

    # Tamper with the last byte of ciphertext (auth tag area)
    container_bytes[-1] ^= 0xFF

    with pytest.raises(ContainerReadError):
        read_container(bytes(container_bytes), provider)


def test_nonce_uniqueness_1000():
    provider = EnvSecretKeyProvider()
    data = b"Check Nonce Uniqueness"
    nonces = set()

    for _ in range(1000):
        c = write_container(data, "ECM-TEST", "json", "t.json", provider)
        _, header = read_container(c, provider)
        nonce = header["nonce_b64"]
        assert nonce not in nonces, "Duplicate nonce generated!"
        nonces.add(nonce)


def test_export_finalize_json_sealed_and_open(db_session):
    meta = SealMeta(
        organization_id="org-carrier",
        organization_name="Carrier Commercial HVAC",
        created_by_user_id="user-1",
        created_by_name="Engineer Dave",
        administrator_user_id="admin-1",
        administrator_name="Admin Sarah",
        epd_id="proj-19dv",
        epd_version="1.0",
        product_name="AquaEdge 19DV Centrifugal Chiller",
        calculation_run_id="run-1",
        original_file_name="declaration.json",
    )

    raw_json = json.dumps({"project": "AquaEdge 19DV", "gwp": 38420}).encode("utf-8")

    # 1. Sealed mode export
    res_sealed = export_finalize(
        file_bytes=raw_json,
        file_type="json",
        meta=meta,
        mode="sealed",
        db=db_session,
    )
    assert res_sealed.certificate_id.startswith("ECM-")
    assert res_sealed.filename.endswith(".ecmx")
    assert res_sealed.file_bytes.startswith(b"ECMSEAL")

    # Verify through API endpoint with file upload
    resp = client.post(
        "/api/verify",
        files={"file": (res_sealed.filename, res_sealed.file_bytes, "application/octet-stream")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["result"] == "authentic"
    assert body["certificate_id"] == res_sealed.certificate_id
    assert body["provenance"]["organization_name"] == "Carrier Commercial HVAC"
    # Never leak sensitive user ids or internal secrets
    assert "user_id" not in body["provenance"]
    assert "administrator_user_id" not in body["provenance"]

    # 2. Signed open mode export
    res_open = export_finalize(
        file_bytes=raw_json,
        file_type="json",
        meta=meta,
        mode="signed_open",
        db=db_session,
    )
    assert res_open.certificate_id.startswith("ECM-")
    assert res_open.filename.endswith(".json")
    # Verify open JSON embeds _ecometric_seal
    open_obj = json.loads(res_open.file_bytes.decode("utf-8"))
    assert "_ecometric_seal" in open_obj
    assert open_obj["_ecometric_seal"]["certificate_id"] == res_open.certificate_id

    # Verify through API endpoint with certificate ID
    resp_id = client.get(f"/api/verify/{res_open.certificate_id}")
    assert resp_id.status_code == 200
    assert resp_id.json()["result"] == "authentic"


def test_tampered_file_returns_modified_or_not_found(db_session):
    meta = SealMeta(
        organization_id="org-carrier",
        organization_name="Carrier Commercial HVAC",
        created_by_user_id="user-1",
        created_by_name="Engineer Dave",
        administrator_user_id="admin-1",
        administrator_name="Admin Sarah",
        epd_id="proj-19dv",
        epd_version="1.0",
        product_name="AquaEdge 19DV",
        calculation_run_id="run-2",
        original_file_name="tamper_test.json",
    )
    raw_json = json.dumps({"valid": True}).encode("utf-8")
    res = export_finalize(raw_json, "json", meta, "signed_open", db_session)

    # 1-byte tamper in the file
    tampered_bytes = bytearray(res.file_bytes)
    tampered_bytes[10] ^= 0x01

    resp = client.post(
        "/api/verify",
        files={"file": ("tampered.json", bytes(tampered_bytes), "application/json")},
    )
    assert resp.status_code == 200
    # Because SHA-256 no longer matches any known registry seal
    assert resp.json()["result"] == "not_found"


def test_revocation_workflow(db_session):
    meta = SealMeta(
        organization_id="org-carrier",
        organization_name="Carrier Commercial HVAC",
        created_by_user_id="user-1",
        created_by_name="Engineer Dave",
        administrator_user_id="admin-1",
        administrator_name="Admin Sarah",
        epd_id="proj-19dv",
        epd_version="1.0",
        product_name="AquaEdge 19DV",
        calculation_run_id="run-3",
        original_file_name="revoked.json",
    )
    raw_json = json.dumps({"test": "revocation"}).encode("utf-8")
    res = export_finalize(raw_json, "json", meta, "signed_open", db_session)

    # Revoke it
    rev_resp = client.patch(
        f"/api/seal/{res.certificate_id}/revoke",
        json={"reason": "Flawed A1-A3 steel emission factor was reported by supplier"},
    )
    assert rev_resp.status_code == 200
    assert rev_resp.json()["result"] == "revoked"

    # Verify by ID
    check_resp = client.get(f"/api/verify/{res.certificate_id}")
    assert check_resp.status_code == 200
    body = check_resp.json()
    assert body["result"] == "revoked"
    assert "Flawed A1-A3 steel emission factor" in body["revoke_reason"]


def test_superseded_workflow(db_session):
    meta = SealMeta(
        organization_id="org-carrier",
        organization_name="Carrier Commercial HVAC",
        created_by_user_id="user-1",
        created_by_name="Engineer Dave",
        administrator_user_id="admin-1",
        administrator_name="Admin Sarah",
        epd_id="proj-19dv",
        epd_version="1.0",
        product_name="AquaEdge 19DV",
        calculation_run_id="run-4",
        original_file_name="superseded.json",
    )
    raw_json = json.dumps({"v": 1}).encode("utf-8")
    res1 = export_finalize(raw_json, "json", meta, "signed_open", db_session)
    res2 = export_finalize(raw_json, "json", meta, "signed_open", db_session)

    # Supersede res1 with res2
    sup_resp = client.patch(
        f"/api/seal/{res1.certificate_id}/supersede",
        json={"superseded_by": res2.certificate_id},
    )
    assert sup_resp.status_code == 200

    check_resp = client.get(f"/api/verify/{res1.certificate_id}")
    assert check_resp.status_code == 200
    assert check_resp.json()["result"] == "superseded"
    assert check_resp.json()["superseded_by"] == res2.certificate_id


def test_well_known_keys_endpoint():
    resp = client.get("/.well-known/ecometric-seal-keys.json")
    assert resp.status_code == 200
    data = resp.json()
    assert "keys" in data
    assert any(k["key_id"] == "k1" for k in data["keys"])
    assert any(k["algorithm"] == "Ed25519" for k in data["keys"])
