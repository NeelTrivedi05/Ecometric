import pandas as pd
import pytest

from app.engines import lca_store
from app.engines.material_matcher import assign_bom_providers, rank_datasets


@pytest.fixture
def activity_table(monkeypatch):
    table = pd.DataFrame(
        [
            [10, "market for steel, low-alloyed, hot rolled", "RER", "steel", "kg"],
            [11, "market for steel, low-alloyed, hot rolled", "GLO", "steel", "kg"],
            [12, "treatment of waste, steel scrap, recycling", "RoW", "waste steel", "kg"],
            [13, "market for electricity, medium voltage", "US", "electricity", "kWh"],
        ],
        columns=["row", "activity", "geo", "product", "unit"],
    ).set_index("row")
    table["activity_l"] = table["activity"].str.lower()
    table["product_l"] = table["product"].str.lower()
    monkeypatch.setattr(lca_store, "activities", lambda: table)
    return table


def test_exact_material_match_prefers_project_geography(activity_table):
    bom = [{"id": "a", "name": "steel frame", "material": "steel", "mass": 2, "unit": "kg"}]
    stats = assign_bom_providers(bom, None, "RER")
    assert stats["matched"] == 1
    assert bom[0]["provider_id"] == "ecoinvent_row_10"
    assert bom[0]["source"] == "supabase"


def test_waste_dataset_is_excluded_for_ordinary_material(activity_table):
    hits = rank_datasets("steel", "GLO", "kg", strict_unit=True, allow_waste=False)
    assert all("waste" not in hit["reference_product_name"].lower() for hit in hits)


def test_incompatible_mass_unit_is_unmatched(activity_table):
    bom = [{"id": "a", "name": "steel frame", "material": "steel", "mass": 2, "unit": "m3"}]
    stats = assign_bom_providers(bom, None)
    assert stats["unmatched"] == 1
    assert bom[0]["ecoinvent_matched"] is False
    assert "expected kg" in bom[0]["match_error"]


def test_user_selected_provider_is_preserved(activity_table):
    bom = [{
        "id": "a", "name": "unknown", "material": "unknown", "mass": 2, "unit": "kg",
        "provider_id": "ecoinvent_row_11", "match_method": "user_selected",
        "ecoinvent_matched": True,
    }]
    stats = assign_bom_providers(bom, None, "RER", overwrite=True)
    assert stats["kept"] == 1
    assert bom[0]["provider_id"] == "ecoinvent_row_11"


def test_unavailable_store_does_not_fabricate(monkeypatch):
    monkeypatch.setattr(lca_store, "activities", lambda: (_ for _ in ()).throw(
        lca_store.ReferenceStoreUnavailable("offline")
    ))
    bom = [{"id": "a", "name": "steel", "material": "steel", "mass": 1, "unit": "kg"}]
    stats = assign_bom_providers(bom, None)
    assert stats["unmatched"] == 1
    assert "provider_id" not in bom[0]
    assert bom[0]["match_error"] == "Reference database unavailable"
