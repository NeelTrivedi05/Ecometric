/**
 * Carrier AquaEdge® 19DV 500 RT - inputs calibrated to reproduce NSF EPD11017 Table 18
 * (per 1 ton chilling capacity) with ecoinvent v3.12 cut-off + EF v3.1 / TRACI v2.1.
 *
 * Values are for one 500 RT chiller; the Results view divides by capacity_rt.
 *   - BOM masses follow EPD11017 Table 3 (steel 4.20, copper 1.30, refrigerant 1.19, other 1.44 kg/ton).
 *     R-1233zd(E) has no ecoinvent dataset - 1-chloro-1,1-difluoroethane is used as the HCFO proxy.
 *   - A3 plant electricity (US-SERC, Charlotte NC) is calibrated so A1-A3 GWP matches the EPD (165 kg CO2e/ton).
 *   - A5 crane diesel 116.7 L (~4,180 MJ) reproduces the EPD's A5 across indicators.
 *   - B6: EPD11017 reports operational energy over the 75-year building ESL (39,748,500 kWh at 0.45 kg/kWh),
 *     while the engine multiplies by the 25-year RSL, so 2,200 h/yr x 3 = 6,600 h/yr is entered.
 *   - End of life: 3,129.94 kg recycled (77.0%) and 340.1 kg landfilled (8.37%) of the 4,065 kg BOM; the
 *     remaining 14.6% is the refrigerant charge, which is recovered rather than treated as waste.
 */
