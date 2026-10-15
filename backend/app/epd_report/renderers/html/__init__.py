"""HTML renderer — used for the in-app preview and as the source for PDF rendering."""

import base64
import re
from functools import lru_cache
from pathlib import Path
from typing import Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape
from markupsafe import Markup

from ...document import Document

_HERE = Path(__file__).resolve().parent
_FONTS = _HERE.parent / "assets" / "fonts"
FONT_FACES = [("Regular", 400, "normal"), ("SemiBold", 600, "normal"), ("Bold", 700, "normal"),
              ("Italic", 400, "italic")]
_HEX = re.compile(r"^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$")
DEFAULT_BRAND = "#1f4e79"


def img_src(data: Optional[str]) -> Optional[str]:
    """Only image data URIs (or bare base64, assumed PNG) are allowed as image sources."""
    if not data:
        return None
    data = data.strip()
    if data.startswith("data:"):
        return data if data.startswith("data:image/") else None
    if re.fullmatch(r"[A-Za-z0-9+/=\s]+", data):
        return "data:image/png;base64," + re.sub(r"\s", "", data)
    return None


def css_string(s: Optional[str]) -> str:
    """Quoted CSS string literal, safe for use inside a <style> block."""
    s = (s or "").replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").replace("<", "\\3C ")
    return f'"{s}"'


def css_color(c: Optional[str]) -> str:
    return c if c and _HEX.match(c) else DEFAULT_BRAND


@lru_cache(maxsize=1)
def font_css() -> str:
    out = []
    for style, weight, font_style in FONT_FACES:
        data = base64.b64encode((_FONTS / f"EPDReportSans-{style}.ttf").read_bytes()).decode()
        out.append(f"@font-face{{font-family:'EPD Report Sans';font-weight:{weight};font-style:{font_style};"
                   f"src:url(data:font/ttf;base64,{data}) format('truetype');}}")
    return "\n".join(out)


@lru_cache(maxsize=1)
def _env() -> Environment:
    env = Environment(loader=FileSystemLoader(str(_HERE / "templates")),
                      autoescape=select_autoescape(["html", "j2"]), trim_blocks=True, lstrip_blocks=True)
    env.filters["img_src"] = img_src
    env.filters["css_string"] = lambda s: Markup(css_string(s))
    env.filters["css_color"] = css_color
    return env


@lru_cache(maxsize=1)
def stylesheet() -> str:
    return (_HERE / "styles.css").read_text(encoding="utf-8")


class HtmlRenderer:
    format = "html"
    media_type = "text/html"

    def render(self, doc: Document, mode: str = "print", **_) -> str:
        """mode='print' for PDF (paged media); mode='preview' for the in-app iframe (pages as cards)."""
        tpl = _env().get_template("report.html.j2")
        return tpl.render(doc=doc, mode=mode, fonts=Markup(font_css()), styles=Markup(stylesheet()),
                          brand=css_color(doc.branding.get("primaryColor")),
                          footer_logo=img_src(doc.footer.get("logo")))


def render_html(doc: Document, mode: str = "print") -> str:
    return HtmlRenderer().render(doc, mode=mode)
