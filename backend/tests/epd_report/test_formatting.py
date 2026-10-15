import math

import pytest

from app.epd_report.formatting import format_number, format_sci


@pytest.mark.parametrize("value,expected", [
    (165.2, "1.65E+02"),
    (-0.00152, "-1.52E-03"),
    (0.099, "9.90E-02"),          # the reference PDF printed this as 9.90E02
    (1.54e-10, "1.54E-10"),       # ... and this as 1.54E10
    (-1.54e10, "-1.54E+10"),
    (0, "0.00E+00"),
    (0.0, "0.00E+00"),
    (-0.0, "0.00E+00"),
    (1, "1.00E+00"),
    (9.999, "1.00E+01"),          # rounding carries into the exponent
    (1e-100, "1.00E-100"),
    (3.2e-300, "3.20E-300"),
    ("12.5", "1.25E+01"),
])
def test_format_sci(value, expected):
    assert format_sci(value) == expected


def test_format_sci_never_drops_exponent_sign():
    for exp in range(-30, 31):
        for v in (1.234 * 10 ** exp, -1.234 * 10 ** exp):
            s = format_sci(v)
            assert s.split("E")[1][0] in "+-", s


@pytest.mark.parametrize("precision,expected", [(0, "2E+02"), (1, "1.7E+02"), (3, "1.652E+02")])
def test_format_sci_precision(precision, expected):
    assert format_sci(165.2, precision) == expected


@pytest.mark.parametrize("value", [None, "abc", float("nan"), math.inf])
def test_format_sci_invalid(value):
    assert format_sci(value) == "N/A"


def test_format_number():
    assert format_number(1234) == "1,234"
    assert format_number(2.5) == "2.5"
    assert format_number(0.001) == "1.00E-03"
