"""
calculate_epd.py

Purpose
-------
Applies the A1-A5, B1-B7, C1-C4, D formulas to your EPD payload
(stages_data quantities) using the EF vectors produced by
extract_ef_values.py, and prints/saves a results table: one row per
impact indicator, one column per module.

Inputs
------
    --payload       the EPD calculation input JSON (stages_data block)
    --ef            OPTIONAL. ef_values.json from extract_ef_values.py. Not needed when
                    the payload already contains an "extracted_ef_values" block (the
                    combined UI export) - that block is then used automatically.
    --out           where to write the results table (CSV)
    --methodology   OPTIONAL override. Normally NOT needed: the methodology
                    is read from the payload (what the user picked in the UI).

    python calculate_epd.py                      # reads DEFAULT_PAYLOAD_PATH, writes results next to it
    python calculate_epd.py --payload combined.json --out epd_results.csv
    python calculate_epd.py --payload input.json --ef ef_values.json --out epd_results.csv

Outputs (written to the same folder as the input JSON unless --out is given):
    epd_results.csv   one row per impact indicator, one column per module
    epd_results.json  same results plus the imported BOM, EF providers and warnings
    epd_results.txt   human-readable report (methodology, warnings, results table)
"""

import argparse
import csv
import json
import math
import os
import re
import sys
from datetime import datetime
from pathlib import Path

# ============================================================
# CONFIG - edit these as your data gets more complete
# ============================================================

# Default input file. Uses environment variable or project root results folder (no hardcoded user paths)
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_RESULTS_DIR = Path(os.getenv("RESULTS_DIR", str(REPO_ROOT / "results")))
DEFAULT_PAYLOAD_PATH = str(DEFAULT_RESULTS_DIR / "epd_calculation_input.json")

ANNUAL_OPERATING_HOURS = None  # e.g. 8760 for continuous duty
A2_MASS_FALLBACK = "total_bom_mass"
A5_REFRIGERANT_LOSS_USES_B1_CF = True

# Unit conversion. Some inputs are entered in kWh or litres, but the matching
# ecoinvent providers are per MJ. The script converts the input amount to the
# provider's reference unit. That unit is read from "<provider_key>_reference_unit"
# in the payload when present, otherwise from DEFAULT_PROVIDER_REF_UNITS.
KWH_TO_MJ = 3.6
DIESEL_MJ_PER_LITRE = 35.8  # ASSUMPTION: ~43 MJ/kg x ~0.83 kg/L. Edit if you use another value.
DEFAULT_PROVIDER_REF_UNITS = {
    "consumable_provider_id": "MJ",       # A5 crane diesel
    "deconstruction_provider_id": "MJ",   # C1 deconstruction energy
}

# ============================================================
# Indicator sets, keyed by NORMALIZED methodology name
# ============================================================

_IPCC_GWP100 = "global warming potential (GWP100)"

INDICATOR_SETS = {
    "efv31": {
        "rows": [
            ("GWP - total",            "climate change",                               "global warming potential (GWP100)"),
            ("GWP - fossil",           "climate change: fossil",                       "global warming potential (GWP100)"),
            ("GWP - biogenic",         "climate change: biogenic",                     "global warming potential (GWP100)"),
            ("GWP - LULUC",            "climate change: land use and land use change", "global warming potential (GWP100)"),
            ("Ozone depletion pot.",   "ozone depletion",                              "ozone depletion potential (ODP)"),
            ("Acidification potential", "acidification",                              "accumulated exceedance (AE)"),
            ("EP-freshwater",          "eutrophication: freshwater",                   "fraction of nutrients reaching freshwater end compartment (P)"),
            ("EP-marine",              "eutrophication: marine",                       "fraction of nutrients reaching marine end compartment (N)"),
            ("EP-terrestrial",         "eutrophication: terrestrial",                  "accumulated exceedance (AE)"),
            ("POCP (\"smog\")",        "photochemical oxidant formation: human health", "tropospheric ozone concentration increase"),
            ("ADP-minerals & metals",  "material resources: metals/minerals",          "abiotic depletion potential (ADP): elements (ultimate reserves)"),
            ("ADP-fossil resources",   "energy resources: non-renewable",              "abiotic depletion potential (ADP): fossil fuels"),
            ("Water use",              "water use",                                    "user deprivation potential (deprivation-weighted water consumption)"),
        ],
        "gwp_rows": {"GWP - total", "GWP - fossil"},
    },
    "ipcc2021": {
        "rows": [
            ("GWP100 - total (excl. biogenic CO2)",             "climate change: total (excl. biogenic CO2)",                 _IPCC_GWP100),
            ("GWP100 - total (excl. bio CO2, incl. SLCFs)",     "climate change: total (excl. biogenic CO2, incl. SLCFs)",    _IPCC_GWP100),
            ("GWP100 - fossil",                                 "climate change: fossil",                                     _IPCC_GWP100),
            ("GWP100 - fossil (excl. aircraft)",                "climate change: fossil emissions (excl. aircraft emissions)", _IPCC_GWP100),
            ("GWP100 - fossil (incl. SLCFs)",                   "climate change: fossil (excl. biogenic CO2, incl. SLCFs)",   _IPCC_GWP100),
            ("GWP100 - biogenic (excl. CO2)",                   "climate change: biogenic (excl. CO2)",                       _IPCC_GWP100),
            ("GWP100 - biogenic (excl. CO2, incl. SLCFs)",      "climate change: biogenic (excl. CO2, incl. SLCFs)",          _IPCC_GWP100),
            ("GWP100 - aircraft",                               "climate change: aircraft emissions",                         _IPCC_GWP100),
            ("GWP100 - direct LUC",                             "climate change: direct land use change",                     _IPCC_GWP100),
            ("GWP100 - direct LUC (incl. SLCFs)",               "climate change: direct land use change (incl. SLCFs)",       _IPCC_GWP100),
            ("GWP100 - LUC emissions",                          "climate change: emissions from direct land use change",      _IPCC_GWP100),
            ("GWP100 - LUC removals",                           "climate change: removals from direct land use change",       _IPCC_GWP100),
            ("GWP20 - total (excl. biogenic CO2)",              "climate change: total (excl. biogenic CO2)",                 "global warming potential (GWP20)"),
            ("GWP500 - total (excl. biogenic CO2)",             "climate change: total (excl. biogenic CO2)",                 "global warming potential (GWP500)"),
            ("GTP50 - total (excl. biogenic CO2)",              "climate change: total (excl. biogenic CO2)",                 "global temperature change potential (GTP50)"),
            ("GTP100 - total (excl. biogenic CO2)",             "climate change: total (excl. biogenic CO2)",                 "global temperature change potential (GTP100)"),
        ],
        "gwp_rows": {
            "GWP100 - total (excl. biogenic CO2)",
            "GWP100 - total (excl. bio CO2, incl. SLCFs)",
            "GWP100 - fossil",
            "GWP100 - fossil (excl. aircraft)",
            "GWP100 - fossil (incl. SLCFs)",
        },
    },
}

