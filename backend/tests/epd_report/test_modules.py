from app.epd_report.modules import (
    complete_aggregates, normalize_module_code, select_columns, sort_modules, split_columns,
)

ALL = {m: "declared" for m in ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7",
                               "C1", "C2", "C3", "C4", "D"]}


def test_normalize():
    assert normalize_module_code("a1–a3") == "A1-A3"
    assert normalize_module_code("C1_C4") == "C1-C4"
    assert normalize_module_code(" b6 ") == "B6"


def test_sort_modules_canonical():
    assert sort_modules(["D", "C1-C4", "A4", "A1-A3", "B6", "A1"]) == ["A1", "A1-A3", "A4", "B6", "C1-C4", "D"]


def test_select_columns_modes():
    both = select_columns(ALL, "both")
    assert both == ["A1", "A2", "A3", "A1-A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7",
                    "C1", "C2", "C3", "C4", "C1-C4", "D"]
    assert select_columns(ALL, "aggregated") == ["A1-A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6",
                                                 "B7", "C1-C4", "D"]
    assert "A1-A3" not in select_columns(ALL, "submodules")


def test_select_columns_only_declared_modules():
    statuses = {"A1": "declared", "A2": "declared", "A3": "declared", "C1": "declared", "C2": "declared",
                "C3": "declared", "C4": "declared", "D": "declared"}
    assert select_columns(statuses, "aggregated") == ["A1-A3", "C1-C4", "D"]


def test_complete_aggregates_fills_missing():
    vals, issues = complete_aggregates({"A1": 1.0, "A2": 2.0, "A3": 3.0, "C2": 0.5}, ALL)
    assert vals["A1-A3"] == 6.0
    assert vals["C1-C4"] == 0.5
    assert issues == []


def test_complete_aggregates_flags_mismatch():
    vals, issues = complete_aggregates({"A1": 1.0, "A2": 2.0, "A3": 3.0, "A1-A3": 7.0}, ALL, 1.0)
    assert vals["A1-A3"] == 7.0  # given value kept
    assert issues and issues[0][0] == "A1-A3"


def test_complete_aggregates_within_tolerance():
    _, issues = complete_aggregates({"A1": 1.0, "A2": 2.0, "A3": 3.0, "A1-A3": 6.03}, ALL, 1.0)
    assert issues == []


def test_complete_aggregates_ignores_undeclared_submodules():
    statuses = dict(ALL, A2="MND")
    vals, _ = complete_aggregates({"A1": 1.0, "A2": 5.0, "A3": 3.0}, statuses)
    assert vals["A1-A3"] == 4.0


def test_split_columns():
    cols = [f"c{i}" for i in range(19)]
    parts = split_columns(cols, 14)
    assert len(parts) == 2 and sum(len(p) for p in parts) == 19
    assert split_columns(cols[:5], 14) == [cols[:5]]
