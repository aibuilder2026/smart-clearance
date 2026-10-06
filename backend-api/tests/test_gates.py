"""SC-47: quick-commerce gates per SKU, with a per-batch override, through the console's routes, the rule the agents
read in sc.batch_gates, and the audit lines in the prototype's words (design3/core/platform.js)."""

from datetime import date

from sqlalchemy import text

from sc_api.domain import gates as rule
from sc_api.services import supply

C = "/v1/console/clients/munchly"


def by_ref(rows):
    return {r["ref"]: r for r in rows}


async def lines(api, neha, n=1):
    return [x["text"] for x in (await api.get("/v1/console/audit?client=munchly", headers=neha)).json()[:n]]


async def test_munchlys_batches_and_their_gates(api, neha):
    rows = (await api.get(f"{C}/batches", headers=neha)).json()
    assert len(rows) == 9
    b = by_ref(rows)
    # the one override, set by Neha on 4 Oct: Zepto and Instamart pass at 30% where the SKU's default asks 60%
    assert b["MF-2409-204"]["override"] == {
        "qcomPct": 30,
        "reason": "Zepto's Pune warehouse agreed to take this lot at 30% of its life",
        "by": "Neha Kulkarni",
        "at": "4 Oct, 16:20",
    }
    assert [(c["app"], c["has"], c["need"], c["pass"], c["source"]) for c in b["MF-2409-204"]["checks"]] == [
        ("blinkit", 92, 90, True, "default"),
        ("zepto", 34, 30, True, "override"),
        ("instamart", 34, 30, True, "override"),
    ]
    # the mango drink's own gates, and the hero batch on the client's default
    assert {c["source"] for c in b["MF-2410-118"]["checks"]} == {"sku"}
    assert (b["MF-2410-118"]["blinkitDays"], b["MF-2410-118"]["qcomPct"]) == (45, 50)
    hero = b["MF-2409-117"]
    assert (hero["daysLeft"], hero["lifeDays"], hero["bestBefore"], hero["units"]) == (43, 180, "2026-11-18", 1840)
    assert "override" not in hero
    one = (await api.get(f"{C}/batches?sku=mango", headers=neha)).json()
    assert [r["ref"] for r in one] == ["MF-2410-118"]


async def test_skus_carry_only_their_own_gates(api, neha):
    skus = {s["id"]: s for s in (await api.get(C, headers=neha)).json()["skus"]}
    assert skus["mango"]["gates"] == {"blinkitDays": 45, "qcomPct": 50}
    assert skus["facewash"]["gates"] == {"blinkitDays": 180}
    assert skus["chips"]["gates"] == {}


async def test_an_skus_own_gates_and_back_to_the_default(api, neha):
    r = await api.put(f"{C}/skus/chips/gates", json={"gates": {"blinkitDays": 75, "qcomPct": 60}}, headers=neha)
    assert r.status_code == 200, r.text
    assert next(s for s in r.json()["skus"] if s["id"] == "chips")["gates"] == {"blinkitDays": 75, "qcomPct": 60}
    assert await lines(api, neha) == [
        "Set Masala Chips 150 g's quick-commerce gates: Blinkit 75+ days, Zepto and Instamart 60% of life"
    ]
    # the same again writes nothing
    await api.put(f"{C}/skus/chips/gates", json={"gates": {"blinkitDays": 75, "qcomPct": 60}}, headers=neha)
    assert (await lines(api, neha, 2))[1].startswith("Overrode MF-2409-204")
    # the chips batches now read Blinkit 75 from the SKU
    rows = by_ref((await api.get(f"{C}/batches?sku=chips", headers=neha)).json())
    assert rows["MF-2408-209"]["checks"][0] == {"app": "blinkit", "need": 75, "has": 70, "pass": False, "source": "sku"}
    r = await api.put(f"{C}/skus/chips/gates", json={"gates": None}, headers=neha)
    assert next(s for s in r.json()["skus"] if s["id"] == "chips")["gates"] == {}
    assert await lines(api, neha) == ["Put Masala Chips 150 g back on Munchly Foods' default quick-commerce gates"]


async def test_an_skus_gates_must_be_in_bounds(api, neha):
    for body, message in (
        ({"gates": {"blinkitDays": 20}}, "Blinkit takes 30 to 180 days."),
        ({"gates": {"qcomPct": 95}}, "Zepto and Instamart take 30% to 90% of life."),
        ({"gates": {}}, "Give the SKU at least one gate of its own, or put it back on the default."),
    ):
        r = await api.put(f"{C}/skus/chips/gates", json=body, headers=neha)
        assert r.status_code == 422 and r.json()["message"] == message, r.text
    r = await api.put(f"{C}/skus/nope/gates", json={"gates": None}, headers=neha)
    assert r.status_code == 404


