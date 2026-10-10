"""
Lifecycle module conventions (EN 15804 / ISO 21930): canonical order, default
labels, aggregation of sub-modules and column selection for results tables.
"""

import math
import re
from typing import Dict, Iterable, List, Optional, Tuple

CANONICAL_ORDER: List[str] = [
    "A1", "A2", "A3", "A1-A3", "A4", "A5",
    "B1", "B2", "B3", "B4", "B5", "B6", "B7",
    "C1", "C2", "C3", "C4", "C1-C4", "D",
]

AGGREGATES: Dict[str, List[str]] = {
    "A1-A3": ["A1", "A2", "A3"],
    "C1-C4": ["C1", "C2", "C3", "C4"],
}

SUBMODULES: List[str] = [m for m in CANONICAL_ORDER if m not in AGGREGATES]

DEFAULT_MODULE_INFO: Dict[str, Tuple[str, str]] = {
    "A1": ("Raw material supply", "Product stage"),
    "A2": ("Transport", "Product stage"),
    "A3": ("Manufacturing", "Product stage"),
    "A4": ("Transport to site", "Construction process stage"),
    "A5": ("Assembly / installation", "Construction process stage"),
    "B1": ("Use", "Use stage"),
    "B2": ("Maintenance", "Use stage"),
    "B3": ("Repair", "Use stage"),
    "B4": ("Replacement", "Use stage"),
    "B5": ("Refurbishment", "Use stage"),
    "B6": ("Operational energy use", "Use stage"),
    "B7": ("Operational water use", "Use stage"),
    "C1": ("De-construction / demolition", "End-of-life stage"),
    "C2": ("Transport", "End-of-life stage"),
    "C3": ("Waste processing", "End-of-life stage"),
    "C4": ("Disposal", "End-of-life stage"),
    "D": ("Reuse, recovery, recycling potential", "Benefits beyond the system boundary"),
}

STAGE_GROUPS: List[Tuple[str, List[str]]] = [
    ("Product stage", ["A1", "A2", "A3"]),
    ("Construction process stage", ["A4", "A5"]),
    ("Use stage", ["B1", "B2", "B3", "B4", "B5", "B6", "B7"]),
    ("End-of-life stage", ["C1", "C2", "C3", "C4"]),
    ("Benefits beyond the system boundary", ["D"]),
]

DECLARED = "declared"
MND = "MND"
ND = "ND"
NOT_RELEVANT = "not relevant"


def normalize_module_code(code: str) -> str:
    """Accepts 'A1–A3', 'A1_A3', 'a1-a3', 'C1_C4' ... and returns the canonical code."""
    c = re.sub(r"[\s]", "", str(code)).upper()
    c = c.replace("–", "-").replace("—", "-").replace("_", "-")
    return c


def sort_modules(codes: Iterable[str]) -> List[str]:
    idx = {m: i for i, m in enumerate(CANONICAL_ORDER)}
    return sorted({normalize_module_code(c) for c in codes}, key=lambda m: idx.get(m, len(idx)))


def is_number(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and not math.isnan(v) and not math.isinf(v)


def aggregate_status(statuses: Dict[str, str], aggregate: str) -> str:
    """An aggregated column is declared if any of its sub-modules is declared."""
    subs = [statuses.get(s, MND) for s in AGGREGATES[aggregate]]
    if any(s == DECLARED for s in subs):
        return DECLARED
    if all(s == ND for s in subs):
        return ND
    return MND


def complete_aggregates(
    values: Dict[str, Optional[float]],
    statuses: Dict[str, str],
    tolerance_pct: float = 1.0,
) -> Tuple[Dict[str, Optional[float]], List[Tuple[str, str]]]:
    """
    Fills missing aggregate columns by summing declared sub-modules and flags
    aggregates that disagree with their sub-modules beyond ``tolerance_pct``.

    Returns (values, issues) where issues are (aggregate_code, message).
    """
    out = {normalize_module_code(k): v for k, v in values.items()}
    issues: List[Tuple[str, str]] = []
    for agg, subs in AGGREGATES.items():
        sub_vals = [out.get(s) for s in subs if statuses.get(s) == DECLARED]
        sub_nums = [v for v in sub_vals if is_number(v)]
        given = out.get(agg)
        if not is_number(given):
            if sub_nums:
                out[agg] = float(sum(sub_nums))
            continue
        if len(sub_nums) == 0:
            continue
        summed = float(sum(sub_nums))
        denom = max(abs(given), abs(summed))
        if denom > 0 and abs(given - summed) / denom * 100.0 > tolerance_pct:
            issues.append((agg, f"{agg} = {given:.4g} but sum of {'+'.join(subs)} = {summed:.4g}"))
    return out, issues


def select_columns(
    statuses: Dict[str, str],
    mode: str = "both",
    present: Optional[Iterable[str]] = None,
) -> List[str]:
    """
    Columns for a results table, in canonical order.

    mode: "both" | "aggregated" | "submodules"
      aggregated  -> A1-A3 and C1-C4 replace their sub-modules
      submodules  -> only individual modules
    Only modules listed in ``statuses`` (the declaration) are shown; aggregates
    appear when at least one of their sub-modules is in the declaration.
    """
    if mode not in ("both", "aggregated", "submodules"):
        raise ValueError(f"unknown column mode '{mode}'")
    listed = {normalize_module_code(m) for m in statuses}
    if present is not None:
        listed |= {normalize_module_code(m) for m in present if normalize_module_code(m) in AGGREGATES}
    cols: List[str] = []
    for m in CANONICAL_ORDER:
        if m in AGGREGATES:
            in_scope = any(s in listed for s in AGGREGATES[m])
            if in_scope and mode in ("both", "aggregated"):
                cols.append(m)
        else:
            if m not in listed:
                continue
            parent = next((a for a, subs in AGGREGATES.items() if m in subs), None)
            if mode == "aggregated" and parent:
                continue
            cols.append(m)
    return cols


def split_columns(columns: List[str], max_per_part: int) -> List[List[str]]:
    """Splits wide column sets into stacked parts of roughly equal width."""
    if max_per_part <= 0 or len(columns) <= max_per_part:
        return [columns]
    parts = math.ceil(len(columns) / max_per_part)
    size = math.ceil(len(columns) / parts)
    return [columns[i:i + size] for i in range(0, len(columns), size)]


def column_label(code: str) -> str:
    return code.replace("-", "–")
