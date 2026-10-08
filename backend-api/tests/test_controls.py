"""The console's demo controls (SC-79): a client's scheduled runs and journey timers, each fired at once by staff
through what the tick itself runs, and its journey started again at a day length chosen then."""

from tests.test_workspace import HERO, INVOKER, PRIYA, agent, case, detect, setup, to_plan

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
    # a run already made today: the agent looks again (Run now's event)
    n = len(cloud.publisher.sent)
    assert (await api.post(f"{C}/munchly/journey/triggers/data", headers=neha)).status_code == 200
    assert [p["payload"]["type"] for p in cloud.publisher.sent[n:]] == ["agent.run_now"]


async def test_a_timer_fires_now_when_it_is_ready_and_says_why_when_not(api, munchly, neha, cloud):
    await to_plan(api, cloud)
    assert (
        await api.post(f"/v1/workspaces/munchly/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)
    ).status_code == 200
    await agent(api, f"/cases/{HERO}/offer", "outreach", "outreach")
    triggers = (await api.get(f"{C}/munchly/journey", headers=neha)).json()["triggers"]
    offer = next(t for t in triggers if t["key"] == "offer.close")
    shelf = next(t for t in triggers if t["key"] == "shelf.due")
    assert (offer["agent"], offer["kind"], offer["ref"], offer["blocked"]) == ("outreach", "timer", HERO, None)
    assert offer["due"] < shelf["due"] and offer["dueWall"]
    assert shelf["blocked"] == "After the van round: the papers come first"
    r = await api.post(f"{C}/munchly/journey/triggers/{shelf['id']}", headers=neha)
    assert r.status_code == 409 and r.json()["message"] == shelf["blocked"]
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
    assert await detect(api) == [HERO]
    r = await api.post(f"{C}/munchly/journey/reset", json={"dayMinutes": 5}, headers=neha)
    assert r.status_code == 200, r.text
    clock = r.json()["clock"]
    assert (clock["day"], clock["dayMinutes"]) == (0, 5) and clock["now"].startswith("2026-10-02T08:00")
    texts = [x["text"] for x in await last_audit(api, neha, 2)]
    assert "Set the length of a journey day for Munchly Foods to 5 minutes (was a day)" in texts
    assert "started the journey again from 2026-10-02" in texts
    snap = (await api.get("/v1/workspaces/munchly/snapshot", headers=PRIYA)).json()
    assert snap["setup"]["confirmed"] is False and snap["setup"]["mapped"] == 0
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
