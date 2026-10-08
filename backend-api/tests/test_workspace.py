"""Munchly's live workspace (SC-66), end to end over HTTP: the story's journey walked step by step, each person
signed in with their own token (Munchly's people on munchly.example, everyone else on google.example), each agent
reporting through /internal with a Google ID token's stand-in. The figures are the journey map's (reference/flow.json
holds design3's own run of the same steps), and every role sees only its own cut."""

from datetime import datetime, timedelta

import pytest
from sqlalchemy import select

from sc_api import models as m
from sc_api.domain import copy
from sc_api.domain.clock import IST
from sc_api.services.reference import load
from tests.conftest import NEHA, token

FLOW = load("flow.json")
J = load("journey.json")
WS = "/v1/workspaces/munchly"
AGENT = {"Authorization": "Bearer internal:sc-agents@test.example"}
INVOKER = {"Authorization": "Bearer internal:sc-invoker@test.example"}
HERO = "MF-2409-117"
MANGO = "MF-2410-118"

PRIYA = token("priya.deshmukh@munchly.example")
ANITA = token("anita.rao@munchly.example")
VIKRAM = token("vikram.sethi@munchly.example")
ARJUN = token("arjun.nair@munchly.example")
RAKESH = token("rakesh-traders@google.example")
GANESH = token("shree-ganesh-kirana@google.example")
AGRAWAL = token("agrawal-wholesale@google.example")
MEERA = token("feeding-india@google.example")
LAKSHMI = token("lakshmi-agencies@google.example")


def flow(action: str) -> dict:
    return next(s for s in FLOW["steps"] if s["action"] == action)


async def agent(api, path: str, key: str, agent_id: str, **body) -> dict:
    r = await api.post(
        f"/internal/clients/munchly{path}", json={**body, "run": {"agent": agent_id, "eventKey": key}}, headers=AGENT
    )
    assert r.status_code == 200, r.text
    return r.json()


async def case(api, who, ref: str = HERO) -> dict:
    r = await api.get(f"{WS}/cases/{ref}", headers=who)
    assert r.status_code == 200, r.text
    return r.json()


async def put_photo(api, cloud, ref: str, who: dict | None = None) -> None:
    who = who or RAKESH
    r = await api.post(f"{WS}/cases/{ref}/photos", json={"contentType": "image/jpeg", "bytes": 120000}, headers=who)
    assert r.status_code == 200, r.text
    link = r.json()
    name = link["url"].split("photos-test/", 1)[1].split("?", 1)[0]
    cloud.storage.objects[("photos-test", name)] = b"jpeg"
    r = await api.post(f"{WS}/cases/{ref}/photos/{link['id']}", headers=who)
    assert r.status_code == 200, r.text


async def setup(api) -> None:
    batches = (await api.get("/internal/clients/munchly/batches", headers=AGENT)).json()["batches"]
    await agent(api, "/exports", "data-1", "data", batches=batches, mapped=8, rows=312, days=90, file="stock.csv")
    assert (await api.post(f"{WS}/setup/confirm", headers=PRIYA)).status_code == 200
    assert (await api.post(f"{WS}/permission", headers=RAKESH)).status_code == 200


async def detect(api) -> list[str]:
    batches = (await api.get("/internal/clients/munchly/batches", headers=AGENT)).json()["batches"]
    out = await agent(
        api,
        "/detect",
        "watch-1",
        "watcher",
        checked=312,
        distributors=4,
        batches=[{"ref": b["id"], "sellPerDay": b["sellPerDay"]} for b in batches],
    )
    return out["result"]


async def to_plan(api, cloud) -> None:
    await setup(api)
    assert await detect(api) == [HERO, MANGO]  # each at-risk batch its own journey (SC-86)
    await agent(api, f"/cases/{HERO}/photo-request", "vision-ask", "vision")
    await put_photo(api, cloud, HERO)
    label = J["label"]
    await agent(
        api,
        f"/cases/{HERO}/photo-read",
        "vision-read",
        "vision",
        read={"batch": HERO, "mfg": None, "bestBefore": None, "mrp": label["mrp"], "confidence": 0.97},
    )
    await agent(api, f"/cases/{HERO}/valuation", "valuer", "valuer")
    await agent(api, f"/cases/{HERO}/plan", "router", "router")


# --- signing in -------------------------------------------------------------------------------------------------------


async def test_the_console_still_reads_the_live_client(api, munchly, neha):
    """the live build's sign-in methods are the console's shape too (a 500 on every console call for Munchly, else)"""
    r = await api.get("/v1/console/clients/munchly", headers=neha)
    assert r.status_code == 200, r.text
    assert [x["id"] for x in r.json()["signIn"]] == [x["id"] for x in J["workspace"]["signIn"]]
    r = await api.put("/v1/console/clients/munchly/clock", json={"dayMinutes": 5}, headers=neha)
    assert r.status_code == 200, r.text


async def test_the_workspace_signs_its_members_in(api, munchly):
    public = (await api.get(WS)).json()
    assert public["name"] == "Munchly Foods" and public["signIn"][0]["id"] == "password"
    me = (await api.post(f"{WS}/session", headers=RAKESH)).json()
    assert me["email"] == "rakesh-traders@google.example" and me["role"] == "distributor" and me["orgRef"] == "rakesh"
    me = (await api.post(f"{WS}/session", headers=PRIYA)).json()
    assert me["email"].endswith("@munchly.example") and me["role"] == "operator" and me["access"] == "approver"
    # console staff are not members of a client's workspace
    assert (await api.get(f"{WS}/session", headers=token(NEHA))).status_code == 403
    assert (await api.get(f"{WS}/snapshot")).status_code == 401


