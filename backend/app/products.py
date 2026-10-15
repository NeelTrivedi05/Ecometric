"""
Product registry: everything that differs between the product categories the
studio supports (functional unit, PCR rulesets, PCR default scenarios, which
use-stage models apply, end-of-life / module D datasets, and the material
keywords used to pick ecoinvent datasets for BOM lines).

Datasets are referenced by exact ecoinvent v3.12 activity name + geography and
resolved to a row at runtime (see engines/material_matcher.py), so they keep
working if row numbers shift between database releases.
"""

from typing import Any, Dict, List, Optional

DEFAULT_PRODUCT_ID = "water_cooled_chiller"

# (activity name, preferred geographies in order)
Dataset = Dict[str, Any]


def ds(activity: str, *geos: str, product: Optional[str] = None) -> Dataset:
    """Dataset reference; `product` disambiguates multi-output activities (same name, several products)."""
    d = {"activity": activity, "geos": list(geos)}
    if product:
        d["product"] = product
    return d


# ---------------------------------------------------------------------------
# Material keyword library: first matching entry wins. Keywords are matched
# against "<name> <material>" of a BOM line (lower-case, substring match).
# Product-specific lists are checked before the generic list.
# ---------------------------------------------------------------------------
GENERIC_MATERIALS: List[Dict[str, Any]] = [
    {"keywords": ["electronic", "circuit board", "pcb", "vfd", "variable frequency", "inverter", "control board", "controller"],
     "dataset": ds("market for electronics, for control units", "GLO")},
    {"keywords": ["electric motor", "motor"], "dataset": ds("market for electric motor, vehicle", "GLO")},
    {"keywords": ["stainless"], "dataset": ds("market for steel, chromium steel 18/8", "GLO")},
    {"keywords": ["cast iron", "grey iron", "ductile iron"], "dataset": ds("market for cast iron", "GLO")},
    {"keywords": ["reinforcing steel", "rebar"], "dataset": ds("market for reinforcing steel", "GLO")},
    {"keywords": ["steel", "iron"], "dataset": ds("market for steel, low-alloyed, hot rolled", "GLO")},
    {"keywords": ["copper", "brass"], "dataset": ds("market for copper, cathode", "GLO")},
    {"keywords": ["aluminium", "aluminum"], "dataset": ds("market for aluminium, wrought alloy", "GLO")},
    {"keywords": ["polyurethane", "pu foam", "puf"], "dataset": ds("market for polyurethane, rigid foam", "RER", "RoW")},
    {"keywords": ["pvc", "polyvinyl chloride", "polyvinylchloride", "vinyl"],
     "dataset": ds("market for polyvinyl chloride, suspension polymerised", "RER", "RoW")},
    {"keywords": ["hdpe", "high density polyethylene", "high-density polyethylene"],
     "dataset": ds("market for polyethylene, high density, granulate", "RER", "RoW")},
    {"keywords": ["film", "shrink wrap", "stretch wrap", "ldpe"],
     "dataset": ds("market for packaging film, low density polyethylene", "GLO")},
    {"keywords": ["xlpe", "polyethylene"], "dataset": ds("market for polyethylene, low density, granulate", "RER", "RoW")},
    {"keywords": ["corrugated", "cardboard", "carton", "paper"], "dataset": ds("market for corrugated board box", "RER", "RoW")},
    {"keywords": ["glass fibre", "glass fiber", "fiberglass", "fibreglass"], "dataset": ds("market for glass fibre", "GLO")},
    {"keywords": ["silicone"], "dataset": ds("market for silicone product", "RER", "RoW")},
    {"keywords": ["water"], "dataset": ds("market for tap water", "RoW")},
]

