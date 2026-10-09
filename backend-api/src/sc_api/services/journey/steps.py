"""The journey's steps (SC-66): every person's move and every agent's result, each one change in one transaction with
its timeline entry, its pushes, its audit line, the agents' next event, and the console's view of the batch kept in
step. backend-api computes every figure here (domain/money.py); an agent brings what it read or wrote (a label, a
reason, an offer's words, a reply), and a template stands in for whatever it leaves out or gets wrong.

The order is design3's journey (domain/journey.py). Nothing here acts for a person: the journey waits for them.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import func, or_, select

from sc_api import models as m
from sc_api.domain import copy, money
from sc_api.domain import journey as J
from sc_api.domain.clock import IST
from sc_api.errors import ApiError, not_found
from sc_api.services import agents as agent_runs
from sc_api.services import audit, exports, supply
from sc_api.services.context import Ctx
from sc_api.services.journey import events as ev
from sc_api.services.journey import views, world
from sc_api.services.presenter import lock_client

PHOTO_MAX_BYTES = 8 * 1024 * 1024
LISTING_DAYS = 9  # an ExpireSoon lot that has found no buyer by then closes unsold (the channel clears in 5-9 days)
MESSAGES_PER_HOUR = 20
MESSAGE_MAX = 500


class Noop(Exception):
    """the step was already taken (a redelivered event, a step another call took first): nothing to do"""


@dataclass
class Run:
    """an agent's run, as the agent reports it: the event it answered (so a redelivery acts once), its trace and the
    model it called"""

    agent: str
    event_key: str | None = None
    run_id: str | None = None
    trace_id: str | None = None
    model: str | None = None
    fallback: bool | None = None
    latency_ms: int | None = None


@dataclass
class Scene:
    c: m.Client
    case: m.Case
    batch: m.Batch
    sku: m.Sku
    dist: m.Distributor
    agents: dict[str, dict[str, Any]]
    rules: dict[str, Any]

    @property
    def ref(self) -> str:
        return self.case.batch_ref

    def sku_obj(self) -> dict[str, Any]:
        return world.sku_obj(self.sku)

    def batch_obj(self, today) -> dict[str, Any]:
        return world.batch_obj(self.batch, self.dist, today)


def stale(message: str) -> ApiError:
    """409: the journey has moved on (or not got there yet); the app reads the case again"""
    return ApiError(409, message)


# --- loading --------------------------------------------------------------------------------------------------------


async def _world(ctx: Ctx, c: m.Client, batch: m.Batch) -> tuple[m.Sku, m.Distributor, dict, dict]:
    x = await ctx.session.get(m.Sku, (c.id, batch.sku_id))
    d = await ctx.session.get(m.Distributor, (c.id, batch.distributor_id), with_for_update=True)
    assert x is not None and d is not None
    agents = await world.agent_settings(ctx, c.id)
    return x, d, agents, world.money_rules(c, agents)


async def scene(ctx: Ctx, client_id: str, ref: str, *, cleared: bool = False) -> Scene:
    """a batch's open case, its client locked for the change (so the change, its stream position and its audit line
    see one state). With cleared, the batch's case in this journey as the workspace shows it, open or the last one
    closed: a pack drafted on expiry day, which clears the batch at once, is still reviewed and its invoice issued
    (SC-117)"""
    c = await lock_client(ctx, client_id)
    q = select(m.Case).where(m.Case.client_id == client_id, m.Case.batch_ref == ref)
    if cleared:
        since = views.journey_from(c)
        if since is not None:  # this journey's cases, and the client's history (SC-123)
            q = q.where(or_(m.Case.opened_wall >= since, m.Case.history.is_(True)))
        q = q.order_by(m.Case.seq.desc()).limit(1)
    else:
        q = q.where(m.Case.status == "open")
    case = (await ctx.session.execute(q.with_for_update())).scalar_one_or_none()
    if case is None:
        raise not_found("batch in a journey")
    batch = await ctx.session.get(m.Batch, (client_id, ref), with_for_update=True)
    assert batch is not None
    x, d, agents, rules = await _world(ctx, c, batch)
    return Scene(c, case, batch, x, d, agents, rules)


def _state(case: m.Case) -> dict[str, Any]:
    return {
        "phase": case.phase,
        "photo": case.photo,
        "plan": case.plan,
        "award": case.award,
        "offer": case.offer,
        "van": case.van,
        "listing": case.listing,
        "donation": case.donation,
        "truck": case.truck,
        "docs": case.docs,
        "staff": case.staff,
        "expiredAt": case.expired_at.isoformat() if case.expired_at else None,
    }


def _guard(s: Scene, action: str) -> None:
    if (why := J.can(_state(s.case), action)) is not None:
        raise stale(why)


def _member(ctx: Ctx) -> str:
    assert ctx.actor.member_ref, "a person's step needs a signed-in member"
    return ctx.actor.member_ref


async def _save(ctx: Ctx, s: Scene, *, note: str | None = None) -> None:
    """after a step: the stage it reached, the console's view of the batch, the clock's speed, and the views told"""
    c, case, b = s.c, s.case, s.batch
    setup = c.setup_confirmed_at is not None
    permission = s.dist.permission == "given"
    case.stage = J.stage_of(_state(case), setup_confirmed=setup, permission=permission)
    case.updated_wall = ctx.clock.now()
    # the console's batch moves with its case: the stop it is at, what it is worth, its split
    target = min(case.stage, 8)
    if target != b.stage_current:
        b.stage_current = target
        b.stage_done = max(b.stage_done, target)
        b.stage_at = ctx.clock.now()
    if case.plan:
        b.money = float(case.plan["net"])
        b.split = " · ".join(f"{ln['units']} {ln['short']}" for ln in case.plan["lines"])
    if note:
        b.note = note
    await ctx.session.flush()
    await ev.apply_speed(ctx, c)
    await ev.changed(ctx, c, s.ref)
    if case.ledger is not None:  # posted, or a cleared batch's papers moved on: the ledger reads it again (SC-124)
        await ev.ledger_changed(ctx, c, s.ref)


async def _advance(ctx: Ctx, s: Scene) -> None:
    """once every line of the plan has run its course, the case is dispatched and the papers follow (SC-86): called by
    each step that finishes a line, so any plan, whatever its lines, reaches the papers"""
    if s.case.phase in ("approved", "executing") and J.lines_done(_state(s.case)):
        s.case.phase = "dispatched"
        await ev.publish(ctx, J.Event(J.STEP, {"type": J.SETTLE, "client": s.c.id, "ref": s.ref}, f"{s.c.id}:{s.ref}"))


async def _orders(ctx: Ctx, s: Scene) -> list[m.CaseOrder]:
    return list((await ctx.session.execute(select(m.CaseOrder).where(m.CaseOrder.case_id == s.case.id))).scalars())


async def realised(ctx: Ctx, s: Scene) -> dict[str, Any]:
    """the plan as its finished lines came to (money.realised): what was ordered, awarded, sold and collected, with
    the meals counted by the rule of the food bank that collected (SC-110), and the packs left at the godown settled
    by the client's expiry policy (SC-122)"""
    ordered = sum(o.units for o in await _orders(ctx, s))
    bank = await _bank(ctx, s)
    rule = bank.details.get("meals") if bank else None
    done = J.done_units(_state(s.case), ordered)
    return money.realised(s.case.plan or {}, s.sku_obj(), done, rule, s.c.expiry, rules=s.rules)


async def _bank(ctx: Ctx, s: Scene) -> m.Partner | None:
    """the food bank the donation is booked with"""
    pid = (s.case.donation or {}).get("partner")
    return await ctx.session.get(m.Partner, (s.c.id, pid)) if pid else None


async def _receipt(ctx: Ctx, s: Scene, at: datetime, by: str) -> dict[str, Any] | None:
    """the food bank's receipt for the packs it collected (SC-110): issued in its name as it collects, numbered in its
    own series, in its own form (money.receipt). A food bank set up without a receipt or a series issues none"""
    bank = await _bank(ctx, s)
    kind = f"receipt.{bank.id}" if bank else ""
    if bank is None or not bank.details.get("receipt") or not await world.numbers(ctx, s.c.id, kind):
        return None
    facts = {
        "no": await world.next_number(ctx, s.c.id, kind, city=s.dist.city or ""),
        "date": at.astimezone(IST).date().isoformat(),
        "at": at.astimezone(IST).strftime("%H:%M"),
        "by": by,
        "donor": s.c.name,
        "fssai": (s.c.workspace_doc or {}).get("fssai", ""),
        "via": s.dist.name,
        "from": f"{s.dist.godown}, {s.dist.city}" if s.dist.godown else s.dist.city,
        "spot": (s.case.donation or {}).get("spot"),
    }
    partner = {"name": bank.name, **bank.details}
    return money.jsonable({**money.receipt(s.case.donation["units"], s.sku_obj(), partner, facts), "pdf": None})


async def _issue_receipt(ctx: Ctx, s: Scene, at: datetime, by: str) -> dict[str, Any] | None:
    """the donation collected, with the food bank's receipt; Paperwork lays the receipt out as a PDF"""
    rcpt = await _receipt(ctx, s, at, by)
    s.case.donation = {**s.case.donation, "status": "collected", "collectedAt": at.isoformat(), "receipt": rcpt}
    if rcpt:
        await ev.publish(ctx, J.Event(J.STEP, {"type": J.RECEIPT, "client": s.c.id, "ref": s.ref}, f"{s.c.id}:{s.ref}"))
    return rcpt


async def _run(ctx: Ctx, s: Scene | None, client_id: str, run: Run | None, text: str, *, status: str = "done") -> None:
    """the agent's run, as the console's Overview lists it; a redelivered event finds its run and does nothing"""
    if run is None:
        return
    await agent_runs.record_run(ctx, client_id, run.agent, text, at=ctx.clock.now())
    row = (
        await ctx.session.execute(
            select(m.AgentRun)
            .where(m.AgentRun.client_id == client_id, m.AgentRun.agent_id == run.agent)
            .order_by(m.AgentRun.id.desc())
            .limit(1)
        )
    ).scalar_one()
    row.event_key, row.run_id, row.trace_id = run.event_key, run.run_id or ctx.ids.new("run", 12), run.trace_id
    row.case_id = s.case.id if s else None
    row.status, row.model, row.fallback, row.latency_ms = status, run.model, run.fallback, run.latency_ms
    await ctx.session.flush()


async def once(ctx: Ctx, run: Run | None) -> None:
    """raises Noop when this event's run is already recorded (call after the client is locked)"""
    if run is None or not run.event_key:
        return
    hit = (await ctx.session.execute(select(m.AgentRun.id).where(m.AgentRun.event_key == run.event_key))).first()
    if hit:
        raise Noop()


def _today(ctx: Ctx, c: m.Client):
    return ev.now(ctx, c).astimezone(IST).date()


async def _people(ctx: Ctx, c: m.Client, *, role: str | None = None, org: str | None = None) -> list[m.ClientMember]:
    return await world.members_with(ctx, c.id, role=role, org=org)


async def _approver(ctx: Ctx, c: m.Client) -> list[str]:
    if c.approver_ref:
        return [c.approver_ref]
    return [p.ref for p in await _people(ctx, c, role="operator")]


def _short(people: list[m.ClientMember], fallback: str) -> str:
    return people[0].name if people else fallback


