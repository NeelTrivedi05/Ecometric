"""
backend/app/api/epd.py
======================
Module re-exporting EPD calculation, LCIA search, and verification endpoints
from app.routers.epd to support both router and api namespace patterns.
"""

from app.routers.epd import (
    router,
    create_epd_project,
    calculate_epd,
    calculate_anti_endpoint,
    search_lcia_indicators_endpoint,
    get_lcia_methodologies_endpoint,
    generate_nsf_document_endpoint,
)

__all__ = [
    "router",
    "create_epd_project",
    "calculate_epd",
    "calculate_anti_endpoint",
    "search_lcia_indicators_endpoint",
    "get_lcia_methodologies_endpoint",
    "generate_nsf_document_endpoint",
]
