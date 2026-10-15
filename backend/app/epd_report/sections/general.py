"""Section 1 — General information (product, composition, manufacturing, FU, RSL, scenarios)."""

from typing import Callable, Dict, List, Optional

from ..context import BuildContext
from ..document import BulletList, Figure, KeyValueTable, Paragraph
from ..formatting import format_number, format_quantity
from ..modules import DEFAULT_MODULE_INFO
from .. import narrative
from .common import amt, compact, heading, kv, nd, param_rows, paragraphs, qty, simple_table

Blocks = List


def company(ctx: BuildContext) -> Blocks:
    m = ctx.input.manufacturer
    if not (m.description or m.name):
        return []
    blocks = [heading("Company description", "sub-company")]
    blocks += paragraphs(m.description) or [Paragraph(text=m.name)]
    if m.website:
        blocks.append(Paragraph(text=f"Further information: {m.website}", style="note"))
    return blocks


def product(ctx: BuildContext) -> Blocks:
    p = ctx.input.product
    blocks = [heading("Product description", "sub-product")]
    blocks += paragraphs(p.description)
    if p.trade_names:
        blocks.append(Paragraph(text="Trade names: " + ", ".join(p.trade_names)))
    if p.variants_text:
        blocks += paragraphs(p.variants_text)
    if p.classification_codes:
        blocks.append(simple_table(["Classification system", "Code"],
                                   [[c.system, c.code] for c in p.classification_codes],
                                   caption="Product classification", table_id="tbl-classification"))
    for i, img in enumerate(p.images):
        blocks.append(Figure(image=img.data, caption=img.caption or p.name, id=f"fig-product-{i}",
                             width="half", alt=img.caption or p.name))
    if p.standards_and_certifications:
        blocks.append(Paragraph(text="Standards and certifications:"))
        blocks.append(BulletList(items=list(p.standards_and_certifications)))
    return blocks if len(blocks) > 1 else []


def technical_data(ctx: BuildContext) -> Blocks:
    p = ctx.input.product
    given = {} if ctx.category_mismatch else {t.name.strip().lower(): t for t in p.technical_data}
    rows, used = [], set()
    for f in ctx.profile.get("technicalDataFields", []):
        t = given.get(f["name"].strip().lower())
        if t:
            used.add(t.name.strip().lower())
            v = format_number(t.value) if isinstance(t.value, (int, float)) else t.value
            rows.append([t.name, v, t.unit or f.get("unit"), t.note])
        else:
            rows.append([f["name"], nd(ctx), f.get("unit"), None])
            ctx.warn("info", "technical_data.missing", f"Technical data field '{f['name']}' expected by the "
                     f"'{ctx.profile['id']}' profile is not provided.", "product.technicalData")
    if not ctx.category_mismatch:
        rows += param_rows([t for t in p.technical_data if t.name.strip().lower() not in used])
    blocks: Blocks = []
    if rows:
        blocks += [heading("Technical data", "sub-technical"),
                   simple_table(["Parameter", "Value", "Unit", "Note"], rows, caption="Technical data",
                                table_id="tbl-technical")]
    if p.dimensions and not ctx.category_mismatch:
        t = simple_table(["Dimension", "Value", "Unit"], [r[:3] for r in param_rows(p.dimensions)],
                         caption="Product dimensions", table_id="tbl-dimensions")
        if t:
            blocks += ([heading("Technical data", "sub-technical")] if not rows else []) + [t]
    return blocks


def application(ctx: BuildContext) -> Blocks:
    text = ctx.input.product.intended_application
    return [heading("Application", "sub-application")] + paragraphs(text) if text else []


