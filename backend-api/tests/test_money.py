"""SC-71: the money rules in Python give the answers design3/core/money.js gives. The fixtures are money.js's own
answers, with their inputs, written by frontend/scripts/seed.mjs into reference/money.json. These tests need no
database.

JSON writes JavaScript's Infinity (a channel with no cap) and NaN (a figure money.js cannot work out, such as a credit
note for an SKU without a dealer price) as null, so a null in a fixture matches either."""

import json
import math
from typing import Any

import pytest

from sc_api.domain import money as m
from sc_api.domain.gates import Effective, checks
from sc_api.services.reference import load

F = load("money.json")
TOL = 1e-9


def same(got: Any, want: Any, path: str = "$") -> None:
    """deep equality with the fixture: null for Infinity or NaN, and floats within 1e-9"""
    if want is None:
        assert got is None or (isinstance(got, float) and not math.isfinite(got)), f"{path}: {got!r} is not null"
    elif isinstance(want, bool):
        assert got is want, f"{path}: {got!r} != {want!r}"
    elif isinstance(want, int | float):
        assert isinstance(got, int | float) and not isinstance(got, bool), f"{path}: {got!r} is not a number"
        assert got == want or abs(got - want) <= TOL, f"{path}: {got!r} != {want!r}"
    elif isinstance(want, dict):
        assert isinstance(got, dict), f"{path}: {got!r} is not an object"
        assert set(got) == set(want), f"{path}: keys {sorted(set(got) ^ set(want))} differ"
        for k in want:
            same(got[k], want[k], f"{path}.{k}")
    elif isinstance(want, list):
        assert isinstance(got, list) and len(got) == len(want), f"{path}: {got!r} != {want!r}"
        for i, (g, w) in enumerate(zip(got, want, strict=True)):
            same(g, w, f"{path}[{i}]")
    else:
        assert got == want, f"{path}: {got!r} != {want!r}"


def batch_id(c: dict[str, Any]) -> str:
    b = c["batch"]
    return f"{b['id']}:{b['daysLeft']}d:{b['units']}u"


def test_rules_and_channels_are_money_js():
    assert F["rules"] == m.RULES
    assert F["channels"] == m.CHANNELS


def test_every_case_is_here():
    assert len(F["plans"]) == 15
    assert {c["plan"]["batch"] for c in F["plans"][:9]} == {b["id"] for b in load("journey.json")["batches"]}
    assert (len(F["counter"]), len(F["writeOff"]), len(F["award"]), len(F["realised"])) == (24, 3, 3, 6)
    assert {k: len(v) for k, v in F["fmt"].items()} == {
        "num": 6,
        "inr": 8,
        "inr2": 5,
        "signed": 3,
        "rate": 4,
        "lakh": 3,
        "kg": 6,
        "pct": 3,
        "date": 3,
        "day": 2,
    }


@pytest.mark.parametrize("case", F["plans"], ids=batch_id)
def test_assess(case):
    same(m.assess(case["batch"], case["sku"]), case["assess"])
    same(m.gates(case["batch"], case["sku"]), case["assess"]["gates"])


@pytest.mark.parametrize("case", F["plans"], ids=batch_id)
def test_plan(case):
    got = m.plan(case["batch"], case["sku"])
    same(got, case["plan"])
    same(m.channel_table(case["batch"], case["sku"], got["units"]), case["plan"]["rows"])
    same(m.allocate(got["rows"], got["units"]), [{"id": ln["id"], "units": ln["units"]} for ln in got["lines"]])


@pytest.mark.parametrize("case", F["plans"], ids=batch_id)
def test_plan_as_json_is_money_js_exactly(case):
    """what the API would send: the same JSON as JSON.stringify(money.js's plan), every float to the last bit"""
    got = m.jsonable(m.plan(case["batch"], case["sku"]))
    assert got == case["plan"]
    assert json.loads(json.dumps(got, allow_nan=False)) == case["plan"]


@pytest.mark.parametrize("case", F["writeOff"], ids=lambda c: f"{c['units']}x{c['sku']['id']}")
def test_write_off(case):
    same(m.write_off(case["units"], case["sku"]), case["out"])


