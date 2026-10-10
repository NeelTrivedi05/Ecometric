"""
Editable boilerplate and narrative templates, keyed by dotted ids.

Resolution order (first hit wins):
    report input ``textOverrides``  >  product category profile ``textOverrides``  >  language library
"""

import string
from typing import Any, Dict, Mapping, Optional

from .en import TEXT as EN_TEXT

LIBRARIES: Dict[str, Dict[str, str]] = {"en": EN_TEXT}


class TextLibrary:
    def __init__(self, language: str = "en", *overrides: Mapping[str, str]):
        self.base = LIBRARIES.get(language or "en", EN_TEXT)
        self.layers = [o for o in overrides if o]

    def get(self, key: Optional[str], default: Optional[str] = None) -> Optional[str]:
        if not key:
            return default
        for layer in self.layers:
            if key in layer and layer[key] is not None:
                return layer[key]
        return self.base.get(key, default)

    def fill(self, key: str, **values: Any) -> Optional[str]:
        """Fills a template; returns None if any referenced value is missing (sentence is skipped)."""
        tpl = self.get(key)
        return fill_template(tpl, **values) if tpl else None


def fill_template(tpl: str, **values: Any) -> Optional[str]:
    """Placeholders named ``*_clause`` are optional sub-phrases and may be empty; any other
    placeholder that is None or blank means the data is missing and the sentence is skipped."""
    fields = [f for _, f, _, _ in string.Formatter().parse(tpl) if f]
    for f in fields:
        key = f.split(".")[0].split("[")[0]
        v = values.get(key)
        if key.endswith("_clause"):
            if v is None:
                values[key] = ""
            continue
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
    return tpl.format(**values)
