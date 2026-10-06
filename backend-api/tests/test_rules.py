"""The Python ports of the platform's rules give the answers design3/core/platform.js gives: the fixtures are
platform.js's own answers, written by frontend/scripts/seed.mjs."""

import pytest

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
