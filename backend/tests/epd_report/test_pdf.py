"""Smoke test: real PDF via headless Chromium, checked by text extraction."""

import io

import pytest
from pypdf import PdfReader

from app.epd_report import generate_epd_report, preview_epd_report

from .conftest import load

pytestmark = pytest.mark.pdf


def _text(pdf: bytes):
    reader = PdfReader(io.BytesIO(pdf))
    return reader, "\n".join(p.extract_text() or "" for p in reader.pages)


def test_chiller_pdf():
    r = generate_epd_report(load("chiller"), {"build_date": "2026-01-01"})
    reader, text = _text(r.pdf)
    assert len(reader.pages) > 10
    assert "environmental product declaration" in text.lower()
    for s in ("EX-650 Water-Cooled Centrifugal Chiller", "EPD-EX-0001", "Declaration summary", "LCA results",
              "Interpretation", "kg CO₂e", "E+0", "E-0"):
        assert s in text, s
    assert f"Page 2 of {len(reader.pages)}" in text
    assert "DRAFT" not in text
    # landscape pages exist for the results section
    assert any(p.mediabox.width > p.mediabox.height for p in reader.pages)
    # fonts are embedded
    fonts = set()
    for p in reader.pages[:3]:
        res = p.get("/Resources") or {}
        for f in (res.get("/Font") or {}).values():
            fd = f.get_object().get("/FontDescriptor") or (
                f.get_object().get("/DescendantFonts")[0].get_object().get("/FontDescriptor"))
            if fd:
                fd = fd.get_object()
                fonts.add(bool(fd.get("/FontFile2") or fd.get("/FontFile3") or fd.get("/FontFile")))
    assert fonts == {True}


def test_insulation_pdf():
    r = generate_epd_report(load("insulation"), {"paper": "A4"})
    reader, text = _text(r.pdf)
    assert len(reader.pages) > 5
    assert "EX-Rock 035 Stone Wool Slab" in text and "MND" in text and "mol H" in text
    assert abs(float(reader.pages[1].mediabox.width) - 595.3) < 2  # A4 portrait width in points


def test_draft_watermark_and_no_warnings_in_pdf():
    r = generate_epd_report(load("minimal"))
    _, text = _text(r.pdf)
    assert "DRAFT" in text
    assert "Declaration number is missing" not in text  # warnings go to the preview panel, not the PDF
    assert r.warnings


def test_preview_has_no_pdf():
    r = preview_epd_report(load("insulation"))
    assert r.pdf is None and "mode-preview" in r.html
