"""Standing in for a demo workspace's partners from the console (SC-215): the kiranas' scheme a judge can't fill alone,
filled as the story has it, each shop ordering as itself with its own tax invoice, topped up until the scheme is full;
a shop that ordered or said Not this time left alone."""

from sqlalchemy import select

from sc_api import models as m
from tests.test_workspace import LAKSHMI, MANGO, PRIYA, WS, agent, case, login, mango_to_approved, shops

C = "/v1/console/clients"
FILL = f"{C}/munchly/journey/stand-ins/kiranas-{MANGO}"


async def journey(api, h) -> dict:
    r = await api.get(f"{C}/munchly/journey", headers=h)
    assert r.status_code == 200, r.text
    return r.json()


async def offered(api, cloud) -> list[dict]:
    """the Mango Drink approved and its scheme sent to Lakshmi Agencies' 58 kiranas; its shops, in the story's order"""
    await mango_to_approved(api, cloud)
    await agent(api, f"/cases/{MANGO}/offer", "outreach-m", "outreach")
    return shops("lakshmi")


async def order(api, k: dict, units: int) -> None:
    r = await api.post(f"{WS}/cases/{MANGO}/orders", json={"units": units}, headers=login(k["member"]))
    assert r.status_code == 200, (k["name"], r.text)


async def test_the_scheme_filled_as_the_story_has_it(api, munchly, cloud, neha, ctx):
    assert (await journey(api, neha))["standIns"] == []  # nothing waits on a partner before a scheme is sent
    ks = await offered(api, cloud)
    # a judge orders as the first two shops, each its story share
    await order(api, ks[0], ks[0]["orders"])
    await order(api, ks[1], ks[1]["orders"])
    (x,) = (await journey(api, neha))["standIns"]
    assert x == {
        "id": f"kiranas-{MANGO}",
        "kind": "kiranas",
        "ref": MANGO,
        "distributor": "Lakshmi Agencies",
        "shops": 58,
        "ordered": 2,
        "declined": 0,
        "units": 1372,
        "placed": 52,
        "fill": {"shops": 50, "units": 1320, "story": 1320},
        "filled": None,
        "blocked": None,
    }
    n = len(cloud.publisher.sent)
    r = await api.post(FILL, headers=neha)
    assert r.status_code == 200, r.text
    (x,) = r.json()["standIns"]
    assert (x["ordered"], x["placed"], x["blocked"]) == (52, 1372, "The scheme is full")
    assert {k: x["filled"][k] for k in ("shops", "units")} == {"shops": 50, "units": 1320}
    assert x["filled"]["at"].endswith("+05:30")
    # the scheme filled, so it closed: its window's timer has nothing left to close, and leaves the schedule
    assert "offer.close" not in [t["key"] for t in r.json()["triggers"]]
    c = await case(api, PRIYA, MANGO)
    assert c["journey"]["offer"]["status"] == "closed"
    assert (len(c["journey"]["orders"]), sum(o["units"] for o in c["journey"]["orders"])) == (52, 1372)
    assert c["journey"]["phase"] == "executing"  # the staff sale and the food bank are still to come

    # each shop ordered as itself, its story share, with its own tax invoice in Lakshmi Agencies' series
    rows = (
        (await ctx.session.execute(select(m.CaseOrder).join(m.Case).where(m.Case.batch_ref == MANGO))).scalars().all()
    )
    got = {o.kirana_id: o.units for o in rows}
    assert got == {k["id"]: k["orders"] for k in ks if k["orders"]}
    numbers = [o.invoice["no"] for o in sorted(rows, key=lambda o: o.id)]
    assert len(set(numbers)) == 52 and all(no.startswith("LA/26-27/") for no in numbers)
    member = {k["id"]: k["member"] for k in ks}
    assert all(o.member_ref == member[o.kirana_id] for o in rows)
    # the Paperwork agent lays out the 50 new invoices
    kirana = [p["payload"] for p in cloud.publisher.sent[n:] if p["payload"].get("type") == "kirana"]
    assert len(kirana) == 50

    # Neha's audit lines: one for each shop she stood in for, then the fill's
    log = (await api.get("/v1/console/audit", headers=neha)).json()
    assert (log[0]["who"], log[0]["text"]) == (
        "Neha Kulkarni",
        "Filled MF-2410-118's kirana scheme for Munchly Foods: 50 shops ordered 1,320 packets",
    )
    stood = [a["text"] for a in log[1:51]]
    assert all(a["who"] == "Neha Kulkarni" for a in log[1:51])
    assert f"ordered {ks[2]['orders']} packets for {ks[2]['name']}" in stood
    # the batch's record counts every shop's order, and says who stood in
    steps = (await api.get(f"{WS}/cases/{MANGO}/record", headers=PRIYA)).json()["steps"]
    orders = next(s for s in steps if s["key"] == "offer.order")
    assert (orders["who"]["name"], orders["text"]) == ("52 kiranas", "ordered 1,372 packets")
    fill = next(s for s in steps if s["key"] == "offer.fill")
    assert fill["who"]["name"] == "Neha Kulkarni"

    # once filled, it can't be done again
    again = await api.post(FILL, headers=neha)
    assert again.status_code == 409 and again.json()["message"] == "The scheme is not open."


