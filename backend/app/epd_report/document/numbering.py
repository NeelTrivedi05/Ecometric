"""
Numbering pass: section numbers, heading numbers, table/figure numbers,
cross-reference resolution and table of contents. Runs on every build, so
numbers always match the current selection.

Cross-references are written in text as ``{{ref:<id>}}`` and resolve to
"Table 7" / "Figure 3" / "Section 2.1".
"""

import re
from typing import Dict, List, Tuple

from .model import DataTable, Document, Figure, FigureGrid, Heading, KeyValueTable, Paragraph, TocBlock

REF_RE = re.compile(r"\{\{ref:([A-Za-z0-9_\-.:]+)\}\}")


def number_document(doc: Document) -> List[Tuple[str, str]]:
    """Mutates ``doc`` in place. Returns unresolved references as (ref_id, section_id)."""
    labels: Dict[str, str] = {}
    toc: List[Dict] = []
    sec_n = 0
    table_n = 0
    fig_n = 0

    for sec in doc.sections:
        if sec.numbered:
            sec_n += 1
            sec.number = str(sec_n)
            labels[f"sec-{sec.id}"] = f"Section {sec.number}"
        if sec.title and sec.toc and sec.id not in ("cover", "toc"):
            toc.append({"level": 1, "number": sec.number, "title": sec.title, "anchor": f"sec-{sec.id}"})
        sub_n = 0
        for block in sec.blocks:
            if isinstance(block, Heading):
                if sec.numbered and block.level == 2:
                    sub_n += 1
                    block.number = f"{sec.number}.{sub_n}"
                if block.anchor:
                    labels[block.anchor] = f"Section {block.number}" if block.number else block.text
                if block.toc and block.level == 2:
                    toc.append({"level": 2, "number": block.number, "title": block.text, "anchor": block.anchor})
            figures = block.figures if isinstance(block, FigureGrid) else [block]
            for item in figures:
                if isinstance(item, (DataTable, KeyValueTable)) and item.caption and getattr(item, "numbered", True):
                    if isinstance(item, DataTable) and item.part and item.part.startswith("Part 2"):
                        item.number = table_n  # continuation of the previous table
                        continue
                    table_n += 1
                    item.number = table_n
                    if item.id:
                        labels[item.id] = f"Table {table_n}"
                elif isinstance(item, Figure) and item.caption:
                    fig_n += 1
                    item.number = fig_n
                    if item.id:
                        labels[item.id] = f"Figure {fig_n}"

    unresolved: List[Tuple[str, str]] = []

    def _resolve(text: str, sec_id: str) -> str:
        def sub(m):
            ref = m.group(1)
            if ref in labels:
                return labels[ref]
            unresolved.append((ref, sec_id))
            return "(see below)"
        return REF_RE.sub(sub, text)

    for sec in doc.sections:
        for block in sec.blocks:
            if isinstance(block, Paragraph):
                block.text = _resolve(block.text, sec.id)
            elif isinstance(block, (DataTable, KeyValueTable)) and block.caption:
                block.caption = _resolve(block.caption, sec.id)
            elif isinstance(block, Figure) and block.caption:
                block.caption = _resolve(block.caption, sec.id)
            elif isinstance(block, FigureGrid):
                for f in block.figures:
                    if f.caption:
                        f.caption = _resolve(f.caption, sec.id)
            elif isinstance(block, TocBlock):
                block.entries = toc
    return unresolved
