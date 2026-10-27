"""
PCR ruleset engine: evaluates rulesets in the format documented in
data/pcr_rulesets/README.md against the canonical project payload built by
engines/pcr_payload.py. The Studio gates use the short core ruleset
(data/core_rulesets/core-epd-essentials-v1.json), the same for every product;
product-specific values such as required modules come from the product profile.

Every rule has a `phase` and is evaluated only at that point of the workflow:

    input     before calculation   (Studio step 4, PCR Rules Audit)
    results   after calculation    (Studio step 7, Pre-Audit Verification)
    document  on the rendered EPD  (Studio step 8, Export)

Each rule ends in one of these statuses:

    pass            the requirement is met
    fail            data is present and violates the requirement
    missing         data needed to check the requirement has not been provided
    not_applicable  the rule's `applies_when` condition is false
    manual          the check cannot be automated (needs a reviewer)

Only `critical` rules block. Before calculation (step 4) a critical `fail`
blocks; a critical `missing` is reported as "required before publishing",
because much of that data (EPD type, scope, verifier ...) is entered in Report
Details at export. After calculation and at publication, critical `missing`
blocks as well.
"""

import ast
import json
import math
import re
from datetime import date, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple

RULESETS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "pcr_rulesets"
# The Studio gates evaluate this short, product-independent ruleset. The detailed PCR rulesets in
# RULESETS_DIR stay loadable (load_ruleset) but are not part of the gates.
CORE_RULESET_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "core_rulesets" / "core-epd-essentials-v1.json"

PHASES = ("input", "results", "document")
PASS, FAIL, MISSING, NOT_APPLICABLE, MANUAL = "pass", "fail", "missing", "not_applicable", "manual"


class _Missing:
    """A path that does not resolve to anything in the payload."""

    def __repr__(self) -> str:
        return "MISSING"

    def __bool__(self) -> bool:
        return False


MISSING_VALUE = _Missing()


class MissingData(Exception):
    """Raised when an expression needs a value that is not in the payload."""

    def __init__(self, path: str = ""):
        super().__init__(path)
        self.path = path


class UnsupportedRule(Exception):
    """Raised when a rule cannot be evaluated automatically."""


# ---------------------------------------------------------------------------
# Ruleset loading
# ---------------------------------------------------------------------------

@lru_cache(maxsize=None)
def load_ruleset(ruleset_id: str) -> Optional[Dict[str, Any]]:
    for f in RULESETS_DIR.glob("*.json"):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if data.get("ruleset_id") == ruleset_id or f.stem == ruleset_id:
            return data
    return None


@lru_cache(maxsize=None)
def load_core_ruleset() -> Dict[str, Any]:
    return json.loads(CORE_RULESET_PATH.read_text(encoding="utf-8"))


# ---------------------------------------------------------------------------
# Values and paths
# ---------------------------------------------------------------------------

def is_present(v: Any) -> bool:
    if v is MISSING_VALUE or v is None:
        return False
    if isinstance(v, str):
        return v.strip() != ""
    if isinstance(v, (list, tuple, dict)):
        return len(v) > 0
    return True


def to_number(v: Any) -> Optional[float]:
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v) if math.isfinite(v) else None
    if isinstance(v, str):
        try:
            return float(v.replace(",", "").strip())
        except ValueError:
            return None
    return None


def _norm(s: Any) -> str:
    return str(s).strip().lower()


def _lookup_key(obj: Any, key: str) -> Any:
    """obj[key] for dicts (case-insensitive fallback); for lists of {system, code} records, the matching code."""
    if isinstance(obj, dict):
        if key in obj:
            return obj[key]
        for k, v in obj.items():
            if _norm(k) == _norm(key):
                return v
        return MISSING_VALUE
    if isinstance(obj, list):
        records = [item for item in obj if isinstance(item, dict)]
        for item in records:
            tag = item.get("system") or item.get("scheme") or item.get("type") or item.get("name")
            if tag is not None and _norm(tag) == _norm(key):
                return item.get("code", item.get("value", item))
        # A field of a list of records ('reference_pcr.version'): present only if every record has it.
        if records and any(key in item for item in records):
            vals = [item.get(key) for item in records]
            return vals if all(is_present(v) for v in vals) else MISSING_VALUE
    return MISSING_VALUE


EACH = "[]"