# ============================================================
# Methodology resolution
# ============================================================

def normalize_method_key(name: str) -> str:
    """'EF v3.1', 'ef_v3_1', 'TRACI v2.1' and 'TRACI 2.1' normalize consistently."""
    cleaned = re.sub(r"v(?=\d)", "", str(name).lower())
    return re.sub(r"[^a-z0-9]", "", cleaned)


def discover_methods(ef_lookup: dict) -> set:
    """All method names present in ef_values.json (first ' | ' segment of every key)."""
    methods = set()
    for entry in ef_lookup.values():
        for key in entry.get("values", {}):
            methods.add(key.split(" | ", 1)[0])
    return methods


def resolve_method_label(methodology_key: str, ef_lookup: dict) -> str:
    target = normalize_method_key(methodology_key)
    available = sorted(discover_methods(ef_lookup))
    for label in available:
        if normalize_method_key(label) == target:
            return label
    raise ValueError(
        f"Methodology '{methodology_key}' (from the payload) does not match any method "
        f"in the EF file. Methods available in the EF file: {available}. "
        f"Re-run extract_ef_values.py for this methodology, or change the methodology in the UI."
    )


def discover_rows(method_label: str, ef_lookup: dict):
    """
    Fallback for methodologies with no entry in INDICATOR_SETS: build the
    indicator rows from whatever categories the EF file has for this method.
    """
    prefix = method_label + " | "
    seen = set()
    for entry in ef_lookup.values():
        for key in entry.get("values", {}):
            if not key.startswith(prefix):
                continue
            body = key[len(prefix):].rsplit(" [", 1)[0]
            category, _, indicator = body.partition(" | ")
            if category.endswith(" no LT"):
                continue
            seen.add((category, indicator))

    rows = [(f"{cat} | {ind}", cat, ind) for cat, ind in sorted(seen)]
    gwp_rows = {
        label for label, cat, ind in rows
        if "(GWP100)" in ind and (
            cat == "climate change"
            or cat.startswith("climate change: total")
            or cat.startswith("climate change: fossil")
        )
    }
    return rows, gwp_rows


class MethodContext:
    """Carries the resolved methodology, its indicator rows and the EF data."""

    def __init__(self, method_label, rows, gwp_rows, ef_lookup, mandatory_row_names=None):
        self.method_label = method_label
        self.rows = rows
        self.gwp_rows = set(gwp_rows)
        self.ef_lookup = ef_lookup
        self.row_names = [r[0] for r in rows]
        self.mandatory_row_names = set(mandatory_row_names) if mandatory_row_names else set(self.row_names)

    def zero_vector(self) -> dict:
        return {row: 0.0 for row in self.row_names}

    def lookup_ef(self, provider_id: str, category: str, indicator: str, warnings: list):
        entry = self.ef_lookup.get(provider_id)
        if entry is None:
            warnings.append(f"No EF data at all for provider_id='{provider_id}' - treated as 0.")
            return None

        values = entry.get("values", {})
        prefix = f"{self.method_label} | {category} | {indicator} ["
        for key, val in values.items():
            if key.startswith(prefix):
                return val

        prefix_lt = f"{self.method_label} | {category} no LT | {indicator} no LT ["
        for key, val in values.items():
            if key.startswith(prefix_lt):
                return val

        warnings.append(
            f"'{provider_id}' has EF data but no match for "
            f"{self.method_label} | {category} | {indicator} - treated as 0."
        )
        return None

    def ef_vector(self, provider_id: str, warnings: list) -> dict:
        """Returns {row_label: ef_value} for one provider across all indicator rows."""
        vec = {}
        for row, category, indicator in self.rows:
            val = self.lookup_ef(provider_id, category, indicator, warnings)
            vec[row] = val if val is not None else 0.0
        return vec


