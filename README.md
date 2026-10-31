# 🌿 EcoMetric — Monorepo Platform

> **Industrial Environmental Product Declaration (EPD) & Life-Cycle Assessment (LCA) System for HVAC Chillers**  
> Compliant with **UL 10010-4 Part B v2.0 (2018)**, **EN 15804+A2**, **ISO 14025**, and powered by **ecoinvent v3.12 LCIA** data.

---

## 📂 Top-Level Architecture Overview

EcoMetric is organized into three clean, modular top-level directories:

- **`frontend/`**: A modern Next.js 15 App Router web application providing an interactive 3D scrollytelling showcase, a 6-step guided EPD creation wizard, and a real-time LCIA results dashboard with B6-dominance visualization.
- **`backend/`**: A high-performance Python FastAPI service housing pure computational LCA engines (`calc_engine.py`, `pcr_validation.py`, `report_gen.py`, `ecoinvent_lookup.py`), versioned JSON reference datasets in `backend/data/`, and stateless API router handlers.
- **`database/`**: The canonical database layer containing Alembic database migrations (`database/migrations/`), automated seed scripts for PCR rules and 50-city weather bin hours (`database/seed/`), and the canonical DDL SQL schema (`database/schema.sql`).

---

## 🚀 How to Run Each Folder Independently

### 1. Frontend (`frontend/`)
The Next.js frontend can be started independently:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

To verify a production build:
```bash
cd frontend
npm run build
```

---

### 2. Backend Service (`backend/`)
The FastAPI backend service manages LCA computations and API route handling:
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python main.py
```
The backend API will run at [http://localhost:8000](http://localhost:8000). Interactive OpenAPI documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 3. Database & Migrations (`database/`)
Database schema migrations and seed scripts are managed using Alembic and Python:
```bash
# Seed database with PCR rules & 50-city weather bin hours
python database/seed/seed_pcr_rules.py

# Run Alembic migrations (from database/migrations directory)
cd database/migrations
alembic upgrade head
```

---

## 📋 Pre-Flight Checklist Summary

1. **DB ORM**: SQLAlchemy (`backend/app/models.py`) and Alembic migrations (`database/migrations/`) are the single source of truth for the database schema.
2. **Ecoinvent Version**: Pinned to version `"3.12"` in `backend/data/emission_factors.json` metadata.
3. **Build Patch**: Includes `frontend/patch-node25.js` preloader in `frontend/package.json` for Node v25 Windows compatibility.
4. **16-Module Count**: Full support for 15 mandatory modules (`A1-A3`, `A4`, `A5`, `B1`, `B2`, `B3`, `B4`, `B5`, `B6`, `B7`, `C1`, `C2`, `C3`, `C4`, `C1-C4`) + `Module D` (Beyond System Boundary, displayed separately).


---

## File Sealing & Cryptographic Provenance

EcoMetric provides end-to-end cryptographic integrity and origin attestation for all exported Environmental Product Declarations (PDF, ILCD+EPD JSON, and openEPD v2.0 JSON).

### 1. Cryptographic Architecture

| Guarantee | Mechanism | What it proves |
|---|---|---|
| **Authenticity and integrity** | Ed25519 digital signature over canonical manifest, plus database registry entry | The file was produced by EcoMetric, for the registered organization, at the recorded UTC timestamp, and has not been altered by even one byte. |
| **Confidentiality** | AES-256-GCM envelope encryption container (`.ecmx`) | A random 256-bit data encryption key (DEK) encrypts the document; the DEK is wrapped using an AES Key Encryption Key (KEK). |

### 2. Export Modes

* **Sealed Container (`<filename>.<ext>.ecmx`)**: Encrypted using AES-256-GCM with associated authenticated data (AAD) binding header metadata. Can only be decrypted within the authenticated EcoMetric console.
* **Signed Open Document**: The standard PDF or JSON file with an embedded certificate identifier (`ECM-XXXX-XXXX-XXXX-XXXX`). Opens in any standard viewer (Adobe Acrobat, browser, JSON parser) while remaining fully verifiable against the public registry.

### 3. Public Verification

Anyone can verify an exported EPD without logging in:
* **Web UI**: Navigate to `/verify` (e.g., `https://app.ecometric.io/verify`). Upload the file or enter the Certificate ID.
* **API Endpoints**:
  * `POST /api/verify`: Upload file (multipart, max 64MB) to check SHA-256 checksum against registered declarations.
  * `GET /api/verify/{certificate_id}`: Query declaration status (`authentic`, `modified`, `revoked`, or `superseded`).
  * `GET /.well-known/ecometric-seal-keys.json`: Download public Ed25519 keys for independent third-party verification without connecting to EcoMetric.

### 4. Downstream Schema Note (`_ecometric_seal`)

Signed open JSON exports (ILCD and openEPD) contain a non-intrusive top-level seal object:
```json
{
  "_ecometric_seal": {
    "certificate_id": "ECM-7K3Q-9XPD-2M4T-H8VN",
    "verify_url": "https://app.ecometric.io/verify?c=ECM-7K3Q-9XPD-2M4T-H8VN"
  }
}
```
Downstream consumers and automated ingestion pipelines should ignore keys prefixed with `_` or specifically ignore `_ecometric_seal`.

### 5. Key Rotation Procedure

Keys are referenced by unique identifiers (`key_id`), allowing key rotation without invalidating existing declarations:
1. Generate a new Ed25519 keypair:
   ```bash
   python backend/scripts/seal_key_rotate.py --generate-signing k2
   ```
2. Update environment variables in production:
   ```bash
   SEAL_SIGNING_KEY_k2=<new_private_key_base64>
   SEAL_ACTIVE_SIGNING_KEY_ID=k2
   ```
3. Retire the previous key once transitioned:
   ```bash
   python backend/scripts/seal_key_rotate.py --retire k1
   ```
Retired keys remain published in `/.well-known/ecometric-seal-keys.json` so existing documents remain verifiable.

### 6. Contributor Privacy Settings

Organization Administrators can configure whether individual engineer names are included in public verification metadata under **Organization Settings → Public Contributor Privacy**. The organization name is always displayed.

### 7. What the Seal Proves (and What it Does Not)

* **Proves**: File integrity, publishing organization identity, software engine version, LCI database version, and issuance timestamp.
* **Does Not Prove**: The physical accuracy of raw supplier BOM measurements before they were uploaded to EcoMetric.
