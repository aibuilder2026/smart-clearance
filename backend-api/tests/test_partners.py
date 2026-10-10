"""A partner's own history (SC-130): each distributor, kirana and food bank reads the batches it took part in, cut to
its part, with the facts design3's partners' pages read (reference/journey.json `history.partners`, ledger.js): when
each step happened, the plan and what each line took, the deal and the papers. A kirana can say not this time to the
open scheme, and an order after all takes it back."""

from datetime import datetime

import pytest

from sc_api.services.reference import load
from tests.conftest import token
from tests.test_history import with_history  # noqa: F401 (the fixture)
from tests.test_workspace import (
    ARJUN,
    GANESH,
    HERO,
    LAKSHMI,
    MEERA,
    PRIYA,
    RAKESH,
    WS,
    agent,
    case,
    detect,
    setup,
    to_plan,
)

H = load("journey.json")["history"]
FACTS = {x["ref"]: x for x in H["partners"]}
SHREESAI = token("shree-sai-kirana@google.example")
IFBN = token("india-foodbanking-network@google.example")
# the steps backend-api stamps, as design3's history has them (Vision asking is the feed's alone)
STEPS = {"detect", "photo", "read", "approve", "listing", "offer", "donation", "pickup", "orders", "accept"}
STEPS |= {"collect", "closeOffer", "staff", "truck", "papers", "invoice", "van", "review", "report"}


async def partner(api, who) -> dict:
    r = await api.get(f"{WS}/partner", headers=who)
    assert r.status_code == 200, r.text
    return r.json()


def _history(view: dict) -> dict[str, dict]:
    return {c["ref"]: c for c in view["cases"] if c["ref"] in FACTS}


async def test_a_distributor_reads_every_batch_of_his_as_design3_has_it(api, with_history):  # noqa: F811
    for who, dist in ((RAKESH, "rakesh"), (LAKSHMI, "lakshmi")):
        view = await partner(api, who)
        got = _history(view)
        assert set(got) == {r for r, x in FACTS.items() if x["dist"] == dist}
        assert view["buyer"] == {"name": "Agrawal Wholesale", "city": "Raipur"}
        for ref, c in got.items():
            x = FACTS[ref]
            for k in ("sku", "dist", "outcome", "flagged", "cleared", "batch", "offered", "kirana", "award"):
                assert c[k] == x[k], (ref, k)
            assert c["plan"]["units"] == x["plan"]["units"], ref
            assert [ln for ln in c["plan"]["lines"] if ln["units"]] == [ln for ln in x["plan"]["lines"] if ln["units"]]

            # what each line took; the ledger carries the ExpireSoon lot at the price the buyer took (SC-122), where
            # design3 keeps the price listed: the pages work out the lot's money from the award either way
            def took(r: dict) -> list:
                return [
                    (ln["id"], ln["units"]) + (() if ln["id"] == "expiresoon" else (ln["gross"], ln["price"]))
                    for ln in r["lines"]
                ]

            assert (took(c["realised"]), c["realised"]["godown"]) == (took(x["realised"]), x["realised"]["godown"]), ref
            assert c["support"] == x["support"], ref
            assert (c["expiry"], c["listing"], c["partner"], c["donation"]) == (
                x["expiry"],
                x["listing"],
                x["partner"],
                x["donation"],
            ), ref
            pairs = [(k["kirana"], k["units"]) for k in c["kiranas"]]
            assert pairs == [(k["kirana"], k["units"]) for k in x["kiranas"]], ref
            steps = {s["step"]: s["at"] for s in c["steps"]}
            theirs = {s["step"]: s["at"] for s in x["steps"] if s["step"] in STEPS}
            assert {k: steps.get(k) for k in theirs} == theirs, ref
            # his papers, then copies of the food bank's receipt and the destruction certificate; the client's GST memo
            # and FSSAI checklist stay its own
            docs = {d["id"]: d for d in c["docs"]}
            assert set(docs) <= {"invoice", "eway", "support", "expiry", "receipt", "destruction"}
            for d in x["docs"]:
                if d["id"] in docs:
                    assert (docs[d["id"]]["no"], docs[d["id"]]["status"]) == (d["no"], d["status"]), (ref, d["id"])
                    # the destruction certificate carries the credit reversed on its packs, on his copy too (SC-132)
                    if d["id"] == "destruction" and d.get("units", d.get("reversed")):
                        assert docs["destruction"]["reversed"] == d["reversed"] > 0, ref
            assert "itc" not in docs and "fssai" not in docs
            if x["receipt"]:
                assert (c["receipt"]["no"], c["receipt"]["meals"]) == (x["receipt"]["no"], x["receipt"]["meals"])