def split_path(path: str) -> List[str]:
    """'a.b[]' -> ['a', 'b', '[]'];  "r.GWP['A1-A3']" / 'p.codes[csi]' -> [..., 'A1-A3'] / [..., 'csi']."""
    segs: List[str] = []
    for part in path.split("."):
        m = re.match(r"^([^\[]*)((?:\[[^\]]*\])*)$", part)
        if not m:
            segs.append(part)
            continue
        if m.group(1):
            segs.append(m.group(1))
        for b in re.findall(r"\[([^\]]*)\]", m.group(2)):
            segs.append(EACH if b == "" else b.strip("'\""))
    return segs


def resolve_segments(obj: Any, segs: List[str]) -> Any:
    for i, seg in enumerate(segs):
        if obj is MISSING_VALUE or obj is None:
            return MISSING_VALUE
        if seg == EACH:
            if not isinstance(obj, list):
                return MISSING_VALUE
            rest = segs[i + 1:]
            if not rest:
                return obj
            out = []
            for item in obj:
                v = resolve_segments(item, rest)
                if isinstance(v, list) and EACH in rest:
                    out.extend(v)
                elif v is not MISSING_VALUE:
                    out.append(v)
            return out
        obj = _lookup_key(obj, seg)
    return obj


def resolve(payload: Dict[str, Any], path: str) -> Any:
    return resolve_segments(payload, split_path(path))


# ---------------------------------------------------------------------------
# Expression evaluation (safe subset of Python syntax, see README)
# ---------------------------------------------------------------------------

_STRING_RE = re.compile(r"('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")")
_LITERALS = {"true": "True", "false": "False", "null": "None"}


def _to_python(expr: str) -> str:
    parts = _STRING_RE.split(expr)
    for i in range(0, len(parts), 2):  # even indexes are outside string literals
        p = re.sub(r"\b(true|false|null)\b", lambda m: _LITERALS[m.group(1)], parts[i])
        parts[i] = p.replace("[]", ".__each__")
    return "".join(parts)


@lru_cache(maxsize=None)
def _parse(expr: str) -> ast.Expression:
    try:
        return ast.parse(_to_python(expr), mode="eval")
    except SyntaxError as e:
        raise UnsupportedRule(f"Expression cannot be parsed: {expr}") from e


def _ceil_tenth(x: float) -> float:
    return math.ceil(round(x * 10, 9)) / 10


