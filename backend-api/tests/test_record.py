"""A batch's record (SC-142): the operator reads every step of a batch, the agents' runs from its feed and each
person's decision from the audit log in their name, the shops' orders folded into one row; the distributor reads the
photos he sent, the label photo among them, on his own batch's page. The history's label photos are each batch's own.
On a compressed day each person's step keeps its place on the journey's clock."""

from datetime import datetime

from sqlalchemy import select

from sc_api import models as m
from sc_api.services.journey import history
from sc_api.services.reference import load
from tests.test_history import with_history  # noqa: F401 (the fixture)
from tests.test_workspace import HERO, PRIYA, RAKESH, WS, J, agent, detect, put_photo, setup

H = load("journey.json")["history"]
CHIKKI = "MF-2407-116"  # Rakesh Traders' Peanut Chikki: an ExpireSoon lot, the scheme short, destroyed at his godown


async def _record(api, ref: str, who=PRIYA) -> dict:
    r = await api.get(f"{WS}/cases/{ref}/record", headers=who)
    assert r.status_code == 200, r.text
    return r.json()


async def test_the_operator_reads_every_step_of_a_past_batch(api, with_history):  # noqa: F811
    rec = await _record(api, CHIKKI)
    steps = rec["steps"]
    assert rec["ref"] == CHIKKI
    assert [s["at"] for s in steps] == sorted(s["at"] for s in steps)
    agents = [s for s in steps if s["who"]["kind"] == "agent"]
    people = [s for s in steps if s["who"]["kind"] == "person"]
    # the agents' runs, in their own words, from the Watcher's flag to Impact's ledger
    assert agents[0]["who"]["name"] == "Watcher" and agents[-1]["key"] == "ledger"
    assert {"read", "value", "route", "list", "outreach", "counter", "papers", "destroyChecked"} <= {
        s["key"] for s in agents
    }
    # each person's decision, as the audit log keeps it, in their name and for whom they act
    keys = [s["key"] for s in people]
    assert keys[:2] == ["photo.send", "plan.approve"]
    assert {"listing.bid", "listing.accept", "dispatch.truck", "invoice.issue", "dispatch.van", "docs.review"} <= set(
        keys
    )
    assert {"destruction.send", "destruction.approve"} <= set(keys)
    photo = next(s for s in people if s["key"] == "photo.send")
    assert photo["who"] == {"kind": "person", "id": "rakesh", "name": "Rakesh bhai", "org": "Rakesh Traders"}
    # the yeses: the plan, the papers' review, the destruction, each Priya's
    yes = [s for s in steps if s["yes"]]
    assert [s["key"] for s in yes] == ["plan.approve", "docs.review", "destruction.approve"]
    assert {s["who"]["name"] for s in yes} == {"Priya Deshmukh"}
    assert yes[0]["text"] == "approved the plan · MF-2407-116 · net ₹16,226"
    # the shops' orders, one line a shop in the audit log, are one row holding them
    orders = [s for s in steps if s["key"] == "offer.order"]
    assert len(orders) == 1
    facts = next(x for x in H["partners"] if x["ref"] == CHIKKI)
    assert len(orders[0]["items"]) == len(facts["kiranas"]) == 24
    assert orders[0]["who"]["name"] == "24 kiranas" and orders[0]["who"]["org"] == "Rakesh Traders' scheme"
    assert orders[0]["text"] == "ordered 456 packets"
    # nothing is told twice: a person's step is the audit line, not the feed's
    assert not [
        s for s in steps if s["who"]["kind"] == "agent" and s["key"] in ("photo", "approved", "destroyApproved")
    ]


async def test_a_batch_record_is_the_operators(api, with_history):  # noqa: F811
    r = await api.get(f"{WS}/cases/{CHIKKI}/record", headers=RAKESH)
    assert r.status_code == 403
    r = await api.get(f"{WS}/cases/MF-0000-000/record", headers=PRIYA)
    assert r.status_code == 404


async def test_the_distributor_reads_the_photos_he_sent(api, with_history, ctx):  # noqa: F811
    r = await api.get(f"{WS}/partner", headers=RAKESH)
    assert r.status_code == 200, r.text
    c = next(x for x in r.json()["cases"] if x["ref"] == CHIKKI)
    photo = c["photo"]
    assert photo["url"].startswith("https://storage.test/photos-test/munchly/MF-2407-116/")
    assert photo["status"] == "verified"
    assert photo["read"]["batch"] == CHIKKI and photo["read"]["bestBefore"] == "2026-09-27"
    assert c["destruction"]["photos"]["before"]["url"] and c["destruction"]["photos"]["after"]["url"]
    # the photo is the batch's own label (design3/system/img/labels), a WebP
    name = photo["url"].split("/photos-test/")[1].split("?")[0]
    assert ctx.cloud.storage.objects[("photos-test", name)][:4] == b"RIFF"


async def test_a_compressed_day_keeps_each_step_where_it_fell(api, munchly, ctx, clock, cloud):
    """the audit log keeps the wall time only: each person's step lands on the journey's clock among the agents' runs"""
    c = await ctx.session.get(m.Client, "munchly")
    c.day_minutes = 60  # a journey hour every 2.5 wall minutes
    await ctx.session.commit()
    await setup(api)
    await detect(api)
    await agent(api, f"/cases/{HERO}/photo-request", "vision-ask", "vision")
    clock.advance(minutes=5)
    await put_photo(api, cloud, HERO)
    clock.advance(minutes=1)
    read = {"batch": HERO, "mrp": J["label"]["mrp"], "confidence": 0.97}
    await agent(api, f"/cases/{HERO}/photo-read", "vision-read", "vision", read=read)
    await agent(api, f"/cases/{HERO}/valuation", "valuer", "valuer")
    await agent(api, f"/cases/{HERO}/plan", "router", "router")
    clock.advance(minutes=5)
    assert (await api.post(f"{WS}/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)).status_code == 200
    clock.advance(minutes=1)
    await agent(api, f"/cases/{HERO}/listing", "lister", "lister")

    steps = (await _record(api, HERO))["steps"]
    keys = [s["key"] for s in steps]
    assert keys.index("ask") < keys.index("photo.send") < keys.index("read")
    assert keys.index("route") < keys.index("plan.approve") < keys.index("list")
    at = {s["key"]: datetime.fromisoformat(s["at"]) for s in steps}
    assert [s["at"] for s in steps] == sorted(s["at"] for s in steps)
    # five wall minutes are two journey hours on a 60-minute day
    assert (at["photo.send"] - at["ask"]).total_seconds() == 2 * 3600
    assert (at["plan.approve"] - at["route"]).total_seconds() == 2 * 3600
    assert (at["list"] - at["plan.approve"]).total_seconds() == 24 * 60


async def test_hydrate_puts_the_history_label_photos_where_their_cases_keep_them(ctx, with_history, cloud):  # noqa: F811
    """a workspace built before SC-142 kept the history's label photos in memory only: --photos puts them up"""
    cases = (
        (await ctx.session.execute(select(m.Case).where(m.Case.client_id == "munchly", m.Case.history.is_(True))))
        .scalars()
        .all()
    )
    names = {c.batch_ref: c.photo["object"] for c in cases}
    for name in names.values():
        cloud.storage.objects.pop(("photos-test", name), None)
    put = await history.put_labels(ctx, "munchly")
    assert put == sorted(names) and len(put) == 12
    for name in names.values():
        assert cloud.storage.objects[("photos-test", name)][:4] == b"RIFF"
