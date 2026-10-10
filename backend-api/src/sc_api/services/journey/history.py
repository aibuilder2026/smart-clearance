"""A client's history (SC-123): the batches its workspace cleared before the story's journey, built through the
journey's own steps on the schedule design3 gives them (data.js HISTORY, reference/journey.json `history`).

Each batch is opened on its day, judged by the Watcher, its label read, valued, planned and approved by Priya; then the
listing, the scheme, the donation and the staff sale run as the plan has them, the kiranas order (fewer, when the
history says so), the buyer takes the Negotiator's counter, the food bank collects, the distributor loads the truck,
issues his invoice and runs his van, Paperwork drafts the pack, Priya reviews it, and on its best-before the report
settles what is left and posts the ledger. Every step is the service the live journey runs, at its time: the clock is
the history's, real time, so each paper carries its own day and the numbers follow in the order they were issued.

The agents' part runs in process with backend-api's own templates (no model is asked), and nothing reaches a person or
an agent: the history's messages are marked sent, its pushes none and its timers fired. Only Paperwork is asked, once
the history is built, to lay out the PDFs of each batch's papers and its receipt."""

from collections.abc import Awaitable, Callable
from dataclasses import replace
from datetime import date, datetime, timedelta
from importlib import resources
from typing import Any

from sqlalchemy import select

from sc_api import models as m
from sc_api.cloud import Cloud, FakeMessenger, FakePublisher, FakeStorage
from sc_api.domain import journey as J
from sc_api.domain.clock import DAY_MINUTES, IST, FixedClock
from sc_api.identity import synthetic_uid
from sc_api.services import supply
from sc_api.services.context import SYSTEM, Ctx
from sc_api.services.journey import steps, views, world
from sc_api.services.presenter import lock_client
from sc_api.services.reference import load

PHOTO = b"\xff\xd8\xff\xe0 history label photo"
EVIDENCE = resources.files("sc_api.reference").joinpath("evidence")
As = Callable[[str, datetime], Awaitable[Ctx]]
# the PDFs Paperwork lays out once the history is built: the pack (settle) and the food bank's receipt
PAPERS = {"settle", "receipt"}


def _at(when: str) -> datetime:
    return datetime.fromisoformat(when).replace(tzinfo=IST)


async def built(ctx: Ctx, client_id: str) -> bool:
    found = await ctx.session.execute(
        select(m.Batch.ref).where(m.Batch.client_id == client_id, m.Batch.history.is_(True)).limit(1)
    )
    return found.first() is not None


