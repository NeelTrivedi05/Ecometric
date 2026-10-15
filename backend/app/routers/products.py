from fastapi import APIRouter, HTTPException

from app.engines.material_matcher import database_available
from app.products import PRODUCTS, list_products, project_info_defaults

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("")
def get_products():
    """Product categories the studio supports, with their PCR, functional unit and defaults."""
    return {"products": list_products(), "ecoinvent_database_available": database_available()}


@router.get("/{product_id}")
def get_product_profile(product_id: str):
    if product_id not in PRODUCTS:
        raise HTTPException(status_code=404, detail=f"Unknown product '{product_id}'")
    summary = next(p for p in list_products() if p["id"] == product_id)
    return {**summary, "project_info_defaults": project_info_defaults(product_id)}
