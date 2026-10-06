"""A client's supply chain: its distributors (and their one-time permission), its SKUs, its integrations and stock
exports, and the batches the agents work.

The console reminds distributors and asks for the first export. The rest is what the Data agent and the connectors
will record. Until they run, the hydrate CLI records it through these same functions.
"""

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select

from sc_api import models as m
from sc_api.errors import ApiError, not_found
from sc_api.services import audit
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
    ctx: Ctx, client_id: str, *, id: str, code: str, brand: str, name: str, mrp: float, gst: float, life_days: int
) -> None:
    ctx.session.add(
        m.Sku(client_id=client_id, id=id, code=code, brand=brand, name=name, mrp=mrp, gst=gst, life_days=life_days)
    )
    await ctx.session.flush()


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
) -> None:
    """a batch the Watcher flagged, and how far along the nine stages it is"""
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
        )
    )
    await ctx.session.flush()


async def close_batch(ctx: Ctx, client_id: str, ref: str, *, recovered: float, outcome: str) -> None:
    b = await ctx.session.get(m.Batch, (client_id, ref), with_for_update=True)
    if b is None:
        raise not_found("batch")
    b.stage_done = b.stage_current = 9
    b.recovered, b.outcome, b.closed_at = recovered, outcome, ctx.clock.now()
    await ctx.session.flush()


async def set_integration(ctx: Ctx, client_id: str, integration_id: str, *, status: str, note: str) -> None:
    """an integration's state, as its connector reports it (the first export arriving turns "waiting" into "ok")"""
    row = await ctx.session.get(m.ClientIntegration, (client_id, integration_id), with_for_update=True)
    if row is None:
        raise not_found("integration")
    row.status, row.note = status, note
    await ctx.session.flush()