def _line(s: Scene, channel: str) -> dict[str, Any] | None:
    return copy.line(s.case.plan or {}, channel)


# --- setting up -----------------------------------------------------------------------------------------------------


async def record_export(ctx: Ctx, client_id: str, body: dict[str, Any], run: Run | None) -> None:
    """the Data agent loaded a stock export: the batches it found, open or updated, and the mapping it used"""
    c = await lock_client(ctx, client_id)
    await once(ctx, run)
    dists = await world.distributors(ctx, client_id)
    skus = await world.skus(ctx, client_id)
    for x in body.get("batches", []):
        if x["sku"] not in skus or x["distributor"] not in dists:
            continue
        x = {**x, "ref": x.get("ref") or x["id"]}
        b = await ctx.session.get(m.Batch, (client_id, x["ref"]), with_for_update=True)
        best = datetime.fromisoformat(x["bestBefore"]).date()
        mfg = datetime.fromisoformat(x["mfg"]).date() if x.get("mfg") else None
        if b is None:
            ctx.session.add(
                m.Batch(
                    client_id=client_id,
                    ref=x["ref"],
                    sku_id=x["sku"],
                    distributor_id=x["distributor"],
                    units=int(x["units"]),
                    stage_done=1,
                    stage_current=1,
                    opened_at=ctx.clock.now(),
                    stage_at=ctx.clock.now(),
                    best_before=best,
                    mfg=mfg,
                    sell_per_day=x.get("sellPerDay"),
                    shelf=x.get("shelf"),
                )
            )
        elif b.closed_at is None:
            b.units, b.best_before, b.mfg = int(x["units"]), best, mfg or b.mfg
            if x.get("sellPerDay") is not None:
                b.sell_per_day = x["sellPerDay"]
            b.shelf = x.get("shelf") or b.shelf
    for d in dists.values():
        if d.id in {x["distributor"] for x in body.get("batches", [])}:
            d.export_arrived_at = ctx.clock.now()
    mapped = int(body.get("mapped") or 0)
    first = c.setup_mapped == 0 and mapped > 0
    c.setup_mapped = max(c.setup_mapped, mapped)
    c.last_import = {
        "at": ev.now(ctx, c).isoformat(),
        "file": body.get("file", ""),
        "rows": int(body.get("rows") or 0),
        "batches": len(body.get("batches", [])),
    }
    # the columns the stock file was mapped by, and an export staff uploaded marked mapped (SC-84)
    exports.loaded(c, [body.get("file", ""), *(body.get("files") or [])], body.get("columns"))
    integration = await ctx.session.get(m.ClientIntegration, (client_id, "dms"), with_for_update=True)
    if integration is not None and integration.status == "waiting":
        integration.status, integration.note = "ok", "Stock exports arriving"
    await ctx.session.flush()
    text = f"loaded {len(body.get('batches', []))} batches"
    if first:
        e = copy.connect_event(
            mapped=mapped,
            batches=len(body.get("batches", [])),
            distributors=len({x["distributor"] for x in body.get("batches", [])}),
            days=int(body.get("days") or 0),
        )
        await ev.feed(ctx, c, None, "connect", "connect", e["text"], calls=e["calls"], agent="Data", icon="database")
    await _run(ctx, None, client_id, run, text)
    await ev.changed(ctx, c)


async def confirm_setup(ctx: Ctx, client_id: str) -> None:
    """stage 1: the operator confirms the Data agent's mapping and the guardrails"""
    ctx.require("setup.confirm", "Your role can't confirm the setup.")
    c = await lock_client(ctx, client_id)
    if c.setup_mapped == 0:
        raise stale("The Data agent has not mapped a stock export yet.")
    if c.setup_confirmed_at is not None:
        return
    c.setup_confirmed_at, c.setup_confirmed_by = ev.now(ctx, c), _member(ctx)
    await audit.record(
        ctx,
        c.id,
        "setup.confirm",
        "confirmed DMS mapping and guardrails",
        {"member": _member(ctx), "target": "Setup"},
    )
    await ev.changed(ctx, c)


async def _distributor_of(ctx: Ctx, c: m.Client) -> m.Distributor:
    me = await world.member(ctx, c.id, _member(ctx))
    d = await ctx.session.get(m.Distributor, (c.id, me.org_ref or ""), with_for_update=True)
    if d is None:
        raise ApiError(403, "Only a distributor can do this.")
    return d


async def permit(ctx: Ctx, client_id: str) -> None:
    """a distributor's one-time permission for the agents to act in his name, inside the client's floors"""
    ctx.require("distributor.permit", "Only a distributor gives this permission.")
    c = await lock_client(ctx, client_id)
    d = await _distributor_of(ctx, c)
    if d.permission == "given":
        return
    me = _member(ctx)
    d.permission, d.permission_given_at, d.permission_by, d.permission_paused = "given", ctx.clock.now(), me, False
    person = (await world.member(ctx, c.id, me)).name
    await ev.feed(
        ctx,
        c,
        None,
        "permit",
        "connect",
        copy.permit_event(platform="Smart-Clearance", client=_client_short(c)),
        person=me,
        human=True,
    )
    await audit.record(
        ctx,
        c.id,
        "distributor.permission",
        "gave the one-time permission to act in his name",
        {"member": me, "distributor": d.id, "target": f"{d.name} · inside {copy.possessive(_client_short(c))} floors"},
    )
    await ev.notify_all(
        ctx,
        c,
        [p.ref for p in await _people(ctx, c, role="operator")],
        "permit",
        title=f"{d.name} is set up",
        body=f"{person} signed in and allowed listings, scheme offers, invoice drafts and dispatch slots in his name, "
        f"inside your floors.",
        link="setup",
    )
    await ev.changed(ctx, c)


async def pause(ctx: Ctx, client_id: str, paused: bool) -> None:
    ctx.require("distributor.permit", "Only a distributor pauses the agents in his name.")
    c = await lock_client(ctx, client_id)
    d = await _distributor_of(ctx, c)
    if d.permission != "given" or d.permission_paused == paused:
        return
    d.permission_paused = paused
    me = _member(ctx)
    await audit.record(
        ctx,
        c.id,
        "distributor.pause" if paused else "distributor.resume",
        "paused the agent" if paused else "resumed the agent",
        {"member": me, "distributor": d.id, "target": f"{d.name} · one-time permission"},
    )
    title, body = (
        (f"{d.name} paused the agent", "Nothing more is listed, offered or invoiced in his name until he resumes.")
        if paused
        else (f"{d.name} resumed the agent", "The agents pick up where they stopped.")
    )
    await ev.notify_all(
        ctx, c, [p.ref for p in await _people(ctx, c, role="operator")], "pause", title=title, body=body, link="command"
    )
    if not paused:  # whatever waited for him goes again
        for case in (
            await ctx.session.execute(
                select(m.Case).where(m.Case.client_id == c.id, m.Case.distributor_id == d.id, m.Case.status == "open")
            )
        ).scalars():
            if (e := J.next_agent_event(_state(case), client=c.id, ref=case.batch_ref)) is not None:
                await ev.publish(ctx, e)
    await ev.changed(ctx, c)


def _client_short(c: m.Client) -> str:
    return c.short.split()[0] if c.short else c.name


# --- detect -----------------------------------------------------------------------------------------------------------


async def detect(
    ctx: Ctx, client_id: str, body: dict[str, Any], run: Run | None, *, only: set[str] | None = None
) -> list[str]:
    """the Watcher's daily run: every open batch judged by its gates and how fast it sells; a batch at risk, whose
    distributor has given the agents permission, opens a case. Returns the batches flagged. The history (SC-123)
    judges only its batch of the day (`only`)"""
    c = await lock_client(ctx, client_id)
    await once(ctx, run)
    today = _today(ctx, c)
    selling = {x["ref"]: x.get("sellPerDay") for x in body.get("batches", [])}
    skus = await world.skus(ctx, client_id)
    dists = await world.distributors(ctx, client_id)
    agents = await world.agent_settings(ctx, client_id)
    rules = world.money_rules(c, agents)
    batches = (
        (
            await ctx.session.execute(
                select(m.Batch)
                .where(m.Batch.client_id == client_id, m.Batch.closed_at.is_(None), m.Batch.best_before.is_not(None))
                .order_by(m.Batch.seq)
            )
        )
        .scalars()
        .all()
    )
    open_refs = set(
        (
            await ctx.session.execute(
                select(m.Case.batch_ref).where(m.Case.client_id == client_id, m.Case.status == "open")
            )
        ).scalars()
    )
    flagged = []
    for b in batches:
        if only is not None and b.ref not in only:
            continue
        if selling.get(b.ref) is not None:
            b.sell_per_day = selling[b.ref]
        d, x = dists[b.distributor_id], skus[b.sku_id]
        if b.ref in open_refs or c.setup_confirmed_at is None or d.permission != "given" or d.permission_paused:
            continue
        bo = world.batch_obj(b, d, today)
        a = money.assess(bo, world.sku_obj(x), gates=world.effective_gates(c, x, b), rules=rules)
        if a["status"] != "at-risk":
            continue
        flagged.append(b.ref)
        case = m.Case(
            id=ctx.ids.new("case", 10),
            client_id=client_id,
            batch_ref=b.ref,
            sku_id=b.sku_id,
            distributor_id=b.distributor_id,
            status="open",
            phase="at-risk",
            stage=2,
            opened_at=ev.now(ctx, c),
            opened_wall=ctx.clock.now(),
            assess=money.jsonable(a),
            photo={"status": "none"},
            updated_wall=ctx.clock.now(),
        )
        ctx.session.add(case)
        await ctx.session.flush()
        s = Scene(c, case, b, x, d, agents, rules)
        w = copy.watch_event(
            checked=int(body.get("checked") or len(batches)),
            distributors=int(body.get("distributors") or len(dists)),
            ref=b.ref,
            assess=a,
            units=b.units,
            sell_per_day=bo["sellPerDay"],
        )
        await ev.feed(ctx, c, case, "watch", "detect", w["text"], calls=w["calls"], agent="Watcher", icon="radar")
        for p in await _people(ctx, c, role="operator"):
            push = copy.push_detect(
                person=p.name,
                sku_name=x.name,
                city=d.city,
                ref=b.ref,
                at_risk=a["atRisk"],
                best_before=b.best_before.isoformat(),
            )
            await ev.notify(ctx, c, p.ref, "detect", link="command", case=case, **push)
        await ev.publish(ctx, J.Event(J.AT_RISK, {"client": c.id, "ref": b.ref}, f"{c.id}:{b.ref}"))
        await _save(ctx, s, note=f"at risk: {fmt_units(a['atRisk'])} won't sell")
    c.last_watch = {
        "at": ev.now(ctx, c).isoformat(),
        "checked": int(body.get("checked") or len(batches)),
        "distributors": int(body.get("distributors") or len(dists)),
        "flagged": len(flagged),
    }
    text = f"{', '.join(flagged)} at risk" if flagged else "nothing new at risk"
    await _run(ctx, None, client_id, run, text)
    await ev.changed(ctx, c)
    return flagged


def fmt_units(n: float) -> str:
    return money.fmt.num(n) + " units"


# --- verify -----------------------------------------------------------------------------------------------------------


