import json

import pytest

from app.epd_report.registry import get_registry, load_registry

REG = get_registry()


@pytest.mark.parametrize("alias,expected", [
    ("TRACI 2.1", "traci-2.1"), ("TRACI v2.1", "traci-2.1"), ("traci_v2_1", "traci-2.1"),
    ("EN15804+A2/PEF", "en15804-a2"), ("EN 15804+A2", "en15804-a2"),
    ("EN15804+A2 - Indicators describing resource use", "en15804-a2"),
    ("CML-IA", "cml-ia"), ("CML v4.8 2016", "cml-ia"),
])
def test_method_aliases(alias, expected):
    assert REG.method_id(alias) == expected


def test_unknown_method():
    assert REG.method("ReCiPe 2016") is None


@pytest.mark.parametrize("method,code,unit", [
    ("TRACI 2.1", "GWP", "kg CO₂e"), ("TRACI 2.1", "AP", "kg SO₂e"), ("TRACI 2.1", "EP", "kg Ne"),
    ("TRACI 2.1", "SFP", "kg O₃e"), ("TRACI 2.1", "ODP", "kg CFC-11e"),
    ("EN 15804+A2", "AP", "mol H⁺e"), ("EN 15804+A2", "EP-freshwater", "kg Pe"),
    ("EN 15804+A2", "HTP-c", "CTUh"), ("CML-IA", "EP", "kg PO₄³⁻e"),
])
def test_indicator_units(method, code, unit):
    assert REG.indicator(method, code).unit == unit


def test_every_indicator_has_unit_and_valid_group():
    for m in REG.methods.values():
        groups = set(m.group_ids())
        for ind in m.indicators:
            assert ind.unit, f"{m.id}:{ind.code} has no unit"
            assert ind.group in groups, f"{m.id}:{ind.code} group {ind.group} not declared"
            for fn in ind.footnotes:
                assert fn in m.footnotes, f"{m.id}:{ind.code} footnote {fn} undefined"


@pytest.mark.parametrize("method,raw,code", [
    ("traci-2.1", "climate change | global warming potential (GWP100)", "GWP"),
    ("traci-2.1", "photochemical oxidant formation | maximum incremental reactivity (MIR)", "SFP"),
    ("en15804-a2", "climate change: fossil (EF v3.1 - IPCC 2021) | global warming potential (GWP100)", "GWP-fossil"),
    ("en15804-a2", "eutrophication: freshwater | fraction of nutrients reaching freshwater end compartment (P)",
     "EP-freshwater"),
    ("en15804-a2", "TRACI v2.1 | non-hazardous waste disposed | NHWD [kg]", "NHWD"),
    ("cml-ia", "eutrophication | eutrophication (fate not incl.)", "EP"),
])
def test_match_raw_key(method, raw, code):
    assert REG.methods[method].match_raw_key(raw).code == code


def test_new_method_from_json_without_code_changes(tmp_path):
    (tmp_path / "recipe.json").write_text(json.dumps({
        "id": "recipe-2016", "name": "ReCiPe 2016 Midpoint (H)", "aliases": ["ReCiPe 2016"],
        "groups": [{"id": "core impact", "title": "Midpoint indicators"}],
        "indicators": [{"code": "GWP", "name": "Global warming", "unit": "kg CO₂e", "group": "core impact"}],
    }))
    from pathlib import Path
    import app.epd_report.registry as r
    reg = load_registry(methods_dir=tmp_path, standards_dir=Path(r.__file__).parent / "standards")
    assert reg.indicator("ReCiPe 2016", "GWP").unit == "kg CO₂e"


def test_standards():
    s = REG.standard("EN 15804+A2")
    assert "resource use" in s.required_groups
    assert "C1" in s.scope_rules["Cradle-to-gate with options"]
