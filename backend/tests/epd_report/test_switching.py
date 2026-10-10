"""Changing the LCIA methodology or the product category rebuilds the document consistently."""

from app.epd_report.document import DataTable
from app.epd_report.sections.back import references_list
from app.epd_report.renderers.html import render_html

from .helpers import all_text, build, figures, headings, kv_value, result_tables, tables


def _with_methods(data, methods):
    data["selection"]["methods"] = methods
    return build(data)


def _row_codes(doc):
    return {row[0].text for t in result_tables(doc) for row in t.rows}


def _footnotes(doc):
    return " ".join(f.text for t in result_tables(doc) for f in t.footnotes)


def _definition_captions(doc):
    return [t.caption for t in tables(doc, "results") if isinstance(t, DataTable) and t.id and t.id.startswith("tbl-def")]


def test_traci_only(chiller):
    doc = _with_methods(chiller, ["TRACI 2.1"])
    assert {"GWP", "ODP", "AP", "EP", "SFP"} <= _row_codes(doc)
    assert "GWP-total" not in _row_codes(doc)
    assert _definition_captions(doc) == ["Parameters describing environmental impacts — TRACI 2.1"]
    assert "Disclaimer" not in _footnotes(doc)
    assert kv_value(doc, "LCIA methodology & version") == "TRACI 2.1"
    text = all_text(doc)
    assert "kg SO₂e" in text and "mol H⁺e" not in text
    assert "Parameters describing resource use" not in text


def test_en15804_only_has_no_traci_content(chiller):
    doc = _with_methods(chiller, ["EN15804+A2/PEF"])
    codes = _row_codes(doc)
    assert {"GWP-total", "GWP-fossil", "GWP-biogenic", "GWP-luluc", "EP-freshwater", "PERT", "HWD", "MFR"} <= codes
    assert "SFP" not in codes
    assert _definition_captions(doc) == ["Parameters describing environmental impacts — EN 15804+A2 (EF 3.1)"]
    fn = _footnotes(doc)
    assert "Disclaimer 2" in fn and "Disclaimer 1" in fn and "PO₄³⁻" in fn
    assert kv_value(doc, "LCIA methodology & version").startswith("EN 15804+A2")
    text = all_text(doc)
    for leftover in ("TRACI", "kg SO₂e", "kg O₃e", "Smog formation", "Bare, J."):
        assert leftover not in text, leftover
    assert "mol H⁺e" in text
    assert "Parameters describing resource use" in text and "Waste categories" in text and "Output flows" in text
    html = render_html(doc, mode="preview")
    assert "TRACI" not in html
    refs = " ".join(r["citation"] for r in references_list_for(chiller, ["EN15804+A2/PEF"]))
    assert "Andreasi Bassi" in refs and "TRACI" not in refs


def references_list_for(data, methods):
    from app.epd_report import parse_input
    from app.epd_report.context import build_context
    from app.epd_report.product_categories import get_profile
    from app.epd_report.registry import get_registry
    from app.epd_report.schema import ReportOptions
    from app.epd_report.templates import get_template
    data = dict(data, selection=dict(data["selection"], methods=methods))
    inp = parse_input(data)
    ctx = build_context(inp, ReportOptions(), get_registry(), get_profile(inp.selection.product_category_id),
                        get_template())
    return references_list(ctx)


def test_both_methods(chiller):
    doc = _with_methods(chiller, ["TRACI 2.1", "EN15804+A2/PEF"])
    assert {"SFP", "GWP-total"} <= _row_codes(doc)
    assert len(_definition_captions(doc)) == 2
    assert kv_value(doc, "LCIA methodology & version").startswith("TRACI 2.1; EN 15804+A2")
    refs = " ".join(r["citation"] for r in references_list_for(chiller, ["TRACI 2.1", "EN15804+A2/PEF"]))
    assert "Bare, J." in refs and "Andreasi Bassi" in refs and "CML" not in refs
    # primary method (first selected) drives charts and narrative
    assert "kg CO₂e" in " ".join(f.caption for f in figures(doc))
    assert doc.meta["selection"]["primaryMethod"] == "TRACI 2.1"


def test_primary_method_switches_chart_units(chiller):
    doc = _with_methods(chiller, ["EN15804+A2/PEF", "TRACI 2.1"])
    caps = " ".join(f.caption for f in figures(doc))
    assert "Acidification potential, accumulated exceedance (mol H⁺e)" in caps
    assert "kg SO₂e" not in caps


def test_method_without_results_is_error(chiller):
    chiller["results"] = [r for r in chiller["results"] if r["method"] != "CML-IA"]
    doc = _with_methods(chiller, ["TRACI 2.1", "CML-IA"])
    msgs = [w["message"] for w in doc.warnings if w["code"] == "method.no_results"]
    assert msgs == ["No results calculated for CML-IA — run the calculation first or deselect it."]
    assert "CML-IA" not in " ".join(_definition_captions(doc))


def test_indicator_filter(chiller):
    chiller["selection"]["indicatorFilter"] = "core"
    doc = _with_methods(chiller, ["EN15804+A2/PEF"])
    assert "PERT" not in _row_codes(doc) and "PM" not in _row_codes(doc)
    assert "GWP-total" in _row_codes(doc)


def test_switch_category_chiller_to_insulation(chiller):
    chiller["selection"]["methods"] = ["TRACI 2.1"]
    before = build(chiller)
    chiller["selection"]["productCategoryId"] = "mineral-wool-insulation"
    after = build(chiller)

    before_h, after_h = headings(before), headings(after)
    assert any("Maintenance (refrigerant" in h for h in before_h)
    assert any("Contribution of modules excluding B6" in h for h in before_h)
    assert before.meta["selection"]["productCategoryId"] == "water-cooled-chiller"

    # chiller-only content is gone
    text = all_text(after)
    assert not any("refrigerant" in h.lower() for h in after_h)
    assert not any("excluding B6" in h for h in after_h)
    assert "Electricity grid mix" not in text
    assert "ton of chilling capacity" not in text
    # insulation profile content appears
    assert "RSI = 1 m²·K/W" in text
    assert "Declared unit" in after_h
    assert "Declared thermal conductivity λD" in text
    assert kv_value(after, "EPD scope") == "Cradle-to-grave"  # user-entered scope kept
    # shared, category-independent data is kept
    assert kv_value(after, "Declaration number") == "EPD-EX-0001"
    assert "Example Program Operator" in kv_value(after, "Program operator")
    assert after.meta["selection"]["productCategoryId"] == "mineral-wool-insulation"
    assert any(w["code"] == "category.mismatch" for w in after.warnings)
    # B-modules follow the insulation profile (MND)
    for t in result_tables(after):
        for i, c in enumerate(t.columns):
            if c.key == "B6":
                assert all(r[i].text == "MND" for r in t.rows)


def test_unknown_category_uses_generic(insulation):
    insulation["selection"]["productCategoryId"] = "precast-concrete"
    insulation["dataCategoryId"] = None
    doc = build(insulation)
    assert doc.meta["selection"]["productCategoryId"] == "generic"
    assert any(w["code"] == "category.fallback" for w in doc.warnings)


def test_rebuild_is_deterministic(chiller):
    a = build(chiller, build_date="2026-01-01").to_dict()
    b = build(chiller, build_date="2026-01-01").to_dict()
    assert a == b
