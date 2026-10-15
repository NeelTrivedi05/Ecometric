from .helpers import build, codes, warnings


def test_minimal_renders_with_errors(minimal):
    doc = build(minimal)
    assert doc.draft
    errs = codes(doc, "error")
    assert {"meta.declaration_number", "meta.pcr", "meta.verification"} <= errs
    assert "results" in [s.id for s in doc.sections]


def test_complete_fixtures_have_no_errors(chiller, insulation):
    assert codes(build(chiller), "error") == set()
    assert codes(build(insulation), "error") == set()


def test_mandatory_indicator_missing(chiller):
    chiller["selection"]["methods"] = ["TRACI 2.1"]
    for rs in chiller["results"]:
        if rs["method"] == "TRACI 2.1":
            rs["rows"] = [r for r in rs["rows"] if r["indicatorCode"] != "ODP"]
    doc = build(chiller)
    assert "indicator.mandatory_missing" in codes(doc, "error")


def test_declared_module_without_value(chiller):
    chiller["selection"]["methods"] = ["TRACI 2.1"]
    del chiller["results"][0]["rows"][0]["values"]["B6"]
    doc = build(chiller)
    msgs = [w["message"] for w in warnings(doc, "error") if w["code"] == "indicator.module_missing"]
    assert msgs and "B6" in msgs[0]


def test_mnd_module_with_value_warns(insulation):
    insulation["results"][0]["rows"][0]["values"]["B6"] = 3.0
    doc = build(insulation)
    assert "module.undeclared_has_value" in codes(doc, "warning")


def test_scope_requires_modules(insulation):
    insulation["meta"]["scope"] = "Cradle-to-grave"
    doc = build(insulation)
    msg = next(w["message"] for w in warnings(doc, "error") if w["code"] == "scope.modules")
    assert "B6" in msg


def test_en15804_requires_resource_use(insulation):
    insulation["results"][0]["rows"] = [r for r in insulation["results"][0]["rows"]
                                        if r["indicatorCode"] not in {"PERE", "PERM", "PERT", "PENRE", "PENRM", "PENRT",
                                                                      "SM", "RSF", "NRSF", "FW"}]
    doc = build(insulation)
    assert "group.missing" in codes(doc, "error")


def test_validity_mismatch(chiller):
    chiller["meta"]["validUntil"] = "2030-03-01"
    assert "meta.validity" in codes(build(chiller), "warning")


def test_validity_computed_from_text(chiller):
    chiller["meta"].pop("validUntil")
    chiller["meta"].pop("validityYears")
    doc = build(chiller)
    assert "meta.validity" not in codes(doc)
    from .helpers import kv_value
    assert "2031-03-01" in kv_value(doc, "Period of validity")


def test_unverified_is_warning(chiller):
    chiller["verification"]["verified"] = False
    assert "meta.unverified" in codes(build(chiller), "warning")


def test_no_draft_when_option_off(minimal):
    assert not build(minimal, draft_watermark_on_errors=False).draft