async def build(ctx: Ctx, client_id: str) -> int:
    """builds the client's history once; returns how many batches it cleared (0 when there is none, or it is built)"""
    h = load("journey.json").get("history")
    if not h or await built(ctx, client_id):
        return 0
    j = load("journey.json")
    members = {x["id"]: x for x in j["members"]}
    # the history's photos land in memory: only their size is read
    storage = FakeStorage()
    hx = replace(ctx, cloud=Cloud(FakePublisher(), storage, FakeMessenger()))
    batches = {b["ref"]: b for b in h["batches"]}
    timeline = sorted((s["at"], ref, i, s["step"]) for ref, b in batches.items() for i, s in enumerate(b["steps"]))
    first = _at(timeline[0][0])

    real = ctx.cloud  # the history's evidence photos also go to the photos bucket, where the screens read them

    async def as_(who: str, at: datetime) -> Ctx:
        x = replace(hx, clock=FixedClock(at))
        if who == "system":
            return x.acting_as(SYSTEM)
        # a member the history has act signs in as they would have then, so an invited one becomes active; the story's
        # start (reset.py) puts every member back as the story has them
        actor, _ = await views.signed_in(x, client_id, synthetic_uid(members[who]["login"]), activate=True)
        return x.acting_as(actor)

    c = await lock_client(ctx, client_id)
    # the papers are numbered from where the history began, and the story's numbers follow on from them
    for kind, start in h["start"].items():
        row = await ctx.session.get(m.DocumentNumber, (client_id, kind), with_for_update=True)
        n = j["numbers"][kind]
        if row is None:
            ctx.session.add(
                m.DocumentNumber(client_id=client_id, kind=kind, prefix=n["prefix"], next=start, width=n["width"])
            )
        else:
            row.next = start
    # Munchly went live on the history's first day: Setup confirmed and both distributors' permission given then; the
    # story's start (reset.py) puts them back as the story has them
    c.setup_confirmed_at, c.setup_confirmed_by = first, members["priya"]["name"]
    for d in (await world.distributors(ctx, client_id)).values():
        if d.id in {b["distributor"] for b in batches.values()}:
            d.permission, d.permission_paused, d.permission_given_at = "given", False, first
    # the client's clock runs at real time from the history's first morning, whatever day length the client runs its
    # journey at (a step's save applies it while a case is open): a step's journey time is its own
    day_minutes = c.day_minutes
    c.day_minutes = DAY_MINUTES
    c.clock_anchor_wall, c.clock_anchor_journey, c.clock_speed = first, first, DAY_MINUTES
    await ctx.session.flush()

    bids: dict[str, str] = {}
    for when, ref, _, step in timeline:
        b, at = batches[ref], _at(when)
        try:
            await _step(as_, hx, storage, client_id, b, step, at, bids, members, j, real)
        except steps.Noop:  # a step that had nothing to do: the history no longer matches this workspace's setup
            case = await _case(hx, client_id, ref)
            lines = [(ln["id"], ln["units"]) for ln in (case.plan or {}).get("lines", [])]
            raise RuntimeError(
                f"history: {ref}'s {step} at {when} had nothing to do (phase {case.phase}, plan {lines})"
            ) from None
    await _quiet(ctx, client_id, set(batches))
    c.day_minutes = day_minutes  # the client's own day length again: its configuration
    await ctx.session.flush()
    return len(batches)


