"""
Generic config discovery: every ``*.py`` file exposing the named attribute
(``METHOD``, ``STANDARD``, ``PROFILE`` …) and every ``*.json`` file in a
directory becomes an entry. Adding an entry never requires code changes.
"""

import importlib.util
import json
import re
from pathlib import Path
from typing import Any, Dict, List


def norm_key(s: str) -> str:
    """Case/spacing/punctuation-insensitive key ('EN 15804+A2/PEF' == 'en15804+a2pef')."""
    return re.sub(r"[^a-z0-9+&]", "", str(s).lower())


def load_entries(directory: Path, attr: str) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    for path in sorted(directory.glob("*")):
        if path.name.startswith("_"):
            continue
        if path.suffix == ".json":
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        elif path.suffix == ".py":
            spec = importlib.util.spec_from_file_location(f"_epd_cfg_{directory.name}_{path.stem}", path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)  # type: ignore[union-attr]
            if not hasattr(mod, attr):
                continue
            data = getattr(mod, attr)
        else:
            continue
        if not isinstance(data, dict) or "id" not in data:
            raise ValueError(f"{path}: config entry must be a dict with an 'id'")
        data = dict(data)
        data["_source"] = str(path)
        entries.append(data)
    ids = [e["id"] for e in entries]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        raise ValueError(f"duplicate config ids in {directory}: {sorted(dupes)}")
    return entries