@pytest.mark.parametrize("case", F["counter"], ids=lambda c: f"ask{c['ask']}-bid{c['bid']}")
def test_counter(case):
    same(m.counter(case["ask"], case["bid"]), case["out"])


@pytest.mark.parametrize("case", F["award"], ids=lambda c: f"{c['units']}@{c['price']}")
def test_award(case):
    same(m.award(case["units"], case["price"]), case["out"])


@pytest.mark.parametrize("case", F["actualNet"], ids=lambda c: f"{c['plan']['batch']}@{c['awardPrice']}")
def test_actual_net(case):
    same(m.actual_net(case["plan"], case["awardPrice"]), case["out"])


@pytest.mark.parametrize("case", F["realised"], ids=lambda c: f"{c['plan']['batch']}:{c['done']}")
def test_realised(case):
    same(m.realised(case["plan"], case["sku"], case["done"]), case["out"])


def test_a_plan_done_as_planned_is_the_plan():
    """the story's figures stand when every line is done as planned (SC-86)"""
    for case in F["realised"]:
        if case["out"]["godown"] == 0:
            assert {k: v for k, v in case["out"].items() if k != "godown"} == case["plan"]


@pytest.mark.parametrize("case", F["priceSupport"], ids=lambda c: f"{c['plan']['batch']}@{c['awardPrice']}")
def test_price_support(case):
    same(m.price_support(case["plan"], case["sku"], case["awardPrice"]), case["out"])


@pytest.mark.parametrize("case", F["expirySettlement"], ids=lambda c: f"{c['units']}x{c['sku']['id']}-{c['policy']}")
def test_expiry_settlement(case):
    same(m.expiry_settlement(case["units"], case["sku"], case["policy"]), case["out"])


@pytest.mark.parametrize("case", F["expiryClaim"], ids=lambda c: f"{c['units']}x{c['sku']['id']}")
def test_expiry_claim(case):
    same(m.expiry_claim(case["units"], case["sku"]), case["out"])


@pytest.mark.parametrize("case", F["documents"], ids=lambda c: c["plan"]["batch"])
def test_documents(case):
    got = m.documents(
        case["plan"], case["sku"], case["award"], case["support"], case["parties"], numbers=case["numbers"]
    )
    same(got, case["out"])


FMT = [(k, c) for k, cases in F["fmt"].items() for c in cases]


@pytest.mark.parametrize(("name", "case"), FMT, ids=[f"{k}({c['in']})" for k, c in FMT])
def test_fmt(name, case):
    assert getattr(m.fmt, name)(case["in"]) == case["out"]


# --- JavaScript's numbers, where the fixtures do not reach


def test_js_round_takes_halves_up():
    assert [m.js_round(x) for x in (0.5, 1.5, 2.5, -0.5, -1.5, -2.5, 0.49999999999999994)] == [1, 2, 3, 0, -1, -2, 0]
    assert m.r2(1.005) == 1.0  # 1.005 is 1.00499999999999989... in binary, as in JavaScript
    assert m.r2(0.125) == 0.13
    assert math.isnan(m.js_round(math.nan))


def test_numbers_print_as_javascript_prints_them():
    assert [m.js_str(x) for x in (58, 58.0, 0.9, 1e21, 1e-7, 123e-7, -0.0, math.inf, math.nan)] == [
        "58",
        "58",
        "0.9",
        "1e+21",
        "1e-7",
        "0.0000123",
        "0",
        "Infinity",
        "NaN",
    ]
    # toFixed rounds the binary value; toLocaleString, like ICU, the shortest decimal that reads back as it
    assert (m.to_fixed(1.005, 2), m.to_fixed(0.125, 2), m.to_fixed(-0.0, 2), m.to_fixed(-1.005, 2)) == (
        "1.00",
        "0.13",
        "0.00",
        "-1.00",
    )
    assert (m.to_locale(1.005, max_fd=2), m.to_locale(2.675, max_fd=2), m.to_locale(0.125, max_fd=2)) == (
        "1.01",
        "2.68",
        "0.13",
    )
    assert (m.to_locale(1e21), m.to_locale(123456789.123), m.to_locale(-0.0001)) == (
        "1,00,00,00,00,00,00,00,00,00,000",
        "12,34,56,789.123",
        "-0",
    )
    assert (m.fmt.num(-0.4), m.fmt.pct(-0.001), m.fmt.date("2026-09-05")) == ("-0", "0%", "5 Sept 2026")


