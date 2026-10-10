"""Assumptions & limitations, references, custom sections."""

from typing import Dict, List

from ..context import BuildContext
from ..document import Paragraph, Section
from .common import heading, markdown_blocks, paragraphs

BASE_REFERENCES = [
    {"citation": "ISO 14025:2006 — Environmental labels and declarations — Type III environmental declarations — "
                 "Principles and procedures. ISO, Geneva."},
    {"citation": "ISO 14040:2006 — Environmental management — Life cycle assessment — Principles and framework. "
                 "ISO, Geneva."},
    {"citation": "ISO 14044:2006 — Environmental management — Life cycle assessment — Requirements and guidelines. "
                 "ISO, Geneva."},
]


def build_assumptions(ctx: BuildContext, spec) -> Section:
    s = ctx.input.lca_setup
    blocks = [heading("Assumptions", "sub-assumptions")]
    blocks += paragraphs(s.assumptions_text or ctx.text_get("text.assumptions.default"))
    blocks.append(heading("Limitations", "sub-limitations"))
    blocks += paragraphs(ctx.text_get("text.limitations.default"))
    comp_key = ctx.standard.comparability_key if ctx.standard else "text.comparability.generic"
    blocks += paragraphs(s.limitations_text or ctx.text_get(comp_key))
    return Section(id="assumptions", title=spec.get("title"), blocks=blocks, numbered=spec.get("numbered", False))


def references_list(ctx: BuildContext) -> List[Dict]:
    refs: List[Dict] = []
    seen = set()

    def add(r):
        c = r["citation"] if isinstance(r, dict) else r.citation
        u = r.get("url") if isinstance(r, dict) else r.url
        if c not in seen:
            seen.add(c)
            refs.append({"citation": c, "url": u})

    for r in BASE_REFERENCES:
        add(r)
    if ctx.standard:
        for r in ctx.standard.references:
            add(r)
    for p in ctx.pcr_parts:
        extra = ", ".join(str(x) for x in (p.publisher, f"v{p.version}" if p.version else None, p.year) if x)
        add({"citation": f"{p.name}{f'. {extra}.' if extra else ''}"})
    for m in ctx.methods:
        for r in m.references:
            add(r)
    for d in ctx.input.lca_setup.lci_databases:
        add({"citation": f"{d.name} {d.version or ''} life cycle inventory database.".replace("  ", " ")})
    for r in ctx.profile.get("references", []):
        add(r)
    for r in ctx.input.references:
        add(r)
    return refs


def build_references(ctx: BuildContext, spec) -> Section:
    refs = references_list(ctx)
    blocks = [Paragraph(text=f"{r['citation']}" + (f" {r['url']}" if r.get("url") else ""), style="reference")
              for r in refs]
    return Section(id="references", title=spec.get("title"), blocks=blocks, numbered=spec.get("numbered", False))


def custom_blocks(title: str, markdown: str) -> List:
    return [heading(title, None, level=2)] + markdown_blocks(markdown)
