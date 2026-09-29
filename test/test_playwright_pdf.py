from playwright.sync_api import sync_playwright

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    @page { size: letter portrait; margin: 0; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                    .page { page-break-after: always; height: 100vh; padding: 40px; box-sizing: border-box; }
                </style>
            </head>
            <body>
                <div class="page"><h1>Cover Page</h1></div>
                <div class="page"><h1>Declaration Table</h1></div>
            </body>
            </html>
        """)
        header_html = """
        <div style="font-family: Arial, sans-serif; font-size: 8pt; width: 100%; padding: 0 45pt; color: #555;">
            EPD: Test AquaEdge
        </div>
        """
        footer_html = """
        <div style="font-family: Arial, sans-serif; font-size: 8pt; width: 100%; padding: 0 45pt; display: flex; justify-content: space-between; align-items: center; color: #555;">
            <span>Carrier Corporation</span>
            <span><span class="pageNumber"></span></span>
        </div>
        """
        pdf_bytes = page.pdf(
            format="Letter",
            print_background=True,
            display_header_footer=True,
            header_template=header_html,
            footer_template=footer_html,
            margin={"top": "0.75in", "bottom": "0.75in", "left": "0.75in", "right": "0.75in"}
        )
        print("Generated PDF size:", len(pdf_bytes))
        browser.close()

if __name__ == "__main__":
    test()
