import pytest

from app.engines.openepd_serializer import serialize_openepd_json
from app.engines.pcr_ruleset_engine import calculation_prerequisites


@pytest.mark.parametrize(("category", "unit"), [
    ("electrical_cable", "m"),
    ("water_cooled_chiller", "RT"),
])
def test_export_preserves_project_units_and_draft_status(category, unit):
    row = "acidification | accumulated exceedance (AE)"
    extracted = {"project_info": {"product_category": category, "product_name": "Test product"}}
    results = {
        "epd_results": {row: {"A1": 2, "A2": 3, "A3": 4}},
        "epd_metadata": {"row_units": {row: "mol H+-Eq"}},
    }
    draft = serialize_openepd_json(extracted, results, methodology="EF 3.1")
    assert draft["declared_unit"]["unit"] == unit
    assert draft["status"] == "Draft"
    assert draft["third_party_verification"]["status"] == "Unverified"
    assert draft["impacts"]["ap"]["unit"] == "mol H+-Eq"
    assert draft["impacts"]["ap"]["a1a3"] == 9
    assert draft["lca_methodology"] == "EF 3.1"


def test_factory_electricity_resolves_energy_check():
    def energy_status(inventory):
        return next(status for rule, status, _ in calculation_prerequisites(inventory)
                    if rule["id"] == "STUDIO.A3_ENERGY")

    assert energy_status({}) == "missing"
    assert energy_status({"manufacturing": {"annual_facility_kwh": 120}}) == "pass"