class Evaluator:
    def __init__(self, payload: Dict[str, Any]):
        self.payload = payload

    def eval(self, expr: str) -> Any:
        return self._eval(_parse(expr).body)

    def truthy(self, expr: str) -> bool:
        return self._truth(self.eval(expr))

    # -- helpers
    @staticmethod
    def _truth(v: Any) -> bool:
        if isinstance(v, bool):
            return v
        return is_present(v) and v != 0

    def _path_segments(self, node: ast.AST) -> Optional[List[str]]:
        if isinstance(node, ast.Name):
            return [node.id]
        if isinstance(node, ast.Attribute):
            base = self._path_segments(node.value)
            return None if base is None else base + [EACH if node.attr == "__each__" else node.attr]
        if isinstance(node, ast.Subscript):
            base = self._path_segments(node.value)
            key = node.slice
            if base is None or not isinstance(key, ast.Constant):
                return None
            return base + [str(key.value)]
        return None

    def _num(self, v: Any, node: ast.AST) -> float:
        n = to_number(v)
        if n is None:
            raise MissingData(ast.unparse(node))
        return n

    # -- node evaluation
    def _eval(self, node: ast.AST) -> Any:
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.List):
            return [self._eval(e) for e in node.elts]
        if isinstance(node, (ast.Name, ast.Attribute, ast.Subscript)):
            segs = self._path_segments(node)
            if segs is None:
                raise UnsupportedRule(f"Unsupported reference: {ast.unparse(node)}")
            if segs in (["True"], ["False"], ["None"]):
                return {"True": True, "False": False, "None": None}[segs[0]]
            return resolve_segments(self.payload, segs)
        if isinstance(node, ast.BoolOp):
            if isinstance(node.op, ast.And):
                return all(self._truth(self._eval(v)) for v in node.values)
            return any(self._truth(self._eval(v)) for v in node.values)
        if isinstance(node, ast.UnaryOp):
            if isinstance(node.op, ast.Not):
                return not self._truth(self._eval(node.operand))
            v = self._num(self._eval(node.operand), node.operand)
            return -v if isinstance(node.op, ast.USub) else v
        if isinstance(node, ast.BinOp):
            a = self._num(self._eval(node.left), node.left)
            b = self._num(self._eval(node.right), node.right)
            ops: Dict[type, Callable[[float, float], float]] = {
                ast.Add: lambda x, y: x + y, ast.Sub: lambda x, y: x - y,
                ast.Mult: lambda x, y: x * y, ast.Div: lambda x, y: x / y,
            }
            fn = ops.get(type(node.op))
            if not fn:
                raise UnsupportedRule(f"Unsupported operator in {ast.unparse(node)}")
            try:
                return fn(a, b)
            except ZeroDivisionError:
                raise MissingData(ast.unparse(node.right))
        if isinstance(node, ast.Compare):
            left = self._eval(node.left)
            for op, comp in zip(node.ops, node.comparators):
                right = self._eval(comp)
                if not self._compare(op, left, right, node):
                    return False
                left = right
            return True
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            return self._call(node.func.id, node.args)
        raise UnsupportedRule(f"Unsupported expression: {ast.unparse(node)}")

    def _compare(self, op: ast.cmpop, a: Any, b: Any, node: ast.AST) -> bool:
        a = None if a is MISSING_VALUE else a
        b = None if b is MISSING_VALUE else b
        if isinstance(op, (ast.In, ast.NotIn)):
            hay = b if isinstance(b, (list, tuple, str)) else []
            if isinstance(hay, str):
                hit = a is not None and _norm(a) in _norm(hay)
            else:
                hit = a is not None and any(_norm(a) == _norm(x) for x in hay)
            return hit if isinstance(op, ast.In) else not hit
        if isinstance(op, (ast.Eq, ast.NotEq)):
            eq = self._equal(a, b)
            return eq if isinstance(op, ast.Eq) else not eq
        if a is None or b is None:
            raise MissingData(ast.unparse(node))
        na, nb = to_number(a), to_number(b)
        if na is not None and nb is not None:
            a, b = na, nb
        else:
            a, b = str(a), str(b)
        return {ast.Lt: a < b, ast.LtE: a <= b, ast.Gt: a > b, ast.GtE: a >= b}[type(op)]

    @staticmethod
    def _equal(a: Any, b: Any) -> bool:
        if a is None or b is None:
            return a is None and b is None
        if isinstance(a, bool) or isinstance(b, bool):
            return a is b or (isinstance(a, bool) and isinstance(b, bool) and a == b)
        na, nb = to_number(a), to_number(b)
        if na is not None and nb is not None:
            return math.isclose(na, nb, rel_tol=1e-9, abs_tol=1e-9)
        return _norm(a) == _norm(b)

    def _call(self, name: str, args: List[ast.AST]) -> Any:
        if name == "exists":
            return is_present(self._eval(args[0]))
        if name == "declared":
            mod = str(self._eval(args[0])).upper()
            return mod in {m.upper() for m in (resolve(self.payload, "results.modules_declared") or [])
                           if isinstance(m, str)}
        vals = [self._eval(a) for a in args]
        if name == "len":
            v = vals[0]
            return len(v) if isinstance(v, (list, tuple, dict, str)) else 0
        if name == "sum":
            items = vals[0]
            if not isinstance(items, list) or not items:
                raise MissingData(ast.unparse(args[0]))
            return sum(self._num(x, args[0]) for x in items)
        if name in ("abs", "ceil_tenth"):
            x = self._num(vals[0], args[0])
            return abs(x) if name == "abs" else _ceil_tenth(x)
        if name in ("max", "min"):
            nums = [self._num(v, a) for v, a in zip(vals, args)]
            return max(nums) if name == "max" else min(nums)
        raise UnsupportedRule(f"Unknown function {name}()")


# ---------------------------------------------------------------------------
# Check types
# ---------------------------------------------------------------------------

Result = Tuple[str, str]  # (status, message)


def _fmt(v: Any) -> str:
    if isinstance(v, float):
        return f"{v:.6g}"
    if isinstance(v, list):
        return ", ".join(_fmt(x) for x in v[:6]) + (" ..." if len(v) > 6 else "")
    return str(v)


def _value(payload, path) -> Any:
    return resolve(payload, path)


