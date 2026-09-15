import sys
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

# Ensure backend root is in sys.path so imports resolve cleanly in any IDE environment
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from app.database import get_db
    from app.models import Project, TechnicalData, Result, Report
    from app.schemas import ProjectCreate, LcaCalculationInput, LcaSummaryResponse, ReportResponse
    from app.engines.pcr_validation import validate_chiller_inputs
    from app.engines.calc_engine import calculate_chiller_lca, calculate_anti_lca
    from app.engines.report_gen import generate_epd_report
except ImportError:
    from ..database import get_db
    from ..models import Project, TechnicalData, Result, Report
    from ..schemas import ProjectCreate, LcaCalculationInput, LcaSummaryResponse, ReportResponse
    from ..engines.pcr_validation import validate_chiller_inputs
    from ..engines.calc_engine import calculate_chiller_lca, calculate_anti_lca
    from ..engines.report_gen import generate_epd_report

router = APIRouter(prefix="/api/epd", tags=["EPD"])

@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_epd_project(data: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        name=data.name,
        product_category="water_cooled_chiller",
        pcr_ref="UL 10010-4 Part B v2.0 2018",
        status="DRAFT"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    tech = TechnicalData(
        project_id=project.id,
        chilling_capacity_rt=data.chilling_capacity_rt,
        chilling_capacity_kw=data.chilling_capacity_rt * 3.51685,
        refrigerant_type=data.refrigerant_type,
        refrigerant_charge_kg=data.refrigerant_charge_kg,
        mass_delivered_kg=data.mass_delivered_kg
    )
    db.add(tech)
    db.commit()

    return {"project_id": project.id, "name": project.name, "status": project.status}

@router.post("/calculate", response_model=LcaSummaryResponse)
def calculate_epd(input_data: LcaCalculationInput, db: Session = Depends(get_db)):
    data_dict = input_data.model_dump() if hasattr(input_data, 'model_dump') else input_data.dict()
    
    # Validate via PCR engine
    validation = validate_chiller_inputs(data_dict)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail={"errors": validation["errors"]})

    # Delegate calculation to calc_engine
    calc_result = calculate_chiller_lca(data_dict)

    # Save results to DB if project_id exists
    if input_data.project_id:
        project = db.query(Project).filter(Project.id == input_data.project_id).first()
        if project:
            db.query(Result).filter(Result.project_id == project.id).delete()
            for mod_name, mod_data in calc_result["by_module"].items():
                db.add(Result(
                    project_id=project.id,
                    module=mod_name,
                    impact_category="GWP-total",
                    methodology=mod_data.get("methodology", "TRACI 2.1"),
                    value=mod_data["gwp_kg_co2e"]
                ))
            project.status = "CALCULATED"
            db.commit()

    return calc_result

@router.post("/report", response_model=ReportResponse)
def generate_report(project_id: str = "demo_project", db: Session = Depends(get_db)):
    project_name = "Chiller_EPD_Assessment"
    if project_id != "demo_project":
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project_name = project.name
            project.status = "REPORTED"

    # Delegate report generation to engine
    report_data = generate_epd_report(project_id, project_name)

    if project_id != "demo_project":
        db.add(Report(
            project_id=project_id,
            pdf_url=report_data["pdf_url"],
            version="1.0",
            disclaimer_text_snapshot=report_data["disclaimer"]
        ))
        db.commit()

    return report_data

@router.post("/calculate-anti")
def calculate_anti_endpoint(payload: Dict[str, Any] = Body(default_factory=dict)):
    """
    Calculates audited EN 15804+A2 lifecycle assessment indicators and compliance gates
    matching the Eco-anti Studio workspace specification.
    """
    return calculate_anti_lca(payload or {})

