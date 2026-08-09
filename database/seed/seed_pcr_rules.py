import json
import os
import sys

# Add backend to path for SQLAlchemy models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from app.database import engine, SessionLocal, Base
from app.models import Project, TechnicalData

def seed_database_pcr_defaults():
    print("🌱 Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = db.query(Project).filter(Project.name == "Demo Trane CVHE 500RT Chiller").first()
        if not existing:
            project = Project(
                name="Demo Trane CVHE 500RT Chiller",
                product_category="water_cooled_chiller",
                pcr_ref="UL 10010-4 Part B v2.0 2018",
                status="CALCULATED"
            )
            db.add(project)
            db.commit()
            db.refresh(project)

            tech = TechnicalData(
                project_id=project.id,
                chilling_capacity_rt=500.0,
                chilling_capacity_kw=1758.4,
                refrigerant_type="R134a",
                refrigerant_charge_kg=45.0,
                mass_delivered_kg=3470.0,
                conversion_factor_kg_per_ton=6.94
            )
            db.add(tech)
            db.commit()
            print(f"✅ Created Default Demo Project ID: {project.id}")
        else:
            print("ℹ️ Default Demo Project already seeded.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database_pcr_defaults()
