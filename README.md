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