async def photo_request(ctx: Ctx, client_id: str, ref: str, run: Run | None) -> None:
    """Vision asks the distributor for one label photo (or, when the client needs none, the Valuer goes on)"""
    s = await scene(ctx, client_id, ref)
    await once(ctx, run)
    if s.case.phase != "at-risk" or s.case.photo.get("status") != "none":
        raise Noop()
    if s.dist.permission_paused:
        raise Noop()
    if not s.c.require_photo:
        s.case.photo = {"status": "skipped"}
        await ev.publish(ctx, J.Event(J.STEP, {"type": J.VALUE, "client": s.c.id, "ref": ref}, f"{s.c.id}:{ref}"))
        await _run(ctx, s, client_id, run, f"{ref}: no label photo needed")
        await _save(ctx, s)
        return
    s.case.photo = {"status": "requested", "at": ev.now(ctx, s.c).isoformat(), "attempts": 0}
    people = await _people(ctx, s.c, org=s.dist.id)
    e = copy.ask_event(distributor=s.dist.name, person=_short(people, s.dist.name), hindi=s.c.hindi_offers)
    await ev.feed(ctx, s.c, s.case, "ask", "verify", e["text"], calls=e["calls"], agent="Vision", icon="scan-line")
    for p in people:
        push = copy.push_verify(person=p.name, sku_name=s.sku.name, ref=ref)
        await ev.notify(ctx, s.c, p.ref, "verify", link="photo", case=s.case, **push)
    await _run(ctx, s, client_id, run, f"asked {s.dist.name} for {ref}'s label photo")
    await _save(ctx, s, note="waiting for the label photo")


async def photo_upload(ctx: Ctx, client_id: str, ref: str, content_type: str, size: int) -> dict[str, Any]:
    """a signed link for the distributor's label photo, straight into the photos bucket"""
    ctx.require("photo.send", "Only the distributor sends the label photo.")
    s = await scene(ctx, client_id, ref)
    me = await world.member(ctx, client_id, _member(ctx))
    if me.org_ref != s.dist.id:
        raise ApiError(403, "Only the distributor holding this batch sends its label photo.")
    _guard(s, "photo")
    if not content_type.startswith("image/"):
        raise ApiError(422, "Send a photo: a JPEG, PNG or WebP image.", {"contentType": "An image."})
    if not 0 < size <= PHOTO_MAX_BYTES:
        raise ApiError(422, "The photo must be under 8 MB.", {"bytes": "Under 8 MB."})
    assert ctx.cloud is not None and ctx.settings.photos_bucket
    pid = ctx.ids.new("ph", 10)
    name = f"{client_id}/{ref}/{pid}"
    ctx.session.add(
        m.CasePhoto(
            id=pid,
            case_id=s.case.id,
            object=name,
            content_type=content_type,
            bytes=size,
            status="uploading",
            by_ref=me.ref,
            created_wall=ctx.clock.now(),
        )
    )
    await ctx.session.flush()
    link = ctx.cloud.storage.signed_put(ctx.settings.photos_bucket, name, content_type)
    return {
        "id": pid,
        "url": link.url,
        "headers": link.headers,
        "expiresAt": (ctx.clock.now() + timedelta(minutes=10)).isoformat(),
    }


async def photo_sent(ctx: Ctx, client_id: str, ref: str, photo_id: str) -> None:
    ctx.require("photo.send", "Only the distributor sends the label photo.")
    s = await scene(ctx, client_id, ref)
    _guard(s, "photo")
    photo = await ctx.session.get(m.CasePhoto, photo_id, with_for_update=True)
    if photo is None or photo.case_id != s.case.id or photo.status != "uploading":
        raise not_found("photo")
    assert ctx.cloud is not None and ctx.settings.photos_bucket
    size = await ctx.cloud.storage.size(ctx.settings.photos_bucket, photo.object)
    if not size:
        raise ApiError(422, "The photo has not arrived yet. Send it again.")
    at = ev.now(ctx, s.c)
    photo.status, photo.sent_at, photo.bytes = "sent", at, size
    s.case.photo = {**s.case.photo, "status": "reading", "at": at.isoformat(), "object": photo.object, "id": photo.id}
    me = _member(ctx)
    await ev.feed(ctx, s.c, s.case, "photo", "verify", copy.photo_event(shelf=s.batch.shelf), person=me, human=True)
    await audit.record(ctx, s.c.id, "photo.send", "sent the label photo", {"member": me, "target": ref})
    await ev.publish(
        ctx, J.Event(J.STEP, {"type": J.DECIDE, "client": s.c.id, "ref": ref, "photo": photo.object}, f"{s.c.id}:{ref}")
    )
    await _save(ctx, s, note="reading the label photo")


async def photo_read(ctx: Ctx, client_id: str, ref: str, read: dict[str, Any], run: Run | None) -> bool:
    """Vision's reading of the label, held to the DMS record; a low-confidence or mismatched reading asks again.
    Returns whether the label was verified"""
    s = await scene(ctx, client_id, ref)
    await once(ctx, run)
    if s.case.phase != "at-risk" or s.case.photo.get("status") != "reading":
        raise Noop()
    threshold = float(s.agents.get("vision", {}).get("confidence", 0.9))
    record = {
        "batch": ref,
        "mfg": s.batch.mfg.isoformat() if s.batch.mfg else None,
        "bestBefore": s.batch.best_before.isoformat() if s.batch.best_before else None,
        "mrp": float(s.sku.mrp),
    }
    mismatches = []
    if read.get("batch") and read["batch"] != record["batch"]:
        mismatches.append(f"batch {read['batch']}, not {ref}")
    if read.get("bestBefore") and read["bestBefore"] != record["bestBefore"]:
        mismatches.append(f"best before {money.fmt.date(read['bestBefore'])}")
    if read.get("mfg") and record["mfg"] and read["mfg"] != record["mfg"]:
        mismatches.append(f"MFG {money.fmt.date(read['mfg'])}")
    if read.get("mrp") is not None and abs(float(read["mrp"]) - record["mrp"]) > 0.001:
        mismatches.append(f"MRP ₹{float(read['mrp']):.2f}")
    confidence = float(read.get("confidence") or 0)
    # a read without the batch number cannot be held to the record, and one with nothing on it did not read the label
    # at all, however sure the model says it is (SC-77: live Gemini once returned only its confidence)
    seen = any(read.get(k) for k in ("batch", "mfg", "bestBefore")) or read.get("mrp") is not None
    unread = (
        [] if read.get("batch") else ["the batch number could not be read" if seen else "the label could not be read"]
    )
    problems = mismatches + unread
    ok = not problems and confidence >= threshold
    e = copy.read_event(
        {**read, "confidence": confidence}, matches=not problems, mismatches=problems or ["the label is unclear"]
    )
    await ev.feed(ctx, s.c, s.case, "read", "verify", e["text"], calls=e["calls"], agent="Vision", icon="scan-line")
    at = ev.now(ctx, s.c).isoformat()
    label = {**read, "confidence": confidence, "matches": not problems, "mismatches": problems}
    if ok:
        s.case.photo = {**s.case.photo, "status": "verified", "at": at, "confidence": confidence, "read": label}
        s.case.phase = "verified"
        await _run(ctx, s, client_id, run, f"read {ref}'s label, confidence {confidence:.2f}")
        await _save(ctx, s, note="label verified")
        return True
    attempts = int(s.case.photo.get("attempts", 0)) + 1
    s.case.photo = {"status": "requested", "at": at, "attempts": attempts, "read": label}
    why = ", ".join(problems) if problems else f"confidence {confidence:.2f} is under {threshold:.2f}"
    for p in await _people(ctx, s.c, org=s.dist.id):
        await ev.notify(
            ctx,
            s.c,
            p.ref,
            "retake",
            link="photo",
            case=s.case,
            **copy.push_retake(person=p.name, sku_name=s.sku.name, ref=ref, why=why),
        )
    await _run(ctx, s, client_id, run, f"asked again for {ref}'s label: {why}", status="retake")
    await _save(ctx, s, note="asked for another label photo")
    return False


# --- value and decide -------------------------------------------------------------------------------------------------


async def valuation(ctx: Ctx, client_id: str, ref: str, notes: dict[str, str] | None, run: Run | None) -> None:
    """the Valuer's channel table: every exit priced (money.py), with the agent's notes on recent prices"""
    s = await scene(ctx, client_id, ref)
    await once(ctx, run)
    photo = s.case.photo.get("status")
    if not (s.case.phase == "verified" or (s.case.phase == "at-risk" and photo == "skipped")):
        raise Noop()
    today = _today(ctx, s.c)
    bo, so = s.batch_obj(today), s.sku_obj()
    a = money.assess(bo, so, gates=world.effective_gates(s.c, s.sku, s.batch), rules=s.rules)
    rows = money.channel_table(bo, so, a["atRisk"], rules=s.rules)
    notes = {k: v for k, v in (notes or {}).items() if isinstance(v, str) and v.strip()}
    s.case.valuation = money.jsonable(
        {
            "rows": [{**r, "note": notes.get(r["id"])} for r in rows],
            "at": ev.now(ctx, s.c).isoformat(),
            "units": a["atRisk"],
        }
    )
    s.case.assess = money.jsonable(a)
    s.case.phase = "valued"
    wo = money.write_off(a["atRisk"], so, rules=s.rules)
    e = copy.value_event(days_left=bo["daysLeft"], write_off=wo, sku=so, rules=s.rules)
    await ev.feed(ctx, s.c, s.case, "value", "value", e["text"], calls=e["calls"], agent="Valuer", icon="scale")
    await _run(ctx, s, client_id, run, f"priced {len(rows)} exits for {ref}")
    await _save(ctx, s, note="exits priced")


async def plan(ctx: Ctx, client_id: str, ref: str, explanation: str | None, run: Run | None) -> None:
    """the Router's split (money.py's allocate and plan), with its reasoning in plain words; the approver is asked"""
    s = await scene(ctx, client_id, ref)
    await once(ctx, run)
    if s.case.phase != "valued":
        raise Noop()
    today = _today(ctx, s.c)
    p = money.plan(s.batch_obj(today), s.sku_obj(), rules=s.rules)
    figures = [p["net"], p["swing"], p["units"], p["pnl"], p["itcRetained"], p["writeOff"]["total"]]
    figures += [x for ln in p["lines"] for x in (ln["units"], ln["price"], ln["net"], ln["gross"])]
    figures += [r["price"] for r in p["rows"]] + [s.c.offer_window_hours, money.RULES["kiranaWindowDays"]]
    offered = len(await world.kiranas(ctx, client_id, s.dist.id))
    figures.append(offered)  # the template names how many kiranas the scheme goes to, and so may the Router (SC-72)
    fallback = not (explanation and copy.check_numbers(explanation, figures))
    text = copy.route_text(p, offered=offered, window_days=s.rules["kiranaWindowDays"]) if fallback else explanation
    s.case.plan = money.jsonable({**p, "explanation": text})
    s.case.approval = {"status": "proposed", "at": ev.now(ctx, s.c).isoformat()}
    s.case.phase = "planned"
    e = copy.route_event(p, offered=offered, window_days=s.rules["kiranaWindowDays"], explanation=text)
    await ev.feed(ctx, s.c, s.case, "route", "decide", e["text"], calls=e["calls"], agent="Router", icon="split")
    approvers = await _approver(ctx, s.c)
    approver_name = (await world.member(ctx, client_id, approvers[0])).name if approvers else "the approver"
    dist_people = await _people(ctx, s.c, org=s.dist.id)
    await ev.feed(
        ctx,
        s.c,
        s.case,
        "notify",
        "approve",
        copy.notify_event(approver=copy.first(approver_name), distributor_person=_short(dist_people, s.dist.name)),
        agent="Notifier",
        icon="bell",
    )
    for ref_ in approvers:
        await ev.notify(ctx, s.c, ref_, "plan", link="route", case=s.case, **copy.push_plan(p, ref=ref))
    if run is not None:
        run.fallback = run.fallback or fallback
    await _run(ctx, s, client_id, run, f"plan for {ref}: net {money.fmt.inr(p['net'])}")
    await _save(ctx, s, note="waiting for a yes")


