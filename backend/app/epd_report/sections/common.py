"""Helpers shared by section builders."""

import html
import re
from typing import List, Optional, Sequence

from ..context import BuildContext
from ..document import Cell, Column, DataTable, Heading, KeyValueRow, Paragraph
from ..formatting import format_number, format_quantity
from ..schema import Amount, NamedValue, Quantity

SUPERSCRIPTS = "¹²³⁴⁵⁶⁷⁸⁹"


def nd(ctx: BuildContext) -> str:
    return ctx.text_get("text.not_declared", "Not declared")


def kv(label: str, value, ctx: BuildContext = None, type: str = "text", keep_empty: bool = True, **opts):
    """KeyValueRow; empty values become 'Not declared' (or None to drop the row when keep_empty=False)."""
    empty = value is None or value == "" or value == []
    if empty and not keep_empty:
        return None
    if empty:
        value = nd(ctx) if ctx else "Not declared"
    return KeyValueRow(label=label, value=value, type=type, options=opts)


def compact(rows: Sequence[Optional[KeyValueRow]]) -> List[KeyValueRow]:
    return [r for r in rows if r is not None]


def qty(q: Optional[Quantity]) -> Optional[str]:
    if not q or q.value is None:
        return None
    return format_quantity(q.value, q.unit)


def amt(a: Optional[Amount]) -> Optional[str]:
    if not a or a.amount is None:
        return None
    return format_quantity(a.amount, a.unit)


def simple_table(headers: Sequence[str], rows: Sequence[Sequence[Optional[str]]], *, caption: str,
                 table_id: Optional[str] = None, numeric_cols: Sequence[int] = (), drop_empty_cols: bool = True,
                 notes: Sequence[str] = ()) -> Optional[DataTable]:
    rows = [list(r) for r in rows if any(c not in (None, "") for c in r)]
    if not rows:
        return None
    keep = list(range(len(headers)))
    if drop_empty_cols:
        keep = [i for i in keep if i == 0 or any(r[i] not in (None, "") for r in rows)]
    cols = [Column(key=f"c{i}", label=headers[i], align="right" if i in numeric_cols else "left",
                   role="label" if i == 0 else "data") for i in keep]
    body = [[Cell(text="" if r[i] is None else str(r[i]), cls="num" if i in numeric_cols else None) for i in keep]
            for r in rows]
    return DataTable(columns=cols, rows=body, caption=caption, id=table_id, notes=list(notes))


def param_rows(params: Sequence[NamedValue]) -> List[List[Optional[str]]]:
    out = []
    for p in params:
        v = format_number(p.value) if isinstance(p.value, (int, float)) else p.value
        out.append([p.name, None if v is None else str(v), p.unit, p.note])
    return out


def heading(text: str, anchor: Optional[str] = None, level: int = 2, toc: bool = True) -> Heading:
    return Heading(text=text, level=level, anchor=anchor, toc=toc)


def paragraphs(text: Optional[str], style: str = "body") -> List[Paragraph]:
    if not text:
        return []
    return [Paragraph(text=p.strip(), style=style) for p in re.split(r"\n\s*\n", text) if p.strip()]


# ---------------------------------------------------------------- minimal, safe markdown

_INLINE = [
    (re.compile(r"\*\*(.+?)\*\*"), r"<strong>\1</strong>"),
    (re.compile(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)"), r"<em>\1</em>"),
    (re.compile(r"`(.+?)`"), r"<code>\1</code>"),
]
_LINK = re.compile(r"\[([^\]]+)\]\((https?://[^)\s]+)\)")


def _inline(s: str) -> str:
    s = html.escape(s, quote=True)
    s = _LINK.sub(lambda m: f'<a href="{m.group(2)}">{m.group(1)}</a>', s)
    for rx, rep in _INLINE:
        s = rx.sub(rep, s)
    return s


def markdown_blocks(md: str) -> List[Paragraph]:
    """Converts a small, safe markdown subset (paragraphs, ###/#### headings, bullet and numbered lists,
    bold, italic, code, http(s) links). All user text is HTML-escaped first."""
    blocks: List[Paragraph] = []
    for chunk in re.split(r"\n\s*\n", md.strip()):
        lines = [l.rstrip() for l in chunk.splitlines() if l.strip()]
        if not lines:
            continue
        if all(re.match(r"^\s*[-*]\s+", l) for l in lines):
            items = "".join(f"<li>{_inline(re.sub(r'^\s*[-*]\s+', '', l))}</li>" for l in lines)
            blocks.append(Paragraph(text=f"<ul>{items}</ul>", html=True))
        elif all(re.match(r"^\s*\d+[.)]\s+", l) for l in lines):
            items = "".join(f"<li>{_inline(re.sub(r'^\s*\d+[.)]\s+', '', l))}</li>" for l in lines)
            blocks.append(Paragraph(text=f"<ol>{items}</ol>", html=True))
        elif re.match(r"^#{1,4}\s+", lines[0]) and len(lines) == 1:
            blocks.append(Paragraph(text=f"<h4>{_inline(re.sub(r'^#{1,4}\s+', '', lines[0]))}</h4>", html=True))
        else:
            blocks.append(Paragraph(text=f"<p>{'<br>'.join(_inline(l) for l in lines)}</p>", html=True))
    return blocks
