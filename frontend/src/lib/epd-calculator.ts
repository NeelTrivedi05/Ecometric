/**
 * EcoMetric EPD Calculation Engine
 * Calculates lifecycle carbon footprint for industrial chillers (EN 15804 + PCR referenced)
 */
export function calculateEPD(params: {
  capacitykW: number;
  refrigerantType: string;
  refrigerantChargeKg?: number;
  operatingHoursPerYear?: number;
  lifespanYears?: number;
  cop?: number;
  gridEmissionFactorKgCO2PerkWh?: number;
}) {
  const {
    capacitykW = 500,
    refrigerantType = 'R134a',
    refrigerantChargeKg = 45,
    operatingHoursPerYear = 4500,
    lifespanYears = 20,
    cop = 5.5,
    gridEmissionFactorKgCO2PerkWh = 0.716,
  } = params;

  const gwpMap: Record<string, number> = {
    'R134a': 1430,
    'R410A': 2088,
    'R1234ze': 7,
    'R32': 675,
    'R513A': 631,
  };

  const gwp = gwpMap[refrigerantType] || 1430;

  // 1. Stage A1-A3: Manufacturing & Raw Materials
  const manufacturingEmissionsTons = (capacitykW * 18) / 1000;

  // 2. Initial Refrigerant Charge Embodied Impact
  const initialRefrigerantEmissionsTons = (refrigerantChargeKg * gwp) / 1000;
  const totalStageA1A3Tons = Number((manufacturingEmissionsTons + initialRefrigerantEmissionsTons).toFixed(2));

  // 3. Stage B6: Operational Energy (Lifetime)
  const powerInputkW = capacitykW / cop;
  const annualkWh = powerInputkW * operatingHoursPerYear;
  const lifetimekWh = annualkWh * lifespanYears;
  const lifetimeEnergyEmissionsTons = Number(((lifetimekWh * gridEmissionFactorKgCO2PerkWh) / 1000).toFixed(2));

  // 4. Operational Leakage (Stage B1)
  const annualLeakRate = 0.02;
  const lifetimeLeakEmissionsTons = Number(((refrigerantChargeKg * annualLeakRate * lifespanYears * gwp) / 1000).toFixed(2));

  const totalLifetimeEmissionsTons = Number((totalStageA1A3Tons + lifetimeEnergyEmissionsTons + lifetimeLeakEmissionsTons).toFixed(2));
  const ratio = Number((lifetimeEnergyEmissionsTons / totalStageA1A3Tons).toFixed(1));

  return {
    capacitykW,
    refrigerantType,
    gwp,
    lifespanYears,
    cop,
    totalLifetimeEmissionsTons,
    stageA1A3EmissionsTons: totalStageA1A3Tons,
    stageB6EnergyEmissionsTons: lifetimeEnergyEmissionsTons,
    stageB1LeakageEmissionsTons: lifetimeLeakEmissionsTons,
    operationalToMaterialRatio: `${ratio}×`,
    epdReadinessScore: ratio > 100 ? 'EU CPR Ready — B6 Dominant' : 'Standard Benchmark',
    complianceStandard: 'EN 15804+A2 / ISO 14025 Directional Estimate',
  };
}
