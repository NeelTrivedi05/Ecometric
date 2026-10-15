"""
BuildContext — resolves an input + selection into everything the section
builders need: selected methods, standard, product profile, module statuses,
variants and registry-mapped results. Pure: no I/O, no hidden state.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple

from .modules import (
    AGGREGATES, CANONICAL_ORDER, DECLARED, DEFAULT_MODULE_INFO, MND, ND, SUBMODULES, complete_aggregates,
    is_number, normalize_module_code,
)
from .product_categories import CATEGORY_BOUND_FIELDS
from .registry import Indicator, Method, Registry, Standard
from .schema import (
    EpdReportInput, FunctionalUnit, MaterialComposition, PcrPart, ReportOptions, ReportWarning, Scenarios,
)
from .text_library import TextLibrary


class EpdReportError(Exception):
    """Raised when no document can be produced at all (e.g. no selected method has results)."""

    def __init__(self, message: str, warnings: Optional[List[ReportWarning]] = None):
        super().__init__(message)
        self.warnings = warnings or []


@dataclass
class ResultRowView:
    indicator: Indicator
    values: Dict[str, Optional[float]]


@dataclass
class ModuleInfo:
    code: str
    label: str
    group: str
    status: str
    geography: Optional[str] = None


@dataclass
class BuildContext:
    input: EpdReportInput
    options: ReportOptions
    registry: Registry
    profile: Dict[str, Any]
    template: Dict[str, Any]
    text: TextLibrary
    standard: Optional[Standard] = None
    methods: List[Method] = field(default_factory=list)
    primary: Optional[Method] = None
    modules: Dict[str, ModuleInfo] = field(default_factory=dict)
    variants: List[Tuple[str, str]] = field(default_factory=list)
    # (variant_id, method_id) -> indicator code -> row
    results: Dict[Tuple[str, str], Dict[str, ResultRowView]] = field(default_factory=dict)
    functional_unit: Optional[FunctionalUnit] = None
    scenarios: Scenarios = field(default_factory=Scenarios)
    material_composition: Optional[MaterialComposition] = None
    pcr_parts: List[PcrPart] = field(default_factory=list)
    scope: Optional[str] = None
    category_mismatch: bool = False
    warnings: List[ReportWarning] = field(default_factory=list)

    # ------------------------------------------------------------- helpers
    def warn(self, level: str, code: str, message: str, path: Optional[str] = None) -> None:
        self.warnings.append(ReportWarning(level=level, code=code, message=message, path=path))

    @property
    def statuses(self) -> Dict[str, str]:
        return {c: m.status for c, m in self.modules.items()}

    def status(self, code: str) -> str:
        code = normalize_module_code(code)
        if code in AGGREGATES:
            from .modules import aggregate_status
            return aggregate_status(self.statuses, code)
        m = self.modules.get(code)
        return m.status if m else MND

    def is_declared(self, code: str) -> bool:
        return self.status(code) == DECLARED

    def module_label(self, code: str) -> str:
        m = self.modules.get(code)
        if m:
            return m.label
        if code in AGGREGATES:
            return {"A1-A3": "Product stage", "C1-C4": "End-of-life stage"}[code]
        return DEFAULT_MODULE_INFO.get(code, (code, ""))[0]

    def mandatory_codes(self, method: Method) -> Set[str]:
        codes = {i.code for i in method.indicators if i.mandatory}
        if self.standard:
            codes |= set(self.standard.mandatory_indicators.get(method.id, []))
        codes |= set((self.profile.get("pcr") or {}).get("mandatoryIndicators", {}).get(method.id, []))
        return codes

    def passes_filter(self, method: Method, ind: Indicator) -> bool:
        f = self.input.selection.indicator_filter
        if f == "pcrMandatory":
            return ind.code in self.mandatory_codes(method)
        if f == "core":
            return ind.core
        return True

    def rows(self, variant_id: str, method: Method, group: Optional[str] = None,
             filtered: bool = True) -> List[ResultRowView]:
        rows = list(self.results.get((variant_id, method.id), {}).values())
        if group:
            rows = [r for r in rows if r.indicator.group == group]
        if filtered:
            rows = [r for r in rows if self.passes_filter(method, r.indicator)]
        return sorted(rows, key=lambda r: r.indicator.order)

    def shown_groups(self, method: Method) -> List[str]:
        """Indicator groups of a method that have rows for at least one variant (after filtering)."""
        return [g for g in method.group_ids() if any(self.rows(v, method, g) for v, _ in self.variants)]

    def text_get(self, key: str, default: Optional[str] = None) -> Optional[str]:
        return self.text.get(key, default)

    def variant_label(self, vid: str) -> str:
        return dict(self.variants).get(vid, vid)


# ------------------------------------------------------------------ construction

def build_context(inp: EpdReportInput, options: ReportOptions, registry: Registry,
                  profile: Dict[str, Any], template: Dict[str, Any]) -> BuildContext:
    text = TextLibrary(inp.meta.language or "en", inp.text_overrides, profile.get("textOverrides") or {})
    ctx = BuildContext(input=inp, options=options, registry=registry, profile=profile,
                       template=template, text=text)
    sel = inp.selection

    # ---- product category binding
    ctx.category_mismatch = bool(inp.data_category_id and inp.data_category_id != profile["id"])
    if ctx.category_mismatch:
        ctx.warn("warning", "category.mismatch",
                 f"Product data was entered for category '{inp.data_category_id}' but the report uses "
                 f"'{profile['id']}'. Category-specific data ({', '.join(CATEGORY_BOUND_FIELDS)}) was not "
                 f"carried over; profile defaults are used. Re-enter the product data for the new category.")

    # ---- standard
    std_name = sel.standard or profile.get("defaultStandard")
    ctx.standard = registry.standard(std_name) if std_name else None
    if std_name and not ctx.standard:
        ctx.warn("warning", "standard.unknown", f"Standard '{std_name}' is not in the registry; "
                 f"standard-specific rules are not applied.", "selection.standard")

    # ---- functional unit, scenarios, composition
    fu = None if ctx.category_mismatch else inp.functional_unit
    if fu is None and profile.get("functionalUnit"):
        fu = FunctionalUnit.model_validate(profile["functionalUnit"])
    ctx.functional_unit = fu
    ctx.scenarios = Scenarios() if ctx.category_mismatch else inp.scenarios
    ctx.material_composition = None if ctx.category_mismatch else inp.material_composition
    ctx.pcr_parts = list(inp.pcr.parts) or [PcrPart.model_validate(p) for p in
                                            (profile.get("pcr") or {}).get("parts", [])]
    ctx.scope = inp.meta.scope or profile.get("defaultScope")

    # ---- methods
    for name in sel.methods:
        m = registry.method(name)
        if not m:
            ctx.warn("error", "method.unknown",
                     f"'{name}' is not a supported LCIA method (no registry entry) — add a registry file or "
                     f"deselect it.", "selection.methods")
            continue
        if m in ctx.methods:
            continue
        if not any(registry.method_id(rs.method) == m.id for rs in inp.results):
            ctx.warn("error", "method.no_results",
                     f"No results calculated for {name} — run the calculation first or deselect it.",
                     "selection.methods")
            continue
        ctx.methods.append(m)
    if not ctx.methods:
        raise EpdReportError("None of the selected LCIA methods has calculated results.", ctx.warnings)
    primary = registry.method(sel.primary_method) if sel.primary_method else None
    ctx.primary = primary if primary in ctx.methods else ctx.methods[0]

    # ---- module declaration
    _resolve_modules(ctx)

    # ---- variants
    selected_ids = {m.id for m in ctx.methods}
    seen: Dict[str, str] = {}
    for rs in inp.results:
        if registry.method_id(rs.method) in selected_ids and rs.variant_id not in seen:
            seen[rs.variant_id] = rs.variant_label or rs.variant_id
    if sel.variant_ids:
        unknown = [v for v in sel.variant_ids if v not in seen]
        for v in unknown:
            ctx.warn("warning", "variant.unknown", f"Variant '{v}' has no results and was skipped.",
                     "selection.variantIds")
        ctx.variants = [(v, seen[v]) for v in sel.variant_ids if v in seen]
    else:
        ctx.variants = list(seen.items())
    if not ctx.variants:
        raise EpdReportError("No variant with results matches the selection.", ctx.warnings)

    # ---- results
    _process_results(ctx)
    return ctx


def _resolve_modules(ctx: BuildContext) -> None:
    inp, profile = ctx.input, ctx.profile
    declared: Dict[str, ModuleInfo] = {}
    if inp.modules and not ctx.category_mismatch:
        for m in inp.modules:
            if m.code in AGGREGATES:
                for sub in AGGREGATES[m.code]:
                    declared.setdefault(sub, _info(sub, m.status, m.geography))
                continue
            if m.code not in CANONICAL_ORDER:
                ctx.warn("warning", "module.unknown", f"Unknown module code '{m.code}' ignored.", "modules")
                continue
            info = _info(m.code, m.status, m.geography)
            if m.label:
                info.label = m.label
            if m.group:
                info.group = m.group
            declared[m.code] = info
    elif profile.get("defaultModules"):
        for code, status in profile["defaultModules"].items():
            declared[normalize_module_code(code)] = _info(normalize_module_code(code), status)
        if not ctx.category_mismatch:
            ctx.warn("info", "modules.profile_default",
                     f"No module declaration in the input; using the '{profile['id']}' profile defaults.", "modules")
    else:
        present = set()
        for rs in inp.results:
            for row in rs.rows:
                present |= {k for k, v in row.values.items() if is_number(v)}
        for code in SUBMODULES:
            if code in present or any(code in AGGREGATES.get(a, []) for a in present):
                declared[code] = _info(code, DECLARED)
        ctx.warn("info", "modules.inferred", "No module declaration given; declared modules were inferred from "
                 "the results.", "modules")
    order = {c: i for i, c in enumerate(CANONICAL_ORDER)}
    ctx.modules = dict(sorted(declared.items(), key=lambda kv: order.get(kv[0], 99)))


def _info(code: str, status: str, geography: Optional[str] = None) -> ModuleInfo:
    label, group = DEFAULT_MODULE_INFO.get(code, (code, ""))
    return ModuleInfo(code=code, label=label, group=group, status=status, geography=geography)


def _process_results(ctx: BuildContext) -> None:
    variant_ids = {v for v, _ in ctx.variants}
    statuses = ctx.statuses
    tol = ctx.options.aggregate_tolerance_pct
    for m in ctx.methods:
        for rs in ctx.input.results:
            if ctx.registry.method_id(rs.method) != m.id or rs.variant_id not in variant_ids:
                continue
            bucket = ctx.results.setdefault((rs.variant_id, m.id), {})
            for row in rs.rows:
                ind = m.indicator(row.indicator_code) or m.match_raw_key(row.indicator_code)
                if ind is None:
                    ctx.warn("error", "indicator.unknown",
                             f"Indicator '{row.indicator_code}' is not defined for {m.name} in the indicator "
                             f"registry, so its name and unit cannot be resolved.",
                             f"results[{rs.variant_id}/{m.id}]")
                    continue
                if not ind.unit:
                    ctx.warn("error", "indicator.no_unit", f"{m.name} indicator {ind.code} has no unit in the "
                             f"registry.", f"registry/{m.id}/{ind.code}")
                values: Dict[str, Optional[float]] = {}
                for code, v in row.values.items():
                    if code not in CANONICAL_ORDER:
                        continue
                    st = ctx.status(code)
                    if st != DECLARED:
                        if is_number(v) and v != 0:
                            ctx.warn("warning", "module.undeclared_has_value",
                                     f"{ind.code} has a value for module {code}, which is {st}; the value is "
                                     f"not shown.", f"results[{rs.variant_id}/{m.id}]")
                        continue
                    values[code] = float(v) if is_number(v) else None
                values, issues = complete_aggregates(values, statuses, tol)
                for agg, msg in issues:
                    ctx.warn("warning", "aggregate.mismatch",
                             f"{m.name} {ind.code} ({ctx.variant_label(rs.variant_id)}): {msg} — difference "
                             f"exceeds {tol}%.", f"results[{rs.variant_id}/{m.id}]")
                if ind.code in bucket:
                    ctx.warn("warning", "indicator.duplicate",
                             f"{m.name} {ind.code} appears more than once for variant "
                             f"'{ctx.variant_label(rs.variant_id)}'; the last value is used.")
                bucket[ind.code] = ResultRowView(indicator=ind, values=values)