def _need(payload, path) -> Any:
    v = _value(payload, path)
    if not is_present(v):
        raise MissingData(path)
    return v


def check_required_field(c, p, ev) -> Result:
    v = _value(p, c["path"])
    return (PASS, f"{c['path']} = {_fmt(v)}") if is_present(v) else (MISSING, f"{c['path']} is not provided.")


def check_required_any(c, p, ev) -> Result:
    hits = [path for path in c["paths"] if is_present(_value(p, path))]
    if hits:
        return PASS, f"Provided: {', '.join(hits)}"
    return MISSING, f"None of {', '.join(c['paths'])} is provided."


def check_equals(c, p, ev) -> Result:
    v = _need(p, c["path"])
    ok = Evaluator._equal(v, c["value"])
    return (PASS if ok else FAIL), f"{c['path']} is {_fmt(v)} (required: {_fmt(c['value'])})."


def check_one_of(c, p, ev) -> Result:
    v = _need(p, c["path"])
    # A list value (e.g. several B6 reference cities) passes when every entry is allowed.
    bad = [x for x in (v if isinstance(v, list) else [v]) if not any(Evaluator._equal(x, a) for a in c["values"])]
    if bad:
        return FAIL, f"{c['path']}: {_fmt(bad)} not allowed (allowed: {_fmt(c['values'])})."
    return PASS, f"{c['path']} is {_fmt(v)}."


def check_not_one_of(c, p, ev) -> Result:
    v = _need(p, c["path"])
    bad = [x for x in (v if isinstance(v, list) else [v]) if any(Evaluator._equal(x, a) for a in c["values"])]
    if bad:
        return FAIL, f"{c['path']}: {_fmt(bad)} is not allowed."
    return PASS, f"{c['path']} is {_fmt(v)} (not one of: {_fmt(c['values'])})."


def check_numeric_range(c, p, ev) -> Result:
    v = to_number(_need(p, c["path"]))
    if v is None:
        return FAIL, f"{c['path']} is not a number."
    lo, hi = c.get("min"), c.get("max")
    ok = (lo is None or v >= lo) and (hi is None or v <= hi)
    bounds = " and ".join(x for x in (f">= {lo}" if lo is not None else "", f"<= {hi}" if hi is not None else "") if x)
    return (PASS if ok else FAIL), f"{c['path']} = {_fmt(v)} {c.get('unit', '')} (required {bounds})."


def check_default_or_justified(c, p, ev) -> Result:
    v = _need(p, c["path"])
    unit = c.get("unit", "")
    if Evaluator._equal(v, c["default"]):
        return PASS, f"{c['path']} uses the PCR default ({_fmt(c['default'])} {unit})."
    if is_present(_value(p, c["justification_path"])):
        return PASS, f"{c['path']} = {_fmt(v)} {unit} differs from the default and is justified."
    return FAIL, (f"{c['path']} = {_fmt(v)} {unit} differs from the PCR default ({_fmt(c['default'])} {unit}) "
                  f"and no justification is given ({c['justification_path']}).")


def check_relation(c, p, ev) -> Result:
    ok = ev.truthy(c["expression"])
    return (PASS if ok else FAIL), f"{c['expression']} → {'true' if ok else 'false'}"


def check_formula(c, p, ev) -> Result:
    target = to_number(_need(p, c["target"]))
    if target is None:
        return FAIL, f"{c['target']} is not a number."
    expected = ev._num(ev.eval(c["expression"]), _parse(c["expression"]).body)
    tol = float(c.get("tolerance_pct", 0))
    diff = abs(target - expected)
    ok = diff <= abs(expected) * tol / 100 if expected else diff <= 1e-9
    return (PASS if ok else FAIL), (f"{c['target']} = {_fmt(target)}, expected {_fmt(expected)} "
                                    f"from {c['expression']} (tolerance {tol:g}%).")


def _sig_digits_ok(x: float, n: int) -> bool:
    if x == 0:
        return True
    return math.isclose(x, float(f"{x:.{n}g}"), rel_tol=1e-12, abs_tol=0)


