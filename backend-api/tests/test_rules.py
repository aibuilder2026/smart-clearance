"""The Python ports of the platform's rules give the answers design3/core/platform.js gives: the fixtures are
platform.js's own answers, written by frontend/scripts/seed.mjs."""

from datetime import date

import pytest

from sc_api.domain.gates import (
    batch_gates,
    clear_override_line,
    override_error,
    override_line,
    sku_gates_error,
    sku_gates_line,
)
from sc_api.domain.rules import agent_defaults, exits_for, show_value, slug
from sc_api.services.reference import load

FIXTURES = load("rules.json")
CONFIG = load("console.json")["config"]
AGENTS = load("catalog.json")["agents"]


@pytest.mark.parametrize("case", FIXTURES["exitsFor"], ids=lambda c: "/".join(c["profile"].values()))
def test_exits_for(case):
    assert exits_for(case["profile"], CONFIG["defaults"]["staffCap"]) == case["exits"]


@pytest.mark.parametrize("case", FIXTURES["agentDefaults"], ids=lambda c: c["preset"])
def test_agent_defaults(case):
    assert agent_defaults(case["preset"], AGENTS, CONFIG["defaults"], case["approver"]) == case["agents"]


@pytest.mark.parametrize("case", FIXTURES["showValue"], ids=lambda c: f"{c['agent']}.{c['key']}={c['value']}")
def test_show_value(case):
    field = next(f for f in CONFIG["fields"][case["agent"]] if f["key"] == case["key"])
    assert show_value(field, case["value"]) == case["text"]


@pytest.mark.parametrize("case", FIXTURES["slug"], ids=lambda c: c["name"] or "empty")
def test_slug(case):
    assert slug(case["name"]) == case["slug"]


def test_every_rule_has_fixtures():
    assert len(FIXTURES["exitsFor"]) == 18
    assert len(FIXTURES["agentDefaults"]) == 3
    assert {c["agent"] for c in FIXTURES["showValue"]} == set(CONFIG["fields"])


# SC-47: quick-commerce gates per SKU, with a per-batch override
@pytest.mark.parametrize("case", FIXTURES["batchGates"], ids=lambda c: f"{c['batch']['sku']}@{c['today']}")
def test_batch_gates(case):
    b = case["batch"]
    got = batch_gates(
        case["client"]["gates"],
        case["sku"],
        b.get("override"),
        date.fromisoformat(b["bestBefore"]),
        date.fromisoformat(case["today"]),
    )
    assert got == case["gates"]


@pytest.mark.parametrize("case", FIXTURES["skuGatesError"], ids=str)
def test_sku_gates_error(case):
    assert sku_gates_error(case["gates"]) == case["error"]


@pytest.mark.parametrize("case", FIXTURES["overrideError"], ids=str)
def test_override_error(case):
    assert override_error(case["input"]) == case["error"]


def test_gate_lines():
    lines = FIXTURES["gateLines"]
    skus = {s["id"]: s for s in load("console.json")["state"]["clients"][0]["skus"]}
    assert sku_gates_line("Munchly Foods", skus["mango"]["name"], {"blinkitDays": 45, "qcomPct": 50}) == lines["sku"]
    assert sku_gates_line("Munchly Foods", skus["facewash"]["name"], {"blinkitDays": 180}) == lines["skuOne"]
    assert sku_gates_line("Munchly Foods", skus["mango"]["name"], None) == lines["skuDefault"]
    assert override_line("MF-2409-204", {"qcomPct": 30, "reason": " A deal "}) == lines["override"]
    assert clear_override_line("MF-2409-204") == lines["clear"]
