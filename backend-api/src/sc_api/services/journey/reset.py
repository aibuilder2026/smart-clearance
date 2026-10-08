"""A journey from the start (SC-66): what hydrate does after it builds Munchly's world, and what an operator runs to
play the story again (POST /internal/jobs/journey-reset, hydrate.sh --journey-reset, or the paused Scheduler job).

Nothing is deleted: open cases close as `reset`, and the workspace no longer shows any case opened before the reset,
whether it closed as `reset` or as `cleared` (SC-81). The story's batches are dated again from the new day 0, Rakesh
Traders' permission and the setup's confirmation go back to not yet given, and the client's clock moves forward to
08:00 on day 0, just before the Data agent's 08:30 and the Watcher's 09:00, running at the client's day length from
there (SC-86). Every at-risk batch then runs its own journey from the Watcher's first check: nothing is staged ahead
(the Mango Drink was, until SC-86). A gate override set on a batch in the console stays: it is the client's
configuration (SC-82). So does the stock export's mapping and who uploaded it, so Setup opens mapped (SC-84).
"""

from datetime import date, datetime, time, timedelta
from typing import Any

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain import journey as J
from sc_api.domain.clock import IST, journey_morning
from sc_api.services import audit
from sc_api.services.context import Ctx
from sc_api.services.journey import dms, world
from sc_api.services.journey import events as ev
from sc_api.services.presenter import lock_client
from sc_api.services.reference import load


def next_day0(now: datetime) -> date:
    """the journey's first morning: today, if it is not past 08:00 yet, else tomorrow"""
    local = now.astimezone(IST)
    return local.date() if local.time() <= time(8, 0) else local.date() + timedelta(days=1)


async def reset(ctx: Ctx, client_id: str) -> dict[str, Any]:
    c = await lock_client(ctx, client_id)
    j = load("journey.json")
    # the moment this journey begins: the workspace shows no case opened before it, however that case ended (SC-81)
    started = ctx.clock.now()
    # a synthetic workspace replays the story on its own calendar, so the label photos, the papers and the copy all
    # carry the story's dates; a real client's journey starts on its next morning
    synthetic = bool((c.workspace_doc or {}).get("synthetic"))
    day0 = date.fromisoformat(j["day0"]) if synthetic else next_day0(ev.now(ctx, c))
    for case in (
        await ctx.session.execute(
            select(m.Case).where(m.Case.client_id == client_id, m.Case.status == "open").with_for_update()
        )
    ).scalars():
        case.status, case.closed_at = "reset", ev.now(ctx, c)
    for t in (
        await ctx.session.execute(select(m.Timer).where(m.Timer.client_id == client_id, m.Timer.fired_wall.is_(None)))
    ).scalars():
        t.fired_wall = ctx.clock.now()

    # the story's batches, dated from the new day 0 (the label's dates for the hero, as data.js has them)
    hero_ref = next(b["id"] for b in j["batches"] if b.get("hero"))
    story_day0 = date.fromisoformat(j["day0"])
    for x in j["batches"]:
        b = await ctx.session.get(m.Batch, (client_id, x["id"]), with_for_update=True)
        best = day0 + timedelta(days=x["daysLeft"])
        mfg = date.fromisoformat(x["mfg"]) + (day0 - story_day0)
        if b is None:
            b = m.Batch(
                client_id=client_id,
                ref=x["id"],
                sku_id=x["sku"],
                distributor_id=x["distributor"],
                units=x["units"],
                stage_done=1,
                stage_current=1,
                opened_at=ctx.clock.now(),
                stage_at=ctx.clock.now(),
                best_before=best,
            )
            ctx.session.add(b)
        b.units, b.best_before, b.mfg = x["units"], best, mfg
        b.sell_per_day, b.shelf = x["sellPerDay"], x.get("shelf")
        b.stage_done = b.stage_current = 1
        b.stage_at, b.closed_at, b.outcome = ctx.clock.now(), None, None
        b.note, b.money, b.split, b.recovered = None, None, None, 0
        # a batch's gate override is the client's configuration (SC-47): the journey starting again keeps it (SC-82)
    await ctx.session.flush()

    # who has given the agents permission: the story's three other distributors, not Rakesh Traders yet
    given = set(j["setup"]["permissions"])
    for d in (await world.distributors(ctx, client_id)).values():
        if d.id in given:
            d.permission, d.permission_paused = "given", False
            d.permission_given_at = d.permission_given_at or ctx.clock.now()
        else:
            d.permission, d.permission_given_at, d.permission_by, d.permission_paused = "not-yet", None, None, False
    c.setup_confirmed_at = c.setup_confirmed_by = None
    # the export's mapping stays (SC-84): Setup opens mapped, and only its confirmation goes back to not given
    c.last_watch = None
    c.journey_day0 = day0
    doc = dict(c.workspace_doc or {})
    doc["daily"] = {}
    doc["heroRef"] = hero_ref
    doc["journeyFrom"] = started.isoformat()
    c.workspace_doc = doc
    await ev.start_at(ctx, c, journey_morning(day0), replay=synthetic)
    # the daily runs start over with the journey's days
    c.workspace_doc = {k: v for k, v in (c.workspace_doc or {}).items() if k != "daily"}
    await ctx.session.flush()

    if ctx.cloud is not None and ctx.settings.exports_bucket and doc.get("synthetic"):
        backfill = await dms.write_backfill(ctx, client_id, day0)
        await ev.publish(
            ctx,
            J.Event(
                J.STEP, {"type": "export.uploaded", "client": client_id, "file": backfill, "backfill": True}, client_id
            ),
        )
    await audit.record(
        ctx,
        client_id,
        "journey.reset",
        f"started the journey again from {day0.isoformat()}",
        {"target": hero_ref, "day0": day0.isoformat()},
    )
    await ev.apply_speed(ctx, c)
    await ev.changed(ctx, c)
    return {"day0": day0.isoformat(), "hero": hero_ref}