async def test_a_distributor_opens_a_copy_of_a_papers_pdf(api, with_history):  # noqa: F811
    donated = next(r for r, x in FACTS.items() if x["dist"] == "rakesh" and x["receipt"])
    seen = await case(api, RAKESH, donated)
    ids = {d["id"] for d in seen["docs"]}
    assert "receipt" in ids and "itc" not in ids and "fssai" not in ids


async def test_a_kirana_reads_every_scheme_that_came_to_its_shop(api, with_history):  # noqa: F811
    view = await partner(api, GANESH)
    assert view["shop"]["id"] == "k0" and view["shop"]["distributor"] == "rakesh"
    got = _history(view)
    assert set(got) == {r for r, x in FACTS.items() if x["dist"] == "rakesh" and x["kirana"]}
    for ref, c in got.items():
        x = FACTS[ref]
        mine = [k for k in x["kiranas"] if k["kirana"] == "k0"]
        assert [(k["kirana"], k["units"]) for k in c["kiranas"]] == [(k["kirana"], k["units"]) for k in mine], ref
        # another shop's order, the money and the papers are not the kirana's
        assert (c["realised"], c["support"], c["award"], c["docs"], c["receipt"]) == (None, None, None, [], None)
        assert c["kirana"] == x["kirana"] and c["offer"]["status"] == "closed"


async def test_a_food_bank_reads_the_donations_it_collected_with_their_receipts(api, with_history):  # noqa: F811
    view = await partner(api, MEERA)
    got = _history(view)
    assert set(got) == {r for r, x in FACTS.items() if (x["partner"] or {}).get("name") == "Feeding India"}
    for ref, c in got.items():
        x = FACTS[ref]
        assert c["donation"] == x["donation"] and c["receipt"]["no"] == x["receipt"]["no"]
        assert [d["id"] for d in c["docs"]] == ["receipt"]
        assert (c["realised"], c["support"], c["kiranas"]) == (None, None, [])
        steps = {s["step"] for s in c["steps"]}
        assert {"donation", "pickup", "collect"} <= steps
    assert (await api.post(f"{WS}/session", headers=IFBN)).status_code == 200
    assert _history(await partner(api, IFBN)) == {}


async def test_staff_have_no_partner_history(api, with_history):  # noqa: F811
    assert (await partner(api, PRIYA))["cases"] == []


async def test_a_distributor_reads_his_batch_from_the_flag_with_its_photo_asked_before_any_plan(api, munchly, cloud):
    """his portal is told batch by batch (SC-133): a batch of his asking for its label photo is his before the Router
    plans it, with the packs the Watcher flagged; the other partners read it once it has a plan"""
    await setup(api)
    await detect(api)
    await agent(api, f"/cases/{HERO}/photo-request", "vision-ask", "vision")
    hero = next(c for c in (await partner(api, RAKESH))["cases"] if c["ref"] == HERO)
    assert [s["step"] for s in hero["steps"]] == ["detect", "ask"]
    flagged = (await case(api, PRIYA))["batch"]["assess"]["atRisk"]
    assert hero["plan"] == {"units": flagged, "lines": []} == {"units": 1360, "lines": []}
    assert hero["cleared"] is None and hero["award"] is None and hero["docs"] == []
    # Lakshmi Agencies' Mango Drink is hers, not his; a kirana reads neither before a plan
    assert HERO not in {c["ref"] for c in (await partner(api, LAKSHMI))["cases"]}
    assert HERO not in {c["ref"] for c in (await partner(api, GANESH))["cases"]}