PRODUCT_MATERIALS: Dict[str, List[Dict[str, Any]]] = {
    "ceramic_tile": [
        {"keywords": ["frit", "glaze", "enamel", "engobe"], "dataset": ds("market for frit, for ceramic tile", "GLO")},
        {"keywords": ["kaolin", "china clay"], "dataset": ds("market for kaolin", "GLO")},
        {"keywords": ["feldspar"], "dataset": ds("market for feldspar", "GLO")},
        {"keywords": ["clay"], "dataset": ds("market for clay", "RoW")},
        {"keywords": ["sand", "quartz", "silica"], "dataset": ds("market for sand", "RoW")},
        {"keywords": ["ceramic tile", "porcelain tile", "floor tile", "tile"], "dataset": ds("market for ceramic tile", "GLO")},
    ],
    "concrete_block": [
        {"keywords": ["cement", "portland", "opc", "binder"], "dataset": ds("market for cement, Portland", "RoW")},
        {"keywords": ["sand", "fine aggregate"], "dataset": ds("market for sand", "RoW")},
        {"keywords": ["gravel", "coarse aggregate", "crushed stone", "aggregate", "chippings"],
         "dataset": ds("market for gravel, crushed", "RoW")},
        {"keywords": ["concrete block", "masonry unit", "cmu", "paver", "paving"],
         "dataset": ds("market for concrete block", "RoW")},
    ],
    "flat_glass": [
        {"keywords": ["temper", "toughen", "heat treat", "heat-treat"], "dataset": ds("market for tempering, flat glass", "GLO")},
        {"keywords": ["coated", "low-e", "low e", "solar control"], "dataset": ds("market for flat glass, coated", "RER", "RoW")},
        {"keywords": ["glass", "float", "pane", "lite"], "dataset": ds("market for flat glass, uncoated", "RER", "RoW")},
        {"keywords": ["argon", "krypton", "gas fill"], "dataset": ds("market for argon, liquid", "RER", "RoW")},
        {"keywords": ["polysulfide", "polysulphide", "secondary seal", "sealant"],
         "dataset": ds("market for polysulfide, sealing compound", "GLO")},
        {"keywords": ["desiccant", "molecular sieve", "zeolite"], "dataset": ds("market for zeolite, powder", "GLO")},
    ],
    "plastic_pipe": [
        {"keywords": ["calcium carbonate", "caco3", "chalk", "filler"],
         "dataset": ds("market for calcium carbonate, precipitated", "RER", "RoW")},
        {"keywords": ["titanium dioxide", "tio2"], "dataset": ds("market for titanium dioxide", "RER", "RoW")},
        {"keywords": ["extrusion"], "dataset": ds("market for extrusion, plastic pipes", "GLO")},
    ],
    "electrical_cable": [
        {"keywords": ["wire drawing"], "dataset": ds("market for wire drawing, copper", "GLO")},
        {"keywords": ["conductor", "copper"], "dataset": ds("market for copper, cathode", "GLO")},
        {"keywords": ["insulation", "sheath", "jacket", "bedding"] , "requires": ["pvc", "vinyl"],
         "dataset": ds("market for polyvinyl chloride, suspension polymerised", "RER", "RoW")},
    ],
}

# Default datasets for energy, water and transport (resolved by region at runtime).
ENERGY_DATASETS = {
    "electricity": {
        "US": ds("market group for electricity, medium voltage", "US"),
        "CA": ds("market group for electricity, medium voltage", "CA"),
        "RER": ds("market group for electricity, medium voltage", "RER"),
        "IN": ds("market group for electricity, medium voltage", "IN"),
        "CN": ds("market group for electricity, medium voltage", "CN"),
        "BR": ds("market group for electricity, medium voltage", "BR"),
        "GLO": ds("market group for electricity, medium voltage", "GLO"),
        "_country": "market for electricity, medium voltage",
    },
    "natural_gas": ds("market for heat, district or industrial, natural gas", "RoW"),
    "water": ds("market for tap water", "RoW"),
    "diesel_machine": ds("diesel, burned in building machine", "GLO"),
    "lorry": ds("market for transport, freight, lorry, >32 metric ton, diesel, EURO 6", "RoW"),
    "lorry_16_32": ds("market for transport, freight, lorry, 16-32 metric ton, diesel, EURO 5", "RoW"),
    "ship": ds("market for transport, freight, sea, container ship, heavy fuel oil", "GLO"),
    "train": {"US": ds("market for transport, freight, train, fleet average", "US"),
              "_default": ds("market for transport, freight, train, fleet average", "Europe without Switzerland", "RoW")},
    "lubricating_oil": ds("market for lubricating oil", "RER", "RoW"),
}

