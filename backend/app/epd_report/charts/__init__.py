"""
Chart engine: builds report charts from the BuildContext. Every series comes
from data; module colours are assigned once per document (canonical module
order) so a module keeps its colour across all figures.
"""

from typing import Dict, List, Optional, Sequence, Tuple

from ..context import BuildContext, ResultRowView
from ..modules import column_label
from ..registry import Indicator, Method
from .svg import OTHER, PALETTE, ranked_bars, stacked_bars

CONTRIBUTION_ORDER = ["A1-A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "C1-C4"]
MAX_SERIES = len(PALETTE)  # 8th+ series fold into "Other"


def contribution_modules(ctx: BuildContext) -> List[str]:
    """Display modules for contribution analysis (D excluded: benefits beyond the system boundary)."""
    return [m for m in CONTRIBUTION_ORDER if ctx.is_declared(m)]


def module_values(row: ResultRowView, modules: Sequence[str]) -> Dict[str, float]:
    return {m: float(row.values.get(m) or 0.0) for m in modules}


def chart_palette(ctx: BuildContext) -> List[str]:
    custom = getattr(ctx.input.meta.branding, "chart_palette", None)
    return list(custom) if custom else PALETTE


class ModuleColors:
    """
    Document-level module → colour mapping. When more modules are active than the
    palette has slots, the largest contributors keep their own colour and the
    smallest fold into a neutral 'Other' series. Colours are assigned in canonical
    module order, so a module keeps its colour across every chart that shares
    this mapping.
    """

    def __init__(self, ctx: BuildContext, magnitudes: Dict[str, float]):
        pal = chart_palette(ctx)
        active = [m for m in CONTRIBUTION_ORDER if magnitudes.get(m, 0.0) > 0]
        if len(active) > len(pal):
            ranked = sorted(active, key=lambda m: -magnitudes[m])
            keep_set = set(ranked[:len(pal) - 1])
        else:
            keep_set = set(active)
        keep = [m for m in active if m in keep_set]
        self.colors = {m: pal[i] for i, m in enumerate(keep)}
        self.folded = [m for m in active if m not in keep_set]

    def series(self, ctx: BuildContext, per_category: List[Dict[str, float]]):
        out = []
        for m, color in self.colors.items():
            out.append((f"{column_label(m)} {ctx.module_label(m)}", color, [c.get(m, 0.0) for c in per_category]))
        if self.folded:
            out.append((f"Other ({', '.join(column_label(m) for m in self.folded)})", OTHER,
                        [sum(c.get(m, 0.0) for m in self.folded) for c in per_category]))
        return out


def module_magnitudes(ctx: BuildContext, method: Method, codes: Sequence[str],
                      exclude: Optional[str] = None) -> Dict[str, float]:
    """Sum over indicators/variants of each module's share of the row total (unit-free, so indicators
    with different magnitudes weigh equally)."""
    mods = [m for m in contribution_modules(ctx) if m != exclude]
    mags = {m: 0.0 for m in mods}
    for vid, _ in ctx.variants:
        rows = ctx.results.get((vid, method.id), {})
        for c in codes:
            row = rows.get(c)
            if not row:
                continue
            vals = {m: abs(float(row.values.get(m) or 0.0)) for m in mods}
            tot = sum(vals.values())
            if tot > 0:
                for m in mods:
                    mags[m] += vals[m] / tot
    return mags


def dominant_module(ctx: BuildContext, row: ResultRowView) -> Optional[Tuple[str, float]]:
    vals = module_values(row, contribution_modules(ctx))
    tot = sum(abs(v) for v in vals.values())
    if tot <= 0:
        return None
    m = max(vals, key=lambda k: abs(vals[k]))
    return m, abs(vals[m]) / tot * 100.0


def unit_text(ind: Indicator, ctx: BuildContext) -> str:
    fu = ctx.functional_unit
    per = fu.unit_label or fu.description if fu else None
    return f"{ind.short_name} [{ind.unit}{' ' + per if per and per.startswith('per') else (' per ' + per if per else '')}]"


def chart_indicators(ctx: BuildContext, method: Method) -> List[Indicator]:
    mand = ctx.mandatory_codes(method)
    inds = [i for i in method.indicators if i.code in mand and i.group == "core impact"]
    wanted = ctx.profile.get("chartIndicators", {}).get(method.id)
    if wanted:
        inds = [i for i in method.indicators if i.code in wanted]
    present = set()
    for vid, _ in ctx.variants:
        present |= set(ctx.results.get((vid, method.id), {}))
    return [i for i in inds if i.code in present]


def module_stacked_chart(ctx: BuildContext, method: Method, ind: Indicator, colors: ModuleColors,
                         width: float = 640) -> str:
    cats, per_cat = [], []
    for vid, vlabel in ctx.variants:
        row = ctx.results.get((vid, method.id), {}).get(ind.code)
        if not row:
            continue
        cats.append(vlabel)
        per_cat.append(module_values(row, contribution_modules(ctx)))
    return stacked_bars(cats, colors.series(ctx, per_cat), title=f"{ind.name} by module",
                        value_label=unit_text(ind, ctx), orientation="vertical", width=width)


def module_share_chart(ctx: BuildContext, method: Method, inds: List[Indicator], variant_id: str,
                       colors: ModuleColors) -> str:
    """One horizontal 100% bar per indicator (used when there is a single variant)."""
    rows = ctx.results.get((variant_id, method.id), {})
    cats, per_cat = [], []
    for ind in inds:
        row = rows.get(ind.code)
        if row:
            cats.append(ind.short_name)
            per_cat.append(module_values(row, contribution_modules(ctx)))
    return stacked_bars(cats, colors.series(ctx, per_cat), title="Relative contribution of life cycle modules",
                        value_label="Share of total (absolute values), module D excluded",
                        orientation="horizontal", percent=True)


def excluding_dominant_chart(ctx: BuildContext, method: Method, inds: List[Indicator], variant_id: str,
                             dominant: str, colors: ModuleColors) -> str:
    rows = ctx.results.get((variant_id, method.id), {})
    cats, per_cat = [], []
    for ind in inds:
        row = rows.get(ind.code)
        if not row:
            continue
        cats.append(ind.short_name)
        vals = module_values(row, contribution_modules(ctx))
        vals.pop(dominant, None)
        per_cat.append(vals)
    return stacked_bars(cats, colors.series(ctx, per_cat),
                        title=f"Relative contribution of modules excluding {column_label(dominant)}",
                        value_label=f"Share of total, excluding {column_label(dominant)} (absolute values)",
                        orientation="horizontal", percent=True)


def material_chart(ctx: BuildContext, items: List[Tuple[str, float]], ind_label: str) -> str:
    items = sorted(items, key=lambda x: -x[1])
    return ranked_bars([m for m, _ in items], [v for _, v in items], title=f"Material contribution to {ind_label}",
                       value_label=f"Share of A1–A3 {ind_label} (%)", color=chart_palette(ctx)[0])


def variant_chart(ctx: BuildContext, method: Method, ind: Indicator, modules: List[str]) -> Optional[str]:
    modules = [m for m in modules if ctx.is_declared(m)]
    if not modules:
        return None
    pal = chart_palette(ctx)
    cats, per_cat = [], []
    for vid, vlabel in ctx.variants:
        row = ctx.results.get((vid, method.id), {}).get(ind.code)
        if row:
            cats.append(vlabel)
            per_cat.append(module_values(row, modules))
    series = [(f"{column_label(m)} {ctx.module_label(m)}", pal[i % len(pal)], [c[m] for c in per_cat])
              for i, m in enumerate(modules[:len(pal)])]
    return stacked_bars(cats, series, title=f"{ind.name}, modules {column_label(modules[0])} to "
                        f"{column_label(modules[-1])}, by variant", value_label=unit_text(ind, ctx),
                        orientation="horizontal" if len(cats) > 4 else "vertical")
