import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth_routes, epd, submissions, documents

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EcoMetric EPD & Life-Cycle Assessment API Engine",
    description="FastAPI Backend for HVAC Chiller EPD declarations compliant with UL 10010-4 Part B & ecoinvent v3.12",
    version="1.0.0"
)

# CORS setup
allowed_origins_str = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
)
origins = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_routes.router)
app.include_router(epd.router)
app.include_router(submissions.router)
app.include_router(documents.router)

@app.get("/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": "EcoMetric Backend Engine",
        "pcr_standard": "UL 10010-4 Part B v2.0 (2018)",
        "ecoinvent_version": "3.12"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