@pytest.mark.parametrize("after_all", [False, True])
async def test_a_kirana_says_not_this_time_and_may_order_after_all(api, munchly, cloud, after_all):
    await to_plan(api, cloud)
    assert (await api.post(f"{WS}/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)).status_code == 200
    await agent(api, f"/cases/{HERO}/listing", "lister", "lister")
    await agent(api, f"/cases/{HERO}/offer", "outreach", "outreach")
    assert (await api.post(f"{WS}/session", headers=SHREESAI)).status_code == 200
    r = await api.post(f"{WS}/cases/{HERO}/offer/decline", headers=SHREESAI)
    assert r.status_code == 200, r.text
    mine = await case(api, SHREESAI)
    assert set(mine["journey"]["offer"]["declined"]) == {"k31"}
    # another kirana is not told
    assert (await case(api, GANESH))["journey"]["offer"]["declined"] == {}
    view = await partner(api, SHREESAI)
    hero = next(c for c in view["cases"] if c["ref"] == HERO)
    assert set(hero["declined"]) == {"k31"} and hero["offer"]["status"] == "open"
    # declining again changes nothing; the operator's audit names it
    assert (await api.post(f"{WS}/cases/{HERO}/offer/decline", headers=SHREESAI)).status_code == 200
    audit = (await api.get(f"{WS}/audit", headers=ARJUN)).json()
    assert sum(r["what"] == "declined the scheme" for r in audit["rows"]) == 1
    if after_all:
        r = await api.post(f"{WS}/cases/{HERO}/orders", json={"units": 12}, headers=SHREESAI)
        assert r.status_code == 200, r.text
        mine = await case(api, SHREESAI)
        assert mine["journey"]["offer"]["declined"] == {}
        assert [o["units"] for o in mine["journey"]["orders"]] == [12]
        r = await api.post(f"{WS}/cases/{HERO}/offer/decline", headers=SHREESAI)
        assert r.status_code == 409, r.text


def test_an_older_destruction_certificate_gets_its_credit_from_the_plan():
    """a certificate drafted before SC-132 carries no credit reversed: the copy works it out from the batch's plan"""
    from types import SimpleNamespace

    from sc_api.services.journey import views

    case = SimpleNamespace(plan={"writeOff": {"itcPerUnit": 0.55}})
    old = {"id": "destruction", "units": 184, "status": "generated"}
    assert views.with_reversed(case, old)["reversed"] == 101.2
    assert views.with_reversed(case, {**old, "reversed": 99})["reversed"] == 99
    assert "reversed" not in views.with_reversed(case, {"id": "destruction", "units": 0})


def test_the_van_round_carries_the_day_it_leaves_when_it_ran_before_then():
    """a compressed journey runs the round before its morning: his pages name it by its own day (SC-97, SC-137)"""
    from sc_api import models as m
    from sc_api.domain.clock import IST
    from sc_api.services.journey.partners import steps_of

    case = m.Case(
        opened_at=datetime(2026, 10, 2, 8, 0, tzinfo=IST),
        offer={"status": "closed", "at": "2026-10-02T09:08:00+05:30", "closedAt": "2026-10-02T09:14:00+05:30"},
        docs=[{"id": "invoice", "date": "2026-10-02"}],
        van={"status": "done", "at": "2026-10-02T11:14:00+05:30"},
        history=False,
    )
    van = next(s for s in steps_of(case, [], {}, "07:00") if s["step"] == "van")
    assert van == {"step": "van", "at": "2026-10-02T11:14", "leaves": "2026-10-03T07:00"}
    case.history = True  # the history's rounds keep their own stamp
    assert "leaves" not in next(s for s in steps_of(case, [], {}, "07:00") if s["step"] == "van")
