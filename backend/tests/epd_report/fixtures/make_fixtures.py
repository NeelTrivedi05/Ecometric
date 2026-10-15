"""
Generates the EPD report test fixtures (deterministic). Run:  python tests/epd_report/fixtures/make_fixtures.py

All organisations, people and numbers are fictional / illustrative. Magnitudes are
chosen to be plausible for each product type, not taken from a real declaration.
"""

import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
SUBS = ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "C1", "C2", "C3", "C4", "D"]


def jitter(key: str, lo=0.6, hi=1.4) -> float:
    h = int(hashlib.sha256(key.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF
    return lo + (hi - lo) * h


def logo(text: str, color: str) -> str:
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="340" height="64" viewBox="0 0 340 64">'
           f'<rect width="64" height="64" rx="12" fill="{color}"/><text x="76" y="40" font-family="Arial" '
           f'font-size="20" font-weight="700" fill="#222">{text}</text></svg>')
    import base64
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


def product_image(label: str, color: str) -> str:
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300">'
           f'<rect width="480" height="300" fill="#f2f4f7"/><rect x="60" y="70" width="360" height="160" rx="10" '
           f'fill="{color}" opacity="0.85"/><text x="240" y="160" text-anchor="middle" font-family="Arial" '
           f'font-size="22" fill="#fff">{label}</text></svg>')
    import base64
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


def sig(v: float) -> float:
    return float(f"{v:.6g}")


def vector(base: dict, scale: float, key: str, modules, zero=()):
    out = {}
    for m in modules:
        v = base.get(m, 0.0)
        out[m] = 0.0 if m in zero else sig(v * scale * jitter(f"{key}:{m}", 0.75, 1.25)) if v else 0.0
    return out


# ------------------------------------------------------------------ chiller (per ton chilling capacity)

CHILLER_GWP = {"A1": 150.0, "A2": 10.0, "A3": 5.0, "A4": 1.24, "A5": 0.84, "B1": 1.38, "B2": 3.52, "B3": 0.42,
               "B4": 333.0, "B5": 0.0, "B6": 35900.0, "B7": 0.05, "C1": 0.0, "C2": 0.42, "C3": 2.07, "C4": 0.10}
CHILLER_MODS = [m for m in SUBS if m != "D"]

TRACI_SCALE = {"GWP": 1.0, "ODP": 2.1e-7, "AP": 4.4e-3, "EP": 3.9e-3, "SFP": 6.8e-2, "FFD": 0.21,
               "PMFP": 4.0e-4, "HTc": 1.1e-8, "HTnc": 9.0e-8, "ETf": 2.3}
CML_SCALE = {"GWP": 1.0, "ODP": 1.9e-7, "AP": 4.0e-3, "EP": 1.6e-3, "POCP": 2.2e-4, "ADPE": 1.4e-5, "ADPF": 11.8,
             "HTP": 0.62, "FAETP": 0.31, "MAETP": 640.0, "TETP": 4.1e-3}
A2_SCALE = {"GWP-total": 1.0, "GWP-fossil": 0.985, "GWP-biogenic": 0.004, "GWP-luluc": 0.011, "ODP": 2.0e-7,
            "AP": 5.1e-3, "EP-freshwater": 2.6e-4, "EP-marine": 9.6e-4, "EP-terrestrial": 1.0e-2, "POCP": 2.7e-3,
            "ADP-minerals&metals": 1.5e-5, "ADP-fossil": 12.4, "WDP": 0.31, "PM": 4.2e-8, "IRP": 0.48,
            "ETP-fw": 18.0, "HTP-c": 1.2e-9, "HTP-nc": 2.6e-8, "SQP": 6.5,
            "PERE": 1.9, "PERM": 0.0, "PERT": 1.9, "PENRE": 12.9, "PENRM": 0.2, "PENRT": 13.1, "SM": 0.0,
            "RSF": 0.0, "NRSF": 0.0, "FW": 7.1e-3, "HWD": 2.0e-4, "NHWD": 0.28, "RWD": 6.0e-5,
            "CRU": 0.0, "MFR": 0.0, "MER": 0.0, "EEE": 0.0, "EET": 0.0}


