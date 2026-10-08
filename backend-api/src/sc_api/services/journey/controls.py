"""The console's demo controls (SC-79): a client's scheduled runs and its journey's pending timers, each with when it
falls due, fired at once on a staff member's word; and its journey started again, at a day length chosen then.

The schedule is the tick's own (tick.py): the Data agent's daily load and the Watcher's daily check on journey time,
and the timers an offer leaves (its window closing, the day-7 shelf check, the report). Firing one runs what the tick
would run, through the same functions, so a demo shows the real thing; the schedule does not move (a daily run fired
early is that day's run). A timer that is not ready yet (the shelf check before the van round, the report before the
papers and the shelf check) says why and is refused. Every fire and the reset write an audit line in the staff
member's name. A client whose workspace is not live has no journey: its two daily runs can still be run now, as before
(agents.run_now).
"""

from datetime import date, datetime, timedelta
from typing import Any

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain import copy
from sc_api.domain.clock import IST
from sc_api.errors import ApiError
from sc_api.services import agents as agent_svc
from sc_api.services import audit
from sc_api.services.context import Ctx
from sc_api.services.journey import events as ev
from sc_api.services.journey import reset as reset_svc
from sc_api.services.journey import tick, world
from sc_api.services.presenter import lock_client

DAILY = {"data": "daily load", "watcher": "daily check"}
NAMES = {"data": "Data agent", "watcher": "Watcher"}
TIMERS = {
    "offer.close": ("outreach", "closed the offer window"),
    "shelf.due": ("outreach", "ran the day-7 shelf check"),
    "report.due": ("impact", "wrote the report"),
}
BLOCKED = {
    "shelf.due": "After the van round: the papers come first",
    "report.due": "After the papers and the shelf check",
}


def _journey_iso(at: datetime) -> str:
    return at.astimezone(IST).isoformat()


async def _client(ctx: Ctx, client_id: str) -> m.Client:
    c = await ctx.session.get(m.Client, client_id)
    if c is None:
        raise ApiError(404, "No such client.")
    return c


async def schedule(ctx: Ctx, client_id: str) -> dict[str, Any]:
    """what is coming for a client, in time order: its daily runs, then its pending timers"""
    c = await _client(ctx, client_id)
    agents = await world.agent_settings(ctx, client_id)
    if c.journey_day0 is None:  # no live journey: the daily runs run when asked, as they always have
        return {
            "live": False,
            "clock": None,
            "triggers": [
                {
                    "id": a,
                    "agent": a,
                    "kind": "run",
                    "key": f"{a}.daily",
                    "ref": None,
                    "due": None,
                    "dueWall": None,
                    "time": tick.daily_time(agents, a),
                    "blocked": None if agents.get(a, {}).get("on", True) else f"The {NAMES[a]} is off",
                }
                for a in DAILY
            ],
        }
    now = ev.now(ctx, c).astimezone(IST)
    today = now.date()
    daily = dict((c.workspace_doc or {}).get("daily") or {})
    triggers: list[dict[str, Any]] = []
    for a in DAILY:
        hhmm = tick.daily_time(agents, a)
        h, mm = (int(x) for x in hhmm.split(":"))
        day = today if daily.get(a) != today.isoformat() else today + timedelta(days=1)
        due = datetime(day.year, day.month, day.day, h, mm, tzinfo=IST)
        blocked = None
        if not agents.get(a, {}).get("on", True):
            blocked = f"The {NAMES[a]} is off"
        elif a == "watcher" and c.setup_confirmed_at is None:
            blocked = "After Setup is confirmed"
        triggers.append(
            {
                "id": a,
                "agent": a,
                "kind": "run",
                "key": f"{a}.daily",
                "ref": None,
                "due": _journey_iso(due),
                "dueWall": ev.wall_of(c, due).isoformat(),
                "time": hhmm,
                "blocked": blocked,
            }
        )
    timers = (
        await ctx.session.execute(
            select(m.Timer, m.Case)
            .join(m.Case, m.Case.id == m.Timer.case_id)
            .where(m.Timer.client_id == client_id, m.Timer.fired_wall.is_(None), m.Case.status == "open")
            .order_by(m.Timer.due_at)
        )
    ).all()
    for t, case in timers:
        if t.kind not in TIMERS:
            continue
        triggers.append(
            {
                "id": f"timer-{t.id}",
                "agent": TIMERS[t.kind][0],
                "kind": "timer",
                "key": t.kind,
                "ref": case.batch_ref,
                "due": _journey_iso(t.due_at),
                "dueWall": t.due_wall.isoformat(),
                "time": None,
                "blocked": None if tick.ready(t, case) else BLOCKED.get(t.kind),
            }
        )
    triggers.sort(key=lambda x: x["due"] or "")
    return {
        "live": True,
        "clock": {
            "now": _journey_iso(now),
            "day": (today - c.journey_day0).days,
            "day0": c.journey_day0.isoformat(),
            "dayMinutes": c.day_minutes,
            "compressed": c.clock_speed is not None and c.clock_speed < 1440,
        },
        "triggers": triggers,
    }


