"""Water-cooled chillers (HVAC equipment) — cradle-to-grave, use phase typically dominant."""

PROFILE = {
    "id": "water-cooled-chiller",
    "name": "Water-cooled chiller",
    "functionalUnit": {
        "type": "functional",
        "description": "1 ton of chilling capacity",
        "unitLabel": "per ton of chilling capacity",
    },
    "defaultScope": "Cradle-to-grave",
    "defaultStandard": "ISO 21930",
    "defaultMethods": ["TRACI 2.1"],
    "pcr": {
        "parts": [
            {"name": "Part A: Life Cycle Assessment Calculation Rules and Report Requirements",
             "publisher": "UL Environment", "version": "4.0", "year": 2022},
            {"name": "Part B: Water-Cooled Chiller EPD Requirements", "publisher": "UL Environment",
             "version": "2.0", "year": 2018},
        ],
        "mandatoryIndicators": {"traci-2.1": ["GWP", "ODP", "AP", "EP", "SFP"]},
    },
    "defaultModules": {
        "A1": "declared", "A2": "declared", "A3": "declared", "A4": "declared", "A5": "declared",
        "B1": "declared", "B2": "declared", "B3": "declared", "B4": "declared", "B5": "declared",
        "B6": "declared", "B7": "declared",
        "C1": "declared", "C2": "declared", "C3": "declared", "C4": "declared", "D": "MND",
    },
    "scenarioSections": ["A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "C1_C4", "D"],
    "scenarioTitles": {
        "B1": "Use (direct refrigerant emissions)",
        "B2": "Maintenance (refrigerant leakage and replacement)",
        "B6": "Operational energy use",
        "B7": "Operational water use",
    },
    "technicalDataFields": [
        {"name": "Chilling capacity", "unit": "tons of refrigeration"},
        {"name": "Full-load efficiency", "unit": "kW/ton"},
        {"name": "Integrated part-load value (IPLV)", "unit": "kW/ton"},
        {"name": "Refrigerant", "unit": None},
        {"name": "Refrigerant charge", "unit": "kg"},
        {"name": "Operating weight", "unit": "kg"},
    ],
    "charts": ["moduleStacked", "excludingDominant", "materialContribution", "variantComparison"],
    "variantComparisonModules": ["A1-A3", "A4", "A5"],
    "sectionOverrides": {},
    "textOverrides": {},
    "references": [
        {"citation": "AHRI Standard 550/590 (I-P) — Performance Rating of Water-Chilling and Heat Pump "
                     "Water-Heating Packages Using the Vapor Compression Cycle. AHRI, 2020."},
    ],
}