# --- approve ----------------------------------------------------------------------------------------------------------


async def approve(ctx: Ctx, client_id: str, ref: str, device: str) -> None:
    """the one tap: nothing is listed, offered or shipped before it"""
    ctx.require("plan.approve", "Your role can't approve plans.")
    s = await scene(ctx, client_id, ref)
    me = _member(ctx)
    if s.c.approver_ref and s.c.approver_ref != me:
        name = (await world.member(ctx, client_id, s.c.approver_ref)).name
        raise ApiError(403, f"{name} approves {s.c.name}'s plans.")
    _guard(s, "approve")
    at = ev.now(ctx, s.c).isoformat()
    s.case.approval = {"status": "approved", "at": at, "by": me, "device": "phone" if device == "phone" else "desktop"}
    s.case.phase = "approved"
    await ev.feed(ctx, s.c, s.case, "approved", "approve", copy.approved_event(device=device), person=me, human=True)
    plan_ = s.case.plan or {}
    await audit.record(
        ctx,
        s.c.id,
        "plan.approve",
        "approved the plan",
        {"member": me, "target": f"{ref} · net {money.fmt.inr(plan_.get('net', 0))}", "batch": ref},
    )
    staff = _line(s, "staff")
    godown = s.dist.godown or s.dist.city
    if staff and staff["units"] > 0:  # the staff sale opens at the godown, for the distributor to run and record
        s.case.staff = {"status": "open", "units": staff["units"], "price": staff["price"], "godown": godown, "at": at}
    for p in await _people(ctx, s.c, org=s.dist.id):
        push = copy.push_approved(plan_, person=p.name, client=_client_short(s.c), sku_name=s.sku.name, ref=ref)
        await ev.notify(ctx, s.c, p.ref, "approved", link="home", case=s.case, **push)
        if s.case.staff:
            push = copy.push_staff_open(
                sku_name=s.sku.name, units=s.case.staff["units"], price_=s.case.staff["price"], godown=godown
            )
            await ev.notify(ctx, s.c, p.ref, "staff.open", link="home", case=s.case, **push)
    if J.next_agent_event(_state(s.case), client=s.c.id, ref=ref) is not None:
        await ev.publish(ctx, J.Event(J.STEP, {"type": J.EXECUTE, "client": s.c.id, "ref": ref}, f"{s.c.id}:{ref}"))
    await _advance(ctx, s)  # a plan with no line to wait for (a write-off) goes straight to the papers
    # the report falls due on expiry day, the batch's best-before, and closes the journey as it stands (SC-94)
    bb = s.batch.best_before
    report_at = datetime(bb.year, bb.month, bb.day, 10, tzinfo=IST)
    await ev.timer(ctx, s.c, "report.due", max(report_at, ev.now(ctx, s.c)), case=s.case)
    await _save(ctx, s, note="approved")


# --- execute ----------------------------------------------------------------------------------------------------------


def _acting_ok(s: Scene) -> None:
    """the agents act in the distributor's name only with his permission, and not while he has paused it"""
    if s.dist.permission != "given" or s.dist.permission_paused:
        raise Noop()


async def listing(
    ctx: Ctx, client_id: str, ref: str, title: str | None, description: str | None, run: Run | None
) -> None:
    """the Lister posts the ExpireSoon lot in the distributor's name, at the plan's price, with the reserve"""
    s = await scene(ctx, client_id, ref)
    await once(ctx, run)
    es = _line(s, "expiresoon")
    if s.case.phase not in ("approved", "executing") or es is None or s.case.listing:
        raise Noop()
    _acting_ok(s)
    lid = await world.next_number(ctx, client_id, "listing")
    reserve = float(s.rules["negotiation"]["reservePerUnit"])
    at = ev.now(ctx, s.c).isoformat()
    title = (title or "").strip()[:120] or f"{s.sku.brand} {s.sku.name} · {es['units']} packs · {s.dist.city}"
    description = (description or "").strip()[:600] or (
        f"{es['units']} packs of {s.sku.brand} {s.sku.name}, batch {ref}, best before "
        f"{money.fmt.date(s.batch.best_before.isoformat())}. Stock at {s.dist.godown or s.dist.city}."
    )
    request = {
        "seller": s.dist.name,
        "sku": s.sku.code,
        "batch": ref,
        "units": es["units"],
        "price": es["price"],
        "reserve": reserve,
        "bestBefore": s.batch.best_before.isoformat(),
        "hiddenFrom": (s.dist.pins or "") if s.c.territory_guard else "",
    }
    s.case.listing = {
        "id": lid,
        "status": "live",
        "units": es["units"],
        "price": es["price"],
        "reserve": reserve,
        "at": at,
        "title": title,
        "description": description,
        "api": {"request": request, "response": {"status": 201, "id": lid}},
    }
    s.case.phase = "executing"
    days = int((s.agents.get("lister") or {}).get("days") or LISTING_DAYS)
    await ev.timer(ctx, s.c, "listing.close", ev.now(ctx, s.c) + timedelta(days=days), case=s.case)
    e = copy.list_event(
        units=es["units"],
        distributor=s.dist.name,
        ask=es["price"],
        reserve=reserve,
        client=_client_short(s.c),
        listing_id=lid,
        territory_guard=s.c.territory_guard,
    )
    await ev.feed(ctx, s.c, s.case, "list", "execute", e["text"], calls=e["calls"], agent="Lister", icon="shopping-bag")
    for p in await _people(ctx, s.c, role="buyer"):
        await ev.notify(
            ctx,
            s.c,
            p.ref,
            "listing",
            link="market",
            case=s.case,
            title=f"New lot · {s.sku.name}",
            body=f"{es['units']} packs from {s.dist.city}, best before "
            f"{money.fmt.date(s.batch.best_before.isoformat())}, at ₹{es['price']:.2f} a pack.",
        )
    await _run(ctx, s, client_id, run, f"listed {es['units']} of {ref} as {lid}")
    await _save(ctx, s, note=f"listed on ExpireSoon as {lid}")


async def offer(ctx: Ctx, client_id: str, ref: str, words: dict[str, str] | None, run: Run | None) -> None:
    """Outreach sends the scheme to the distributor's kiranas, each capped at 4x its own 14-day sales, for the
    client's offer window"""
    s = await scene(ctx, client_id, ref)
    await once(ctx, run)
    kl = _line(s, "kirana")
    if s.case.phase not in ("approved", "executing") or kl is None or s.case.offer:
        raise Noop()
    _acting_ok(s)
    shops = await world.kiranas(ctx, client_id, s.dist.id)
    cap_times = int(s.rules["shopCapTimes"])
    at = ev.now(ctx, s.c)
    closes = at + timedelta(hours=s.c.offer_window_hours)
    scheme = s.rules["scheme"]
    s.case.offer = {
        "status": "sent",
        "at": at.isoformat(),
        "closesAt": closes.isoformat(),
        "shops": len(shops),
        "units": kl["units"],
        "packPrice": kl.get("packPrice"),
        "price": kl["price"],
        "scheme": scheme,
        "caps": {k.id: cap_times * k.sales_14d for k in shops},
        "words": {k: v for k, v in (words or {}).items() if k in ("hi", "en", "mr") and isinstance(v, str)},
    }
    s.case.phase = "executing"
    await ev.timer(ctx, s.c, "offer.close", closes, case=s.case)
    e = copy.outreach_event(
        offered=len(shops),
        city=s.dist.city,
        scheme=scheme,
        hours=s.c.offer_window_hours,
        cap_times=cap_times,
        hindi=s.c.hindi_offers,
    )
    await ev.feed(ctx, s.c, s.case, "outreach", "execute", e["text"], calls=e["calls"], agent="Outreach", icon="send")
    for k in shops:
        if not k.member_ref:
            continue
        push = copy.push_offer(
            shop=k.name,
            brand=s.sku.brand,
            sku_name=s.sku.name,
            best_before=s.batch.best_before.isoformat(),
            scheme=scheme,
            hours=s.c.offer_window_hours,
            distributor=s.dist.name,
        )
        if not s.c.hindi_offers:
            push = {"title": "Today's offer", "body": push["en"], "en": None, "hindi": False}
        await ev.notify(ctx, s.c, k.member_ref, "offer", link="offer", case=s.case, **push)
    if not shops:  # no kirana to offer it to: the scheme closes with nothing ordered
        await _close_offer(ctx, s)
    await _run(ctx, s, client_id, run, f"offered {ref} to {len(shops)} kiranas")
    await _save(ctx, s, note=f"scheme sent to {len(shops)} kiranas")


async def donation(ctx: Ctx, client_id: str, ref: str, run: Run | None) -> None:
    """the Donation step (run as Outreach): the food-bank line goes to the first partner that takes it"""
    s = await scene(ctx, client_id, ref)
    await once(ctx, run)
    fb = _line(s, "foodbank")
    if s.case.phase not in ("approved", "executing") or fb is None or s.case.donation:
        raise Noop()
    days_left = (s.batch.best_before - _today(ctx, s.c)).days
    banks = await world.partners(ctx, client_id, "foodbank")
    fit = [p for p in banks if days_left >= p.details.get("minDays", 0) and fb["units"] >= p.details.get("minUnits", 0)]
    if not fit:
        need = min(banks, key=lambda p: p.details.get("minUnits", 0), default=None)
        reason = (
            f"{need.name} needs {need.details.get('minDays', 0)}+ days and {need.details.get('minUnits', 0)}+ packs"
            if need
            else "no food bank partner is set up"
        )
        await _decline(ctx, s, reason, agent="Donation")
        await _run(ctx, s, client_id, run, f"found no food bank for {fb['units']} of {ref}")
        await _save(ctx, s, note="no food bank takes the donation")
        return
    partner = fit[0]
    at = ev.now(ctx, s.c)
    pickup, slots = _pickup_times(s.c, at)
    s.case.donation = {
        "status": "booked",
        "partner": partner.id,
        "partnerName": partner.name,
        "units": fb["units"],
        "pickupAt": pickup.isoformat(),
        "slots": [x.isoformat() for x in slots],
        "spot": copy.serving_spot(
            partner=partner.name, city=s.dist.city, spots=(_moments(s.c).get("donation") or {}).get("spots") or {}
        ),
        "from": s.dist.godown or s.dist.city,
        "at": at.isoformat(),
    }
    s.case.phase = "executing"
    others = [
        {"name": p.name, "minDays": p.details.get("minDays", 0), "minUnits": p.details.get("minUnits", 0)}
        for p in banks
        if p is not partner
    ]
    e = copy.donate_event(sku_name=s.sku.name, partner=partner.name, units=fb["units"], others=others)
    await ev.feed(
        ctx, s.c, s.case, "donate", "execute", e["text"], calls=e["calls"], agent="Donation", icon="heart-handshake"
    )
    people = await _people(ctx, s.c, org=partner.id)
    for p in people:
        push = copy.push_pickup(sku_name=s.sku.name, units=fb["units"], days_left=days_left, godown=s.dist.godown or "")
        await ev.notify(ctx, s.c, p.ref, "pickup", link="pickups", case=s.case, **push)
    await _run(ctx, s, client_id, run, f"booked {partner.name} for {fb['units']} of {ref}")
    await _save(ctx, s, note=f"donation booked with {partner.name}")


