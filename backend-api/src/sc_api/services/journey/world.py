"""A client's world as the money rules and the journey read it: its SKUs, distributors, batches and members in
money.js's shapes, and its own rules (each fact stored once: client columns, or an agent's settings,
domain/mirrors.py)."""

import re
from datetime import date
from typing import Any

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain import gates as gate_rule
from sc_api.domain import money
from sc_api.errors import ApiError, not_found
from sc_api.services.context import Ctx

STAFF_ROLES = ("operator", "finance", "sustainability", "admin")
SCHEME = re.compile(r"(\d+)\s+free with every\s+(\d+)")
DEFAULT_FLOORS = {"snacks": 35, "biscuits": 35, "staples": 40, "beverages": 30, "personal-care": 40}


def scheme_of(text: str | None) -> dict[str, int]:
    """'2 free with every 10' → {buy: 10, free: 2}"""
    hit = SCHEME.search(text or "")
    if not hit:
        return dict(money.RULES["scheme"])
    return {"buy": int(hit.group(2)), "free": int(hit.group(1))}


async def agent_settings(ctx: Ctx, client_id: str) -> dict[str, dict[str, Any]]:
    rows = (await ctx.session.execute(select(m.ClientAgent).where(m.ClientAgent.client_id == client_id))).scalars()
    return {r.agent_id: {"on": r.on, "autonomy": r.autonomy, **(r.settings or {})} for r in rows}


def floors_pct(c: m.Client) -> dict[str, int]:
    return {**DEFAULT_FLOORS, **(c.floors or {})}