def build_context(payload: dict, ef_lookup: dict, warnings: list, override: str = None):
    """Reads the methodology from the payload (or CLI override) and dynamically builds all indicator rows."""
    if override:
        key, source = override, "--methodology override"
    else:
        candidates = [
            ("metadata.methodology", (payload.get("metadata") or {}).get("methodology")),
            ("full_payload.methodology", (payload.get("full_payload") or {}).get("methodology")),
            ("methodology", payload.get("methodology")),
        ]
        found = [(where, val) for where, val in candidates if val]
        if not found:
            raise ValueError(
                "No methodology found in the payload (looked in metadata.methodology, "
                "full_payload.methodology, methodology). Select a methodology in the UI, "
                "or pass --methodology."
            )
        source, key = found[0]
        for where, val in found[1:]:
            if normalize_method_key(val) != normalize_method_key(key):
                warnings.append(
                    f"Methodology conflict in payload: {source}='{key}' but {where}='{val}'. "
                    f"Using {source}."
                )

    label = resolve_method_label(key, ef_lookup)
    norm = normalize_method_key(label)

    other = sorted({
        entry["selected_methodology"] for entry in ef_lookup.values()
        if entry.get("selected_methodology")
        and normalize_method_key(entry["selected_methodology"]) != norm
    })
    if other:
        warnings.append(
            f"Some EF entries were extracted with a different methodology {other} than the "
            f"payload's '{key}' - their values for '{label}' may be missing."
        )

    # Discovered rows from all providers in ef_lookup for this methodology
    discovered_rows, disc_gwp = discover_rows(label, ef_lookup)

    if norm in INDICATOR_SETS:
        spec = INDICATOR_SETS[norm]
        pcr_rows, pcr_gwp = spec["rows"], spec["gwp_rows"]
        pcr_cats = {(cat.lower(), ind.lower()) for _, cat, ind in pcr_rows}
        mandatory_names = {r[0] for r in pcr_rows}

        # Merge PCR rows first, then append all other discovered indicators
        merged_rows = list(pcr_rows)
        for disc_row, cat, ind in discovered_rows:
            if (cat.lower(), ind.lower()) not in pcr_cats:
                merged_rows.append((disc_row, cat, ind))

        rows = merged_rows
        gwp_rows = pcr_gwp | disc_gwp
    else:
        rows, gwp_rows = discovered_rows, disc_gwp
        mandatory_names = {
            r[0] for r in rows
            if any(k in r[1].lower() or k in r[2].lower()
                   for k in ["global warming", "gwp", "climate change", "acidification", "eutrophication", "ozone depletion"])
        }
        if not gwp_rows:
            warnings.append(
                f"No 'climate change' rows found for '{label}' - the refrigerant terms "
                f"(B1 and the A5 commissioning loss) cannot be applied and will be 0."
            )

    return MethodContext(label, rows, gwp_rows, ef_lookup, mandatory_row_names=mandatory_names), source, key


def add_scaled(totals: dict, vec: dict, scale: float):
    for row, val in vec.items():
        totals[row] += val * scale


# ============================================================
# Unit conversion helpers
# ============================================================

_UNIT_ALIASES = {"l": "l", "liter": "l", "liters": "l", "litre": "l", "litres": "l",
                 "kwh": "kwh", "mj": "mj"}
_UNIT_FACTORS = {
    ("kwh", "mj"): KWH_TO_MJ,
    ("mj", "kwh"): 1.0 / KWH_TO_MJ,
    ("l", "mj"): DIESEL_MJ_PER_LITRE,            # diesel only
    ("mj", "l"): 1.0 / DIESEL_MJ_PER_LITRE,
    ("l", "kwh"): DIESEL_MJ_PER_LITRE / KWH_TO_MJ,
    ("kwh", "l"): KWH_TO_MJ / DIESEL_MJ_PER_LITRE,
}


def _unit_key(unit):
    u = (unit or "").strip().lower().replace(" ", "")
    return _UNIT_ALIASES.get(u, u)


def convert_amount(amount, input_unit, ref_unit, label, warnings):
    """Convert `amount` from input_unit to the provider's reference unit."""
    if not amount:
        return amount
    f, t = _unit_key(input_unit), _unit_key(ref_unit)
    if not t or f == t:
        return amount
    factor = _UNIT_FACTORS.get((f, t))
    if factor is None:
        warnings.append(f"{label}: cannot convert {input_unit} -> {ref_unit}; amount used as-is.")
        return amount
    converted = amount * factor
    warnings.append(
        f"{label}: converted {amount:g} {input_unit} -> {converted:.6g} {ref_unit} "
        f"(x{factor:.6g}) to match the provider's reference unit."
        + (" Diesel energy content is an assumption (DIESEL_MJ_PER_LITRE)." if f == "l" or t == "l" else "")
    )
    return converted


# ============================================================
# Stage calculations
# ============================================================

def calc_A1(bom_items, ctx, warnings):
    totals = ctx.zero_vector()
    total_mass = 0.0
    for item in bom_items:
        mass = item.get("mass", 0)
        provider_id = item.get("provider_id") or item.get("ecoinvent_id")
        total_mass += mass
        if not provider_id:
            warnings.append(f"A1 item '{item.get('name')}' has no provider_id - skipped.")
            continue
        vec = ctx.ef_vector(provider_id, warnings)
        add_scaled(totals, vec, mass)
    return totals, total_mass


def calc_A2(transport_entries, ctx, total_bom_mass, warnings):
    totals = ctx.zero_vector()
    legs = [t for t in transport_entries if t.get("module") == "A2"]
    if not legs:
        return totals
    warnings.append(
        f"A2: no per-leg linked mass in payload - using total BOM mass "
        f"({total_bom_mass} kg) on every A2 leg ({A2_MASS_FALLBACK} fallback). "
        f"This likely overcounts if materials actually split across legs."
    )
    for leg in legs:
        distance = leg.get("distance", 0)
        provider_id = leg.get("provider_id")
        if not provider_id:
            warnings.append(f"A2 leg '{leg.get('mode')}' has no provider_id - skipped.")
            continue
        vec = ctx.ef_vector(provider_id, warnings)
        add_scaled(totals, vec, (total_bom_mass / 1000.0) * distance)
    return totals


