import copy
import json
from pathlib import Path

import pytest

FIXTURES = Path(__file__).resolve().parent / "fixtures"


def load(name: str) -> dict:
    return json.loads((FIXTURES / f"{name}.json").read_text(encoding="utf-8"))


@pytest.fixture
def chiller():
    return copy.deepcopy(load("chiller"))


@pytest.fixture
def insulation():
    return copy.deepcopy(load("insulation"))


@pytest.fixture
def minimal():
    return copy.deepcopy(load("minimal"))