async def order(ctx: Ctx, client_id: str, ref: str, units: int) -> None:
    """a kirana orders under the scheme, within its cap"""
    ctx.require("offer.order", "Only a kirana orders under the scheme.")
    s = await scene(ctx, client_id, ref)
    _guard(s, "order")
    me = await world.member(ctx, client_id, _member(ctx))
    kirana_id = me.org_ref or ""
    caps = (s.case.offer or {}).get("caps", {})
    if kirana_id not in caps:
        raise ApiError(403, "This scheme was not offered to your shop.")
    cap = int(caps[kirana_id])
    if units <= 0 or units > cap:
        raise ApiError(422, f"Order between 1 and {cap} packets.", {"units": f"Up to {cap} packets."})
    taken = (await ctx.session.execute(select(m.CaseOrder).where(m.CaseOrder.case_id == s.case.id))).scalars().all()
    if any(o.kirana_id == kirana_id for o in taken):
        raise stale("Your shop has already ordered.")
    left = int(s.case.offer["units"]) - sum(o.units for o in taken)
    if units > left:
        raise ApiError(422, f"Only {left} packets are left in the scheme.", {"units": f"Up to {left} packets."})
    at = ev.now(ctx, s.c)
    ctx.session.add(
        m.CaseOrder(case_id=s.case.id, kirana_id=kirana_id, units=units, at=at, wall=ctx.clock.now(), member_ref=me.ref)
    )
    await ctx.session.flush()
    await audit.record(
        ctx,
        s.c.id,
        "offer.order",
        f"ordered {units} packets",
        {"member": me.ref, "target": f"{copy.base(s.sku.name)} scheme", "batch": ref},
    )
    if units == left:  # the scheme is full: it closes now
        await _close_offer(ctx, s)
    await _save(ctx, s)


async def _close_offer(ctx: Ctx, s: Scene) -> None:
    taken = (await ctx.session.execute(select(m.CaseOrder).where(m.CaseOrder.case_id == s.case.id))).scalars().all()
    ordered = sum(o.units for o in taken)
    offer_ = dict(s.case.offer or {})
    line_units = int(offer_.get("units", 0))
    offer_["status"], offer_["ordered"] = "closed", ordered
    offer_["closedAt"] = ev.now(ctx, s.c).isoformat()
    shortfall = max(0, line_units - ordered)
    offer_["shortfall"] = shortfall
    if shortfall and s.case.listing and s.case.listing.get("status") == "live":
        s.case.listing = {**s.case.listing, "units": s.case.listing["units"] + shortfall}
        offer_["movedTo"] = "expiresoon"
    s.case.offer = offer_
    first = min((o.at for o in taken), default=None)
    last = max((o.at for o in taken), default=None)
    hours = ((last - datetime.fromisoformat(offer_["at"])).total_seconds() / 3600) if last else 0
    e = copy.orders_event(
        shops=len(taken),
        offered=int(offer_.get("shops", 0)),
        units=ordered,
        line_units=line_units,
        hours=max(hours, 0.0),
    )
    if first is not None:
        await ev.feed(
            ctx, s.c, s.case, "orders", "execute", e["text"], calls=e["calls"], agent="Outreach", icon="store"
        )
    await _advance(ctx, s)


async def close_offer(ctx: Ctx, client_id: str, ref: str, run: Run | None) -> None:
    """the scheme's window has closed: what was not ordered moves to the ExpireSoon lot while it is still open"""
    s = await scene(ctx, client_id, ref)
    await once(ctx, run)
    if not s.case.offer or s.case.offer.get("status") != "sent":
        raise Noop()
    await _close_offer(ctx, s)
    await _run(ctx, s, client_id, run, f"closed {ref}'s scheme")
    await _save(ctx, s)


async def bid(ctx: Ctx, client_id: str, ref: str, price: float) -> str:
    """the buyer bids on the lot; the Negotiator answers"""
    ctx.require("listing.bid", "Only a buyer bids.")
    s = await scene(ctx, client_id, ref)
    _guard(s, "bid")
    ask = float(s.case.listing["price"])
    if not 0 < price <= ask:
        raise ApiError(422, f"Bid up to ₹{ask:.2f} a packet.", {"price": f"Up to ₹{ask:.2f}."})
    pending = (
        (
            await ctx.session.execute(
                select(m.CaseBid).where(m.CaseBid.case_id == s.case.id, m.CaseBid.status.in_(("placed", "countered")))
            )
        )
        .scalars()
        .first()
    )
    if pending is not None:
        raise stale("Your last bid is still open.")
    me = _member(ctx)
    at = ev.now(ctx, s.c)
    bid_id = ctx.ids.new("bid", 8)
    ctx.session.add(
        m.CaseBid(
            id=bid_id, case_id=s.case.id, price=round(price, 2), at=at, wall=ctx.clock.now(), by_ref=me, status="placed"
        )
    )
    ctx.session.add(
        m.CaseMessage(
            case_id=s.case.id,
            sender="buyer",
            text=copy.chat_bid(bid=price, units=int(s.case.listing["units"])),
            at=at,
            wall=ctx.clock.now(),
            by_ref=me,
            answered=True,
        )
    )
    await ctx.session.flush()
    await audit.record(
        ctx, s.c.id, "listing.bid", f"bid ₹{price:.2f}", {"member": me, "target": s.case.listing["id"], "batch": ref}
    )
    await ev.publish(ctx, J.Event(J.OFFER_RECEIVED, {"client": s.c.id, "ref": ref, "bid": bid_id}, f"{s.c.id}:{ref}"))
    await _save(ctx, s)
    return bid_id


async def message(ctx: Ctx, client_id: str, ref: str, text: str) -> None:
    """the buyer asks about the lot; the Negotiator answers. At most 20 an hour, 500 characters each"""
    ctx.require("listing.bid", "Only a buyer writes to the seller.")
    s = await scene(ctx, client_id, ref)
    _guard(s, "message")
    text = text.strip()
    if not text:
        raise ApiError(422, "Write a message.", {"text": "Write a message."})
    if len(text) > MESSAGE_MAX:
        raise ApiError(422, f"Keep it under {MESSAGE_MAX} characters.", {"text": f"Under {MESSAGE_MAX} characters."})
    me = _member(ctx)
    hour_ago = ctx.clock.now() - timedelta(hours=1)
    recent = (
        await ctx.session.execute(
            select(func.count())
            .select_from(m.CaseMessage)
            .where(m.CaseMessage.case_id == s.case.id, m.CaseMessage.by_ref == me, m.CaseMessage.wall > hour_ago)
        )
    ).scalar_one()
    if recent >= MESSAGES_PER_HOUR:
        raise ApiError(429, "That is a lot of messages. Wait a while, then write again.")
    row = m.CaseMessage(
        case_id=s.case.id, sender="buyer", text=text, at=ev.now(ctx, s.c), wall=ctx.clock.now(), by_ref=me
    )
    ctx.session.add(row)
    await ctx.session.flush()
    await ev.publish(
        ctx, J.Event(J.OFFER_RECEIVED, {"client": s.c.id, "ref": ref, "message": row.id}, f"{s.c.id}:{ref}")
    )
    await _save(ctx, s)


async def answer_bid(ctx: Ctx, client_id: str, ref: str, bid_id: str, reply: str | None, run: Run | None) -> None:
    """the Negotiator's answer: money.py decides (accept, or counter at the reserve or above); the model writes only the
    words. Past the client's number of counters, the bid goes to the approver"""
    s = await scene(ctx, client_id, ref)
    await once(ctx, run)
    b = await ctx.session.get(m.CaseBid, bid_id, with_for_update=True)
    if b is None or b.case_id != s.case.id or b.status != "placed" or not s.case.listing:
        raise Noop()
    _acting_ok(s)
    ask = float(s.case.listing["price"])
    units = int(s.case.listing["units"])
    reserve = float(s.case.listing["reserve"])
    r = money.counter(ask, float(b.price), rules=s.rules)
    at = ev.now(ctx, s.c)
    b.answered_at = at
    decided = float(b.price) if r["action"] == "accept" else float(r["price"])
    words = reply if reply and copy.reply_ok(reply, decided=decided, others=[ask, units, 24], reserve=reserve) else None
    counters = int(s.agents.get("negotiator", {}).get("counters", 2))
    below = (
        await ctx.session.execute(
            select(func.count())
            .select_from(m.CaseBid)
            .where(m.CaseBid.case_id == s.case.id, m.CaseBid.price < reserve, m.CaseBid.answered_at.is_not(None))
        )
    ).scalar_one()
    if r["action"] == "accept":
        b.status = "accepted"
        text = words or copy.chat_accepted_bid(price_=float(b.price), units=units)
        await _run(ctx, s, client_id, run, f"accepted ₹{b.price:.2f} on {s.case.listing['id']}")
    elif float(b.price) < reserve and below > counters:
        b.status = "declined"
        s.case.escalated = {"bid": b.id, "at": at.isoformat()}
        text = f"₹{b.price:.2f} is below what the seller can take. The seller will reply to you directly."
        for ref_ in await _approver(ctx, s.c):
            await ev.notify(
                ctx,
                s.c,
                ref_,
                "escalated",
                link="execution",
                case=s.case,
                **copy.push_escalated(
                    buyer=await _buyer_name(ctx, client_id, b.by_ref), bid=float(b.price), ref=ref, reserve=reserve
                ),
            )
        await _run(ctx, s, client_id, run, f"stopped countering on {s.case.listing['id']}", status="escalated")
    else:
        b.status, b.counter = "countered", float(r["price"])
        text = words or copy.chat_counter(counter=float(r["price"]), units=units, city=s.dist.city)
        dist_people = await _people(ctx, s.c, org=s.dist.id)
        e = copy.counter_event(
            buyer=await _buyer_name(ctx, client_id, b.by_ref),
            bid=float(b.price),
            units=units,
            counter=float(r["price"]),
            reserve=reserve,
            distributor_person=_short(dist_people, s.dist.name),
        )
        await ev.feed(
            ctx,
            s.c,
            s.case,
            "counter",
            "execute",
            e["text"],
            calls=e["calls"],
            agent="Negotiator",
            icon="messages-square",
        )
        await _run(ctx, s, client_id, run, f"countered ₹{r['price']:.2f} on {s.case.listing['id']}")
    ctx.session.add(m.CaseMessage(case_id=s.case.id, sender="agent", text=text, at=at, wall=ctx.clock.now()))
    if run is not None and words is None and reply:
        run.fallback = True
    await ctx.session.flush()
    await _save(ctx, s)


