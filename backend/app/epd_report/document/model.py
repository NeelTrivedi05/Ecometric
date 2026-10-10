"""
Report document model — a renderer-neutral tree of sections and blocks.

The builder produces this; renderers (HTML, PDF via HTML, later DOCX) consume it.
No markup or styling decisions live here, only structure and content.
Text fields are plain text; ``Paragraph.html`` is set only for content that was
converted from user markdown and already escaped.
"""

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Union


@dataclass
class Block:
    kind: str = field(init=False, default="block")

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Heading(Block):
    text: str
    level: int = 2
    anchor: Optional[str] = None
    number: Optional[str] = None
    toc: bool = True
    kind: str = field(init=False, default="heading")


@dataclass
class Paragraph(Block):
    text: str
    style: str = "body"           # body | lead | note | small
    html: bool = False
    kind: str = field(init=False, default="paragraph")


@dataclass
class BulletList(Block):
    items: List[str]
    kind: str = field(init=False, default="bullets")


@dataclass
class KeyValueRow:
    label: str
    value: Union[str, List[str], None] = None
    type: str = "text"            # text | lines | checkbox | signature | image | link
    options: Dict[str, Any] = field(default_factory=dict)


@dataclass
class KeyValueTable(Block):
    rows: List[KeyValueRow]
    id: Optional[str] = None
    caption: Optional[str] = None
    variant: str = "plain"        # plain | summary
    number: Optional[int] = None
    kind: str = field(init=False, default="kv_table")


@dataclass
class Column:
    key: str
    label: str
    align: str = "left"           # left | right | center
    highlight: bool = False
    role: str = "data"            # label | unit | data


@dataclass
class Cell:
    text: str
    marks: List[str] = field(default_factory=list)   # footnote markers, e.g. ["1"]
    cls: Optional[str] = None                         # mnd | nd | aggregate | num | strong


@dataclass
class Footnote:
    mark: str
    text: str


@dataclass
class DataTable(Block):
    columns: List[Column]
    rows: List[List[Cell]]
    id: Optional[str] = None
    caption: Optional[str] = None
    footnotes: List[Footnote] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)
    part: Optional[str] = None     # "Part 1 of 2" for split wide tables
    header_groups: List[Dict[str, Any]] = field(default_factory=list)  # [{"label": str, "span": int}]
    numbered: bool = True
    number: Optional[int] = None
    style: str = "data"            # data | results | modules
    kind: str = field(init=False, default="data_table")


@dataclass
class Figure(Block):
    svg: Optional[str] = None
    image: Optional[str] = None    # data URI
    id: Optional[str] = None
    caption: Optional[str] = None
    number: Optional[int] = None
    width: str = "full"            # full | half
    alt: Optional[str] = None
    kind: str = field(init=False, default="figure")


@dataclass
class FigureGrid(Block):
    figures: List[Figure]
    kind: str = field(init=False, default="figure_grid")


@dataclass
class ImageBlock(Block):
    data: str
    caption: Optional[str] = None
    kind: str = field(init=False, default="image")


@dataclass
class SignatureBlock(Block):
    name: Optional[str]
    organization: Optional[str]
    image: Optional[str] = None
    role: str = ""
    kind: str = field(init=False, default="signature")


@dataclass
class PageBreak(Block):
    kind: str = field(init=False, default="page_break")


@dataclass
class TocBlock(Block):
    entries: List[Dict[str, Any]] = field(default_factory=list)   # filled by numbering pass
    kind: str = field(init=False, default="toc")


@dataclass
class Cover(Block):
    title: str
    product_name: str
    subtitle: Optional[str] = None
    manufacturer_name: Optional[str] = None
    manufacturer_logo: Optional[str] = None
    program_operator_name: Optional[str] = None
    program_operator_logo: Optional[str] = None
    product_image: Optional[str] = None
    declaration_number: Optional[str] = None
    issue_date: Optional[str] = None
    valid_until: Optional[str] = None
    standards: List[str] = field(default_factory=list)
    kind: str = field(init=False, default="cover")


@dataclass
class Section:
    id: str
    title: Optional[str]
    blocks: List[Block] = field(default_factory=list)
    numbered: bool = False
    number: Optional[str] = None
    orientation: str = "portrait"
    toc: bool = True
    custom: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id, "title": self.title, "numbered": self.numbered, "number": self.number,
            "orientation": self.orientation, "custom": self.custom,
            "blocks": [b.to_dict() for b in self.blocks],
        }


@dataclass
class Document:
    title: str
    sections: List[Section]
    meta: Dict[str, Any] = field(default_factory=dict)
    header_text: str = ""
    footer: Dict[str, Any] = field(default_factory=dict)
    branding: Dict[str, Any] = field(default_factory=dict)
    paper: str = "Letter"
    draft: bool = False
    filename: str = "EPD.pdf"
    warnings: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title, "meta": self.meta, "headerText": self.header_text, "footer": self.footer,
            "paper": self.paper, "draft": self.draft, "filename": self.filename,
            "sections": [s.to_dict() for s in self.sections],
        }

    def iter_blocks(self):
        for s in self.sections:
            for b in s.blocks:
                yield s, b
                if isinstance(b, FigureGrid):
                    for f in b.figures:
                        yield s, f
