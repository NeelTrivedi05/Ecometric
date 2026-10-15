"""PDF renderer: the print-mode HTML rendered by headless Chromium (Playwright). Works offline:
fonts and images are embedded in the HTML and outgoing network requests are blocked."""

from typing import Optional

from ..document import Document
from .html import render_html


class PdfRenderer:
    format = "pdf"
    media_type = "application/pdf"

    def render(self, doc: Document, html: Optional[str] = None, **_) -> bytes:
        from playwright.sync_api import sync_playwright

        html = html or render_html(doc, mode="print")
        with sync_playwright() as p:
            browser = p.chromium.launch()
            try:
                page = browser.new_page()
                # No CDN / network access during rendering: only inline data is allowed.
                page.route("**/*", lambda route: route.abort() if not route.request.url.startswith(("data:", "about:"))
                           else route.continue_())
                page.set_content(html, wait_until="load")
                pdf = page.pdf(prefer_css_page_size=True, print_background=True, tagged=True, outline=True)
            finally:
                browser.close()
        return pdf


def render_pdf(doc: Document, html: Optional[str] = None) -> bytes:
    return PdfRenderer().render(doc, html=html)