# ---------------------------------------------------------------------------
# Product profiles
# ---------------------------------------------------------------------------
PRODUCTS: Dict[str, Dict[str, Any]] = {
    "water_cooled_chiller": {
        "id": "water_cooled_chiller",
        "name": "Water-Cooled Chiller",
        "description": "Packaged water-cooled chillers (centrifugal, screw, scroll, reciprocating, absorption).",
        "examples": ["Centrifugal chiller", "Screw chiller", "Scroll chiller"],
        "pcr": {
            "label": "UL 10010-4 Part B: Water Cooled Chiller v2.0",
            "rulesets": ["ul-10010-4-chiller-v2.0"],
            "standard": "ISO 21930:2017 / EN 15804",
            "program_operator": "UL Environment",
        },
        "functional_unit": "1 ton of chilling capacity (RT) over the reference service life",
        "declared_unit": "1 packaged chiller",
        "fu_unit": "RT",
        "fu_quantity_field": "operational.capacity_rt",
        "default_rsl_years": 25,
        "esl_years": 75,
        "modules": {"required": ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "C1", "C2", "C3", "C4"],
                    "optional": [], "forbidden": ["D"]},
        "use_stage": {"refrigerant": True, "b6_model": "chiller_kw_per_ton", "b7_model": "cooling_tower"},
        "defaults": {
            "a4_distance_km": 500, "c2_distance_km": 100,
            "installation_crane_diesel_l": 37.8,
            "annual_operating_hours": 4500,
            "eol": {"recycling_rate_percent": 90.0, "landfill_rate_percent": 10.0, "incineration_rate_percent": 0.0},
            "recovery_rate_percent": 90.0,
        },
        "eol_datasets": {
            "recycling": ds("sorting and pressing of iron scrap", "RoW"),
            "incineration": ds("treatment of municipal solid waste, municipal incineration", "RoW"),
            "landfill": ds("market for process-specific burdens, sanitary landfill", "RoW"),
        },
        "d_datasets": {"virgin": ds("market for steel, low-alloyed, hot rolled", "GLO"),
                       "recycled": ds("market for steel, structural, 100% scrap", "GLO")},
        "technical_fields": [
            {"key": "capacity_rt", "label": "Chilling capacity", "unit": "RT", "section": "operational"},
            {"key": "efficiency_kw_per_ton", "label": "Efficiency", "unit": "kW/ton", "section": "operational"},
            {"key": "refrigerant_type", "label": "Refrigerant", "unit": "", "section": "operational"},
            {"key": "refrigerant_charge_kg", "label": "Refrigerant charge", "unit": "kg", "section": "operational"},
        ],
        "search_tags": ["steel", "copper", "aluminium", "electric motor", "polyurethane", "inverter", "refrigerant"],
    },
    "ceramic_tile": {
        "id": "ceramic_tile",
        "name": "Ceramic / Porcelain Floor Tiles",
        "description": "Ceramic, porcelain, quarry, mosaic and glass floor tiles (UL flooring PCR, ceramic tile sub-category).",
        "examples": ["Porcelain floor tile", "Glazed ceramic tile", "Quarry tile"],
        "pcr": {
            "label": "UL 10010-7 Part B: Flooring v2.0 (ceramic tile)",
            "rulesets": ["ul-10010-7-flooring-v2.0"],
            "standard": "ISO 21930:2017 / EN 15804",
            "program_operator": "UL Environment",
        },
        "functional_unit": "1 m² of installed floor covering over the reference service life",
        "declared_unit": "1 m² of ceramic tile",
        "fu_unit": "m²",
        "fu_quantity_field": "project_info.fu_quantity",
        "default_rsl_years": None,  # UL 10010-7 sets no default; manufacturer must declare
        "esl_years": 75,
        "modules": {"required": ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "C1", "C2", "C3", "C4"],
                    "optional": ["D"], "forbidden": []},
        "use_stage": {"refrigerant": False, "b6_model": "annual_energy", "b7_model": "annual_water", "cleaning": True},
        "defaults": {
            "a4_distance_km": 800, "c2_distance_km": 161,   # UL 10010-7 Table 7 (North America)
            "installation_crane_diesel_l": 0,
            "eol": None,
            "recovery_rate_percent": 0.0,
        },
        "eol_datasets": {
            "recycling": ds("market for waste brick", "RoW"),
            "incineration": ds("treatment of municipal solid waste, municipal incineration", "RoW"),
            "landfill": ds("market for inert waste", "RER", "RoW"),
        },
        "d_datasets": None,
        "technical_fields": [
            {"key": "tile_class", "label": "Class (P1-P4, E1-E4, O1-O4)", "unit": "", "section": "technical_data"},
            {"key": "tile_type", "label": "Tile type", "unit": "", "section": "technical_data"},
            {"key": "thickness_mm", "label": "Thickness", "unit": "mm", "section": "technical_data"},
            {"key": "product_weight_g_m2", "label": "Product weight", "unit": "g/m²", "section": "technical_data"},
        ],
        "search_tags": ["clay", "kaolin", "feldspar", "sand", "frit", "ceramic tile", "corrugated board"],
    },
    "electrical_cable": {
        "id": "electrical_cable",
        "name": "Electrical Cables & Wires",
        "description": "Power and control cables, wires and accessories (EPD International c-PCR-004, non-construction).",
        "examples": ["PVC-insulated copper cable", "XLPE power cable", "Building wire"],
        "pcr": {
            "label": "EPD International c-PCR-004 Wires, cables and accessories + PCR 2024:06",
            "rulesets": ["epd-intl-pcr-2024-06-v1.0.1", "epd-intl-c-pcr-004-wires-cables-v1.0.0"],
            "standard": "EN 50693 / ISO 14025",
            "program_operator": "EPD International",
        },
        "functional_unit": "1 m of cable over the reference service life (confirm against PEP PSR-0001)",
        "declared_unit": None,  # c-PCR-004 allows functional unit only
        "fu_unit": "m",
        "fu_quantity_field": "project_info.fu_quantity",
        "default_rsl_years": None,
        "esl_years": None,
        "modules": {"required": ["A1", "A2", "A3", "A4", "A5", "B6", "C1", "C2", "C3", "C4"],
                    "optional": ["B1", "B2", "B3", "B4", "B5", "B7"], "forbidden": ["D"]},
        "use_stage": {"refrigerant": False, "b6_model": "annual_energy", "b7_model": "none"},
        "defaults": {"a4_distance_km": None, "c2_distance_km": None, "installation_crane_diesel_l": 0,
                     "eol": None, "recovery_rate_percent": 0.0},
        "eol_datasets": {
            "recycling": ds("treatment of used cable", "GLO", product="used cable"),
            "incineration": ds("treatment of municipal solid waste, municipal incineration", "RoW"),
            "landfill": ds("market for process-specific burdens, sanitary landfill", "RoW"),
        },
        "d_datasets": None,
        "technical_fields": [
            {"key": "conductor_material", "label": "Conductor material", "unit": "", "section": "technical_data"},
            {"key": "cross_section_mm2", "label": "Conductor cross-section", "unit": "mm²", "section": "technical_data"},
            {"key": "rated_voltage_v", "label": "Rated voltage", "unit": "V", "section": "technical_data"},
            {"key": "mass_per_m_kg", "label": "Mass per metre", "unit": "kg/m", "section": "technical_data"},
        ],
        "search_tags": ["copper", "wire drawing", "polyvinyl chloride", "polyethylene", "aluminium", "cable"],
    },
    "concrete_block": {
        "id": "concrete_block",
        "name": "Concrete Blocks & Pavers",
        "description": "Concrete masonry units, segmental pavers and other precast concrete elements (EN 16757).",
        "examples": ["Hollow concrete block", "Interlocking paver", "Paving slab"],
        "pcr": {
            "label": "EPD International c-PCR-003 Concrete (EN 16757) + PCR 2019:14",
            "rulesets": ["epd-intl-pcr-2019-14-v2.0.1", "epd-intl-c-pcr-003-concrete-v1.0.0"],
            "standard": "EN 15804+A2",
            "program_operator": "EPD International",
        },
        "functional_unit": None,
        "declared_unit": "1 tonne of concrete blocks / pavers (EN 16757 also allows 1 m³)",
        "fu_unit": "t",
        "fu_quantity_field": "project_info.fu_quantity",
        "default_rsl_years": None,
        "esl_years": None,
        "modules": {"required": ["A1", "A2", "A3", "C1", "C2", "C3", "C4", "D"],
                    "optional": ["A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7"], "forbidden": []},
        "use_stage": {"refrigerant": False, "b6_model": "none", "b7_model": "none"},
        "defaults": {
            "a4_distance_km": None, "c2_distance_km": 80,   # PCR 2019:14 Table 4 (not incinerated)
            "installation_crane_diesel_l": 0,
            "c1_diesel_kwh_per_tonne": 5.0,                 # PCR 2019:14 Table 4: masonry, tiles, pavers
            "eol": None,
            "recovery_rate_percent": None,
        },
        "eol_datasets": {
            "recycling": ds("treatment of waste concrete gravel, recycling", "RoW"),
            "incineration": ds("treatment of municipal solid waste, municipal incineration", "RoW"),
            "landfill": ds("treatment of waste concrete, inert material landfill", "Europe without Switzerland", "RoW"),
        },
        "d_datasets": {"virgin": ds("market for gravel, crushed", "RoW"),
                       "recycled": ds("treatment of waste concrete gravel, recycling", "RoW")},
        "technical_fields": [
            {"key": "compressive_strength_mpa", "label": "Compressive strength", "unit": "MPa", "section": "technical_data"},
            {"key": "density_kg_m3", "label": "Density", "unit": "kg/m³", "section": "technical_data"},
            {"key": "dimensions_mm", "label": "Dimensions (L×W×H)", "unit": "mm", "section": "technical_data"},
        ],
        "search_tags": ["cement, Portland", "sand", "gravel, crushed", "tap water", "concrete block", "fly ash"],
    },
    "flat_glass": {
        "id": "flat_glass",
        "name": "Flat Glass / Insulating Glass Units",
        "description": "Float, coated, tempered and laminated glass and insulating glass units (EN 17074).",
        "examples": ["Double-glazed IGU", "Tempered glass", "Low-E coated glass"],
        "pcr": {
            "label": "EPD International c-PCR-009 Flat glass (EN 17074) + PCR 2019:14",
            "rulesets": ["epd-intl-pcr-2019-14-v2.0.1", "epd-intl-c-pcr-009-flat-glass-v1.0.0"],
            "standard": "EN 15804+A2",
            "program_operator": "EPD International",
        },
        "functional_unit": None,
        "declared_unit": "1 m² of glass product (state thickness / build-up)",
        "fu_unit": "m²",
        "fu_quantity_field": "project_info.fu_quantity",
        "default_rsl_years": None,
        "esl_years": None,
        "modules": {"required": ["A1", "A2", "A3", "C1", "C2", "C3", "C4", "D"],
                    "optional": ["A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7"], "forbidden": []},
        "use_stage": {"refrigerant": False, "b6_model": "none", "b7_model": "none"},
        "defaults": {"a4_distance_km": None, "c2_distance_km": 80, "installation_crane_diesel_l": 0,
                     "c1_diesel_kwh_per_tonne": 1.1, "eol": None, "recovery_rate_percent": None},
        "eol_datasets": {
            "recycling": ds("treatment of waste glass sheet, sorting plant", "RoW"),
            "incineration": ds("treatment of municipal solid waste, municipal incineration", "RoW"),
            "landfill": ds("market for inert waste", "RER", "RoW"),
        },
        "d_datasets": {"virgin": ds("market for flat glass, uncoated", "RER", "RoW"),
                       "recycled": ds("market for glass cullet, sorted", "RER", "RoW")},
        "technical_fields": [
            {"key": "build_up", "label": "Build-up (e.g. 4-16Ar-4)", "unit": "", "section": "technical_data"},
            {"key": "thickness_mm", "label": "Total glass thickness", "unit": "mm", "section": "technical_data"},
            {"key": "u_value_w_m2k", "label": "U-value", "unit": "W/m²K", "section": "technical_data"},
            {"key": "mass_per_m2_kg", "label": "Mass per m²", "unit": "kg/m²", "section": "technical_data"},
        ],
        "search_tags": ["flat glass, uncoated", "flat glass, coated", "tempering", "argon", "aluminium", "polysulfide"],
    },
    "plastic_pipe": {
        "id": "plastic_pipe",
        "name": "PVC / Plastic Pipes",
        "description": "Plastic piping systems inside buildings: PVC-U, CPVC, PE, PP, PEX pipes and fittings (EN 16904).",
        "examples": ["PVC-U drain pipe", "PVC pressure pipe", "HDPE pipe"],
        "pcr": {
            "label": "EPD International c-PCR-036 Plastic piping (EN 16904) + PCR 2019:14",
            "rulesets": ["epd-intl-pcr-2019-14-v2.0.1", "epd-intl-c-pcr-036-plastic-piping-v1.0.0"],
            "standard": "EN 15804+A2",
            "program_operator": "EPD International",
        },
        "functional_unit": None,
        "declared_unit": "1 m of pipe (state nominal diameter and wall thickness)",
        "fu_unit": "m",
        "fu_quantity_field": "project_info.fu_quantity",
        "default_rsl_years": None,
        "esl_years": None,
        "modules": {"required": ["A1", "A2", "A3", "C1", "C2", "C3", "C4", "D"],
                    "optional": ["A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7"], "forbidden": []},
        "use_stage": {"refrigerant": False, "b6_model": "none", "b7_model": "none"},
        "defaults": {"a4_distance_km": None, "c2_distance_km": 80, "installation_crane_diesel_l": 0,
                     "c1_diesel_kwh_per_tonne": 1.1, "eol": None, "recovery_rate_percent": None},
        "eol_datasets": {
            "recycling": ds("treatment of waste polyvinylchloride product, collection for final disposal", "RoW"),
            "incineration": ds("treatment of municipal solid waste, municipal incineration", "RoW"),
            "landfill": ds("market for process-specific burdens, sanitary landfill", "RoW"),
        },
        "d_datasets": {"virgin": ds("market for polyvinyl chloride, suspension polymerised", "RER", "RoW"),
                       "recycled": ds("market for polyvinylchloride, rigid, pellets, recycled", "RER")},
        "technical_fields": [
            {"key": "pipe_material", "label": "Pipe material", "unit": "", "section": "technical_data"},
            {"key": "nominal_diameter_mm", "label": "Nominal diameter", "unit": "mm", "section": "technical_data"},
            {"key": "wall_thickness_mm", "label": "Wall thickness", "unit": "mm", "section": "technical_data"},
            {"key": "mass_per_m_kg", "label": "Mass per metre", "unit": "kg/m", "section": "technical_data"},
        ],
        "search_tags": ["polyvinyl chloride", "calcium carbonate", "titanium dioxide", "extrusion, plastic pipes", "polyethylene"],
    },
}