def calc_A3(manufacturing, ctx, warnings):
    totals = ctx.zero_vector()

    units = manufacturing.get("annual_production_units")
    try:
        units = float(units)
    except (TypeError, ValueError):
        units = 0.0
    if units > 0:
        per_unit = 1.0 / units
        warnings.append(
            f"A3: annual facility totals divided by annual_production_units ({units:g}) "
            f"to get per-unit inputs."
        )
    else:
        per_unit = 1.0
        warnings.append(
            "A3: annual_production_units missing or zero - facility totals used as-is per unit. "
            "If they are facility-wide, A3 is overstated."
        )

    elec_kwh = manufacturing.get("annual_facility_kwh", 0) * per_unit
    elec_provider = manufacturing.get("electricity_provider_id")
    if elec_provider:
        add_scaled(totals, ctx.ef_vector(elec_provider, warnings), elec_kwh)
    else:
        warnings.append("A3: no electricity_provider_id - electricity term skipped.")

    gas_mj = manufacturing.get("natural_gas_mj", 0) * per_unit
    gas_provider = manufacturing.get("gas_provider_id")
    if gas_provider:
        add_scaled(totals, ctx.ef_vector(gas_provider, warnings), gas_mj)
    else:
        warnings.append("A3: no gas_provider_id - gas term skipped.")

    water_m3 = manufacturing.get("water_m3", 0) * per_unit
    water_provider = manufacturing.get("water_provider_id")
    if water_provider:
        add_scaled(totals, ctx.ef_vector(water_provider, warnings), water_m3)
    else:
        warnings.append("A3: no water_provider_id - process water term skipped.")

    return totals


def calc_A4(transport_entries, installation, ctx, total_bom_mass, warnings):
    totals = ctx.zero_vector()

    leg = next((t for t in transport_entries if t.get("module") == "A4"), None)
    distance = leg.get("distance") if leg else installation.get("outbound_transport_km", 0)
    provider_id = (leg.get("provider_id") if leg else None) or installation.get("outbound_provider_id")

    warnings.append(
        f"A4: no explicit finished-product mass field in payload - using sum of A1 BOM mass "
        f"({total_bom_mass} kg) as product mass."
    )

    if not provider_id:
        warnings.append("A4: no transport provider_id found - A4 skipped.")
        return totals

    add_scaled(totals, ctx.ef_vector(provider_id, warnings), (total_bom_mass / 1000.0) * distance)
    return totals


def calc_A5(installation, refrigerant_cf, ctx, warnings):
    totals = ctx.zero_vector()

    energy_kwh = installation.get("installation_energy_kwh", 0)
    energy_provider = installation.get("installation_energy_provider_id")
    if energy_provider:
        add_scaled(totals, ctx.ef_vector(energy_provider, warnings), energy_kwh)
    else:
        warnings.append("A5: no installation_energy_provider_id - energy term skipped.")

    diesel_l = installation.get("rigging_crane_diesel_liters", 0)
    diesel_provider = installation.get("consumable_provider_id")
    if diesel_provider:
        diesel_ref = (installation.get("consumable_provider_id_reference_unit")
                      or DEFAULT_PROVIDER_REF_UNITS["consumable_provider_id"])
        diesel_amount = convert_amount(diesel_l, "L", diesel_ref, "A5 crane diesel", warnings)
        add_scaled(totals, ctx.ef_vector(diesel_provider, warnings), diesel_amount)
    else:
        warnings.append("A5: no consumable_provider_id - crane diesel term skipped.")

    refrigerant_loss_kg = installation.get("commissioning_refrigerant_loss_kg", 0)
    if A5_REFRIGERANT_LOSS_USES_B1_CF and refrigerant_loss_kg and refrigerant_cf:
        warnings.append(
            "A5: commissioning_refrigerant_loss_kg has no ecoinvent provider - "
            "applying the B1 refrigerant GWP CF to GWP rows only, as an assumption."
        )
        for row in ctx.gwp_rows:
            totals[row] += refrigerant_loss_kg * refrigerant_cf

    return totals


def calc_B1(operational, rsl_years, ctx, warnings):
    totals = ctx.zero_vector()
    charge_kg = operational.get("refrigerant_charge_kg", 0)
    leak_pct = operational.get("annual_leak_rate_percent", 0)
    cf = operational.get("refrigerant_gwp_cf")
    if cf is None:
        warnings.append("B1: no refrigerant_gwp_cf in payload - B1 = 0.")
        return totals, None
    emitted_kg = charge_kg * (leak_pct / 100.0) * rsl_years
    for row in ctx.gwp_rows:
        totals[row] += emitted_kg * cf
    if len(ctx.gwp_rows) < len(ctx.row_names):
        warnings.append(
            "B1/A5: the refrigerant CF is a GWP100 factor, so it is added only to the GWP100 "
            "total/fossil rows. All other rows (GWP20, GWP500, GTP, biogenic, land use, ...) "
            "exclude refrigerant emissions."
        )
    return totals, cf