async def test_every_member_is_on_email_and_the_right_domain(ctx, munchly):
    rows = (
        await ctx.session.execute(
            select(m.ClientMember, m.User)
            .join(m.User, m.User.id == m.ClientMember.user_id)
            .where(m.ClientMember.client_id == "munchly")
        )
    ).all()
    assert len(rows) == munchly["members"] >= 50
    for cm, u in rows:
        assert u.email and u.firebase_uid, cm.ref
        assert u.email.endswith("@munchly.example" if cm.member_class == "staff" else "@google.example"), u.email
    kiranas = (await ctx.session.execute(select(m.Kirana).where(m.Kirana.client_id == "munchly"))).scalars().all()
    assert len(kiranas) == 96 and all(k.member_ref for k in kiranas)
    # each distributor's own cluster: Rakesh Traders' 38 in Nagpur, Lakshmi Agencies' 58 in Hyderabad (SC-86)
    by = {d: sum(1 for k in kiranas if k.distributor_id == d) for d in ("rakesh", "lakshmi")}
    assert by == {"rakesh": 38, "lakshmi": 58}


# --- the journey ------------------------------------------------------------------------------------------------------


async def test_the_story_journey_end_to_end(api, munchly, cloud, ctx):
    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    assert snap["clock"]["day"] == 0 and snap["setup"]["confirmed"] is False
    assert snap["cases"] == []  # nothing staged ahead: each batch's journey starts at the Watcher's check (SC-86)

    await setup(api)
    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    assert snap["setup"]["confirmed"] and snap["setup"]["mapped"] == 8
    assert snap["distributors"]["rakesh"]["permission"]["by"] == "rakesh"

    # detect: the Watcher flags the chips batch (and the Mango Drink, its own journey) and tells Priya
    assert await detect(api) == [HERO, MANGO]
    c = await case(api, PRIYA)
    assert c["journey"]["phase"] == "at-risk" and c["batch"]["assess"]["atRisk"] == 1360
    assert [f["key"] for f in c["feed"]] == ["watch"]
    assert c["push"]["detect"]["title"] == "Masala Chips 150 g · Nagpur"
    published = [p["topic"] for p in cloud.publisher.sent]
    assert "test.batch.at_risk" in published and "test.notify" in published

    # verify: Vision asks Rakesh, he sends one photo, Vision reads it
    await agent(api, f"/cases/{HERO}/photo-request", "vision-ask", "vision")
    assert (await case(api, RAKESH))["journey"]["photo"]["status"] == "requested"
    await put_photo(api, cloud, HERO)
    assert (await case(api, PRIYA))["journey"]["photo"]["status"] == "reading"
    await agent(
        api,
        f"/cases/{HERO}/photo-read",
        "vision-read",
        "vision",
        read={"batch": HERO, "mrp": 30, "confidence": 0.97},
    )
    c = await case(api, PRIYA)
    assert c["journey"]["phase"] == "verified" and c["journey"]["photo"]["confidence"] == 0.97

    # value and decide: the money is money.js's
    await agent(api, f"/cases/{HERO}/valuation", "valuer", "valuer")
    await agent(api, f"/cases/{HERO}/plan", "router", "router")
    c = await case(api, PRIYA)
    want = flow("decide")
    assert c["journey"]["phase"] == "planned"
    assert c["plan"]["net"] == 21770 and round(c["plan"]["swing"]) == 26340
    assert [(ln["id"], ln["units"]) for ln in c["plan"]["lines"]] == [("kirana", 588), ("expiresoon", 772)]
    assert [f["key"] for f in c["feed"]][-2:] == ["route", "notify"] == [f["key"] for f in want["feed"]]
    assert c["plan"]["explanation"] == next(e for e in J["copy"]["events"] if e["key"] == "route")["text"]

    # approve: only the approver, once
    assert (await api.post(f"{WS}/cases/{HERO}/approval", json={"device": "phone"}, headers=ANITA)).status_code == 403
    r = await api.post(f"{WS}/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)
    assert r.status_code == 200 and r.json()["case"]["journey"]["plan"]["status"] == "approved"
    assert (await api.post(f"{WS}/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)).status_code == 409

    # execute: the listing and the scheme
    await agent(api, f"/cases/{HERO}/listing", "lister", "lister")
    await agent(api, f"/cases/{HERO}/offer", "outreach", "outreach")
    c = await case(api, PRIYA)
    assert c["journey"]["listing"] == {
        **c["journey"]["listing"],
        "id": "ES-24117",
        "units": 772,
        "price": 15,
        "reserve": 13.5,
        "status": "live",
    }
    assert c["journey"]["offer"]["shops"] == 38
    # the moments the screens state: the listing's address, and the van the morning after the scheme closes
    moments = c["moments"]
    assert moments["listingUrl"] == J["moments"]["listingUrl"].replace("{id}", "ES-24117")
    closes = datetime.fromisoformat(c["journey"]["offer"]["closesAt"]).astimezone(IST)
    leaves = datetime.fromisoformat(moments["van"]["leavesAt"]).astimezone(IST)
    assert f"{leaves:%H:%M}" == J["moments"]["van"]["leaves"] and timedelta(0) < leaves - closes <= timedelta(days=1)
    assert moments["van"]["depot"] == J["distributors"]["rakesh"]["godown"] and moments["planMinutes"] == 20
    assert moments["permissionAskedAt"] is not None and moments["day0"] is not None

    # the buyer never sees the reserve; a kirana sees only its own shop
    seen = await case(api, AGRAWAL)
    assert seen["journey"]["listing"]["reserve"] is None and seen["plan"] is None and seen["journey"]["offer"] is None
    shop = await case(api, GANESH)
    assert [k["id"] for k in shop["kiranas"]] == ["k0"] and shop["journey"]["listing"] is None

    # every kiranawala orders his own share; the scheme closes once it is full
    for k in J["kiranas"]:
        if not k["orders"] or k["distributor"] != "rakesh":
            continue
        member = next(x for x in J["members"] if x["id"] == k["member"])
        r = await api.post(f"{WS}/cases/{HERO}/orders", json={"units": k["orders"]}, headers=token(member["login"]))
        assert r.status_code == 200, (k["name"], r.text)
    c = await case(api, PRIYA)
    assert c["journey"]["offer"]["status"] == "closed" and sum(o["units"] for o in c["journey"]["orders"]) == 588
    assert "orders" in [f["key"] for f in c["feed"]]

    # the bid, the counter, the award
    r = await api.post(f"{WS}/cases/{HERO}/bids", json={"price": 13}, headers=AGRAWAL)
    assert r.status_code == 200
    bid = r.json()["case"]["journey"]["bids"][-1]
    assert (await api.post(f"{WS}/cases/{HERO}/bids", json={"price": 13}, headers=AGRAWAL)).status_code == 409
    await agent(api, f"/cases/{HERO}/bids/{bid['id']}/answer", "negotiator-1", "negotiator")
    seen = await case(api, AGRAWAL)
    assert seen["journey"]["bids"][-1]["status"] == "countered" and seen["journey"]["bids"][-1]["counter"] == 14.2
    assert [q["text"] for q in seen["journey"]["chat"]] == [x["text"] for x in J["copy"]["chat"][:2]]
    r = await api.post(f"{WS}/cases/{HERO}/bids/{bid['id']}/accept", headers=AGRAWAL)
    assert r.status_code == 200, r.text
    c = await case(api, PRIYA)
    assert c["award"] == {"units": 772, "price": 14.2, "gross": 10962.4, "token": 1644, "balance": 9318.4}
    assert round(c["actual"]["net"]) == 21152

    # settle: the truck, the papers, the invoice, the review, the van round, the shelf check
    r = await api.post(f"{WS}/cases/{HERO}/dispatches", json={"kind": "truck"}, headers=RAKESH)
    assert r.status_code == 200, r.text
    await agent(api, f"/cases/{HERO}/documents", "paperwork", "paperwork")
    c = await case(api, ANITA)
    docs = {d["id"]: d for d in c["docs"]}
    assert docs["invoice"]["no"] == "INV/26-27/0931" and docs["invoice"]["total"] == 11510
    assert docs["support"]["no"] == "CN/0117" and docs["support"]["amount"] == 8768
    assert docs["eway"]["status"] == "not required"
    today = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()["clock"]["now"]
    assert docs["invoice"]["date"] == datetime.fromisoformat(today).astimezone(IST).date().isoformat()
    assert (await api.post(f"{WS}/cases/{HERO}/documents/invoice/issue", headers=RAKESH)).status_code == 200
    assert (await api.post(f"{WS}/cases/{HERO}/review", headers=ANITA)).status_code == 200
    assert (await api.post(f"{WS}/cases/{HERO}/dispatches", json={"kind": "van"}, headers=RAKESH)).status_code == 200
    counts = [
        {"kirana": k["id"], "left": J["shelf"]["left"] if k["name"] == J["shelf"]["shop"] else k["orders"] // 4}
        for k in J["kiranas"]
        if k["orders"] and k["distributor"] == "rakesh"
    ]
    await agent(api, f"/cases/{HERO}/shelf-check", "shelf", "outreach", counts=counts)
    c = await case(api, PRIYA)
    shelf = J["shelf"]
    assert {k: c["shelf"][k] for k in ("shop", "took", "left", "pickUp", "leave")} == {
        k: shelf[k] for k in ("shop", "took", "left", "pickUp", "leave")
    }

    # report: the ledger posts, the batch clears, and the console's batch closes with what it recovered
    out = await agent(api, f"/cases/{HERO}/report", "impact", "impact")
    assert round(out["ledger"]["net"]) == 21152
    c = await case(api, PRIYA)
    assert c["journey"]["phase"] == "cleared" and c["journey"]["posted"]
    batch = await ctx.session.get(m.Batch, ("munchly", HERO))
    await ctx.session.refresh(batch)
    assert batch.closed_at is not None and round(batch.recovered) == 21152 and batch.outcome == "cleared"
    keys = [f["key"] for f in c["feed"]]
    story = [e["key"] for e in J["copy"]["events"] if e["key"] not in ("permit", "donate")]
    # the same entries as design3's timeline (here every kirana ordered before the bid, so two swap places)
    assert sorted(keys) == sorted(story) and keys[:9] == story[:9]


def shops(distributor: str) -> list[dict]:
    return [k for k in J["kiranas"] if k["distributor"] == distributor]


def login(member_id: str) -> dict:
    return token(next(x for x in J["members"] if x["id"] == member_id)["login"])


async def mango_to_approved(api, cloud) -> dict:
    """the Mango Drink to Priya's yes: Lakshmi Agencies sends its label, the Valuer and the Router plan it"""
    await setup(api)
    assert await detect(api) == [HERO, MANGO]
    # Vision asks the batch's own distributor for the label: Lakshmi Agencies, not Rakesh Traders
    await agent(api, f"/cases/{MANGO}/photo-request", "vision-ask-m", "vision")
    assert (await case(api, LAKSHMI, MANGO))["journey"]["photo"]["status"] == "requested"
    assert (await api.get(f"{WS}/cases/{MANGO}", headers=RAKESH)).status_code == 404
    await put_photo(api, cloud, MANGO, LAKSHMI)
    label = J["labels"][MANGO]
    read = {"batch": MANGO, "mfg": None, "bestBefore": None, "mrp": label["mrp"], "confidence": 0.96}
    await agent(api, f"/cases/{MANGO}/photo-read", "vision-read-m", "vision", read=read)
    await agent(api, f"/cases/{MANGO}/valuation", "valuer-m", "valuer")
    await agent(api, f"/cases/{MANGO}/plan", "router-m", "router")
    c = await case(api, PRIYA, MANGO)
    lines = [(ln["id"], ln["units"]) for ln in c["plan"]["lines"]]
    assert lines == [("kirana", 1372), ("staff", 150), ("foodbank", 58)]
    # the Router's words name every line, and Lakshmi Agencies' own cluster
    assert "58 kiranas" in c["plan"]["explanation"] and "staff sale" in c["plan"]["explanation"]
    r = await api.post(f"{WS}/cases/{MANGO}/approval", json={"device": "desktop"}, headers=PRIYA)
    assert r.status_code == 200, r.text
    return c


async def test_the_mango_drinks_journey_end_to_end(api, munchly, cloud, ctx):
    """SC-86: the story's second batch runs its whole journey, as any batch does. Its plan is a kirana scheme, a staff
    sale and a food bank, each run by its own people; the papers follow only once all three are done, and the ledger
    counts what each took. What no channel took is left at the godown."""
    from sc_api.domain import money

    planned = await mango_to_approved(api, cloud)
    # the staff sale opens at Lakshmi Agencies' godown, for her to run and record
    seen = await case(api, LAKSHMI, MANGO)
    staff = seen["journey"]["staff"]
    godown = J["distributors"]["lakshmi"]["godown"]
    assert (staff["status"], staff["units"], staff["price"], staff["godown"]) == ("open", 150, 8, godown)
    assert seen["push"]["staff.open"]["title"] == "Staff sale · Mango Drink"

    # execute: the scheme to Lakshmi Agencies' own kiranas, the food bank booked; no ExpireSoon lot in this plan
    await agent(api, f"/cases/{MANGO}/offer", "outreach-m", "outreach")
    await agent(api, f"/cases/{MANGO}/donation", "donation-m", "outreach")
    assert (await agent(api, f"/cases/{MANGO}/listing", "lister-m", "lister")).get("noop") is True
    c = await case(api, PRIYA, MANGO)
    assert c["journey"]["offer"]["shops"] == len(shops("lakshmi")) == 58 and c["journey"]["listing"] is None
    mango = await case(api, MEERA, MANGO)
    assert mango["donation"]["partner"] == "Feeding India" and mango["donation"]["units"] == 58
    # the Donation agent proposes the next day at the partner's hour, with the slots it may move to, and its spot
    booked = datetime.fromisoformat(mango["donation"]["at"]).astimezone(IST)
    pickup = datetime.fromisoformat(mango["donation"]["pickupAt"]).astimezone(IST)
    assert pickup.date() == (booked + timedelta(days=1)).date()
    assert f"{pickup:%H:%M}" == J["moments"]["donation"]["time"]
    assert len(mango["donation"]["slots"]) == len(J["moments"]["donation"]["slots"])
    assert mango["donation"]["spot"] == J["moments"]["donation"]["story"]["spot"]
    summary = next(x for x in (await api.get(f"{WS}/snapshot", headers=MEERA)).json()["cases"] if x["ref"] == MANGO)
    assert summary["donation"] == 58

    # three Hyderabad shops order, by hand; a Nagpur shop was not offered this scheme
    took = shops("lakshmi")[:3]
    for k in took:
        r = await api.post(f"{WS}/cases/{MANGO}/orders", json={"units": 4 * k["sales14"]}, headers=login(k["member"]))
        assert r.status_code == 200, (k["name"], r.text)
    ordered = sum(4 * k["sales14"] for k in took)
    assert (await api.post(f"{WS}/cases/{MANGO}/orders", json={"units": 4}, headers=GANESH)).status_code == 403

    # the food bank confirms and collects; the case waits for the scheme and the staff sale
    r = await api.post(f"{WS}/cases/{MANGO}/donation/confirm", headers=MEERA)
    assert r.status_code == 200
    done = r.json()["case"]["donation"]
    assert done["reply"] == copy.pickup_reply(day=copy.weekday(pickup), spot=done["spot"])
    assert (await api.post(f"{WS}/cases/{MANGO}/donation/collect", headers=MEERA)).status_code == 200
    assert (await case(api, PRIYA, MANGO))["journey"]["phase"] == "executing"
    await agent(api, f"/cases/{MANGO}/offer/close", "close-m", "outreach")
    assert (await case(api, PRIYA, MANGO))["journey"]["phase"] == "executing"  # the staff sale is still open

    # the staff sale: Lakshmi Agencies' to record, within the line, once
    bad = await api.post(f"{WS}/cases/{MANGO}/staff-sale", json={"sold": 120}, headers=RAKESH)
    assert bad.status_code == 403
    bad = await api.post(f"{WS}/cases/{MANGO}/staff-sale", json={"sold": 151}, headers=LAKSHMI)
    assert bad.status_code == 422 and bad.json()["message"] == "Between 0 and 150 packs."
    r = await api.post(f"{WS}/cases/{MANGO}/staff-sale", json={"sold": 120}, headers=LAKSHMI)
    assert r.status_code == 200, r.text
    assert r.json()["case"]["journey"]["phase"] == "dispatched"  # the last of the three: the papers follow
    assert (await api.post(f"{WS}/cases/{MANGO}/staff-sale", json={"sold": 1}, headers=LAKSHMI)).status_code == 409
    assert (await case(api, PRIYA, MANGO))["push"]["staff.recorded"]["body"] == (
        "Lakshmi Agencies sold 120 of 150 packs to staff."
    )

    # the papers: no buyer's invoice, and no credit note (no distributor's price to support), so no number is spent
    await agent(api, f"/cases/{MANGO}/documents", "paperwork-m", "paperwork")
    c = await case(api, PRIYA, MANGO)
    assert {"invoice", "support"}.isdisjoint(d["id"] for d in c["docs"])
    left = 1372 - ordered + 30
    want = money.realised(planned["plan"], c["sku"], {"kirana": ordered, "staff": 120, "foodbank": 58})
    lines = [{"id": "kirana", "units": ordered}, {"id": "staff", "units": 120}, {"id": "foodbank", "units": 58}]
    assert c["realised"] == {"lines": lines, "godown": left} and want["godown"] == left
    assert c["actual"]["net"] == want["net"] < planned["plan"]["net"]

    # settle and report: the van to the shops that ordered, the shelf check, the ledger on what happened
    assert (await api.post(f"{WS}/cases/{MANGO}/dispatches", json={"kind": "van"}, headers=LAKSHMI)).status_code == 200
    counts = [{"kirana": k["id"], "left": k["sales14"]} for k in took]
    await agent(api, f"/cases/{MANGO}/shelf-check", "shelf-m", "outreach", counts=counts)
    out = await agent(api, f"/cases/{MANGO}/report", "impact-m", "impact")
    assert (out["ledger"]["net"], out["ledger"]["godown"], out["ledger"]["meals"]) == (want["net"], left, 58)
    batch = await ctx.session.get(m.Batch, ("munchly", MANGO))
    await ctx.session.refresh(batch)
    assert batch.outcome == "cleared" and round(batch.recovered, 2) == want["net"]
    # the close tells Priya what the godown still holds (SC-87), and Lakshmi Agencies' staff pay to its own address
    closed = (await case(api, PRIYA, MANGO))["push"]["closed"]
    assert closed["title"] == f"Batch closed · {money.fmt.num(left)} packs left at the godown"
    assert closed["body"].endswith(f"{money.fmt.num(left)} packs no channel took are at Begum Bazaar godown.")
    snap = (await api.get(f"{WS}/snapshot", headers=LAKSHMI)).json()
    assert snap["distributors"]["lakshmi"]["upi"] == J["distributors"]["lakshmi"]["upi"]


async def test_a_food_bank_can_turn_the_pickup_down(api, munchly, cloud):
    """the food bank declines: the packs stay at the godown, the approver is told, and the case goes on without them"""
    await mango_to_approved(api, cloud)
    await agent(api, f"/cases/{MANGO}/offer", "outreach-m", "outreach")
    await agent(api, f"/cases/{MANGO}/donation", "donation-m", "outreach")
    assert (await api.post(f"{WS}/cases/{MANGO}/donation/decline", headers=GANESH)).status_code == 403
    r = await api.post(f"{WS}/cases/{MANGO}/donation/decline", headers=MEERA)
    assert r.status_code == 200, r.text
    assert r.json()["case"]["donation"]["status"] == "declined"
    assert (await api.post(f"{WS}/cases/{MANGO}/donation/collect", headers=MEERA)).status_code == 409
    push = (await case(api, PRIYA, MANGO))["push"]["donation.declined"]
    assert push["body"] == "58 packs stay at the godown: Feeding India turned the pickup down."
    await agent(api, f"/cases/{MANGO}/offer/close", "close-m", "outreach")
    r = await api.post(f"{WS}/cases/{MANGO}/staff-sale", json={"sold": 150}, headers=LAKSHMI)
    assert r.json()["case"]["journey"]["phase"] == "dispatched"
    await agent(api, f"/cases/{MANGO}/documents", "paperwork-m", "paperwork")
    c = await case(api, PRIYA, MANGO)
    assert c["realised"]["godown"] == 1372 + 58 and c["realised"]["lines"][-1] == {"id": "foodbank", "units": 0}


async def test_a_redelivered_event_acts_once(api, munchly, cloud):
    await setup(api)
    assert await detect(api) == [HERO, MANGO]
    await agent(api, f"/cases/{HERO}/photo-request", "vision-ask", "vision")
    again = await agent(api, f"/cases/{HERO}/photo-request", "vision-ask", "vision")
    assert again.get("noop") is True
    c = await case(api, PRIYA)
    assert [f["key"] for f in c["feed"]] == ["watch", "ask"]


async def test_a_wrong_label_asks_again(api, munchly, cloud):
    await setup(api)
    await detect(api)
    await agent(api, f"/cases/{HERO}/photo-request", "vision-ask", "vision")
    await put_photo(api, cloud, HERO)
    await agent(
        api,
        f"/cases/{HERO}/photo-read",
        "vision-read",
        "vision",
        read={"batch": "MF-2409-999", "mrp": 30, "confidence": 0.95},
    )
    c = await case(api, RAKESH)
    assert c["journey"]["photo"]["status"] == "requested" and "retake" in c["push"]


@pytest.mark.parametrize(
    ("read", "why"),
    [
        (
            {"batch": None, "mfg": None, "bestBefore": None, "mrp": None, "confidence": 0.95},
            "the label could not be read",
        ),
        ({"bestBefore": "2026-11-18", "mrp": 30, "confidence": 0.95}, "the batch number could not be read"),
    ],
)
async def test_a_label_read_without_its_batch_number_asks_again(api, munchly, cloud, read, why):
    """however sure the model says it is: the first live eval run had Vision return only its confidence (SC-77)"""
    await setup(api)
    await detect(api)
    await agent(api, f"/cases/{HERO}/photo-request", "vision-ask", "vision")
    await put_photo(api, cloud, HERO)
    await agent(api, f"/cases/{HERO}/photo-read", "vision-read", "vision", read=read)
    c = await case(api, RAKESH)
    photo = c["journey"]["photo"]
    assert photo["status"] == "requested" and photo["read"]["matches"] is False
    assert photo["read"]["mismatches"] == [why] and why in c["push"]["retake"]["body"]
    text = (await case(api, PRIYA))["feed"][-1]["text"]
    assert "Matches the DMS record" not in text and "Read the label: ," not in text


async def test_the_negotiator_never_goes_under_the_reserve(api, munchly, cloud):
    await to_plan(api, cloud)
    await api.post(f"{WS}/cases/{HERO}/approval", json={"device": "desktop"}, headers=PRIYA)
    await agent(api, f"/cases/{HERO}/listing", "lister", "lister")
    r = await api.post(f"{WS}/cases/{HERO}/bids", json={"price": 9}, headers=AGRAWAL)
    bid = r.json()["case"]["journey"]["bids"][-1]
    # a model's reply that names another price is refused; the template answers
    await agent(api, f"/cases/{HERO}/bids/{bid['id']}/answer", "neg", "negotiator", reply="Fine, ₹9 it is for all 772.")
    seen = await case(api, AGRAWAL)
    assert seen["journey"]["bids"][-1]["counter"] == 14.2
    assert "₹9" not in seen["journey"]["chat"][-1]["text"]


async def test_partners_see_only_their_cut(api, munchly):
    await setup(api)
    await detect(api)
    snap = (await api.get(f"{WS}/snapshot", headers=GANESH)).json()
    assert snap["batches"] == [] and snap["cases"] == []
    snap = (await api.get(f"{WS}/snapshot", headers=RAKESH)).json()
    assert {b["distributor"] for b in snap["batches"]} == {"rakesh"}
    assert all(c["net"] is None for c in snap["cases"])
    assert (await api.get(f"{WS}/cases/{HERO}", headers=AGRAWAL)).status_code == 404  # nothing listed yet
    assert (await api.get(f"{WS}/audit", headers=RAKESH)).status_code == 403
    assert (await api.get(f"{WS}/audit", headers=ARJUN)).status_code == 200


async def test_the_stream_and_the_inbox(api, munchly):
    await setup(api)
    await detect(api)
    page = (await api.get(f"{WS}/events?after=0", headers=PRIYA)).json()
    kinds = [e["type"] for e in page["events"]]
    assert "feed" in kinds and "notification" in kinds and "case" in kinds
    mine = [e for e in page["events"] if e["type"] == "notification"]
    assert all(e["notification"]["to"] == "priya" for e in mine)
    rakesh = (await api.get(f"{WS}/events?after=0", headers=RAKESH)).json()
    assert not [e for e in rakesh["events"] if e["type"] == "feed"]  # the timeline is Munchly's own
    # the stream sends the same, as server-sent events
    r = await api.get(f"{WS}/events/stream?after=0", headers=PRIYA)
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/event-stream")
    assert "event: feed" in r.text and "event: notification" in r.text and r.text.rstrip().endswith("data: {}")
    # read all
    unread = [n for n in (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()["notifications"] if not n["read"]]
    assert unread
    assert (await api.post(f"{WS}/notifications/read", json={"all": True}, headers=PRIYA)).status_code == 200
    assert not [n for n in (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()["notifications"] if not n["read"]]


async def test_the_notifier_pushes_to_a_members_devices(api, munchly, cloud):
    assert (
        await api.post(f"{WS}/devices", json={"token": "tok-1", "userAgent": "Chrome"}, headers=PRIYA)
    ).status_code == 204
    await setup(api)
    await detect(api)
    import base64
    import json

    def envelope(p):
        return {"message": {"data": base64.b64encode(json.dumps(p["payload"]).encode()).decode()}}

    for note in [p for p in cloud.publisher.sent if p["topic"] == "test.notify"]:
        r = await api.post("/internal/pubsub/notify", json=envelope(note), headers=INVOKER)
        assert r.status_code == 200
    pushed = next(d for t, d in cloud.messenger.sent if d["link"] == f"/command/{HERO}")
    assert pushed["title"].startswith("Masala Chips") and pushed["ref"] == HERO
    assert all(t == ["tok-1"] for t, _ in cloud.messenger.sent)  # Priya's device only
    # pushed once, however often Pub/Sub delivers it
    sent = len(cloud.messenger.sent)
    for note in [p for p in cloud.publisher.sent if p["topic"] == "test.notify"]:
        await api.post("/internal/pubsub/notify", json=envelope(note), headers=INVOKER)
    assert len(cloud.messenger.sent) == sent


async def test_the_notifier_drops_gone_devices_and_logs_what_fcm_refuses(api, munchly, cloud, ctx, caplog):
    import base64
    import json
    import logging
    import re

    for t in ("tok-ok", "tok-gone", "tok-refused"):
        r = await api.post(f"{WS}/devices", json={"token": t, "userAgent": "Chrome"}, headers=PRIYA)
        assert r.status_code == 204
    cloud.messenger.gone.add("tok-gone")
    cloud.messenger.refused["tok-refused"] = "PERMISSION_DENIED"
    await setup(api)
    await detect(api)
    notes = [p for p in cloud.publisher.sent if p["topic"] == "test.notify"]
    assert notes
    with caplog.at_level(logging.WARNING, logger="sc_api.notifier"):
        for note in notes:
            data = base64.b64encode(json.dumps(note["payload"]).encode()).decode()
            r = await api.post("/internal/pubsub/notify", json={"message": {"data": data}}, headers=INVOKER)
            assert r.status_code == 200
    # firebase_admin reports a gone device as NOT_FOUND: its token is dropped, and the refused one kept
    tokens = set((await ctx.session.execute(select(m.Device.token))).scalars())
    assert "tok-gone" not in tokens and {"tok-ok", "tok-refused"} <= tokens
    # a refusal is a warning in the form infra/prod/monitoring.tf's log-based metric counts; a gone device is not
    lines = [r.getMessage() for r in caplog.records if r.name == "sc_api.notifier"]
    refusal = re.compile(r"notification \d+: FCM refused 1 of [23] device\(s\): PERMISSION_DENIED")
    assert lines and all(refusal.fullmatch(x) for x in lines)


async def test_internal_routes_need_an_allowed_caller(api, munchly):
    assert (await api.get("/internal/clients/munchly/batches")).status_code == 401
    bad = {"Authorization": "Bearer internal:someone@test.example"}
    assert (await api.get("/internal/clients/munchly/batches", headers=bad)).status_code == 403
    assert (await api.get("/internal/clients/munchly/batches", headers=PRIYA)).status_code == 401


async def test_the_tick_runs_the_daily_agents_on_journey_time(api, munchly, clock, cloud):
    from datetime import timedelta

    r = await api.post("/internal/jobs/tick", headers=INVOKER)
    assert r.status_code == 200
    # the journey starts at 08:00 on day 0 and the clock runs in real time with no batch at risk: nothing is due yet
    assert r.json()["clients"]["munchly"]["daily"] == []
    clock.advance(minutes=31)
    r = await api.post("/internal/jobs/tick", headers=INVOKER)
    assert r.json()["clients"]["munchly"]["daily"] == ["data"]
    due = [p for p in cloud.publisher.sent if p["payload"].get("type") == "agent.due"]
    assert due[-1]["payload"]["agent"] == "data" and due[-1]["payload"]["files"]
    clock.advance(minutes=timedelta(minutes=30).seconds // 60)
    r = await api.post("/internal/jobs/tick", headers=INVOKER)
    assert r.json()["clients"]["munchly"]["daily"] == []  # the Watcher waits for the setup to be confirmed


async def test_compressed_days_run_while_a_batch_is_at_risk(api, munchly, ctx):
    c = await ctx.session.get(m.Client, "munchly")
    c.day_minutes = 2
    await ctx.session.commit()
    await setup(api)
    await detect(api)
    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    assert snap["clock"]["compressed"] is True and snap["clock"]["dayMinutes"] == 2


async def test_the_agents_see_the_figures_before_they_write(api, munchly, cloud):
    await setup(api)
    await detect(api)
    await agent(api, f"/cases/{HERO}/photo-request", "vision-ask", "vision")
    await put_photo(api, cloud, HERO)
    await agent(
        api, f"/cases/{HERO}/photo-read", "vision-read", "vision", read={"batch": HERO, "mrp": 30, "confidence": 0.97}
    )
    rows = (await api.get(f"/internal/clients/munchly/cases/{HERO}/valuation-preview", headers=AGENT)).json()["rows"]
    assert [r["id"] for r in rows] == ["expiresoon", "kirana", "staff", "foodbank", "writeoff"]
    await agent(api, f"/cases/{HERO}/valuation", "valuer", "valuer")
    preview = (await api.get(f"/internal/clients/munchly/cases/{HERO}/plan-preview", headers=AGENT)).json()
    assert preview["plan"]["net"] == 21770 and preview["offered"] == 38
    # the Router's own words, when every figure in them is the plan's (the kiranas offered included, as the template)
    words = (
        "588 to the kirana scheme, capped by what 38 kiranas can move in 14 days, and 772 to ExpireSoon: net ₹21,770, "
        "against a ₹26,330 write-off."
    )
    await agent(api, f"/cases/{HERO}/plan", "router", "router", explanation=words)
    assert (await case(api, PRIYA))["plan"]["explanation"] == words


# --- the snapshot's world, and a change made twice -----------------------------------------------------------------


async def test_the_snapshot_carries_what_the_screens_state(api, munchly):
    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    public = (await api.get(WS)).json()
    assert public["emailDomain"] == "munchly.example" and public["hint"] == "name@munchly.example"
    # the story's people on the sign-in, by address only
    people = [p for g in public["accounts"] for p in g["people"]]
    assert {"priya", "rakesh", "agrawal", "meera"} <= {p["id"] for p in people}
    assert next(p for p in people if p["id"] == "priya")["email"] == "priya.deshmukh@munchly.example"
    assert all("password" not in p for p in people)
    assert public["accounts"][0]["note"] == "@munchly.example"
    w = snap["workspace"]
    assert w["emailDomain"] == "munchly.example" and w["hint"] == "name@munchly.example"
    assert w["invite"]["contact"].endswith("@google.example")
    assert snap["client"]["listed"] == J["client"]["listed"] and snap["client"]["skus"] == len(snap["skus"])
    assert snap["market"]["minOrder"] == J["market"]["minOrder"] and len(snap["market"]["lots"]) == 4
    assert snap["setup"]["channelNames"] == J["setup"]["channelNames"] and snap["setup"]["minutes"] == 15
    assert snap["setup"]["dms"]["file"] == J["setup"]["dms"]["file"]
    assert snap["stages"][0]["sees"] == J["stages"][0]["sees"]
    priya = next(x for x in snap["members"] if x["id"] == "priya")
    assert priya["title"] == J["people"]["priya"]["role"]


async def test_a_change_retried_with_its_key_acts_once(api, munchly, cloud):
    await to_plan(api, cloud)
    assert (await api.post(f"{WS}/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)).status_code == 200
    await agent(api, f"/cases/{HERO}/offer", "outreach", "outreach")
    once = {**GANESH, "Idempotency-Key": "order-1"}
    units = next(k["orders"] for k in J["kiranas"] if k["id"] == "k0")
    first = await api.post(f"{WS}/cases/{HERO}/orders", json={"units": units}, headers=once)
    again = await api.post(f"{WS}/cases/{HERO}/orders", json={"units": units}, headers=once)
    assert first.status_code == again.status_code == 200, again.text
    assert [o["units"] for o in again.json()["case"]["journey"]["orders"]] == [units]
    # another member's key is their own; the same key on another change is refused
    other = await api.post(f"{WS}/notifications/read", json={"all": True}, headers=once)
    assert other.status_code == 422
    mine = {**PRIYA, "Idempotency-Key": "order-1"}
    fresh = await api.post(f"{WS}/notifications/read", json={"all": True}, headers=mine)
    assert fresh.status_code == 200


async def test_partners_see_their_beat_their_line_and_the_pushes_they_show(api, munchly, cloud):
    await to_plan(api, cloud)
    assert (await api.post(f"{WS}/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)).status_code == 200
    await agent(api, f"/cases/{HERO}/listing", "lister", "lister")
    await agent(api, f"/cases/{HERO}/offer", "outreach", "outreach")
    # a distributor sees the kiranas on his beat; a kirana sees its distributor, and no other kirana
    rakesh = {m["id"] for m in (await api.get(f"{WS}/snapshot", headers=RAKESH)).json()["members"]}
    assert {"ganesh", "jaidurga"} <= rakesh and "patil-owner" not in rakesh
    ganesh = {m["id"] for m in (await api.get(f"{WS}/snapshot", headers=GANESH)).json()["members"]}
    assert "rakesh" in ganesh and "jaidurga" not in ganesh
    # the split without Munchly's figures: all of it for the distributor, a kirana the scheme's line
    seen = await case(api, RAKESH)
    assert [x["id"] for x in seen["split"]] == ["kirana", "expiresoon"] and "net" not in seen["split"][0]
    assert seen["push"]["offer"]["to"] != "rakesh"  # the offer his kiranas got
    shop = await case(api, GANESH)
    assert [x["id"] for x in shop["split"]] == ["kirana"] and shop["split"][0]["packPrice"] is not None
    # staff see each push the journey sent
    assert {"detect", "verify", "plan", "approved", "offer"} <= set((await case(api, PRIYA))["push"])


async def test_the_data_agent_maps_exports_by_names_and_item_codes(api, munchly):
    """SC-72: the Data agent maps a DMS export's distributor names and item codes to their ids, and Outreach's offer
    says how long the scheme lasts"""
    out = (await api.get("/internal/clients/munchly/batches", headers=AGENT)).json()
    assert out["distributors"]["rakesh"]["name"] == "Rakesh Traders"
    assert out["skus"]["chips"] == {"code": "MF-MC-150", "name": "Masala Chips 150 g"}
    agents = (await api.get("/internal/clients/munchly/agents", headers=AGENT)).json()
    assert agents["offerWindowHours"] == 48


async def test_an_export_is_written_once(cloud):
    """the API creates objects and never replaces them: a journey started again on the same day keeps its exports"""
    assert await cloud.storage.write("exports-test", "munchly/day.csv", b"first", "text/csv") is True
    assert await cloud.storage.write("exports-test", "munchly/day.csv", b"second", "text/csv") is False
    assert cloud.storage.objects[("exports-test", "munchly/day.csv")] == b"first"


async def test_a_journey_starts_again_on_the_storys_own_calendar(ctx, munchly):
    """a synthetic workspace replays the story: every reset starts on the story's day 0 (the label photos, the papers
    and the copy all carry its dates), however many times it is reset (SC-75)"""
    from sc_api.services.journey import reset

    first = await reset.reset(ctx, "munchly")
    second = await reset.reset(ctx, "munchly")
    assert first["day0"] == second["day0"] == J["day0"]
    open_cases = (
        (await ctx.session.execute(select(m.Case).where(m.Case.client_id == "munchly", m.Case.status == "open")))
        .scalars()
        .all()
    )
    assert open_cases == []  # nothing staged ahead (SC-86)


async def test_a_journey_started_again_keeps_the_gates_set_on_a_batch(api, munchly, neha, ctx):
    """a batch's gate override is the client's configuration (SC-47): starting the journey again keeps it, and the
    workspace judges the batch by it, as the console shows it (SC-82)"""
    from sc_api.services.journey import reset

    biscuits = "MF-2409-204"
    why = "Zepto's Pune warehouse agreed to take this lot at 30% of its life"
    r = await api.put(
        f"/v1/console/clients/munchly/batches/{biscuits}/override", json={"qcomPct": 30, "reason": why}, headers=neha
    )
    assert r.status_code == 200, r.text
    await reset.reset(ctx, "munchly")
    await ctx.session.flush()
    rows = (await api.get("/v1/console/clients/munchly/batches", headers=neha)).json()
    b = next(x for x in rows if x["ref"] == biscuits)
    assert (b["qcomPct"], [g["source"] for g in b["checks"]][1:]) == (30, ["override", "override"])
    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    a = next(x for x in snap["batches"] if x["id"] == biscuits)["assess"]
    assert [(g["id"], g["pass"]) for g in a["gates"]] == [("blinkit", True), ("zepto", True), ("instamart", True)]
    assert a["status"] == "safe"


async def test_a_journey_started_again_shows_no_case_an_earlier_journey_finished(api, munchly, ctx, clock):
    """a case an earlier journey finished stays in the record, but the journey started again does not show it: the
    snapshot, the batch's case and the agents' read all begin at the reset, until the Watcher flags the batch again
    (SC-81)"""
    from sc_api.services.journey import reset

    await setup(api)
    assert await detect(api) == [HERO, MANGO]
    # the hero's journey played through to its report, as the maintainer's had been
    old = (
        await ctx.session.execute(select(m.Case).where(m.Case.client_id == "munchly", m.Case.batch_ref == HERO))
    ).scalar_one()
    old.status, old.phase, old.stage, old.closed_at = "cleared", "cleared", 9, old.opened_at
    await ctx.session.flush()
    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    assert {c["ref"]: c["phase"] for c in snap["cases"]}[HERO] == "cleared"

    clock.advance(minutes=5)
    await reset.reset(ctx, "munchly")
    await ctx.session.flush()
    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    assert snap["cases"] == []
    assert next(b for b in snap["batches"] if b["id"] == HERO)["phase"] is None
    assert (await api.get(f"{WS}/cases/{HERO}", headers=PRIYA)).status_code == 404
    assert (await api.get(f"/internal/clients/munchly/cases/{HERO}", headers=AGENT)).status_code == 404
    assert (await api.get(f"{WS}/cases/{MANGO}", headers=PRIYA)).status_code == 404
    # nothing is deleted: the earlier journey's case is still in the record
    await ctx.session.refresh(old)
    assert old.status == "cleared"

    # the journey goes on as before: the Watcher flags the hero again, and its new case is the one shown
    clock.advance(minutes=5)
    batches = (await api.get("/internal/clients/munchly/batches", headers=AGENT)).json()["batches"]
    await agent(api, "/exports", "data-2", "data", batches=batches, mapped=8, rows=312, days=90, file="stock.csv")
    assert (await api.post(f"{WS}/setup/confirm", headers=PRIYA)).status_code == 200
    assert (await api.post(f"{WS}/permission", headers=RAKESH)).status_code == 200
    out = await agent(
        api,
        "/detect",
        "watch-2",
        "watcher",
        checked=312,
        distributors=4,
        batches=[{"ref": b["id"], "sellPerDay": b["sellPerDay"]} for b in batches],
    )
    assert out["result"] == [HERO, MANGO]
    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    assert {c["ref"]: c["phase"] for c in snap["cases"]}[HERO] == "at-risk"
    assert (await case(api, PRIYA))["journey"]["phase"] == "at-risk"


async def test_a_partners_member_stands_for_its_organisation(api, munchly):
    """SC-92: the buyer's member carries Agrawal Wholesale, as the reference data names it, though the story's import
    made the member first under the person's own name"""
    snap = (await api.get(f"{WS}/snapshot", headers=AGRAWAL)).json()
    me = next(x for x in snap["members"] if x["id"] == "agrawal")
    assert me["org"] == next(x for x in J["members"] if x["id"] == "agrawal")["org"] == "Agrawal Wholesale"