async def answer_message(
    ctx: Ctx, client_id: str, ref: str, message_id: int, reply: str | None, run: Run | None
) -> None:
    """the Negotiator answers a buyer's question; any price in it is the listing's own, and a price the buyer offers in
    words is turned into a nudge to bid"""
    s = await scene(ctx, client_id, ref)
    await once(ctx, run)
    q = await ctx.session.get(m.CaseMessage, message_id, with_for_update=True)
    if q is None or q.case_id != s.case.id or q.sender != "buyer" or q.answered or not s.case.listing:
        raise Noop()
    ask = float(s.case.listing["price"])
    units = int(s.case.listing["units"])
    best = s.batch.best_before.isoformat()
    allowed = [ask, units, 24, s.batch.best_before.day, s.batch.best_before.year]
    words = reply if reply and copy.check_numbers(reply, allowed) else None
    text = words or copy.chat_reply(units=units, city=s.dist.city, best_before=best, ask=ask)
    q.answered = True
    ctx.session.add(
        m.CaseMessage(case_id=s.case.id, sender="agent", text=text, at=ev.now(ctx, s.c), wall=ctx.clock.now())
    )
    if run is not None and reply and words is None:
        run.fallback = True
    await _run(ctx, s, client_id, run, f"answered a question on {s.case.listing['id']}")
    await _save(ctx, s)


async def _buyer_name(ctx: Ctx, client_id: str, member_ref: str) -> str:
    """the buyer's organisation, as the papers and the timeline name it"""
    bm = await world.member(ctx, client_id, member_ref)
    partner = await ctx.session.get(m.Partner, (client_id, bm.org_ref or ""))
    return partner.name if partner else bm.org


async def accept(ctx: Ctx, client_id: str, ref: str, bid_id: str) -> None:
    """the buyer takes the counter (or confirms an accepted bid) and pays the token: the lot is awarded"""
    ctx.require("listing.bid", "Only the buyer accepts.")
    s = await scene(ctx, client_id, ref)
    _guard(s, "accept")
    b = await ctx.session.get(m.CaseBid, bid_id, with_for_update=True)
    me = _member(ctx)
    if b is None or b.case_id != s.case.id or b.by_ref != me:
        raise not_found("bid")
    if b.status not in ("countered", "accepted"):
        raise stale("There is no counter to accept.")
    price = float(b.counter if b.status == "countered" else b.price)
    units = int(s.case.listing["units"])
    a = money.award(units, price, rules=s.rules)
    at = ev.now(ctx, s.c)
    buyer = await world.member(ctx, client_id, me)
    partner = await ctx.session.get(m.Partner, (client_id, buyer.org_ref or ""))
    buyer_name = partner.name if partner else buyer.org
    city = (partner.city if partner else "") or ""
    b.status = "accepted"
    s.case.award = money.jsonable(
        {**a, "at": at.isoformat(), "buyer": buyer_name, "buyerRef": me, "status": "token paid", "city": city}
    )
    s.case.listing = {**s.case.listing, "status": "awarded", "buyerName": buyer_name}
    ctx.session.add(
        m.CaseMessage(
            case_id=s.case.id,
            sender="buyer",
            text=copy.chat_accept(price_=price),
            at=at,
            wall=ctx.clock.now(),
            by_ref=me,
            answered=True,
        )
    )
    await ev.feed(
        ctx,
        s.c,
        s.case,
        "accepted",
        "execute",
        copy.accepted_event(price_=price, token=a["token"]),
        person=me,
        human=True,
    )
    await audit.record(
        ctx,
        s.c.id,
        "listing.accept",
        f"accepted ₹{price:.2f} and paid the token",
        {"member": me, "target": s.case.listing["id"], "batch": ref},
    )
    for ref_ in await _approver(ctx, s.c):
        await ev.notify(
            ctx,
            s.c,
            ref_,
            "award",
            link="execution",
            case=s.case,
            **copy.push_award(
                units=units, price_=price, buyer=buyer_name, city=city, token=a["token"], balance=a["balance"]
            ),
        )
    for p in await _people(ctx, s.c, org=s.dist.id):
        await ev.notify(
            ctx,
            s.c,
            p.ref,
            "won",
            link="orders",
            case=s.case,
            **copy.push_won(person=p.name, buyer=buyer_name, city=city, units=units, price_=price, token=a["token"]),
        )
    await ev.publish(ctx, J.Event(J.DEAL_CLOSED, {"client": s.c.id, "ref": ref, "price": price}, f"{s.c.id}:{ref}"))
    await _save(ctx, s)


def _moments(c: m.Client) -> dict[str, Any]:
    """the journey's moments the client's workspace keeps (cli/live.py, from design3 JOURNEY)"""
    return dict((c.workspace_doc or {}).get("moments") or {})


def _at_hour(day: datetime, hhmm: str) -> datetime:
    h, mi = (int(x) for x in hhmm.split(":"))
    return day.astimezone(IST).replace(hour=h, minute=mi, second=0, microsecond=0)


def _pickup_times(c: m.Client, at: datetime) -> tuple[datetime, list[datetime]]:
    """the pickup the Donation agent proposes (the next day, at the partner's hour) and the slots it may move to"""
    rules = _moments(c).get("donation") or {}
    proposed = _at_hour(at + timedelta(days=1), rules.get("time", "10:00"))
    slots = [_at_hour(proposed + timedelta(days=x["days"]), x["time"]) for x in rules.get("slots", [])]
    return proposed, slots


async def confirm_pickup(ctx: Ctx, client_id: str, ref: str) -> None:
    ctx.require("pickup.manage", "Only the food bank confirms a pickup.")
    s = await scene(ctx, client_id, ref)
    _guard(s, "pickup")
    me = await world.member(ctx, client_id, _member(ctx))
    if me.org_ref != s.case.donation.get("partner"):
        raise ApiError(403, "This donation is booked with another food bank.")
    now = ev.now(ctx, s.c)
    proposed = s.case.donation.get("pickupAt")
    when_at = datetime.fromisoformat(proposed) if proposed else _pickup_times(s.c, now)[0]
    if when_at < now:  # the proposed time has gone by: the next of the same hour
        when_at = _pickup_times(s.c, now)[0]
    when = f"{copy.weekday(when_at)} {when_at.astimezone(IST):%H:%M}"
    s.case.donation = {
        **s.case.donation,
        "status": "confirmed",
        "pickupAt": when_at.isoformat(),
        "confirmedAt": now.isoformat(),
        "reply": copy.pickup_reply(
            day=copy.weekday(when_at), spot=s.case.donation.get("spot") or f"{s.dist.city}'s serving point"
        ),
    }
    await audit.record(
        ctx,
        s.c.id,
        "donation.confirm",
        f"confirmed the pickup, {when}",
        {"member": me.ref, "target": f"{ref} · {s.case.donation['units']} packs", "batch": ref},
    )
    for ref_ in await _approver(ctx, s.c):
        await ev.notify(
            ctx,
            s.c,
            ref_,
            "pickup.confirmed",
            link="execution",
            case=s.case,
            **copy.push_pickup_confirmed(
                partner=s.case.donation["partnerName"],
                units=s.case.donation["units"],
                sku_name=s.sku.name,
                when=when,
                godown=s.dist.godown or s.dist.city,
            ),
        )
    await _save(ctx, s)


async def collect(ctx: Ctx, client_id: str, ref: str) -> None:
    ctx.require("pickup.manage", "Only the food bank collects.")
    s = await scene(ctx, client_id, ref)
    _guard(s, "collect")
    me = await world.member(ctx, client_id, _member(ctx))
    if me.org_ref != s.case.donation.get("partner"):
        raise ApiError(403, "This donation is booked with another food bank.")
    rcpt = await _issue_receipt(ctx, s, ev.now(ctx, s.c), me.name)
    await audit.record(
        ctx,
        s.c.id,
        "donation.collect",
        f"collected {s.case.donation['units']} packs and issued "
        + (f"{rcpt['type'].lower()} {rcpt['no']}" if rcpt else "the receipt"),
        {"member": me.ref, "target": ref, "batch": ref},
    )
    await _advance(ctx, s)
    await _save(ctx, s)


async def _decline(ctx: Ctx, s: Scene, reason: str, *, agent: str | None = None, person: str | None = None) -> None:
    """the food-bank line goes untaken: the packs stay at the godown, the approver is told, and the case moves on"""
    fb = _line(s, "foodbank") or {"units": 0}
    s.case.donation = {
        **(s.case.donation or {}),
        "status": "declined",
        "units": fb["units"],
        "reason": reason,
        "declinedAt": ev.now(ctx, s.c).isoformat(),
    }
    s.case.phase = "executing"
    text = copy.declined_event(sku_name=s.sku.name, units=fb["units"], reason=reason)
    if person:
        await ev.feed(ctx, s.c, s.case, "declined", "execute", text, person=person, human=True)
    else:
        await ev.feed(ctx, s.c, s.case, "declined", "execute", text, agent=agent, icon="heart-handshake")
    for ref_ in await _approver(ctx, s.c):
        push = copy.push_declined(sku_name=s.sku.name, units=fb["units"], reason=reason)
        await ev.notify(ctx, s.c, ref_, "donation.declined", link="execution", case=s.case, **push)
    await _advance(ctx, s)


async def decline_donation(ctx: Ctx, client_id: str, ref: str) -> None:
    """the food bank turns the pickup down (SC-86): the packs stay at the godown"""
    ctx.require("pickup.manage", "Only the food bank answers a pickup request.")
    s = await scene(ctx, client_id, ref)
    _guard(s, "decline")
    me = await world.member(ctx, client_id, _member(ctx))
    if me.org_ref != s.case.donation.get("partner"):
        raise ApiError(403, "This donation is booked with another food bank.")
    partner = s.case.donation.get("partnerName") or me.org
    await audit.record(
        ctx,
        s.c.id,
        "donation.decline",
        "declined the pickup",
        {"member": me.ref, "target": f"{ref} · {s.case.donation['units']} packs", "batch": ref},
    )
    await _decline(ctx, s, f"{partner} turned the pickup down", person=me.ref)
    await _save(ctx, s)


async def staff_sale(ctx: Ctx, client_id: str, ref: str, sold: int) -> None:
    """the distributor records the staff sale at his godown (SC-86): what sold, out of the plan's staff line"""
    ctx.require("staff.record", "Only the distributor records the staff sale.")
    s = await scene(ctx, client_id, ref)
    me = await world.member(ctx, client_id, _member(ctx))
    if me.org_ref != s.dist.id:
        raise ApiError(403, "Only the distributor holding this batch runs its staff sale.")
    _guard(s, "staff")
    units = int(s.case.staff["units"])
    if sold < 0 or sold > units:
        raise ApiError(422, f"Between 0 and {units} packs.", {"sold": f"Up to {units} packs."})
    s.case.staff = {
        **s.case.staff,
        "status": "recorded",
        "sold": sold,
        "left": units - sold,
        "recordedAt": ev.now(ctx, s.c).isoformat(),
        "by": me.ref,
    }
    godown = s.case.staff.get("godown") or s.dist.city
    await ev.feed(
        ctx,
        s.c,
        s.case,
        "staff",
        "execute",
        copy.staff_event(sold=sold, units=units, godown=godown),
        person=me.ref,
        human=True,
    )
    await audit.record(
        ctx,
        s.c.id,
        "staff.record",
        f"recorded the staff sale: {sold} of {units} packs",
        {"member": me.ref, "target": f"{ref} · {godown}", "batch": ref},
    )
    for ref_ in await _approver(ctx, s.c):
        push = copy.push_staff_recorded(distributor=s.dist.name, sku_name=s.sku.name, sold=sold, units=units)
        await ev.notify(ctx, s.c, ref_, "staff.recorded", link="execution", case=s.case, **push)
    await _advance(ctx, s)
    await _save(ctx, s)


