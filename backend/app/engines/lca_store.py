"""Backend-only access to the Supabase ecoinvent reference store.

The browser never receives the database credentials or direct access to these
tables.  Only metadata is cached; impact_values JSONB is fetched in bounded
row batches for the providers used by a calculation.
"""

import os
import re
import threading
import time
from typing import Any, Dict, Iterable, List, Optional, Tuple

import pandas as pd


class ReferenceStoreError(RuntimeError):
    """Base error for an unavailable or inconsistent reference store."""


class ReferenceStoreUnavailable(ReferenceStoreError):
    """Supabase is not configured or cannot be queried."""


class ProviderNotFound(ReferenceStoreError):
    """A requested ecoinvent row does not exist."""


class IndicatorNotFound(ReferenceStoreError):
    """A requested LCIA indicator does not exist."""


_lock = threading.Lock()
_activities: Optional[pd.DataFrame] = None
_indicators: Optional[List[Tuple[str, str, str, str, str]]] = None
_loaded_at = 0.0
_failed_at = 0.0
_last_error: Optional[str] = None
_last_success_at: Optional[float] = None


def _ttl() -> float:
    return max(1.0, float(os.getenv("SUPABASE_REFERENCE_CACHE_TTL_SECONDS", "300")))


def configured() -> bool:
    return bool(os.getenv("SUPABASE_DB_URL"))


def _connect():
    if not configured():
        raise ReferenceStoreUnavailable(
            "Supabase reference store is not configured; set SUPABASE_DB_URL on the backend"
        )
    import psycopg
    return psycopg.connect(os.environ["SUPABASE_DB_URL"], connect_timeout=10)


def invalidate_cache() -> None:
    global _activities, _indicators, _loaded_at
    with _lock:
        _activities = None
        _indicators = None
        _loaded_at = 0.0


def _load() -> None:
    global _activities, _indicators, _failed_at, _last_error, _loaded_at, _last_success_at
    try:
        with _connect() as conn:
            rows = conn.execute(
                "SELECT row_index, activity_name, geography, reference_product_name, "
                "reference_product_unit FROM public.lca_activities "
                "WHERE row_index IS NOT NULL ORDER BY row_index"
            ).fetchall()
            indicators = conn.execute(
                "SELECT indicator_code, method, category, indicator, unit "
                "FROM public.impact_indicators ORDER BY excel_column_number"
            ).fetchall()
    except Exception as exc:
        _failed_at = time.monotonic()
        _last_error = f"{type(exc).__name__}: {exc}"
        raise ReferenceStoreUnavailable(
            "Supabase reference store query failed; verify SUPABASE_DB_URL and the "
            "lca_activities/impact_indicators schema"
        ) from exc
    meta = pd.DataFrame(
        rows, columns=["row", "activity", "geo", "product", "unit"]
    ).set_index("row").sort_index()
    if meta.empty or not indicators:
        raise ReferenceStoreUnavailable(
            "Supabase reference store is reachable but contains no activities or indicators"
        )
    meta = meta.fillna("").astype(str)
    meta["activity_l"] = meta["activity"].str.lower()
    meta["product_l"] = meta["product"].str.lower()
    _activities, _indicators = meta, indicators
    _loaded_at = time.monotonic()
    _last_success_at = time.time()
    _last_error = None


def activities() -> pd.DataFrame:
    if _activities is None or time.monotonic() - _loaded_at >= _ttl():
        with _lock:
            if _activities is None or time.monotonic() - _loaded_at >= _ttl():
                _load()
    return _activities


def require_available() -> None:
    activities()


def status() -> Dict[str, Any]:
    try:
        table = activities()
        return {
            "state": "connected",
            "available": True,
            "activity_count": int(len(table)),
            "indicator_count": len(_indicators or []),
            "schema_error": None,
            "last_error": None,
            "last_successful_refresh": _last_success_at,
            "cache_ttl_seconds": _ttl(),
        }
    except ReferenceStoreError as exc:
        return {
            "state": "not_configured" if not configured() else "unavailable",
            "available": False,
            "activity_count": 0,
            "indicator_count": 0,
            "schema_error": _last_error,
            "last_error": str(exc),
            "last_successful_refresh": _last_success_at,
            "cache_ttl_seconds": _ttl(),
        }


def indicators() -> List[Tuple[str, str, str, str, str]]:
    activities()
    return list(_indicators or [])


def search(query: str, unit: Optional[str] = None, geography: Optional[str] = None,
           limit: int = 50) -> List[Dict[str, Any]]:
    table = activities()
    terms = [t for t in re.sub(r"[^a-z0-9 ]", " ", query.lower()).split() if len(t) > 1]
    hits = table
    for term in terms:
        hits = hits[
            hits["activity_l"].str.contains(term, regex=False)
            | hits["product_l"].str.contains(term, regex=False)
        ]
    if unit:
        exact = hits[hits["unit"].str.lower() == unit.lower()]
        if not exact.empty:
            hits = exact
    if geography:
        exact = hits[hits["geo"].str.upper() == geography.upper()]
        if not exact.empty:
            hits = pd.concat([exact, hits.drop(exact.index)]).drop_duplicates()
    return [
        {
            "row_index": int(idx),
            "activity_name": row["activity"],
            "reference_product_name": row["product"],
            "geography": row["geo"],
            "reference_unit": row["unit"],
        }
        for idx, row in hits.head(max(1, min(limit, 200))).iterrows()
    ]


def impact_values(rows: Iterable[int], codes: List[str]) -> Dict[int, Dict[str, float]]:
    row_ids = sorted({int(row) for row in rows})
    if not row_ids:
        return {}
    if not codes:
        raise IndicatorNotFound("No LCIA indicator codes were selected")
    known = {row[0] for row in indicators()}
    missing = sorted(set(codes) - known)
    if missing:
        raise IndicatorNotFound(f"LCIA indicators not found in Supabase: {', '.join(missing)}")
    try:
        with _connect() as conn:
            result = conn.execute(
                "SELECT row_index, impact_values FROM public.lca_activities "
                "WHERE row_index = ANY(%s) AND row_index IS NOT NULL",
                (row_ids,),
            ).fetchall()
    except Exception as exc:
        raise ReferenceStoreUnavailable("Supabase impact_values query failed") from exc
    values = {int(row): (payload or {}) for row, payload in result}
    missing_rows = [str(row) for row in row_ids if row not in values]
    if missing_rows:
        raise ProviderNotFound(f"ecoinvent rows not found in Supabase: {', '.join(missing_rows)}")
    return {row: {code: values[row][code] for code in codes if code in values[row]} for row in row_ids}


def provider_row(provider_id: str) -> int:
    match = re.fullmatch(r"ecoinvent_row_(\d+)", str(provider_id or ""))
    if not match:
        raise ProviderNotFound(f"Invalid ecoinvent provider id: {provider_id}")
    row = int(match.group(1))
    if row not in activities().index:
        raise ProviderNotFound(f"ecoinvent provider is missing from Supabase: {provider_id}")
    return row