def chiller_rows(scales, method_key, variant, b1_only_gwp=True):
    rows = []
    for code, sc in scales.items():
        base = dict(CHILLER_GWP)
        if variant == "cn":
            base = {**base, "A1": base["A1"] * 1.12, "A2": base["A2"] * 1.3, "A3": base["A3"] * 1.6,
                    "A4": base["A4"] * 3.5}
        zero = [] if code.startswith("GWP") else (["B1"] if b1_only_gwp else [])
        if code in ("MFR",):
            vals = {m: 0.0 for m in CHILLER_MODS}
            vals["C3"] = 9.1
        elif sc == 0.0:
            vals = {m: 0.0 for m in CHILLER_MODS}
        else:
            vals = vector(base, sc, f"{method_key}:{code}:{variant}", CHILLER_MODS, zero)
        vals["A1-A3"] = sig(vals["A1"] + vals["A2"] + vals["A3"])
        vals["C1-C4"] = sig(vals["C1"] + vals["C2"] + vals["C3"] + vals["C4"])
        rows.append({"indicatorCode": code, "values": vals})
    return rows


def chiller_results():
    out = []
    for vid, vlabel in (("us", "Manufactured in US"), ("cn", "Manufactured in China")):
        out.append({"variantId": vid, "variantLabel": vlabel, "method": "TRACI 2.1",
                    "rows": chiller_rows(TRACI_SCALE, "traci", vid)})
        out.append({"variantId": vid, "variantLabel": vlabel, "method": "CML-IA",
                    "rows": chiller_rows(CML_SCALE, "cml", vid)})
        out.append({"variantId": vid, "variantLabel": vlabel, "method": "EN15804+A2/PEF",
                    "rows": chiller_rows(A2_SCALE, "a2", vid)})
    return out


SHARED_PARTIES = {
    "programOperator": {
        "name": "Example Program Operator",
        "address": "100 Declaration Way\nSpringfield, ST 00000",
        "website": "https://program-operator.example",
        "logo": logo("Example PO", "#3a6ea5"),
        "generalProgramInstructions": "General Program Instructions, version 2.1 (2023)",
    },
    "manufacturer": {
        "name": "Example Climate Systems Inc.",
        "address": "1 Industrial Park Road\nRiverton, ST 00001",
        "website": "https://climate-systems.example",
        "logo": logo("Example Climate", "#1f4e79"),
        "description": "Example Climate Systems Inc. designs and manufactures heating, ventilation and air "
                       "conditioning equipment for commercial buildings.",
    },
    "verification": {
        "type": "external", "verified": True,
        "epdVerifier": {"name": "A. Verifier", "organization": "Independent Verification Ltd.",
                        "email": "verifier@verification.example"},
        "lcaVerifier": {"name": "B. Reviewer", "organization": "Independent Verification Ltd."},
        "lcaPractitioner": {"name": "C. Analyst", "organization": "Example LCA Consulting"},
    },
}