def normalize_product_id(product_id: Optional[str]) -> str:
    pid = (product_id or "").strip().lower()
    return pid if pid in PRODUCTS else DEFAULT_PRODUCT_ID


def get_product(product_id: Optional[str]) -> Dict[str, Any]:
    return PRODUCTS[normalize_product_id(product_id)]


def is_chiller(product_id: Optional[str]) -> bool:
    return normalize_product_id(product_id) == "water_cooled_chiller"


def material_rules(product_id: Optional[str]) -> List[Dict[str, Any]]:
    return PRODUCT_MATERIALS.get(normalize_product_id(product_id), []) + GENERIC_MATERIALS


def list_products() -> List[Dict[str, Any]]:
    """Public summary for the UI."""
    out = []
    for p in PRODUCTS.values():
        out.append({
            "id": p["id"],
            "name": p["name"],
            "description": p["description"],
            "examples": p["examples"],
            "pcr": p["pcr"],
            "functional_unit": p["functional_unit"],
            "declared_unit": p["declared_unit"],
            "fu_unit": p["fu_unit"],
            "default_rsl_years": p["default_rsl_years"],
            "esl_years": p["esl_years"],
            "modules": p["modules"],
            "use_stage": p["use_stage"],
            "defaults": p["defaults"],
            "technical_fields": p["technical_fields"],
            "search_tags": p["search_tags"],
        })
    return out


def project_info_defaults(product_id: Optional[str]) -> Dict[str, Any]:
    p = get_product(product_id)
    return {
        "product_category": p["id"],
        "product_category_name": p["name"],
        "functional_unit": p["functional_unit"] or "",
        "declared_unit": p["declared_unit"] or "",
        "fu_unit": p["fu_unit"],
        "pcr_ref": p["pcr"]["label"],
        "pcr_rulesets": list(p["pcr"]["rulesets"]),
        "lifespan_years": p["default_rsl_years"],
        "building_esl_years": p["esl_years"],
    }
