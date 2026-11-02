# EcoMetric

**[Live Demo →](https://ecometric-in.vercel.app/)**

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_+_Auth-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Ecoinvent](https://img.shields.io/badge/LCIA-Ecoinvent_v3.12-2E7D32?style=flat-square)](https://ecoinvent.org/)

EcoMetric is a multi-tenant environmental product declaration (EPD) and life-cycle assessment (LCA) platform for HVAC equipment. It turns product documents and bills of materials into traceable LCA calculations, validation results, EPD reports, and verifiable exports.

The application supports the EPD workflow for water-cooled chillers and related HVAC products, including:

- Project and workspace management
- Document and BOM ingestion
- Material, logistics, manufacturing, use, and end-of-life data
- Ecoinvent-based provider matching
- PCR validation and data-quality review
- LCIA calculations and module results
- EPD PDF, ILCD, and openEPD exports
- Cryptographic sealing and public declaration verification

## Architecture

```text
frontend/        React 18 + Vite single-page application
backend/         Python 3.12 + FastAPI API and calculation services
supabase/        PostgreSQL schema, RLS policies, auth, storage, and tenant data
database/        Local/SQLAlchemy schema, migrations, and reference database assets
backend/data/    PCR rules, emission factors, LCIA indexes, and sample datasets
results/         Generated calculation and report artifacts
```

### Frontend

The frontend is a React/Vite application, not Next.js. It provides:

- Email/password authentication through Supabase Auth
- Organization/workspace-aware navigation
- A projects console and guided Studio workspace
- Upload, extraction, review, validation, methodology, results, audit, and export phases
- Workspace-scoped project persistence and realtime project updates
- Inline project-name editing from the Studio top bar

Project names are saved to the tenant's `projects` row and are reflected in the project console, Studio header, product name used by the EPD flow, and other open clients subscribed to the workspace.

### Backend

The FastAPI service provides:

- LCA calculation and validation endpoints
- Document extraction and provider matching
- EPD report preview and PDF generation
- ILCD/openEPD serialization
- Submission and report APIs
- Cryptographic seal creation and public verification

The backend uses SQLAlchemy models for the local application database and Supabase-compatible tenant fields for organization-scoped data.

### Supabase and tenancy

Supabase provides authentication, PostgreSQL, row-level security, storage, and realtime events. Workspace data is identified by `organization_id`. Client-side queries and realtime subscriptions must be scoped to the active organization; private storage objects use an organization-prefixed path.

The current schema includes organizations, organization members, invitations, projects, technical data, results, reports, report details, and facility LCI assemblies. New user-data tables must follow the same tenant-scoping and RLS conventions.

## Local development

### Prerequisites

- Node.js and npm
- Python 3.12
- A Supabase project for authenticated frontend features
- SQLite for the default local backend database

### Configure the frontend

Create `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_API_URL=http://localhost:8000/api
```

Only public Supabase values belong in frontend environment variables. Never expose a service-role key, database password, JWT secret, or Stripe secret to Vite.

### Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

The Vite development server runs at [http://localhost:5173](http://localhost:5173).

Build the production bundle:

```powershell
cd frontend
npm run build
```

### Run the backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

The API runs at [http://localhost:8000](http://localhost:8000). OpenAPI documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

The backend can also be started with Uvicorn:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Apply the Supabase schema

Run `supabase/schema.sql` in the Supabase SQL editor or through the Supabase CLI. Review migrations and RLS policies before applying schema changes to a shared environment.

## Main application flow

1. Sign up or sign in with Supabase Auth.
2. Select or load the active organization workspace.
3. Open the Projects console.
4. Create or open an LCA project.
5. Upload source documents or load a supported sample.
6. Review extracted product, BOM, logistics, manufacturing, use, and end-of-life data.
7. Match providers and resolve PCR/data-quality gaps.
8. Run validation and choose an LCIA methodology.
9. Run the calculation and inspect module-level results.
10. Review the audit trail and export the EPD package.
11. Verify signed declarations through the public verification page.

## Supported EPD and LCA capabilities

EcoMetric includes support for:

- Product-specific PCR profiles
- Ecoinvent 3.12 LCIA and activity data
- Modules A1-A3, A4, A5, B1-B7, C1-C4, and Module D
- TRACI 2.1, EN 15804+A2, and other configured methodologies
- BOM and stage-level provider matching
- Data-quality reporting and traceability
- PDF report generation with charts and narrative sections
- ILCD and openEPD JSON exports

Reference datasets are stored under [`backend/data/`](backend/data/), while calculation and report artifacts are written to [`results/`](results/).

## API areas

The backend exposes route groups for:

- `/api/auth` - authentication-related backend operations
- `/api/epd` - project creation and calculation
- `/api/epd-reports` - report preview and PDF generation
- `/api/documents` - extraction and document processing
- `/api/products` - product profiles and defaults
- `/api/submissions` - authenticated project submissions
- `/api/seal` and `/api/verify` - sealing and public verification

Use `/docs` for the current endpoint contracts and request schemas.

## Cryptographic sealing and verification

EcoMetric can create signed open exports and encrypted sealed containers.

- Ed25519 signatures authenticate the manifest and protect integrity.
- AES-256-GCM sealed containers protect exported documents at rest.
- Signed exports include a certificate identifier and verification URL.
- The public verification page can validate declaration authenticity without exposing tenant data.

Public verification endpoints include:

```text
POST /api/verify
GET  /api/verify/{certificate_id}
GET  /.well-known/ecometric-seal-keys.json
```

The seal proves file integrity, issuing organization identity, software/database metadata, and issuance time. It does not prove the physical accuracy of measurements before they were uploaded.

## Deployment

The repository currently includes:

- [`render.yaml`](render.yaml) for a Docker-based FastAPI service and static Vite frontend on Render
- [`backend/Dockerfile`](backend/Dockerfile) for the API container
- [`vercel.json`](vercel.json) for frontend-compatible deployment configuration

Production secrets must be supplied by the deployment platform's secret manager. Keep Supabase service-role credentials, database URLs, signing keys, and backend secrets server-side.

The account/workspace brief also defines a future Google Cloud deployment with separate frontend and backend Cloud Run services. That migration is not complete in the current repository; do not treat Cloud Run or Stripe billing as implemented until their infrastructure, webhook processing, quota functions, and tests are present.

## Account, billing, and quota roadmap

The workspace model is the foundation for the planned SaaS billing model:

- One organization represents one customer workspace.
- The organization, not an individual user, will own billing.
- Workspace slugs are intended to identify account-scoped URLs.
- All user data must remain organization-scoped and protected by RLS.

Stripe subscription plans, server-side EPD quota reservation, webhook synchronization, and the Settings billing experience are planned work. When implemented, quota enforcement must be atomic and server-side; frontend usage meters must remain advisory and must never be the security boundary.

## Development conventions

- Read [`DESIGN.md`](DESIGN.md) before changing UI.
- Keep tenant filters on every organization-owned read, write, and realtime subscription.
- Use explicit error handling; do not silently fall back to another tenant or project.
- Preserve the existing calculation/report data contracts.
- Add or update tests for backend behavior and tenant isolation.
- Do not commit credentials, private keys, generated secrets, or production database URLs.

## License and data

EcoMetric uses project-specific reference datasets and rules. Confirm the applicable license and redistribution terms before publishing or distributing any bundled dataset outside the project.
