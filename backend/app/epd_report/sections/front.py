"""Cover page, declaration summary table and table of contents."""

from typing import List, Optional

from ..context import BuildContext
from ..document import Cover, KeyValueTable, Section, TocBlock
from ..formatting import format_number
from ..validation import computed_valid_until
from .common import compact, kv, nd, qty


def standards_list(ctx: BuildContext) -> List[str]:
    out: List[str] = []
    for s in (ctx.standard.standards_text if ctx.standard else []) + list(ctx.input.pcr.standards):
        if s not in out:
            out.append(s)
    return out


def build_cover(ctx: BuildContext, spec) -> Section:
    inp = ctx.input
    img = inp.meta.branding.cover_image or (inp.product.images[0].data if inp.product.images else None)
    cover = Cover(
        title="Environmental Product Declaration",
        product_name=inp.product.name,
        subtitle=", ".join(standards_list(ctx)) or None,
        manufacturer_name=inp.manufacturer.name,
        manufacturer_logo=inp.manufacturer.logo or inp.meta.branding.logo,
        program_operator_name=inp.program_operator.name,
        program_operator_logo=inp.program_operator.logo,
        product_image=img,
        declaration_number=inp.meta.declaration_number,
        issue_date=inp.meta.issue_date,
        valid_until=inp.meta.valid_until or _iso(computed_valid_until(ctx)),
        standards=standards_list(ctx),
    )
    return Section(id="cover", title=None, blocks=[cover], toc=False)


def _iso(d) -> Optional[str]:
    return d.isoformat() if d else None


def _pcr_lines(ctx: BuildContext) -> List[str]:
    lines = []
    for p in ctx.pcr_parts:
        extra = ", ".join(str(x) for x in (p.publisher, f"v{p.version}" if p.version else None, p.year) if x)
        lines.append(f"{p.name}{f' ({extra})' if extra else ''}")
    return lines


def _org_lines(org) -> List[str]:
    return [x for x in [org.name, *(org.address or "").splitlines(), org.website] if x]


def _person(p) -> Optional[str]:
    if not p or not (p.name or p.organization):
        return None
    return ", ".join(x for x in (p.name, p.organization) if x)


def build_summary(ctx: BuildContext, spec) -> Section:
    inp, meta = ctx.input, ctx.input.meta
    fu = ctx.functional_unit
    fu_text = None
    if fu:
        fu_text = f"{inp.product.name}. {'Functional' if fu.type == 'functional' else 'Declared'} unit: {fu.description}"
    valid = meta.valid_until or _iso(computed_valid_until(ctx))
    validity = " — ".join(x for x in (meta.validity_period_text, f"valid until {valid}" if valid else None) if x)
    methods = "; ".join(f"{m.name}" + (f" (version {m.version})" if m.version and m.version not in m.name else "")
                        for m in ctx.methods)
    sw = inp.lca_setup.software
    v = inp.verification
    comp_key = ctx.standard.comparability_key if ctx.standard else "text.comparability.generic"
    limitations = inp.lca_setup.limitations_text or ctx.text_get(comp_key)
    rsl = qty(inp.product.reference_service_life)
    rows = compact([
        kv("Program operator", _org_lines(inp.program_operator), ctx, type="lines"),
        kv("General program instructions", inp.program_operator.general_program_instructions, ctx, keep_empty=False),
        kv("Manufacturer name and address", _org_lines(inp.manufacturer), ctx, type="lines"),
        kv("Declaration number", meta.declaration_number, ctx),
        kv("Declared product & functional unit", fu_text, ctx),
        kv("Reference PCR", _pcr_lines(ctx), ctx, type="lines"),
        kv("Description of product use", inp.product.intended_application, ctx, keep_empty=False),
        kv("Product reference service life (RSL)", rsl, ctx, keep_empty=False),
        kv("Markets of applicability", ", ".join(meta.markets_of_applicability), ctx),
        kv("Date of issue", meta.issue_date, ctx),
        kv("Period of validity", validity, ctx),
        kv("EPD type", meta.epd_type, ctx),
        kv("Range of dataset variability", meta.range_of_dataset_variability, ctx, keep_empty=False),
        kv("EPD scope", ctx.scope, ctx),
        kv("Year(s) of reported primary data", str(meta.reference_year_of_primary_data)
           if meta.reference_year_of_primary_data else None, ctx),
        kv("LCA software & version", f"{sw.name} {sw.version or ''}".strip() if sw else None, ctx),
        kv("LCI database(s) & version", [f"{d.name} {d.version or ''}".strip() for d in inp.lca_setup.lci_databases],
           ctx, type="lines"),
        kv("LCIA methodology & version", methods, ctx),
        kv("Standards", ", ".join(standards_list(ctx)), ctx, keep_empty=False),
        kv("PCR review panel", [_person(p) for p in inp.pcr.review_panel if _person(p)], ctx, type="lines",
           keep_empty=False),
        kv("Independent verification of the declaration and data, according to ISO 14025:2006",
           "external" if v.type == "external" else ("internal" if v.type == "internal" else None),
           ctx, type="checkbox", choices=["internal", "external"]),
        kv("EPD verifier", _person(v.epd_verifier), ctx, type="signature",
           image=v.epd_verifier.signature_image if v.epd_verifier else None),
        kv("LCA conducted by", _person(v.lca_practitioner), ctx),
        kv("LCA verified by", _person(v.lca_verifier), ctx, type="signature",
           image=v.lca_verifier.signature_image if v.lca_verifier else None, keep_empty=v.lca_verifier is not None),
        kv("Limitations", limitations, ctx),
    ])
    table = KeyValueTable(rows=rows, variant="summary", id="tbl-summary")
    return Section(id="summary", title=spec.get("title"), blocks=[table], toc=True)


def build_toc(ctx: BuildContext, spec) -> Optional[Section]:
    if not ctx.options.include_toc:
        return None
    return Section(id="toc", title=spec.get("title", "Contents"), blocks=[TocBlock()], toc=False)