def composition(ctx: BuildContext) -> Blocks:
    mc = ctx.material_composition
    blocks: Blocks = []
    if mc and mc.items:
        rows = []
        for it in mc.items:
            rows.append([it.material, format_quantity(it.mass, it.unit) if it.mass is not None else None,
                         f"{it.percentage:.2f}" if it.percentage is not None else None,
                         f"{it.recycled_content_pct:.1f}" if it.recycled_content_pct is not None else None,
                         it.cas_number, "Yes" if it.is_hazardous else None])
        blocks.append(simple_table(["Material", "Mass", "Share (%)", "Recycled content (%)", "CAS number",
                                    "Hazardous"], rows, numeric_cols=(1, 2, 3),
                                   caption=f"Material composition ({mc.basis})", table_id="tbl-composition"))
    pk = [] if ctx.category_mismatch else ctx.input.packaging
    if pk:
        blocks.append(simple_table(["Packaging material", "Mass", "Disposal route"],
                                   [[x.material, format_quantity(x.mass, x.unit), x.disposal_route] for x in pk],
                                   numeric_cols=(1,), caption="Packaging", table_id="tbl-packaging"))
    hs = ctx.input.product.hazardous_substances_statement
    if hs:
        blocks += paragraphs(hs)
    return ([heading("Material composition", "sub-composition")] + blocks) if blocks else []


def manufacturing(ctx: BuildContext) -> Blocks:
    mf = ctx.input.manufacturing
    if not mf:
        return []
    blocks: Blocks = [heading("Manufacturing", "sub-manufacturing")]
    blocks += paragraphs(mf.process_description)
    if mf.sites:
        blocks.append(simple_table(["Site", "Location", "Country", "Description"],
                                   [[s.name, s.location, s.country, s.description] for s in mf.sites],
                                   caption="Manufacturing sites", table_id="tbl-sites"))
    if mf.energy_inputs:
        blocks.append(simple_table(["Energy carrier", "Amount", "Unit", "Dataset"],
                                   [[e.carrier, format_number(e.amount) if e.amount is not None else None, e.unit,
                                     e.dataset_name] for e in mf.energy_inputs],
                                   numeric_cols=(1,), caption="Manufacturing energy inputs", table_id="tbl-mfg-energy"))
    if mf.wastes:
        blocks.append(simple_table(["Waste", "Amount", "Unit", "Treatment route"],
                                   [[w.type, format_number(w.amount) if w.amount is not None else None, w.unit, w.route]
                                    for w in mf.wastes], numeric_cols=(1,), caption="Manufacturing wastes",
                                   table_id="tbl-mfg-waste"))
    return blocks if len(blocks) > 1 else []


def functional_unit(ctx: BuildContext) -> Blocks:
    fu = ctx.functional_unit
    if not fu:
        return []
    label = "Functional unit" if fu.type == "functional" else "Declared unit"
    rows = compact([
        kv(label, fu.description, ctx),
        kv("Mass per unit (conversion factor)", qty(fu.mass_per_unit), ctx, keep_empty=False),
        kv("Reference product mass", qty(fu.reference_product_mass), ctx, keep_empty=False),
        kv("Reference product", fu.reference_product_description, ctx, keep_empty=False),
        *[kv(p.name, format_quantity(p.value, p.unit) if isinstance(p.value, (int, float)) else p.value, ctx)
          for p in fu.extra_parameters],
    ])
    return [heading(label, "sub-fu"), KeyValueTable(rows=rows, caption=f"{label} details", id="tbl-fu")]


def rsl(ctx: BuildContext) -> Blocks:
    p = ctx.input.product
    r, e = qty(p.reference_service_life), qty(p.building_estimated_service_life)
    if not (r or e):
        return []
    rows = compact([kv("Reference service life (RSL)", r, ctx, keep_empty=False),
                    kv("Estimated building service life (ESL)", e, ctx, keep_empty=False)])
    n = narrative.replacements(ctx)
    if r and e and n is not None:
        rows.append(kv("Number of replacements over the ESL (B4)", str(n), ctx))
    blocks = [heading("Reference service life", "sub-rsl"),
              KeyValueTable(rows=rows, caption="Reference service life", id="tbl-rsl")]
    s = narrative.replacement_sentence(ctx)
    if s:
        blocks.append(Paragraph(text=s))
    return blocks


# ---------------------------------------------------------------- scenarios

def _title(ctx: BuildContext, code: str) -> str:
    custom = ctx.profile.get("scenarioTitles", {}).get(code)
    if code == "C1_C4":
        return f"C1–C4 — {custom or 'End of life'}"
    return f"{code} — {custom or DEFAULT_MODULE_INFO[code][0]}"


