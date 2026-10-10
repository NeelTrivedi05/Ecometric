"""
Default EPD layout (ISO 14025 / ISO 21930 / EN 15804 style, third-party program operator).

Each section id maps to a builder in ``builder.SECTION_BUILDERS``. ``numbered``
sections get "1 –", "2 –" … prefixes; ``orientation`` selects the page format.
``subsections`` lists the parts of a section in order; custom sections can be
inserted after any section or subsection id.
"""

TEMPLATE = {
    "id": "default",
    "name": "Default (program-operator style)",
    "sections": [
        {"id": "cover", "orientation": "portrait"},
        {"id": "summary", "title": "Declaration summary", "orientation": "portrait"},
        {"id": "toc", "title": "Contents", "orientation": "portrait"},
        {"id": "general", "title": "General information", "numbered": True, "orientation": "portrait",
         "subsections": ["company", "product", "technical_data", "application", "composition",
                         "manufacturing", "functional_unit", "rsl", "scenarios"]},
        {"id": "methodology", "title": "LCA methodology", "numbered": True, "orientation": "portrait",
         "subsections": ["system_boundary", "modules_table", "cut_off", "allocation", "data_quality"]},
        {"id": "results", "title": "LCA results", "numbered": True, "orientation": "landscape"},
        {"id": "interpretation", "title": "Interpretation", "numbered": True, "orientation": "portrait"},
        {"id": "assumptions", "title": "Assumptions and limitations", "numbered": True, "orientation": "portrait"},
        {"id": "references", "title": "References", "numbered": True, "orientation": "portrait"},
    ],
}
