"""Mineral wool thermal insulation — cradle-to-gate with options (A1–A5, C1–C4, D)."""

PROFILE = {
    "id": "mineral-wool-insulation",
    "name": "Mineral wool insulation",
    "functionalUnit": {
        "type": "declared",
        "description": "1 m² of mineral wool insulation with a thermal resistance of RSI = 1 m²·K/W",
        "unitLabel": "per 1 m² at RSI = 1 m²·K/W",
    },
    "defaultScope": "Cradle-to-gate with options",
    "defaultStandard": "EN 15804+A2",
    "defaultMethods": ["EN 15804+A2"],
    "pcr": {
        "parts": [
            {"name": "EN 15804:2012+A2:2019 — Core rules for the product category of construction products",
             "publisher": "CEN", "year": 2019},
            {"name": "EN 16783:2017 — Thermal insulation products — Product category rules for factory made "
                     "and in-situ formed products", "publisher": "CEN", "year": 2017},
        ],
        "mandatoryIndicators": {},
    },
    "defaultModules": {
        "A1": "declared", "A2": "declared", "A3": "declared", "A4": "declared", "A5": "declared",
        "B1": "MND", "B2": "MND", "B3": "MND", "B4": "MND", "B5": "MND", "B6": "MND", "B7": "MND",
        "C1": "declared", "C2": "declared", "C3": "declared", "C4": "declared", "D": "declared",
    },
    "scenarioSections": ["A4", "A5", "C1_C4", "D"],
    "scenarioTitles": {},
    "technicalDataFields": [
        {"name": "Declared thermal conductivity λD", "unit": "W/(m·K)"},
        {"name": "Density", "unit": "kg/m³"},
        {"name": "Thickness for RSI = 1", "unit": "mm"},
        {"name": "Reaction to fire (EN 13501-1)", "unit": None},
    ],
    "charts": ["moduleStacked", "materialContribution", "variantComparison"],
    "variantComparisonModules": ["A1-A3", "A4", "A5"],
    "sectionOverrides": {},
    "textOverrides": {},
    "references": [
        {"citation": "EN 16783:2017 — Thermal insulation products — Product category rules (PCR) for factory made "
                     "and in-situ formed products for preparing environmental product declarations. CEN."},
        {"citation": "EN 13162:2012+A1:2015 — Thermal insulation products for buildings — Factory made mineral wool "
                     "(MW) products — Specification. CEN."},
    ],
}
