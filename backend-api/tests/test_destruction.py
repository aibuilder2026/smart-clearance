"""Packs destroyed at the distributor's godown (SC-139, option B): Munchly's route B. On expiry day the packs no channel
took wait for the distributor's evidence (two photos and the authorised agency's certificate number); Vision checks
it, the operator approves it or asks again, and only then does Impact report, with the expiry credit note (the dealer
price, the GST he reverses, grossed up, and the agency's charges) and the agency's certificate. He is reminded every two
journey days until the evidence comes in."""

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain import money
from tests.test_controls import C, _report_now, last_audit
from tests.test_workspace import (
    AGRAWAL,
    HERO,
    INVOKER,
    LAKSHMI,
    PRIYA,
    RAKESH,
    J,
    agent,
    case,
    to_plan,
)

WS = "/v1/workspaces/munchly"
CHIPS = J["skus"]["chips"]


async def leftover(api, cloud, neha) -> int:
    """the leftover run (SC-116) to expiry day: the lot awarded, one shop ordering, then Report now; the packs left"""
    from tests.conftest import token

    await to_plan(api, cloud)
    assert (await api.post(f"{WS}/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)).status_code == 200
    await agent(api, f"/cases/{HERO}/listing", "lister", "lister")
    await agent(api, f"/cases/{HERO}/offer", "outreach", "outreach")
    k = next(k for k in J["kiranas"] if k["distributor"] == "rakesh" and k["orders"])
    login = next(x for x in J["members"] if x["id"] == k["member"])["login"]
    assert (await api.post(f"{WS}/cases/{HERO}/orders", json={"units": k["orders"]}, headers=token(login))).is_success
    r = await api.post(f"{WS}/cases/{HERO}/bids", json={"price": 13}, headers=AGRAWAL)
    bid = r.json()["case"]["journey"]["bids"][-1]
    await agent(api, f"/cases/{HERO}/bids/{bid['id']}/answer", "negotiator-1", "negotiator")
    assert (await api.post(f"{WS}/cases/{HERO}/bids/{bid['id']}/accept", headers=AGRAWAL)).status_code == 200
    await _report_now(api, neha)
    return (await case(api, RAKESH))["destruction"]["units"]


async def photos(api, cloud, who=RAKESH, *, arrive: bool = True) -> dict[str, str]:
    ids = {}
    for which in ("before", "after"):
        r = await api.post(
            f"{WS}/cases/{HERO}/destruction/photos",
            json={"which": which, "contentType": "image/jpeg", "bytes": 4},
            headers=who,
        )
        assert r.status_code == 200, r.text
        ids[which] = r.json()["id"]
        if arrive:
            cloud.storage.objects[("photos-test", f"munchly/{HERO}/destruction-{which}-{ids[which]}")] = b"jpeg"
    return ids


def read(units: int, *, slate: int | None = None) -> dict:
    return {
        "before": {"batch": HERO, "count": units - 4, "confidence": 0.93},
        "after": {
            "slate": {"batch": HERO, "count": slate or units, "date": "02-10-26"},
            "landfill": True,
            "destroyed": True,
        },
    }


async def test_the_packs_left_wait_for_his_evidence_and_the_operators_yes(api, munchly, neha, cloud, ctx):
    left = await leftover(api, cloud, neha)
    assert left > 0
    dz = (await case(api, RAKESH))["destruction"]
    assert (dz["status"], dz["units"], dz["photos"], dz["checks"]) == ("requested", left, None, [])
    push = (await case(api, RAKESH))["push"]["destroy"]
    assert push["title"] == "Expired packs destroy karein" and f"{left} packs" in push["body"]
    timer = (await ctx.session.execute(select(m.Timer).where(m.Timer.kind == "destruction.remind"))).scalar_one()
    assert timer.fired_wall is None
    # the report waits: the batch closes on the operator's yes
    assert (await agent(api, f"/cases/{HERO}/report", "impact", "impact")).get("noop") is True
    c = await case(api, PRIYA)
    assert c["journey"]["phase"] == "settled"
    settle = money.expiry_settlement(left, c["sku"], "godown")
    assert c["expiry"]["amount"] == settle["amount"] == money.r2(left * 22 + left * 22 * 0.05 + left * 1.5)
    assert {d["id"]: d["status"] for d in c["docs"]}["destruction"] == "awaiting"

    # only the distributor holding the batch sends it, through an agency on the client's list in his city
    r = await api.post(
        f"{WS}/cases/{HERO}/destruction/photos",
        json={"which": "before", "contentType": "image/jpeg", "bytes": 4},
        headers=PRIYA,
    )
    assert r.status_code == 403
    r = await api.post(
        f"{WS}/cases/{HERO}/destruction/photos",
        json={"which": "before", "contentType": "image/jpeg", "bytes": 4},
        headers=LAKSHMI,
    )
    assert r.status_code == 403 and "holding this batch" in r.json()["message"]
    ids = await photos(api, cloud)
    send = lambda **b: api.post(  # noqa: E731
        f"{WS}/cases/{HERO}/destruction",
        json={"agency": "oce", "certificate": "OCE/DC/26-27/0219", "photos": ids} | b,
        headers=RAKESH,
    )
    r = await send(agency="dgw")
    assert r.status_code == 422 and r.json()["message"] == "Deccan Green Waste Management is not authorised in Nagpur."
    assert (await send(agency="nobody")).status_code == 422
    assert (await send(certificate=" ")).status_code == 422
    late = await photos(api, cloud, arrive=False)
    r = await send(photos=late)
    assert r.status_code == 422 and r.json()["message"] == "The before photo has not arrived yet. Send it again."
    assert (await api.post(f"{WS}/cases/{HERO}/destruction/approve", headers=PRIYA)).status_code == 409
    r = await send()
    assert r.status_code == 200, r.text
    dz = (await case(api, PRIYA))["destruction"]
    assert dz["status"] == "reading" and dz["agency"]["name"] == "Orange City Enviro Services"
    assert dz["photos"]["before"]["url"].startswith("https://storage.test/photos-test/")
    vision = [p for p in cloud.publisher.sent if p["payload"].get("type") == "destruction"]
    assert vision and set(vision[-1]["payload"]["photos"]) == {"before", "after"}
    assert (await send()).status_code == 409  # the evidence is in

    # Vision reads a slate that does not match: the check says so, and the operator asks again
    await agent(api, f"/cases/{HERO}/destruction/check", "vision-dz-1", "vision", read=read(left, slate=left + 10))
    dz = (await case(api, PRIYA))["destruction"]
    assert dz["status"] == "checked" and [x["ok"] for x in dz["checks"]] == [True, True, False, True]
    assert (
        dz["checks"][2]["label"] == f"The slate reads {HERO} · {left + 10} packets · 02-10-26, against the {left} left"
    )
    assert (await case(api, PRIYA))["push"]["destroyReview"]["title"] == "The destruction waits for your yes"
    assert (
        await api.post(f"{WS}/cases/{HERO}/destruction/ask", json={"reason": "x"}, headers=PRIYA)
    ).status_code == 422
    assert (
        await api.post(f"{WS}/cases/{HERO}/destruction/ask", json={"reason": "The count is off"}, headers=RAKESH)
    ).status_code == 403
    why = "The slate's count is not the packs left"
    r = await api.post(f"{WS}/cases/{HERO}/destruction/ask", json={"reason": why}, headers=PRIYA)
    assert r.status_code == 200, r.text
    dz = (await case(api, RAKESH))["destruction"]
    assert (dz["status"], dz["reason"]) == ("asked", why)
    assert (await case(api, RAKESH))["push"]["destroyAgain"]["body"].endswith(f"{why}. Photo dobara bhej dein.")

    # sent again, it checks, and the yes has Impact report
    ids = await photos(api, cloud)
    assert (await send(certificate="OCE/DC/26-27/0220")).status_code == 200
    await agent(api, f"/cases/{HERO}/destruction/check", "vision-dz-2", "vision", read=read(left))
    dz = (await case(api, PRIYA))["destruction"]
    assert dz["status"] == "checked" and all(x["ok"] for x in dz["checks"]), dz["checks"]
    assert [x["label"] for x in dz["checks"]] == [
        f"Batch {HERO} read on the carton label",
        f"About {round((left - 4) / 10) * 10} packs in view ({left} left)",
        f"The slate reads {HERO} · {left} packets · 02-10-26",
        "Both photos taken today, at the godown and the landfill",
    ]
    n = len(cloud.publisher.sent)
    r = await api.post(f"{WS}/cases/{HERO}/destruction/approve", headers=PRIYA)
    assert r.status_code == 200, r.text
    again = [p for p in cloud.publisher.sent[n:] if p["payload"].get("kind") == "report.due"]
    assert again, "the yes has Impact report"
    assert (await case(api, RAKESH))["push"]["destroyApproved"]["body"] == (
        f"Munchly approved your evidence. Expiry credit note of {money.fmt.inr(settle['amount'])} follows."
    )
    out = await agent(api, f"/cases/{HERO}/report", "impact-2", "impact")
    assert out["ledger"]["atGodown"] == left and out["ledger"]["expiry"]["amount"] == settle["amount"]

    # the papers: the note's three lines against the certificate, the agency's certificate, the memo keeping the credit
    c = await case(api, PRIYA)
    assert c["journey"]["phase"] == "cleared"
    docs = {d["id"]: d for d in c["docs"]}
    x = docs["expiry"]
    assert (x["no"][:3], x["amount"], x["credit"], x["gst"], x["charges"], x["certificate"]) == (
        "CN/",
        settle["amount"],
        left * 22,
        settle["gst"],
        settle["charges"],
        "OCE/DC/26-27/0220",
    )
    assert x["note"].endswith(
        "Issued against destruction certificate OCE/DC/26-27/0220; adjusted against Rakesh Traders' account."
    )
    cert = docs["destruction"]
    assert (cert["status"], cert["no"], cert["owner"], cert["units"], cert["approvedBy"]) == (
        "generated",
        "OCE/DC/26-27/0220",
        "Orange City Enviro Services",
        left,
        "Priya Deshmukh",
    )
    assert (cert["auth"], cert["for"]["name"], cert["reversed"]) == (
        "MPCB/SWM/NGP/0412",
        "Rakesh Traders",
        settle["reversal"],
    )
    itc = docs["itc"]
    assert itc["atGodown"] == left and itc["reversed"] == 0 and "keeps its own" in itc["note"]
    # the ledger counts them destroyed, and the note's amount as the credit
    row = next(r for r in (await api.get(f"{WS}/ledger", headers=PRIYA)).json()["batches"] if r["ref"] == HERO)
    assert (row["figures"]["destroyed"], row["figures"]["credit"]) == (left, settle["amount"])
    # every step, in the person's name
    texts = [(a["who"], a["text"]) for a in await last_audit(api, neha, 6)]
    assert ("Priya Deshmukh", f"approved the destruction of {left} packs at Kalamna Market godown") in texts
    assert ("Priya Deshmukh", f"asked again for the destruction's evidence: {why}") in texts
    assert ("Rakesh bhai", f"sent the destruction's evidence: {left} packs, Orange City Enviro Services") in texts

    # Rakesh's own pages: the evidence, its moments, and what the note credited him
    mine = next(x for x in (await api.get(f"{WS}/partner", headers=RAKESH)).json()["cases"] if x["ref"] == HERO)
    assert mine["destruction"]["status"] == "approved" and mine["destruction"]["photos"]["after"]["url"]
    steps = [s["step"] for s in mine["steps"]]
    assert steps.index("destroyAsk") < steps.index("destroySent") < steps.index("destroyApproved")
    assert mine["expiry"] == {
        "units": left,
        "credit": left * 22,
        "amount": settle["amount"],
        "at": "godown",
        "reversal": settle["reversal"],
        "charges": settle["charges"],
    }


async def test_he_is_reminded_every_two_journey_days_until_it_comes_in(api, munchly, neha, cloud, ctx, clock):
    await leftover(api, cloud, neha)
    clock.advance(days=2, minutes=1)
    r = await api.post("/internal/jobs/tick", headers=INVOKER)
    assert r.status_code == 200, r.text
    assert (await case(api, RAKESH))["push"]["destroyRemind"]["title"] == "Yaad dilana: destruction ka saboot"
    timers = (await ctx.session.execute(select(m.Timer).where(m.Timer.kind == "destruction.remind"))).scalars().all()
    assert len(timers) == 2 and sum(t.fired_wall is None for t in timers) == 1
    # the console does not list it: a reminder is not one of the journey's triggers
    triggers = (await api.get(f"{C}/munchly/journey", headers=neha)).json()["triggers"]
    assert not [t for t in triggers if t["key"] == "destruction.remind"]


async def test_with_visions_check_off_it_goes_straight_to_the_operator(api, munchly, neha, cloud, ctx):
    c = await ctx.session.get(m.Client, "munchly")
    c.destruction = {**c.destruction, "visionCheck": False}
    await ctx.session.commit()
    await leftover(api, cloud, neha)
    ids = await photos(api, cloud)
    body = {"agency": "vwc", "certificate": "VWC/DC/26-27/0041", "photos": ids}
    assert (await api.post(f"{WS}/cases/{HERO}/destruction", json=body, headers=RAKESH)).status_code == 200
    dz = (await case(api, PRIYA))["destruction"]
    assert (dz["status"], dz["checks"]) == ("checked", [])
    assert not [p for p in cloud.publisher.sent if p["payload"].get("type") == "destruction"]


async def test_the_console_sets_how_it_is_done(api, munchly, neha):
    c = (await api.get(f"{C}/munchly", headers=neha)).json()
    assert c["profile"]["expiry"] == "godown"
    dz = c["destruction"]
    assert {k: dz[k] for k in ("visionCheck", "remindDays", "grossUp", "chargesPerUnit")} == {
        "visionCheck": True,
        "remindDays": 2,
        "grossUp": True,
        "chargesPerUnit": 1.5,
    }
    r = await api.put(
        f"{C}/munchly/rules",
        json={"rules": c["rules"], "exits": c["exits"], "destruction": {**dz, "chargesPerUnit": 2, "remindDays": 3}},
        headers=neha,
    )
    assert r.status_code == 200, r.text
    assert (await last_audit(api, neha))[0]["text"] == (
        "Changed Munchly Foods's channels and rules: ask again after days 3; the agency's charges a pack 2"
    )
    bad = await api.put(
        f"{C}/munchly/rules",
        json={"rules": c["rules"], "exits": c["exits"], "destruction": {**dz, "chargesPerUnit": 50}},
        headers=neha,
    )
    assert bad.status_code == 422
    # the workspace reads it: the settings over the setup's agencies, their series and landfill
    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    assert snap["setup"]["expiry"] == "godown" and snap["setup"]["destruction"]["chargesPerUnit"] == 2
    oce = next(a for a in snap["setup"]["destruction"]["agencies"] if a["id"] == "oce")
    assert (oce["series"]["prefix"], oce["site"]) == ("OCE/DC/26-27/", "the municipal landfill, Nagpur")
    # and money.js's settlement follows them
    settle = money.expiry_settlement(10, CHIPS, "godown", opts={"chargesPerUnit": 2, "grossUp": True, "remindDays": 3})
    assert settle["charges"] == 20