export const CARRIER_19DV_500RT_EPD11017 = {
  "project_info": {
    "product_name": "AquaEdge® 19DV Water-Cooled Centrifugal Chiller",
    "manufacturer_name": "Carrier Corporation",
    "functional_unit": "1 ton chilling capacity over 25 years reference service life",
    "declared_unit": "1 piece of 500 RT chiller",
    "pcr_ref": "UL 10010-4 Part B v2.0 & EN 15804+A2",
    "geography": "North America, Global",
    "lifespan_years": 25,
    "mass_delivered_kg": 3470,
    "conversion_factor_kg_per_fu": 6.94,
    "product_category": "water_cooled_chiller",
    "capacity_rt": 500
  },
  "bom": [
    {
      "id": "bom-1",
      "name": "Shells, Tube Sheets & Structural Frame",
      "material": "steel_low_alloyed_hot_rolled",
      "mass": 2100,
      "unit": "kg",
      "ecoinvent_id": "ecoinvent_row_15528",
      "provider_id": "ecoinvent_row_15528",
      "supplier": "US Steel Supplier",
      "transport_km": 500,
      "ecoinvent_row": 15528,
      "ecoinvent_matched": true,
      "match_method": "user_selected",
      "dataset": "market for steel, low-alloyed, hot rolled [GLO]",
      "reference_product_name": "steel, low-alloyed, hot rolled",
      "reference_unit": "kg",
      "ecoinvent_geography": "GLO"
    },
    {
      "id": "bom-2",
      "name": "Evaporator & Condenser Copper Tubes",
      "material": "copper_cathode",
      "mass": 650,
      "unit": "kg",
      "ecoinvent_id": "ecoinvent_row_10662",
      "provider_id": "ecoinvent_row_10662",
      "supplier": "US Copper Tube Mill",
      "transport_km": 500,
      "ecoinvent_row": 10662,
      "ecoinvent_matched": true,
      "match_method": "user_selected",
      "dataset": "market for copper, cathode [GLO]",
      "reference_product_name": "copper, cathode",
      "reference_unit": "kg",
      "ecoinvent_geography": "GLO"
    },
    {
      "id": "bom-3",
      "name": "Refrigerant Charge R-1233zd(E)",
      "material": "refrigerant_hcfo_proxy",
      "mass": 595,
      "unit": "kg",
      "ecoinvent_id": "ecoinvent_row_9198",
      "provider_id": "ecoinvent_row_9198",
      "supplier": "Refrigerant Supplier",
      "transport_km": 500,
      "ecoinvent_row": 9198,
      "ecoinvent_matched": true,
      "match_method": "user_selected",
      "dataset": "market for 1-chloro-1,1-difluoroethane [GLO]",
      "reference_product_name": "1-chloro-1,1-difluoroethane",
      "reference_unit": "kg",
      "ecoinvent_geography": "GLO"
    },
    {
      "id": "bom-4",
      "name": "VFD, Starter & Control Electronics",
      "material": "electronics_control_units",
      "mass": 60,
      "unit": "kg",
      "ecoinvent_id": "ecoinvent_row_11485",
      "provider_id": "ecoinvent_row_11485",
      "supplier": "Controls Supplier",
      "transport_km": 500,
      "ecoinvent_row": 11485,
      "ecoinvent_matched": true,
      "match_method": "user_selected",
      "dataset": "market for electronics, for control units [GLO]",
      "reference_product_name": "electronics, for control units",
      "reference_unit": "kg",
      "ecoinvent_geography": "GLO"
    },
    {
      "id": "bom-5",
      "name": "Thermal Insulation (PU Foam)",
      "material": "insulation_polyurethane_rigid",
      "mass": 360,
      "unit": "kg",
      "ecoinvent_id": "ecoinvent_row_14059",
      "provider_id": "ecoinvent_row_14059",
      "supplier": "Insulation Supplier",
      "transport_km": 500,
      "ecoinvent_row": 14059,
      "ecoinvent_matched": true,
      "match_method": "user_selected",
      "dataset": "market for polyurethane, rigid foam [RoW]",
      "reference_product_name": "polyurethane, rigid foam",
      "reference_unit": "kg",
      "ecoinvent_geography": "RoW"
    },
    {
      "id": "bom-6",
      "name": "Gaskets, Seals & Polymer Parts",
      "material": "synthetic_rubber",
      "mass": 300,
      "unit": "kg",
      "ecoinvent_id": "ecoinvent_row_15695",
      "provider_id": "ecoinvent_row_15695",
      "supplier": "Various",
      "transport_km": 500,
      "ecoinvent_row": 15695,
      "ecoinvent_matched": true,
      "match_method": "user_selected",
      "dataset": "market for synthetic rubber [GLO]",
      "reference_product_name": "synthetic rubber",
      "reference_unit": "kg",
      "ecoinvent_geography": "GLO"
    }
  ],
  "transport": [
    {
      "name": "Suppliers -> Charlotte NC plant",
      "mode": "Heavy Lorry >32t (EURO 6)",
      "distance": 500,
      "dist": 500,
      "module": "A2",
      "provider_id": "ecoinvent_row_15959",
      "linked_material_ids": [
        "bom-1",
        "bom-2",
        "bom-4",
        "bom-5",
        "bom-6"
      ]
    }
  ],
  "manufacturing": {
    "annual_facility_kwh": 135680,
    "natural_gas_mj": 0,
    "grid_region": "US_Average",
    "water_m3": 0,
    "annual_production_units": 1,
    "electricity_provider_id": "ecoinvent_row_11443",
    "gas_provider_id": "ecoinvent_row_12065",
    "water_provider_id": "ecoinvent_water_deionised_glo"
  },
  "installation": {
    "outbound_transport_km": 500,
    "transport_mode": "Flatbed lorry 7.5-16t (EURO 5)",
    "outbound_provider_id": "ecoinvent_row_15941",
    "installation_energy_kwh": 0,
    "installation_energy_provider_id": "ecoinvent_row_17334",
    "commissioning_refrigerant_loss_kg": 0,
    "rigging_crane_diesel_liters": 116.7,
    "consumable_provider_id": "ecoinvent_row_2621"
  },
  "maintenance_b2": {
    "maintenance_cycles_per_rsl": 25,
    "consumable_name": "R-1233zd(E) refrigerant top-up (2%/yr)",
    "consumable_mass_kg": 11.9,
    "provider_id": "ecoinvent_row_9198"
  },
  "repair_b3": {
    "repair_events_per_rsl": 0,
    "part_mass_kg": 0,
    "provider_id": "ecoinvent_row_15528"
  },
  "replacement_b4": {
    "esl_years": 75
  },
  "refurbishment_b5": {
    "refurbishment_events_per_rsl": 0,
    "mass_kg": 0,
    "provider_id": "ecoinvent_row_10662"
  },
  "operational": {
    "refrigerant_type": "R1233zd",
    "refrigerant_charge_kg": 595,
    "annual_leak_rate_percent": 2.0,
    "efficiency_kw_per_ton": 0.4818,
    "capacity_rt": 500,
    "annual_operating_hours": 6600,
    "load_basis": "full_load",
    "city_grid_providers": {},
    "cooling_tower_water_m3_yr": 0,
    "energy_provider_id": "ecoinvent_row_17334",
    "water_provider_id": "ecoinvent_water_deionised_glo",
    "mass_delivered_kg": 3470,
    "conversion_factor_kg_per_fu": 6.94,
    "target_cities": []
  },
  "end_of_life": {
    "recycling_rate_percent": 77.0,
    "landfill_rate_percent": 8.37,
    "incineration_rate_percent": 0,
    "decommissioning_energy_kwh": 0,
    "waste_transport_km": 100,
    "deconstruction_provider_id": "ecoinvent_row_2621",
    "waste_transport_provider_id": "ecoinvent_row_15926",
    "recycling_process_provider_id": "ecoinvent_row_21937",
    "incineration_process_provider_id": "ecoinvent_row_22918",
    "landfill_process_provider_id": "ecoinvent_row_25140"
  },
  "circularity_d": {
    "overall_recovery_rate_percent": 0,
    "virgin_material_provider_id": "ecoinvent_row_15528",
    "recycled_process_provider_id": "ecoinvent_row_15529"
  }
};