async def close_listing(ctx: Ctx, client_id: str, ref: str, run: Run | None) -> None:
    """the ExpireSoon lot's deadline (SC-86): a lot no buyer has taken closes unsold, and the case moves on"""
    s = await scene(ctx, client_id, ref)
    await once(ctx, run)
    listing_ = s.case.listing or {}
    if listing_.get("status") != "live" or s.case.award:
        raise Noop()
    await _end_listing(ctx, s)
    await _run(ctx, s, client_id, run, f"closed {listing_['id']} unsold")
    await _save(ctx, s, note=f"{listing_['id']} closed unsold")


async def _end_listing(ctx: Ctx, s: Scene) -> None:
    """a lot no buyer took closes unsold: its open bids lapse, and the case moves on"""
    listing_ = s.case.listing or {}
    s.case.listing = {**listing_, "status": "ended", "endedAt": ev.now(ctx, s.c).isoformat()}
    for b in (
        await ctx.session.execute(
            select(m.CaseBid).where(m.CaseBid.case_id == s.case.id, m.CaseBid.status.in_(("placed", "countered")))
        )
    ).scalars():
        b.status = "expired"
    text = copy.listing_ended_event(listing_id=listing_.get("id", ""), units=int(listing_.get("units", 0)))
    await ev.feed(ctx, s.c, s.case, "unsold", "execute", text, agent="Lister", icon="shopping-bag")
    await _advance(ctx, s)


# --- settle -----------------------------------------------------------------------------------------------------------


async def dispatch(ctx: Ctx, client_id: str, ref: str, kind: str) -> None:
    """the buyer's truck loaded at the godown (then the papers), or the van round run to the kiranas"""
    ctx.require("dispatch.manage", "Only the distributor dispatches.")
    s = await scene(ctx, client_id, ref)
    me = await world.member(ctx, client_id, _member(ctx))
    if me.org_ref != s.dist.id:
        raise ApiError(403, "Only the distributor holding this batch dispatches it.")
    at = ev.now(ctx, s.c)
    if kind == "truck":
        _guard(s, "truck")
        if not J.offer_done(_state(s.case)):
            closes = (s.case.offer or {}).get("closesAt")
            raise stale(
                "The kirana scheme is still open"
                + (f" until {datetime.fromisoformat(closes).astimezone(IST):%d %b, %H:%M}." if closes else ".")
            )
        s.case.truck = {"status": "dispatched", "at": at.isoformat()}
        s.case.award = {**(s.case.award or {}), "status": "paid"}
        award = s.case.award
        await ev.feed(
            ctx,
            s.c,
            s.case,
            "dispatch",
            "settle",
            copy.dispatch_event(buyer=award.get("buyer", "the buyer"), city=award.get("city", "")),
            person=me.ref,
            human=True,
        )
        await audit.record(
            ctx,
            s.c.id,
            "dispatch.truck",
            f"loaded {copy.possessive(award.get('buyer', 'the buyer'))} truck",
            {"member": me.ref, "target": f"{s.case.listing['id']} · {award.get('city', '')}", "batch": ref},
        )
        await _advance(ctx, s)
        await _save(ctx, s, note="dispatched")
        return
    _guard(s, "van")
    orders = (await ctx.session.execute(select(m.CaseOrder).where(m.CaseOrder.case_id == s.case.id))).scalars().all()
    # the round is named by its own day, as its Van route and push name it (SC-97), even when it runs early
    day = copy.weekday(J.van_leaves(s.case.offer, s.case.docs, world.van_time(s.c)) or at)
    s.case.van = {"status": "done", "done": len(orders), "at": at.isoformat()}
    await ev.feed(
        ctx,
        s.c,
        s.case,
        "van",
        "settle",
        copy.van_event(day=day, shops=len(orders), units=sum(o.units for o in orders)),
        person=me.ref,
        human=True,
    )
    await audit.record(
        ctx,
        s.c.id,
        "dispatch.van",
        f"ran the {day} round: {len(orders)} drops",
        {"member": me.ref, "target": f"{s.dist.city} cluster", "batch": ref},
    )
    await _save(ctx, s)


async def documents(ctx: Ctx, client_id: str, ref: str, run: Run | None) -> None:
    """Paperwork drafts the distributor's invoice and checks the e-way bill rule, and issues the client's price-support
    credit note, the ITC memo and the FSSAI checklist (money.py documents, numbered in sequence). A batch already
    cleared has its papers (a noop), and Paperwork goes on to lay out the PDFs it lacks"""
    s = await scene(ctx, client_id, ref, cleared=True)
    await once(ctx, run)
    if s.case.phase != "dispatched" or s.case.docs:
        raise Noop()
    plan_ = await realised(ctx, s)  # the plan as its lines came to: what was ordered, awarded, sold and collected
    award = s.case.award
    sku = s.sku_obj()
    awarded = {k: award[k] for k in ("units", "price", "gross", "token", "balance")} if award else None
    support = money.price_support(plan_, sku, award["price"] if award else None, rules=s.rules)
    buyer = None
    if award and award.get("buyerRef"):
        bm = await world.member(ctx, client_id, award["buyerRef"])
        partner = await ctx.session.get(m.Partner, (client_id, bm.org_ref or ""))
        if partner:
            buyer = {"name": partner.name, "short": partner.short, "city": partner.city, **partner.details}
    parties = {
        "seller": {**world.dist_obj(s.dist), "short": s.dist.short or s.dist.name},
        "buyer": buyer or {"name": "", "short": "", "city": ""},
        "client": {"name": s.c.name, "short": s.c.short},
    }
    # without the distributor's own price (dp) there is no gap to support, so no credit note: a number is drawn only for
    # a paper that is issued, so the sequence has no gaps
    blank = {"support": "", "invoice": ""}
    # a donated batch's pack carries the food bank's receipt, as it was issued at collection (SC-110)
    rcpt = (s.case.donation or {}).get("receipt") if (s.case.donation or {}).get("status") == "collected" else None
    draft = money.documents(plan_, sku, awarded, support, parties, rcpt, numbers=blank, rules=s.rules)
    # a credit note is issued only for a gap to support (an SKU with its dealer price, and something sold below it)
    issues_support = any(d["id"] == "support" and (money.jsonable(d.get("amount")) or 0) > 0 for d in draft)
    numbers = {
        "support": await world.next_number(ctx, client_id, "support") if issues_support else "",
        "invoice": await world.next_number(ctx, client_id, "invoice") if award and _line(s, "expiresoon") else "",
    }
    docs = money.documents(plan_, sku, awarded, support, parties, rcpt, numbers=numbers, rules=s.rules)
    docs = [d for d in docs if not (d["id"] == "support" and not issues_support)]
    # the papers are dated the journey day the Paperwork agent drafts them; the receipt keeps its own day and PDF
    dated = _today(ctx, s.c).isoformat()
    s.case.docs = money.jsonable([{**d, "pdf": d.get("pdf"), "date": d.get("date") or dated} for d in docs])
    s.case.phase = "settled"
    orders = await _orders(ctx, s)
    if not orders:  # nothing went to the kiranas: no van round
        s.case.van = {"status": "done", "done": 0, "at": ev.now(ctx, s.c).isoformat()}
    invoice = next((d for d in docs if d["id"] == "invoice"), None)
    credit = next((d for d in docs if d["id"] == "support"), None)
    dist_people = await _people(ctx, s.c, org=s.dist.id)
    e = copy.papers_event(
        distributor_person=_short(dist_people, s.dist.name),
        invoice=invoice,
        support=credit,
        itc=float(plan_.get("itcRetained", 0)),
    )
    await ev.feed(
        ctx, s.c, s.case, "papers", "settle", e["text"], calls=e["calls"], agent="Paperwork", icon="file-check"
    )
    # the operator reviews the papers (SC-127)
    for p in await _people(ctx, s.c, role="operator"):
        await ev.notify(
            ctx,
            s.c,
            p.ref,
            "papers",
            link="paperwork",
            case=s.case,
            **copy.push_papers(
                ref=ref, distributor_person=_short(dist_people, s.dist.name), invoice=invoice is not None
            ),
        )
    for p in dist_people:
        if invoice is not None and award:
            await ev.notify(
                ctx,
                s.c,
                p.ref,
                "invoice",
                link="orders",
                case=s.case,
                **copy.push_invoice(
                    buyer=award["buyer"],
                    city=award.get("city", ""),
                    units=invoice["units"],
                    price_=invoice["price"],
                    gst_pct=invoice["gstPct"],
                    total=invoice["total"],
                    client=_client_short(s.c),
                    support=credit["amount"] if credit else 0,
                ),
            )
        if orders:
            await ev.notify(
                ctx,
                s.c,
                p.ref,
                "van",
                link="van",
                case=s.case,
                **copy.push_van(
                    day=copy.weekday(
                        J.van_leaves(s.case.offer, s.case.docs, world.van_time(s.c))
                        or ev.now(ctx, s.c) + timedelta(days=1)
                    ),
                    shops=len(orders),
                    units=sum(o.units for o in orders),
                    city=award.get("city", "") if award else "",
                    lot=int(s.case.listing["units"]) if s.case.listing else 0,
                ),
            )
    await _run(ctx, s, client_id, run, f"drafted {ref}'s papers")
    await _save(ctx, s, note="papers drafted")


async def document_pdf(ctx: Ctx, client_id: str, ref: str, doc_id: str, name: str, run: Run | None) -> None:
    """the PDF the Paperwork agent rendered into the docs bucket: kept on a batch cleared before it arrived too
    (Report now clears a batch as its papers are drafted), and on the client's history (SC-123)"""
    s = await scene(ctx, client_id, ref, cleared=True)
    # a new dict for the paper, not the stored one changed in place: the column is then a value that differs from what
    # was loaded, so it is written (SC-100: in place, the PDF was never kept)
    s.case.docs = [{**d, "pdf": name} if d["id"] == doc_id else d for d in s.case.docs or []]
    rcpt = (s.case.donation or {}).get("receipt")
    if doc_id == "receipt" and rcpt:  # the food bank's receipt, laid out as it collected (SC-110)
        s.case.donation = {**s.case.donation, "receipt": {**rcpt, "pdf": name}}
    await ctx.session.flush()
    await ev.changed(ctx, s.c, ref)
    if s.case.ledger is not None:
        await ev.ledger_changed(ctx, s.c, ref)


# the papers the Paperwork agent lays out as PDFs (agents: tools/pdf.py PAPERS)
PDF_PAPERS = frozenset({"invoice", "support", "itc", "fssai", "receipt", "expiry"})


async def lay_out_missing(ctx: Ctx, client_id: str, *, again: bool = False) -> list[str]:
    """asks the Paperwork agent for every paper in view, the journey's and the history's, that has no PDF yet: one
    drafted before its template existed (the expiry credit note, SC-125), or one whose PDF failed. It lays out only what
    lacks one; `again` lays out every paper afresh (a template that changed). Returns the batches asked for"""
    asked = []
    for ref, case in (await views.cases_in_view(ctx, client_id)).items():
        if case.status == "reset":
            continue
        if again and case.docs:  # a new list, so the change is written
            case.docs = [{**d, "pdf": None} if d["id"] in PDF_PAPERS else d for d in case.docs]
        docs = case.docs or []
        if any(d["id"] in PDF_PAPERS and d.get("status") != "not required" and not d.get("pdf") for d in docs):
            settle = {"type": J.SETTLE, "client": client_id, "ref": ref}
            await ev.publish(ctx, J.Event(J.STEP, settle, f"{client_id}:{ref}"))
            asked.append(ref)
    return sorted(asked)