def chiller():
    return {
        "selection": {"standard": "ISO 21930", "methods": ["TRACI 2.1", "CML-IA", "EN15804+A2/PEF"],
                      "indicatorFilter": "all", "productCategoryId": "water-cooled-chiller"},
        "dataCategoryId": "water-cooled-chiller",
        "meta": {
            "declarationNumber": "EPD-EX-0001", "issueDate": "2026-03-01", "validUntil": "2031-03-01",
            "validityPeriodText": "5 years from the date of issue", "validityYears": 5,
            "epdType": "Product specific", "scope": "Cradle-to-grave",
            "marketsOfApplicability": ["North America", "Global"], "referenceYearOfPrimaryData": 2025,
            "rangeOfDatasetVariability": "Not applicable (product specific)",
            "branding": {"primaryColor": "#1f4e79"},
        },
        **SHARED_PARTIES,
        "pcr": {
            "parts": [
                {"name": "Part A: Life Cycle Assessment Calculation Rules and Report Requirements",
                 "publisher": "UL Environment", "version": "4.0", "year": 2022},
                {"name": "Part B: Water-Cooled Chiller EPD Requirements", "publisher": "UL Environment",
                 "version": "2.0", "year": 2018},
            ],
            "reviewPanel": [{"name": "Panel Chair", "organization": "Example Review Group"},
                            {"name": "Panel Member", "organization": "Example University"}],
            "standards": [],
        },
        "lcaSetup": {
            "software": {"name": "EcoMetric", "version": "1.0"},
            "lciDatabases": [{"name": "ecoinvent", "version": "3.12 cut-off"}],
            "lciaMethods": [{"name": "TRACI", "version": "2.1"}],
            "excludedFlows": ["Capital goods and infrastructure", "Personnel-related impacts"],
        },
        "product": {
            "name": "EX-650 Water-Cooled Centrifugal Chiller",
            "tradeNames": ["EX-650"],
            "variantsText": "The product range covers 350 to 1,150 tons; the 650-ton configuration is assessed.",
            "classificationCodes": [{"system": "CSI", "code": "23 64 16.16"}, {"system": "UNSPSC", "code": "40101701"}],
            "description": "The EX-650 is a water-cooled centrifugal chiller with a two-stage compressor and "
                           "oil-free bearings, using the low-GWP refrigerant R-1233zd(E).",
            "intendedApplication": "Providing chilled water for cooling the interior of commercial buildings.",
            "images": [{"caption": "EX-650 water-cooled centrifugal chiller (illustration)",
                        "data": product_image("EX-650 chiller", "#1f4e79")}],
            "technicalData": [
                {"name": "Chilling capacity", "value": 650, "unit": "tons of refrigeration"},
                {"name": "Full-load efficiency", "value": 0.548, "unit": "kW/ton"},
                {"name": "Integrated part-load value (IPLV)", "value": 0.312, "unit": "kW/ton"},
                {"name": "Refrigerant", "value": "R-1233zd(E)"},
                {"name": "Refrigerant charge", "value": 596, "unit": "kg"},
                {"name": "Operating weight", "value": 14200, "unit": "kg"},
            ],
            "dimensions": [{"name": "Length", "value": 5.1, "unit": "m"}, {"name": "Width", "value": 2.2, "unit": "m"},
                           {"name": "Height", "value": 2.6, "unit": "m"}],
            "referenceServiceLife": {"value": 25, "unit": "years"},
            "buildingEstimatedServiceLife": {"value": 75, "unit": "years"},
            "hazardousSubstancesStatement": "No substances required to be reported as hazardous are associated "
                                            "with the production of this product.",
            "standardsAndCertifications": ["AHRI Standard 550/590 certified", "ASME Section VIII Div. 1"],
        },
        "functionalUnit": {
            "type": "functional", "description": "1 ton of chilling capacity",
            "unitLabel": "per ton of chilling capacity", "massPerUnit": {"value": 21.8, "unit": "kg/ton"},
            "referenceProductMass": {"value": 14200, "unit": "kg"},
            "referenceProductDescription": "650-ton water-cooled centrifugal chiller incl. refrigerant charge",
        },
        "materialComposition": {
            "basis": "per functional unit",
            "items": [
                {"material": "Steel", "mass": 13.6, "unit": "kg", "percentage": 62.39, "recycledContentPct": 35},
                {"material": "Copper", "mass": 3.9, "unit": "kg", "percentage": 17.89},
                {"material": "Aluminium", "mass": 1.2, "unit": "kg", "percentage": 5.50},
                {"material": "Electronics", "mass": 0.9, "unit": "kg", "percentage": 4.13},
                {"material": "Refrigerant R-1233zd(E)", "mass": 0.92, "unit": "kg", "percentage": 4.22},
                {"material": "Insulation and other", "mass": 1.28, "unit": "kg", "percentage": 5.87},
            ],
        },
        "packaging": [{"material": "Wood skids", "mass": 0.35, "unit": "kg", "disposalRoute": "Recycling"},
                      {"material": "Plastic film", "mass": 0.04, "unit": "kg", "disposalRoute": "Landfill"}],
        "manufacturing": {
            "sites": [{"id": "us", "name": "Riverton plant", "location": "Riverton, ST", "country": "USA"},
                      {"id": "cn", "name": "Coastal plant", "location": "Coastal City", "country": "China"}],
            "processDescription": "Shells and tubes are fabricated, brazed and assembled with the compressor, "
                                  "motor and controls; units are pressure tested and charged with refrigerant.",
            "energyInputs": [{"carrier": "Electricity", "amount": 44554, "unit": "kWh/year",
                              "datasetName": "market for electricity, medium voltage [US]"},
                             {"carrier": "Natural gas", "amount": 455, "unit": "MJ/year"}],
            "wastes": [{"type": "Steel scrap", "amount": 0.8, "unit": "kg", "route": "recycling"},
                       {"type": "General waste", "amount": 0.1, "unit": "kg", "route": "landfill"}],
        },
        "scenarios": {
            "A4": {"legs": [{"mode": "Truck", "vehicleType": "Flatbed truck >32 t", "fuelType": "Diesel",
                             "fuelEfficiency": "0.35 l/km", "distanceKm": 1600, "capacityUtilizationPct": 85}]},
            "A5": {"energyCarriers": [{"type": "Diesel (crane)", "amount": 4.2, "unit": "MJ"}],
                   "productLossPct": 0, "packagingWaste": [{"route": "Recycling", "amount": 0.35, "unit": "kg"},
                                                            {"route": "Landfill", "amount": 0.04, "unit": "kg"}]},
            "B1": {"description": "Direct refrigerant emissions during use are reported in B1.",
                   "directEmissions": [{"name": "R-1233zd(E) to air", "amount": 0.46, "unit": "kg"}]},
            "B2": {"description": "A 2% annual refrigerant leakage and replacement rate is assumed.", "cycles": 25,
                   "items": [{"name": "Refrigerant replacement, R-1233zd(E)", "amount": 0.46, "unit": "kg"}],
                   "directEmissions": [{"name": "Refrigerant to air", "amount": 0.46, "unit": "kg"}]},
            "B3": {"description": "Repairs are limited to minor component replacement.",
                   "items": [{"name": "Steel parts", "amount": 0.05, "unit": "kg"}]},
            "B4": {"description": "The chiller is replaced at the end of its reference service life."},
            "B5": {"description": "No refurbishment is expected within the reference service life."},
            "B6": {"annualEnergy": [{"carrier": "Electricity", "amount": 1170, "unit": "kWh/ton/year"}],
                   "lifetimeEnergy": {"amount": 87750, "unit": "kWh/ton"},
                   "perFunctionalUnit": {"amount": 87750, "unit": "kWh"},
                   "gridMix": [{"region": "US average grid", "sharePct": 100, "emissionFactor": 0.41,
                                "emissionFactorUnit": "kg CO₂e/kWh"}],
                   "calculationMethodText": "Operational energy is calculated from the IPLV and the PCR default "
                                            "load profile over the 75-year building service life."},
            "B7": {"annualWater": 0.02, "unit": "m³/ton/year"},
            "C1_C4": {"recycling": {"amount": 19.6, "unit": "kg"}, "landfill": {"amount": 1.3, "unit": "kg"},
                      "distances": {"to recycling facility": {"amount": 160, "unit": "km"}}},
        },
        "modules": [{"code": c, "status": "declared", "geography": "US" if c != "A1" else "Global"}
                    for c in CHILLER_MODS] + [{"code": "D", "status": "MND"}],
        "results": chiller_results(),
        "supplementalResults": [{
            "title": "B6 operational energy with alternative electricity grids",
            "description": "B6 results per ton of chilling capacity using alternative grid mixes.",
            "method": "TRACI 2.1", "columns": ["Global", "Europe", "China"],
            "rows": [{"indicatorCode": c, "values": {"Global": sig(35900 * s * 1.08), "Europe": sig(35900 * s * 0.71),
                                                       "China": sig(35900 * s * 1.55)}}
                     for c, s in (("GWP", 1.0), ("ODP", 2.1e-7), ("AP", 4.4e-3), ("EP", 3.9e-3), ("SFP", 6.8e-2))],
        }],
        "materialContribution": [
            {"material": "Steel", "sharePct": 48.2, "indicatorCode": "GWP"},
            {"material": "Copper", "sharePct": 21.6, "indicatorCode": "GWP"},
            {"material": "Electronics", "sharePct": 12.9, "indicatorCode": "GWP"},
            {"material": "Aluminium", "sharePct": 9.4, "indicatorCode": "GWP"},
            {"material": "Refrigerant", "sharePct": 4.1, "indicatorCode": "GWP"},
            {"material": "Other", "sharePct": 3.8, "indicatorCode": "GWP"},
        ],
        "references": [{"citation": "Example Climate Systems Inc. (2026). LCA background report for the EX-650 "
                                    "chiller (confidential)."}],
        "customSections": [{"afterSection": "interpretation", "title": "Additional environmental information",
                            "markdown": "The EX-650 uses **R-1233zd(E)**, a refrigerant with a 100-year GWP of 1.\n\n"
                                        "- Oil-free bearings remove the need for oil replacement\n"
                                        "- Variable-speed drive improves part-load efficiency"}],
    }


