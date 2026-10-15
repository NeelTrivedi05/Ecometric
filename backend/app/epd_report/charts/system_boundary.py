"""
System boundary diagram (SVG) generated from the module declaration and the
actual inputs: materials, energy carriers and waste routes. Declared modules
are filled, undeclared ones are outlined and marked MND/ND; the dashed line
encloses the declared system, module D sits outside it.
"""

from html import escape
from typing import List

from ..context import BuildContext
from ..modules import DECLARED, STAGE_GROUPS
from .svg import FONT, TEXT, TEXT_2

ACCENT_FALLBACK = "#1f4e79"


def _wrap_text(s: str, max_chars: int) -> List[str]:
    words, lines, cur = str(s).split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > max_chars and cur:
            lines.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    if cur:
        lines.append(cur)
    return lines[:2]


def _inputs(ctx: BuildContext) -> List[str]:
    items: List[str] = []
    mc = ctx.material_composition
    if mc and mc.items:
        top = sorted(mc.items, key=lambda i: -(i.mass or i.percentage or 0))[:4]
        items += [i.material for i in top]
        if len(mc.items) > 4:
            items.append(f"+{len(mc.items) - 4} other materials")
    mf = ctx.input.manufacturing
    if mf:
        items += [e.carrier for e in mf.energy_inputs[:3]]
    return items[:7]


def _outputs(ctx: BuildContext) -> List[str]:
    out: List[str] = []
    mf = ctx.input.manufacturing
    if mf:
        out += [w.type + (f" ({w.route})" if w.route else "") for w in mf.wastes[:3]]
    eol = ctx.scenarios.C1_C4
    if eol:
        for key, label in (("recycling", "Recycling"), ("landfill", "Landfill"), ("incineration", "Incineration"),
                           ("energy_recovery", "Energy recovery"), ("reuse", "Reuse")):
            if getattr(eol, key) is not None:
                out.append(label)
    return out[:6]


def system_boundary_svg(ctx: BuildContext, accent: str = None) -> str:
    accent = accent or ctx.input.meta.branding.primary_color or ACCENT_FALLBACK
    W, top = 900, 92
    gap = 10
    col_w = (W - 40 - gap * 4) / 5
    box_h, box_gap = 30, 6
    max_rows = max(len(m) for _, m in STAGE_GROUPS)
    body_h = max_rows * (box_h + box_gap) + 44
    H = top + body_h + 110
    el: List[str] = []

    inputs, outputs = _inputs(ctx), _outputs(ctx)
    # inputs strip
    el.append(f'<text x="20" y="22" font-size="12" font-weight="600" fill="{TEXT}">Inputs</text>')
    el.append(f'<text x="80" y="22" font-size="11" fill="{TEXT_2}">'
              f'{escape(" · ".join(inputs) if inputs else "Raw materials, energy, water")}</text>')
    el.append(f'<line x1="20" y1="34" x2="{W - 20}" y2="34" stroke="#d9d8d3"/>')

    declared_cols = [i for i, (_, mods) in enumerate(STAGE_GROUPS) if any(ctx.status(m) == DECLARED for m in mods)]
    x_of = lambda i: 20 + i * (col_w + gap)
    # dashed boundary around declared stages A–C
    in_scope = [i for i in declared_cols if i < 4]
    if in_scope:
        bx0 = x_of(min(in_scope)) - 6
        bx1 = x_of(max(in_scope)) + col_w + 6
        el.append(f'<rect x="{bx0:.1f}" y="{top - 40}" width="{bx1 - bx0:.1f}" height="{body_h + 46}" rx="6" '
                  f'fill="none" stroke="{accent}" stroke-width="1.5" stroke-dasharray="6 4"/>')
        el.append(f'<text x="{bx0 + 8:.1f}" y="{top + body_h + 20}" font-size="10" fill="{accent}" '
                  f'font-weight="600">System boundary</text>')

    for i, (stage, mods) in enumerate(STAGE_GROUPS):
        x = x_of(i)
        any_decl = any(ctx.status(m) == DECLARED for m in mods)
        for j, line in enumerate(_wrap_text(stage, 24)):
            el.append(f'<text x="{x + col_w / 2:.1f}" y="{top - 22 + j * 13}" font-size="11" font-weight="600" '
                      f'text-anchor="middle" fill="{TEXT if any_decl else TEXT_2}">{escape(line)}</text>')
        for k, m in enumerate(mods):
            y = top + k * (box_h + box_gap)
            st = ctx.status(m)
            label = ctx.module_label(m)
            if st == DECLARED:
                el.append(f'<rect x="{x:.1f}" y="{y}" width="{col_w:.1f}" height="{box_h}" rx="4" fill="{accent}"/>')
                fill_t, sub = "#ffffff", ""
            else:
                el.append(f'<rect x="{x:.1f}" y="{y}" width="{col_w:.1f}" height="{box_h}" rx="4" fill="#ffffff" '
                          f'stroke="#c8c7c1"/>')
                fill_t, sub = TEXT_2, f" ({'MND' if st in ('MND', 'not relevant') else st})"
            el.append(f'<text x="{x + 8:.1f}" y="{y + 19}" font-size="10.5" fill="{fill_t}">'
                      f'<tspan font-weight="700">{m}</tspan> {escape(label[:30])}{escape(sub)}</text>')
        if i < 4:
            ax = x + col_w + 1
            ay = top + 15
            el.append(f'<path d="M{ax:.1f},{ay} l{gap - 3},0" stroke="#8d8c86" stroke-width="1.5" '
                      f'marker-end="url(#sb-arrow)"/>')

    el.append(f'<line x1="20" y1="{H - 52}" x2="{W - 20}" y2="{H - 52}" stroke="#d9d8d3"/>')
    el.append(f'<text x="20" y="{H - 30}" font-size="12" font-weight="600" fill="{TEXT}">Outputs</text>')
    el.append(f'<text x="80" y="{H - 30}" font-size="11" fill="{TEXT_2}">'
              f'{escape(" · ".join(outputs) if outputs else "Emissions to air, water and soil; wastes")}</text>')
    el.append(f'<text x="20" y="{H - 10}" font-size="10" fill="{TEXT_2}">Filled = module declared · '
              f'Outlined = module not declared (MND) · Module D lies outside the system boundary</text>')
    defs = ('<defs><marker id="sb-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" '
            'orient="auto"><path d="M0,1 L9,5 L0,9 z" fill="#8d8c86"/></marker></defs>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="100%" role="img" '
            f'aria-label="System boundary diagram" font-family="{FONT}"><title>System boundary</title>'
            f'{defs}{"".join(el)}</svg>')
