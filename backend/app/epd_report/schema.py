"""
EpdReportInput — the typed, validated input of the report module.

JSON field names are camelCase (as in the API contract); Python attributes are
snake_case. Unknown fields are rejected so typos surface as validation errors
instead of silently disappearing from the report.

Only the fields needed to produce *a* document are required here (product name,
functional unit description, module declaration, results, selection).
Completeness for a publishable EPD (declaration number, PCR, verification …)
is checked later by ``validation.py`` and reported as errors/warnings.
"""

from typing import Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel

from .modules import normalize_module_code


class _Model(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="forbid",
        str_strip_whitespace=True,
    )


# ---------------------------------------------------------------- primitives

Number = Union[int, float]


class Quantity(_Model):
    value: Optional[Number] = None
    unit: Optional[str] = None


class Amount(_Model):
    amount: Optional[Number] = None
    unit: Optional[str] = None


class NamedValue(_Model):
    name: str
    value: Optional[Union[Number, str]] = None
    unit: Optional[str] = None
    note: Optional[str] = None


class NamedVersion(_Model):
    name: str
    version: Optional[str] = None


class PersonRef(_Model):
    name: Optional[str] = None
    organization: Optional[str] = None
    email: Optional[str] = None
    signature_image: Optional[str] = None


class Image(_Model):
    caption: Optional[str] = None
    data: str  # data URI or base64 (png/jpeg/svg)


# ---------------------------------------------------------------- meta & parties

class Branding(_Model):
    primary_color: Optional[str] = None
    chart_palette: Optional[List[str]] = None  # categorical order; validate before use (see README)
    logo: Optional[str] = None
    cover_image: Optional[str] = None


class Meta(_Model):
    declaration_number: Optional[str] = None
    issue_date: Optional[str] = None          # ISO yyyy-mm-dd
    valid_until: Optional[str] = None         # ISO yyyy-mm-dd
    validity_period_text: Optional[str] = None
    validity_years: Optional[Number] = None
    epd_type: Optional[str] = None
    scope: Optional[str] = None               # Cradle-to-gate | Cradle-to-gate with options | Cradle-to-grave
    markets_of_applicability: List[str] = Field(default_factory=list)
    reference_year_of_primary_data: Optional[Union[str, int]] = None
    range_of_dataset_variability: Optional[str] = None
    language: Optional[str] = "en"
    branding: Branding = Field(default_factory=Branding)


class Organization(_Model):
    name: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    logo: Optional[str] = None
    description: Optional[str] = None
    general_program_instructions: Optional[str] = None


class PcrPart(_Model):
    name: str
    publisher: Optional[str] = None
    version: Optional[str] = None
    year: Optional[Union[str, int]] = None


class Pcr(_Model):
    parts: List[PcrPart] = Field(default_factory=list)
    review_panel: List[PersonRef] = Field(default_factory=list)
    standards: List[str] = Field(default_factory=list)


class Verification(_Model):
    epd_verifier: Optional[PersonRef] = None
    lca_verifier: Optional[PersonRef] = None
    lca_practitioner: Optional[PersonRef] = None
    type: Optional[Literal["internal", "external"]] = None
    verified: bool = False


class LcaSetup(_Model):
    software: Optional[NamedVersion] = None
    lci_databases: List[NamedVersion] = Field(default_factory=list)
    lcia_methods: List[NamedVersion] = Field(default_factory=list)
    allocation_text: Optional[str] = None
    cut_off_text: Optional[str] = None
    data_quality_text: Optional[str] = None
    excluded_flows: List[str] = Field(default_factory=list)
    biogenic_carbon_text: Optional[str] = None
    limitations_text: Optional[str] = None
    assumptions_text: Optional[str] = None


# ---------------------------------------------------------------- product

class ClassificationCode(_Model):
    system: str
    code: str


class Product(_Model):
    name: str
    trade_names: List[str] = Field(default_factory=list)
    variants_text: Optional[str] = None
    classification_codes: List[ClassificationCode] = Field(default_factory=list)
    description: Optional[str] = None
    intended_application: Optional[str] = None
    images: List[Image] = Field(default_factory=list)
    technical_data: List[NamedValue] = Field(default_factory=list)
    dimensions: List[NamedValue] = Field(default_factory=list)
    reference_service_life: Optional[Quantity] = None
    building_estimated_service_life: Optional[Quantity] = None
    hazardous_substances_statement: Optional[str] = None
    standards_and_certifications: List[str] = Field(default_factory=list)


