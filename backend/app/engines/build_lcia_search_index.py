"""
build_lcia_search_index.py
===========================
Extracts the 4-tier stacked LCIA header:
    [Methodology] -> [Category] -> [Indicator Name] -> [Unit]
from the raw ecoinvent LCIA Implementation Excel file.

Generates an optimized JSON search metadata registry:
    backend/data/lcia_search_index.json

Features:
- Canonical acronym mappings (e.g., GWP, CO2, Carbon -> Climate Change;
  ODP -> Ozone Depletion; AP -> Acidification; POCP, Smog -> Photochemical Oxidant Formation)
- Normalized methodology keys for fast fuzzy lookup
- Full inverted token search index for instant sub-millisecond querying
- PCR mandatory indicator categorization (UL 10010-4 / EN 15804)
- Both CLI script and importable Python API
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import openpyxl

# ---------------------------------------------------------------------------
# Path Configuration
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_EXCEL_PATH = REPO_ROOT / "database" / "ecoinvent_raw" / "LCIA Implementation 3.12.xlsx"
FALLBACK_EXCEL_PATHS = [
    DEFAULT_EXCEL_PATH,
    REPO_ROOT / "Cut-off Cumulative LCIA v3.12.xlsx",
    REPO_ROOT / "Ecoinvent database" / "ecoinvent 3.12_cut-off_cumulative_lcia_xlsx" / "Cut-off Cumulative LCIA v3.12.xlsx",
]

DEFAULT_OUTPUT_JSON = REPO_ROOT / "backend" / "data" / "lcia_search_index.json"

# ---------------------------------------------------------------------------
# Canonical Acronym & Concept Mappings
# ---------------------------------------------------------------------------
ACRONYM_CONCEPT_MAP: Dict[str, Dict[str, Any]] = {
    "GWP": {
        "concept": "Global Warming Potential / Climate Change",
        "synonyms": [
            "gwp", "gwp100", "gwp20", "gwp500", "gtp100", "gtp50",
            "co2", "co2e", "co2eq", "carbon", "carbon footprint",
            "global warming", "climate change", "greenhouse gas", "ghg",
            "radiative forcing", "fossil co2", "biogenic co2", "luluc"
        ],
        "target_categories": [
            "climate change", "climate change: total", "climate change: fossil",
            "climate change: biogenic", "climate change: land use and land use change"
        ],
        "target_indicator_keywords": ["gwp", "global warming", "climate change", "carbon", "gtp"]
    },
    "ODP": {
        "concept": "Ozone Depletion Potential",
        "synonyms": [
            "odp", "ozone", "ozone depletion", "cfc", "cfc-11", "stratospheric ozone", "freon", "halon"
        ],
        "target_categories": ["ozone depletion"],
        "target_indicator_keywords": ["ozone depletion", "odp"]
    },
    "AP": {
        "concept": "Acidification Potential",
        "synonyms": [
            "ap", "acidification", "acid rain", "so2", "sulfur dioxide", "accumulated exceedance", "ae"
        ],
        "target_categories": ["acidification"],
        "target_indicator_keywords": ["acidification"]
    },
    "EP": {
        "concept": "Eutrophication Potential",
        "synonyms": [
            "ep", "eutrophication", "ep-freshwater", "ep-marine", "ep-terrestrial",
            "algal bloom", "phosphorus", "nitrogen", "po4", "p-eq", "n-eq"
        ],
        "target_categories": [
            "eutrophication", "eutrophication: freshwater", "eutrophication: marine",
            "eutrophication: terrestrial", "freshwater eutrophication", "marine eutrophication"
        ],
        "target_indicator_keywords": ["eutrophication", "ep-freshwater", "ep-marine", "ep-terrestrial"]
    },
    "POCP": {
        "concept": "Photochemical Ozone Creation Potential (Smog)",
        "synonyms": [
            "pocp", "smog", "summer smog", "photochemical", "photochemical ozone",
            "photochemical oxidant", "tropospheric ozone", "oxidant formation",
            "nmvoc", "ground-level ozone"
        ],
        "target_categories": [
            "photochemical oxidant formation", "photochemical ozone", "photochemical oxidant formation: human health",
            "tropospheric ozone concentration increase"
        ],
        "target_indicator_keywords": ["photochemical", "ozone concentration", "smog", "oxidant", "tropospheric"]
    },
    "ADP": {
        "concept": "Abiotic Depletion Potential",
        "synonyms": [
            "adp", "adp-minerals", "adp-fossil", "abiotic depletion", "resource depletion",
            "metals", "minerals", "elements", "fossil fuels", "scarcity", "crustal scarcity",
            "ultimate reserves", "surplus energy"
        ],
        "target_categories": [
            "material resources: metals/minerals", "energy resources: non-renewable",
            "resources: fossils", "crustal scarcity", "abiotic depletion"
        ],
        "target_indicator_keywords": [
            "abiotic depletion", "adp", "elements", "fossil fuels", "ultimate reserves",
            "crustal scarcity", "minerals/metals"
        ]
    },
    "WDP": {
        "concept": "Water Deprivation / Scarcity",
        "synonyms": [
            "water", "water use", "water consumption", "water scarcity",
            "deprivation", "user deprivation", "wsi", "awc", "freshwater use"
        ],
        "target_categories": ["water use", "water", "water consumption"],
        "target_indicator_keywords": ["water use", "deprivation", "water consumption"]
    },
    "PM": {
        "concept": "Particulate Matter / Respiratory Inorganics",
        "synonyms": [
            "pm", "pm2.5", "pm10", "particulate", "particulate matter", "dust",
            "respiratory", "inorganics", "respiratory effects"
        ],
        "target_categories": ["respiratory inorganics", "particulate matter"],
        "target_indicator_keywords": ["particulate matter", "respiratory inorganics"]
    },
    "HTP": {
        "concept": "Human Toxicity Potential",
        "synonyms": [
            "toxicity", "human toxicity", "carcinogenic", "non-carcinogenic",
            "cancer", "usetox", "daly", "human health toxicity"
        ],
        "target_categories": [
            "human toxicity", "human toxicity: carcinogenic", "human toxicity: non-carcinogenic",
            "human toxicity, cancer", "human toxicity, non-cancer"
        ],
        "target_indicator_keywords": ["human toxicity", "carcinogenic", "non-carcinogenic", "cancer"]
    },
    "ETP": {
        "concept": "Ecotoxicity Potential",
        "synonyms": [
            "ecotoxicity", "freshwater ecotoxicity", "marine ecotoxicity",
            "terrestrial ecotoxicity", "aquatic ecotoxicity"
        ],
        "target_categories": [
            "ecotoxicity", "ecotoxicity: freshwater", "ecotoxicity: marine",
            "ecotoxicity: terrestrial", "freshwater aquatic ecotoxicity"
        ],
        "target_indicator_keywords": ["ecotoxicity", "faetp", "maetp", "tetp"]
    },
    "IRP": {
        "concept": "Ionising Radiation Potential",
        "synonyms": [
            "radiation", "ionising radiation", "ionizing radiation", "radionucleides",
            "nuclear", "u-235", "u235", "becquerel"
        ],
        "target_categories": ["ionising radiation", "radiation", "ionizing radiation"],
        "target_indicator_keywords": ["ionising radiation", "ionizing radiation", "radiation"]
    },
    "CED": {
        "concept": "Cumulative Energy Demand",
        "synonyms": [
            "ced", "primary energy", "energy demand", "renewable energy",
            "non-renewable energy", "fossil energy", "nuclear energy", "biomass energy"
        ],
        "target_categories": ["cumulative energy demand (ced)", "energy resources"],
        "target_indicator_keywords": ["energy demand", "renewable", "non-renewable"]
    },
    "CExD": {
        "concept": "Cumulative Exergy Demand",
        "synonyms": ["cexd", "exergy", "cumulative exergy demand"],
        "target_categories": ["cumulative exergy demand (cexd)"],
        "target_indicator_keywords": ["exergy"]
    },
    "LU": {
        "concept": "Land Use / Occupation / Transformation",
        "synonyms": [
            "land use", "land occupation", "soil quality", "land transformation",
            "biomass", "land occupation and transformation"
        ],
        "target_categories": ["land use", "land use: soil quality"],
        "target_indicator_keywords": ["land use", "soil", "occupation", "transformation"]
    }
}

# ---------------------------------------------------------------------------
# PCR Mandatory Indicator Keywords (UL 10010-4 / EN 15804 Core)
# ---------------------------------------------------------------------------
PCR_MANDATORY_CRITERIA = [
    # (Category Substrings, Indicator Substrings)
    ("climate change", "gwp100"),
    ("climate change", "global warming potential"),
    ("ozone depletion", "odp"),
    ("ozone depletion", "ozone depletion potential"),
    ("acidification", "accumulated exceedance"),
    ("acidification", "acidification"),
    ("eutrophication: freshwater", "fraction of nutrients"),
    ("eutrophication: marine", "fraction of nutrients"),
    ("eutrophication: terrestrial", "accumulated exceedance"),
    ("photochemical", "tropospheric ozone"),
    ("photochemical", "photochemical"),
    ("material resources: metals/minerals", "abiotic depletion"),
    ("energy resources: non-renewable", "abiotic depletion"),
    ("water use", "user deprivation"),
    ("core impact", "global warming"),
    ("core impact", "acidification"),
    ("core impact", "ozone depletion"),
]

def normalize_key(text: str) -> str:
    """Normalizes string for comparison and grouping (e.g. 'EF v3.1' -> 'efv31')."""
    cleaned = re.sub(r"v(?=\d)", "", str(text or "").lower())
    return re.sub(r"[^a-z0-9]", "", cleaned)

def tokenize(text: str) -> List[str]:
    """Tokenizes text into searchable words (length > 1)."""
    clean = re.sub(r"[^\w\s]", " ", str(text or "").lower())
    return [t for t in clean.split() if len(t) > 1]

def match_acronyms(category: str, indicator: str) -> Tuple[List[str], List[str]]:
    """Identifies matching acronyms and associated search synonyms for an indicator."""
    cat_lower = (category or "").lower()
    ind_lower = (indicator or "").lower()
    
    matched_acronyms: List[str] = []
    matched_synonyms: Set[str] = set()

    for acr, spec in ACRONYM_CONCEPT_MAP.items():
        hit = False
        # Check categories
        for tc in spec["target_categories"]:
            if tc in cat_lower:
                hit = True
                break
        
        # Check indicator keywords
        if not hit:
            for kw in spec["target_indicator_keywords"]:
                if kw in ind_lower:
                    hit = True
                    break
        
        if hit:
            matched_acronyms.append(acr)
            matched_synonyms.update(spec["synonyms"])
            matched_synonyms.add(acr.lower())

    return matched_acronyms, sorted(matched_synonyms)

def check_pcr_mandatory(category: str, indicator: str, method: str) -> bool:
    """Returns True if the indicator matches UL 10010-4 / EN 15804 mandatory criteria."""
    cat_lower = (category or "").lower()
    ind_lower = (indicator or "").lower()
    
    if "no lt" in cat_lower or "no lt" in ind_lower:
        return False
        
    for cat_sub, ind_sub in PCR_MANDATORY_CRITERIA:
        if cat_sub in cat_lower and ind_sub in ind_lower:
            return True
            
    # TRACI mandatory
    if "traci" in method.lower():
        if any(k in cat_lower for k in ["global warming", "acidification", "eutrophication", "ozone depletion", "smog"]):
            return True

    return False

def slugify(text: str) -> str:
    """Creates a deterministic slug for indicator ID."""
    s = re.sub(r"[^\w\s-]", "", str(text or "").lower())
    return re.sub(r"[-\s]+", "_", s).strip("_")

# ---------------------------------------------------------------------------
# Extraction Logic
# ---------------------------------------------------------------------------
def extract_from_excel(file_path: Path) -> List[Dict[str, str]]:
    """
    Reads either:
    1. 'Indicators' sheet: columns (Method, Category, Indicator, Indicator Unit)
    2. 'LCIA' sheet with 4 stacked header rows: (Method, Category, Indicator, Unit)
    """
    if not file_path.exists():
        raise FileNotFoundError(f"LCIA Excel file not found: {file_path}")

    print(f"Loading LCIA header definitions from: {file_path}")
    wb = openpyxl.load_workbook(str(file_path), read_only=True, data_only=True)
    sheetnames = wb.sheetnames

    raw_items: List[Dict[str, str]] = []

    if "Indicators" in sheetnames:
        print("Found 'Indicators' sheet. Reading indicator catalog rows...")
        ws = wb["Indicators"]
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row or not any(row):
                continue
            method = str(row[0] or "").strip()
            category = str(row[1] or "").strip() if len(row) > 1 else ""
            indicator = str(row[2] or "").strip() if len(row) > 2 else ""
            unit = str(row[3] or "").strip() if len(row) > 3 else ""

            if method:
                raw_items.append({
                    "method": method,
                    "category": category,
                    "indicator": indicator,
                    "unit": unit
                })
    elif "LCIA" in sheetnames or "CFs" in sheetnames:
        target_sheet = "LCIA" if "LCIA" in sheetnames else sheetnames[0]
        print(f"Reading stacked 4-tier header from '{target_sheet}' sheet...")
        ws = wb[target_sheet]
        header_rows = []
        for i, row in enumerate(ws.iter_rows(max_row=4, values_only=True)):
            header_rows.append(list(row))

        if len(header_rows) >= 4:
            methods_row = header_rows[0]
            categories_row = header_rows[1]
            indicators_row = header_rows[2]
            units_row = header_rows[3]

            num_cols = min(len(methods_row), len(categories_row), len(indicators_row), len(units_row))
            for col_idx in range(num_cols):
                method = str(methods_row[col_idx] or "").strip()
                category = str(categories_row[col_idx] or "").strip()
                indicator = str(indicators_row[col_idx] or "").strip()
                unit = str(units_row[col_idx] or "").strip()

                if method and method.upper() != "META" and method.lower() != "none":
                    raw_items.append({
                        "method": method,
                        "category": category,
                        "indicator": indicator,
                        "unit": unit
                    })
    else:
        raise ValueError(f"No suitable sheet found in {file_path}. Available sheets: {sheetnames}")

    wb.close()
    return raw_items

def build_search_registry(raw_items: List[Dict[str, str]], source_file: str) -> Dict[str, Any]:
    """Processes raw header items into a rich, structured search index."""
    seen_keys: Set[str] = set()
    indicators: List[Dict[str, Any]] = []
    methodologies: Dict[str, Dict[str, Any]] = {}
    categories_set: Set[str] = set()

    # Inverted token index: token -> list of indicator IDs
    inverted_index: Dict[str, List[str]] = {}

    for idx, item in enumerate(raw_items):
        method = item["method"]
        category = item["category"]
        indicator = item["indicator"]
        unit = item["unit"]

        # Canonical key format used across calculate_epd and ecoinvent lookups
        canonical_key = f"{method} | {category} | {indicator} [{unit}]"
        if canonical_key in seen_keys:
            continue
        seen_keys.add(canonical_key)

        method_key = normalize_key(method)
        is_no_lt = "no lt" in method.lower() or "no lt" in category.lower() or "no lt" in indicator.lower()
        is_mandatory = check_pcr_mandatory(category, indicator, method)

        # Matched acronyms & synonyms
        acronyms, synonyms = match_acronyms(category, indicator)

        # Unique indicator ID
        indicator_id = f"{method_key}__{slugify(category)}__{slugify(indicator)}"
        if is_no_lt and not indicator_id.endswith("_no_lt"):
            indicator_id += "_no_lt"

        # Ensure ID uniqueness if duplicate slugs occur
        base_id = indicator_id
        counter = 2
        while any(ind["id"] == indicator_id for ind in indicators):
            indicator_id = f"{base_id}_{counter}"
            counter += 1

        # Search tokens
        tokens: Set[str] = set()
        for text in [method, category, indicator, unit]:
            tokens.update(tokenize(text))
        tokens.update(synonyms)
        for acr in acronyms:
            tokens.add(acr.lower())

        indicator_obj = {
            "id": indicator_id,
            "methodology": method,
            "methodology_key": method_key,
            "category": category,
            "indicator": indicator,
            "unit": unit,
            "canonical_key": canonical_key,
            "is_no_lt": is_no_lt,
            "is_pcr_mandatory": is_mandatory,
            "acronyms": acronyms,
            "synonyms": synonyms,
            "search_tokens": sorted(tokens),
        }
        indicators.append(indicator_obj)

        # Grouping in methodologies
        if method not in methodologies:
            methodologies[method] = {
                "name": method,
                "key": method_key,
                "total_indicators": 0,
                "categories": set(),
                "mandatory_count": 0,
            }
        methodologies[method]["total_indicators"] += 1
        methodologies[method]["categories"].add(category)
        if is_mandatory:
            methodologies[method]["mandatory_count"] += 1

        categories_set.add(category)

        # Populate inverted index
        for tok in tokens:
            if tok not in inverted_index:
                inverted_index[tok] = []
            inverted_index[tok].append(indicator_id)

    # Format methodologies dict for JSON serialization
    serialized_methods = {}
    for m_name, m_info in sorted(methodologies.items()):
        serialized_methods[m_name] = {
            "name": m_info["name"],
            "key": m_info["key"],
            "total_indicators": m_info["total_indicators"],
            "mandatory_count": m_info["mandatory_count"],
            "categories": sorted(m_info["categories"])
        }

    # Summary
    registry = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_indicators": len(indicators),
            "total_methodologies": len(serialized_methods),
            "total_categories": len(categories_set),
            "source_file": source_file,
            "schema_version": "1.0",
        },
        "acronym_definitions": {
            acr: {
                "concept": data["concept"],
                "synonyms": data["synonyms"][:8]
            }
            for acr, data in ACRONYM_CONCEPT_MAP.items()
        },
        "methodologies": serialized_methods,
        "indicators": indicators,
        "search_index": inverted_index
    }

    return registry

# ---------------------------------------------------------------------------
# Importable Search API
# ---------------------------------------------------------------------------
_LOADED_REGISTRY: Optional[Dict[str, Any]] = None

def get_registry(json_path: Optional[Path] = None) -> Dict[str, Any]:
    """Loads the cached LCIA search registry."""
    global _LOADED_REGISTRY
    if _LOADED_REGISTRY is not None:
        return _LOADED_REGISTRY

    target_path = json_path or DEFAULT_OUTPUT_JSON
    if not target_path.exists():
        # Fallback to building if missing
        excel_path = next((p for p in FALLBACK_EXCEL_PATHS if p.exists()), None)
        if excel_path:
            raw = extract_from_excel(excel_path)
            _LOADED_REGISTRY = build_search_registry(raw, str(excel_path))
            target_path.parent.mkdir(parents=True, exist_ok=True)
            with open(target_path, "w", encoding="utf-8") as f:
                json.dump(_LOADED_REGISTRY, f, indent=2)
            return _LOADED_REGISTRY
        else:
            raise FileNotFoundError(f"Neither registry JSON nor source Excel found: {target_path}")

    with open(target_path, "r", encoding="utf-8") as f:
        _LOADED_REGISTRY = json.load(f)
    return _LOADED_REGISTRY

def search_lcia_indicators(
    query: str,
    methodology: Optional[str] = None,
    category: Optional[str] = None,
    mandatory_only: bool = False,
    include_no_lt: bool = True,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    High-performance in-memory search across all LCIA indicators.
    Matches queries against indicator name, category, unit, acronyms, and synonyms.
    """
    registry = get_registry()
    indicators = registry.get("indicators", [])

    q_clean = (query or "").strip().lower()
    q_tokens = tokenize(q_clean)
    method_norm = normalize_key(methodology) if methodology else None
    cat_norm = category.strip().lower() if category else None

    # Check if query is a known acronym (e.g. 'GWP', 'ODP', 'CO2')
    acronym_synonyms = set()
    for acr, spec in ACRONYM_CONCEPT_MAP.items():
        if q_clean == acr.lower() or q_clean in [s.lower() for s in spec["synonyms"]]:
            acronym_synonyms.update([s.lower() for s in spec["synonyms"]])
            acronym_synonyms.add(acr.lower())

    scored_results: List[Tuple[float, Dict[str, Any]]] = []

    for ind in indicators:
        # Filter by methodology
        if method_norm and ind["methodology_key"] != method_norm:
            # Also allow partial method matching
            if method_norm not in ind["methodology_key"]:
                continue

        # Filter by category
        if cat_norm and cat_norm not in ind["category"].lower():
            continue

        # Filter by mandatory
        if mandatory_only and not ind["is_pcr_mandatory"]:
            continue

        # Filter by no_lt
        if not include_no_lt and ind["is_no_lt"]:
            continue

        # Score calculation
        score = 0.0
        ind_name = ind["indicator"].lower()
        ind_cat = ind["category"].lower()
        ind_unit = ind["unit"].lower()

        if not q_tokens:
            # Empty query: return all matching the filters, prioritizing mandatory
            score = 100.0 if ind["is_pcr_mandatory"] else 10.0
            scored_results.append((score, ind))
            continue

        # Exact / Acronym matches
        for acr in ind["acronyms"]:
            if q_clean == acr.lower():
                score += 150.0

        if acronym_synonyms:
            if any(syn in ind_name or syn in ind_cat for syn in acronym_synonyms):
                score += 120.0

        # Exact substring matches
        if q_clean in ind_name:
            score += 100.0
        elif q_clean in ind_cat:
            score += 70.0
        elif q_clean in ind_unit:
            score += 40.0

        # Token matches
        matched_tokens = 0
        for tok in q_tokens:
            if tok in ind["search_tokens"]:
                matched_tokens += 1
                if tok in ind_name:
                    score += 30.0
                elif tok in ind_cat:
                    score += 20.0
                else:
                    score += 10.0

        if matched_tokens == len(q_tokens):
            score += 40.0  # Bonus for matching all tokens

        # Bonus for standard/mandatory indicators
        if ind["is_pcr_mandatory"]:
            score += 15.0

        # Slight penalty for no_lt indicators unless explicitly queried
        if ind["is_no_lt"] and "no lt" not in q_clean:
            score -= 10.0

        if score > 0:
            scored_results.append((score, ind))

    # Sort descending by score
    scored_results.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored_results[:limit]]

