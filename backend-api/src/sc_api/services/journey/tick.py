"""The tick (SC-66): what happens on the journey's own clock, called every minute by Cloud Scheduler
(POST /internal/jobs/tick), or by a laptop's own loop (TICK_SECONDS). For each client running live journeys:

1. the daily runs, on journey time: the day's synthetic DMS exports and the Data agent at its time (08:30), then the
   Watcher at its own (09:00), once setup is confirmed;
2. the timers that are due: an offer's window closing (done here), the day-7 shelf check and the report (sent to the
   agents, which read BigQuery);
3. a journey stalled on an agent for ten minutes (a message lost, an agent down) gets its event again;
4. then the outbox goes out.

A timer fires within a tick of its time: at one minute a day, within a journey day.
"""

from contextlib import suppress
from datetime import time, timedelta
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

    data_time = _at(agents.get("data", {}).get("time", "08:30"))
    if daily.get("data") != today.isoformat() and now.time() >= data_time and agents.get("data", {}).get("on", True):
        files = []
        if doc.get("synthetic") and ctx.cloud is not None and ctx.settings.exports_bucket:
            files = await dms.write_day(ctx, client_id, today, start=start)
        daily["data"] = today.isoformat()
        await ev.publish(
            ctx,
            J.Event(
                J.STEP,
                {"type": J.DUE, "client": client_id, "agent": "data", "day": today.isoformat(), "files": files},
                client_id,
            ),
        )
        out["daily"].append("data")
    watch_time = _at(agents.get("watcher", {}).get("time", "09:00"))
    if (
        daily.get("watcher") != today.isoformat()
        and now.time() >= watch_time
        and c.setup_confirmed_at is not None
        and agents.get("watcher", {}).get("on", True)
    ):
        daily["watcher"] = today.isoformat()
        await ev.publish(
            ctx,
            J.Event(
                J.STEP, {"type": J.DUE, "client": client_id, "agent": "watcher", "day": today.isoformat()}, client_id
            ),
        )
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
        if case is None or case.status != "open":
            t.fired_wall = wall
            continue
        if t.kind == "offer.close":
            t.fired_wall = wall
            with suppress(steps.Noop):
                await steps.close_offer(
                    ctx, client_id, case.batch_ref, steps.Run("outreach", event_key=f"timer:{t.id}")
                )
        elif t.kind == "shelf.due":
            if case.phase == "settled" and (case.van or {}).get("status") == "done":
                t.fired_wall = wall
                files = []
                if doc.get("synthetic") and ctx.cloud is not None and ctx.settings.exports_bucket:
                    story = (doc.get("story") or {}).get("shelf") if case.batch_ref == doc.get("heroRef") else None
                    files = [await dms.write_shelf(ctx, client_id, case, today, story)]
                await ev.publish(
                    ctx,
                    J.Event(
                        J.STEP,
                        {
                            "type": J.TIMER,
                            "kind": "shelf.due",
                            "client": client_id,
                            "ref": case.batch_ref,
                            "files": files,
                        },
                        f"{client_id}:{case.batch_ref}",
                    ),
                )
            else:  # not settled yet: look again a journey day later
                t.due_at = t.due_at + timedelta(days=1)
                t.due_wall = max(wall, ev.wall_of(c, t.due_at))
        elif t.kind == "report.due":
            ready = case.phase == "settled" and case.shelf and (case.van or {}).get("status") == "done"
            if ready:
                t.fired_wall = wall
                await ev.publish(
                    ctx,
                    J.Event(
                        J.STEP,
                        {"type": J.TIMER, "kind": "report.due", "client": client_id, "ref": case.batch_ref},
                        f"{client_id}:{case.batch_ref}",
                    ),
                )
            else:
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
