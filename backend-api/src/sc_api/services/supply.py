"""A client's supply chain: its distributors (and their one-time permission), its SKUs and their quick-commerce
gates, its integrations and stock exports, and the batches the agents work, with any batch's gate override.

The console reminds distributors, asks for the first export, sets an SKU's gates and overrides a batch's. The rest is
what the Data agent and the connectors will record. Until they run, the hydrate CLI records it through these same
functions.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain import gates as rule
from sc_api.domain.display import audit_at
from sc_api.errors import ApiError, not_found
from sc_api.schemas import BatchGates, BatchOverride, GateCheck, OverrideInput, SkuGates
from sc_api.services import agents, audit
from sc_api.services.context import Actor, Ctx
from sc_api.services.presenter import lock_client

FIRST_EXPORT = {
    "id": "dms",
    "name": "Distributor stock exports",
    "kind": "Inventory",
    "status": "waiting",
    "note": "Upload link sent to the distributors",
}


@dataclass
class DistributorSpec:
    id: str
    name: str
    city: str
    kiranas: int
    state: str | None = None
    staff_cap: int | None = None


async def add_distributor(ctx: Ctx, client_id: str, d: DistributorSpec) -> None:
    ctx.session.add(
        m.Distributor(
            client_id=client_id,
            id=d.id,
            name=d.name,
            city=d.city,
            state=d.state,
            kiranas=d.kiranas,
            staff_cap=d.staff_cap,
            permission="not-yet",
        )
    )
    await ctx.session.flush()


async def give_permission(
    ctx: Ctx, client_id: str, distributor_id: str, *, by: Actor | None = None, record: bool = True
) -> None:
    """a distributor's one-time permission for the agents to list, offer and invoice in its name"""
    d = await ctx.session.get(m.Distributor, (client_id, distributor_id), with_for_update=True)
    if d is None:
        raise not_found("distributor")
    if d.permission == "given":
        return
    d.permission, d.permission_given_at = "given", ctx.clock.now()
    if not record:  # an imported history, whose own line says so
        await ctx.session.flush()
        return
    who = by or ctx.actor
    await audit.record(
        ctx,
        client_id,
        "distributor.permission",
        f"Gave the agents {'his' if by else 'its'} one-time permission for {d.name}",
        {"distributor": d.id},
        actor=who,
    )


async def remind(ctx: Ctx, client_id: str, distributor_id: str) -> None:
    ctx.require("clients.supply", "Your role can't remind distributors.")
    await lock_client(ctx, client_id)
    d = await ctx.session.get(m.Distributor, (client_id, distributor_id))
    if d is None:
        raise not_found("distributor")
    if d.permission == "given":
        raise ApiError(422, f"{d.name} has already given its permission.")
    await audit.record(
        ctx, client_id, "distributor.remind", f"Asked {d.name} again for its one-time permission", {"distributor": d.id}
    )


async def add_sku(
    ctx: Ctx,
    client_id: str,
    *,
    id: str,
    code: str,
    brand: str,
    name: str,
    mrp: float,
    gst: float,
    life_days: int,
    gates: Mapping[str, int] | None = None,
) -> None:
    """an SKU from a stock export; gates of its own come from the export's category, or later from the console"""
    g = gates or {}
    if (problem := rule.sku_gates_error(g or None)) is not None:
        raise ApiError(422, problem)
    ctx.session.add(
        m.Sku(
            client_id=client_id,
            id=id,
            code=code,
            brand=brand,
            name=name,
            mrp=mrp,
            gst=gst,
            life_days=life_days,
            gate_blinkit_days=g.get("blinkitDays"),
            gate_qcom_pct=g.get("qcomPct"),
        )
    )
    await ctx.session.flush()


def _own(x: m.Sku) -> dict[str, int]:
    return {k: v for k, v in (("blinkitDays", x.gate_blinkit_days), ("qcomPct", x.gate_qcom_pct)) if v is not None}


def _override(b: m.Batch) -> dict[str, Any]:
    return {k: v for k, v in (("blinkitDays", b.gate_blinkit_days), ("qcomPct", b.gate_qcom_pct)) if v is not None}


async def set_sku_gates(ctx: Ctx, client_id: str, sku_id: str, gates: SkuGates | None) -> None:
    """an SKU's own quick-commerce gates, or None to put it back on the client's default. Nothing changed writes no
    line"""
    ctx.require("clients.configure", "Your role can't change an SKU's quick-commerce gates.")
    c = await lock_client(ctx, client_id)
    x = await ctx.session.get(m.Sku, (client_id, sku_id), with_for_update=True)
    if x is None:
        raise not_found("SKU")
    g = gates.model_dump(by_alias=True) if gates is not None else None
    if (problem := rule.sku_gates_error(g)) is not None:
        raise ApiError(422, problem, {"gates": problem})
    want = g or {}
    if want == _own(x):
        return
    x.gate_blinkit_days, x.gate_qcom_pct = want.get("blinkitDays"), want.get("qcomPct")
    await audit.record(ctx, c.id, "sku.gates", rule.sku_gates_line(c.name, x.name, g), {"sku": x.id, "gates": g})


