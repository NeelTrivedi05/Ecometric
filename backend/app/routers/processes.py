import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import get_db
from app.models import EcoinventDatabase, ProcessNode, ProcessEntanglementEdge, PcrGpiIndicatorRule
from app.engines.process_chain_engine import ProcessChainEngine

router = APIRouter(prefix="/api", tags=["Lineage & Process Entanglement"])


# =========================================================================
# 1. Ecoinvent Database Lineage Endpoints
# =========================================================================

@router.get("/lineage/databases")
def get_ecoinvent_databases(db: Session = Depends(get_db)):
    """
    Returns all registered Ecoinvent database branches, models (cut-off, APOS, consequential),
    versions, file references, and SHA-256 integrity hashes.
    """
    databases = db.query(EcoinventDatabase).all()
    return {
        "total_databases": len(databases),
        "databases": [
            {
                "id": d.id,
                "version": d.version,
                "system_model": d.system_model,
                "branch_name": d.branch_name,
                "file_reference": d.file_reference,
                "file_hash": d.file_hash,
                "is_active": d.is_active,
                "created_at": d.created_at.isoformat() if d.created_at else None
            }
            for d in databases
        ]
    }


# =========================================================================
# 2. PCR & GPI Indicator Selection Rules
# =========================================================================

@router.get("/pcr/rules")
def get_pcr_indicator_rules(
    category: Optional[str] = None,
    methodology: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns all PCR & GPI indicator selection matrices (e.g. UL 10010-4 Part B, EN 15804+A2, GPI v4.0).
    """
    query = db.query(PcrGpiIndicatorRule)
    if category:
        query = query.filter(PcrGpiIndicatorRule.product_category == category)
    if methodology:
        query = query.filter(PcrGpiIndicatorRule.methodology.ilike(f"%{methodology}%"))
    rules = query.all()

    return {
        "total_rules": len(rules),
        "rules": [
            {
                "id": r.id,
                "rule_name": r.rule_name,
                "product_category": r.product_category,
                "methodology": r.methodology,
                "standard": r.standard,
                "required_indicators": r.required_indicators,
                "optional_indicators": r.optional_indicators,
                "cut_off_criteria": r.cut_off_criteria,
                "is_default": r.is_default
            }
            for r in rules
        ]
    }


@router.get("/pcr/rules/{rule_id}")
def get_pcr_indicator_rule(rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(PcrGpiIndicatorRule).filter_by(id=rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail=f"PCR Rule '{rule_id}' not found.")
    return {
        "id": rule.id,
        "rule_name": rule.rule_name,
        "product_category": rule.product_category,
        "methodology": rule.methodology,
        "standard": rule.standard,
        "required_indicators": rule.required_indicators,
        "optional_indicators": rule.optional_indicators,
        "cut_off_criteria": rule.cut_off_criteria,
        "is_default": rule.is_default
    }


# =========================================================================
# 3. Process Nodes & Entanglement Graph Endpoints
# =========================================================================

@router.get("/processes")
def list_processes(
    q: Optional[str] = None,
    sector: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lists process inventory nodes across supply chain tiers.
    """
    engine = ProcessChainEngine(db)
    results = engine.list_all_process_nodes(sector=sector, search=q)
    return {
        "total": len(results),
        "processes": results
    }


@router.get("/processes/{process_id}")
def get_process_details(process_id: str, db: Session = Depends(get_db)):
    engine = ProcessChainEngine(db)
    node = engine.get_process_node(process_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Process '{process_id}' not found.")
    return node


@router.get("/processes/{process_id}/entanglement")
def get_process_entanglement(
    process_id: str,
    methodology: str = Query("traci21", description="LCIA methodology: 'traci21' or 'ef31'"),
    quantity: float = Query(1.0, description="Base reference product quantity"),
    max_depth: int = Query(5, description="Max traversal depth in the supply chain DAG"),
    db: Session = Depends(get_db)
):
    """
    Resolves the full multi-tier entanglement supply chain graph for a given process node.
    Returns:
    - 1 root process linked to 10+ sub-processes
    - Upstream manufacturing vs downstream processing vs transport & energy breakdown
    - Cumulative scaling factors, allocation rates, and loss margins
    - Multi-indicator LCIA footprint aggregated across all chained supply chain tiers
    """
    engine = ProcessChainEngine(db)
    try:
        graph = engine.resolve_process_entanglement(
            root_process_id=process_id,
            methodology=methodology,
            base_quantity=quantity,
            max_depth=max_depth
        )
        return graph
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DAG Entanglement resolution failed: {str(e)}")