def calc_B2(maintenance, rsl_years, ctx, warnings):
    totals = ctx.zero_vector()
    cycles = maintenance.get("maintenance_cycles_per_rsl", 0)
    mass_per_cycle = maintenance.get("consumable_mass_kg", 0)
    provider_id = maintenance.get("provider_id")
    if not provider_id:
        warnings.append("B2: no provider_id - B2 = 0.")
        return totals
    add_scaled(totals, ctx.ef_vector(provider_id, warnings), cycles * mass_per_cycle)
    return totals


def calc_B3(repair, ctx, warnings):
    totals = ctx.zero_vector()
    events = repair.get("repair_events_per_rsl", 0)
    part_mass = repair.get("part_mass_kg", 0)
    provider_id = repair.get("provider_id")
    if not provider_id:
        warnings.append("B3: no provider_id - B3 = 0.")
        return totals
    add_scaled(totals, ctx.ef_vector(provider_id, warnings), events * part_mass)
    return totals


def calc_B4(replacement, rsl_years, a1_to_a5_totals, ctx, warnings):
    esl_years = replacement.get("esl_years", rsl_years)
    if rsl_years <= 0:
        warnings.append("B4: RSL is 0 or missing - B4 = 0.")
        return ctx.zero_vector(), 0
    cycles = max(0, (esl_years / rsl_years) - 1)
    totals = {row: val * cycles for row, val in a1_to_a5_totals.items()}
    return totals, cycles


def calc_B5(refurbishment, ctx, warnings):
    totals = ctx.zero_vector()
    events = refurbishment.get("refurbishment_events_per_rsl", 0)
    mass = refurbishment.get("mass_kg", 0)
    provider_id = refurbishment.get("provider_id")
    if not provider_id:
        warnings.append("B5: no provider_id - B5 = 0.")
        return totals
    add_scaled(totals, ctx.ef_vector(provider_id, warnings), events * mass)
    return totals


def calc_B6(operational, rsl_years, ctx, warnings):
    totals = ctx.zero_vector()
    hours = operational.get("annual_operating_hours", ANNUAL_OPERATING_HOURS)
    if hours is None:
        warnings.append(
            "B6: no 'annual_operating_hours' in the payload and ANNUAL_OPERATING_HOURS is not "
            "set in CONFIG - B6 = 0 (this is normally the largest module for a chiller)."
        )
        return totals
    efficiency = operational.get("efficiency_kw_per_ton", 0)
    capacity = operational.get("capacity_rt", 0)
    annual_energy_kwh = efficiency * capacity * hours
    provider_id = operational.get("energy_provider_id")
    if not provider_id:
        warnings.append("B6: no energy_provider_id - B6 = 0.")
        return totals
    add_scaled(totals, ctx.ef_vector(provider_id, warnings), annual_energy_kwh * rsl_years)
    return totals


def calc_B7(operational, rsl_years, ctx, warnings):
    totals = ctx.zero_vector()
    annual_water = operational.get("cooling_tower_water_m3_yr", 0)
    provider_id = operational.get("water_provider_id")
    if not provider_id:
        warnings.append("B7: no water_provider_id - B7 = 0.")
        return totals
    add_scaled(totals, ctx.ef_vector(provider_id, warnings), annual_water * rsl_years)
    return totals


def calc_C1(end_of_life, ctx, warnings):
    totals = ctx.zero_vector()
    energy = end_of_life.get("decommissioning_energy_kwh", 0)
    provider_id = end_of_life.get("deconstruction_provider_id")
    if not provider_id:
        warnings.append("C1: no deconstruction_provider_id - C1 = 0.")
        return totals
    ref_unit = (end_of_life.get("deconstruction_provider_id_reference_unit")
                or DEFAULT_PROVIDER_REF_UNITS["deconstruction_provider_id"])
    energy = convert_amount(energy, "kWh", ref_unit, "C1 deconstruction energy", warnings)
    add_scaled(totals, ctx.ef_vector(provider_id, warnings), energy)
    return totals


def calc_C2(end_of_life, total_bom_mass, ctx, warnings):
    totals = ctx.zero_vector()
    distance = end_of_life.get("waste_transport_km", 0)
    provider_id = end_of_life.get("waste_transport_provider_id")
    warnings.append(
        f"C2: no explicit end-of-life mass field - using sum of A1 BOM mass "
        f"({total_bom_mass} kg) as waste mass."
    )
    if not provider_id:
        warnings.append("C2: no waste_transport_provider_id - C2 = 0.")
        return totals
    add_scaled(totals, ctx.ef_vector(provider_id, warnings), (total_bom_mass / 1000.0) * distance)
    return totals


def calc_C3(end_of_life, total_bom_mass, ctx, warnings):
    totals = ctx.zero_vector()
    recycle_pct = end_of_life.get("recycling_rate_percent", 0)
    incin_pct = end_of_life.get("incineration_rate_percent", 0)
    share_sum = recycle_pct + incin_pct + end_of_life.get("landfill_rate_percent", 0)
    if abs(share_sum - 100.0) > 0.01:
        warnings.append(
            f"C3/C4: recycling + incineration + landfill = {share_sum}%, not 100% - "
            f"part of the end-of-life mass is unaccounted for."
        )
    mass_recycled = total_bom_mass * (recycle_pct / 100.0)
    mass_incinerated = total_bom_mass * (incin_pct / 100.0)

    recycle_provider = end_of_life.get("recycling_process_provider_id")
    if recycle_provider:
        add_scaled(totals, ctx.ef_vector(recycle_provider, warnings), mass_recycled)
    else:
        warnings.append("C3: no recycling_process_provider_id - recycling term skipped.")

    incin_provider = end_of_life.get("incineration_process_provider_id")
    if incin_provider:
        add_scaled(totals, ctx.ef_vector(incin_provider, warnings), mass_incinerated)
    else:
        warnings.append("C3: no incineration_process_provider_id - incineration term skipped.")

    return totals


