"""The tick (SC-66): what happens on the journey's own clock, called every minute by Cloud Scheduler
(POST /internal/jobs/tick), or by a laptop's own loop (TICK_SECONDS). For each client running live journeys:

1. the daily runs, on journey time: the day's synthetic DMS exports and the Data agent at its time (08:30), then the
   Watcher at its own (09:00), once setup is confirmed;
2. the timers that are due: an offer's window and an unsold lot closing (done here), and the report (sent to Impact,
   which reads BigQuery);
3. a journey stalled on an agent for ten minutes (a message lost, an agent down) gets its event again;
4. then the outbox goes out.

A timer fires within a tick of its time: at one minute a day, within a journey day. The console fires a daily run or a
timer at once through the same functions (`run_daily`, `ready`, `fire_timer`; controls.py, SC-79).
"""

from contextlib import suppress
from datetime import date, datetime, time, timedelta
from typing import Any

from sqlalchemy import delete, select

from sc_api import models as m
from sc_api.domain import journey as J
from sc_api.domain.clock import IST
from sc_api.services.context import Ctx
from sc_api.services.journey import dms, steps, world
from sc_api.services.journey import events as ev
from sc_api.services.presenter import lock_client

STALLED = timedelta(minutes=10)


def _at(hhmm: str) -> time:
    h, mm = (int(x) for x in hhmm.split(":"))
    return time(h, mm)


async def run(ctx: Ctx) -> dict[str, Any]:
    clients = list((await ctx.session.execute(select(m.Client.id).where(m.Client.journey_day0.is_not(None)))).scalars())
    done: dict[str, Any] = {}
    for client_id in clients:
        done[client_id] = await _client(ctx, client_id)
        await ctx.session.commit()
    # idempotency keys outlive any retry by far after a day
    await ctx.session.execute(
        delete(m.IdempotencyKey).where(m.IdempotencyKey.created_wall < ctx.clock.now() - timedelta(days=1))
    )
    await ctx.session.commit()
    return done


async def _client(ctx: Ctx, client_id: str) -> dict[str, Any]:
    c = await lock_client(ctx, client_id)
    out: dict[str, Any] = {"daily": [], "timers": [], "stalled": []}
    now = ev.now(ctx, c).astimezone(IST)
    today = now.date()
    doc = dict(c.workspace_doc or {})
    daily = dict(doc.get("daily") or {})
    agents = await world.agent_settings(ctx, client_id)
    start = (c.journey_day0 or today) - timedelta(days=90)

    data_time = _at(daily_time(agents, "data"))
    if daily.get("data") != today.isoformat() and now.time() >= data_time and agents.get("data", {}).get("on", True):
        await run_daily(ctx, c, "data", today, daily, doc, start=start)
        out["daily"].append("data")
    watch_time = _at(daily_time(agents, "watcher"))
    if (
        daily.get("watcher") != today.isoformat()
        and now.time() >= watch_time
        and c.setup_confirmed_at is not None
        and agents.get("watcher", {}).get("on", True)
    ):
        await run_daily(ctx, c, "watcher", today, daily, doc, start=start)
        out["daily"].append("watcher")
    if daily != doc.get("daily"):
        c.workspace_doc = {**doc, "daily": daily}

    wall = ctx.clock.now()
    timers = (
        (
            await ctx.session.execute(
                select(m.Timer)
                .where(m.Timer.client_id == client_id, m.Timer.fired_wall.is_(None), m.Timer.due_wall <= wall)
                .order_by(m.Timer.due_wall)
                .with_for_update(skip_locked=True)
            )
        )
        .scalars()
        .all()
    )
    for t in timers:
        case = await ctx.session.get(m.Case, t.case_id) if t.case_id else None
        if case is None or case.status != "open" or t.kind not in KINDS:
            t.fired_wall = wall
            continue
        if ready(t, case):
            await fire_timer(ctx, c, t, case, doc, today)
        else:  # not settled yet: look again a journey day later
            t.due_at = t.due_at + timedelta(days=1)
            t.due_wall = max(wall, ev.wall_of(c, t.due_at))
        out["timers"].append(f"{t.kind}:{case.batch_ref}")

    for case in (
        await ctx.session.execute(
            select(m.Case).where(
                m.Case.client_id == client_id, m.Case.status == "open", m.Case.updated_wall < wall - STALLED
            )
        )
    ).scalars():
        unanswered = await _unanswered(ctx, case)
        e = J.next_agent_event(views_state(case), client=client_id, ref=case.batch_ref, unanswered=unanswered)
        if e is not None:
            await ev.publish(ctx, e)
            case.updated_wall = wall
            out["stalled"].append(case.batch_ref)
    await ctx.session.flush()
    return out


