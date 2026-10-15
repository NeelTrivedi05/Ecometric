"""
Static SVG chart primitives (no JS, no external fonts), rendered server-side
and embedded inline in the HTML/PDF. Mark specs follow the dataviz guidance:
hairline recessive grid, 2px surface gap between stacked segments, 4px rounded
data-ends anchored to the baseline, legend always present for >= 2 series,
text in text colors (never the series color), native <title> tooltips.
"""

import math
from html import escape
from typing import List, Optional, Sequence, Tuple

from ..formatting import format_sci

SURFACE = "#ffffff"
TEXT = "#1d1d1b"
TEXT_2 = "#52514e"
GRID = "#e4e3df"
AXIS = "#b9b8b2"
OTHER = "#9a9993"

# Validated reference categorical order (light mode; adjacent CVD ΔE >= 9.1).
PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6"]
FONT = "'EPD Report Sans', Arial, Helvetica, sans-serif"

Series = Tuple[str, str, Sequence[float]]  # (name, color, one value per category)


def nice_ticks(lo: float, hi: float, n: int = 5) -> List[float]:
    if lo == hi:
        hi = lo + (abs(lo) or 1.0)
    span = hi - lo
    raw = span / max(1, n)
    mag = 10 ** math.floor(math.log10(raw))
    step = next(s * mag for s in (1, 2, 2.5, 5, 10) if s * mag >= raw)
    start = math.floor(lo / step) * step
    ticks, t = [], start
    while t <= hi + step * 1e-9:
        ticks.append(round(t, 12))
        t += step
    if ticks[-1] < hi:
        ticks.append(ticks[-1] + step)
    return ticks


def tick_label(v: float, ticks: Sequence[float], percent: bool = False) -> str:
    if percent:
        return f"{v:.0f}%"
    biggest = max(abs(t) for t in ticks) or 1
    if biggest >= 1e5 or biggest < 1e-2:
        return "0" if v == 0 else format_sci(v, 1)
    step = abs(ticks[1] - ticks[0]) if len(ticks) > 1 else 1
    decimals = max(0, -int(math.floor(math.log10(step)))) if step < 1 else 0
    return f"{v:,.{decimals}f}"


def _round_rect(x: float, y: float, w: float, h: float, r: float, ends: str) -> str:
    """Path for a rect with rounded corners on one end: 'top' | 'bottom' | 'right' | 'left' | ''."""
    w, h = max(w, 0.0), max(h, 0.0)
    if not ends or r <= 0:
        return f'M{x:.2f},{y:.2f}h{w:.2f}v{h:.2f}h{-w:.2f}z'
    r = min(r, w / 2, h / 2)
    if ends == "top":
        return (f"M{x:.2f},{y + h:.2f}V{y + r:.2f}Q{x:.2f},{y:.2f} {x + r:.2f},{y:.2f}H{x + w - r:.2f}"
                f"Q{x + w:.2f},{y:.2f} {x + w:.2f},{y + r:.2f}V{y + h:.2f}z")
    if ends == "bottom":
        return (f"M{x:.2f},{y:.2f}H{x + w:.2f}V{y + h - r:.2f}Q{x + w:.2f},{y + h:.2f} {x + w - r:.2f},{y + h:.2f}"
                f"H{x + r:.2f}Q{x:.2f},{y + h:.2f} {x:.2f},{y + h - r:.2f}z")
    if ends == "right":
        return (f"M{x:.2f},{y:.2f}H{x + w - r:.2f}Q{x + w:.2f},{y:.2f} {x + w:.2f},{y + r:.2f}V{y + h - r:.2f}"
                f"Q{x + w:.2f},{y + h:.2f} {x + w - r:.2f},{y + h:.2f}H{x:.2f}z")
    if ends == "left":
        return (f"M{x + w:.2f},{y:.2f}V{y + h:.2f}H{x + r:.2f}Q{x:.2f},{y + h:.2f} {x:.2f},{y + h - r:.2f}"
                f"V{y + r:.2f}Q{x:.2f},{y:.2f} {x + r:.2f},{y:.2f}z")
    return f'M{x:.2f},{y:.2f}h{w:.2f}v{h:.2f}h{-w:.2f}z'


def _text(x, y, s, size=11, fill=TEXT_2, anchor="start", weight="400", extra="") -> str:
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" '
            f'font-weight="{weight}" {extra}>{escape(str(s))}</text>')


def _text_width(s: str, size: float) -> float:
    return len(str(s)) * size * 0.52


