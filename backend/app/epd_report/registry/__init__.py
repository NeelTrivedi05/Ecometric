"""
Indicator registry: LCIA methods and standards, resolved by id or alias.

    reg = get_registry()
    m = reg.method("TRACI 2.1")              # by alias
    ind = reg.indicator("traci-2.1", "GWP")  # name, unit, group, flags, footnotes
"""

from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from .loader import load_entries, norm_key

_HERE = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Indicator:
    method_id: str
    code: str
    name: str
    short_name: str
    category: str
    unit: Optional[str]
    group: str
    mandatory: bool
    core: bool
    footnotes: tuple
    definition_key: Optional[str]
    aliases: tuple
    order: int


@dataclass
class Method:
    id: str
    name: str
    version: Optional[str]
    aliases: List[str]
    groups: List[Dict[str, str]]
    indicators: List[Indicator]
    footnotes: Dict[str, str]
    group_footnotes: Dict[str, List[str]]
    references: List[Dict[str, str]]
    primary_indicator: Optional[str]
    ecoinvent_labels: Dict[str, str]
    raw: Dict[str, Any] = field(repr=False, default_factory=dict)

    def indicator(self, code: str) -> Optional[Indicator]:
        k = norm_key(code)
        for ind in self.indicators:
            if norm_key(ind.code) == k:
                return ind
        return None

    def group_title(self, group_id: str) -> str:
        for g in self.groups:
            if g["id"] == group_id:
                return g.get("title", group_id)
        return group_id

    def group_ids(self) -> List[str]:
        return [g["id"] for g in self.groups]

    def match_raw_key(self, raw: str) -> Optional[Indicator]:
        """Maps a raw calculation key ('category | indicator', category, or code) to an indicator."""
        candidates = [raw]
        if "|" in raw:
            parts = [p.strip() for p in raw.split("|")]
            # 'Methodology | Category | Indicator [unit]' form
            if len(parts) >= 3:
                parts = parts[1:]
            parts = [p.split("[")[0].strip() for p in parts]
            candidates = [" | ".join(parts)] + parts
        for cand in candidates:
            k = norm_key(cand)
            for ind in self.indicators:
                if k == norm_key(ind.code) or any(k == norm_key(a) for a in ind.aliases):
                    return ind
        return None


@dataclass
class Standard:
    id: str
    name: str
    aliases: List[str]
    standards_text: List[str]
    required_groups: List[str]
    mandatory_indicators: Dict[str, List[str]]
    scope_rules: Dict[str, List[str]]
    comparability_key: Optional[str]
    biogenic_carbon_key: Optional[str]
    references: List[Dict[str, str]]


def _build_method(d: Dict[str, Any]) -> Method:
    inds = []
    for i, x in enumerate(d.get("indicators", [])):
        inds.append(Indicator(
            method_id=d["id"],
            code=x["code"],
            name=x.get("name", x["code"]),
            short_name=x.get("shortName") or x["code"],
            category=x.get("category") or x.get("name", x["code"]),
            unit=x.get("unit"),
            group=x.get("group", "core impact"),
            mandatory=bool(x.get("mandatory", False)),
            core=bool(x.get("core", False)),
            footnotes=tuple(x.get("footnotes", [])),
            definition_key=x.get("definitionKey"),
            aliases=tuple(x.get("aliases", [])),
            order=i,
        ))
    return Method(
        id=d["id"], name=d.get("name", d["id"]), version=d.get("version"),
        aliases=list(d.get("aliases", [])), groups=list(d.get("groups", [])), indicators=inds,
        footnotes=dict(d.get("footnotes", {})), group_footnotes=dict(d.get("groupFootnotes", {})),
        references=list(d.get("references", [])), primary_indicator=d.get("primaryIndicator"),
        ecoinvent_labels=dict(d.get("ecoinventLabels", {})), raw=d,
    )


def _build_standard(d: Dict[str, Any]) -> Standard:
    return Standard(
        id=d["id"], name=d.get("name", d["id"]), aliases=list(d.get("aliases", [])),
        standards_text=list(d.get("standardsText", [])), required_groups=list(d.get("requiredGroups", [])),
        mandatory_indicators=dict(d.get("mandatoryIndicators", {})), scope_rules=dict(d.get("scopeRules", {})),
        comparability_key=d.get("comparabilityKey"), biogenic_carbon_key=d.get("biogenicCarbonKey"),
        references=list(d.get("references", [])),
    )


class Registry:
    def __init__(self, methods: List[Method], standards: List[Standard]):
        self.methods = {m.id: m for m in methods}
        self.standards = {s.id: s for s in standards}
        self._method_alias = {}
        for m in methods:
            for a in [m.id, m.name, *m.aliases, *m.ecoinvent_labels.keys()]:
                self._method_alias.setdefault(norm_key(a), m.id)
        self._standard_alias = {}
        for s in standards:
            for a in [s.id, s.name, *s.aliases]:
                self._standard_alias.setdefault(norm_key(a), s.id)

    def method_id(self, name: str) -> Optional[str]:
        return self._method_alias.get(norm_key(name)) if name else None

    def method(self, name: str) -> Optional[Method]:
        mid = self.method_id(name)
        return self.methods.get(mid) if mid else None

    def indicator(self, method: str, code: str) -> Optional[Indicator]:
        m = self.method(method)
        return m.indicator(code) if m else None

    def standard(self, name: Optional[str]) -> Optional[Standard]:
        if not name:
            return None
        sid = self._standard_alias.get(norm_key(name))
        return self.standards.get(sid) if sid else None

    def group_for_ecoinvent_label(self, label: str):
        """('en15804-a2', 'resource use') for 'EN15804+A2 - Indicators describing resource use'."""
        k = norm_key(label)
        for m in self.methods.values():
            for lab, grp in m.ecoinvent_labels.items():
                if norm_key(lab) == k:
                    return m.id, grp
        return None

    def list_methods(self) -> List[Dict[str, Any]]:
        return [{"id": m.id, "name": m.name, "version": m.version, "groups": m.group_ids(),
                 "indicatorCount": len(m.indicators)} for m in self.methods.values()]

    def list_standards(self) -> List[Dict[str, Any]]:
        return [{"id": s.id, "name": s.name} for s in self.standards.values()]


def load_registry(methods_dir: Optional[Path] = None, standards_dir: Optional[Path] = None) -> Registry:
    methods = [_build_method(d) for d in load_entries(methods_dir or _HERE / "methods", "METHOD")]
    standards = [_build_standard(d) for d in load_entries(standards_dir or _HERE / "standards", "STANDARD")]
    return Registry(methods, standards)


@lru_cache(maxsize=1)
def get_registry() -> Registry:
    return load_registry()
