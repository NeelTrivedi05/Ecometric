from app.epd_report import parse_input
from app.epd_report.adapter import from_app_payload, infer_modules, map_results

from .conftest import load
from .helpers import build, kv_value, result_tables


def _payload():
    p = load("app_payload")
    return p["extractedData"], p["resultsByMethod"], p["reportDetails"]


def test_maps_studio_payload_to_valid_input():
    ed, res, rd = _payload()
    data, warnings = from_app_payload(ed, res, rd)
    assert warnings == []
    inp = parse_input(data)
    assert inp.selection.methods == ["TRACI 2.1"]
    assert inp.meta.issue_date == "2026-03-01"
    assert inp.verification.type == "external" and inp.verification.epd_verifier.name == "A. Verifier"
    assert [p.name for p in inp.pcr.parts] == ["Part A: Example PCR", "Part B: Example sub-category PCR"]
    assert inp.pcr.review_panel[0].organization == "Example Review Group"
    assert inp.functional_unit.description.startswith("1 unit of HVAC")


def test_values_pass_through_without_normalisation():
    ed, res, rd = _payload()
    data, _ = from_app_payload(ed, res, rd)
    raw = res["traci_v2_1"]["results"]["climate change | global warming potential (GWP100)"]
    gwp = next(r for r in data["results"][0]["rows"] if r["indicatorCode"] == "GWP")
    assert gwp["values"]["A1"] == raw["A1"] and gwp["values"]["B6"] == raw["B6"]


def test_report_builds_from_studio_payload():
    ed, res, rd = _payload()
    data, _ = from_app_payload(ed, res, rd)
    doc = build(data)
    units = {r[0].text: r[1].text for t in result_tables(doc) for r in t.rows}
    assert units["GWP"] == "kg CO₂e" and units["ODP"] == "kg CFC-11e"
    assert kv_value(doc, "Declaration number") == "EPD-STUDIO-1"


def test_selection_and_overrides():
    ed, res, rd = _payload()
    data, _ = from_app_payload(ed, res, rd, selection={"indicatorFilter": "core", "productCategoryId":
                                                        "water-cooled-chiller"},
                               overrides={"meta": {"scope": "Cradle-to-grave"}})
    assert data["selection"]["indicatorFilter"] == "core"
    assert data["meta"]["scope"] == "Cradle-to-grave" and data["meta"]["declarationNumber"] == "EPD-STUDIO-1"


def test_unmapped_method_and_indicator_warn():
    w = []
    out = map_results({"recipe": {"results": {"x | y": {"A1": 1}}, "metadata": {"methodology_label": "ReCiPe"}},
                       "traci_v2_1": {"results": {"made up | thing": {"A1": 1}},
                                      "metadata": {"methodology_label": "TRACI v2.1"}}}, "v", "V", w)
    assert {x["code"] for x in w} == {"adapter.method_unmapped", "adapter.indicator_unmapped"}
    assert out[0]["rows"] == []


def test_infer_modules():
    mods = infer_modules([{"rows": [{"values": {"A1": 1.0, "B6": 0.0, "C1-C4": 2.0}}]}])
    status = {m["code"]: m["status"] for m in mods}
    assert status["A1"] == "declared" and status["B6"] == "MND" and status["C3"] == "declared"
