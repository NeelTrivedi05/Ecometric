"""Section 3 — LCA results: indicator definitions per method, results tables per variant/method/group."""

from typing import Dict, List, Optional

from ..context import BuildContext, ResultRowView
from ..document import Cell, Column, DataTable, Footnote, Paragraph, Section
from ..formatting import format_sci
from ..modules import AGGREGATES, DECLARED, ND, column_label, is_number, select_columns, split_columns
from ..registry import Method
from .. import narrative
from .common import SUPERSCRIPTS, heading, paragraphs

TOTAL_SOURCE = ["A1-A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "C1-C4"]


def _per_label(ctx: BuildContext) -> str:
    fu = ctx.functional_unit
    if not fu:
        return ""
    lab = fu.unit_label or fu.description
    return lab if lab.lower().startswith("per ") else f"per {lab}"


def definition_table(ctx: BuildContext, method: Method) -> Optional[DataTable]:
    shown = set()
    for vid, _ in ctx.variants:
        shown |= {r.indicator.code for r in ctx.rows(vid, method)}
    inds = [i for i in method.indicators if i.code in shown]
    if not inds:
        return None
    cols = [Column("cat", "Impact category / parameter", role="label"), Column("abbr", "Abbreviation"),
            Column("name", "Indicator"), Column("unit", "Unit", role="unit")]
    rows = [[Cell(i.category), Cell(i.short_name, cls="strong"), Cell(i.name), Cell(i.unit or "")] for i in inds]
    return DataTable(columns=cols, rows=rows, id=f"tbl-def-{method.id}",
                     caption=f"Parameters describing environmental impacts — {method.name}")


def _cell(ctx: BuildContext, row: ResultRowView, code: str) -> Cell:
    st = ctx.status(code)
    if st != DECLARED:
        return Cell(text="ND" if st == ND else "MND", cls="mnd")
    v = row.values.get(code)
    cls = "num aggregate" if code in AGGREGATES else "num"
    return Cell(text=format_sci(v, ctx.options.precision) if is_number(v) else "N/A", cls=cls)


def results_tables(ctx: BuildContext, method: Method, group: str, variant_id: str) -> List[DataTable]:
    rows = ctx.rows(variant_id, method, group)
    if not rows:
        return []
    cols_all = select_columns(ctx.statuses, ctx.options.column_mode)
    show_total = ctx.options.show_total
    parts = split_columns(cols_all, ctx.options.max_columns_per_table - (1 if show_total else 0))

    # footnotes: indicator-level then group-level, numbered per table
    keys: List[str] = []
    for r in rows:
        for fn in r.indicator.footnotes:
            if fn not in keys:
                keys.append(fn)
    group_keys = [k for k in method.group_footnotes.get(group, []) if k not in keys]
    if group_keys and not any(r.indicator.code.startswith("GWP") for r in rows):
        group_keys = []
    marks: Dict[str, str] = {k: SUPERSCRIPTS[i] if i < len(SUPERSCRIPTS) else str(i + 1)
                             for i, k in enumerate(keys + group_keys)}
    footnotes = [Footnote(mark=marks[k], text=ctx.text_get(k) or method.footnotes.get(k, k)) for k in keys + group_keys]

    variant = ctx.variant_label(variant_id)
    vsuffix = f", {variant}" if len(ctx.variants) > 1 else ""
    caption = f"{method.group_title(group)} — {method.name}{vsuffix} ({_per_label(ctx)})".replace(" ()", "")
    tables = []
    for pi, cols in enumerate(parts):
        last = pi == len(parts) - 1
        columns = [Column("ind", "Indicator", role="label"), Column("unit", "Unit", role="unit")]
        columns += [Column(c, column_label(c), align="right", highlight=c in AGGREGATES) for c in cols]
        if show_total and last:
            columns.append(Column("total", "Total", align="right", highlight=True))
        body = []
        for r in rows:
            label = Cell(r.indicator.short_name, marks=[marks[k] for k in r.indicator.footnotes if k in marks],
                         cls="strong")
            line = [label, Cell(r.indicator.unit or "", cls="unit")] + [_cell(ctx, r, c) for c in cols]
            if show_total and last:
                tot = sum(float(r.values.get(c) or 0.0) for c in TOTAL_SOURCE if ctx.status(c) == DECLARED)
                line.append(Cell(format_sci(tot, ctx.options.precision), cls="num aggregate"))
            body.append(line)
        notes = []
        if show_total and last:
            notes.append("Total = sum of modules A1–C4; module D is reported separately and not included.")
        tables.append(DataTable(
            columns=columns, rows=body, style="results",
            id=f"tbl-res-{variant_id}-{method.id}-{group}".replace(" ", "_") if pi == 0 else None,
            caption=caption, footnotes=footnotes if last else [], notes=notes,
            part=f"Part {pi + 1} of {len(parts)}" if len(parts) > 1 else None,
        ))
    return tables


def build_results(ctx: BuildContext, spec) -> Section:
    blocks: List = []
    intro = narrative.results_intro(ctx)
    if intro:
        blocks.append(Paragraph(text=intro, style="lead"))
    blocks.append(Paragraph(text=f"{ctx.text_get('text.mnd_legend')} {ctx.text_get('text.results_note')}",
                            style="note"))

    blocks.append(heading("Indicator definitions", "sub-definitions"))
    for m in ctx.methods:
        t = definition_table(ctx, m)
        if t:
            blocks.append(t)

    for vid, vlabel in ctx.variants:
        title = f"Results — {vlabel}" if len(ctx.variants) > 1 else "Results"
        blocks.append(heading(title, f"sub-results-{vid}"))
        for m in ctx.methods:
            groups = ctx.shown_groups(m)
            if len(ctx.methods) > 1 and groups:
                blocks.append(heading(m.name, None, level=3, toc=False))
            for g in groups:
                blocks += results_tables(ctx, m, g, vid)

    biogenic = ctx.input.lca_setup.biogenic_carbon_text or ctx.text_get(
        ctx.standard.biogenic_carbon_key if ctx.standard and ctx.standard.biogenic_carbon_key else "text.biogenic.generic")
    if biogenic:
        blocks.append(heading("Biogenic carbon", "sub-biogenic"))
        blocks += paragraphs(biogenic)
    return Section(id="results", title=spec.get("title"), blocks=blocks, numbered=spec.get("numbered", False),
                   orientation=spec.get("orientation", "landscape"))