async def fire(ctx: Ctx, client_id: str, trigger_id: str) -> None:
    """a daily run or a timer, now"""
    ctx.require("clients.configure", "Your role can't run a client's agents.")
    c = await lock_client(ctx, client_id)
    if trigger_id in DAILY:
        await _fire_daily(ctx, c, trigger_id)
        return
    if not trigger_id.startswith("timer-") or not trigger_id[6:].isdigit():
        raise ApiError(404, "No such run or timer.")
    t = await ctx.session.get(m.Timer, int(trigger_id[6:]), with_for_update=True)
    case = await ctx.session.get(m.Case, t.case_id) if t is not None and t.case_id else None
    if t is None or t.client_id != c.id or case is None or t.kind not in TIMERS:
        raise ApiError(404, "No such run or timer.")
    if t.fired_wall is not None or case.status != "open":
        raise ApiError(409, "That timer has already fired.")
    if not tick.ready(t, case):
        raise ApiError(409, BLOCKED.get(t.kind, "That timer isn't ready yet."))
    doc = dict(c.workspace_doc or {})
    await tick.fire_timer(ctx, c, t, case, doc, ev.now(ctx, c).astimezone(IST).date())
    agent = next(a for a in ctx.ref.agents if a["id"] == TIMERS[t.kind][0])
    await audit.record(
        ctx,
        c.id,
        "agent.run",
        f"Fired the {agent['name']} agent's timer now for {c.name}: {TIMERS[t.kind][1]} for {case.batch_ref}",
        {"agent": agent["id"], "target": case.batch_ref, "timer": t.kind},
    )


async def _fire_daily(ctx: Ctx, c: m.Client, agent_id: str) -> None:
    agents = await world.agent_settings(ctx, c.id)
    if not agents.get(agent_id, {}).get("on", True):
        raise ApiError(409, f"The {NAMES[agent_id]} is off for {c.name}.")
    if c.journey_day0 is None:  # not live: the run as it has always been on request
        await agent_svc.run_now(ctx, c.id, agent_id)
        return
    if agent_id == "watcher" and c.setup_confirmed_at is None:
        raise ApiError(409, "The Watcher starts once Setup is confirmed.")
    today: date = ev.now(ctx, c).astimezone(IST).date()
    doc = dict(c.workspace_doc or {})
    daily = dict(doc.get("daily") or {})
    # the Data agent's run is the day's files, sent again if need be (written once, so the same files): a journey
    # started again needs that day's stock reported, from files an earlier journey loaded (SC-79). The Watcher's first
    # run of the day is the tick's own; after it, Run now's event has it check again
    if agent_id == "data" or daily.get(agent_id) != today.isoformat():
        await tick.run_daily(ctx, c, agent_id, today, daily, doc, start=(c.journey_day0 or today) - timedelta(days=90))
        c.workspace_doc = {**doc, "daily": daily}
        await ctx.session.flush()
    else:
        from sc_api.domain import journey as J

        await ev.publish(ctx, J.Event(J.STEP, {"type": J.RUN_NOW, "client": c.id, "agent": agent_id}, c.id))
    await audit.record(
        ctx, c.id, "agent.run", f"Ran the {NAMES[agent_id]}'s {DAILY[agent_id]} now for {c.name}", {"agent": agent_id}
    )


async def reset(ctx: Ctx, client_id: str, day_minutes: int | None) -> dict[str, Any]:
    """the client's journey from day 0 again, at the day length chosen in the same confirmation"""
    ctx.require("clients.configure", "Your role can't start a client's journey again.")
    c = await lock_client(ctx, client_id)
    if c.journey_day0 is None:
        raise ApiError(409, f"{copy.possessive(c.name)} workspace isn't live, so it has no journey to start again.")
    if day_minutes is not None and day_minutes != c.day_minutes:
        await ev.set_day_minutes(ctx, client_id, day_minutes)
    return await reset_svc.reset(ctx, client_id)
