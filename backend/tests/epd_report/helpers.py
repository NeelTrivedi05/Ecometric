"""Small helpers to inspect a built Document."""

from app.epd_report import build_document, parse_input
from app.epd_report.document import DataTable, Figure, FigureGrid, Heading, KeyValueTable, Paragraph
from app.epd_report.schema import ReportOptions


def build(data, **opts):
    return build_document(parse_input(data), ReportOptions.model_validate(opts))


def tables(doc, section=None):
    out = []
    for s, b in doc.iter_blocks():
        if isinstance(b, (DataTable, KeyValueTable)) and (section is None or s.id == section):
            out.append(b)
    return out


def figures(doc):
    return [b for _, b in doc.iter_blocks() if isinstance(b, Figure)]


def headings(doc, section=None):
    return [b.text for s, b in doc.iter_blocks() if isinstance(b, Heading) and (section is None or s.id == section)]


def all_text(doc) -> str:
    """Every visible string in the document (no SVG markup)."""
    parts = []
    for s in doc.sections:
        parts.append(s.title or "")
    for _, b in doc.iter_blocks():
        if isinstance(b, (Heading, Paragraph)):
            parts.append(b.text)
        elif isinstance(b, DataTable):
            parts += [b.caption or "", *(c.label for c in b.columns), *(f.text for f in b.footnotes), *b.notes]
            parts += [c.text for row in b.rows for c in row]
        elif isinstance(b, KeyValueTable):
            for r in b.rows:
                parts += [r.label, r.value if isinstance(r.value, str) else " ".join(r.value or [])]
        elif isinstance(b, Figure):
            parts.append(b.caption or "")
    return "\n".join(parts)


def result_tables(doc):
    return [t for t in tables(doc, "results") if isinstance(t, DataTable) and t.style == "results"]


def kv_value(doc, label):
    for t in tables(doc, "summary"):
        for r in t.rows:
            if r.label == label:
                return r.value
    return None


def warnings(doc, level=None):
    return [w for w in doc.warnings if level is None or w["level"] == level]


def codes(doc, level=None):
    return {w["code"] for w in warnings(doc, level)}