async def _step(
    as_: As,
    hx: Ctx,
    storage: FakeStorage,
    client_id: str,
    b: dict[str, Any],
    step: str,
    at: datetime,
    bids: dict[str, str],
    members: dict[str, Any],
    j: dict[str, Any],
    real: Cloud | None = None,
) -> None:
    ref = b["ref"]
    dist = next(
        x["id"] for x in j["members"] if j["org"].get(x["id"]) == b["distributor"] and x["role"] == "distributor"
    )
    if step == "open":
        x = await as_("system", at)
        await supply.open_batch(
            x,
            client_id,
            ref=ref,
            sku=b["sku"],
            distributor=b["distributor"],
            units=b["units"],
            at=at,
            best_before=date.fromisoformat(b["bestBefore"]),
        )
        batch = await x.session.get(m.Batch, (client_id, ref))
        assert batch is not None
        batch.mfg, batch.sell_per_day, batch.history = date.fromisoformat(b["mfg"]), b["sellPerDay"], True
        await x.session.flush()
    elif step == "detect":
        x = await as_("system", at)
        flagged = await steps.detect(
            x, client_id, {"batches": [{"ref": ref, "sellPerDay": b["sellPerDay"]}]}, None, only={ref}
        )
        if flagged != [ref]:
            raise RuntimeError(f"history: the Watcher did not flag {ref}")
        case = await _case(x, client_id, ref)
        case.history = True
        await steps.photo_request(x, client_id, ref, None)
    elif step == "photo":
        x = await as_(dist, at)
        link = await steps.photo_upload(x, client_id, ref, "image/jpeg", len(PHOTO))
        storage.objects[(hx.settings.photos_bucket, f"{client_id}/{ref}/{link['id']}")] = PHOTO
        await steps.photo_sent(x, client_id, ref, link["id"])
    elif step == "read":
        sku = j["skus"][b["sku"]]
        read = {"batch": ref, "mfg": b["mfg"], "bestBefore": b["bestBefore"], "mrp": sku["mrp"], "confidence": 0.97}
        if not await steps.photo_read(await as_("system", at), client_id, ref, read, None):
            raise RuntimeError(f"history: Vision did not verify {ref}'s label")
    elif step == "value":
        await steps.valuation(await as_("system", at), client_id, ref, None, None)
    elif step == "route":
        await steps.plan(await as_("system", at), client_id, ref, None, None)
    elif step == "approve":
        await steps.approve(await as_("priya", at), client_id, ref, "laptop")
    elif step == "listing":
        await steps.listing(await as_("system", at), client_id, ref, None, None, None)
    elif step == "offer":
        await steps.offer(await as_("system", at), client_id, ref, None, None)
    elif step == "donation":
        await steps.donation(await as_("system", at), client_id, ref, None)
    elif step == "pickup":
        await steps.confirm_pickup(await as_(await _bank(hx, client_id, b, members), at), client_id, ref)
    elif step == "orders":
        await _orders(as_, client_id, b, at, j)
    elif step == "bid":
        bids[ref] = await steps.bid(await as_("agrawal", at), client_id, ref, b["bid"])
    elif step == "counter":
        await steps.answer_bid(await as_("system", at), client_id, ref, bids[ref], None, None)
    elif step == "accept":
        await steps.accept(await as_("agrawal", at), client_id, ref, bids[ref])
    elif step == "collect":
        await steps.collect(await as_(await _bank(hx, client_id, b, members), at), client_id, ref)
    elif step == "closeOffer":
        await steps.close_offer(await as_("system", at), client_id, ref, None)
    elif step == "staff":
        await steps.staff_sale(await as_(dist, at), client_id, ref, b["staff"])
    elif step == "truck":
        await steps.dispatch(await as_(dist, at), client_id, ref, "truck")
    elif step == "papers":
        await steps.documents(await as_("system", at), client_id, ref, None)
    elif step == "invoice":
        await steps.issue_invoice(await as_(dist, at), client_id, ref)
    elif step == "van":
        await steps.dispatch(await as_(dist, at), client_id, ref, "van")
    elif step == "review":
        await steps.review(await as_("priya", at), client_id, ref)
    # destroyed at the godown on expiry day (SC-139): asked, the evidence sent that afternoon and checked, and Priya's
    # yes the next morning, before Impact reports
    elif step == "destroyAsk":
        await steps.expire(await as_("system", at), client_id, ref)
    elif step == "destroySent":
        await _destroy_sent(as_, hx, storage, client_id, b, dist, at, real)
    elif step == "destroyApproved":
        await steps.approve_destruction(await as_("priya", at), client_id, ref)
    elif step == "report":  # expiry day: what is left settles, then Impact posts the ledger (SC-94)
        x = await as_("system", at)
        if (await _case(x, client_id, ref)).expired_at is None:
            await steps.expire(x, client_id, ref)
        await steps.report(x, client_id, ref, None)
    else:
        raise RuntimeError(f"history: no step {step!r}")


async def _destroy_sent(
    as_: As,
    hx: Ctx,
    storage: FakeStorage,
    client_id: str,
    b: dict[str, Any],
    dist: str,
    at: datetime,
    real: Cloud | None,
) -> None:
    """his evidence: each photo taken at its time and sent with the agency's certificate, then Vision's read of them,
    which holds to the batch"""
    ref, dz = b["ref"], b["destruction"]
    ids: dict[str, str] = {}
    for which in steps.DZ_WHICH:
        data = EVIDENCE.joinpath(f"{ref}-{which}.webp").read_bytes()
        x = await as_(dist, _at(dz["photos"][which]))
        link = await steps.destruction_photo(x, client_id, ref, which, "image/webp", len(data))
        name = f"{client_id}/{ref}/destruction-{which}-{link['id']}"
        storage.objects[(hx.settings.photos_bucket, name)] = data
        if real is not None and hx.settings.photos_bucket:
            await real.storage.write(hx.settings.photos_bucket, name, data, "image/webp")
        ids[which] = link["id"]
    await steps.send_destruction(await as_(dist, at), client_id, ref, dz["agency"], dz["certificate"], ids)
    units = int(b["expect"]["atGodown"])
    read = {
        "before": {"batch": ref, "count": units, "confidence": 0.95},
        "after": {"slate": {"batch": ref, "count": units, "date": dz["slate"]}, "landfill": True, "destroyed": True},
    }
    await steps.destruction_checked(await as_("system", at + timedelta(minutes=5)), client_id, ref, read, None)


