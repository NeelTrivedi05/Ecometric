import warnings

import pytest

warnings.filterwarnings("ignore", category=DeprecationWarning)
from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402

from .conftest import load  # noqa: E402

client = TestClient(app)


def test_options():
    r = client.get("/api/epd-reports/options")
    assert r.status_code == 200
    body = r.json()
    assert {m["id"] for m in body["methods"]} >= {"traci-2.1", "cml-ia", "en15804-a2"}
    assert {c["id"] for c in body["productCategories"]} >= {"generic", "water-cooled-chiller", "mineral-wool-insulation"}


def test_preview_with_input():
    r = client.post("/api/epd-reports/preview", json={"input": load("insulation")})
    assert r.status_code == 200
    body = r.json()
    assert "mode-preview" in body["html"] and body["filename"].endswith(".pdf")
    assert body["meta"]["selection"]["methods"] == ["EN 15804+A2 (EF 3.1)"]


def test_preview_with_studio_payload():
    p = load("app_payload")
    p.pop("_note")
    r = client.post("/api/epd-reports/preview", json=p)
    assert r.status_code == 200 and "Studio Demo Product" in r.json()["html"]


def test_errors():
    assert client.post("/api/epd-reports/preview", json={"input": {"product": {}}}).status_code == 422
    assert client.post("/api/epd-reports/preview", json={"extractedData": {}}).status_code == 422
    fx = load("insulation")
    fx["selection"]["methods"] = ["CML-IA"]
    r = client.post("/api/epd-reports/preview", json={"input": fx})
    assert r.status_code == 422
    assert r.json()["detail"]["errors"][0]["message"].startswith("No results calculated for CML-IA")


@pytest.mark.pdf
def test_pdf_download():
    r = client.post("/api/epd-reports", json={"input": load("insulation")})
    assert r.status_code == 200 and r.headers["content-type"] == "application/pdf"
    assert r.content[:4] == b"%PDF"
    assert "EPD_EX_Rock_035" in r.headers["content-disposition"]


@pytest.mark.parametrize("route", ["/api/epd/export-pdf", "/api/epd/export-pdf-preview", "/api/epd/validate-pre-export",
                                   "/api/epd/generate-nsf-document", "/api/epd/report"])
def test_old_report_routes_removed(route):
    assert client.post(route, json={}).status_code == 404