def calc_C4(end_of_life, total_bom_mass, ctx, warnings):
    totals = ctx.zero_vector()
    landfill_pct = end_of_life.get("landfill_rate_percent", 0)
    mass_landfilled = total_bom_mass * (landfill_pct / 100.0)
    provider_id = end_of_life.get("landfill_process_provider_id")
    if not provider_id:
        warnings.append("C4: no landfill_process_provider_id - C4 = 0.")
        return totals
    add_scaled(totals, ctx.ef_vector(provider_id, warnings), mass_landfilled)
    return totals


def calc_D(circularity, end_of_life, bom_items, total_bom_mass, ctx, warnings):
    totals = ctx.zero_vector()

    recovery_pct = circularity.get("overall_recovery_rate_percent")
    if recovery_pct is None:
        recovery_pct = end_of_life.get("recycling_rate_percent")
        if recovery_pct is None:
            warnings.append(
                "D: no overall_recovery_rate_percent and no C3 recycling_rate_percent - D = 0."
            )
            return totals
        warnings.append(
            f"D: no overall_recovery_rate_percent in the payload - using the C3 recycling rate "
            f"({recovery_pct}%) as the whole-product recovery rate."
        )

    ignored = [
        k for k in ("steel_scrap_recovery_rate", "copper_scrap_recovery_rate",
                    "aluminium_recovery_rate", "refrigerant_reclamation_rate")
        if k in circularity
    ]
    if ignored:
        warnings.append(
            f"D: per-material recovery fields {ignored} are ignored - D uses one whole-product "
            f"recovery rate. Refrigerant reclaim is not part of D."
        )

    virgin_provider = circularity.get("virgin_material_provider_id")
    recycled_provider = circularity.get("recycled_process_provider_id")
    if not virgin_provider or not recycled_provider:
        warnings.append("D: missing virgin_material_provider_id / recycled_process_provider_id - D = 0.")
        return totals

    steel_mass = sum(
        item.get("mass", 0) for item in bom_items
        if "steel" in (item.get("material") or "").lower()
    )
    steel_share = (100.0 * steel_mass / total_bom_mass) if total_bom_mass else 0.0
    warnings.append(
        f"D: one virgin/recycled provider pair is applied to the WHOLE recovered mass. Steel is "
        f"{steel_share:.0f}% of the BOM mass, so copper, aluminium, foam and electronics are "
        f"credited as if they were steel (approximation)."
    )

    recovered_mass = total_bom_mass * (recovery_pct / 100.0)
    vec_virgin = ctx.ef_vector(virgin_provider, warnings)
    vec_recycled = ctx.ef_vector(recycled_provider, warnings)
    for row in ctx.row_names:
        totals[row] -= recovered_mass * (vec_virgin[row] - vec_recycled[row])

    return totals


# ============================================================
# Orchestration
# ============================================================

COL_ORDER = ["A1", "A2", "A3", "A1-A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7",
             "C1-C4", "C1", "C2", "C3", "C4", "D"]
 

def calculate_epd(payload: dict, ef_lookup: dict, methodology_override: str = None):
    warnings = []
    ctx, methodology_source, methodology_key = build_context(
        payload, ef_lookup, warnings, override=methodology_override
    )

    warnings.append(
        "UNITS: the EF data has no reference-unit field, so EFs are assumed to be per kg (materials, "
        "waste), per kWh (electricity), per MJ (gas), per m3 (water), per litre (diesel) and per "
        "tonne-km (transport). Check that each matched activity really uses that unit."
    )

    stages = payload["stages_data"]
    rsl_raw = (
        payload.get("project_info", {}).get("lifespan_years")
        or payload.get("project_info", {}).get("rsl")
        or stages.get("B1_B7_Operational", {}).get("rsl_years")
        or 25
    )
    rsl_years = float(rsl_raw) if rsl_raw else 25.0

    bom_items = stages.get("A1_BOM", [])
    transport_entries = stages.get("A2_Transport", [])
    manufacturing = stages.get("A3_Manufacturing", {})
    installation = stages.get("A4_A5_Installation", {})
    operational = stages.get("B1_B7_Operational", {})
    maintenance = stages.get("B2_Maintenance", {})
    repair = stages.get("B3_Repair", {})
    replacement = stages.get("B4_Replacement", {})
    refurbishment = stages.get("B5_Refurbishment", {})
    end_of_life = stages.get("C1_C4_EndOfLife", {})
    circularity = stages.get("D_Circularity", {})

    rows = ctx.row_names

    A1, total_bom_mass = calc_A1(bom_items, ctx, warnings)
    A2 = calc_A2(transport_entries, ctx, total_bom_mass, warnings)
    A3 = calc_A3(manufacturing, ctx, warnings)
    A4 = calc_A4(transport_entries, installation, ctx, total_bom_mass, warnings)

    B1, refrigerant_cf = calc_B1(operational, rsl_years, ctx, warnings)
    A5 = calc_A5(installation, refrigerant_cf, ctx, warnings)

    B2 = calc_B2(maintenance, rsl_years, ctx, warnings)
    B3 = calc_B3(repair, ctx, warnings)

    a1_to_a5 = {row: A1[row] + A2[row] + A3[row] + A4[row] + A5[row] for row in rows}
    B4, replacement_cycles = calc_B4(replacement, rsl_years, a1_to_a5, ctx, warnings)

    B5 = calc_B5(refurbishment, ctx, warnings)
    B6 = calc_B6(operational, rsl_years, ctx, warnings)
    B7 = calc_B7(operational, rsl_years, ctx, warnings)

    C1 = calc_C1(end_of_life, ctx, warnings)
    C2 = calc_C2(end_of_life, total_bom_mass, ctx, warnings)
    C3 = calc_C3(end_of_life, total_bom_mass, ctx, warnings)
    C4 = calc_C4(end_of_life, total_bom_mass, ctx, warnings)

    D = calc_D(circularity, end_of_life, bom_items, total_bom_mass, ctx, warnings)

    A1_A3 = {row: A1[row] + A2[row] + A3[row] for row in rows}
    C1_C4 = {row: C1[row] + C2[row] + C3[row] + C4[row] for row in rows}

    columns = {
        "A1": A1, "A2": A2, "A3": A3, "A1-A3": A1_A3, "A4": A4, "A5": A5,
        "B1": B1, "B2": B2, "B3": B3, "B4": B4, "B5": B5, "B6": B6, "B7": B7,
        "C1-C4": C1_C4, "C1": C1, "C2": C2, "C3": C3, "C4": C4,
        "D": D,
    }

    meta = {
        "replacement_cycles": replacement_cycles,
        "total_bom_mass": total_bom_mass,
        "row_names": rows,
        "mandatory_row_names": list(ctx.mandatory_row_names),
        "total_indicators_calculated": len(rows),
        "methodology_label": ctx.method_label,
        "methodology_key": methodology_key,
        "methodology_source": methodology_source,
    }
    return columns, warnings, meta