async def _bank(ctx: Ctx, client_id: str, b: dict[str, Any], members: dict[str, Any]) -> str:
    """the member who acts for the food bank the Donation step booked, which design3 names too (its first fit)"""
    booked = ((await _case(ctx, client_id, b["ref"])).donation or {}).get("partnerName")
    if booked != b.get("partner"):
        raise RuntimeError(f"history: {b['ref']}'s donation went to {booked}, not {b.get('partner')}")
    return next(k for k, x in members.items() if x["role"] == "foodbank" and x["org"] == booked)


async def _orders(as_: As, client_id: str, b: dict[str, Any], at: datetime, j: dict[str, Any]) -> None:
    """the distributor's kiranas order the history's packets, each within its cap, two minutes apart"""
    x = await as_("system", at)
    case = await _case(x, client_id, b["ref"])
    caps = {k: int(v) for k, v in (case.offer or {}).get("caps", {}).items()}
    left = int(b["kirana"]["ordered"])
    shops = [k for k in j["kiranas"] if k["distributor"] == b["distributor"] and k["id"] in caps]
    for i, k in enumerate(shops):
        if left <= 0:
            break
        units = min(caps[k["id"]], left)
        await steps.order(await as_(k["member"], at + timedelta(minutes=2 * i)), client_id, b["ref"], units)
        left -= units
    if left:
        raise RuntimeError(f"history: {b['ref']}'s kiranas could not order {left} more packets")


async def _case(ctx: Ctx, client_id: str, ref: str) -> m.Case:
    case = (
        (
            await ctx.session.execute(
                select(m.Case).where(m.Case.client_id == client_id, m.Case.batch_ref == ref).order_by(m.Case.seq.desc())
            )
        )
        .scalars()
        .first()
    )
    assert case is not None
    return case


async def _quiet(ctx: Ctx, client_id: str, refs: set[str]) -> None:
    """nothing of the history reaches a person or an agent: its messages are marked sent (but Paperwork's, which lay out
    its PDFs), its pushes none, its timers fired"""
    now = ctx.clock.now()
    cases = (
        (await ctx.session.execute(select(m.Case).where(m.Case.client_id == client_id, m.Case.history.is_(True))))
        .scalars()
        .all()
    )
    ids = {x.id for x in cases}
    for row in (await ctx.session.execute(select(m.Outbox).where(m.Outbox.published_wall.is_(None)))).scalars():
        p = row.payload or {}
        if p.get("client") != client_id or (p.get("ref") not in refs and p.get("notification") is None):
            continue
        if p.get("notification") is not None:
            n = await ctx.session.get(m.Notification, p["notification"])
            if n is None or n.case_id not in ids:
                continue
        if row.topic.endswith("." + J.STEP) and p.get("type") in PAPERS and p.get("ref") in refs:
            continue
        row.published_wall = now
    for n in (await ctx.session.execute(select(m.Notification).where(m.Notification.case_id.in_(ids)))).scalars():
        n.push_status = "none"
    for t in (
        await ctx.session.execute(select(m.Timer).where(m.Timer.case_id.in_(ids), m.Timer.fired_wall.is_(None)))
    ).scalars():
        t.fired_wall = now
    await ctx.session.flush()
