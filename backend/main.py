import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import engine, Base, add_missing_columns
from app.routers import auth_routes, epd, epd_reports, submissions, documents, processes, products, invitations, verify as verify_router, seal_export

# Initialize DB tables
Base.metadata.create_all(bind=engine)
add_missing_columns()

# File Sealing: ensure seal tables exist (idempotent)
try:
    from app.seal.models import FileSeal, SealKey, SealVerificationLog  # noqa
    Base.metadata.create_all(bind=engine)
except Exception as _e:
    print(f"[Seal] Warning: could not initialise seal tables: {_e}")

app = FastAPI(
    title="EcoMetric EPD & Life-Cycle Assessment API Engine",
    description="FastAPI Backend for HVAC Chiller EPD declarations compliant with UL 10010-4 Part B & ecoinvent v3.12 (26,533 activities)",
    version="1.0.0"
)

# CORS setup
allowed_origins_str = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
)
origins = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]

PUBLIC_API_PREFIXES = (
    "/api/health",
    "/api/auth/",
    "/api/verify",
    "/api/lcia/",
    "/api/products",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
)


@app.middleware("http")
async def require_authenticated_api_requests(request: Request, call_next):
    if (
        request.method == "OPTIONS"
        or not request.url.path.startswith("/api/")
        or request.url.path.startswith(PUBLIC_API_PREFIXES)
    ):
        return await call_next(request)

    from app.auth import authenticate_token

    try:
        authenticate_token(request.headers.get("authorization"))
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return await call_next(request)

# Registered after the auth middleware so CORS is outermost and auth rejections
# (401/503) still carry CORS headers instead of surfacing as network errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https:\/\/.*(\.vercel\.app|\.onrender\.com)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_routes.router)
app.include_router(epd.router)
app.include_router(epd_reports.router)
app.include_router(submissions.router)
app.include_router(documents.router)
app.include_router(processes.router)
app.include_router(products.router)
app.include_router(invitations.router)
app.include_router(verify_router.router)
app.include_router(seal_export.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "EcoMetric Backend Engine",
        "docs": "/docs",
        "health": "/health",
        "pcr_standard": "UL 10010-4 Part B v2.0 (2018)",
        "ecoinvent_version": "3.12"
    }

@app.get("/health")
@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": "EcoMetric Backend Engine",
        "pcr_standard": "UL 10010-4 Part B v2.0 (2018)",
        "ecoinvent_version": "3.12"
    }

@app.post("/api/validate")
@app.post("/validate")
def validate_epd_endpoint(payload: dict = None):
    from app.engines.pcr_validation import validate_epd_compliance
    return validate_epd_compliance(payload or {})

@app.get("/api/lcia/search")
def search_lcia_root(
    q: str = "",
    methodology: str = None,
    category: str = None,
    mandatory_only: bool = False,
    include_no_lt: bool = False,
    limit: int = 50,
):
    from app.routers.epd import search_lcia_indicators_endpoint
    return search_lcia_indicators_endpoint(
        q=q,
        methodology=methodology,
        category=category,
        mandatory_only=mandatory_only,
        include_no_lt=include_no_lt,
        limit=limit,
    )

@app.get("/api/lcia/methodologies")
def get_lcia_methodologies_root():
    from app.routers.epd import get_lcia_methodologies_endpoint
    return get_lcia_methodologies_endpoint()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