def _legend(series: Sequence[Series], x0: float, y0: float, max_w: float) -> Tuple[List[str], float]:
    """Legend rows (swatch + text-colored label). Returns (elements, height)."""
    out, x, y = [], x0, y0
    for name, color, _ in series:
        w = 14 + _text_width(name, 11) + 16
        if x + w > x0 + max_w and x > x0:
            x, y = x0, y + 18
        out.append(f'<rect x="{x:.1f}" y="{y - 9:.1f}" width="10" height="10" rx="2" fill="{color}"/>')
        out.append(_text(x + 14, y, name, 11, TEXT_2))
        x += w
    return out, (y - y0) + 18


def _wrap(svg_body: List[str], width: float, height: float, title: str) -> str:
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.0f} {height:.0f}" '
            f'width="100%" role="img" aria-label="{escape(title)}" font-family="{FONT}" '
            f'style="max-width:{width:.0f}px">'
            f'<title>{escape(title)}</title>{"".join(svg_body)}</svg>')


def stacked_bars(
    categories: Sequence[str],
    series: Sequence[Series],
    *,
    title: str,
    value_label: str,
    orientation: str = "vertical",
    percent: bool = False,
    show_totals: bool = True,
    width: float = 640,
) -> str:
    """
    Stacked bars; positive values stack away from zero upward/rightward,
    negative values stack downward/leftward from zero. ``percent`` normalises
    each category to 100% of its absolute total.
    """
    n = len(categories)
    vals = [[float(s[2][i] or 0.0) for s in series] for i in range(n)]
    if percent:
        norm = []
        for row in vals:
            tot = sum(abs(v) for v in row) or 1.0
            norm.append([abs(v) / tot * 100 for v in row])
        vals = norm
    pos_tot = [sum(v for v in row if v > 0) for row in vals]
    neg_tot = [sum(v for v in row if v < 0) for row in vals]
    lo = min([0.0] + neg_tot)
    hi = max([0.0] + pos_tot)
    ticks = [0, 20, 40, 60, 80, 100] if percent else nice_ticks(lo, hi)
    lo, hi = min(ticks), max(ticks)

    horizontal = orientation == "horizontal"
    body: List[str] = []
    label_w = max((_text_width(c, 11) for c in categories), default=40) + 12 if horizontal else 0
    left = max(64, label_w) if horizontal else 70
    right, top = 24, 16
    if horizontal:
        band = 26
        plot_h = band * n
        plot_w = width - left - right
    else:
        plot_w = width - left - right
        plot_h = 240 if width >= 560 else 200
        band = plot_w / max(1, n)
    axis_band = 34 if not horizontal else 30
    legend_items, legend_h = _legend(series, left, top + plot_h + axis_band + 18, plot_w)
    height = top + plot_h + axis_band + legend_h + 14

    def scale(v: float) -> float:
        span = (hi - lo) or 1.0
        return (v - lo) / span * (plot_w if horizontal else plot_h)

    # grid + ticks
    for t in ticks:
        lab = tick_label(t, ticks, percent)
        if horizontal:
            x = left + scale(t)
            body.append(f'<line x1="{x:.1f}" y1="{top}" x2="{x:.1f}" y2="{top + plot_h}" stroke="{GRID}" stroke-width="1"/>')
            body.append(_text(x, top + plot_h + 16, lab, 10, TEXT_2, "middle", extra='font-variant-numeric="tabular-nums"'))
        else:
            y = top + plot_h - scale(t)
            body.append(f'<line x1="{left}" y1="{y:.1f}" x2="{left + plot_w}" y2="{y:.1f}" stroke="{GRID}" stroke-width="1"/>')
            body.append(_text(left - 8, y + 3.5, lab, 10, TEXT_2, "end", extra='font-variant-numeric="tabular-nums"'))
    # zero baseline
    if horizontal:
        zx = left + scale(0)
        body.append(f'<line x1="{zx:.1f}" y1="{top}" x2="{zx:.1f}" y2="{top + plot_h}" stroke="{AXIS}" stroke-width="1"/>')
        body.append(_text(left + plot_w / 2, top + plot_h + 30, value_label, 11, TEXT, "middle"))
    else:
        zy = top + plot_h - scale(0)
        body.append(f'<line x1="{left}" y1="{zy:.1f}" x2="{left + plot_w}" y2="{zy:.1f}" stroke="{AXIS}" stroke-width="1"/>')
        body.append(_text(14, top + plot_h / 2, value_label, 11, TEXT, "middle",
                          extra=f'transform="rotate(-90 14 {top + plot_h / 2:.1f})"'))

    bar = min(48.0, band * 0.56) if not horizontal else 16.0
    for i, cat in enumerate(categories):
        row = vals[i]
        # which segment is outermost on each side (gets the rounded end)
        last_pos = max((k for k, v in enumerate(row) if v > 0), default=None)
        last_neg = max((k for k, v in enumerate(row) if v < 0), default=None)
        pos_acc = neg_acc = 0.0
        for k, (name, color, _) in enumerate(series):
            v = row[k]
            if v == 0:
                continue
            if v > 0:
                a, b = pos_acc, pos_acc + v
                pos_acc = b
                outer = k == last_pos
            else:
                a, b = neg_acc + v, neg_acc
                neg_acc = a
                outer = k == last_neg
            raw = series[k][2][i]
            tip = f"{cat} — {name}: {f'{v:.1f}%' if percent else format_sci(raw)}"
            if horizontal:
                x0, x1 = left + scale(a), left + scale(b)
                yb = top + i * band + (band - bar) / 2
                ends = ("right" if v > 0 else "left") if outer and (x1 - x0) > 8 else ""
                d = _round_rect(x0, yb, x1 - x0, bar, 4, ends)
            else:
                y0, y1 = top + plot_h - scale(b), top + plot_h - scale(a)
                xb = left + i * band + (band - bar) / 2
                ends = ("top" if v > 0 else "bottom") if outer and (y1 - y0) > 8 else ""
                d = _round_rect(xb, y0, bar, y1 - y0, 4, ends)
            body.append(f'<path d="{d}" fill="{color}" stroke="{SURFACE}" stroke-width="1">'
                        f'<title>{escape(tip)}</title></path>')
        # category label
        if horizontal:
            body.append(_text(left - 8, top + i * band + band / 2 + 4, cat, 11, TEXT, "end"))
        else:
            body.append(_text(left + i * band + band / 2, top + plot_h + 16, cat, 11, TEXT, "middle"))
        # selective direct label: the net total at the bar end
        if show_totals and not percent:
            net = sum(row)
            if horizontal:
                ex = left + scale(pos_tot[i] if net >= 0 else neg_tot[i])
                body.append(_text(ex + (6 if net >= 0 else -6), top + i * band + band / 2 + 4, format_sci(net),
                                  10, TEXT, "start" if net >= 0 else "end", extra='font-variant-numeric="tabular-nums"'))
            else:
                ey = top + plot_h - scale(pos_tot[i] if net >= 0 else neg_tot[i])
                body.append(_text(left + i * band + band / 2, ey + (-6 if net >= 0 else 14), format_sci(net), 10, TEXT,
                                  "middle", extra='font-variant-numeric="tabular-nums"'))
    if len(series) >= 2:
        body.extend(legend_items)
    else:
        height -= legend_h
    return _wrap(body, width, height, title)