def format_table(columns: dict, row_names: list) -> str:
    width = max(28, max(len(r) for r in row_names))
    header = f"{'Impact category':{width}s} | " + " | ".join(f"{c:>10s}" for c in COL_ORDER)
    lines = [header, "-" * len(header)]
    for row in row_names:
        lines.append(f"{row:{width}s} | " + " | ".join(f"{columns[c][row]:10.3e}" for c in COL_ORDER))
    return "\n".join(lines)


def print_table(columns: dict, row_names: list):
    print(format_table(columns, row_names))


def import_summary(payload: dict, ef_lookup: dict) -> dict:
    stages = payload.get("stages_data", {})
    bom = [
        {"id": i.get("id"), "name": i.get("name"), "material": i.get("material"),
         "mass_kg": i.get("mass"), "provider_id": i.get("provider_id") or i.get("ecoinvent_id")}
        for i in stages.get("A1_BOM", [])
    ]
    referenced = set()

    def collect(node):
        if isinstance(node, dict):
            for k, v in node.items():
                if k.endswith("provider_id") and isinstance(v, str):
                    referenced.add(v)
                else:
                    collect(v)
        elif isinstance(node, list):
            for v in node:
                collect(v)

    collect(stages)
    return {
        "bom_items": bom,
        "bom_total_mass_kg": sum(b["mass_kg"] or 0 for b in bom),
        "ef_providers_loaded": sorted(ef_lookup.keys()),
        "ef_providers_referenced": sorted(referenced),
        "ef_providers_missing": sorted(referenced - set(ef_lookup.keys())),
    }


def write_json(columns: dict, meta: dict, warnings: list, imported: dict, out_path: Path):
    doc = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "methodology": {"label": meta["methodology_label"], "payload_key": meta["methodology_key"],
                        "source": meta["methodology_source"]},
        "total_bom_mass_kg": meta["total_bom_mass"],
        "replacement_cycles_b4": meta["replacement_cycles"],
        "imported": imported,
        "warnings": warnings,
        "results": {row: {c: columns[c][row] for c in COL_ORDER} for row in meta["row_names"]},
    }
    out_path.write_text(json.dumps(doc, indent=2), encoding="utf-8")


def write_txt(columns: dict, meta: dict, warnings: list, imported: dict, out_path: Path, ef_source: str):
    lines = [
        "EPD CALCULATION REPORT",
        f"Generated: {datetime.now().isoformat(timespec='seconds')}",
        f"EF data: {ef_source}",
        f"Methodology: {meta['methodology_label']} (payload value '{meta['methodology_key']}', "
        f"read from {meta['methodology_source']})",
        "",
        f"BOM imported ({len(imported['bom_items'])} items, total {imported['bom_total_mass_kg']} kg):",
    ]
    for b in imported["bom_items"]:
        lines.append(f"  - {b['name']}: {b['mass_kg']} kg  [{b['provider_id']}]")
    lines.append(f"EF providers loaded: {len(imported['ef_providers_loaded'])}"
                 + (f" | MISSING: {imported['ef_providers_missing']}" if imported["ef_providers_missing"] else ""))
    lines.append(f"Derived replacement cycles (B4): {meta['replacement_cycles']}")
    lines.append("")
    if warnings:
        lines.append(f"=== {len(warnings)} ASSUMPTION/WARNING(S) - review before trusting the numbers ===")
        lines += [f"  - {w}" for w in warnings]
        lines.append("")
    lines.append(format_table(columns, meta["row_names"]))
    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def to_exponential(cell, digits: int = 3) -> str:
    """Return cell in exponential form if finite number, else unchanged."""
    text = str(cell).strip() if cell is not None else ""
    if not text:
        return "" if cell is None else str(cell)
    try:
        value = float(text)
    except ValueError:
        return str(cell)
    if not math.isfinite(value):
        return str(cell)
    return f"{value:.{digits}e}"


