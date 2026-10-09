"""The console's Reset journey puts the journey's data back to the story's start (SC-88): after a run-through, a reset
reads as the story's own beginning, while the client's configuration stays as the console set it."""

from sqlalchemy import select

from sc_api import models as m
from sc_api.services.journey import reset
from sc_api.services.reference import load
from tests.test_first_export import upload
from tests.test_workspace import AGENT, ARJUN, HERO, MANGO, PRIYA, RAKESH, WS, agent, case, to_plan

J = load("journey.json")
STORY = next(x for x in load("console.json")["state"]["clients"] if x["id"] == "munchly")["firstExport"]


async def test_a_reset_puts_the_journeys_data_back_to_the_storys_start(api, munchly, neha, cloud, ctx, clock):
    # a run-through: the plan approved and listed (a listing number spent), a member who joined, one invited in a
    # demo, another stock export uploaded with a batch of its own, the inbox filling
    await to_plan(api, cloud)
    assert (await api.post(f"{WS}/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)).status_code == 200
    await agent(api, f"/cases/{HERO}/listing", "lister", "lister")
    assert (await case(api, PRIYA))["journey"]["listing"]["id"] == "ES-24117"
    shree = await ctx.session.get(m.ClientMember, ("munchly", "shreesai"))
    shree.status, shree.joined_at = "active", shree.invited_at
    r = await api.post(
        f"{WS}/members",
        json={"name": "Demo Visitor", "email": "demo.visitor@munchly.example", "role": "operator"},
        headers=ARJUN,
    )
    assert r.status_code == 200, r.text
    await upload(api, cloud, neha, "kesari_stock.csv")
    extra = m.Batch(
        client_id="munchly",
        ref="MF-9999-001",
        sku_id="chips",
        distributor_id="rakesh",
        units=10,
        stage_done=1,
        stage_current=1,
        opened_at=shree.invited_at,
        stage_at=shree.invited_at,
        best_before=(await ctx.session.get(m.Batch, ("munchly", HERO))).best_before,
    )
    ctx.session.add(extra)
    await ctx.session.flush()
    assert (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()["notifications"]

    clock.advance(minutes=5)
    await reset.reset(ctx, "munchly")
    await ctx.session.flush()

    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    assert snap["cases"] == [] and snap["notifications"] == []  # an earlier journey's pushes are not this one's
    assert (snap["setup"]["confirmed"], snap["setup"]["mapped"]) == (False, 8)
    assert snap["setup"]["lastImport"]["file"] == STORY["file"]
    assert "MF-9999-001" not in {b["id"] for b in snap["batches"]}
    refs = (await ctx.session.execute(select(m.ClientMember.ref).where(m.ClientMember.client_id == "munchly"))).all()
    assert {r for (r,) in refs} == {x["id"] for x in J["members"]}  # the demo's visitor has left the workspace
    assert (await ctx.session.get(m.ClientMember, ("munchly", "shreesai"))).status == "invited"
    numbers = {
        n.kind: n.next
        for n in (await ctx.session.execute(select(m.DocumentNumber).where(m.DocumentNumber.client_id == "munchly")))
        .scalars()
        .all()
    }
    assert numbers == {k: v["next"] for k, v in J["numbers"].items()}
    console = (await api.get("/v1/console/clients/munchly", headers=neha)).json()["firstExport"]
    assert (console["file"], console["by"], console["at"]) == (STORY["file"], STORY["by"], None)
    assert snap["distributors"]["rakesh"]["permission"] is None
    assert snap["distributors"]["lakshmi"]["permission"] is not None

    # the journey runs again from the start: the Watcher's next run flags both batches again
    clock.advance(minutes=5)
    batches = (await api.get("/internal/clients/munchly/batches", headers=AGENT)).json()["batches"]
    await agent(api, "/exports", "data-2", "data", batches=batches, mapped=8, rows=312, days=90, file="stock.csv")
    assert (await api.post(f"{WS}/setup/confirm", headers=PRIYA)).status_code == 200
    assert (await api.post(f"{WS}/permission", headers=RAKESH)).status_code == 200
    body = {
        "checked": 312,
        "distributors": 4,
        "batches": [{"ref": b["id"], "sellPerDay": b["sellPerDay"]} for b in batches],
    }
    out = await agent(api, "/detect", "watch-2", "watcher", **body)
    assert out["result"] == [HERO, MANGO]


async def test_a_reset_keeps_the_clients_configuration(api, munchly, neha, ctx):
    """the SKUs' gates, the guardrails and the day length are the client's, not the journey's"""
    r = await api.put("/v1/console/clients/munchly/clock", json={"dayMinutes": 30}, headers=neha)
    assert r.status_code == 200
    c = await ctx.session.get(m.Client, "munchly")
    c.offer_window_hours = 24
    await ctx.session.flush()
    await reset.reset(ctx, "munchly")
    await ctx.session.flush()
    await ctx.session.refresh(c)
    assert (c.day_minutes, c.offer_window_hours) == (30, 24)


async def test_a_reset_gives_a_workspace_from_before_sc110_its_food_banks_receipts(api, munchly, ctx):
    """a workspace built before SC-110 numbers no receipts and its food banks have no receipt, so collecting a donation
    issued none (SC-114). A reset gives it the story's series and its food banks the story's receipt and meals rule,
    and keeps a receipt a food bank already has"""
    receipts = [k for k in J["numbers"] if k.startswith("receipt.")]
    assert receipts
    # before SC-110: no receipt series (the app's login may not delete a series, so each moves aside)
    for kind in receipts:
        row = await ctx.session.get(m.DocumentNumber, ("munchly", kind))
        if row is not None:
            row.kind = "before-sc110." + kind
    banks = {
        b.name: b
        for b in (
            await ctx.session.execute(
                select(m.Partner).where(m.Partner.client_id == "munchly", m.Partner.kind == "foodbank")
            )
        ).scalars()
    }
    ifbn, fi = banks["India FoodBanking Network"], banks["Feeding India"]
    ifbn.details = {k: v for k, v in ifbn.details.items() if k not in ("receipt", "meals")}
    fi.details = {**fi.details, "receipt": {**fi.details["receipt"], "title": "Our own receipt"}}
    await ctx.session.flush()

    await reset.reset(ctx, "munchly")
    await ctx.session.flush()

    for kind in receipts:
        row = await ctx.session.get(m.DocumentNumber, ("munchly", kind))
        assert row is not None, kind
        assert (row.prefix, row.next, row.width) == tuple(J["numbers"][kind][k] for k in ("prefix", "next", "width"))
    await ctx.session.refresh(ifbn)
    await ctx.session.refresh(fi)
    story = {p["name"]: p for p in J["setup"]["partners"]}
    assert ifbn.details["receipt"] == story["India FoodBanking Network"]["receipt"]
    assert ifbn.details["meals"] == story["India FoodBanking Network"]["meals"]
    assert ifbn.details["minDays"] == story["India FoodBanking Network"]["minDays"]  # its intake rules stay
    assert fi.details["receipt"]["title"] == "Our own receipt"
