from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

try:
    import email_validator
    from pydantic import EmailStr
except ImportError:
    EmailStr = str

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "engineer"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ProjectCreate(BaseModel):
    name: str = "Trane CVHE 500RT Centrifugal Chiller EPD"
    chilling_capacity_rt: float = 500.0
    refrigerant_type: str = "R134a"
    refrigerant_charge_kg: float = 45.0
    mass_delivered_kg: float = 3470.0

class LcaCalculationInput(BaseModel):
    project_id: Optional[str] = None
    target_cities: List[str] = ["Chicago", "Houston", "Frankfurt", "Dubai"]
    efficiency_kw_per_ton: float = 0.54
    product_lifespan_years: int = 25
    mass_steel_kg: float = 2100.0
    mass_copper_kg: float = 650.0
    mass_motor_kg: float = 450.0
    mass_insulation_kg: float = 150.0
    mass_electronics_kg: float = 120.0

class ModuleResult(BaseModel):
    gwp_kg_co2e: float
    methodology: str = "TRACI 2.1"
    is_excluded_from_total: bool = False

class LcaSummaryResponse(BaseModel):
    total_gwp_kg_co2e: float
    b6_gwp_kg_co2e: float
    b6_dominance_ratio: float
    directional_badge: str = "Directional / Comparative EPD"
    by_module: Dict[str, ModuleResult]

class ReportResponse(BaseModel):
    success: bool
    pdf_url: str
    download_file_name: str
    disclaimer: str