def convert_csv_to_exponential(input_path: Path | str, output_path: Path | str, digits: int = 3) -> int:
    inp = Path(input_path).expanduser()
    outp = Path(output_path).expanduser()
    if not inp.is_file():
        return 0
    with inp.open("r", newline="", encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    if not rows:
        return 0
    header, body = rows[0], rows[1:]
    converted = [header]
    count = 0
    for row in body:
        if not row:
            continue
        new_row = [row[0]]
        for cell in row[1:]:
            new_cell = to_exponential(cell, digits)
            if new_cell != cell:
                count += 1
            new_row.append(new_cell)
        converted.append(new_row)
    outp.parent.mkdir(parents=True, exist_ok=True)
    with outp.open("w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(converted)
    return count


def write_csv(columns: dict, row_names: list, out_path: str):
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Impact category"] + COL_ORDER)
        for row in row_names:
            writer.writerow([row] + [columns[c][row] for c in COL_ORDER])


# ============================================================
# Importable API Function
# ============================================================

def run_epd_calculation(input_path: str | Path, out_dir: str | Path | None = None, ef_path: str | Path | None = None, methodology_override: str | None = None) -> dict:
    """
    Importable function that reads the EPD calculation input JSON, runs the A1-D calculation,
    writes epd_results.csv, epd_results_exp.csv, epd_results.json, and epd_results.txt to out_dir
    (default: input file's folder), and returns the output paths and warnings.
    """
    payload_path = Path(input_path).expanduser()
    if not payload_path.is_file():
        raise FileNotFoundError(f"Input payload file not found: {payload_path}")

    payload = json.loads(payload_path.read_text(encoding="utf-8"))

    if ef_path:
        ef_file = Path(ef_path).expanduser()
        if not ef_file.is_file():
            raise FileNotFoundError(f"EF file not found: {ef_file}")
        ef_lookup = json.loads(ef_file.read_text(encoding="utf-8"))
        ef_source = str(ef_file)
    else:
        ef_lookup = payload.get("extracted_ef_values")
        ef_source = "payload.extracted_ef_values"
        if not ef_lookup:
            raise ValueError("No EF file provided and payload has no 'extracted_ef_values' block.")

    columns, warnings, meta = calculate_epd(payload, ef_lookup, methodology_override)
    imported = import_summary(payload, ef_lookup)

    output_dir = Path(out_dir).expanduser() if out_dir else payload_path.parent
    if output_dir.is_file():
        output_dir = output_dir.parent
    output_dir.mkdir(parents=True, exist_ok=True)

    csv_path = output_dir / "epd_results.csv"
    csv_exp_path = output_dir / "epd_results_exp.csv"
    json_path = output_dir / "epd_results.json"
    txt_path = output_dir / "epd_results.txt"

    write_csv(columns, meta["row_names"], str(csv_path))
    convert_csv_to_exponential(csv_path, csv_exp_path, digits=3)
    write_json(columns, meta, warnings, imported, json_path)
    write_txt(columns, meta, warnings, imported, txt_path, ef_source)

    all_available = {row: {c: columns[c][row] for c in COL_ORDER} for row in meta["row_names"]}
    mandatory_pcr = {
        row: data for row, data in all_available.items()
        if row in meta.get("mandatory_row_names", [])
    }
    if not mandatory_pcr:
        mandatory_pcr = all_available

    return {
        "status": "success",
        "csv_path": str(csv_path),
        "csv_exp_path": str(csv_exp_path),
        "json_path": str(json_path),
        "txt_path": str(txt_path),
        "warnings": warnings,
        "results": all_available,
        "mandatory_pcr_indicators": mandatory_pcr,
        "all_available_indicators": all_available,
        "metadata": meta,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                      formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--payload", default=DEFAULT_PAYLOAD_PATH,
                        help=f"EPD calculation input JSON. Default: {DEFAULT_PAYLOAD_PATH}")
    parser.add_argument("--ef", default=None,
                        help="Optional ef_values.json. Default: the payload's 'extracted_ef_values' block.")
    parser.add_argument("--out", default=None,
                        help="Output CSV path. Default: epd_results.csv in the input file's folder. "
                             "The .json and .txt reports are written next to it.")
    parser.add_argument("--methodology", default=None,
                        help="Optional override. By default the methodology is read from the payload.")
    args = parser.parse_args()

    out_dir = Path(args.out).expanduser().parent if args.out else None

    try:
        res = run_epd_calculation(
            input_path=args.payload,
            out_dir=out_dir,
            ef_path=args.ef,
            methodology_override=args.methodology
        )
    except Exception as err:
        print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)

    print(f"Input file: {args.payload}")
    print(f"Methodology: {res['metadata']['methodology_label']} "
          f"(payload value '{res['metadata']['methodology_key']}', read from {res['metadata']['methodology_source']})")
    print(f"Total BOM mass: {res['metadata']['total_bom_mass']} kg")
    print(f"Derived replacement cycles (B4): {res['metadata']['replacement_cycles']}\n")

    if res["warnings"]:
        print(f"=== {len(res['warnings'])} ASSUMPTION/WARNING(S) - review before trusting the numbers ===\n")
        for w in res["warnings"]:
            print(f"  - {w}")
        print()

    columns = {col: {row: res["results"][row][col] for row in res["metadata"]["row_names"]} for col in COL_ORDER}
    print_table(columns, res["metadata"]["row_names"])

    print(f"\nWrote results to:\n  {res['csv_path']}\n  {res['json_path']}\n  {res['txt_path']}")


if __name__ == "__main__":
    main()
