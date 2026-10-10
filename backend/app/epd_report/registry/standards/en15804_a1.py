"""EN 15804:2012+A1:2013 core rules (CML-IA indicator set)."""

STANDARD = {
    "id": "en15804-a1",
    "name": "EN 15804+A1",
    "aliases": ["EN 15804+A1", "EN15804+A1", "EN 15804:2012+A1:2013", "en15804_a1"],
    "standardsText": ["ISO 14025", "ISO 14040", "ISO 14044", "EN 15804:2012+A1:2013"],
    "requiredGroups": ["core impact"],
    "mandatoryIndicators": {},
    "scopeRules": {
        "Cradle-to-gate": ["A1", "A2", "A3"],
        "Cradle-to-gate with options": ["A1", "A2", "A3"],
        "Cradle-to-grave": ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7",
                            "C1", "C2", "C3", "C4"],
    },
    "comparabilityKey": "text.comparability.en15804",
    "biogenicCarbonKey": "text.biogenic.generic",
    "references": [
        {"citation": "EN 15804:2012+A1:2013 — Sustainability of construction works — Environmental product "
                     "declarations — Core rules for the product category of construction products. CEN, Brussels."},
    ],
}