async def test_it_tops_up_and_leaves_a_shop_that_declined_alone(api, munchly, cloud, neha, ctx):
    ks = await offered(api, cloud)
    # the second shop orders short of its story share, and the third says Not this time
    await order(api, ks[0], ks[0]["orders"])
    await order(api, ks[1], 24)
    r = await api.post(f"{WS}/cases/{MANGO}/offer/decline", headers=login(ks[2]["member"]))
    assert r.status_code == 200, r.text
    (x,) = (await journey(api, neha))["standIns"]
    # the story's shares of the shops still to answer leave 36 packets: the shops with room take them
    assert (x["ordered"], x["declined"], x["placed"]) == (2, 1, 48)
    assert x["fill"] == {"shops": 50, "units": 1324, "story": 1288}
    r = await api.post(FILL, headers=neha)
    assert r.status_code == 200, r.text
    rows = (
        (await ctx.session.execute(select(m.CaseOrder).join(m.Case).where(m.Case.batch_ref == MANGO))).scalars().all()
    )
    got = {o.kirana_id: o.units for o in rows}
    assert ks[2]["id"] not in got  # she said Not this time
    assert sum(got.values()) == 1372
    # at its cap: Saraswathi Kirana's 4 topped up to its 28, and the next shop with room takes the last 12
    assert (got["h51"], got["h52"]) == (28, 12)
    assert (await case(api, PRIYA, MANGO))["journey"]["offer"]["status"] == "closed"


async def test_only_a_demo_workspace_has_stand_ins_and_only_while_its_scheme_is_open(api, munchly, cloud, neha, ctx):
    ks = await offered(api, cloud)
    assert (await api.post(f"{C}/munchly/journey/stand-ins/nope", headers=neha)).status_code == 404
    # a shop of the story may not stand in for others; the distributor neither
    for who in (login(ks[0]["member"]), LAKSHMI):
        assert (await api.post(FILL, headers=who)).status_code in (401, 403)
    # a real client's workspace has none
    c = await ctx.session.get(m.Client, "munchly")
    c.workspace_doc = {**(c.workspace_doc or {}), "synthetic": False}
    await ctx.session.commit()
    assert (await journey(api, neha))["standIns"] == []
    r = await api.post(FILL, headers=neha)
    assert r.status_code == 409
    assert r.json()["message"] == "Only a demo workspace has stand-ins, and Munchly Foods' workspace isn't one."
    c.workspace_doc = {**c.workspace_doc, "synthetic": True}
    await ctx.session.commit()
    # closed short from the console, the scheme has nothing waiting on its shops
    timer = next(t for t in (await journey(api, neha))["triggers"] if t["key"] == "offer.close")
    assert (await api.post(f"{C}/munchly/journey/triggers/{timer['id']}", headers=neha)).status_code == 200
    assert (await journey(api, neha))["standIns"] == []
    r = await api.post(FILL, headers=neha)
    assert r.status_code == 409 and r.json()["message"] == "The scheme is not open."
