"""EN 15804:2012+A2:2019 core rules."""

STANDARD = {
    "id": "en15804-a2",
    "name": "EN 15804+A2",
    "aliases": ["EN 15804+A2", "EN15804+A2", "EN 15804:2012+A2:2019", "en15804_a2"],
    "standardsText": ["ISO 14025", "ISO 14040", "ISO 14044", "EN 15804:2012+A2:2019"],
    # Indicator groups this standard requires to be declared (per method that provides them)
    "requiredGroups": ["core impact", "resource use", "waste", "output flows"],
    # Extra mandatory indicators beyond those flagged mandatory in each method file
    "mandatoryIndicators": {},
    "scopeRules": {
        "Cradle-to-gate": ["A1", "A2", "A3"],
        "Cradle-to-gate with options": ["A1", "A2", "A3", "C1", "C2", "C3", "C4", "D"],
        "Cradle-to-grave": ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7",
                            "C1", "C2", "C3", "C4", "D"],
    },
    "comparabilityKey": "text.comparability.en15804",
    "biogenicCarbonKey": "text.biogenic.en15804a2",
    "references": [
        {"citation": "EN 15804:2012+A2:2019 — Sustainability of construction works — Environmental product "
                     "declarations — Core rules for the product category of construction products. CEN, Brussels."},
    ],
}
