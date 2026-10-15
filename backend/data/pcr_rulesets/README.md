# PCR rulesets

One JSON file per PCR document. Each file lists only the requirements that software can check
automatically, written so a generic rule engine can evaluate them against the EPD project payload
(before calculation), the calculation results (after calculation), or the generated EPD document.

Requirements are paraphrased, not copied, and every rule cites the section and page it came from.
Requirements that need human judgement are listed separately under `manual_checks`.

## File layout

```json
{
  "ruleset_id": "ul-10010-4-v2.0",
  "title": "UL 10010-4 Part B: Water Cooled Chiller EPD Requirements",
  "program_operator": "UL Environment",
  "document": {
    "code": "UL 10010-4",
    "version": "2.0",
    "published": "2018-06-29",
    "valid_until": "2022-06",
    "status_note": "Listed as expired on ul.com PCR list (checked 2026-10-12)",
    "source_file": "Chiller_UL-10010-4_Part-B_Water-Cooled-Chiller_v2.0_2018.pdf"
  },
  "parent_rulesets": ["ul-10010-part-a"],
  "depends_on_unavailable": ["UL 10010 Part A v3.1 (indicator tables 4-8)"],
  "product_category": "water_cooled_chiller",
  "defaults": { "<field path>": { "value": 25, "unit": "years", "source": "§2.14" } },
  "rules": [ ... ],
  "manual_checks": [ { "id": "...", "title": "...", "source": {...}, "reason": "..." } ],
  "notes": [ "free-text caveats, conflicts, errors found in the source document" ]
}
```

## Rule object

```json
{
  "id": "UL10010-4.FU.01",
  "title": "Functional unit is 1 ton of chilling capacity",
  "requirement": "Paraphrased requirement in one or two sentences.",
  "source": { "section": "3.1", "page": 10 },
  "phase": "input | results | document",
  "severity": "critical | major | minor",
  "obligation": "shall | should | may",
  "derived": false,
  "check": { "type": "<check type>", "...": "type-specific parameters" }
}
```

- `phase`: `input` runs on the project payload before calculation, `results` runs on calculation
  output, `document` runs on the rendered EPD (fields and text).
- `severity`: `critical` blocks publication, `major` must be fixed or justified, `minor` is advisory.
- `obligation`: the modal verb used by the source ("shall" = mandatory).
- `derived: true` marks checks inferred from the text rather than stated explicitly (e.g. a mass balance).
- `applies_when` (optional): an expression; the rule is skipped when it is false
  (e.g. `"'North America' in epd.markets"`).

## Check types

| type | parameters | passes when |
|---|---|---|
| `required_field` | `path` | value at `path` exists and is non-empty |
| `required_any` | `paths[]` | at least one path is non-empty |
| `equals` | `path`, `value` | value equals `value` (case-insensitive for strings) |
| `one_of` | `path`, `values[]` | value is in `values` |
| `not_one_of` | `path`, `values[]` | value is not in `values` |
| `numeric_range` | `path`, `min?`, `max?`, `unit` | number within bounds |
| `default_or_justified` | `path`, `default`, `unit`, `justification_path` | value equals default, or differs and `justification_path` is non-empty |
| `relation` | `expression`, `tolerance_pct?` | expression is true (see expression syntax) |
| `formula` | `target`, `expression`, `tolerance_pct` | `target` equals `expression` within tolerance |
| `rounding` | `path`, `rule` (`ceil_tenth`, `sig_digits:3`) | value respects the rounding rule |
| `list_min_length` | `path`, `min` | list has at least `min` items |
| `each_has_fields` | `path`, `fields[]` | every list item has all `fields` |
| `modules_required` | `modules[]` | results contain every listed module (value may be 0 if declared) |
| `modules_forbidden` | `modules[]` | results contain none of the listed modules |
| `modules_any_of` | `groups[][]` | for each group, at least one alternative is declared (e.g. `["A1-A3"]` or `["A1","A2","A3"]`) |
| `indicators_required` | `method`, `indicators[]` (`{name, unit}`), `modules`, `lcia_package?` | every indicator has a value for every listed module |
| `number_format` | `scope`, `style` (`scientific`), `significant_digits` | all reported values formatted as specified |
| `text_present` | `doc_section?`, `any_of[]` | the EPD (or section) contains one of the phrases |
| `text_forbidden` | `patterns[]` | the EPD contains none of the patterns (case-insensitive) |
| `date_rule` | `start_path`, `end_path`, `max_years` | end minus start does not exceed `max_years` |
| `data_age` | `path`, `max_years` | reference year is no older than `max_years` before date of issue |
| `cutoff` | `per_flow_pct?`, `per_module_pct?`, `total_pct?`, `basis` (`mass`, `energy`, `impact`) | excluded flows stay within the limits |

