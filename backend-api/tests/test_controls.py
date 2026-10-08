"""The console's demo controls (SC-79): a client's scheduled runs and journey timers, each fired at once by staff
through what the tick itself runs, and its journey started again at a day length chosen then."""

import pytest

from tests.test_workspace import HERO, INVOKER, MANGO, PRIYA, agent, case, detect, setup, to_plan

C = "/v1/console/clients"


async def last_audit(api, h, n: int = 1) -> list[dict]:
    return (await api.get("/v1/console/audit", headers=h)).json()[:n]


def due(cloud) -> list[dict]:
    return [p["payload"] for p in cloud.publisher.sent if p["payload"].get("type") == "agent.due"]


async def test_a_live_clients_daily_runs_and_firing_one_now(api, munchly, neha, cloud, clock):
    j = (await api.get(f"{C}/munchly/journey", headers=neha)).json()
    assert j["live"] is True
    assert (j["clock"]["day"], j["clock"]["day0"], j["clock"]["dayMinutes"]) == (0, "2026-10-02", 1440)
    data, watcher = j["triggers"]
    assert (data["id"], data["agent"], data["key"], data["due"][:16], data["blocked"]) == (
        "data",
        "data",
        "data.daily",
        "2026-10-02T08:30",
        None,
    )
    assert (watcher["id"], watcher["due"][:16], watcher["blocked"]) == (
        "watcher",
        "2026-10-02T09:00",
        "After Setup is confirmed",
    )
    # the Data agent's daily load, now: the day's exports written and loaded, as the tick would at 08:30
    r = await api.post(f"{C}/munchly/journey/triggers/data", headers=neha)
    assert r.status_code == 200, r.text
    sent = due(cloud)[-1]
    assert (sent["agent"], sent["day"]) == ("data", "2026-10-02") and sent["files"]
    assert next(t for t in r.json()["triggers"] if t["id"] == "data")["due"][:16] == "2026-10-03T08:30"
    (line,) = await last_audit(api, neha)
    assert (line["who"], line["text"]) == ("Neha Kulkarni", "Ran the Data agent's daily load now for Munchly Foods")
    # it was that day's run: the tick does not run it again at 08:30
    clock.advance(minutes=31)
    r = await api.post("/internal/jobs/tick", headers=INVOKER)
    assert r.json()["clients"]["munchly"]["daily"] == []
    # the Watcher waits for Setup, here as on the schedule
    r = await api.post(f"{C}/munchly/journey/triggers/watcher", headers=neha)
    assert r.status_code == 409 and r.json()["message"] == "The Watcher starts once Setup is confirmed."
    await setup(api)
    r = await api.post(f"{C}/munchly/journey/triggers/watcher", headers=neha)
    assert r.status_code == 200, r.text
    assert due(cloud)[-1]["agent"] == "watcher"
    # a run already made today: the Data agent gets the day's files again (the same ones, written once), so a journey
    # started again has the day's stock reported; the Watcher looks again (Run now's event)
    n = len(cloud.publisher.sent)
    assert (await api.post(f"{C}/munchly/journey/triggers/data", headers=neha)).status_code == 200
    again = [p["payload"] for p in cloud.publisher.sent[n:]]
    assert [(p["type"], p["agent"], p["day"]) for p in again] == [("agent.due", "data", "2026-10-02")]
    assert again[0]["files"] == sent["files"]
    n = len(cloud.publisher.sent)
    assert (await api.post(f"{C}/munchly/journey/triggers/watcher", headers=neha)).status_code == 200
    assert [p["payload"]["type"] for p in cloud.publisher.sent[n:]] == ["agent.run_now"]