DAILY_TIMES = {"data": "08:30", "watcher": "09:00"}


def daily_time(agents: dict[str, Any], agent_id: str) -> str:
    """the time of an agent's daily run, as the client's agent settings hold it"""
    return agents.get(agent_id, {}).get("time", DAILY_TIMES[agent_id])


async def run_daily(
    ctx: Ctx,
    c: m.Client,
    agent_id: str,
    today: date,
    daily: dict[str, Any],
    doc: dict[str, Any],
    *,
    start: date,
) -> None:
    """the Data agent's or the Watcher's run for `today`, marked done for the day (`daily`, which the caller saves):
    for the Data agent, the day's synthetic DMS exports first, as a real distributor's would arrive"""
    payload: dict[str, Any] = {"type": J.DUE, "client": c.id, "agent": agent_id, "day": today.isoformat()}
    if agent_id == "data":
        files = []
        if doc.get("synthetic") and ctx.cloud is not None and ctx.settings.exports_bucket:
            files = await dms.write_day(ctx, c.id, today, start=start)
        payload["files"] = files
    daily[agent_id] = today.isoformat()
    await ev.publish(ctx, J.Event(J.STEP, payload, c.id))


# the timers the journey sets; one of a kind since retired (the day-7 shelf check, SC-93) is put away, not fired
KINDS = ("offer.close", "listing.close", "report.due", "destruction.remind")


def ready(t: m.Timer, case: m.Case) -> bool:
    """whether a timer can fire: the offer and the lot close whenever they are due; the report, expiry day, once a plan
    is approved (it takes the journey to its end as it stands, SC-94)"""
    if t.kind == "report.due":
        return case.phase in ("approved", "executing", "dispatched", "settled")
    return True


async def fire_timer(ctx: Ctx, c: m.Client, t: m.Timer, case: m.Case, doc: dict[str, Any], today: date) -> None:
    """a timer that is ready, fired: the offer window and an unsold lot close here; the report goes to the agents"""
    wall: datetime = ctx.clock.now()
    t.fired_wall = wall
    if t.kind == "offer.close":
        with suppress(steps.Noop):
            await steps.close_offer(ctx, c.id, case.batch_ref, steps.Run("outreach", event_key=f"timer:{t.id}"))
        return
    if t.kind == "listing.close":  # an ExpireSoon lot no buyer took closes unsold (SC-86)
        with suppress(steps.Noop):
            await steps.close_listing(ctx, c.id, case.batch_ref, steps.Run("lister", event_key=f"timer:{t.id}"))
        return
    if t.kind == "destruction.remind":  # the destruction's evidence, still asked for: he is reminded (SC-139)
        with suppress(steps.Noop):
            await steps.remind_destruction(ctx, c.id, case.batch_ref)
        return
    if t.kind == "report.due":  # expiry day: the journey closes as it stands, then Impact reports (SC-94)
        with suppress(steps.Noop):
            await steps.expire(ctx, c.id, case.batch_ref)
    payload: dict[str, Any] = {"type": J.TIMER, "kind": t.kind, "client": c.id, "ref": case.batch_ref}
    await ev.publish(ctx, J.Event(J.STEP, payload, f"{c.id}:{case.batch_ref}"))


def views_state(case: m.Case) -> dict[str, Any]:
    return steps._state(case)


async def _unanswered(ctx: Ctx, case: m.Case) -> str | None:
    b = (
        (
            await ctx.session.execute(
                select(m.CaseBid)
                .where(m.CaseBid.case_id == case.id, m.CaseBid.status == "placed")
                .order_by(m.CaseBid.seq)
            )
        )
        .scalars()
        .first()
    )
    if b is not None:
        return f"bid:{b.id}"
    q = (
        (
            await ctx.session.execute(
                select(m.CaseMessage)
                .where(
                    m.CaseMessage.case_id == case.id, m.CaseMessage.sender == "buyer", m.CaseMessage.answered.is_(False)
                )
                .order_by(m.CaseMessage.id)
            )
        )
        .scalars()
        .first()
    )
    return f"message:{q.id}" if q is not None else None
