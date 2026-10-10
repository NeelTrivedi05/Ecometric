"""Section 2 — LCA methodology: system boundary, module declaration table, cut-off, allocation, data quality."""

from typing import List

from ..charts.system_boundary import system_boundary_svg
from ..context import BuildContext
from ..document import BulletList, Cell, Column, DataTable, Figure, Paragraph
from ..modules import DECLARED, ND, STAGE_GROUPS
from .common import heading, paragraphs


def system_boundary(ctx: BuildContext) -> List:
    scope = f"The scope of this EPD is {ctx.scope.lower()}." if ctx.scope else ""
    return [heading("System boundary", "sub-boundary"),
            *([Paragraph(text=f"{scope} Declared modules are shown in {{{{ref:fig-boundary}}}} and "
                              f"{{{{ref:tbl-modules}}}}.".strip())]),
            Figure(svg=system_boundary_svg(ctx), caption="System boundary of the declared product system",
                   id="fig-boundary")]


def modules_table(ctx: BuildContext) -> List:
    codes = [m for _, mods in STAGE_GROUPS for m in mods]
    cols = [Column(key="label", label="", role="label")] + [Column(key=c, label=c, align="center") for c in codes]

    def mark(c):
        st = ctx.status(c)
        return Cell(text="X" if st == DECLARED else ("ND" if st == ND else "MND"),
                    cls="declared" if st == DECLARED else "mnd")

    rows = [
        [Cell(text="Module", cls="strong")] + [Cell(text=ctx.module_label(c), cls="vertical") for c in codes],
        [Cell(text="Modules declared", cls="strong")] + [mark(c) for c in codes],
    ]
    geos = [ctx.modules[c].geography if c in ctx.modules else None for c in codes]
    if any(geos):
        rows.append([Cell(text="Geography", cls="strong")] +
                    [Cell(text=(g or "") if ctx.status(c) == DECLARED else "", cls="small") for c, g in zip(codes, geos)])
    groups = [{"label": "", "span": 1}] + [{"label": name, "span": len(mods)} for name, mods in STAGE_GROUPS]
    return [heading("Declared life cycle modules", "sub-modules"),
            DataTable(columns=cols, rows=rows, caption="Life cycle modules included in the declaration",
                      id="tbl-modules", style="modules", header_groups=groups,
                      notes=[ctx.text_get("text.mnd_legend")])]


def cut_off(ctx: BuildContext) -> List:
    s = ctx.input.lca_setup
    blocks = [heading("Cut-off criteria", "sub-cutoff")] + paragraphs(s.cut_off_text or ctx.text_get("text.cutoff.default"))
    if s.excluded_flows:
        blocks += [Paragraph(text="The following flows were excluded:"), BulletList(items=list(s.excluded_flows))]
    return blocks


def allocation(ctx: BuildContext) -> List:
    s = ctx.input.lca_setup
    return [heading("Allocation", "sub-allocation")] + paragraphs(s.allocation_text or ctx.text_get("text.allocation.default"))


def data_quality(ctx: BuildContext) -> List:
    s = ctx.input.lca_setup
    blocks = [heading("Data sources and data quality", "sub-dq")]
    blocks += paragraphs(s.data_quality_text or ctx.text_get("text.dataquality.default"))
    dbs = ", ".join(f"{d.name} {d.version or ''}".strip() for d in s.lci_databases)
    sw = f"{s.software.name} {s.software.version or ''}".strip() if s.software else None
    if dbs or sw:
        parts = [f"modelled in {sw}" if sw else None, f"using {dbs}" if dbs else None]
        blocks.append(Paragraph(text="The LCA was " + " ".join(p for p in parts if p) + "."))
    return blocks


SUBSECTIONS = {"system_boundary": system_boundary, "modules_table": modules_table, "cut_off": cut_off,
               "allocation": allocation, "data_quality": data_quality}
