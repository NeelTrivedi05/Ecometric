"""
Snapshot tests of the report document model (structure + all text; SVG/images reduced to hashes).

Regenerate after an intended change:   UPDATE_SNAPSHOTS=1 python -m pytest tests/epd_report/test_snapshots.py
"""

import hashlib
import json
import os
from pathlib import Path

import pytest

from .conftest import load
from .helpers import build

SNAP_DIR = Path(__file__).resolve().parent / "snapshots"


def _scrub(obj):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k in ("svg", "image", "data", "product_image", "manufacturer_logo", "program_operator_logo",
                     "logo") and isinstance(v, str) and v:
                out[k] = "sha256:" + hashlib.sha256(v.encode()).hexdigest()[:16]
            else:
                out[k] = _scrub(v)
        return out
    if isinstance(obj, list):
        return [_scrub(x) for x in obj]
    return obj


@pytest.mark.parametrize("name", ["chiller", "insulation", "minimal"])
def test_document_snapshot(name):
    doc = build(load(name), build_date="2026-01-01")
    actual = _scrub({"document": doc.to_dict(), "warnings": doc.warnings})
    path = SNAP_DIR / f"{name}.json"
    if os.environ.get("UPDATE_SNAPSHOTS") or not path.exists():
        path.write_text(json.dumps(actual, indent=1, ensure_ascii=False, sort_keys=True), encoding="utf-8")
        pytest.skip(f"snapshot written: {path.name}")
    expected = json.loads(path.read_text(encoding="utf-8"))
    assert actual == expected, f"document model changed — review and run with UPDATE_SNAPSHOTS=1 ({path.name})"