async def _open_batch_row(ctx: Ctx, client_id: str, ref: str) -> m.Batch:
    b = await ctx.session.get(m.Batch, (client_id, ref), with_for_update=True)
    if b is None:
        raise not_found("batch")
    if b.closed_at is not None:
        raise ApiError(422, f"{ref} is closed; it keeps the gates it was judged by.")
    return b


async def override_batch(ctx: Ctx, client_id: str, ref: str, data: OverrideInput) -> None:
    """one batch's own gates, with the reason a person gives, until it closes"""
    ctx.require("clients.configure", "Your role can't override a batch's quick-commerce gates.")
    c = await lock_client(ctx, client_id)
    b = await _open_batch_row(ctx, client_id, ref)
    o = {"blinkitDays": data.blinkit_days, "qcomPct": data.qcom_pct, "reason": data.reason}
    if (problem := rule.override_error(o)) is not None:
        raise ApiError(422, problem)
    reason = data.reason.strip()
    if (b.gate_blinkit_days, b.gate_qcom_pct, b.gate_reason) == (data.blinkit_days, data.qcom_pct, reason):
        return
    b.gate_blinkit_days, b.gate_qcom_pct, b.gate_reason = data.blinkit_days, data.qcom_pct, reason
    b.gate_by_user_id, b.gate_by_name, b.gate_at = ctx.actor.user_id, ctx.actor.name, ctx.clock.now()
    clean = {**_override(b), "reason": reason}
    await audit.record(ctx, c.id, "batch.override", rule.override_line(ref, clean), {"batch": ref, "override": clean})


async def clear_override(ctx: Ctx, client_id: str, ref: str) -> None:
    ctx.require("clients.configure", "Your role can't override a batch's quick-commerce gates.")
    c = await lock_client(ctx, client_id)
    b = await _open_batch_row(ctx, client_id, ref)
    if b.gate_reason is None:
        return
    b.gate_blinkit_days = b.gate_qcom_pct = b.gate_reason = b.gate_by_name = None
    b.gate_by_user_id = b.gate_at = None
    await audit.record(ctx, c.id, "batch.override.clear", rule.clear_override_line(ref), {"batch": ref})


async def client_batches(ctx: Ctx, client_id: str, sku_id: str | None = None) -> list[BatchGates]:
    """a client's open batches with their gates as the agents read them (the same rule as sc.batch_gates), oldest
    first; one SKU's when it is given"""
    c = await ctx.session.get(m.Client, client_id)
    if c is None:
        raise not_found("client")
    q = (
        select(m.Batch, m.Sku)
        .join(m.Sku, (m.Sku.client_id == m.Batch.client_id) & (m.Sku.id == m.Batch.sku_id))
        .where(m.Batch.client_id == client_id, m.Batch.closed_at.is_(None), m.Batch.best_before.is_not(None))
        .order_by(m.Batch.seq)
    )
    if sku_id is not None:
        q = q.where(m.Batch.sku_id == sku_id)
    today = ctx.clock.today()
    default = {"blinkitDays": c.gate_blinkit_days, "qcomPct": c.gate_qcom_pct}
    out = []
    for b, x in (await ctx.session.execute(q)).all():
        assert b.best_before is not None
        e = rule.effective(default, _own(x), _override(b))
        days = (b.best_before - today).days
        override: Any = (
            BatchOverride(
                **_override_fields(b),
                reason=b.gate_reason,
                by=b.gate_by_name or "",
                at=audit_at(b.gate_at, today) if b.gate_at else "",
            )
            if b.gate_reason
            else None
        )
        out.append(
            BatchGates(
                ref=b.ref,
                sku=b.sku_id,
                distributor=b.distributor_id,
                units=b.units,
                best_before=b.best_before.isoformat(),
                days_left=days,
                life_days=x.life_days,
                blinkit_days=e.blinkit_days,
                qcom_pct=e.qcom_pct,
                checks=[GateCheck.model_validate(k) for k in rule.checks(e, days_left=days, life_days=x.life_days)],
                **({"override": override} if override is not None else {}),
            )
        )
    return out


def _override_fields(b: m.Batch) -> dict[str, int]:
    return {k: v for k, v in (("blinkit_days", b.gate_blinkit_days), ("qcom_pct", b.gate_qcom_pct)) if v is not None}


async def add_integration(ctx: Ctx, client_id: str, *, id: str, name: str, kind: str, status: str, note: str) -> None:
    ctx.session.add(m.ClientIntegration(client_id=client_id, id=id, name=name, kind=kind, status=status, note=note))
    await ctx.session.flush()


async def request_first_export(ctx: Ctx, client_id: str) -> None:
    ctx.require("clients.supply", "Your role can't ask for stock exports.")
    c = await lock_client(ctx, client_id)
    if await ctx.session.get(m.ClientIntegration, (client_id, "dms")) is not None:
        raise ApiError(422, f"{c.name}'s distributors already send their stock exports.")
    await add_integration(ctx, client_id, **FIRST_EXPORT)
    await audit.record(
        ctx, c.id, "integration.request", f"Asked {c.name}'s distributors for their first stock export", {"id": "dms"}
    )


