"""English text library. Every key can be overridden per product profile or per report."""

TEXT = {
    # ------------------------------------------------------------ indicator definitions
    "def.GWP": "Global warming potential (GWP) quantifies the radiative forcing of greenhouse gas emissions "
               "relative to carbon dioxide over a 100-year time horizon.",
    "def.ODP": "Ozone depletion potential (ODP) measures emissions that destroy stratospheric ozone, relative to "
               "trichlorofluoromethane (CFC-11).",
    "def.AP.SO2": "Acidification potential (AP) quantifies emissions such as SO₂ and NOₓ that increase the acidity "
                  "of soil and water, expressed as sulfur dioxide equivalents.",
    "def.AP.AE": "Acidification potential, accumulated exceedance, quantifies the exceedance of critical loads of "
                 "acidifying deposition in sensitive ecosystems, expressed in moles of H⁺ equivalents.",
    "def.EP.N": "Eutrophication potential (EP) quantifies nutrient enrichment of ecosystems, expressed as nitrogen "
                "equivalents.",
    "def.EP.PO4": "Eutrophication potential (EP) quantifies nutrient enrichment of ecosystems, expressed as phosphate "
                  "equivalents.",
    "def.EP.P": "Freshwater eutrophication potential quantifies the fraction of phosphorus nutrients reaching "
                "freshwater end compartments.",
    "def.EP.AE": "Terrestrial eutrophication potential, accumulated exceedance, quantifies the exceedance of critical "
                 "loads of nitrogen deposition on terrestrial ecosystems.",
    "def.SFP": "Smog formation potential (SFP) quantifies emissions that form ground-level ozone, expressed as ozone "
               "equivalents.",
    "def.POCP": "Photochemical ozone creation potential (POCP) quantifies emissions of volatile compounds that form "
                "tropospheric ozone in the presence of sunlight.",
    "def.ADPE": "Abiotic depletion potential for minerals and metals measures the extraction of scarce non-living "
                "resources, relative to antimony.",
    "def.ADPF": "Abiotic depletion potential for fossil resources measures the consumption of fossil energy carriers "
                "by their net calorific value.",
    "def.FFD": "Fossil fuel depletion quantifies the additional future energy required to extract fossil resources.",
    "def.WDP": "Water deprivation potential quantifies water consumption weighted by the relative scarcity of water "
               "in the region where it is consumed.",
    "def.PM": "Particulate matter quantifies the potential human health impact of fine particle emissions.",
    "def.IRP": "Ionising radiation quantifies potential human exposure to radionuclides, relative to uranium-235.",
    "def.ET": "Ecotoxicity quantifies the potential toxic effect of emissions on freshwater ecosystems.",
    "def.HT": "Human toxicity quantifies the potential toxic effect of emissions on human health.",
    "def.SQP": "The soil quality index quantifies the potential impact of land use on soil quality.",

    # ------------------------------------------------------------ boilerplate
    "text.comparability.en15804": (
        "EPDs of construction products may not be comparable if they do not comply with EN 15804 and if they are "
        "not compared in a building context. Environmental declarations from different programs (ISO 14025) may "
        "not be comparable. Comparison of the environmental performance of products using EPD information shall "
        "be based on the product's use and impacts at the building level."),
    "text.comparability.iso21930": (
        "Environmental declarations from different programs (ISO 14025) may not be comparable. Comparison of the "
        "environmental performance of products using EPD information shall be based on the product's use and "
        "impacts at the building level, and EPDs may not be used for comparability purposes when not considering "
        "the building use phase as instructed under the PCR. Full conformance with the PCR allows EPD "
        "comparability only when all stages of the life cycle have been considered, when the EPDs comply with all "
        "referenced standards, use the same sub-category PCR and use equivalent scenarios."),
    "text.comparability.generic": (
        "Environmental declarations from different programs (ISO 14025) may not be comparable. Results are only "
        "comparable when the same functional or declared unit, PCR, system boundary and calculation rules apply."),
    "text.cutoff.default": (
        "Processes whose total contribution is less than 1% of the total mass and primary energy of the declared "
        "or functional unit may be excluded, provided that the total of excluded flows does not exceed 5% of mass "
        "and energy per module. No known flows were deliberately excluded."),
    "text.allocation.default": (
        "Where a manufacturing site produces several products, energy, materials and wastes were allocated on a "
        "mass basis. Recycled content enters the system burden-free (cut-off approach); burdens of material "
        "recycling at end of life are attributed to the system that uses the secondary material."),
    "text.dataquality.default": (
        "Primary data was collected from the manufacturer for the reference year. Background data was taken from "
        "the LCI database listed in the declaration summary, selected for technological, geographical and temporal "
        "representativeness."),
    "text.biogenic.en15804a2": (
        "Biogenic carbon is reported separately as GWP-biogenic in accordance with EN 15804+A2. Biogenic carbon "
        "content of the product and its packaging is declared where it exceeds 5% of the product mass."),
    "text.biogenic.generic": (
        "Biogenic carbon uptake and release are accounted for in accordance with the referenced standard and PCR."),
    "text.limitations.default": (
        "Results represent potential environmental impacts and do not predict impacts on specific endpoints, the "
        "exceedance of thresholds, safety margins or risks."),
    "text.assumptions.default": (
        "The selection of secondary datasets to represent the supply chain is a significant value choice; no "
        "generic dataset is a perfect fit. Supply-chain-specific data would improve the accuracy of the results."),
    "text.mnd_legend": "X = module declared; MND = module not declared; ND = not declared.",
    "text.results_note": "Results for modules A1–A3, A4, A5, B, C and D should not be summed.",
    "text.not_declared": "Not declared",

    # ------------------------------------------------------------ narrative templates
    "nar.results_intro": "All results are given per {fu}.",
    "nar.results_variant": "Results below refer to the variant “{variant}”.",
    "nar.dominant_module": (
        "Module {module} — {module_label} contributes {share}% of total {indicator}{lifetime_clause}."),
    "nar.lifetime_clause": " over the {years}-year building service life",
    "nar.replacement": (
        "With a reference service life of {rsl} years and a building estimated service life of {esl} years, "
        "{replacements} replacement(s) are required (module B4)."),
    "nar.a4_leg": "Transport to site ({mode}) covers {distance} km{vehicle_clause}.",
    "nar.a4_vehicle": " by {vehicle}",
    "nar.a5_loss": "Installation losses of {loss}% of the product are assumed.",
    "nar.a5_energy": "Installation requires {energy}.",
    "nar.eol_routes": "At end of life, the product is assumed to be {routes}.",
    "nar.excluding_dominant": (
        "Because module {module} dominates the results (more than {threshold}% of {indicator}), {figure} shows the "
        "relative contribution of the remaining modules with {module} excluded."),
    "nar.no_dominant": "No single module exceeds {threshold}% of {indicator}; all modules are shown together.",
    "nar.material_top": (
        "{material} is the largest contributor to {indicator} in modules A1–A3 ({share}%), followed by {second}."),
    "nar.material_top_single": "{material} is the largest contributor to {indicator} in modules A1–A3 ({share}%).",
    "nar.variant_comparison": (
        "Across variants, {indicator} for modules {modules} ranges from {min_value} {unit} ({min_variant}) to "
        "{max_value} {unit} ({max_variant})."),
    "nar.product_stage_share": (
        "The product stage (A1–A3) accounts for {share}% of {indicator} across the declared modules, excluding module D."),
}
