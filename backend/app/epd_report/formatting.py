"""
Number and text formatting shared by every renderer.

The single scientific-notation formatter lives here so the report can never
print a value with a lost exponent sign (e.g. ``9.90E02`` instead of ``9.90E-02``).
"""

import math
from typing import Any, Optional

NOT_DECLARED = "ND"
MODULE_NOT_DECLARED = "MND"


def format_sci(value: Any, precision: int = 2) -> str:
    """
    Format a number as uppercase scientific notation with an explicitly signed exponent.

        165.2      -> "1.65E+02"
        -0.00152   -> "-1.52E-03"
        0          -> "0.00E+00"
        -0.0       -> "0.00E+00"

    Non-numeric input returns "N/A" rather than a fabricated zero.
    """
    if precision < 0:
        raise ValueError("precision must be >= 0")
    try:
        f = float(value)
    except (TypeError, ValueError):
        return "N/A"
    if math.isnan(f) or math.isinf(f):
        return "N/A"
    if f == 0.0:
        return f"{0:.{precision}f}E+00"
    mantissa, exp = f"{f:.{precision}e}".split("e")
    exp_i = int(exp)
    sign = "+" if exp_i >= 0 else "-"
    return f"{mantissa}E{sign}{abs(exp_i):02d}"


def format_number(value: Any, max_decimals: int = 2) -> str:
    """Plain human-readable number for prose and scenario tables (1,234.5)."""
    try:
        f = float(value)
    except (TypeError, ValueError):
        return str(value) if value is not None else ""
    if math.isnan(f) or math.isinf(f):
        return "N/A"
    if f == int(f) and abs(f) < 1e15:
        return f"{int(f):,}"
    if abs(f) < 0.01:
        return format_sci(f, 2)
    return f"{f:,.{max_decimals}f}".rstrip("0").rstrip(".")


def format_pct(value: Optional[float], decimals: int = 1) -> str:
    if value is None:
        return ""
    return f"{value:.{decimals}f}"


def format_quantity(amount: Any, unit: Optional[str]) -> str:
    if amount is None:
        return ""
    s = format_number(amount)
    return f"{s} {unit}".strip() if unit else s
