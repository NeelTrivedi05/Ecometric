"""
Report builder: a pure function of (input, options, registry, product profile, template)
that returns a numbered Document. Changing any selection simply means calling it again.
"""

import re
from typing import Any, Callable, Dict, List, Optional

from .context import BuildContext, build_context
from .document import Document, Heading, Section, number_document
from .product_categories import get_profile
from .registry import Registry, get_registry
from .schema import EpdReportInput, ReportOptions
from .sections import back, front, general, interpretation, methodology, results
from .templates import apply_overrides, get_template
from .validation import validate

SectionBuilder = Callable[[BuildContext, Dict[str, Any]], Optional[Section]]


def _with_subsections(section_id: str, subs: Dict[str, Callable]) -> SectionBuilder:
    def build(ctx: BuildContext, spec: Dict[str, Any]) -> Optional[Section]:
        blocks: List = []
        for sub in spec.get("subsections", list(subs)):
            fn = subs.get(sub)
            if not fn:
                ctx.warn("warning", "template.unknown_subsection", f"Template subsection '{sub}' is not defined.")
                continue
            blocks += [b for b in fn(ctx) if b is not None]
            blocks += _custom_after(ctx, sub)
        if not blocks:
            return None
        return Section(id=section_id, title=spec.get("title"), blocks=blocks, numbered=spec.get("numbered", False),
                       orientation=spec.get("orientation", "portrait"))
    return build


SECTION_BUILDERS: Dict[str, SectionBuilder] = {
    "cover": front.build_cover,
    "summary": front.build_summary,
    "toc": front.build_toc,
    "general": _with_subsections("general", general.SUBSECTIONS),
    "methodology": _with_subsections("methodology", methodology.SUBSECTIONS),
    "results": results.build_results,
    "interpretation": interpretation.build_interpretation,
    "assumptions": back.build_assumptions,
    "references": back.build_references,
}

SUBSECTION_IDS = set(general.SUBSECTIONS) | set(methodology.SUBSECTIONS)


def _custom_after(ctx: BuildContext, anchor: str) -> List:
    out = []
    for cs in ctx.input.custom_sections:
        if cs.after_section == anchor and anchor in SUBSECTION_IDS:
            out += back.custom_blocks(cs.title, cs.markdown)
    return out


def _slug(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_")[:40] or "x"


def build_document(
    inp: EpdReportInput,
    options: Optional[ReportOptions] = None,
    *,
    registry: Optional[Registry] = None,
    profile: Optional[Dict[str, Any]] = None,
    template: Optional[Dict[str, Any]] = None,
) -> Document:
    options = options or ReportOptions()
    registry = registry or get_registry()
    profile = profile or get_profile(inp.selection.product_category_id)
    template = template or get_template(options.template_id)

    ctx = build_context(inp, options, registry, profile, template)
    if inp.selection.product_category_id != profile["id"]:
        ctx.warn("info", "category.fallback", f"No profile for product category "
                 f"'{inp.selection.product_category_id}'; the generic profile is used.", "selection.productCategoryId")
    validate(ctx)

    sections: List[Section] = []
    known_anchors = {s["id"] for s in template["sections"]} | SUBSECTION_IDS
    for spec in apply_overrides(template, profile.get("sectionOverrides") or {}):
        builder = SECTION_BUILDERS.get(spec["id"])
        if builder is None:
            ctx.warn("warning", "template.unknown_section", f"Template section '{spec['id']}' has no builder.")
            continue
        sec = builder(ctx, spec)
        if sec is not None:
            sections.append(sec)
        for cs in inp.custom_sections:
            if cs.after_section == spec["id"]:
                sections.append(Section(id=f"custom-{_slug(cs.title)}", title=cs.title, custom=True, numbered=True,
                                        blocks=back.markdown_blocks(cs.markdown)))
    for cs in inp.custom_sections:
        if cs.after_section not in known_anchors:
            ctx.warn("warning", "custom_section.anchor", f"Custom section “{cs.title}”: unknown afterSection "
                     f"'{cs.after_section}'; it was placed before the references.", "customSections")
            idx = next((i for i, s in enumerate(sections) if s.id == "references"), len(sections))
            sections.insert(idx, Section(id=f"custom-{_slug(cs.title)}", title=cs.title, custom=True, numbered=True,
                                         blocks=back.markdown_blocks(cs.markdown)))

    meta = inp.meta
    method_names = [m.name for m in ctx.methods]
    errors = [w for w in ctx.warnings if w.level == "error"]
    date_part = options.build_date or meta.issue_date or "undated"
    filename = (f"EPD_{_slug(inp.product.name)}_{'+'.join(_slug(n) for n in method_names)}_"
                f"{_slug(date_part)}.pdf")
    doc = Document(
        title=f"Environmental Product Declaration — {inp.product.name}",
        sections=sections,
        meta={
            "productName": inp.product.name,
            "declarationNumber": meta.declaration_number,
            "selection": {
                "standard": ctx.standard.name if ctx.standard else inp.selection.standard,
                "methods": method_names,
                "primaryMethod": ctx.primary.name,
                "indicatorFilter": inp.selection.indicator_filter,
                "productCategoryId": profile["id"],
                "variantIds": [v for v, _ in ctx.variants],
            },
            "buildDate": options.build_date,
        },
        header_text=f"EPD: {inp.product.name}",
        footer={"logo": inp.manufacturer.logo or meta.branding.logo, "declarationNumber": meta.declaration_number,
                "manufacturer": inp.manufacturer.name},
        branding={"primaryColor": meta.branding.primary_color},
        paper=options.paper,
        draft=bool(errors) and options.draft_watermark_on_errors,
        filename=filename,
    )
    for ref, sec in number_document(doc):
        ctx.warn("warning", "xref.unresolved", f"Cross-reference '{ref}' in section '{sec}' does not resolve "
                 f"(the referenced table/figure is not in this selection).")
    doc.warnings = [w.model_dump(by_alias=True) for w in ctx.warnings]
    return doc
