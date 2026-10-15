"""
Renderers turn a Document into an output format. Each renderer implements the
``Renderer`` protocol; add a DOCX renderer by implementing it and registering
it in ``RENDERERS`` — the builder and document model do not change.
"""

from typing import Dict, Protocol, Union

from ..document import Document


class Renderer(Protocol):
    format: str
    media_type: str

    def render(self, doc: Document, **options) -> Union[str, bytes]:
        ...


def get_renderer(fmt: str) -> Renderer:
    from .html import HtmlRenderer
    from .pdf import PdfRenderer
    renderers: Dict[str, Renderer] = {"html": HtmlRenderer(), "pdf": PdfRenderer()}
    if fmt not in renderers:
        raise KeyError(f"unknown renderer '{fmt}' (available: {sorted(renderers)})")
    return renderers[fmt]