async def issue_invoice(ctx: Ctx, client_id: str, ref: str) -> None:
    ctx.require("invoice.issue", "Only the distributor issues his invoice.")
    s = await scene(ctx, client_id, ref, cleared=True)
    _guard(s, "invoice")
    me = await world.member(ctx, client_id, _member(ctx))
    if me.org_ref != s.dist.id:
        raise ApiError(403, "Only the distributor holding this batch issues its invoice.")
    if s.case.invoice_issued_at is not None:
        return
    invoice = next((d for d in s.case.docs if d["id"] == "invoice"), None)
    if invoice is None:
        raise stale("There is no invoice to issue.")
    s.case.invoice_issued_at = ev.now(ctx, s.c)
    await audit.record(
        ctx,
        s.c.id,
        "invoice.issue",
        "issued the invoice from Tally",
        {"member": me.ref, "target": f"{invoice['no']} · {(s.case.award or {}).get('buyer', '')}", "batch": ref},
    )
    await _save(ctx, s)


async def review(ctx: Ctx, client_id: str, ref: str) -> None:
    ctx.require("docs.review", "Your role can't review the papers.")
    s = await scene(ctx, client_id, ref, cleared=True)
    _guard(s, "review")
    if s.case.reviewed:
        return
    me = _member(ctx)
    s.case.reviewed = {"by": me, "at": ev.now(ctx, s.c).isoformat()}
    await audit.record(
        ctx,
        s.c.id,
        "docs.review",
        f"reviewed {copy.possessive(_client_short(s.c))} credit note and GST memo",
        {"member": me, "target": ref, "batch": ref},
    )
    await _save(ctx, s)


# --- expiry day (SC-94) -----------------------------------------------------------------------------------------------


async def expire(ctx: Ctx, client_id: str, ref: str) -> None:
    """expiry day: Report now in the console, or the report's own timer at best-before (SC-94). The journey is taken to
    its end as it stands: the kirana scheme closes with the orders placed, a lot no buyer accepted ends unsold and an
    accepted one counts as collected, an open staff sale closes at what was recorded, a confirmed pickup counts as
    collected and an unconfirmed one is declined, and the orders placed count as delivered. The papers follow if they
    were not drafted; the report then settles what is left at the godown by the client's expiry policy"""
    s = await scene(ctx, client_id, ref)
    if s.case.status != "open" or s.case.phase not in ("approved", "executing", "dispatched", "settled"):
        raise Noop()
    at = ev.now(ctx, s.c).isoformat()
    s.case.expired_at = ctx.clock.now()  # every line not yet run counts as done, with nothing taken
    if (s.case.offer or {}).get("status") == "sent":
        await _close_offer(ctx, s)
    if s.case.award:
        if (s.case.truck or {}).get("status") != "dispatched":  # the accepted lot counts as collected
            s.case.truck = {"status": "dispatched", "at": at, "onExpiry": True}
            s.case.award = {**s.case.award, "status": "paid"}
    elif (s.case.listing or {}).get("status") == "live":
        await _end_listing(ctx, s)
    if (s.case.staff or {}).get("status") == "open":
        units = int(s.case.staff["units"])
        s.case.staff = {
            **s.case.staff,
            "status": "recorded",
            "sold": 0,
            "left": units,
            "recordedAt": at,
            "onExpiry": True,
        }
    d = s.case.donation or {}
    if d.get("status") == "confirmed":  # the confirmed pickup counts as collected, with its receipt (SC-110)
        await _issue_receipt(ctx, s, datetime.fromisoformat(at), d.get("partnerName") or "")
        s.case.donation = {**s.case.donation, "onExpiry": True}
    elif d and d.get("status") not in ("collected", "declined"):
        await _decline(ctx, s, "the batch expired before the pickup", agent="Donation")
    await _advance(ctx, s)
    orders = await _orders(ctx, s)
    if (s.case.van or {}).get("status") != "done":  # the orders placed count as delivered
        s.case.van = {"status": "done", "done": len(orders), "at": at, "onExpiry": bool(orders)}
    plan_ = await realised(ctx, s)
    await ev.feed(
        ctx,
        s.c,
        s.case,
        "expired",
        "report",
        copy.expired_event(units=int(plan_.get("godown", 0)), godown=s.dist.godown or f"{s.dist.city} godown"),
        agent="Impact",
        icon="hourglass",
    )
    await _save(ctx, s, note="expired")
    if s.case.phase == "dispatched" and not s.case.docs:
        await documents(ctx, client_id, ref, None)


EXPIRY_PAPER = {
    "full-credit": "Expiry credit note",
    "price-support": "Price support at expiry",
    "none": "Expiry notice",
}


async def _settle_expiry(ctx: Ctx, s: Scene, plan_: dict[str, Any]) -> dict[str, Any]:
    """the packs left at the godown, expired: settled by the client's expiry policy (money.expiry_settlement), with its
    paper; the destruction certificate counts them when the client destroys them, and the GST memo reverses their
    credit"""
    godown = int(plan_.get("godown", 0))
    settle = money.jsonable(money.expiry_settlement(godown, s.sku_obj(), s.c.expiry, rules=s.rules))
    if not godown:
        return settle
    client, dist = _client_short(s.c), s.dist.name
    at = s.dist.godown or f"{s.dist.city} godown"
    number = await world.next_number(ctx, s.c.id, "support") if (settle["credit"] or 0) > 0 else ""
    paper = {
        "id": "expiry",
        "type": EXPIRY_PAPER[s.c.expiry],
        "owner": client,
        "no": number,
        "status": "not required" if s.c.expiry == "none" else "generated",
        "amount": settle["credit"],
        "units": godown,
        "policy": s.c.expiry,
        "destroyedBy": settle["destroyedBy"],
        "disposal": settle["disposal"],
        "epr": settle["epr"],
        "itc": settle["itc"],
        "note": copy.expiry_settled(
            policy=s.c.expiry, units=godown, credit=settle["credit"], client=client, distributor=dist, godown=at
        ),
        "pdf": None,
        "date": _today(ctx, s.c).isoformat(),
    }
    docs = [dict(d) for d in (s.case.docs or [])]
    # the papers drafted before expiry day count again what the client destroys and the credit it reverses (SC-122)
    destroyed = int(plan_.get("destroyed", plan_.get("leftover", 0)))
    for d in docs:
        if d["id"] == "destruction" and destroyed:
            d.update({"no": f"{destroyed} units", "status": "generated", "units": destroyed})
        if d["id"] == "itc":
            d.update({"amount": plan_["itcRetained"], "reversed": plan_["itcReversed"]})
    s.case.docs = money.jsonable([*docs, paper])
    if paper["status"] == "generated":  # Paperwork lays out the credit note's PDF (SC-121)
        await ev.publish(ctx, J.Event(J.STEP, {"type": J.SETTLE, "client": s.c.id, "ref": s.ref}, f"{s.c.id}:{s.ref}"))
    return settle


async def report(ctx: Ctx, client_id: str, ref: str, run: Run | None) -> dict[str, Any]:
    """Impact posts the ledger once the return window has closed: the batch is cleared, and the console's batch closes
    with what it recovered. Returns the ledger, which the agent appends to BigQuery"""
    s = await scene(ctx, client_id, ref)
    await once(ctx, run)
    if s.case.phase != "settled" or (s.case.van or {}).get("status") != "done":
        raise Noop()
    plan_ = await realised(ctx, s)  # what the lines came to; what no channel took stays at the godown
    settle = await _settle_expiry(ctx, s, plan_)  # and expires, settled by the client's expiry policy (SC-94)
    award = s.case.award
    # every batch's ledger carries its swing and P&L, with or without an ExpireSoon lot (SC-122)
    actual = money.actual_net(plan_, award["price"]) if award else money.actual_net(plan_, 0)
    at = ev.now(ctx, s.c)
    return_by = (s.batch.best_before - timedelta(days=s.c.return_window_days)).isoformat()

    # the lines as they came to, the ExpireSoon lot at its award price, so they add up to the net (SC-122)
    def at_award(ln: dict[str, Any]) -> dict[str, Any]:
        if ln["id"] != "expiresoon" or not award:
            return ln
        gross = money.r2(ln["units"] * award["price"])
        return {**ln, "price": award["price"], "gross": gross, "net": money.r2(gross - ln["cost"]), "atAward": True}

    ledger = money.jsonable(
        {
            "net": actual["net"],
            "swing": actual["swing"],
            "pnl": actual["pnl"],
            "kg": plan_.get("kg", 0),
            "co2": plan_.get("co2", 0),
            "meals": plan_.get("meals", 0),
            "itc": plan_.get("itcRetained", 0),
            "itcReversed": plan_.get("itcReversed", 0),
            "destroyed": plan_.get("destroyed", plan_.get("leftover", 0)),
            "lines": [at_award(ln) for ln in plan_.get("lines", [])],
            "planned": (s.case.plan or {}).get("lines", []),
            "godown": plan_.get("godown", 0),
            "expiry": settle,
            "at": at.isoformat(),
            "returnBy": return_by,
            "actual": actual,
        }
    )
    s.case.ledger, s.case.phase = ledger, "cleared"
    e = copy.ledger_event(
        return_by=return_by,
        on=at.astimezone(IST).date().isoformat(),
        kg=float(plan_.get("kg", 0)),
        co2=float(plan_.get("co2", 0)),
        meals=int(plan_.get("meals", 0)),
        net=float(actual["net"]),
    )
    await ev.feed(ctx, s.c, s.case, "ledger", "report", e["text"], calls=e["calls"], agent="Impact", icon="leaf")
    leftover = int(plan_.get("leftover", 0))
    cartons = round(leftover / (s.sku.per_carton or 24))
    for ref_ in await _approver(ctx, s.c):
        await ev.notify(
            ctx,
            s.c,
            ref_,
            "closed",
            link="command",
            case=s.case,
            **copy.push_closed(
                net=float(actual["net"]),
                itc=float(plan_.get("itcRetained", 0)),
                kg=float(plan_.get("kg", 0)),
                cartons=cartons,
                planned=float((s.case.plan or {}).get("net", 0)),
                godown=int(plan_.get("godown", 0)),
                at=s.dist.godown or f"{s.dist.city} godown",
                settled=next((d["note"] for d in s.case.docs or [] if d["id"] == "expiry"), ""),
            ),
        )
    await audit.record(ctx, s.c.id, "ledger.post", "posted the ledger and the BRSR row", {"target": ref, "batch": ref})
    await _run(ctx, s, client_id, run, f"posted {ref}'s ledger: {money.fmt.inr(actual['net'])} recovered")
    s.case.status, s.case.closed_at = "cleared", at
    await _save(ctx, s, note="cleared")
    await supply.close_batch(ctx, client_id, ref, recovered=float(actual["net"]), outcome="cleared")
    await ev.apply_speed(ctx, s.c)
    return {"ledger": ledger}
