"""Document model: structure, results tables, aggregation, MND handling, numbering."""

import pytest

from app.epd_report import EpdReportError, EpdReportInputError, parse_input
from app.epd_report.document import DataTable, TocBlock

from .helpers import all_text, build, codes, figures, headings, kv_value, result_tables, tables


def test_chiller_builds_all_sections(chiller):
    doc = build(chiller)
    assert [s.id for s in doc.sections] == ["cover", "summary", "toc", "general", "methodology", "results",
                                            "interpretation", "custom-Additional_environmental_information",
                                            "assumptions", "references"]
    assert [s.number for s in doc.sections if s.numbered] == ["1", "2", "3", "4", "5", "6", "7"]
    assert not doc.draft
    assert codes(doc, "error") == set()


def test_results_tables_use_registry_units_and_names(chiller):
    chiller["selection"]["methods"] = ["TRACI 2.1"]
    doc = build(chiller)
    t = result_tables(doc)[0]
    units = {row[0].text: row[1].text for row in t.rows}
    assert units["GWP"] == "kg CO₂e" and units["AP"] == "kg SO₂e" and units["SFP"] == "kg O₃e"
    assert "impact unit" not in all_text(doc)


def test_columns_canonical_order_and_split(chiller):
    chiller["selection"]["methods"] = ["TRACI 2.1"]
    doc = build(chiller)
    t1, t2 = result_tables(doc)[:2]
    assert t1.part == "Part 1 of 2" and t2.part == "Part 2 of 2"
    labels = [c.label for c in t1.columns[2:]] + [c.label for c in t2.columns[2:]]
    assert labels == ["A1", "A2", "A3", "A1–A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7",
                      "C1", "C2", "C3", "C4", "C1–C4", "D"]
    # D is declared MND for the chiller: the column is shown, with "MND" instead of numbers
    d_idx = [c.label for c in t2.columns].index("D")
    assert all(row[d_idx].text == "MND" for row in t2.rows)
    # indicator/unit columns repeat on every part
    assert [c.label for c in t2.columns[:2]] == ["Indicator", "Unit"]
    assert t1.number == t2.number  # continuation keeps the table number


def test_mnd_modules_print_mnd_never_zero(insulation):
    doc = build(insulation)
    for t in result_tables(doc):
        for i, col in enumerate(t.columns):
            if col.key in {"B1", "B2", "B3", "B4", "B5", "B6", "B7"}:
                assert all(row[i].text == "MND" for row in t.rows)


def test_aggregates_computed_when_missing(insulation):
    doc = build(insulation, column_mode="aggregated")
    t = result_tables(doc)[0]
    assert "A1–A3" in [c.label for c in t.columns] and "A1" not in [c.label for c in t.columns]
    assert all(row[2].text not in ("", "N/A") for row in t.rows)


def test_aggregate_mismatch_warns(chiller):
    chiller["selection"]["methods"] = ["TRACI 2.1"]
    chiller["results"][0]["rows"][0]["values"]["A1-A3"] *= 1.5
    doc = build(chiller)
    assert "aggregate.mismatch" in codes(doc, "warning")


def test_total_column_optional(chiller):
    chiller["selection"]["methods"] = ["TRACI 2.1"]
    assert all("Total" not in [c.label for c in t.columns] for t in result_tables(build(chiller)))
    doc = build(chiller, show_total=True)
    assert any("Total" in [c.label for c in t.columns] for t in result_tables(doc))


def test_negative_values_keep_sign(insulation):
    doc = build(insulation)
    text = all_text(doc)
    assert "-1." in text or "-2." in text  # module D credits are negative
    for t in result_tables(doc):
        for row in t.rows:
            for c in row[2:]:
                if "E" in c.text:
                    assert c.text.split("E")[1][0] in "+-"


def test_numbering_and_cross_references(chiller):
    doc = build(chiller)
    nums = [t.number for t in tables(doc) if getattr(t, "caption", None) and t.number]
    assert nums == sorted(nums) and nums[0] == 1
    figs = [f.number for f in figures(doc) if f.caption]
    assert figs == list(range(1, len(figs) + 1))
    text = all_text(doc)
    assert "{{ref:" not in text and "(see below)" not in text
    assert "shown in Figure" in text


def test_toc_lists_sections(chiller):
    doc = build(chiller)
    toc = next(b for _, b in doc.iter_blocks() if isinstance(b, TocBlock))
    titles = [e["title"] for e in toc.entries]
    assert "LCA results" in titles and "Interpretation" in titles


def test_toc_optional(chiller):
    assert "toc" not in [s.id for s in build(chiller, include_toc=False).sections]


def test_summary_methodology_row(chiller):
    doc = build(chiller)
    assert kv_value(doc, "LCIA methodology & version").startswith("TRACI 2.1")


def test_custom_section_markdown_escaped(chiller):
    chiller["customSections"] = [{"afterSection": "product", "title": "Note", "markdown": "<script>x</script> **ok**"}]
    doc = build(chiller)
    html_paras = [b for _, b in doc.iter_blocks() if getattr(b, "html", False)]
    assert html_paras and "<script>" not in html_paras[0].text and "&lt;script&gt;" in html_paras[0].text
    assert "<strong>ok</strong>" in html_paras[0].text
    assert "Note" in headings(doc, "general")


def test_filename_contains_selection(chiller):
    chiller["selection"]["methods"] = ["EN15804+A2/PEF"]
    doc = build(chiller, build_date="2026-10-10")
    assert doc.filename == "EPD_EX_650_Water_Cooled_Centrifugal_Chiller_EN_15804_A2_EF_3_1_2026_10_10.pdf"
    assert doc.meta["selection"]["methods"] == ["EN 15804+A2 (EF 3.1)"]


def test_schema_errors_are_structured():
    with pytest.raises(EpdReportInputError) as e:
        parse_input({"selection": {"methods": []}, "product": {}, "results": [], "bogus": 1})
    paths = {err["path"] for err in e.value.errors}
    assert {"selection.methods", "product.name", "results", "bogus"} <= paths


def test_unknown_indicator_is_error(chiller):
    chiller["selection"]["methods"] = ["TRACI 2.1"]
    chiller["results"][0]["rows"].append({"indicatorCode": "XYZ", "values": {"A1": 1}})
    doc = build(chiller)
    assert "indicator.unknown" in codes(doc, "error")
    assert doc.draft


def test_variant_filter(chiller):
    chiller["selection"]["variantIds"] = ["cn"]
    doc = build(chiller)
    assert doc.meta["selection"]["variantIds"] == ["cn"]
    assert "Manufactured in US" not in all_text(doc)


def test_no_results_for_any_method_raises(chiller):
    chiller["selection"]["methods"] = ["ReCiPe 2016"]
    with pytest.raises(EpdReportError):
        build(chiller)


def test_raw_calc_keys_map_to_registry(minimal):
    minimal["results"][0]["rows"] = [
        {"indicatorCode": "climate change | global warming potential (GWP100)", "values": {"A1": 1.0}},
        {"indicatorCode": "acidification | acidification potential (AP)", "values": {"A1": 0.1}},
    ]
    doc = build(minimal)
    t = result_tables(doc)[0]
    assert [r[0].text for r in t.rows] == ["GWP", "AP"]