def _typed_rows(prefix: str, items) -> List[list]:
    return [[f"{prefix}: {i.type or i.carrier or i.route or i.name or 'item'}",
             format_number(i.amount) if i.amount is not None else None, i.unit] for i in items]


def _scenario_a4(ctx, s) -> Blocks:
    legs = s.legs
    fields = [("Transport mode", "mode", None), ("Vehicle type", "vehicle_type", None), ("Fuel type", "fuel_type", None),
              ("Fuel efficiency", "fuel_efficiency", None), ("Distance", "distance_km", "km"),
              ("Capacity utilisation (incl. empty returns)", "capacity_utilization_pct", "%"),
              ("Gross density of products transported", "gross_density", None),
              ("Capacity utilisation volume factor", "volume_capacity_factor", None)]
    headers = ["Parameter"] + ([f"Leg {i + 1}" for i in range(len(legs))] if len(legs) > 1 else ["Value"]) + ["Unit"]
    rows = []
    for label, attr, unit in fields:
        vals = [getattr(l, attr) for l in legs]
        if all(v is None for v in vals):
            continue
        rows.append([label] + [format_number(v) if isinstance(v, (int, float)) else v for v in vals] + [unit])
    rows += [[p.name] + [None] * (len(headers) - 3) + [format_number(p.value) if isinstance(p.value, (int, float))
                                                      else p.value, p.unit] for p in s.extra_parameters]
    t = simple_table(headers, rows, caption="Transport to the building site (A4)", table_id="tbl-A4",
                     drop_empty_cols=False)
    sent = narrative.transport_sentences(ctx)
    return ([Paragraph(text=" ".join(sent))] if sent else []) + ([t] if t else [])


def _scenario_a5(ctx, s) -> Blocks:
    rows = _typed_rows("Energy", s.energy_carriers) + _typed_rows("Ancillary material", s.ancillary_materials)
    if s.water_use and s.water_use.amount is not None:
        rows.append(["Water use", format_number(s.water_use.amount), s.water_use.unit])
    if s.product_loss_pct is not None:
        rows.append(["Product loss", format_number(s.product_loss_pct), "%"])
    rows += _typed_rows("Packaging waste", s.packaging_waste) + _typed_rows("Direct emissions", s.direct_emissions)
    rows += [r[:3] for r in param_rows(s.extra_parameters)]
    t = simple_table(["Parameter", "Value", "Unit"], rows, numeric_cols=(1,),
                     caption="Installation into the building (A5)", table_id="tbl-A5")
    sent = narrative.installation_sentences(ctx)
    return ([Paragraph(text=" ".join(sent))] if sent else []) + ([t] if t else [])


def _scenario_generic(code: str):
    def build(ctx, s) -> Blocks:
        rows = []
        if getattr(s, "cycles", None) is not None:
            rows.append(["Cycles over the reference service life", format_number(s.cycles), "cycles"])
        if code == "B4":
            n = narrative.replacements(ctx)
            if n is not None:
                rows.append(["Replacement cycles over the building ESL", str(n), "replacements"])
        rows += _typed_rows("Input", s.items) + _typed_rows("Direct emissions", s.direct_emissions)
        rows += [r[:3] for r in param_rows(s.extra_parameters)]
        t = simple_table(["Parameter", "Value", "Unit"], rows, numeric_cols=(1,),
                         caption=_title(ctx, code), table_id=f"tbl-{code}")
        return paragraphs(s.description) + ([t] if t else [])
    return build


