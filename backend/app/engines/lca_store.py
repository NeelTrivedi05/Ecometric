"""
ecoinvent v3.12 Cut-off Cumulative LCIA data, read from Supabase Postgres.

Tables (supabase/migrations/005_lca_reference_data.sql, filled by
scripts/upload_lca_data.py):
  lca_activities     one row per activity / product. row_index is the row's position
                     in the workbook's LCIA sheet, so provider ids stay "ecoinvent_row_<n>"
  impact_indicators  method / category / indicator / unit of each impact column

Dataset search runs in memory on the activity names (loaded once, ~3 MB); impact values
are fetched per calculation, only for the rows and indicators it uses.

Connection: SUPABASE_DB_URL (Session pooler URI, backend only - never the frontend).
"""

import os
import threading
import time
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from typing import Dict, Iterable, List, Optional, Tuple

import pandas as pd

RETRY_AFTER_S = 60       # after a failed load, don't retry (and wait on timeouts) on every call

_lock = threading.Lock()
_activities: Optional[pd.DataFrame] = None
_indicators: Optional[List[Tuple[str, str, str, str, str]]] = None
_failed_at = 0.0
_last_error: Optional[str] = None


def configured() -> bool:
    return bool(os.getenv("SUPABASE_DB_URL", "").strip())


def _connect():
    import psycopg
    raw_url = os.environ["SUPABASE_DB_URL"].strip()
    parsed = urlsplit(raw_url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query.setdefault("sslmode", "require")
    connection_url = urlunsplit((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        urlencode(query),
        parsed.fragment,
    ))
    return psycopg.connect(connection_url, connect_timeout=10)


def _load():
    global _activities, _indicators, _failed_at, _last_error
    try:
        with _connect() as conn:
            rows = conn.execute(
                "SELECT row_index, activity_name, geography, reference_product_name, reference_product_unit "
                "FROM lca_activities WHERE row_index IS NOT NULL"
            ).fetchall()
            indicators = conn.execute(
                "SELECT indicator_code, method, category, indicator, unit "
                "FROM impact_indicators ORDER BY excel_column_number"
            ).fetchall()
    except Exception as e:
        _failed_at = time.monotonic()
        _last_error = type(e).__name__
        print(f"[lca_store] Could not load ecoinvent data from Supabase: {e}")
        return
    if not rows or not indicators:
        _failed_at = time.monotonic()
        print("[lca_store] Supabase reference tables are empty")
        return

    meta = pd.DataFrame(rows, columns=["row", "activity", "geo", "product", "unit"]).set_index("row").sort_index()
    meta = meta.astype(str)
    meta["activity_l"] = meta["activity"].str.lower()
    meta["product_l"] = meta["product"].str.lower()
    _indicators = indicators
    _activities = meta


def activities() -> Optional[pd.DataFrame]:
    """
    Activity metadata indexed by ecoinvent row (columns activity, geo, product, unit and
    lower-cased activity_l / product_l), or None when Supabase is not configured / reachable.
    """
    if _activities is None and configured() and time.monotonic() - _failed_at > RETRY_AFTER_S:
        with _lock:
            if _activities is None:
                _load()
    return _activities


def status() -> Dict[str, Optional[str]]:
    """Why the data is or isn't available, for diagnosing deployments (never includes the URL)."""
    if activities() is not None:
        return {"state": "connected", "error": None}
    if not configured():
        return {"state": "not_configured", "error": None}
    return {"state": "connection_failed", "error": _last_error}


def indicators() -> List[Tuple[str, str, str, str, str]]:
    """(indicator_code, method, category, indicator, unit) for every impact column, in workbook order."""
    activities()
    return _indicators or []


def impact_values(rows: Iterable[int], codes: List[str]) -> Dict[int, Dict[str, float]]:
    """{row: {indicator_code: value}} for the given ecoinvent rows, limited to `codes` - one query."""
    rows = sorted({int(r) for r in rows})
    if not rows or not codes:
        return {}
    with _connect() as conn:
        result = conn.execute(
            "SELECT row_index, (SELECT jsonb_object_agg(k, impact_values -> k) "
            "                   FROM unnest(%s::text[]) AS k WHERE impact_values ? k) "
            "FROM lca_activities WHERE row_index = ANY(%s)",
            (codes, rows),
        ).fetchall()
    return {row: values or {} for row, values in result}
