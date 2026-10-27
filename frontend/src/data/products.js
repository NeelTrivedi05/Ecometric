// Product categories supported by the studio. Mirrors backend/app/products.py (same ids);
// the backend applies the PCR defaults, stage rules and ecoinvent matching for each.

export const DEFAULT_PRODUCT_ID = 'water_cooled_chiller';

export const PRODUCTS = {
  water_cooled_chiller: {
    id: 'water_cooled_chiller',
    name: 'Water-Cooled Chiller',
    icon: '❄️',
    description: 'Centrifugal, screw, scroll, reciprocating and absorption chillers.',
    examples: 'Centrifugal chiller · Screw chiller · Scroll chiller',
    pcrLabel: 'UL 10010-4 Part B: Water Cooled Chiller v2.0',
    pcrShort: 'UL 10010-4 Part B',
    functionalUnit: '1 ton of chilling capacity (RT) over the reference service life',
    fuUnit: 'RT',
    fuShort: '1 ton capacity',
    isChiller: true,
    defaultRsl: 25,
    useStage: { refrigerant: true, b6: 'chiller_kw_per_ton', b7: 'cooling_tower' },
    searchTags: ['steel', 'copper', 'aluminium', 'electric motor', 'polyurethane', 'electronics', 'refrigerant'],
    bomHint: 'Engineering BOM (component, material, mass), nameplate / spec sheet, AHRI test report.',
  },
  ceramic_tile: {
    id: 'ceramic_tile',
    name: 'Ceramic / Porcelain Floor Tiles',
    icon: '🧱',
    description: 'Ceramic, porcelain, quarry, mosaic and glass floor tiles.',
    examples: 'Porcelain floor tile · Glazed ceramic tile · Quarry tile',
    pcrLabel: 'UL 10010-7 Part B: Flooring v2.0 (ceramic tile)',
    pcrShort: 'UL 10010-7 Part B',
    functionalUnit: '1 m² of installed floor covering over the reference service life',
    fuUnit: 'm²',
    fuShort: '1 m² floor covering',
    isChiller: false,
    defaultRsl: null,
    useStage: { refrigerant: false, b6: 'annual_energy', b7: 'annual_water', cleaning: true },
    searchTags: ['clay', 'kaolin', 'feldspar', 'sand', 'frit', 'ceramic tile', 'corrugated board'],
    bomHint: 'Body / glaze recipe per m² (clay, kaolin, feldspar, sand, frit) and packaging.',
  },
  electrical_cable: {
    id: 'electrical_cable',
    name: 'Electrical Cables & Wires',
    icon: '🔌',
    description: 'Power and control cables, wires and accessories (non-construction).',
    examples: 'PVC-insulated copper cable · XLPE power cable · Building wire',
    pcrLabel: 'EPD International c-PCR-004 Wires, cables and accessories + PCR 2024:06',
    pcrShort: 'c-PCR-004 + PCR 2024:06',
    functionalUnit: '1 m of cable over the reference service life',
    fuUnit: 'm',
    fuShort: '1 m of cable',
    isChiller: false,
    defaultRsl: null,
    useStage: { refrigerant: false, b6: 'annual_energy', b7: 'none' },
    searchTags: ['copper', 'wire drawing', 'polyvinyl chloride', 'polyethylene', 'aluminium', 'cable'],
    bomHint: 'Mass per metre (or per km) of conductor, insulation, sheath, fillers and drum.',
  },
  concrete_block: {
    id: 'concrete_block',
    name: 'Concrete Blocks & Pavers',
    icon: '🏗️',
    description: 'Concrete masonry units, segmental pavers and precast concrete elements.',
    examples: 'Hollow concrete block · Interlocking paver · Paving slab',
    pcrLabel: 'EPD International c-PCR-003 Concrete (EN 16757) + PCR 2019:14',
    pcrShort: 'c-PCR-003 + PCR 2019:14',
    functionalUnit: '1 tonne of concrete blocks / pavers (declared unit)',
    fuUnit: 't',
    fuShort: '1 tonne',
    isChiller: false,
    defaultRsl: null,
    useStage: { refrigerant: false, b6: 'none', b7: 'none' },
    searchTags: ['cement, Portland', 'sand', 'gravel, crushed', 'tap water', 'concrete block', 'fly ash'],
    bomHint: 'Mix design per tonne (cement, sand, aggregate, water, admixtures).',
  },
  flat_glass: {
    id: 'flat_glass',
    name: 'Flat Glass / Insulating Glass Units',
    icon: '🪟',
    description: 'Float, coated, tempered, laminated glass and insulating glass units.',
    examples: 'Double-glazed IGU · Tempered glass · Low-E coated glass',
    pcrLabel: 'EPD International c-PCR-009 Flat glass (EN 17074) + PCR 2019:14',
    pcrShort: 'c-PCR-009 + PCR 2019:14',
    functionalUnit: '1 m² of glass product (declared unit)',
    fuUnit: 'm²',
    fuShort: '1 m² glass',
    isChiller: false,
    defaultRsl: null,
    useStage: { refrigerant: false, b6: 'none', b7: 'none' },
    searchTags: ['flat glass, uncoated', 'flat glass, coated', 'tempering', 'argon', 'aluminium', 'polysulfide'],
    bomHint: 'Per m²: glass panes, spacer, gas fill, primary / secondary sealants, desiccant.',
  },
  plastic_pipe: {
    id: 'plastic_pipe',
    name: 'PVC / Plastic Pipes',
    icon: '🚰',
    description: 'Plastic piping inside buildings: PVC-U, CPVC, PE, PP, PEX pipes and fittings.',
    examples: 'PVC-U drain pipe · PVC pressure pipe · HDPE pipe',
    pcrLabel: 'EPD International c-PCR-036 Plastic piping (EN 16904) + PCR 2019:14',
    pcrShort: 'c-PCR-036 + PCR 2019:14',
    functionalUnit: '1 m of pipe (declared unit)',
    fuUnit: 'm',
    fuShort: '1 m of pipe',
    isChiller: false,
    defaultRsl: null,
    useStage: { refrigerant: false, b6: 'none', b7: 'none' },
    searchTags: ['polyvinyl chloride', 'calcium carbonate', 'titanium dioxide', 'extrusion, plastic pipes', 'polyethylene'],
    bomHint: 'Formulation per metre of pipe (resin, filler, stabiliser, pigment).',
  },
};

export const PRODUCT_LIST = Object.values(PRODUCTS);

export function getProduct(id) {
  return PRODUCTS[id] || PRODUCTS[DEFAULT_PRODUCT_ID];
}

export function productOf(extractedData) {
  return getProduct(extractedData?.project_info?.product_category);
}