def check_rounding(c, p, ev) -> Result:
    rule = c["rule"]
    vals = _need(p, c["path"])
    nums = [to_number(v) for v in (vals if isinstance(vals, list) else [vals])]
    nums = [n for n in nums if n is not None]
    if not nums:
        raise MissingData(c["path"])
    if rule == "ceil_tenth":
        bad = [n for n in nums if not math.isclose(n, _ceil_tenth(n), abs_tol=1e-9)]
        return (FAIL, f"{c['path']} = {_fmt(bad)} is not rounded up to the nearest tenth "
                      f"(expected {_fmt([_ceil_tenth(b) for b in bad])}).") if bad else \
               (PASS, f"{c['path']} = {_fmt(nums)} is rounded to the nearest tenth.")
    m = re.match(r"sig_digits:(\d+)", rule)
    if m:
        n = int(m.group(1))
        bad = [x for x in nums if not _sig_digits_ok(x, n)]
        return (FAIL, f"{len(bad)} value(s) at {c['path']} have more than {n} significant digits.") if bad else \
               (PASS, f"All values at {c['path']} have at most {n} significant digits.")
    raise UnsupportedRule(f"Unknown rounding rule '{rule}'")


def check_list_min_length(c, p, ev) -> Result:
    path = c["path"][:-2] if c["path"].endswith("[]") else c["path"]
    v = _value(p, path)
    if not is_present(v):
        return MISSING, f"{path} is not provided."
    n = len(v) if isinstance(v, (list, tuple)) else 1
    return (PASS if n >= c["min"] else FAIL), f"{path} has {n} item(s) (minimum {c['min']})."


def _has_field(obj: Any, field: str) -> bool:
    return is_present(resolve_segments(obj, split_path(field)))


def check_each_has_fields(c, p, ev) -> Result:
    path = c["path"][:-2] if c["path"].endswith("[]") else c["path"]
    v = _value(p, path)
    if not is_present(v):
        return MISSING, f"{path} is not provided."
    items = v if isinstance(v, list) else [v]
    gaps = sorted({f for it in items for f in c["fields"] if not _has_field(it, f)})
    if gaps:
        return MISSING, f"{path} is missing: {', '.join(gaps)}."
    return PASS, f"{path} has all required fields ({', '.join(c['fields'])})."


def _declared_modules(p) -> List[str]:
    mods = _value(p, "results.modules_declared")
    if not isinstance(mods, list):
        raise MissingData("results.modules_declared")
    return [str(m).upper() for m in mods]


def _rule_modules(c, p) -> List[str]:
    """Literal `modules`, or `modules_path` pointing at a list in the payload (e.g. the product profile)."""
    if "modules" in c:
        return c["modules"]
    mods = _value(p, c["modules_path"])
    return mods if isinstance(mods, list) else []


def check_modules_required(c, p, ev) -> Result:
    declared = set(_declared_modules(p))
    required = _rule_modules(c, p)
    if not required:
        return PASS, "No specific modules are required for this product."
    missing = [m for m in required if m.upper() not in declared]
    if missing:
        return FAIL, f"Module(s) not declared: {', '.join(missing)}."
    return PASS, f"All required modules declared ({', '.join(required)})."


def check_modules_forbidden(c, p, ev) -> Result:
    declared = set(_declared_modules(p))
    forbidden = _rule_modules(c, p)
    if not forbidden:
        return PASS, "No modules are disallowed for this product."
    present = [m for m in forbidden if m.upper() in declared]
    if present:
        return FAIL, f"Module(s) declared but not allowed: {', '.join(present)}."
    return PASS, f"None of the disallowed modules are declared ({', '.join(forbidden)})."


def check_modules_any_of(c, p, ev) -> Result:
    declared = set(_declared_modules(p))
    for group in c["groups"]:
        if all(m.upper() in declared for m in group):
            return PASS, f"Declared as {', '.join(group)}."
    return FAIL, "None of the alternatives is declared: " + " or ".join("(" + ", ".join(g) + ")" for g in c["groups"])


def check_indicators_required(c, p, ev) -> Result:
    method = c["method"]
    table = _value(p, f"results.{method}") if "." not in method else MISSING_VALUE
    if not isinstance(table, dict):
        table = _lookup_key(_value(p, "results") or {}, method)
    if not isinstance(table, dict):
        return MISSING, f"No {method} results were calculated."
    mods = c["modules"]
    modules = _declared_modules(p) if isinstance(mods, str) else list(mods)
    gaps = []
    for ind in c["indicators"]:
        name = ind["name"] if isinstance(ind, dict) else ind
        row = _lookup_key(table, name)
        if not isinstance(row, dict):
            gaps.append(name)
            continue
        missing_mods = [m for m in modules if to_number(_lookup_key(row, m)) is None]
        if missing_mods:
            gaps.append(f"{name} ({', '.join(missing_mods)})")
    if gaps:
        return FAIL, f"{method}: no value for {', '.join(gaps)}."
    return PASS, f"{method}: all {len(c['indicators'])} indicator(s) reported for every declared module."