def ranked_bars(labels: Sequence[str], values: Sequence[float], *, title: str, value_label: str,
                color: str = PALETTE[0], percent: bool = True, width: float = 640) -> str:
    """Single-series horizontal bars, sorted by the caller. Values are labelled at the bar end (print medium)."""
    n = len(labels)
    label_w = max((_text_width(l, 11) for l in labels), default=40) + 12
    left, right, top, band, bar = max(90, label_w), 60, 12, 24, 14
    plot_w = width - left - right
    hi = max([0.0] + [float(v) for v in values])
    ticks = nice_ticks(0, hi if hi > 0 else 1)
    span = max(ticks) or 1
    plot_h = band * n
    body: List[str] = []
    for t in ticks:
        x = left + t / span * plot_w
        body.append(f'<line x1="{x:.1f}" y1="{top}" x2="{x:.1f}" y2="{top + plot_h}" stroke="{GRID}" stroke-width="1"/>')
        body.append(_text(x, top + plot_h + 16, f"{t:g}%" if percent else tick_label(t, ticks), 10, TEXT_2, "middle"))
    body.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top + plot_h}" stroke="{AXIS}" stroke-width="1"/>')
    for i, (lab, v) in enumerate(zip(labels, values)):
        y = top + i * band + (band - bar) / 2
        w = max(0.0, float(v)) / span * plot_w
        body.append(f'<path d="{_round_rect(left, y, w, bar, 4, "right" if w > 8 else "")}" fill="{color}">'
                    f'<title>{escape(lab)}: {v:.1f}{"%" if percent else ""}</title></path>')
        body.append(_text(left - 8, y + bar - 3, lab, 11, TEXT, "end"))
        body.append(_text(left + w + 6, y + bar - 3, f"{float(v):.1f}%" if percent else format_sci(v), 10, TEXT))
    body.append(_text(left + plot_w / 2, top + plot_h + 32, value_label, 11, TEXT, "middle"))
    return _wrap(body, width, top + plot_h + 44, title)
