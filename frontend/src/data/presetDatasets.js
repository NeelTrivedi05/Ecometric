/**
 * presetDatasets.js
 * Verified engineering test presets compliant with UL 10010-4 Part B v2.0,
 * EN 15804+A2, and ISO 14025 / 21930 per SKILL.md.
 */

export const PRESET_DATASETS = {
  'aquaedge_500rt': {
    id: 'aquaedge_500rt',
    filename: '11_water_cooled_centrifugal_multitab_master.xlsx',
    title: 'AquaEdge® 19DV 500RT Centrifugal Chiller',
    subtitle: 'UL 10010-4 Part B Benchmark • Master Multi-Tab A1–D',
    equipmentType: 'Water-Cooled Centrifugal Chiller',
    capacityRt: 500.0,
    nominalKw: 1758,
    refrigerant: 'R134a (45.0 kg)',
    efficiency: '0.5400 kW/ton',
    totalMassKg: 3470,
    badge: 'Master Benchmark',
    badgeColor: '#28cd41',
    extracted: {
      project_info: {
        product_name: 'AquaEdge® 19DV Water-Cooled Centrifugal Chiller',
        manufacturer_name: 'Carrier Corporation',
        functional_unit: '1 ton chilling capacity over 25 years reference service life',
        declared_unit: '1 piece of 500 RT chiller',
        pcr_ref: 'UL 10010-4 Part B v2.0 & EN 15804+A2',
        geography: 'North America, Global',
        lifespan_years: 25,
        mass_delivered_kg: 3470,
        conversion_factor_kg_per_fu: 6.94,
      },
      bom: [
        { id: 'bom-1', name: 'Compressor Volute & Rotor Shell', material: 'steel_hot_rolled', mass: 2100, unit: 'kg', ecoinvent_id: 'ecoinvent_steel_hot_rolled_glo', provider_id: 'ecoinvent_steel_hot_rolled_glo', supplier: 'Midwest Steel Casting', transport_km: 420 },
        { id: 'bom-2', name: 'Condenser & Evaporator Tubes', material: 'copper_tube_wire', mass: 650, unit: 'kg', ecoinvent_id: 'ecoinvent_copper_tube_wire_glo', provider_id: 'ecoinvent_copper_tube_wire_glo', supplier: 'Great Lakes Copper Corp', transport_km: 280 },
        { id: 'bom-3', name: 'Semi-Hermetic Induction Motor', material: 'electric_motor_industrial', mass: 450, unit: 'kg', ecoinvent_id: 'ecoinvent_electric_motor_industrial_glo', provider_id: 'ecoinvent_electric_motor_industrial_glo', supplier: 'Precision ElectroMotors Ltd', transport_km: 650 },
        { id: 'bom-4', name: 'Shell Thermal Insulation Jackets', material: 'insulation_polyurethane_rigid', mass: 150, unit: 'kg', ecoinvent_id: 'ecoinvent_insulation_pu_rigid_rer', provider_id: 'ecoinvent_insulation_pu_rigid_rer', supplier: 'PolyFoam Systems', transport_km: 190 },
        { id: 'bom-5', name: 'Solid-State Inverter VFD Package', material: 'electronics_vfd', mass: 120, unit: 'kg', ecoinvent_id: 'ecoinvent_electronics_vfd_glo', provider_id: 'ecoinvent_electronics_vfd_glo', supplier: 'Advantech Power Systems', transport_km: 890 }
      ],
      transport: [
        { mode: 'Heavy Lorry >32t (EURO 6)', distance: 485, dist: 485, emission_factor: 0.088, ef: 0.088, module: 'A2', provider_id: 'ecoinvent_transport_lorry_32t_rer' },
        { mode: 'Transoceanic Container Ship', distance: 1200, dist: 1200, emission_factor: 0.0145, ef: 0.0145, module: 'A2', provider_id: 'ecoinvent_transport_container_ship_glo' },
        { mode: 'Heavy Delivery Lorry >32t to Site', distance: 500, dist: 500, emission_factor: 0.088, ef: 0.088, module: 'A4', provider_id: 'ecoinvent_transport_lorry_32t_rer' }
      ],
      manufacturing: {
        annual_facility_kwh: 34000,
        natural_gas_mj: 18500,
        grid_region: 'US_Average',
        water_m3: 45.0,
        annual_production_units: 50,
        electricity_provider_id: 'ecoinvent_elec_mv_us',
        gas_provider_id: 'ecoinvent_gas_burned_boiler_glo',
        water_provider_id: 'ecoinvent_water_deionised_glo',
      },
      installation: {
        outbound_transport_km: 500,
        transport_mode: 'Heavy Lorry >32t (EURO 6)',
        outbound_provider_id: 'ecoinvent_transport_lorry_32t_rer',
        installation_energy_kwh: 350,
        installation_energy_provider_id: 'ecoinvent_elec_mv_us',
        commissioning_refrigerant_loss_kg: 0.5,
        rigging_crane_diesel_liters: 25.0,
        consumable_provider_id: 'ecoinvent_diesel_burned_building_machine_glo',
      },
      maintenance_b2: {
        maintenance_cycles_per_rsl: 5,
        consumable_name: 'Synthetic Polyol Ester Lubricant',
        consumable_mass_kg: 25.0,
        provider_id: 'ecoinvent_lubricating_oil_glo',
      },
      repair_b3: {
        repair_events_per_rsl: 1,
        replaced_part_name: 'Motor Bearing Assembly',
        part_mass_kg: 45.0,
        material_type: 'steel_hot_rolled',
        provider_id: 'ecoinvent_steel_hot_rolled_glo',
      },
      replacement_b4: {
        esl_years: 75,
      },
      refurbishment_b5: {
        refurbishment_events_per_rsl: 1,
        material_name: 'Condenser Tube Bundles',
        mass_kg: 120.0,
        provider_id: 'ecoinvent_copper_tube_wire_glo',
      },
      operational: {
        refrigerant_type: 'R134a',
        refrigerant_charge_kg: 45.0,
        annual_leak_rate_percent: 2.0,
        fugitive_operational_leak_rate: 0.5,
        efficiency_kw_per_ton: 0.54,
        capacity_rt: 500.0,
        target_cities: ['Chicago', 'Houston', 'Frankfurt', 'Dubai'],
        annual_operating_hours: 3500,
        load_basis: 'full_load',
        cooling_tower_water_m3_yr: 120.0,
        scheduled_maintenance_kwh_yr: 180.0,
        major_component_replacement_year: 15,
        energy_provider_id: 'ecoinvent_elec_mv_us',
        water_provider_id: 'ecoinvent_water_deionised_glo',
        mass_delivered_kg: 3470,
        conversion_factor_kg_per_fu: 6.94,
      },
      end_of_life: {
        recycling_rate_percent: 92.4,
        landfill_rate_percent: 4.5,
        incineration_rate_percent: 3.1,
        decommissioning_energy_kwh: 120,
        waste_transport_km: 100,
        deconstruction_provider_id: 'ecoinvent_diesel_dismantling_glo',
        waste_transport_provider_id: 'ecoinvent_transport_lorry_32t_rer',
        recycling_process_provider_id: 'ecoinvent_waste_metal_recycling_glo',
        incineration_process_provider_id: 'ecoinvent_waste_incineration_glo',
        landfill_process_provider_id: 'ecoinvent_waste_landfill_glo',
      },
      circularity_d: {
        overall_recovery_rate_percent: 92.4,
        steel_scrap_recovery_rate: 95.0,
        copper_scrap_recovery_rate: 96.0,
        aluminium_recovery_rate: 90.0,
        refrigerant_reclamation_rate: 92.0,
        net_avoided_burden_gwp_kg: -3210.0,
      }
    }
  },

  'screw_chiller_300rt': {
    id: 'screw_chiller_300rt',
    filename: '02_air_cooled_screw_chiller_bom.xlsx',
    title: 'AquaForce® 30XV Air-Cooled Screw Chiller',
    subtitle: 'Module A1 9-Part BOM • Test Suite 02',
    equipmentType: 'Air-Cooled Screw Chiller',
    capacityRt: 300.0,
    nominalKw: 1055,
    refrigerant: 'R134a (55.0 kg)',
    efficiency: '0.7200 kW/ton',
    totalMassKg: 2850,
    badge: '300 RT Air-Cooled',
    badgeColor: '#0066cc',
    extracted: {
      project_info: {
        product_name: 'AquaForce® 30XV Air-Cooled Screw Chiller',
        manufacturer_name: 'Carrier HVAC Systems',
        functional_unit: '1 ton chilling capacity over 25 years reference service life',
        declared_unit: '1 piece of 300 RT air-cooled screw chiller',
        pcr_ref: 'UL 10010-4 Part B v2.0 & EN 15804+A2',
        geography: 'North America, US-Midwest',
        lifespan_years: 25,
        mass_delivered_kg: 2850,
        conversion_factor_kg_per_fu: 9.50,
      },
      bom: [
        { id: 'bom-s1', name: 'Twin-Screw Compressor Casing', material: 'steel_hot_rolled', mass: 1450, unit: 'kg', ecoinvent_id: 'ecoinvent_steel_hot_rolled_glo', provider_id: 'ecoinvent_steel_hot_rolled_glo', supplier: 'Frascold SpA', transport_km: 620 },
        { id: 'bom-s2', name: 'Condenser Heat Exchanger Tubes', material: 'copper_tube_wire', mass: 580, unit: 'kg', ecoinvent_id: 'ecoinvent_copper_tube_wire_glo', provider_id: 'ecoinvent_copper_tube_wire_glo', supplier: 'Wieland Rolled Products', transport_km: 310 },
        { id: 'bom-s3', name: 'Axial Aerodynamic Condenser Fans', material: 'aluminium_cast_alloy', mass: 240, unit: 'kg', ecoinvent_id: 'ecoinvent_aluminium_cast_glo', provider_id: 'ecoinvent_aluminium_cast_glo', supplier: 'Ziehl-Abegg Fans', transport_km: 480 },
        { id: 'bom-s4', name: 'Acoustic Shell Polyurethane Insulation', material: 'insulation_polyurethane_rigid', mass: 80, unit: 'kg', ecoinvent_id: 'ecoinvent_insulation_pu_rigid_rer', provider_id: 'ecoinvent_insulation_pu_rigid_rer', supplier: 'AcoustiForm Ltd', transport_km: 210 },
        { id: 'bom-s5', name: 'VFD Frequency Inverter Package', material: 'electronics_vfd', mass: 110, unit: 'kg', ecoinvent_id: 'ecoinvent_electronics_vfd_glo', provider_id: 'ecoinvent_electronics_vfd_glo', supplier: 'Danfoss Drives', transport_km: 740 },
        { id: 'bom-s6', name: 'Structural Base Skid Frame', material: 'steel_hot_rolled', mass: 390, unit: 'kg', ecoinvent_id: 'ecoinvent_steel_hot_rolled_glo', provider_id: 'ecoinvent_steel_hot_rolled_glo', supplier: 'ArcelorMittal Steel', transport_km: 350 }
      ],
      transport: [
        { mode: 'Heavy Lorry >32t (EURO 6)', distance: 450, dist: 450, emission_factor: 0.088, ef: 0.088, module: 'A2', provider_id: 'ecoinvent_transport_lorry_32t_rer' }
      ],
      manufacturing: {
        annual_facility_kwh: 28500,
        natural_gas_mj: 14200,
        grid_region: 'US_Average',
        water_m3: 32.0,
        annual_production_units: 60,
        electricity_provider_id: 'ecoinvent_elec_mv_us',
        gas_provider_id: 'ecoinvent_gas_burned_boiler_glo',
      },
      installation: {
        outbound_transport_km: 420,
        transport_mode: 'Heavy Lorry >32t (EURO 6)',
        installation_energy_kwh: 280,
        commissioning_refrigerant_loss_kg: 0.8,
        rigging_crane_diesel_liters: 32.0,
      },
      operational: {
        refrigerant_type: 'R134a',
        refrigerant_charge_kg: 55.0,
        annual_leak_rate_percent: 2.2,
        efficiency_kw_per_ton: 0.72,
        capacity_rt: 300.0,
        annual_operating_hours: 2200,
        cooling_tower_water_m3_yr: 0.0,
        scheduled_maintenance_kwh_yr: 150.0,
        mass_delivered_kg: 2850,
        conversion_factor_kg_per_fu: 9.50,
      },
      end_of_life: {
        recycling_rate_percent: 91.0,
        landfill_rate_percent: 5.5,
        incineration_rate_percent: 3.5,
        decommissioning_energy_kwh: 95,
        waste_transport_km: 100,
      },
      circularity_d: {
        steel_scrap_recovery_rate: 94.0,
        copper_scrap_recovery_rate: 95.0,
        aluminium_recovery_rate: 92.0,
        net_avoided_burden_gwp_kg: -2450.0,
      }
    }
  },

  'heat_pump_150rt': {
    id: 'heat_pump_150rt',
    filename: '03_modular_heat_pump_bom.csv',
    title: 'AquaSnap® 30MP Modular Heat Pump',
    subtitle: 'Reversible Cycle 8-Part BOM • Test Suite 03',
    equipmentType: 'Water-to-Water Heat Pump',
    capacityRt: 150.0,
    nominalKw: 528,
    refrigerant: 'R410A (28.0 kg)',
    efficiency: '0.5800 kW/ton',
    totalMassKg: 1420,
    badge: '150 RT Heat Pump',
    badgeColor: '#ff9f0a',
    extracted: {
      project_info: {
        product_name: 'AquaSnap® 30MP Modular Water-to-Water Heat Pump',
        manufacturer_name: 'Carrier HVAC Systems',
        functional_unit: '1 ton chilling capacity over 25 years reference service life',
        declared_unit: '1 piece of 150 RT modular heat pump',
        pcr_ref: 'UL 10010-4 Part B v2.0 & EN 15804+A2',
        geography: 'North America, Global',
        lifespan_years: 25,
        mass_delivered_kg: 1420,
        conversion_factor_kg_per_fu: 9.47,
      },
      bom: [
        { id: 'bom-hp1', name: 'Hermetic Scroll Compressors (Tandem)', material: 'steel_hot_rolled', mass: 420, unit: 'kg', ecoinvent_id: 'ecoinvent_steel_hot_rolled_glo', provider_id: 'ecoinvent_steel_hot_rolled_glo', supplier: 'Copeland Scroll', transport_km: 380 },
        { id: 'bom-hp2', name: 'Brazed Plate Heat Exchanger (BPHE)', material: 'stainless_steel_304', mass: 310, unit: 'kg', ecoinvent_id: 'ecoinvent_steel_hot_rolled_glo', provider_id: 'ecoinvent_steel_hot_rolled_glo', supplier: 'SWEP International', transport_km: 510 },
        { id: 'bom-hp3', name: '4-Way Reversible Cycle Valve', material: 'copper_tube_wire', mass: 45, unit: 'kg', ecoinvent_id: 'ecoinvent_copper_tube_wire_glo', provider_id: 'ecoinvent_copper_tube_wire_glo', supplier: 'Sanhua Automotive & HVAC', transport_km: 820 },
        { id: 'bom-hp4', name: 'Electronic Expansion Valve (EXV)', material: 'copper_tube_wire', mass: 35, unit: 'kg', ecoinvent_id: 'ecoinvent_copper_tube_wire_glo', provider_id: 'ecoinvent_copper_tube_wire_glo', supplier: 'Carel Industries', transport_km: 690 },
        { id: 'bom-hp5', name: 'Powder-Coated Structural Enclosure', material: 'steel_hot_rolled', mass: 460, unit: 'kg', ecoinvent_id: 'ecoinvent_steel_hot_rolled_glo', provider_id: 'ecoinvent_steel_hot_rolled_glo', supplier: 'Atlas Precision Sheet Metal', transport_km: 180 },
        { id: 'bom-hp6', name: 'Microprocessor Chiller Controller', material: 'electronics_vfd', mass: 28, unit: 'kg', ecoinvent_id: 'ecoinvent_electronics_vfd_glo', provider_id: 'ecoinvent_electronics_vfd_glo', supplier: 'Schneider Electric', transport_km: 450 },
        { id: 'bom-hp7', name: 'Piping & Brass Fittings Assembly', material: 'copper_tube_wire', mass: 122, unit: 'kg', ecoinvent_id: 'ecoinvent_copper_tube_wire_glo', provider_id: 'ecoinvent_copper_tube_wire_glo', supplier: 'Mueller Industries', transport_km: 310 }
      ],
      transport: [
        { mode: 'Heavy Lorry >32t (EURO 6)', distance: 380, dist: 380, emission_factor: 0.088, ef: 0.088, module: 'A2', provider_id: 'ecoinvent_transport_lorry_32t_rer' }
      ],
      manufacturing: {
        annual_facility_kwh: 16800,
        natural_gas_mj: 8400,
        grid_region: 'US_Average',
        water_m3: 18.0,
        annual_production_units: 120,
      },
      installation: {
        outbound_transport_km: 350,
        transport_mode: 'Heavy Lorry >32t (EURO 6)',
        installation_energy_kwh: 160,
        commissioning_refrigerant_loss_kg: 0.3,
        rigging_crane_diesel_liters: 14.0,
      },
      operational: {
        refrigerant_type: 'R410A',
        refrigerant_charge_kg: 28.0,
        annual_leak_rate_percent: 1.8,
        efficiency_kw_per_ton: 0.58,
        capacity_rt: 150.0,
        annual_operating_hours: 3200,
        cooling_tower_water_m3_yr: 45.0,
        scheduled_maintenance_kwh_yr: 90.0,
        mass_delivered_kg: 1420,
        conversion_factor_kg_per_fu: 9.47,
      },
      end_of_life: {
        recycling_rate_percent: 94.0,
        landfill_rate_percent: 4.0,
        incineration_rate_percent: 2.0,
        decommissioning_energy_kwh: 60,
        waste_transport_km: 80,
      },
      circularity_d: {
        steel_scrap_recovery_rate: 96.0,
        copper_scrap_recovery_rate: 97.0,
        net_avoided_burden_gwp_kg: -1380.0,
      }
    }
  },

  'incomplete_gap_analysis': {
    id: 'incomplete_gap_analysis',
    filename: '04_incomplete_bom_for_gap_analysis.csv',
    title: 'Prototype Chiller (Cut-Off Gap Audit Model)',
    subtitle: 'PCR Cut-off & Missing Transport Triggers • Test Suite 04',
    equipmentType: 'Prototype Equipment',
    capacityRt: 250.0,
    nominalKw: 879,
    refrigerant: 'Not Specified (0 kg)',
    efficiency: '0.6500 kW/ton',
    totalMassKg: 1050,
    badge: 'PCR Gaps Test',
    badgeColor: '#ff3b30',
    extracted: {
      project_info: {
        product_name: 'Prototype Modular Chiller (Gap Analysis Model)',
        manufacturer_name: 'Prototype Engineering Ltd',
        functional_unit: '1 ton chilling capacity over 25 years reference service life',
        declared_unit: '1 piece of 250 RT prototype chiller',
        pcr_ref: 'UL 10010-4 Part B v2.0 & EN 15804+A2',
        geography: 'North America',
        lifespan_years: 25,
        mass_delivered_kg: 2200,
        conversion_factor_kg_per_fu: 8.80,
      },
      bom: [
        { id: 'bom-gap1', name: 'Prototype Compressor Shell', material: 'steel_hot_rolled', mass: 650, unit: 'kg', ecoinvent_id: 'ecoinvent_steel_hot_rolled_glo', provider_id: 'ecoinvent_steel_hot_rolled_glo', supplier: 'Prototype Casting', transport_km: 0 },
        { id: 'bom-gap2', name: 'Condenser Coils (Estimated)', material: 'copper_tube_wire', mass: 180, unit: 'kg', ecoinvent_id: 'ecoinvent_copper_tube_wire_glo', provider_id: 'ecoinvent_copper_tube_wire_glo', supplier: 'Unknown Supplier', transport_km: 0 },
        { id: 'bom-gap3', name: 'Structural Frame', material: 'steel_hot_rolled', mass: 220, unit: 'kg', ecoinvent_id: 'ecoinvent_steel_hot_rolled_glo', provider_id: 'ecoinvent_steel_hot_rolled_glo', supplier: 'Local Welding', transport_km: 0 }
      ],
      transport: [], // Triggers PCR A2 gap!
      manufacturing: {
        annual_facility_kwh: 15000,
        natural_gas_mj: 0,
        grid_region: 'US_Average',
        water_m3: 0,
      },
      installation: {
        outbound_transport_km: 0, // Triggers PCR A4 gap!
      },
      operational: {
        refrigerant_type: 'R134a',
        refrigerant_charge_kg: 0, // Triggers B1 missing charge!
        annual_leak_rate_percent: 0,
        efficiency_kw_per_ton: 0.65,
        capacity_rt: 250.0,
        annual_operating_hours: 2200,
        mass_delivered_kg: 2200,
        conversion_factor_kg_per_fu: 8.80,
      },
      end_of_life: {
        recycling_rate_percent: 0,
        landfill_rate_percent: 0,
        incineration_rate_percent: 0,
      },
      circularity_d: {}
    }
  }
};
