"""
ecoinvent v3.12 Cut-off Cumulative LCIA data, read from the files in backend/database.

Files (written by scripts/build_lca_files.py from the workbook):
  lca_activities_*.parquet   one row per activity / product, split in two to stay under
                             GitHub's file size limit. `row` is the row's position in the
                             workbook's LCIA sheet, so provider ids stay "ecoinvent_row_<n>"
  impact_indicators.json     method / category / indicator / unit of each impact column

Dataset search runs in memory on the activity names (loaded once, ~3 MB); impact values
are read per calculation, only for the rows and indicators it uses.
"""

import json
import threading
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import pandas as pd

DATABASE_DIR = Path(__file__).resolve().parents[2] / "database"
INDICATORS_PATH = DATABASE_DIR / "impact_indicators.json"

_lock = threading.Lock()
_activities: Optional[pd.DataFrame] = None
_indicators: Optional[List[Tuple[str, str, str, str, str]]] = None
_load_attempted = False
_last_error: Optional[str] = None


def _activity_files() -> List[Path]:
    return sorted(DATABASE_DIR.glob("lca_activities_*.parquet"))


def configured() -> bool:
    return bool(_activity_files()) and INDICATORS_PATH.exists()


def _load():
    global _activities, _indicators, _last_error
    try:
        meta = pd.concat(
            pd.read_parquet(path, columns=["row", "activity", "geo", "product", "unit"])
            for path in _activity_files()
        )
        indicators = [tuple(i) for i in json.loads(INDICATORS_PATH.read_text(encoding="utf-8"))]
    except Exception as e:
        _last_error = type(e).__name__
        print(f"[lca_store] Could not load ecoinvent data from {DATABASE_DIR}: {e}")
        return
    meta = meta.set_index("row").sort_index().astype(str)
    meta["activity_l"] = meta["activity"].str.lower()
    meta["product_l"] = meta["product"].str.lower()
    _indicators = indicators
    _activities = meta


def activities() -> Optional[pd.DataFrame]:
    """
    Activity metadata indexed by ecoinvent row (columns activity, geo, product, unit and
    lower-cased activity_l / product_l), or None when the database files are missing or unreadable.
    """
    global _load_attempted
    if _activities is None and not _load_attempted and configured():
        with _lock:
            if _activities is None and not _load_attempted:
                _load()
                _load_attempted = True
    return _activities


def status() -> Dict[str, Optional[str]]:
    """Why the data is or isn't available, for diagnosing deployments."""
    if activities() is not None:
        return {"state": "loaded", "error": None}
    if not configured():
        return {"state": "files_missing", "error": None}
    return {"state": "load_failed", "error": _last_error}


def indicators() -> List[Tuple[str, str, str, str, str]]:
    """(indicator_code, method, category, indicator, unit) for every impact column, in workbook order."""
    activities()
    return _indicators or []


def impact_values(rows: Iterable[int], codes: List[str]) -> Dict[int, Dict[str, float]]:
    """{row: {indicator_code: value}} for the given ecoinvent rows, limited to `codes`."""
    rows = sorted({int(r) for r in rows})
    if not rows or not codes:
        return {}
    result = {}
    for path in _activity_files():
        df = pd.read_parquet(path, columns=["row", *codes], filters=[("row", "in", rows)])
        for record in df.to_dict("records"):
            row = int(record.pop("row"))
            result[row] = {code: float(v) for code, v in record.items() if pd.notna(v)}
    return result