# ---------------------------------------------------------------------------
# CLI Execution
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Extract LCIA 4-tier headers and build search index.")
    parser.add_argument("--excel", type=str, default=str(DEFAULT_EXCEL_PATH), help="Path to LCIA Implementation Excel file.")
    parser.add_argument("--out", type=str, default=str(DEFAULT_OUTPUT_JSON), help="Output path for lcia_search_index.json.")
    args = parser.parse_args()

    excel_file = Path(args.excel)
    if not excel_file.exists():
        found = next((p for p in FALLBACK_EXCEL_PATHS if p.exists()), None)
        if found:
            excel_file = found
        else:
            print(f"Error: Excel file not found at {args.excel} or any fallback paths.")
            sys.exit(1)

    output_file = Path(args.out)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    print(f"Reading from: {excel_file}")
    raw_items = extract_from_excel(excel_file)
    print(f"Extracted {len(raw_items)} raw indicator definitions.")

    registry = build_search_registry(raw_items, str(excel_file))
    print(f"Built registry with {registry['metadata']['total_indicators']} unique indicators across {registry['metadata']['total_methodologies']} methodologies.")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)

    print(f"Successfully generated: {output_file} ({output_file.stat().st_size / 1024:.1f} KB)")

if __name__ == "__main__":
    main()
