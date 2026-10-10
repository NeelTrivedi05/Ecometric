"""
Deterministic narrative engine. Every sentence is a text-library template
filled from data; a sentence whose inputs are missing is skipped rather than
printed with blanks. No LLM calls in the generation path.
"""

import math
from typing import List, Optional

from .charts import contribution_modules, dominant_module, module_values
from .context import BuildContext
from .formatting import format_number, format_sci
from .modules import column_label
from .registry import Method


def results_intro(ctx: BuildContext) -> Optional[str]:
    fu = ctx.functional_unit
    return ctx.text.fill("nar.results_intro", fu=fu.description if fu else None)


def lifetime_clause(ctx: BuildContext) -> str:
    esl = ctx.input.product.building_estimated_service_life
    if esl and esl.value and any(ctx.is_declared(m) for m in ("B1", "B2", "B3", "B4", "B5", "B6", "B7")):
        return ctx.text.fill("nar.lifetime_clause", years=format_number(esl.value)) or ""
    return ""


def dominant_sentences(ctx: BuildContext, method: Method, variant_id: str, codes: List[str]) -> List[str]:
    out = []
    rows = ctx.results.get((variant_id, method.id), {})
    for code in codes:
        row = rows.get(code)
        if not row:
            continue
        dom = dominant_module(ctx, row)
        if not dom:
            continue
        m, share = dom
        s = ctx.text.fill("nar.dominant_module", module=column_label(m), module_label=ctx.module_label(m),
                          share=f"{share:.1f}", indicator=row.indicator.name.lower(),
                          lifetime_clause=lifetime_clause(ctx))
        if s:
            out.append(s)
    return out


def replacements(ctx: BuildContext) -> Optional[int]:
    b4 = ctx.scenarios.B4
    if b4 and b4.replacement_cycles is not None:
        return int(b4.replacement_cycles)
    p = ctx.input.product
    rsl, esl = p.reference_service_life, p.building_estimated_service_life
    if rsl and esl and rsl.value and esl.value:
        return max(0, math.ceil(float(esl.value) / float(rsl.value)) - 1)
    return None


def replacement_sentence(ctx: BuildContext) -> Optional[str]:
    p = ctx.input.product
    rsl, esl = p.reference_service_life, p.building_estimated_service_life
    if not (rsl and esl and rsl.value and esl.value):
        return None
    return ctx.text.fill("nar.replacement", rsl=format_number(rsl.value), esl=format_number(esl.value),
                         replacements=replacements(ctx))


def transport_sentences(ctx: BuildContext) -> List[str]:
    a4 = ctx.scenarios.A4
    if not a4:
        return []
    out = []
    for leg in a4.legs:
        vehicle = leg.vehicle_type
        clause = ctx.text.fill("nar.a4_vehicle", vehicle=vehicle) if vehicle else ""
        s = ctx.text.fill("nar.a4_leg", mode=leg.mode, distance=format_number(leg.distance_km)
                          if leg.distance_km is not None else None, vehicle_clause=clause or "")
        if s:
            out.append(s)
    return out


def installation_sentences(ctx: BuildContext) -> List[str]:
    a5 = ctx.scenarios.A5
    if not a5:
        return []
    out = []
    if a5.product_loss_pct is not None:
        out.append(ctx.text.fill("nar.a5_loss", loss=format_number(a5.product_loss_pct)))
    energy = [f"{format_number(e.amount)} {e.unit or ''} of {(e.type or e.carrier or e.name or 'energy').lower()}".strip()
              for e in a5.energy_carriers if e.amount is not None]
    if energy:
        out.append(ctx.text.fill("nar.a5_energy", energy=_join(energy)))
    return [s for s in out if s]


def eol_sentences(ctx: BuildContext) -> List[str]:
    eol = ctx.scenarios.C1_C4
    if not eol:
        return []
    routes = []
    for key, verb in (("reuse", "reused"), ("recycling", "recycled"), ("energy_recovery", "sent to energy recovery"),
                      ("incineration", "incinerated"), ("landfill", "landfilled")):
        a = getattr(eol, key)
        if a and a.amount is not None:
            routes.append(f"{format_number(a.amount)} {a.unit or ''} {verb}".replace("  ", " "))
    if not routes:
        return []
    s = ctx.text.fill("nar.eol_routes", routes=_join(routes))
    return [s] if s else []


def product_stage_share(ctx: BuildContext, method: Method, variant_id: str, code: str) -> Optional[str]:
    row = ctx.results.get((variant_id, method.id), {}).get(code)
    if not row or not ctx.is_declared("A1-A3"):
        return None
    vals = module_values(row, contribution_modules(ctx))
    tot = sum(abs(v) for v in vals.values())
    if tot <= 0:
        return None
    return ctx.text.fill("nar.product_stage_share", share=f"{abs(vals.get('A1-A3', 0.0)) / tot * 100:.1f}",
                         indicator=row.indicator.name.lower())


def excluding_dominant_text(ctx: BuildContext, module: str, indicator_name: str, figure_ref: str) -> Optional[str]:
    return ctx.text.fill("nar.excluding_dominant", module=column_label(module),
                         threshold=format_number(ctx.options.dominant_threshold_pct),
                         indicator=indicator_name.lower(), figure=figure_ref)


def no_dominant_text(ctx: BuildContext, indicator_name: str) -> Optional[str]:
    return ctx.text.fill("nar.no_dominant", threshold=format_number(ctx.options.dominant_threshold_pct),
                         indicator=indicator_name.lower())


def material_text(ctx: BuildContext, items: List[tuple], indicator_name: str) -> Optional[str]:
    items = sorted(items, key=lambda x: -x[1])
    if not items:
        return None
    if len(items) == 1:
        return ctx.text.fill("nar.material_top_single", material=items[0][0], share=f"{items[0][1]:.1f}",
                             indicator=indicator_name.lower())
    return ctx.text.fill("nar.material_top", material=items[0][0], share=f"{items[0][1]:.1f}",
                         second=f"{items[1][0]} ({items[1][1]:.1f}%)", indicator=indicator_name.lower())


def variant_text(ctx: BuildContext, method: Method, code: str, modules: List[str]) -> Optional[str]:
    totals = []
    for vid, vlabel in ctx.variants:
        row = ctx.results.get((vid, method.id), {}).get(code)
        if row:
            totals.append((vlabel, sum(float(row.values.get(m) or 0.0) for m in modules)))
    if len(totals) < 2:
        return None
    lo = min(totals, key=lambda t: t[1])
    hi = max(totals, key=lambda t: t[1])
    ind = method.indicator(code)
    return ctx.text.fill("nar.variant_comparison", indicator=ind.name.lower(),
                         modules=f"{column_label(modules[0])}–{column_label(modules[-1])}" if len(modules) > 1
                         else column_label(modules[0]),
                         min_value=format_sci(lo[1]), max_value=format_sci(hi[1]), unit=ind.unit,
                         min_variant=lo[0], max_variant=hi[0])


def _join(items: List[str]) -> str:
    if len(items) <= 1:
        return "".join(items)
    return ", ".join(items[:-1]) + " and " + items[-1]