def _parse_date(v: Any) -> Optional[date]:
    if isinstance(v, date):
        return v
    if v is None or v is MISSING_VALUE:
        return None
    s = str(v).strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d.%m.%Y", "%d/%m/%Y", "%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def check_date_rule(c, p, ev) -> Result:
    start, end = _parse_date(_need(p, c["start_path"])), _parse_date(_need(p, c["end_path"]))
    if not start or not end:
        return FAIL, f"{c['start_path']} / {c['end_path']} are not valid dates."
    years = (end - start).days / 365.25
    ok = years <= c["max_years"] + 1 / 365.25
    return (PASS if ok else FAIL), f"{start.isoformat()} → {end.isoformat()} is {years:.2f} years (max {c['max_years']})."


def check_data_age(c, p, ev) -> Result:
    vals = _need(p, c["path"])
    years = []
    for v in (vals if isinstance(vals, list) else [vals]):
        d = _parse_date(v) if not isinstance(v, (int, float)) else None
        y = d.year if d else to_number(v)
        if y is not None:
            years.append(int(y))
    if not years:
        raise MissingData(c["path"])
    issue = _parse_date(_value(p, "epd.date_of_issue")) or date.today()
    oldest = min(years)
    age = issue.year - oldest
    ok = age <= c["max_years"]
    return (PASS if ok else FAIL), f"{c['path']}: {oldest} is {age} year(s) before {issue.year} (max {c['max_years']})."


def check_cutoff(c, p, ev) -> Result:
    basis = c.get("basis", "mass")
    flows = _value(p, "lca.cutoff.excluded_flows")
    if not isinstance(flows, list):
        raise MissingData("lca.cutoff.excluded_flows")
    key = {"mass": "mass_pct", "energy": "energy_pct", "impact": "impact_pct"}[basis]
    shares = [(f.get("name", "flow"), to_number(f.get(key)), f.get("module") or "A1-A3") for f in flows]
    if any(s is None for _, s, _ in shares):
        return MANUAL, f"Excluded flows have no {basis}-based share; check the {basis} cut-off manually."
    problems = []
    if c.get("per_flow_pct") is not None:
        problems += [f"{n} ({s:.2f}%)" for n, s, _ in shares if s > c["per_flow_pct"]]
    per_module: Dict[str, float] = {}
    for _, s, m in shares:
        per_module[m] = per_module.get(m, 0.0) + s
    if c.get("per_module_pct") is not None:
        problems += [f"module {m} total {s:.2f}%" for m, s in per_module.items() if s > c["per_module_pct"]]
    total = sum(s for _, s, _ in shares)
    if c.get("total_pct") is not None and total > c["total_pct"]:
        problems.append(f"total {total:.2f}%")
    limits = ", ".join(f"{k.replace('_pct', '').replace('_', ' ')} ≤ {c[k]}%"
                       for k in ("per_flow_pct", "per_module_pct", "total_pct") if c.get(k) is not None)
    if problems:
        return FAIL, f"Excluded flows exceed the {basis} cut-off ({limits}): {', '.join(problems)}."
    return PASS, f"{len(shares)} excluded flow(s), {total:.2f}% of {basis} in total ({limits})."


def _doc_text(p, section: Optional[str] = None) -> str:
    if section:
        t = _value(p, f"document.sections.{section}")
        if not is_present(t):
            t = _value(p, "document.text")
    else:
        t = _value(p, "document.text")
    if not is_present(t):
        raise MissingData("document.text")
    return re.sub(r"\s+", " ", str(t)).lower()


def check_text_present(c, p, ev) -> Result:
    text = _doc_text(p, c.get("doc_section"))
    hit = next((s for s in c["any_of"] if re.sub(r"\s+", " ", s.lower()) in text), None)
    if hit:
        return PASS, f"The EPD contains “{hit}”."
    return FAIL, "The EPD does not contain any of: " + "; ".join(f"“{s}”" for s in c["any_of"])


