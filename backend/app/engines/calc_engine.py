import json
import os
from typing import Dict, Any, List
from .ecoinvent_lookup import (
    get_material_factor,
    get_refrigerant_gwp,
    get_grid_emission_factor,
    get_transport_factor
)
from .pcr_validation import load_pcr_rules

def calculate_chiller_lca(input_data: Dict[str, Any]) -> Dict[str, Any]:
    # Extract inputs
    capacity_rt = float(input_data.get("chilling_capacity_rt", 500.0))
    refrigerant_type = input_data.get("refrigerant_type", "R134a")
    refrigerant_charge_kg = float(input_data.get("refrigerant_charge_kg", 45.0))
    efficiency_kw_per_ton = float(input_data.get("efficiency_kw_per_ton", 0.54))
    lifespan_years = float(input_data.get("product_lifespan_years", 25))
    target_cities: List[str] = input_data.get("target_cities", ["Chicago", "Houston", "Frankfurt", "Dubai"])

    mass_steel = float(input_data.get("mass_steel_kg", 2100.0))
    mass_copper = float(input_data.get("mass_copper_kg", 650.0))
    mass_motor = float(input_data.get("mass_motor_kg", 450.0))
    mass_insulation = float(input_data.get("mass_insulation_kg", 150.0))
    mass_electronics = float(input_data.get("mass_electronics_kg", 120.0))

    total_mass_kg = mass_steel + mass_copper + mass_motor + mass_insulation + mass_electronics

    # Stage A1-A3: Raw materials & manufacturing
    a1_a3_gwp = (
        mass_steel * get_material_factor("steel_enclosure") +
        mass_copper * get_material_factor("copper_coils") +
        mass_motor * get_material_factor("compressor_motor") +
        mass_insulation * get_material_factor("insulation_puf") +
        mass_electronics * get_material_factor("electronics_vfd")
    )

    # Stage A4: Transport (500 km freight)
    a4_gwp = (total_mass_kg / 1000.0) * 500.0 * get_transport_factor("lorry >32t")

    # Stage A5: Installation
    a5_gwp = a1_a3_gwp * 0.025

    # Stage B1: Use phase direct emissions
    refrigerant_gwp = get_refrigerant_gwp(refrigerant_type)
    b1_gwp = refrigerant_charge_kg * 0.005 * refrigerant_gwp * lifespan_years

    # Stage B2: Maintenance (2% annual leak rate top-up)
    b2_gwp = refrigerant_charge_kg * 0.02 * refrigerant_gwp * lifespan_years

    # Stage B3: Repair
    b3_gwp = a1_a3_gwp * 0.05

    # Stage B4: Major Component Replacement (1 component lifecycle replacement)
    b4_gwp = mass_electronics * get_material_factor("electronics_vfd") * 1.5

    # Stage B5: Refurbishment
    b5_gwp = a1_a3_gwp * 0.03

    # Stage B6: Operational Energy (50-city bin hours calculation)
    pcr_rules = load_pcr_rules()
    bin_hours_dataset = pcr_rules.get("city_bin_hours", {})

    b6_gwp_total = 0.0
    for city in target_cities:
        city_bins = bin_hours_dataset.get(city, bin_hours_dataset.get("Chicago"))
        grid_key = city_bins.get("grid_key", "US_Average")
        grid_factor = get_grid_emission_factor(grid_key)

        h100 = city_bins.get("h100", 45)
        h75 = city_bins.get("h75", 1125)
        h50 = city_bins.get("h50", 2025)
        h25 = city_bins.get("h25", 1305)

        # Weighted annual kWh consumption
        kw_100 = capacity_rt * efficiency_kw_per_ton
        kw_75 = capacity_rt * efficiency_kw_per_ton * 0.70
        kw_50 = capacity_rt * efficiency_kw_per_ton * 0.54
        kw_25 = capacity_rt * efficiency_kw_per_ton * 0.65

        annual_kwh = (h100 * kw_100) + (h75 * kw_75) + (h50 * kw_50) + (h25 * kw_25)
        lifetime_kwh = annual_kwh * lifespan_years
        b6_gwp_total += lifetime_kwh * grid_factor

    b6_gwp = b6_gwp_total / max(1, len(target_cities))

    # Stage B7: Operational Water
    b7_gwp = capacity_rt * 1.2 * lifespan_years * 0.0015

    # Stage C1-C4: End of Life
    c1_gwp = total_mass_kg * 0.005
    c2_gwp = (total_mass_kg / 1000.0) * 100.0 * get_transport_factor("lorry >32t")
    c3_gwp = total_mass_kg * 0.015
    c4_gwp = total_mass_kg * 0.02
    c1_c4_gwp = c1_gwp + c2_gwp + c3_gwp + c4_gwp

    # Module D: Beyond System Boundary (Recycling credits, EXCLUDED from system boundary total per EN 15804)
    module_d_credit = -(mass_steel * 1.2 + mass_copper * 2.8)

    # Calculate Totals
    mandatory_total_gwp = (
        a1_a3_gwp + a4_gwp + a5_gwp +
        b1_gwp + b2_gwp + b3_gwp + b4_gwp + b5_gwp + b6_gwp + b7_gwp +
        c1_c4_gwp
    )

    b6_dominance_ratio = round(b6_gwp / max(1.0, mandatory_total_gwp) * 100, 1)

    by_module = {
        "A1-A3": {"gwp_kg_co2e": round(a1_a3_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "A4": {"gwp_kg_co2e": round(a4_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "A5": {"gwp_kg_co2e": round(a5_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "B1": {"gwp_kg_co2e": round(b1_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "B2": {"gwp_kg_co2e": round(b2_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "B3": {"gwp_kg_co2e": round(b3_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "B4": {"gwp_kg_co2e": round(b4_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "B5": {"gwp_kg_co2e": round(b5_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "B6": {"gwp_kg_co2e": round(b6_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "B7": {"gwp_kg_co2e": round(b7_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "C1": {"gwp_kg_co2e": round(c1_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "C2": {"gwp_kg_co2e": round(c2_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "C3": {"gwp_kg_co2e": round(c3_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "C4": {"gwp_kg_co2e": round(c4_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "C1-C4": {"gwp_kg_co2e": round(c1_c4_gwp, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": False},
        "Module D": {"gwp_kg_co2e": round(module_d_credit, 2), "methodology": "TRACI 2.1", "is_excluded_from_total": True}
    }

    return {
        "total_gwp_kg_co2e": round(mandatory_total_gwp, 2),
        "b6_gwp_kg_co2e": round(b6_gwp, 2),
        "b6_dominance_ratio": b6_dominance_ratio,
        "directional_badge": "Directional / Comparative EPD",
        "by_module": by_module
    }

def calculate_anti_lca(payload: Dict[str, Any]) -> Dict[str, Any]:
    bom = payload.get("bom", [])
    mfg = payload.get("mfg", {})
    logistics = payload.get("logistics", [])
    use = payload.get("use", {})
    eol = payload.get("eol", [])

    total_mass = sum(float(item.get("mass", 0)) for item in bom)
    declared_mass = sum(float(item.get("mass", 0)) for item in bom if float(item.get("gwpFactor", 0)) > 0)
    mass_cutoff = (declared_mass / total_mass * 100) if total_mass > 0 else 100.0
    is_mass_cutoff_valid = mass_cutoff >= 99.0

    a1_gwp = sum(float(r.get("mass", 0)) * float(r.get("gwpFactor", 0)) for r in bom if r.get("mod") == "A1")
    a2_gwp = sum(float(r.get("mass", 0)) * float(r.get("gwpFactor", 0)) for r in bom if r.get("mod") == "A2")

    ppa_share = float(mfg.get("ppa_share", 22))
    net_elec_ef = float(mfg.get("electricity_ef", 0.255)) * (1.0 - (ppa_share / 100.0))
    a3_elec = float(mfg.get("electricity_kwh", 840)) * net_elec_ef
    a3_gas = float(mfg.get("gas_m3", 220)) * float(mfg.get("gas_ef", 2.04))
    a3_air = float(mfg.get("air_m3", 350)) * float(mfg.get("air_ef", 0.012))
    a3_water = float(mfg.get("water_m3", 2.4)) * float(mfg.get("water_ef", 0.344))
    a3_materials = sum(float(r.get("mass", 0)) * float(r.get("gwpFactor", 0)) for r in bom if r.get("mod") == "A3")
    a3_gwp = a3_elec + a3_gas + a3_air + a3_water + a3_materials

    total_tons = total_mass / 1000.0
    a4_gwp = sum(total_tons * float(leg.get("dist", 0)) * float(leg.get("ef", 0.088)) for leg in logistics)

    rsl = float(use.get("b6_rsl", 15))
    b6_gwp = float(use.get("b6_kwh_yr", 12000)) * float(use.get("b6_ef", 0.255)) * rsl
    b7_gwp = float(use.get("b7_water_m3_yr", 180)) * float(use.get("b7_water_ef", 0.344)) * rsl
    b_stage_gwp = b6_gwp + b7_gwp

    c2_gwp = total_tons * 80.0 * 0.088
    c3_waste_gwp = sum(float(r.get("mass", 0)) * float(r.get("wasteEf", 0)) for r in eol)
    c_stage_gwp = c2_gwp + c3_waste_gwp

    module_d_gwp = sum(float(r.get("mass", 0)) * float(r.get("recRate", 0)) * float(r.get("creditEf", 0)) for r in eol)
    total_gwp = a1_gwp + a2_gwp + a3_gwp + a4_gwp + b_stage_gwp + c_stage_gwp + module_d_gwp
    total_penrt = (a1_gwp * 14.2) + (a3_gwp * 11.5) + (b6_gwp * 9.8)

    rec_mass = sum(float(r.get("mass", 0)) * float(r.get("recRate", 0)) for r in eol)
    rec_rate = (rec_mass / total_mass * 100) if total_mass > 0 else 88.4

    primary_mass = sum(float(r.get("mass", 0)) for r in bom if r.get("primary", True))
    primary_share = (primary_mass / total_mass * 100) if total_mass > 0 else 75.0
    avg_dqr = round(sum(float(r.get("dqr", 1.5)) * float(r.get("mass", 0)) for r in bom) / (total_mass or 1), 2)

    indicators = [
        {
            "code": "GWP100",
            "name": "Global Warming Potential (GWP100)",
            "unit": "kg CO₂ eq",
            "a1": round(a1_gwp, 2),
            "a2": round(a2_gwp, 2),
            "a3": round(a3_gwp, 2),
            "a1a3": round(a1_gwp + a2_gwp + a3_gwp, 2),
            "a4": round(a4_gwp, 2),
            "a5": 0.0,
            "b1": 0.0,
            "b2": 0.0,
            "b3": 0.0,
            "b4": 0.0,
            "b5": 0.0,
            "b6": round(b6_gwp, 2),
            "b7": round(b7_gwp, 2),
            "b": round(b_stage_gwp, 2),
            "c1": 0.0,
            "c2": round(c2_gwp, 2),
            "c3": round(c3_waste_gwp, 2),
            "c4": 0.0,
            "c": round(c_stage_gwp, 2),
            "d": round(module_d_gwp, 2),
            "total": round(total_gwp, 2)
        }
    ]

    return {
        "total_mass_kg": round(total_mass, 2),
        "mass_cutoff_pct": round(mass_cutoff, 2),
        "is_mass_cutoff_valid": is_mass_cutoff_valid,
        "a1_gwp": round(a1_gwp, 2),
        "a2_gwp": round(a2_gwp, 2),
        "a3_gwp": round(a3_gwp, 2),
        "a4_gwp": round(a4_gwp, 2),
        "b1_gwp": 0.0,
        "b2_gwp": 0.0,
        "b3_gwp": 0.0,
        "b4_gwp": 0.0,
        "b5_gwp": 0.0,
        "b6_gwp": round(b6_gwp, 2),
        "b7_gwp": round(b7_gwp, 2),
        "b_stage_gwp": round(b_stage_gwp, 2),
        "c1_gwp": 0.0,
        "c2_gwp": round(c2_gwp, 2),
        "c3_gwp": round(c3_waste_gwp, 2),
        "c4_gwp": 0.0,
        "c_stage_gwp": round(c_stage_gwp, 2),
        "module_d_gwp": round(module_d_gwp, 2),
        "total_gwp": round(total_gwp, 2),
        "total_penrt_mj": round(total_penrt, 2),
        "rec_rate_pct": round(rec_rate, 2),
        "primary_share_pct": round(primary_share, 2),
        "avg_dqr": avg_dqr,
        "indicators": indicators
    }