# ------------------------------------------------------------------ insulation (per m² at RSI = 1)

INS_MODS = ["A1", "A2", "A3", "A4", "A5", "C1", "C2", "C3", "C4", "D"]
INS_GWP = {"A1": 1.31, "A2": 0.11, "A3": 0.48, "A4": 0.08, "A5": 0.05, "C1": 0.002, "C2": 0.012, "C3": 0.0,
           "C4": 0.006, "D": -0.021}


def insulation_rows():
    rows = []
    for code, sc in A2_SCALE.items():
        if code == "GWP-biogenic":
            vals = {"A1": -0.032, "A2": 0.0, "A3": 0.004, "A4": 0.0, "A5": 0.029, "C1": 0.0, "C2": 0.0, "C3": 0.0,
                    "C4": 0.001, "D": 0.0}
        elif code in ("MFR",):
            vals = {m: 0.0 for m in INS_MODS}
            vals.update({"A5": 0.02, "C3": 0.0})
        elif code in ("SM",):
            vals = {m: 0.0 for m in INS_MODS}
            vals["A1"] = 0.21
        elif sc == 0.0:
            vals = {m: 0.0 for m in INS_MODS}
        else:
            vals = vector(INS_GWP, sc, f"ins:{code}", INS_MODS)
        rows.append({"indicatorCode": code, "values": vals})  # aggregates left to the module to compute
    return rows


