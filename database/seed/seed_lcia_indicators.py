"""
seed_lcia_indicators.py
========================
Seeds all ~633 LCIA indicators from backend/data/lcia_search_index.json
into the database lcia_indicators table.
"""

import json
import os
import sys
from pathlib import Path

# Add backend to sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(REPO_ROOT / "backend"))

from app.database import engine, SessionLocal, Base
from app.models import LCIAIndicator

INDEX_FILE = REPO_ROOT / "backend" / "data" / "lcia_search_index.json"

def seed_lcia_indicators():
    print("[INIT] Ensuring LCIA Database Tables exist...")
    Base.metadata.create_all(bind=engine)

    if not INDEX_FILE.exists():
        print(f"[ERROR] Index file not found at {INDEX_FILE}. Run build_lcia_search_index.py first.")
        return

    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    indicators_data = data.get("indicators", [])
    print(f"Found {len(indicators_data)} indicators in index file.")

    db = SessionLocal()
    try:
        existing_count = db.query(LCIAIndicator).count()
        if existing_count >= len(indicators_data):
            print(f"[INFO] Database already contains {existing_count} LCIA indicators. Skipping seed.")
            return

        print(f"Seeding {len(indicators_data)} indicators into lcia_indicators table...")
        batch = []
        for item in indicators_data:
            ind = LCIAIndicator(
                id=item["id"],
                methodology=item["methodology"],
                methodology_key=item["methodology_key"],
                category=item["category"],
                indicator=item["indicator"],
                unit=item["unit"],
                canonical_key=item["canonical_key"],
                is_no_lt=item.get("is_no_lt", False),
                is_pcr_mandatory=item.get("is_pcr_mandatory", False),
                acronyms=item.get("acronyms", []),
                synonyms=item.get("synonyms", []),
                search_tokens=" ".join(item.get("search_tokens", []))
            )
            batch.append(ind)

        # Merge or add all
        for ind in batch:
            db.merge(ind)
        db.commit()
        print(f"[OK] Successfully seeded {len(batch)} indicators into database.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding LCIA indicators: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_lcia_indicators()
