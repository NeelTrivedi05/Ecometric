"""ISO 21930:2017 core rules (North American programs, typically with TRACI 2.1)."""

STANDARD = {
    "id": "iso-21930",
    "name": "ISO 21930",
    "aliases": ["ISO 21930", "ISO 21930:2017", "iso_21930"],
    "standardsText": ["ISO 14025", "ISO 14040", "ISO 14044", "ISO 21930:2017"],
    "requiredGroups": ["core impact"],
    "mandatoryIndicators": {},
    "scopeRules": {
        "Cradle-to-gate": ["A1", "A2", "A3"],
        "Cradle-to-gate with options": ["A1", "A2", "A3"],
        "Cradle-to-grave": ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7",
                            "C1", "C2", "C3", "C4"],
    },
    "comparabilityKey": "text.comparability.iso21930",
    "biogenicCarbonKey": "text.biogenic.generic",
    "references": [
        {"citation": "ISO 21930:2017 — Sustainability in buildings and civil engineering works — Core rules for "
                     "environmental product declarations of construction products and services. ISO, Geneva."},
    ],
}