def insulation():
    return {
        "selection": {"standard": "EN 15804+A2", "methods": ["EN15804+A2/PEF"], "indicatorFilter": "all",
                      "productCategoryId": "mineral-wool-insulation"},
        "dataCategoryId": "mineral-wool-insulation",
        "meta": {
            "declarationNumber": "EPD-EX-0002", "issueDate": "2026-05-15", "validUntil": "2031-05-15",
            "validityPeriodText": "5 years", "validityYears": 5, "epdType": "Manufacturer average",
            "scope": "Cradle-to-gate with options", "marketsOfApplicability": ["Europe"],
            "referenceYearOfPrimaryData": 2025, "branding": {"primaryColor": "#2f6f4f"},
        },
        "programOperator": SHARED_PARTIES["programOperator"],
        "manufacturer": {
            "name": "Example Insulation GmbH", "address": "Industriestraße 5\n00000 Musterstadt", "website":
            "https://insulation.example", "logo": logo("Example Insulation", "#2f6f4f"),
            "description": "Example Insulation GmbH produces stone and glass mineral wool for building envelopes.",
        },
        "verification": SHARED_PARTIES["verification"],
        "pcr": {"parts": [
            {"name": "EN 15804:2012+A2:2019 — Core rules for the product category of construction products",
             "publisher": "CEN", "year": 2019},
            {"name": "EN 16783:2017 — Thermal insulation products — Product category rules", "publisher": "CEN",
             "year": 2017}]},
        "lcaSetup": {"software": {"name": "EcoMetric", "version": "1.0"},
                     "lciDatabases": [{"name": "ecoinvent", "version": "3.12 cut-off"}]},
        "product": {
            "name": "EX-Rock 035 Stone Wool Slab",
            "classificationCodes": [{"system": "CPC", "code": "37990"}],
            "description": "Non-combustible stone wool slab for thermal and acoustic insulation of walls and roofs.",
            "intendedApplication": "Thermal insulation of external walls, pitched roofs and partitions.",
            "technicalData": [
                {"name": "Declared thermal conductivity λD", "value": 0.035, "unit": "W/(m·K)"},
                {"name": "Density", "value": 40, "unit": "kg/m³"},
                {"name": "Thickness for RSI = 1", "value": 35, "unit": "mm"},
                {"name": "Reaction to fire (EN 13501-1)", "value": "A1"},
            ],
            "referenceServiceLife": {"value": 50, "unit": "years"},
        },
        "functionalUnit": {"type": "declared",
                           "description": "1 m² of stone wool insulation with a thermal resistance of RSI = 1 m²·K/W",
                           "unitLabel": "per 1 m² at RSI = 1 m²·K/W", "massPerUnit": {"value": 1.4, "unit": "kg/m²"}},
        "materialComposition": {"basis": "per declared unit", "items": [
            {"material": "Stone (basalt, dolomite)", "mass": 1.19, "unit": "kg", "percentage": 85.0},
            {"material": "Recycled briquettes", "mass": 0.14, "unit": "kg", "percentage": 10.0,
             "recycledContentPct": 100},
            {"material": "Binder", "mass": 0.063, "unit": "kg", "percentage": 4.5},
            {"material": "Mineral oil", "mass": 0.007, "unit": "kg", "percentage": 0.5}]},
        "packaging": [{"material": "PE film", "mass": 0.012, "unit": "kg", "disposalRoute": "Incineration"}],
        "manufacturing": {"sites": [{"name": "Musterstadt plant", "country": "Germany"}],
                          "processDescription": "Raw stone is melted in a cupola furnace, fiberised, bound and cured.",
                          "energyInputs": [{"carrier": "Coke", "amount": 1.9, "unit": "MJ"},
                                           {"carrier": "Electricity", "amount": 0.42, "unit": "kWh"}]},
        "scenarios": {
            "A4": {"legs": [{"mode": "Truck", "vehicleType": "Lorry 16–32 t, EURO 6", "fuelType": "Diesel",
                             "distanceKm": 450, "capacityUtilizationPct": 60, "grossDensity": "40 kg/m³",
                             "volumeCapacityFactor": 1}]},
            "A5": {"productLossPct": 2, "packagingWaste": [{"route": "Incineration", "amount": 0.012, "unit": "kg"}]},
            "C1_C4": {"collectedMixed": {"amount": 1.4, "unit": "kg"}, "landfill": {"amount": 1.4, "unit": "kg"},
                      "distances": {"to landfill": {"amount": 50, "unit": "km"}}},
            "D": {"description": "Module D covers energy recovered from incineration of packaging waste in A5."},
        },
        "modules": [{"code": c, "status": "declared", "geography": "EU"} for c in INS_MODS] +
                   [{"code": f"B{i}", "status": "MND"} for i in range(1, 8)],
        "results": [{"variantId": "default", "variantLabel": "EX-Rock 035", "method": "EN15804+A2/PEF",
                     "rows": insulation_rows()}],
        "materialContribution": [
            {"material": "Stone melting (coke)", "sharePct": 54.0, "indicatorCode": "GWP-total"},
            {"material": "Binder", "sharePct": 23.5, "indicatorCode": "GWP-total"},
            {"material": "Electricity", "sharePct": 15.0, "indicatorCode": "GWP-total"},
            {"material": "Other", "sharePct": 7.5, "indicatorCode": "GWP-total"}],
    }


def minimal():
    return {
        "selection": {"methods": ["TRACI 2.1"]},
        "product": {"name": "Minimal Product"},
        "functionalUnit": {"description": "1 kg of product"},
        "results": [{"method": "TRACI 2.1", "rows": [
            {"indicatorCode": c, "values": {"A1": v, "A2": v * 0.1, "A3": v * 0.2}}
            for c, v in (("GWP", 2.1), ("ODP", 1.2e-7), ("AP", 8.0e-3), ("EP", 4.1e-3), ("SFP", 0.11))]}],
    }


if __name__ == "__main__":
    for name, fn in (("chiller", chiller), ("insulation", insulation), ("minimal", minimal)):
        (HERE / f"{name}.json").write_text(json.dumps(fn(), indent=2, ensure_ascii=False), encoding="utf-8")
        print("wrote", name)