async def record_export(
    ctx: Ctx, client_id: str, distributor_id: str, *, expected: datetime, arrived: datetime
) -> None:
    """a distributor's stock export arriving (from the DMS connector, once it exists)"""
    d = await ctx.session.get(m.Distributor, (client_id, distributor_id), with_for_update=True)
    if d is None:
        raise not_found("distributor")
    d.export_expected_at, d.export_arrived_at = expected, arrived
    await ctx.session.flush()


async def open_batch(
    ctx: Ctx,
    client_id: str,
    *,
    ref: str,
    sku: str,
    distributor: str,
    units: int,
    done: int = 0,
    current: int = 1,
    note: str | None = None,
    money: float | None = None,
    split: str | None = None,
    at: datetime | None = None,
    stage_at: datetime | None = None,
    best_before: date,
    override: Mapping[str, Any] | None = None,
) -> None:
    """a batch the Watcher sees, its best-before date, and how far along the nine stages it is. An imported history
    may bring its gate override, written by whoever set it, and when it reached its stop (else when it was opened)"""
    exists = await ctx.session.execute(select(m.Batch.ref).where(m.Batch.client_id == client_id, m.Batch.ref == ref))
    if exists.first():
        raise ApiError(422, f"Batch {ref} is already open.")
    ctx.session.add(
        m.Batch(
            client_id=client_id,
            ref=ref,
            sku_id=sku,
            distributor_id=distributor,
            units=units,
            stage_done=done,
            stage_current=current,
            note=note,
            money=money,
            split=split,
            recovered=money or 0,
            opened_at=at or ctx.clock.now(),
            stage_at=stage_at or at or ctx.clock.now(),
            best_before=best_before,
        )
    )
    await ctx.session.flush()
    if override:  # an imported history's override, whose own audit line says so
        b = await ctx.session.get(m.Batch, (client_id, ref))
        assert b is not None
        who: Actor = override.get("by") or ctx.actor
        b.gate_blinkit_days, b.gate_qcom_pct = override.get("blinkitDays"), override.get("qcomPct")
        b.gate_reason, b.gate_by_user_id, b.gate_by_name = override["reason"].strip(), who.user_id, who.name
        b.gate_at = override.get("at") or ctx.clock.now()
        await ctx.session.flush()


async def close_batch(ctx: Ctx, client_id: str, ref: str, *, recovered: float, outcome: str) -> None:
    b = await ctx.session.get(m.Batch, (client_id, ref), with_for_update=True)
    if b is None:
        raise not_found("batch")
    # the gates it was judged by stay with it: its SKU's may change later
    x = await ctx.session.get(m.Sku, (client_id, b.sku_id))
    c = await ctx.session.get(m.Client, client_id)
    assert x is not None and c is not None
    e = rule.effective({"blinkitDays": c.gate_blinkit_days, "qcomPct": c.gate_qcom_pct}, _own(x), _override(b))
    b.judged_blinkit_days, b.judged_qcom_pct = e.blinkit_days, e.qcom_pct
    b.stage_done = b.stage_current = 9
    b.recovered, b.outcome, b.closed_at = recovered, outcome, ctx.clock.now()
    b.stage_at = b.closed_at
    await ctx.session.flush()


# the agent that works each stop, as the run that moves a batch on from it is recorded (0-based, as stage_current)
STOP_AGENT = ("data", "watcher", "vision", "valuer", "router", "gate", "lister", "paperwork", "impact")
APPROVE = 5


async def advance_batch(ctx: Ctx, client_id: str, ref: str, text: str) -> int:
    """an agent finishes its stop for a batch: the batch moves on to the next stop, stamped with when it got there
    (SC-49), and the run is recorded in the agent's name. A batch at Approve waits for a person's yes, and one at Report
    closes through close_batch, with what it recovered; neither moves here. Returns the stop it reached"""
    b = await ctx.session.get(m.Batch, (client_id, ref), with_for_update=True)
    if b is None:
        raise not_found("batch")
    if b.closed_at is not None or b.stage_current >= 8:
        raise ApiError(422, f"Batch {ref} has no stop left to move to; it closes with what it recovered.")
    if b.stage_current == APPROVE:
        raise ApiError(422, f"Batch {ref} waits for a person's yes.")
    agent = STOP_AGENT[b.stage_current]
    b.stage_current += 1
    b.stage_done = max(b.stage_done, b.stage_current)
    b.stage_at = ctx.clock.now()
    await agents.record_run(ctx, client_id, agent, text, at=b.stage_at)
    return b.stage_current


async def set_integration(ctx: Ctx, client_id: str, integration_id: str, *, status: str, note: str) -> None:
    """an integration's state, as its connector reports it (the first export arriving turns "waiting" into "ok")"""
    row = await ctx.session.get(m.ClientIntegration, (client_id, integration_id), with_for_update=True)
    if row is None:
        raise not_found("integration")
    row.status, row.note = status, note
    await ctx.session.flush()
