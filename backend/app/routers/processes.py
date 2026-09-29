import sys
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import get_db
from app.models import EcoinventDatabase, ProcessNode, ProcessEntanglementEdge, PcrGpiIndicatorRule
from app.engines.process_chain_engine import ProcessChainEngine
from app.engines.pcr_rules_engine import PcrRulesEngine

router = APIRouter(prefix="/api", tags=["Lineage & Process Entanglement"])


# =========================================================================
# Pydantic Schemas for Process Chain API
# =========================================================================

class EntanglementResolveRequest(BaseModel):
    root_process_id: str = "proc-steel-converter-parent"
    methodology: str = "traci21"
    base_quantity: float = 1.0
    max_depth: int = 5
    overrides: Optional[Dict[str, Dict[str, float]]] = None


class BomEntanglementRequest(BaseModel):
    bom: List[Dict[str, Any]]
    methodology: str = "traci21"


class CustomProcessNodeRequest(BaseModel):
    id: Optional[str] = None
    activity_name: str
    reference_product: str
    geography: str = "GLO"
    unit: str = "kg"
    system_boundaries: str = "cradle-to-gate"
    sector: Optional[str] = "custom"
    tier_level: int = 2
    database_id: Optional[str] = "ecoinvent-3.12-cutoff"


class CustomEdgeRequest(BaseModel):
    parent_process_id: str
    child_process_id: str
    scaling_factor: float = 1.0
    relationship_type: str = "upstream_manufacturing"
    allocation_factor: float = 1.0
    loss_rate: float = 0.0
    tier_level: int = 1


class PcrEvaluateRequest(BaseModel):
    rule_id: str = "rule-ul10010-4-traci"
    results: Dict[str, Any] = Field(default_factory=dict)
    bom: Optional[List[Dict[str, Any]]] = None


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


@router.post("/pcr/evaluate")
def evaluate_pcr_compliance(
    payload: PcrEvaluateRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates calculation results and BOM against specified PCR/GPI standard.
    Checks mandatory indicators, optional coverage, and 1% mass cut-off criteria.
    """
    engine = PcrRulesEngine(db)
    try:
        report = engine.evaluate_compliance(
            rule_id=payload.rule_id,
            results_payload=payload.results,
            bom_items=payload.bom
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PCR evaluation failed: {str(e)}")


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


@router.post("/processes/entanglement/resolve")
def resolve_custom_entanglement(
    payload: EntanglementResolveRequest,
    db: Session = Depends(get_db)
):
    """
    Dynamic DAG simulation endpoint.
    Accepts custom user parameter overrides (e.g., modified scaling factor, loss rate, or allocation)
    and re-runs recursive N-tier resolution, cycle detection, and mass/energy conservation audits.
    """
    engine = ProcessChainEngine(db)
    try:
        graph = engine.resolve_process_entanglement(
            root_process_id=payload.root_process_id,
            methodology=payload.methodology,
            base_quantity=payload.base_quantity,
            max_depth=payload.max_depth,
            overrides=payload.overrides
        )
        return graph
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resolution simulation failed: {str(e)}")


@router.post("/processes/entanglement/resolve-bom")
def resolve_bom_entanglement(
    payload: BomEntanglementRequest,
    db: Session = Depends(get_db)
):
    """
    Batch-resolves an entire Bill of Materials (BOM) through the multi-tier entanglement engine.
    """
    engine = ProcessChainEngine(db)
    try:
        res = engine.resolve_bom_entanglement(
            bom_items=payload.bom,
            methodology=payload.methodology
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BOM resolution failed: {str(e)}")


@router.post("/processes/nodes/custom", status_code=status.HTTP_201_CREATED)
def create_custom_process_node(
    payload: CustomProcessNodeRequest,
    db: Session = Depends(get_db)
):
    """
    Creates a user-defined process inventory node.
    """
    node_id = payload.id or f"proc-custom-{uuid.uuid4().hex[:8]}"
    existing = db.query(ProcessNode).filter_by(id=node_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Node '{node_id}' already exists.")

    new_node = ProcessNode(
        id=node_id,
        database_id=payload.database_id,
        activity_name=payload.activity_name,
        reference_product=payload.reference_product,
        geography=payload.geography,
        unit=payload.unit,
        system_boundaries=payload.system_boundaries,
        sector=payload.sector,
        tier_level=payload.tier_level
    )
    db.add(new_node)
    db.commit()
    db.refresh(new_node)
    return {"id": new_node.id, "name": new_node.activity_name, "status": "CREATED"}


@router.post("/processes/edges", status_code=status.HTTP_201_CREATED)
def create_entanglement_edge(
    payload: CustomEdgeRequest,
    db: Session = Depends(get_db)
):
    """
    Creates a supply chain entanglement link between parent and child processes.
    """
    parent = db.query(ProcessNode).filter_by(id=payload.parent_process_id).first()
    child = db.query(ProcessNode).filter_by(id=payload.child_process_id).first()
    if not parent or not child:
        raise HTTPException(status_code=404, detail="Parent or child process node not found.")

    edge_id = f"edge-{uuid.uuid4().hex[:12]}"
    new_edge = ProcessEntanglementEdge(
        id=edge_id,
        parent_process_id=payload.parent_process_id,
        child_process_id=payload.child_process_id,
        scaling_factor=payload.scaling_factor,
        relationship_type=payload.relationship_type,
        allocation_factor=payload.allocation_factor,
        loss_rate=payload.loss_rate,
        tier_level=payload.tier_level
    )
    db.add(new_edge)
    db.commit()
    db.refresh(new_edge)
    return {"id": new_edge.id, "status": "CONNECTED"}