async def test_a_timer_fires_now_when_it_is_ready_and_says_why_when_not(api, munchly, neha, cloud):
    await to_plan(api, cloud)
    assert (
        await api.post(f"/v1/workspaces/munchly/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)
    ).status_code == 200
    await agent(api, f"/cases/{HERO}/offer", "outreach", "outreach")
    triggers = (await api.get(f"{C}/munchly/journey", headers=neha)).json()["triggers"]
    offer = next(t for t in triggers if t["key"] == "offer.close")
    assert (offer["agent"], offer["kind"], offer["ref"], offer["blocked"]) == ("outreach", "timer", HERO, None)
    assert offer["dueWall"]
    # no day-7 shelf check any more (SC-93): the offer leaves its window closing, and the approval set the report's
    # timer, expiry day (SC-94)
    assert [t["key"] for t in triggers if t["kind"] == "timer"] == ["offer.close", "report.due"]
    r = await api.post(f"{C}/munchly/journey/triggers/{offer['id']}", headers=neha)
    assert r.status_code == 200, r.text
    assert offer["id"] not in {t["id"] for t in r.json()["triggers"]}
    assert (await case(api, PRIYA))["journey"]["offer"]["status"] == "closed"
    (line,) = await last_audit(api, neha)
    assert line["text"] == (
        "Fired the Outreach agent's timer now for Munchly Foods: closed the offer window for MF-2409-117"
    )
    again = await api.post(f"{C}/munchly/journey/triggers/{offer['id']}", headers=neha)
    assert again.status_code == 409 and again.json()["message"] == "That timer has already fired."
    for bad in ("timer-999999", "timer-x", "nope"):
        assert (await api.post(f"{C}/munchly/journey/triggers/{bad}", headers=neha)).status_code == 404


async def test_the_journey_starts_again_at_the_day_length_chosen(api, munchly, neha, cloud):
    await setup(api)
    assert await detect(api) == [HERO, MANGO]
    r = await api.post(f"{C}/munchly/journey/reset", json={"dayMinutes": 5}, headers=neha)
    assert r.status_code == 200, r.text
    clock = r.json()["clock"]
    assert (clock["day"], clock["dayMinutes"]) == (0, 5) and clock["now"].startswith("2026-10-02T08:00")
    texts = [x["text"] for x in await last_audit(api, neha, 2)]
    assert "Set the length of a journey day for Munchly Foods to 5 minutes (was a day)" in texts
    assert "started the journey again from 2026-10-02" in texts
    snap = (await api.get("/v1/workspaces/munchly/snapshot", headers=PRIYA)).json()
    # the guardrails wait for the operator again; the export's mapping stays (SC-84)
    assert snap["setup"]["confirmed"] is False and snap["setup"]["mapped"] == 8
    # no day length given: the client's own stays
    r = await api.post(f"{C}/munchly/journey/reset", json={}, headers=neha)
    assert r.status_code == 200 and r.json()["clock"]["dayMinutes"] == 5
    bad = await api.post(f"{C}/munchly/journey/reset", json={"dayMinutes": 0}, headers=neha)
    assert bad.status_code == 422
    assert (await api.post(f"{C}/munchly/journey/reset", json={})).status_code == 401


async def test_a_client_without_a_live_journey_runs_its_daily_agents_on_request(api, neha):
    j = (await api.get(f"{C}/munchly/journey", headers=neha)).json()
    assert j["live"] is False and j["clock"] is None
    assert [(t["id"], t["due"], t["time"]) for t in j["triggers"]] == [
        ("data", None, "08:30"),
        ("watcher", None, "09:00"),
    ]
    assert (await api.post(f"{C}/munchly/journey/triggers/data", headers=neha)).status_code == 200
    (line,) = await last_audit(api, neha)
    assert line["text"] == "Ran the Data agent now for Munchly Foods"
    r = await api.post(f"{C}/munchly/journey/reset", json={}, headers=neha)
    assert r.status_code == 409
    assert r.json()["message"] == "Munchly Foods' workspace isn't live, so it has no journey to start again."
    assert (await api.get(f"{C}/nope/journey", headers=neha)).status_code == 404


async def test_an_unsold_lot_closes_on_its_deadline_and_the_case_moves_on(api, munchly, neha, cloud):
    """SC-86: the ExpireSoon lot has a deadline; fired from the console, a lot nobody bought closes, and once the scheme
    has closed too the papers follow, with the lot's packs left at the godown"""
    await to_plan(api, cloud)
    r = await api.post(f"/v1/workspaces/munchly/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)
    assert r.status_code == 200
    await agent(api, f"/cases/{HERO}/listing", "lister", "lister")
    await agent(api, f"/cases/{HERO}/offer", "outreach", "outreach")
    triggers = (await api.get(f"{C}/munchly/journey", headers=neha)).json()["triggers"]
    lot = next(t for t in triggers if t["key"] == "listing.close")
    assert (lot["agent"], lot["ref"], lot["blocked"]) == ("lister", HERO, None)
    r = await api.post(f"{C}/munchly/journey/triggers/{lot['id']}", headers=neha)
    assert r.status_code == 200, r.text
    (line,) = await last_audit(api, neha)
    assert line["text"] == "Fired the Lister agent's timer now for Munchly Foods: closed the unsold lot for MF-2409-117"
    c = await case(api, PRIYA)
    assert c["journey"]["listing"]["status"] == "ended" and c["journey"]["phase"] == "executing"
    offer = next(t for t in r.json()["triggers"] if t["key"] == "offer.close")
    assert (await api.post(f"{C}/munchly/journey/triggers/{offer['id']}", headers=neha)).status_code == 200
    c = await case(api, PRIYA)
    assert c["journey"]["phase"] == "dispatched"  # nothing ordered, nothing sold: the papers follow
    assert c["realised"] == {"lines": [{"id": "kirana", "units": 0}, {"id": "expiresoon", "units": 0}], "godown": 1360}


async def test_a_retired_shelf_check_timer_is_put_away_unsent(api, munchly, ctx, cloud, clock):
    """SC-93: a journey started before the shelf check went may still hold its timer; the tick puts it away, sending
    nothing, and the console lists only the timers the journey sets"""
    from sqlalchemy import select

    from sc_api import models as m

    await to_plan(api, cloud)
    assert (
        await api.post(f"/v1/workspaces/munchly/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)
    ).status_code == 200
    await agent(api, f"/cases/{HERO}/offer", "outreach", "outreach")
    offer = (await ctx.session.execute(select(m.Timer).where(m.Timer.kind == "offer.close"))).scalar_one()
    old = m.Timer(
        client_id="munchly", case_id=offer.case_id, kind="shelf.due", due_at=offer.due_at, due_wall=offer.due_wall
    )
    ctx.session.add(old)
    await ctx.session.flush()
    n = len(cloud.publisher.sent)
    clock.advance(days=3)
    r = await api.post("/internal/jobs/tick", headers=INVOKER)
    assert r.status_code == 200, r.text
    await ctx.session.refresh(old)
    assert old.fired_wall is not None
    assert not [p for p in cloud.publisher.sent[n:] if p["payload"].get("kind") == "shelf.due"]


async def _report_now(api, neha):
    triggers = (await api.get(f"{C}/munchly/journey", headers=neha)).json()["triggers"]
    report = next(t for t in triggers if t["key"] == "report.due")
    assert report["blocked"] is None  # expiry day can come any time once the plan is approved
    r = await api.post(f"{C}/munchly/journey/triggers/{report['id']}", headers=neha)
    assert r.status_code == 200, r.text


async def test_report_now_is_expiry_day_and_the_journey_closes_as_it_stands(api, munchly, neha, cloud):
    """SC-94: Report now in the middle of the chips' journey. The scheme closes with the two shops' orders, the lot no
    buyer accepted ends unsold, the papers follow, and the packs no channel took expire: under Munchly's full-credit
    policy they come back for the dealer price and Munchly destroys them"""
    from sc_api.domain import money
    from tests.conftest import token
    from tests.test_workspace import J

    await to_plan(api, cloud)
    assert (
        await api.post(f"/v1/workspaces/munchly/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)
    ).status_code == 200
    await agent(api, f"/cases/{HERO}/listing", "lister", "lister")
    await agent(api, f"/cases/{HERO}/offer", "outreach", "outreach")
    shops = [k for k in J["kiranas"] if k["distributor"] == "rakesh" and k["orders"]][:2]
    for k in shops:
        login = next(x for x in J["members"] if x["id"] == k["member"])["login"]
        r = await api.post(
            f"/v1/workspaces/munchly/cases/{HERO}/orders", json={"units": k["orders"]}, headers=token(login)
        )
        assert r.status_code == 200, r.text
    await _report_now(api, neha)
    j = (await case(api, PRIYA))["journey"]
    assert (j["offer"]["status"], j["listing"]["status"], j["phase"]) == ("closed", "ended", "settled")
    assert any(p["payload"].get("kind") == "report.due" for p in cloud.publisher.sent)  # Impact's turn
    out = await agent(api, f"/cases/{HERO}/report", "impact", "impact")
    godown = 1360 - sum(k["orders"] for k in shops)
    want = money.jsonable(money.expiry_settlement(godown, J["skus"]["chips"], "full-credit"))
    assert out["ledger"]["godown"] == godown and out["ledger"]["expiry"] == want
    c = await case(api, PRIYA)
    assert c["journey"]["phase"] == "cleared"
    docs = {d["id"]: d for d in c["docs"]}
    assert (docs["expiry"]["type"], docs["expiry"]["amount"], docs["expiry"]["destroyedBy"]) == (
        "Expiry credit note",
        godown * 22,
        "client",
    )
    assert docs["expiry"]["no"].startswith("CN/")
    assert docs["destruction"]["units"] == godown and docs["destruction"]["status"] == "generated"
    assert docs["itc"]["reversed"] == want["itc"] > 0


@pytest.mark.parametrize(
    ("policy", "paper", "credit", "destroyed_by"),
    [
        ("full-credit", "Expiry credit note", 1360 * 22, "client"),
        ("price-support", "Price support at expiry", 1360 * 22, "distributor"),
        ("none", "Expiry notice", 0, "distributor"),
    ],
)
async def test_the_expired_packs_settle_by_the_clients_expiry_policy(
    api, munchly, neha, ctx, cloud, policy, paper, credit, destroyed_by
):
    """SC-94: Report now straight after the approval: nothing was listed, offered or sold, so all 1,360 packs expire
    at the godown and settle by the client's expiry policy"""
    from sc_api import models as m

    c = await ctx.session.get(m.Client, "munchly")
    c.expiry = policy
    await ctx.session.flush()
    await to_plan(api, cloud)
    assert (
        await api.post(f"/v1/workspaces/munchly/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)
    ).status_code == 200
    await _report_now(api, neha)
    out = await agent(api, f"/cases/{HERO}/report", "impact", "impact")
    assert (out["ledger"]["godown"], out["ledger"]["expiry"]["destroyedBy"]) == (1360, destroyed_by)
    docs = {d["id"]: d for d in (await case(api, PRIYA))["docs"]}
    assert (docs["expiry"]["type"], docs["expiry"]["amount"]) == (paper, credit)
    assert docs["expiry"]["status"] == ("not required" if policy == "none" else "generated")
    assert bool(docs["expiry"]["no"]) == (credit > 0)
    assert (docs["destruction"]["status"] == "generated") == (destroyed_by == "client")
