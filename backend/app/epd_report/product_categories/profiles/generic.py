"""Fallback profile: renders whatever data exists, with no product-specific assumptions."""

PROFILE = {
    "id": "generic",
    "name": "Generic construction / industrial product",
    "functionalUnit": None,
    "defaultScope": None,
    "defaultStandard": None,
    "defaultMethods": [],
    "pcr": {"parts": [], "mandatoryIndicators": {}},
    "defaultModules": None,           # infer from results when the input has no module declaration
    "scenarioSections": ["A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "C1_C4", "D"],
    "scenarioTitles": {},
    "technicalDataFields": [],
    "charts": ["moduleStacked", "excludingDominant", "materialContribution", "variantComparison"],
    "variantComparisonModules": ["A1-A3", "A4", "A5"],
    "sectionOverrides": {},
    "textOverrides": {},
    "references": [],
}