Expressions use field paths and `+ - * / ( ) <= >= == != and or not in`, plus `sum(path[].field)`,
`len()`, `abs()`, `ceil_tenth()`, `max()`, `min()`, `exists(path)`, `declared('A4')` (module is
declared in the results), literals `true`, `false`, `null` and quoted strings; a bare path on its own
means "is non-empty". Keys that are not identifiers
use brackets (`results.GWP['A1-A3']`), and list literals are written `['a', 'b']`.

`each_has_fields` applied to an object (not a list) checks that the object itself has every
field; dotted field names (`software.version`) are resolved inside the object.

## Field path vocabulary

Rules reference these canonical paths. The adapter that feeds the rule engine maps the Studio
payload onto them.

| Path | Meaning |
|---|---|
| `epd.program_operator.{name,address,website}` | Program operator |
| `epd.general_program_instructions` | GPI name and version |
| `epd.declaration_holder.{name,address}` | Declaration owner |
| `epd.declaration_number` | Registration number |
| `epd.reference_pcr.{name,version}` | PCR(s) used; may be a list holding both the parent PCR and the c-PCR |
| `epd.type` | `product-specific`, `average-product`, `industry-average`, `sector`, `representative` |
| `epd.scope` | `cradle-to-gate`, `cradle-to-gate-with-options`, `cradle-to-grave` |
| `epd.date_of_issue`, `epd.valid_until` | ISO dates |
| `epd.markets[]` | Markets / geographies of applicability |
| `epd.verification.{type,verifier,pcr_review_by,lca_by}` | `type`: `internal` / `external` |
| `epd.limitations_text` | Comparability statement |
| `lca.software.{name,version}` | LCA software |
| `lca.databases[]` | `{name, version}` |
| `lca.lcia_methods[]` | `{name, version}` |
| `lca.reference_year`, `lca.period_under_review.{start,end}` | Data period |
| `lca.data_quality` | Data-quality assessment object |
| `lca.allocation.{basis,justification}` | Allocation |
| `lca.cutoff.{description,excluded_flows[]}` | Cut-off |
| `manufacturer.{name,production_sites[]}` | Manufacturer and plants |
| `product.{name,brand,description,identification,image,sub_category,classification_codes[]}` | Product identity |
| `product.standards[]` | Product / test standards |
| `product.technical_data.<key>` | Category-specific technical data |
| `product.mass_per_unit_kg` | Mass of one declared product |
| `product.material_composition[]` | `{material, mass_kg, mass_pct, cas?, hazardous?}` |
| `product.hazardous_substances[]` | SVHC / regulated substances |
| `product.packaging[]` | `{material, mass_kg, reusable, end_of_life}` |
| `product.flow_diagram` | Process flow diagram present |
| `functional_unit.{description,value,unit}` | Functional unit |
| `declared_unit.{description,value,unit}` | Declared unit |
| `conversion_factor_to_kg` | kg per functional/declared unit |
| `rsl_years`, `esl_years` | Reference / estimated service life |
| `scenarios.<module>.<key>` | Scenario data per module (`A4`, `A5`, `B1`…`B7`, `C1`…`C4`, `D`) |
| `results.modules_declared[]` | Modules reported (`MND` excluded) |
| `results.<method>.<indicator>.<module>` | Indicator value |
| `document.sections.<name>` | Rendered EPD section text |
| `document.text` | Full rendered EPD text |
