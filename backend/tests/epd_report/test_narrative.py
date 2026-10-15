from app.epd_report import narrative, parse_input
from app.epd_report.context import build_context
from app.epd_report.product_categories import get_profile
from app.epd_report.registry import get_registry
from app.epd_report.schema import ReportOptions
from app.epd_report.templates import get_template
from app.epd_report.text_library import fill_template


def ctx_for(data):
    inp = parse_input(data)
    return build_context(inp, ReportOptions(), get_registry(), get_profile(inp.selection.product_category_id),
                         get_template())


def test_fill_template_skips_missing():
    assert fill_template("A {x} B", x="1") == "A 1 B"
    assert fill_template("A {x} B", x=None) is None
    assert fill_template("A {x} B", x="  ") is None


def test_replacement_sentence(chiller):
    ctx = ctx_for(chiller)
    assert narrative.replacements(ctx) == 2
    assert narrative.replacement_sentence(ctx) == (
        "With a reference service life of 25 years and a building estimated service life of 75 years, "
        "2 replacement(s) are required (module B4).")


def test_replacement_sentence_needs_esl(insulation):
    assert narrative.replacement_sentence(ctx_for(insulation)) is None


def test_dominant_sentence(chiller):
    chiller["selection"]["methods"] = ["TRACI 2.1"]
    ctx = ctx_for(chiller)
    s = narrative.dominant_sentences(ctx, ctx.primary, "us", ["GWP"])[0]
    assert s.startswith("Module B6 — Operational energy use contributes ")
    assert s.endswith("% of total global warming potential over the 75-year building service life.")


def test_dominant_sentence_without_use_stage(insulation):
    ctx = ctx_for(insulation)
    s = narrative.dominant_sentences(ctx, ctx.primary, "default", ["GWP-total"])[0]
    assert "A1–A3 — Product stage" in s and "service life" not in s


def test_transport_and_eol(insulation):
    ctx = ctx_for(insulation)
    assert narrative.transport_sentences(ctx) == ["Transport to site (Truck) covers 450 km by Lorry 16–32 t, EURO 6."]
    assert narrative.eol_sentences(ctx) == ["At end of life, the product is assumed to be 1.4 kg landfilled."]


def test_transport_skips_missing_distance(insulation):
    insulation["scenarios"]["A4"]["legs"][0].pop("distanceKm")
    assert narrative.transport_sentences(ctx_for(insulation)) == []


def test_text_override(chiller):
    chiller["textOverrides"] = {"nar.replacement": "Replacements: {replacements}."}
    assert narrative.replacement_sentence(ctx_for(chiller)) == "Replacements: 2."