def check_text_forbidden(c, p, ev) -> Result:
    text = _doc_text(p)
    hits = [s for s in c["patterns"] if s.lower() in text]
    if hits:
        return FAIL, "The EPD contains disallowed wording: " + ", ".join(f"“{h}”" for h in hits)
    return PASS, "No disallowed wording found."


def check_none_listed(c, p, ev) -> Result:
    items = _value(p, c["path"])
    if not isinstance(items, list):
        raise MissingData(c["path"])
    if items:
        return FAIL, f"{c.get('label', c['path'])}: {_fmt(items)}."
    return PASS, "None missing."


def check_number_format(c, p, ev) -> Result:
    raise UnsupportedRule("Number formatting of the result tables must be checked on the rendered EPD.")


CHECKS: Dict[str, Callable[[Dict[str, Any], Dict[str, Any], Evaluator], Result]] = {
    "required_field": check_required_field,
    "required_any": check_required_any,
    "equals": check_equals,
    "one_of": check_one_of,
    "not_one_of": check_not_one_of,
    "numeric_range": check_numeric_range,
    "default_or_justified": check_default_or_justified,
    "relation": check_relation,
    "formula": check_formula,
    "rounding": check_rounding,
    "list_min_length": check_list_min_length,
    "each_has_fields": check_each_has_fields,
    "modules_required": check_modules_required,
    "modules_forbidden": check_modules_forbidden,
    "modules_any_of": check_modules_any_of,
    "indicators_required": check_indicators_required,
    "date_rule": check_date_rule,
    "data_age": check_data_age,
    "cutoff": check_cutoff,
    "text_present": check_text_present,
    "text_forbidden": check_text_forbidden,
    "number_format": check_number_format,
    "none_listed": check_none_listed,
}


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------

def evaluate_rule(rule: Dict[str, Any], payload: Dict[str, Any], ev: Evaluator) -> Tuple[str, str]:
    when = rule.get("applies_when")
    if when:
        try:
            if not ev.truthy(when):
                return NOT_APPLICABLE, f"Not applicable ({when} is false)."
        except MissingData:
            return NOT_APPLICABLE, f"Not applicable ({when} cannot be established from the project data)."
        except UnsupportedRule as e:
            return MANUAL, str(e)
    check = rule.get("check") or {}
    fn = CHECKS.get(check.get("type"))
    if not fn:
        return MANUAL, f"Check type '{check.get('type')}' is not automated."
    try:
        return fn(check, payload, ev)
    except MissingData as e:
        return MISSING, f"Data needed for this check is not provided ({e.path})." if e.path else \
            "Data needed for this check is not provided."
    except UnsupportedRule as e:
        return MANUAL, str(e)


def is_blocking(severity: str, status: str, block_on_missing: bool = True) -> bool:
    if severity != "critical":
        return False
    return status == FAIL or (block_on_missing and status == MISSING)


def _check_record(rule: Dict[str, Any], ruleset_id: str, status: str, message: str,
                  block_on_missing: bool) -> Dict[str, Any]:
    severity = rule.get("severity", "minor")
    return {
        "id": rule["id"],
        "ruleset_id": ruleset_id,
        "title": rule.get("title"),
        "requirement": rule.get("requirement"),
        "source": rule.get("source"),
        "severity": severity,
        "obligation": rule.get("obligation"),
        "derived": bool(rule.get("derived")),
        "status": status,
        "message": message,
        "blocking": is_blocking(severity, status, block_on_missing),
        "required_before_publish": severity == "critical" and status == MISSING,
    }