def _scenario_b6(ctx, s) -> Blocks:
    rows = _typed_rows("Annual energy", s.annual_energy)
    if s.lifetime_energy and s.lifetime_energy.amount is not None:
        rows.append(["Energy over the service life", format_number(s.lifetime_energy.amount), s.lifetime_energy.unit])
    if s.per_functional_unit and s.per_functional_unit.amount is not None:
        rows.append(["Energy per functional unit", format_number(s.per_functional_unit.amount),
                     s.per_functional_unit.unit])
    rows += [r[:3] for r in param_rows(s.extra_parameters)]
    blocks: Blocks = paragraphs(s.calculation_method_text)
    t = simple_table(["Parameter", "Value", "Unit"], rows, numeric_cols=(1,), caption="Operational energy use (B6)",
                     table_id="tbl-B6")
    if t:
        blocks.append(t)
    if s.grid_mix:
        g = simple_table(["Electricity grid", "Share (%)", "Emission factor", "Unit"],
                         [[x.region, format_number(x.share_pct) if x.share_pct is not None else None,
                           format_number(x.emission_factor) if x.emission_factor is not None else None,
                           x.emission_factor_unit] for x in s.grid_mix], numeric_cols=(1, 2),
                         caption="Electricity grid mix used for operational energy (B6)", table_id="tbl-B6-grid")
        if g:
            blocks.append(g)
    return blocks


def _scenario_b7(ctx, s) -> Blocks:
    rows = []
    if s.annual_water is not None:
        rows.append(["Annual water consumption", format_number(s.annual_water), s.unit])
    rows += [r[:3] for r in param_rows(s.extra_parameters)]
    t = simple_table(["Parameter", "Value", "Unit"], rows, numeric_cols=(1,), caption="Operational water use (B7)",
                     table_id="tbl-B7")
    return [t] if t else []


def _scenario_eol(ctx, s) -> Blocks:
    labels = [("collected_separately", "Collected separately"), ("collected_mixed", "Collected with mixed waste"),
              ("reuse", "For reuse"), ("recycling", "For recycling"), ("energy_recovery", "For energy recovery"),
              ("incineration", "Incineration"), ("landfill", "Landfill")]
    rows = [[lab, format_number(getattr(s, k).amount), getattr(s, k).unit] for k, lab in labels
            if getattr(s, k) and getattr(s, k).amount is not None]
    rows += [[f"Transport distance — {k}", format_number(v.amount), v.unit] for k, v in s.distances.items()
             if v.amount is not None]
    rows += [r[:3] for r in param_rows(s.extra_parameters)]
    t = simple_table(["Parameter", "Value", "Unit"], rows, numeric_cols=(1,), caption="End-of-life scenario (C1–C4)",
                     table_id="tbl-C1_C4")
    sent = narrative.eol_sentences(ctx)
    return ([Paragraph(text=" ".join(sent))] if sent else []) + ([t] if t else [])


def _scenario_d(ctx, s) -> Blocks:
    return paragraphs(s.description)


SCENARIO_BUILDERS: Dict[str, Callable] = {
    "A4": _scenario_a4, "A5": _scenario_a5, "B1": _scenario_generic("B1"), "B2": _scenario_generic("B2"),
    "B3": _scenario_generic("B3"), "B4": _scenario_generic("B4"), "B5": _scenario_generic("B5"),
    "B6": _scenario_b6, "B7": _scenario_b7, "C1_C4": _scenario_eol, "D": _scenario_d,
}


def _module_declared(ctx: BuildContext, code: str) -> bool:
    if code == "C1_C4":
        return any(ctx.is_declared(c) for c in ("C1", "C2", "C3", "C4"))
    return ctx.is_declared(code)


def scenarios(ctx: BuildContext) -> Blocks:
    blocks: Blocks = []
    for code in ctx.profile.get("scenarioSections", []):
        if not _module_declared(ctx, code):
            continue
        s = getattr(ctx.scenarios, code)
        if s is None:
            if code not in ("D",):
                ctx.warn("warning", "scenario.missing", f"Module {code.replace('_', '–')} is declared but no "
                         f"scenario data was provided; its scenario table is omitted.", f"scenarios.{code}")
            continue
        content = SCENARIO_BUILDERS[code](ctx, s)
        if s.notes:
            content += paragraphs(s.notes, style="note")
        if content:
            blocks.append(heading(_title(ctx, code), f"sub-scenario-{code}", level=3, toc=False))
            blocks += content
    if blocks:
        blocks.insert(0, heading("Scenarios and additional technical information", "sub-scenarios"))
    return blocks


SUBSECTIONS = {
    "company": company, "product": product, "technical_data": technical_data, "application": application,
    "composition": composition, "manufacturing": manufacturing, "functional_unit": functional_unit,
    "rsl": rsl, "scenarios": scenarios,
}
