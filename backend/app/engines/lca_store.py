"""ecoinvent v3.12 Cut-off Cumulative LCIA data, read from the files in backend/database.

Files:
  lca_activities_*.parquet   one row per activity / product, split in two to stay under
                             GitHub's file size limit. `row` is the row's position in the
                             workbook's LCIA sheet, so provider ids stay "ecoinvent_row_<n>"
  impact_indicators.json     [indicator_code, method, category, indicator, unit] of each
                             impact column (col_007 ...)

Activity metadata is loaded once into memory; impact values are read per calculation,
only for the rows and indicators it uses.
"""

import json
import re
import threading
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import pandas as pd

DATABASE_DIR = Path(__file__).resolve().parents[2] / "database"
INDICATORS_PATH = DATABASE_DIR / "impact_indicators.json"


class ReferenceStoreError(RuntimeError):
    """Base error for an unavailable or inconsistent reference store."""


class ReferenceStoreUnavailable(ReferenceStoreError):
    """The ecoinvent data files are missing or unreadable."""


class ProviderNotFound(ReferenceStoreError):
    """A requested ecoinvent row does not exist."""


class IndicatorNotFound(ReferenceStoreError):
    """A requested LCIA indicator does not exist."""


_lock = threading.Lock()
_activities: Optional[pd.DataFrame] = None
_indicators: Optional[List[Tuple[str, str, str, str, str]]] = None
_last_error: Optional[str] = None
_last_success_at: Optional[float] = None


def _activity_files() -> List[Path]:
    return sorted(DATABASE_DIR.glob("lca_activities_*.parquet"))


def configured() -> bool:
    return bool(_activity_files()) and INDICATORS_PATH.exists()


def invalidate_cache() -> None:
    global _activities, _indicators
    with _lock:
        _activities = None
        _indicators = None


def _load() -> None:
    global _activities, _indicators, _last_error, _last_success_at
    if not configured():
        raise ReferenceStoreUnavailable(
            f"ecoinvent data files are missing from {DATABASE_DIR} "
            "(lca_activities_*.parquet and impact_indicators.json)"
        )
    try:
        meta = pd.concat(
            pd.read_parquet(path, columns=["row", "activity", "geo", "product", "unit"])
            for path in _activity_files()
        )
        indicators = [tuple(i) for i in json.loads(INDICATORS_PATH.read_text(encoding="utf-8"))]
    except Exception as exc:
        _last_error = f"{type(exc).__name__}: {exc}"
        raise ReferenceStoreUnavailable(f"Could not read ecoinvent data files in {DATABASE_DIR}") from exc
    meta = meta.set_index("row").sort_index()
    if meta.empty or not indicators:
        raise ReferenceStoreUnavailable("ecoinvent data files contain no activities or indicators")
    meta = meta.fillna("").astype(str)
    meta["activity_l"] = meta["activity"].str.lower()
    meta["product_l"] = meta["product"].str.lower()
    _activities, _indicators = meta, indicators
    _last_success_at = time.time()
    _last_error = None


def activities() -> pd.DataFrame:
    if _activities is None:
        with _lock:
            if _activities is None:
                _load()
    return _activities


def require_available() -> None:
    activities()


def status() -> Dict[str, Any]:
    try:
        table = activities()
        return {
            "state": "loaded",
            "available": True,
            "activity_count": int(len(table)),
            "indicator_count": len(_indicators or []),
            "schema_error": None,
            "last_error": None,
            "last_successful_refresh": _last_success_at,
        }
    except ReferenceStoreError as exc:
        return {
            "state": "files_missing" if not configured() else "unavailable",
            "available": False,
            "activity_count": 0,
            "indicator_count": 0,
            "schema_error": _last_error,
            "last_error": str(exc),
            "last_successful_refresh": _last_success_at,
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
        raise IndicatorNotFound(f"LCIA indicators not found in the ecoinvent data files: {', '.join(missing)}")
    values: Dict[int, Dict[str, float]] = {}
    try:
        for path in _activity_files():
            df = pd.read_parquet(path, columns=["row", *codes], filters=[("row", "in", row_ids)])
            for record in df.to_dict("records"):
                row = int(record.pop("row"))
                values[row] = {code: float(v) for code, v in record.items() if pd.notna(v)}
    except Exception as exc:
        raise ReferenceStoreUnavailable("Could not read impact values from the ecoinvent data files") from exc
    missing_rows = [str(row) for row in row_ids if row not in values]
    if missing_rows:
        raise ProviderNotFound(f"ecoinvent rows not found in the data files: {', '.join(missing_rows)}")
    return values


def provider_row(provider_id: str) -> int:
    match = re.fullmatch(r"ecoinvent_row_(\d+)", str(provider_id or ""))
    if not match:
        raise ProviderNotFound(f"Invalid ecoinvent provider id: {provider_id}")
    row = int(match.group(1))
    if row not in activities().index:
        raise ProviderNotFound(f"ecoinvent provider is missing from the data files: {provider_id}")
    return row
