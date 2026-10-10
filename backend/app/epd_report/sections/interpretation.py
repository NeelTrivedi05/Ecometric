"""Section 4 — Interpretation: charts, generated narrative, supplemental results."""

from typing import List

from .. import charts as ch
from ..context import BuildContext
from ..document import Cell, Column, DataTable, Figure, FigureGrid, Paragraph, Section
from ..formatting import format_sci
from ..modules import column_label
from .. import narrative
from .common import heading, paragraphs


def _fu_short(ctx: BuildContext) -> str:
    fu = ctx.functional_unit
    return f"per {fu.description}" if fu else ""


def build_interpretation(ctx: BuildContext, spec) -> Section:
    m = ctx.primary
    enabled = set(ctx.profile.get("charts", []))
    vid0 = ctx.variants[0][0]
    inds = ch.chart_indicators(ctx, m)
    codes = [i.code for i in inds]
    blocks: List = []

    # ---- overview narrative
    primary_code = m.primary_indicator if m.primary_indicator in codes else (codes[0] if codes else None)
    overview = []
    if primary_code:
        s = narrative.product_stage_share(ctx, m, vid0, primary_code)
        if s:
            overview.append(s)
    overview += narrative.dominant_sentences(ctx, m, vid0, codes)
    if overview:
        blocks.append(heading("Contribution analysis", "sub-contribution"))
        intro = f"The interpretation is based on {m.name} results"
        intro += f" for “{ctx.variants[0][1]}”." if len(ctx.variants) > 1 else "."
        blocks.append(Paragraph(text=intro))
        blocks.append(Paragraph(text=" ".join(overview)))

    # ---- module colours shared by all module charts in this document
    dominant = None
    if primary_code:
        row = ctx.results.get((vid0, m.id), {}).get(primary_code)
        dom = ch.dominant_module(ctx, row) if row else None
        if dom and dom[1] > ctx.options.dominant_threshold_pct:
            dominant = dom[0]

    if "moduleStacked" in enabled and inds:
        colors = ch.ModuleColors(ctx, ch.module_magnitudes(ctx, m, codes))
        blocks.append(heading("Results by life cycle module", "sub-charts"))
        if len(ctx.variants) == 1 and len(inds) > 1:
            blocks.append(Figure(svg=ch.module_share_chart(ctx, m, inds, vid0, colors), id="fig-shares",
                                 caption=f"Relative contribution of life cycle modules to each {m.name} indicator "
                                         f"(absolute values); module D excluded"))
        else:
            grid_w = 400 if len(inds) > 1 else 640
            figs = [Figure(svg=ch.module_stacked_chart(ctx, m, i, colors, width=grid_w), id=f"fig-stacked-{i.code}",
                           width="half" if len(inds) > 1 else "full",
                           caption=f"{i.name} ({i.unit}) by life cycle module, {_fu_short(ctx)}; module D excluded")
                    for i in inds]
            blocks.append(FigureGrid(figures=figs) if len(figs) > 1 else figs[0])

    if "excludingDominant" in enabled and primary_code:
        pname = m.indicator(primary_code).name
        if dominant:
            colors = ch.ModuleColors(ctx, ch.module_magnitudes(ctx, m, codes, exclude=dominant))
            svg = ch.excluding_dominant_chart(ctx, m, inds, vid0, dominant, colors)
            blocks.append(heading(f"Contribution of modules excluding {column_label(dominant)}", "sub-excl"))
            blocks.append(Paragraph(text=narrative.excluding_dominant_text(ctx, dominant, pname, "{{ref:fig-excl}}")))
            blocks.append(Figure(svg=svg, id="fig-excl",
                                 caption=f"Relative contribution of life cycle modules excluding "
                                         f"{column_label(dominant)} ({ctx.variants[0][1]})"))
        else:
            s = narrative.no_dominant_text(ctx, pname)
            if s:
                blocks.append(Paragraph(text=s))

    if "materialContribution" in enabled and ctx.input.material_contribution and not ctx.category_mismatch:
        want = primary_code
        items = [(x.material, float(x.share_pct)) for x in ctx.input.material_contribution
                 if x.indicator_code in (None, want)]
        if items:
            label = m.indicator(want).short_name if want else "impact"
            blocks.append(heading("Material contribution", "sub-materials"))
            s = narrative.material_text(ctx, items, m.indicator(want).name if want else "impacts")
            if s:
                blocks.append(Paragraph(text=s))
            blocks.append(Figure(svg=ch.material_chart(ctx, items, label), id="fig-materials",
                                 caption=f"Material contribution to {label} in modules A1–A3"))

    if "variantComparison" in enabled and len(ctx.variants) > 1 and primary_code:
        mods = [x for x in ctx.profile.get("variantComparisonModules", ["A1-A3", "A4", "A5"]) if ctx.is_declared(x)]
        svg = ch.variant_chart(ctx, m, m.indicator(primary_code), mods)
        if svg:
            blocks.append(heading("Comparison of variants", "sub-variants"))
            s = narrative.variant_text(ctx, m, primary_code, mods)
            if s:
                blocks.append(Paragraph(text=s))
            blocks.append(Figure(svg=svg, id="fig-variants",
                                 caption=f"{m.indicator(primary_code).name} for modules "
                                         f"{', '.join(column_label(x) for x in mods)} by variant, {_fu_short(ctx)}"))

    blocks += supplemental(ctx)
    if not blocks:
        blocks.append(Paragraph(text="No interpretation data available for the current selection.", style="note"))
    return Section(id="interpretation", title=spec.get("title"), blocks=blocks, numbered=spec.get("numbered", False),
                   orientation=spec.get("orientation", "portrait"))


def supplemental(ctx: BuildContext) -> List:
    out: List = []
    if ctx.category_mismatch:
        return out
    for i, s in enumerate(ctx.input.supplemental_results):
        method = ctx.registry.method(s.method) if s.method else ctx.primary
        if s.method and method not in ctx.methods:
            ctx.warn("info", "supplemental.method_not_selected",
                     f"Supplemental table “{s.title}” uses {s.method}, which is not selected; it is omitted.")
            continue
        cols = [Column("ind", "Indicator", role="label"), Column("unit", "Unit", role="unit")]
        cols += [Column(f"c{j}", c, align="right") for j, c in enumerate(s.columns)]
        rows = []
        for r in s.rows:
            m = ctx.registry.method(r.method) if r.method else method
            ind = m.indicator(r.indicator_code) or m.match_raw_key(r.indicator_code) if m else None
            if not ind:
                ctx.warn("error", "indicator.unknown", f"Supplemental table “{s.title}”: indicator "
                         f"'{r.indicator_code}' is not in the registry for {m.name if m else 'the method'}.")
                continue
            if not ctx.passes_filter(m, ind):
                continue
            rows.append([Cell(ind.short_name, cls="strong"), Cell(ind.unit or "", cls="unit")] +
                        [Cell(format_sci(r.values.get(c), ctx.options.precision) if r.values.get(c) is not None
                              else "N/A", cls="num") for c in s.columns])
        if not rows:
            continue
        if not out:
            out.append(heading("Supplemental results", "sub-supplemental"))
        out.append(heading(s.title, None, level=3, toc=False))
        out += paragraphs(s.description)
        out.append(DataTable(columns=cols, rows=rows, caption=s.title, id=f"tbl-supp-{i}", style="results"))
    return out