def money_rules(c: m.Client, agents: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """money.js's RULES with the client's own values laid over them"""
    lister, negotiator, outreach = agents.get("lister", {}), agents.get("negotiator", {}), agents.get("outreach", {})
    return money.rules_with(
        {
            "disposalPerUnit": float(c.disposal_per_unit),
            "eprPerKg": float(c.epr_per_kg),
            "vanPerUnit": float(c.van_per_unit),
            "kiranaUplift": float(c.kirana_uplift),
            "tokenPct": float(negotiator.get("tokenPct", 15)) / 100,
            "staffCap": c.staff_cap,
            "returnWindowDays": c.return_window_days,
            "scheme": scheme_of(outreach.get("scheme")),
            "floors": {k: v / 100 for k, v in floors_pct(c).items()},
            "negotiation": {"reservePerUnit": float(lister.get("reserve", 13.5))},
            "gates": {"blinkit": {"minDays": c.gate_blinkit_days}},
        }
    )


def ws_rules(c: m.Client, agents: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """the workspace's guardrails, as its Rules screen edits them"""
    return {
        "watchTime": agents.get("watcher", {}).get("time", "09:00"),
        # the Data agent's daily run, which Setup names while it waits for the first export (SC-79)
        "dataTime": agents.get("data", {}).get("time", "08:30"),
        "floors": floors_pct(c),
        "approvalTaps": c.approval_taps,
        "hindiOffers": c.hindi_offers,
        "requirePhoto": c.require_photo,
        "offerWindowHours": c.offer_window_hours,
        "tokenPct": agents.get("negotiator", {}).get("tokenPct", 15),
        "disposalPerUnit": float(c.disposal_per_unit),
        "eprPerKg": float(c.epr_per_kg),
        "territoryGuard": c.territory_guard,
        "returnWindowDays": c.return_window_days,
        "kiranaUplift": float(c.kirana_uplift),
        "vanPerUnit": float(c.van_per_unit),
    }


def sku_obj(x: m.Sku) -> dict[str, Any]:
    out = {
        "id": x.id,
        "code": x.code,
        "brand": x.brand,
        "name": x.name,
        "category": x.category or "snacks",
        "hsn": x.hsn or "",
        "mrp": float(x.mrp),
        "cost": float(x.cost) if x.cost is not None else float(x.mrp) * 0.5,
        "gst": float(x.gst),
        "perCarton": x.per_carton or 24,
        "lifeDays": x.life_days,
        "kgPerUnit": float(x.kg_per_unit) if x.kg_per_unit is not None else 0.2,
        "img": x.img or "",
        "dp": float(x.dp) if x.dp is not None else None,
        "itcPerUnit": float(x.itc_per_unit) if x.itc_per_unit is not None else None,
    }
    return out


def dist_obj(d: m.Distributor) -> dict[str, Any]:
    return {
        "id": d.id,
        "name": d.name,
        "short": d.short or d.name,
        "city": d.city,
        "state": d.state or "",
        "godown": d.godown or f"{d.city} godown",
        "address": d.address,
        "gstin": d.gstin,
        "kiranas": d.kiranas,
        "cluster": d.cluster or d.city,
        "territory": d.territory or d.city,
        "pins": d.pins or "",
        "staffCap": d.staff_cap,
        "upi": d.upi,
        "permission": (
            {"by": d.permission_by, "at": d.permission_given_at.isoformat(), "paused": d.permission_paused}
            if d.permission == "given" and d.permission_given_at
            else None
        ),
    }


def batch_obj(b: m.Batch, d: m.Distributor, today: date) -> dict[str, Any]:
    """a batch as money.js reads it, its days left counted from the journey's day"""
    assert b.best_before is not None
    return {
        "id": b.ref,
        "sku": b.sku_id,
        "distributor": b.distributor_id,
        "units": b.units,
        "daysLeft": (b.best_before - today).days,
        "sellPerDay": float(b.sell_per_day or 0),
        "bestBefore": b.best_before.isoformat(),
        "mfg": (b.mfg or b.best_before).isoformat(),
        "city": d.city,
        "staffCap": d.staff_cap,
        "shelf": b.shelf,
    }


def effective_gates(c: m.Client, x: m.Sku, b: m.Batch) -> gate_rule.Effective:
    """SC-47's gates for a batch: its override, else its SKU's, else the client's default"""
    own = {k: v for k, v in (("blinkitDays", x.gate_blinkit_days), ("qcomPct", x.gate_qcom_pct)) if v is not None}
    over = {k: v for k, v in (("blinkitDays", b.gate_blinkit_days), ("qcomPct", b.gate_qcom_pct)) if v is not None}
    return gate_rule.effective({"blinkitDays": c.gate_blinkit_days, "qcomPct": c.gate_qcom_pct}, own, over)


async def client(ctx: Ctx, client_id: str) -> m.Client:
    c = await ctx.session.get(m.Client, client_id)
    if c is None:
        raise not_found("workspace")
    return c


async def skus(ctx: Ctx, client_id: str) -> dict[str, m.Sku]:
    rows = (await ctx.session.execute(select(m.Sku).where(m.Sku.client_id == client_id).order_by(m.Sku.seq))).scalars()
    return {x.id: x for x in rows}


async def distributors(ctx: Ctx, client_id: str) -> dict[str, m.Distributor]:
    q = select(m.Distributor).where(m.Distributor.client_id == client_id).order_by(m.Distributor.seq)
    return {d.id: d for d in (await ctx.session.execute(q)).scalars()}


async def members(ctx: Ctx, client_id: str) -> list[tuple[m.ClientMember, m.User]]:
    q = (
        select(m.ClientMember, m.User)
        .join(m.User, m.User.id == m.ClientMember.user_id)
        .where(m.ClientMember.client_id == client_id)
        .order_by(m.ClientMember.seq)
    )
    return [(cm, u) for cm, u in (await ctx.session.execute(q)).all()]


async def member(ctx: Ctx, client_id: str, ref: str) -> m.ClientMember:
    cm = await ctx.session.get(m.ClientMember, (client_id, ref))
    if cm is None:
        raise not_found("member")
    return cm


async def members_with(
    ctx: Ctx, client_id: str, *, role: str | None = None, org: str | None = None
) -> list[m.ClientMember]:
    """active members by workspace role, or standing for an organisation (a distributor, kirana, buyer or food bank)"""
    q = select(m.ClientMember).where(m.ClientMember.client_id == client_id, m.ClientMember.status == "active")
    if role:
        q = q.where(m.ClientMember.workspace_role == role)
    if org:
        q = q.where(m.ClientMember.org_ref == org)
    return list((await ctx.session.execute(q.order_by(m.ClientMember.seq))).scalars())


async def kiranas(ctx: Ctx, client_id: str, distributor_id: str | None = None) -> list[m.Kirana]:
    q = select(m.Kirana).where(m.Kirana.client_id == client_id)
    if distributor_id:
        q = q.where(m.Kirana.distributor_id == distributor_id)
    rows = list((await ctx.session.execute(q)).scalars())
    return sorted(rows, key=lambda k: (len(k.id), k.id))


async def partners(ctx: Ctx, client_id: str, kind: str | None = None) -> list[m.Partner]:
    q = select(m.Partner).where(m.Partner.client_id == client_id)
    if kind:
        q = q.where(m.Partner.kind == kind)
    return list((await ctx.session.execute(q.order_by(m.Partner.id))).scalars())


async def next_number(ctx: Ctx, client_id: str, kind: str) -> str:
    """the next number for a kind of paper (INV/26-27/0931, CN/0117, ES-24117), taken in the transaction"""
    row = await ctx.session.get(m.DocumentNumber, (client_id, kind), with_for_update=True)
    if row is None:
        raise ApiError(422, f"The workspace has no numbering for {kind} papers.")
    n = row.next
    row.next = n + 1
    return f"{row.prefix}{n:0{row.width}d}"