def test_jsonable_writes_infinity_and_nan_as_null():
    hero = F["plans"][0]
    p = m.plan(hero["batch"], hero["sku"])
    assert p["rows"][0]["capacity"] == math.inf
    out = m.jsonable(p)
    assert out["rows"][0]["capacity"] is None
    assert out["writeOff"]["total"] == 26329.6 and out["bookCost"] == 21760 and isinstance(out["bookCost"], int)


# --- a client's own values, and SC-47's gates


def test_a_clients_own_rules():
    hero = F["plans"][0]
    b, s = hero["batch"], hero["sku"]
    rules = m.rules_with({"vanPerUnit": 1, "scheme": {"free": 3}, "negotiation": {"reservePerUnit": 14}})
    assert (rules["scheme"], rules["negotiation"]["counterPctOfAsk"]) == ({"buy": 10, "free": 3}, 0.95)
    assert m.RULES["vanPerUnit"] == 0.5  # the defaults stay as they are
    kirana = next(r for r in m.channel_table(b, s, 1360, rules=rules) if r["id"] == "kirana")
    assert (kirana["net"], kirana["packPrice"]) == (17, 23.4)
    assert m.counter(15, 13.9, rules=rules) == {"action": "counter", "price": 14.2, "below": True}
    # a client's floor for snacks above the ExpireSoon and staff-sale prices leaves the kiranas, then the food bank
    floors = {"snacks": 0.55}
    rows = {r["id"]: r for r in m.channel_table(b, s, 1360, floors=floors)}
    assert (rows["expiresoon"]["eligible"], rows["expiresoon"]["reason"]) == (False, "below the 55% floor")
    assert (rows["staff"]["eligible"], rows["kirana"]["eligible"]) == (False, True)
    assert [(ln["id"], ln["units"]) for ln in m.plan(b, s, floors=floors)["lines"]] == [
        ("kirana", 588),
        ("foodbank", 772),
    ]
    assert m.plan(b, s, rules=m.rules_with({"floors": floors}))["lines"] == m.plan(b, s, floors=floors)["lines"]


def test_assess_with_gates_passed_in():
    for case in F["plans"]:
        b, s = case["batch"], case["sku"]
        same(m.assess(b, s, gates=m.gates(b, s)), case["assess"])


def test_assess_with_sc47s_effective_gates():
    default = Effective(90, "default", 60, "default")
    for case in F["plans"]:
        b, s = case["batch"], case["sku"]
        got = m.effective_gates(b, s, default)
        want = checks(default, days_left=b["daysLeft"], life_days=s["lifeDays"])
        assert [(g["id"], g["pass"]) for g in got] == [(c["app"], c["pass"]) for c in want]
        for g in got:  # the fewest days that pass
            passes = [c["pass"] for c in checks(default, days_left=g["need"], life_days=s["lifeDays"])]
            fails = [c["pass"] for c in checks(default, days_left=g["need"] - 1, life_days=s["lifeDays"])]
            i = list(m.GATE_LABELS).index(g["id"])
            assert passes[i] and not fails[i]
    hero = F["plans"][0]
    b, s = hero["batch"], hero["sku"]
    assert m.effective_gates(b, s, default)[1] == {
        "id": "zepto",
        "app": "Zepto",
        "need": 108,
        "has": 47,
        "pass": False,
        "rule": "needs 60% of a 180-day life (108 days)",
    }
    assert m.assess(b, s, gates=default)["status"] == "at-risk"
    # a per-batch override a Zepto warehouse agreed to opens Zepto and Instamart: the hero is no longer blocked
    deal = Effective(90, "default", 25, "override")
    a = m.assess(b, s, gates=deal)
    assert [(g["id"], g["need"], g["pass"]) for g in a["gates"]] == [
        ("blinkit", 90, False),
        ("zepto", 45, True),
        ("instamart", 45, True),
    ]
    assert (a["blocked"], a["status"], a["atRisk"]) == (False, "gated", 1360)
