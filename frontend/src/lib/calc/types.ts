export type Methodology = 'PEF' | 'CML' | 'TRACI';

export interface ProductTechnicalInput {
  chillingCapacityRt: number;
  chillingCapacityKw?: number;
  refrigerantType: string;
  refrigerantChargeKg: number;
  massDeliveredKg: number;
  conversionFactorKgPerTon?: number;
}

export interface TransportInput {
  fuelLPer100km: number;
  distanceKm: number;
  capacityUtilizationPct: number;
}

export interface InstallationInput {
  auxiliaryMaterialsKg: number;
  electricityKwh: number;
  constructionWasteKg: number;
}

export interface MaintenanceInput {
  maintenanceCyclesPerRsl: number;
  refrigerantReplacementKg: number;
  electricityKwh: number;
}

export interface ReplacementInput {
  replacementCycles: number; // ceil((esl/rsl)-1)
  wornPartsReplacedKg: number;
  electricityKwh: number;
}

export interface OperationalEnergyInput {
  targetCities: string[];
  efficiencyKwPerTon: number; // e.g. 0.54
  chillerCapacityTons: number; // e.g. 500
  productLifespanYears: number; // e.g. 25
  customGridFactor?: number;
}

export interface EolInput {
  collectedSeparatelyKg: number;
  landfillKg: number;
  recyclingKg: number;
  refrigerantRecoveryPct: number; // e.g. 90
}

export interface FullProjectLcaInput {
  technical: ProductTechnicalInput;
  transport?: TransportInput;
  installation?: InstallationInput;
  maintenance?: MaintenanceInput;
  replacement?: ReplacementInput;
  operationalB6: OperationalEnergyInput;
  eol?: EolInput;
}

export interface ImpactModuleResult {
  module: string;
  methodology: Methodology;
  gwpKgCo2e: number;
  odpKgCfc11e: number;
  apKgSo2e: number;
  epKgPo4e: number;
}

export interface CompleteLcaResult {
  projectId?: string;
  calculatedAt: string;
  operationalToMaterialRatio: string;
  epdReadinessStatus: string;
  complianceStandard: string;
  byModule: Record<string, ImpactModuleResult>;
  totalsByMethodology: Record<Methodology, { gwp: number; odp: number; ap: number; ep: number }>;
}