class FunctionalUnit(_Model):
    type: Literal["functional", "declared"] = "declared"
    description: str
    unit_label: Optional[str] = None
    mass_per_unit: Optional[Quantity] = None
    reference_product_mass: Optional[Quantity] = None
    reference_product_description: Optional[str] = None
    extra_parameters: List[NamedValue] = Field(default_factory=list)


class MaterialItem(_Model):
    material: str
    mass: Optional[Number] = None
    unit: Optional[str] = "kg"
    percentage: Optional[Number] = None
    recycled_content_pct: Optional[Number] = None
    is_hazardous: Optional[bool] = None
    cas_number: Optional[str] = None


class MaterialComposition(_Model):
    basis: str = "per functional unit"
    items: List[MaterialItem] = Field(default_factory=list)


class PackagingItem(_Model):
    material: str
    mass: Optional[Number] = None
    unit: Optional[str] = "kg"
    disposal_route: Optional[str] = None


class Site(_Model):
    id: Optional[str] = None
    name: str
    location: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None


class EnergyInput(_Model):
    carrier: str
    amount: Optional[Number] = None
    unit: Optional[str] = None
    dataset_name: Optional[str] = None


class WasteItem(_Model):
    type: str
    amount: Optional[Number] = None
    unit: Optional[str] = None
    route: Optional[str] = None


class Manufacturing(_Model):
    sites: List[Site] = Field(default_factory=list)
    process_description: Optional[str] = None
    energy_inputs: List[EnergyInput] = Field(default_factory=list)
    wastes: List[WasteItem] = Field(default_factory=list)


# ---------------------------------------------------------------- scenarios

class _Scenario(_Model):
    notes: Optional[str] = None
    extra_parameters: List[NamedValue] = Field(default_factory=list)


class TransportLeg(_Model):
    mode: Optional[str] = None
    vehicle_type: Optional[str] = None
    fuel_type: Optional[str] = None
    fuel_efficiency: Optional[str] = None
    distance_km: Optional[Number] = None
    capacity_utilization_pct: Optional[Number] = None
    gross_density: Optional[str] = None
    volume_capacity_factor: Optional[Number] = None


class ScenarioA4(_Scenario):
    legs: List[TransportLeg] = Field(default_factory=list)


class TypedAmount(_Model):
    type: Optional[str] = None
    route: Optional[str] = None
    carrier: Optional[str] = None
    name: Optional[str] = None
    amount: Optional[Number] = None
    unit: Optional[str] = None


class ScenarioA5(_Scenario):
    energy_carriers: List[TypedAmount] = Field(default_factory=list)
    ancillary_materials: List[TypedAmount] = Field(default_factory=list)
    water_use: Optional[Amount] = None
    product_loss_pct: Optional[Number] = None
    packaging_waste: List[TypedAmount] = Field(default_factory=list)
    direct_emissions: List[TypedAmount] = Field(default_factory=list)


class ScenarioGeneric(_Scenario):
    """B1, B3, B5: description + arbitrary items."""
    description: Optional[str] = None
    cycles: Optional[Number] = None
    items: List[TypedAmount] = Field(default_factory=list)
    direct_emissions: List[TypedAmount] = Field(default_factory=list)


class ScenarioB4(ScenarioGeneric):
    replacement_cycles: Optional[Number] = None


class GridMixEntry(_Model):
    region: str
    share_pct: Optional[Number] = None
    emission_factor: Optional[Number] = None
    emission_factor_unit: Optional[str] = None


class ScenarioB6(_Scenario):
    annual_energy: List[TypedAmount] = Field(default_factory=list)
    lifetime_energy: Optional[Amount] = None
    per_functional_unit: Optional[Amount] = None
    grid_mix: List[GridMixEntry] = Field(default_factory=list)
    calculation_method_text: Optional[str] = None


class ScenarioB7(_Scenario):
    annual_water: Optional[Number] = None
    unit: Optional[str] = None


class ScenarioEol(_Scenario):
    collected_separately: Optional[Amount] = None
    collected_mixed: Optional[Amount] = None
    reuse: Optional[Amount] = None
    recycling: Optional[Amount] = None
    energy_recovery: Optional[Amount] = None
    landfill: Optional[Amount] = None
    incineration: Optional[Amount] = None
    distances: Dict[str, Amount] = Field(default_factory=dict)


class ScenarioD(_Scenario):
    description: Optional[str] = None


