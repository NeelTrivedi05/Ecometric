"""
Completeness and consistency checks run before rendering. Errors make the
document a draft (watermark); warnings are informational. Results are shown
in the in-app preview panel, never printed in the final PDF.
"""

import re
from datetime import date
from typing import Optional

from .context import BuildContext
from .modules import DECLARED, SUBMODULES, is_number


def validate(ctx: BuildContext) -> None:
    _required_meta(ctx)
    _mandatory_indicators(ctx)
    _required_groups(ctx)
    _scope(ctx)
    _validity(ctx)
    _composition(ctx)


def _required_meta(ctx: BuildContext) -> None:
    inp = ctx.input
    if not inp.meta.declaration_number:
        ctx.warn("error", "meta.declaration_number", "Declaration number is missing.", "meta.declarationNumber")
    if not ctx.functional_unit:
        ctx.warn("error", "meta.functional_unit", "Functional or declared unit is missing and the product "
                 "category has no default.", "functionalUnit")
    if not ctx.pcr_parts:
        ctx.warn("error", "meta.pcr", "No reference PCR is declared.", "pcr.parts")
    v = inp.verification
    if not v.type or not (v.epd_verifier and v.epd_verifier.name):
        ctx.warn("error", "meta.verification", "EPD verification (type and verifier) is not declared.",
                 "verification")
    elif not v.verified:
        ctx.warn("warning", "meta.unverified", "The EPD is not marked as verified; it will be issued as a draft.",
                 "verification.verified")
    if not inp.manufacturer.name:
        ctx.warn("warning", "meta.manufacturer", "Manufacturer name is missing.", "manufacturer.name")
    if not inp.program_operator.name:
        ctx.warn("warning", "meta.program_operator", "Program operator is missing.", "programOperator.name")
    if not inp.meta.issue_date:
        ctx.warn("warning", "meta.issue_date", "Date of issue is missing.", "meta.issueDate")


def _mandatory_indicators(ctx: BuildContext) -> None:
    declared = [c for c in SUBMODULES if ctx.status(c) == DECLARED]
    for m in ctx.methods:
        mandatory = ctx.mandatory_codes(m)
        for vid, vlabel in ctx.variants:
            rows = ctx.results.get((vid, m.id), {})
            for code in sorted(mandatory, key=lambda c: (m.indicator(c).order if m.indicator(c) else 99)):
                row = rows.get(code)
                if row is None:
                    ctx.warn("error", "indicator.mandatory_missing",
                             f"PCR-mandatory indicator {code} ({m.name}) has no results for variant '{vlabel}'.",
                             f"results[{vid}/{m.id}]")
                    continue
                missing = [c for c in declared if not is_number(row.values.get(c))]
                if missing:
                    ctx.warn("error", "indicator.module_missing",
                             f"{m.name} {code} ({vlabel}) has no value for declared module(s) "
                             f"{', '.join(missing)}.", f"results[{vid}/{m.id}]")


def _required_groups(ctx: BuildContext) -> None:
    if not ctx.standard:
        return
    for m in ctx.methods:
        for g in ctx.standard.required_groups:
            if g not in m.group_ids():
                continue
            if not any(ctx.results.get((vid, m.id), {}).get(i.code) for vid, _ in ctx.variants
                       for i in m.indicators if i.group == g):
                ctx.warn("error", "group.missing",
                         f"{ctx.standard.name} requires '{m.group_title(g)}' to be declared, but no {m.name} "
                         f"results were calculated for it.", f"results/{m.id}")


def _scope(ctx: BuildContext) -> None:
    if not ctx.scope:
        ctx.warn("warning", "scope.missing", "Scope of the declaration is not stated.", "meta.scope")
        return
    if not ctx.standard:
        return
    rules = ctx.standard.scope_rules
    key = next((k for k in rules if k.lower() == ctx.scope.lower()), None)
    if not key:
        ctx.warn("warning", "scope.unknown", f"Scope '{ctx.scope}' is not defined by {ctx.standard.name}.",
                 "meta.scope")
        return
    missing = [c for c in rules[key] if ctx.status(c) != DECLARED]
    if missing:
        ctx.warn("error", "scope.modules",
                 f"Scope '{key}' under {ctx.standard.name} requires module(s) {', '.join(missing)} to be declared.",
                 "modules")


def _parse_date(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d.%m.%Y"):
        try:
            from datetime import datetime
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def add_years(d: date, years: int) -> date:
    try:
        return d.replace(year=d.year + years)
    except ValueError:  # 29 Feb -> 28 Feb
        return d.replace(year=d.year + years, day=28)


def validity_years(ctx: BuildContext) -> Optional[int]:
    m = ctx.input.meta
    if m.validity_years:
        return int(m.validity_years)
    if m.validity_period_text:
        hit = re.search(r"(\d+)\s*(year|yr)", m.validity_period_text, re.I)
        if hit:
            return int(hit.group(1))
    return None


def computed_valid_until(ctx: BuildContext) -> Optional[date]:
    issue = _parse_date(ctx.input.meta.issue_date)
    yrs = validity_years(ctx)
    return add_years(issue, yrs) if issue and yrs else None


def _validity(ctx: BuildContext) -> None:
    meta = ctx.input.meta
    expected = computed_valid_until(ctx)
    given = _parse_date(meta.valid_until)
    if meta.issue_date and not _parse_date(meta.issue_date):
        ctx.warn("warning", "meta.issue_date_format", f"Date of issue '{meta.issue_date}' is not a recognised date.",
                 "meta.issueDate")
    if expected and given and expected != given:
        ctx.warn("warning", "meta.validity",
                 f"Valid-until date {given.isoformat()} does not equal issue date + validity period "
                 f"({expected.isoformat()}).", "meta.validUntil")
    if not given and not expected:
        ctx.warn("warning", "meta.validity_missing", "Validity period / valid-until date is not declared.",
                 "meta.validUntil")


def _composition(ctx: BuildContext) -> None:
    mc = ctx.material_composition
    if not mc or not mc.items:
        return
    pcts = [i.percentage for i in mc.items if i.percentage is not None]
    if pcts and len(pcts) == len(mc.items) and abs(sum(pcts) - 100.0) > 0.5:
        ctx.warn("warning", "composition.percentages", f"Material composition percentages sum to "
                 f"{sum(pcts):.2f}%, not 100%.", "materialComposition")
