"""
EPD report generation module.

    from app.epd_report import generate_epd_report
    result = generate_epd_report(input_dict, {"paper": "A4"})
    result.pdf, result.html, result.warnings

See README.md in this folder for the input schema and how to extend methods,
product categories, templates and text.
"""

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Union

from pydantic import ValidationError

from .builder import build_document
from .context import EpdReportError
from .document import Document
from .renderers.html import render_html
from .schema import EpdReportInput, ReportOptions, ReportWarning

__all__ = ["generate_epd_report", "preview_epd_report", "build_document", "parse_input", "EpdReportInput",
           "ReportOptions", "ReportResult", "EpdReportError", "EpdReportInputError"]


class EpdReportInputError(Exception):
    """Input failed schema validation; ``errors`` lists structured problems."""

    def __init__(self, errors: List[Dict[str, Any]]):
        super().__init__(f"{len(errors)} input validation error(s)")
        self.errors = errors


@dataclass
class ReportResult:
    html: str
    warnings: List[Dict[str, Any]]
    document: Document
    filename: str
    pdf: Optional[bytes] = None
    meta: Dict[str, Any] = field(default_factory=dict)


def parse_input(data: Union[Dict[str, Any], EpdReportInput]) -> EpdReportInput:
    if isinstance(data, EpdReportInput):
        return data
    try:
        return EpdReportInput.model_validate(data)
    except ValidationError as e:
        raise EpdReportInputError([
            {"level": "error", "code": f"schema.{err['type']}", "path": ".".join(str(x) for x in err["loc"]),
             "message": err["msg"]} for err in e.errors()
        ]) from e


def _options(options: Union[None, Dict[str, Any], ReportOptions]) -> ReportOptions:
    if isinstance(options, ReportOptions):
        return options
    return ReportOptions.model_validate(options or {})


ExtraChecks = Callable[[str], List[Dict[str, Any]]]


def _apply_extra_checks(doc: Document, opts: ReportOptions, extra_checks: Optional[ExtraChecks]) -> None:
    """Runs checks that need the rendered text (e.g. PCR document rules); their errors make the
    document a draft, like the built-in validation errors."""
    if not extra_checks:
        return
    extra = extra_checks(render_html(doc, mode="preview"))
    doc.warnings = doc.warnings + extra
    if any(w.get("level") == "error" for w in extra) and opts.draft_watermark_on_errors:
        doc.draft = True


def preview_epd_report(data, options=None, *, extra_checks: Optional[ExtraChecks] = None) -> ReportResult:
    """Builds the document and preview HTML (no PDF). Used by the live preview."""
    opts = _options(options)
    doc = build_document(parse_input(data), opts)
    _apply_extra_checks(doc, opts, extra_checks)
    return ReportResult(html=render_html(doc, mode="preview"), warnings=doc.warnings, document=doc,
                        filename=doc.filename, meta=doc.meta)


def generate_epd_report(data, options=None, *, pdf: bool = True,
                        extra_checks: Optional[ExtraChecks] = None) -> ReportResult:
    """Validates input, builds the document and renders print HTML + PDF."""
    opts = _options(options)
    doc = build_document(parse_input(data), opts)
    _apply_extra_checks(doc, opts, extra_checks)
    html = render_html(doc, mode="print")
    pdf_bytes = None
    if pdf:
        from .renderers.pdf import render_pdf
        pdf_bytes = render_pdf(doc, html=html)
    return ReportResult(html=html, pdf=pdf_bytes, warnings=doc.warnings, document=doc, filename=doc.filename,
                        meta=doc.meta)
