"""What an agent writes about, before it reports (SC-66): the figures backend-api will save, worked out the same way
(domain/money.py) but not saved. The Valuer comments on the channel table, the Router explains the plan, the
Negotiator words its answer to a bid: each model writes about exactly the numbers the report will hold it to."""

from typing import Any

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain import money
from sc_api.domain.clock import IST
from sc_api.errors import not_found
from sc_api.services.context import Ctx
from sc_api.services.journey import events as ev
from sc_api.services.journey import world


async def _scene(ctx: Ctx, client_id: str, ref: str) -> dict[str, Any]:
    c = await world.client(ctx, client_id)
    case = (
        await ctx.session.execute(
            select(m.Case).where(m.Case.client_id == client_id, m.Case.batch_ref == ref, m.Case.status == "open")
        )
    ).scalar_one_or_none()
    if case is None:
        raise not_found("batch in a journey")
    b = await ctx.session.get(m.Batch, (client_id, ref))
    x = await ctx.session.get(m.Sku, (client_id, case.sku_id))
    d = await ctx.session.get(m.Distributor, (client_id, case.distributor_id))
    assert b is not None and x is not None and d is not None
    agents = await world.agent_settings(ctx, client_id)
    rules = world.money_rules(c, agents)
    today = ev.now(ctx, c).astimezone(IST).date()
    return {"c": c, "case": case, "b": b, "x": x, "d": d, "rules": rules, "today": today, "agents": agents}


async def valuation(ctx: Ctx, client_id: str, ref: str) -> dict[str, Any]:
    s = await _scene(ctx, client_id, ref)
    bo, so = world.batch_obj(s["b"], s["d"], s["today"]), world.sku_obj(s["x"])
    a = money.assess(bo, so, gates=world.effective_gates(s["c"], s["x"], s["b"]), rules=s["rules"])
    rows = money.channel_table(bo, so, a["atRisk"], rules=s["rules"])
    return money.jsonable(
        {"daysLeft": bo["daysLeft"], "units": a["atRisk"], "sku": so, "rows": rows, "city": s["d"].city}
    )


async def plan(ctx: Ctx, client_id: str, ref: str) -> dict[str, Any]:
    s = await _scene(ctx, client_id, ref)
    p = money.plan(world.batch_obj(s["b"], s["d"], s["today"]), world.sku_obj(s["x"]), rules=s["rules"])
    offered = len(await world.kiranas(ctx, client_id, s["d"].id))
    return money.jsonable(
        {"plan": p, "offered": offered, "windowDays": s["rules"]["kiranaWindowDays"], "city": s["d"].city}
    )


async def bid(ctx: Ctx, client_id: str, ref: str, bid_id: str) -> dict[str, Any]:
    """the Negotiator's decision on a bid: accept it, or counter (never under the reserve, which it never quotes)"""
    s = await _scene(ctx, client_id, ref)
    b = await ctx.session.get(m.CaseBid, bid_id)
    listing = s["case"].listing
    if b is None or b.case_id != s["case"].id or not listing:
        raise not_found("bid")
    r = money.counter(float(listing["price"]), float(b.price), rules=s["rules"])
    return money.jsonable(
        {
            "action": r["action"],
            "price": r["price"],
            "bid": float(b.price),
            "ask": float(listing["price"]),
            "units": int(listing["units"]),
            "city": s["d"].city,
            "bestBefore": s["b"].best_before.isoformat() if s["b"].best_before else None,
            "dispatchHours": 24,
        }
    )
