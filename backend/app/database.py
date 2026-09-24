import os
import re
from typing import Any, Dict, List, Optional
from sqlalchemy import create_engine, or_, and_, desc
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_FILE = REPO_ROOT / "ecometric.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_FILE.as_posix()}")

# SQLite specific connect args
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def search_lcia_indicators(
    query: str,
    methodology_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Optional[Session] = None
) -> List[Dict[str, Any]]:
    """
    High-performance LCIA search helper returning ranked indicators in < 20ms.
    Ranks:
    1. Exact prefix matches on indicator name or acronym (highest priority)
    2. Acronym & canonical synonym matches (e.g. 'GWP', 'CO2' -> Climate Change)
    3. Category substring matches
    4. Fuzzy / token matches across search_tokens
    """
    # Use in-memory engine search for ultra-fast <2ms query responses
    from app.engines.build_lcia_search_index import search_lcia_indicators as in_memory_search
    results = in_memory_search(
        query=query,
        methodology=methodology_filter,
        limit=limit + offset
    )
    return results[offset:offset + limit]