class Scenarios(_Model):
    A4: Optional[ScenarioA4] = Field(default=None, alias="A4")
    A5: Optional[ScenarioA5] = Field(default=None, alias="A5")
    B1: Optional[ScenarioGeneric] = Field(default=None, alias="B1")
    B2: Optional[ScenarioGeneric] = Field(default=None, alias="B2")
    B3: Optional[ScenarioGeneric] = Field(default=None, alias="B3")
    B4: Optional[ScenarioB4] = Field(default=None, alias="B4")
    B5: Optional[ScenarioGeneric] = Field(default=None, alias="B5")
    B6: Optional[ScenarioB6] = Field(default=None, alias="B6")
    B7: Optional[ScenarioB7] = Field(default=None, alias="B7")
    C1_C4: Optional[ScenarioEol] = Field(default=None, alias="C1_C4")
    D: Optional[ScenarioD] = Field(default=None, alias="D")


# ---------------------------------------------------------------- modules & results

ModuleStatus = Literal["declared", "MND", "ND", "not relevant"]


class ModuleDeclaration(_Model):
    code: str
    label: Optional[str] = None
    group: Optional[str] = None
    status: ModuleStatus = "declared"
    geography: Optional[str] = None

    @field_validator("code")
    @classmethod
    def _norm(cls, v: str) -> str:
        return normalize_module_code(v)


class ResultRow(_Model):
    indicator_code: str
    values: Dict[str, Optional[Number]] = Field(default_factory=dict)

    @field_validator("values")
    @classmethod
    def _norm(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        return {normalize_module_code(k): val for k, val in v.items()}


class ResultSet(_Model):
    variant_id: str = "default"
    variant_label: Optional[str] = None
    method: str
    indicator_group: Optional[str] = None
    rows: List[ResultRow] = Field(default_factory=list)


class SupplementalRow(_Model):
    indicator_code: str
    method: Optional[str] = None
    values: Dict[str, Optional[Number]] = Field(default_factory=dict)


class SupplementalResult(_Model):
    title: str
    description: Optional[str] = None
    method: Optional[str] = None
    columns: List[str]
    rows: List[SupplementalRow] = Field(default_factory=list)


class MaterialContribution(_Model):
    material: str
    share_pct: Number
    indicator_code: Optional[str] = None


class Reference(_Model):
    citation: str
    url: Optional[str] = None


class CustomSection(_Model):
    after_section: str
    title: str
    markdown: str


class Selection(_Model):
    standard: Optional[str] = None
    methods: List[str] = Field(min_length=1)
    primary_method: Optional[str] = None
    indicator_filter: Literal["all", "pcrMandatory", "core"] = "all"
    product_category_id: str = "generic"
    variant_ids: Optional[List[str]] = None


class EpdReportInput(_Model):
    selection: Selection
    meta: Meta = Field(default_factory=Meta)
    program_operator: Organization = Field(default_factory=Organization)
    manufacturer: Organization = Field(default_factory=Organization)
    pcr: Pcr = Field(default_factory=Pcr)
    verification: Verification = Field(default_factory=Verification)
    lca_setup: LcaSetup = Field(default_factory=LcaSetup)
    product: Product
    data_category_id: Optional[str] = None  # category the product-specific data was entered for
    functional_unit: Optional[FunctionalUnit] = None
    material_composition: Optional[MaterialComposition] = None
    packaging: List[PackagingItem] = Field(default_factory=list)
    manufacturing: Optional[Manufacturing] = None
    scenarios: Scenarios = Field(default_factory=Scenarios)
    modules: List[ModuleDeclaration] = Field(default_factory=list)
    results: List[ResultSet] = Field(min_length=1)
    supplemental_results: List[SupplementalResult] = Field(default_factory=list)
    material_contribution: List[MaterialContribution] = Field(default_factory=list)
    references: List[Reference] = Field(default_factory=list)
    custom_sections: List[CustomSection] = Field(default_factory=list)
    text_overrides: Dict[str, str] = Field(default_factory=dict)


# ---------------------------------------------------------------- options & output

class ReportOptions(_Model):
    paper: Literal["A4", "Letter"] = "Letter"
    precision: int = Field(default=2, ge=0, le=6)
    column_mode: Literal["both", "aggregated", "submodules"] = "both"
    show_total: bool = False
    dominant_threshold_pct: float = 80.0
    aggregate_tolerance_pct: float = 1.0
    max_columns_per_table: int = 14
    include_toc: bool = True
    draft_watermark_on_errors: bool = True
    template_id: str = "default"
    build_date: Optional[str] = None  # ISO date for the filename/metadata; set by the API layer
    ai_wording_hook: bool = False  # reserved; deterministic templates only for now


class ReportWarning(_Model):
    level: Literal["error", "warning", "info"]
    code: str
    message: str
    path: Optional[str] = None