def calculation_prerequisites(extracted_data: Dict[str, Any]) -> List[Tuple[Dict[str, Any], str, str]]:
    """Studio checks the calculation itself depends on (not PCR clauses): (rule, status, message)."""
    bom = (extracted_data or {}).get("bom") or []
    masses = [to_number(b.get("mass", b.get("mass_kg"))) or 0.0 for b in bom]
    total = sum(masses)
    out = []

    rule = {"id": "STUDIO.BOM", "title": "Bill of materials declared", "severity": "critical", "obligation": "shall",
            "requirement": "The calculation needs at least one BOM line with a mass.",
            "source": {"section": "Studio calculation input"}}
    out.append((rule, PASS, f"{len(bom)} BOM line(s), {total:,.1f} kg in total.") if total > 0 else
               (rule, FAIL, "No BOM lines with a mass have been entered."))

    rule = {"id": "STUDIO.MAPPING", "title": "BOM lines mapped to background datasets", "severity": "critical",
            "obligation": "shall", "source": {"section": "ISO 21930:2017 §7.1.8 (cut-off ≤ 5 % of mass)"},
            "requirement": "BOM lines without an ecoinvent dataset contribute nothing to the results; "
                           "together they may not exceed 5 % of product mass."}
    if total > 0:
        unmapped = [(b.get("name") or b.get("material") or "Material", m) for b, m in zip(bom, masses)
                    if not (b.get("provider_id") or b.get("ecoinvent_id") or b.get("ef_id"))]
        share = sum(m for _, m in unmapped) / total * 100
        if not unmapped:
            out.append((rule, PASS, "Every BOM line has a background dataset."))
        else:
            names = ", ".join(n for n, _ in unmapped[:5])
            out.append((rule, PASS if share <= 5 else FAIL,
                        f"{len(unmapped)} unmapped line(s) = {share:.2f}% of mass ({names})."))

    mf = (extracted_data or {}).get("manufacturing") or {}
    rule = {"id": "STUDIO.A3_ENERGY", "title": "Manufacturing energy declared (A3)", "severity": "critical",
            "obligation": "shall", "source": {"section": "EN 15804+A2 §6.3.5 / ISO 21930 §7.2"},
            "requirement": "Plant electricity or fuel use must be entered for module A3."}
    has_energy = (to_number(mf.get("annual_facility_kwh")) or 0) > 0 or (to_number(mf.get("natural_gas_mj")) or 0) > 0
    out.append((rule, PASS, f"Electricity {mf.get('annual_facility_kwh') or 0} kWh/yr, "
                            f"natural gas {mf.get('natural_gas_mj') or 0} MJ/yr.") if has_energy else
               (rule, MISSING, "No manufacturing electricity or fuel use has been entered."))
    return out


def evaluate_phase(payload: Dict[str, Any], product_id: Optional[str], phase: str, *,
                   block_on_missing: bool = True,
                   prerequisites: Optional[List[Tuple[Dict[str, Any], str, str]]] = None) -> Dict[str, Any]:
    """Runs every rule of `phase` from the product's rulesets and returns a report."""
    if phase not in PHASES:
        raise ValueError(f"Unknown phase '{phase}'")
    from app.products import get_product

    product = get_product(product_id)
    rulesets, missing_ids = [load_core_ruleset()], []
    ev = Evaluator(payload)
    # Calculation prerequisites always block when they are not met.
    checks: List[Dict[str, Any]] = [
        _check_record(rule, "studio", status, message, True) for rule, status, message in (prerequisites or [])
    ]
    for rs in rulesets:
        for rule in rs.get("rules", []):
            if rule.get("phase") != phase:
                continue
            status, message = evaluate_rule(rule, payload, ev)
            checks.append(_check_record(rule, rs["ruleset_id"], status, message, block_on_missing))
    return build_report(phase, product, rulesets, missing_ids, checks)


def build_report(phase: str, product: Dict[str, Any], rulesets: Iterable[Dict[str, Any]],
                 missing_ids: List[str], checks: List[Dict[str, Any]]) -> Dict[str, Any]:
    counts = {s: sum(1 for c in checks if c["status"] == s) for s in (PASS, FAIL, MISSING, NOT_APPLICABLE, MANUAL)}
    blocking = [c for c in checks if c["blocking"]]
    return {
        "phase": phase,
        "product_category": product["id"],
        "pcr_label": product["pcr"]["label"],
        "rulesets": [{"id": rs["ruleset_id"], "title": rs.get("title"), "program_operator": rs.get("program_operator"),
                      "version": (rs.get("document") or {}).get("version"),
                      "depends_on_unavailable": rs.get("depends_on_unavailable", []),
                      "manual_checks": rs.get("manual_checks", []) if phase == "document" else []}
                     for rs in rulesets],
        "missing_rulesets": missing_ids,
        "checks": checks,
        "summary": {"total": len(checks), **counts, "blocking": len(blocking),
                    "required_before_publish": sum(1 for c in checks if c["required_before_publish"])},
        "passed": len(blocking) == 0 and len(checks) > 0,
        "run_at": datetime.now().isoformat(),
    }