async def test_a_batch_override_and_removing_it(api, neha):
    body = {"qcomPct": 35, "reason": "  Instamart Indore clears this lot at 35%  "}
    r = await api.put(f"{C}/batches/MF-2408-209/override", json=body, headers=neha)
    assert r.status_code == 200, r.text
    assert await lines(api, neha) == [
        "Overrode MF-2408-209's quick-commerce gates: Zepto and Instamart 35% of life "
        "(Instamart Indore clears this lot at 35%)"
    ]
    row = by_ref((await api.get(f"{C}/batches", headers=neha)).json())["MF-2408-209"]
    assert row["override"] == {
        "qcomPct": 35,
        "reason": "Instamart Indore clears this lot at 35%",
        "by": "Neha Kulkarni",
        "at": "Today, 12:00",
    }
    assert [(c["has"], c["need"], c["pass"], c["source"]) for c in row["checks"][1:]] == [
        (38, 35, True, "override")
    ] * 2
    # the same again writes nothing; the SKU table counts it
    await api.put(f"{C}/batches/MF-2408-209/override", json=body, headers=neha)
    assert (await lines(api, neha, 2))[1].startswith("Overrode MF-2409-204")
    r = await api.delete(f"{C}/batches/MF-2408-209/override", headers=neha)
    assert r.status_code == 200
    assert await lines(api, neha) == ["Removed MF-2408-209's quick-commerce gate override"]
    assert "override" not in by_ref((await api.get(f"{C}/batches", headers=neha)).json())["MF-2408-209"]
    await api.delete(f"{C}/batches/MF-2408-209/override", headers=neha)
    assert (await lines(api, neha))[0] == "Removed MF-2408-209's quick-commerce gate override"
    assert len([x for x in await lines(api, neha, 5) if x.startswith("Removed")]) == 1


async def test_an_override_needs_a_reason_and_bounds(api, neha):
    for body, message in (
        ({"qcomPct": 35, "reason": "   "}, "Say why this batch is different."),
        ({"reason": "a deal"}, "Override at least one gate."),
        ({"blinkitDays": 6, "reason": "a deal"}, "A batch's Blinkit gate is 7 to 180 days."),
        ({"qcomPct": 4, "reason": "a deal"}, "A batch's Zepto and Instamart gate is 5% to 90% of life."),
        ({"qcomPct": 35, "reason": "y" * 201}, "Keep the reason to 200 characters."),
    ):
        r = await api.put(f"{C}/batches/MF-2408-209/override", json=body, headers=neha)
        assert r.status_code == 422 and r.json()["message"] == message, r.text
    r = await api.put(f"{C}/batches/NOPE/override", json={"qcomPct": 35, "reason": "x"}, headers=neha)
    assert r.status_code == 404


async def test_a_closed_batch_keeps_the_gates_it_was_judged_by(api, neha, ctx):
    await supply.close_batch(ctx, "munchly", "MF-2409-204", recovered=0, outcome="sold through")
    judged = (
        await ctx.session.execute(
            text("select judged_blinkit_days, judged_qcom_pct from sc.batches where ref = 'MF-2409-204'")
        )
    ).one()
    assert tuple(judged) == (90, 30)
    r = await api.put(f"{C}/batches/MF-2409-204/override", json={"qcomPct": 40, "reason": "x"}, headers=neha)
    assert r.status_code == 422
    assert r.json()["message"] == "MF-2409-204 is closed; it keeps the gates it was judged by."
    assert "MF-2409-204" not in by_ref((await api.get(f"{C}/batches", headers=neha)).json())


async def test_the_agents_view_reads_what_the_api_does(api, neha, ctx, clock):
    """sc.batch_gates counts days from India's real date; the API from its clock. Everything else is the same"""
    db_today: date = (await ctx.session.execute(text("select (now() at time zone 'Asia/Kolkata')::date"))).scalar_one()
    shift = (db_today - clock.today()).days
    api_rows = by_ref((await api.get(f"{C}/batches", headers=neha)).json())
    view = (
        (await ctx.session.execute(text("select * from sc.batch_gates where client_id = 'munchly'"))).mappings().all()
    )
    assert {v["ref"] for v in view} == set(api_rows)
    for v in view:
        a = api_rows[v["ref"]]
        assert (v["blinkit_days"], v["qcom_pct"]) == (a["blinkitDays"], a["qcomPct"])
        assert (v["blinkit_source"], v["qcom_source"]) == (a["checks"][0]["source"], a["checks"][1]["source"])
        assert v["days_left"] == a["daysLeft"] - shift
        e = rule.Effective(v["blinkit_days"], v["blinkit_source"], v["qcom_pct"], v["qcom_source"])
        want = rule.checks(e, days_left=v["days_left"], life_days=v["life_days"])
        assert (v["blinkit_pass"], v["qcom_pass"], v["life_left_pct"]) == (
            want[0]["pass"],
            want[1]["pass"],
            want[1]["has"],
        )
