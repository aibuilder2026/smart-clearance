"""/internal (SC-66): what the agents call, and what Pub/Sub's pushes and Cloud Scheduler's jobs reach. Every caller
signs with a Google ID token minted for INTERNAL_AUDIENCE by a service account in INTERNAL_CALLERS (sc-agents,
sc-agents-local, sc-invoker); nothing here is open to a browser (CORS never names it).

An agent reads a batch's journey, then reports what it did: backend-api works out every figure (domain/money.py),
writes the change with its timeline entry, pushes and audit line, and sends the next event. Each report carries the
event it answered (`run.eventKey`): a redelivered event finds its run already recorded and does nothing (noop)."""

import base64
import json
import logging
from typing import Any

from fastapi import APIRouter, Request
from pydantic import Field
from sqlalchemy import select

from sc_api import models as m
from sc_api.deps import InternalCtx
from sc_api.domain import money
from sc_api.errors import ApiError, not_found
from sc_api.schemas import Shape
from sc_api.services.context import Ctx
from sc_api.services.journey import events as ev
from sc_api.services.journey import notifier, previews, reset, steps, tick, views, world
from sc_api.services.journey.outbox import drain

log = logging.getLogger("sc_api.internal")
router = APIRouter(prefix="/internal", tags=["internal"], include_in_schema=False)
CASE = "/clients/{client_id}/cases/{ref}"


class RunInput(Shape):
    agent: str = Field(max_length=40)
    event_key: str | None = Field(default=None, max_length=200)
    run_id: str | None = Field(default=None, max_length=80)
    trace_id: str | None = Field(default=None, max_length=64)
    model: str | None = Field(default=None, max_length=120)
    fallback: bool | None = None
    latency_ms: int | None = None

    def run(self) -> steps.Run:
        return steps.Run(**self.model_dump(by_alias=False))


class Report(Shape):
    run: RunInput | None = None
    model_config = Shape.model_config | {"extra": "allow"}

    def extra(self) -> dict[str, Any]:
        return dict(self.model_extra or {})


async def _done(ctx: Ctx, request: Request, out: dict[str, Any] | None = None) -> dict[str, Any]:
    await ctx.session.commit()
    state = request.app.state
    if getattr(state, "cloud", None) is not None:
        await drain(state.sessions, state.cloud.publisher, ctx.clock.now())
    return {"ok": True, **(out or {})}


async def _step(ctx: Ctx, request: Request, fn, *args) -> dict[str, Any]:
    try:
        out = await fn(ctx, *args)
    except steps.Noop:
        await ctx.session.rollback()
        return {"ok": True, "noop": True}
    return await _done(ctx, request, out if isinstance(out, dict) else {"result": out})


def _run(r: Report) -> steps.Run | None:
    return r.run.run() if r.run else None


# --- what the agents read --------------------------------------------------------------------------------------------


@router.get("/clients/{client_id}/agents")
async def agents_of(client_id: str, ctx: InternalCtx) -> dict[str, Any]:
    """each agent's on/off, autonomy and settings, the catalog's model tier, and the client's money rules"""
    c = await world.client(ctx, client_id)
    agents = await world.agent_settings(ctx, client_id)
    tiers = {a["id"]: a.get("model") for a in ctx.ref.agents}
    return {
        "client": client_id,
        "agents": {k: {**v, "model": tiers.get(k)} for k, v in agents.items()},
        "rules": money.jsonable(world.money_rules(c, agents)),
        "clock": views.clock_out(ctx, c),
        "setupConfirmed": c.setup_confirmed_at is not None,
        "language": "hi" if c.hindi_offers else "en",
        # how long a kirana scheme stays open, which Outreach's offer says (SC-72)
        "offerWindowHours": c.offer_window_hours,
        # when the journey was last started again (SC-88): the ledger's rows are this journey's
        "journeyFrom": (c.workspace_doc or {}).get("journeyFrom"),
    }


@router.get("/clients/{client_id}/batches")
async def batches_of(client_id: str, ctx: InternalCtx) -> dict[str, Any]:
    """the open batches the Watcher reads sell-through for, with the distributors' permissions; the distributors' names
    and the SKUs' item codes, which the Data agent maps a DMS export's rows by (SC-72)"""
    c = await world.client(ctx, client_id)
    dists = await world.distributors(ctx, client_id)
    skus = await world.skus(ctx, client_id)
    rows = (
        (
            await ctx.session.execute(
                select(m.Batch).where(
                    m.Batch.client_id == client_id, m.Batch.closed_at.is_(None), m.Batch.best_before.is_not(None)
                )
            )
        )
        .scalars()
        .all()
    )
    today = ev.now(ctx, c).date()
    return {
        "client": client_id,
        "day": today.isoformat(),
        "distributors": {
            d.id: {"permission": d.permission == "given", "paused": d.permission_paused, "name": d.name}
            for d in dists.values()
        },
        "skus": {x.id: {"code": x.code, "name": x.name} for x in skus.values()},
        "batches": [
            {**world.batch_obj(b, dists[b.distributor_id], today), "skuCode": skus[b.sku_id].code} for b in rows
        ],
    }


@router.get(CASE)
async def case_of(client_id: str, ref: str, ctx: InternalCtx) -> dict[str, Any]:
    """a batch's journey as Munchly's own staff see it, with what the agents need beside it"""
    staff = (
        (
            await ctx.session.execute(
                select(m.ClientMember)
                .where(m.ClientMember.client_id == client_id, m.ClientMember.workspace_role == "operator")
                .order_by(m.ClientMember.seq)
            )
        )
        .scalars()
        .first()
    )
    if staff is None:
        raise not_found("operator")
    detail = await views.case_detail(ctx, client_id, ref, staff)
    case = await views.latest_case(ctx, client_id, ref)
    assert case is not None
    c = await world.client(ctx, client_id)
    return {
        **detail,
        "photoObject": (case.photo or {}).get("object"),
        "photosBucket": ctx.settings.photos_bucket,
        "docsBucket": ctx.settings.docs_bucket,
        "valuation": case.valuation,
        "language": "hi" if c.hindi_offers else "en",
        "listingApi": (case.listing or {}).get("api"),
        "docsFull": case.docs,
    }


@router.get(CASE + "/valuation-preview")
async def valuation_preview(client_id: str, ref: str, ctx: InternalCtx) -> dict[str, Any]:
    """the channel table the Valuer comments on, as it will be saved"""
    return await previews.valuation(ctx, client_id, ref)


@router.get(CASE + "/plan-preview")
async def plan_preview(client_id: str, ref: str, ctx: InternalCtx) -> dict[str, Any]:
    """the split the Router explains, as it will be saved"""
    return await previews.plan(ctx, client_id, ref)


@router.get(CASE + "/bids/{bid_id}/preview")
async def bid_preview(client_id: str, ref: str, bid_id: str, ctx: InternalCtx) -> dict[str, Any]:
    """the Negotiator's decision on a bid, which its words must state"""
    return await previews.bid(ctx, client_id, ref, bid_id)


# --- what the agents report ------------------------------------------------------------------------------------------


@router.post("/clients/{client_id}/exports")
async def exports(client_id: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    return await _step(ctx, request, steps.record_export, client_id, data.extra(), _run(data))


@router.post("/clients/{client_id}/detect")
async def detect(client_id: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    return await _step(ctx, request, steps.detect, client_id, data.extra(), _run(data))


@router.post(CASE + "/photo-request")
async def photo_request(client_id: str, ref: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    return await _step(ctx, request, steps.photo_request, client_id, ref, _run(data))


@router.post(CASE + "/photo-read")
async def photo_read(client_id: str, ref: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    read = data.extra().get("read") or {}
    return await _step(ctx, request, steps.photo_read, client_id, ref, read, _run(data))


@router.post(CASE + "/valuation")
async def valuation(client_id: str, ref: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    return await _step(ctx, request, steps.valuation, client_id, ref, data.extra().get("notes"), _run(data))


@router.post(CASE + "/plan")
async def plan(client_id: str, ref: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    return await _step(ctx, request, steps.plan, client_id, ref, data.extra().get("explanation"), _run(data))


@router.post(CASE + "/listing")
async def listing(client_id: str, ref: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    x = data.extra()
    return await _step(ctx, request, steps.listing, client_id, ref, x.get("title"), x.get("description"), _run(data))


@router.post(CASE + "/offer")
async def offer(client_id: str, ref: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    return await _step(ctx, request, steps.offer, client_id, ref, data.extra().get("words"), _run(data))


@router.post(CASE + "/donation")
async def donation(client_id: str, ref: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    return await _step(ctx, request, steps.donation, client_id, ref, _run(data))


@router.post(CASE + "/bids/{bid_id}/answer")
async def answer_bid(
    client_id: str, ref: str, bid_id: str, data: Report, request: Request, ctx: InternalCtx
) -> dict[str, Any]:
    return await _step(ctx, request, steps.answer_bid, client_id, ref, bid_id, data.extra().get("reply"), _run(data))


@router.post(CASE + "/messages/{message_id}/answer")
async def answer_message(
    client_id: str, ref: str, message_id: int, data: Report, request: Request, ctx: InternalCtx
) -> dict[str, Any]:
    return await _step(
        ctx, request, steps.answer_message, client_id, ref, message_id, data.extra().get("reply"), _run(data)
    )


@router.post(CASE + "/offer/close")
async def close_offer(client_id: str, ref: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    return await _step(ctx, request, steps.close_offer, client_id, ref, _run(data))


@router.post(CASE + "/documents")
async def documents(client_id: str, ref: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    return await _step(ctx, request, steps.documents, client_id, ref, _run(data))


@router.patch(CASE + "/documents/{doc}")
async def document_pdf(
    client_id: str, ref: str, doc: str, data: Report, request: Request, ctx: InternalCtx
) -> dict[str, Any]:
    name = data.extra().get("object")
    if not isinstance(name, str) or not name:
        raise ApiError(422, "The PDF's object name.")
    return await _step(ctx, request, steps.document_pdf, client_id, ref, doc, name, _run(data))


@router.post(CASE + "/shelf-check")
async def shelf_check(client_id: str, ref: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    return await _step(ctx, request, steps.shelf_check, client_id, ref, data.extra().get("counts"), _run(data))


@router.post(CASE + "/report")
async def report(client_id: str, ref: str, data: Report, request: Request, ctx: InternalCtx) -> dict[str, Any]:
    return await _step(ctx, request, steps.report, client_id, ref, _run(data))


# --- Pub/Sub's push, and the scheduled jobs --------------------------------------------------------------------------


@router.post("/pubsub/notify")
async def pubsub_notify(request: Request, ctx: InternalCtx) -> dict[str, Any]:
    """the Notifier: Pub/Sub pushes each notification's message here (prod.notify.api)"""
    envelope = await request.json()
    try:
        payload = json.loads(base64.b64decode(envelope["message"]["data"]))
    except (KeyError, ValueError, TypeError) as e:
        raise ApiError(400, "Not a Pub/Sub push.") from e
    out = await notifier.push(ctx, request.app.state.cloud.messenger, int(payload["notification"]))
    await ctx.session.commit()
    return {"ok": True, **out}


@router.post("/jobs/tick")
async def job_tick(request: Request, ctx: InternalCtx) -> dict[str, Any]:
    """every minute (Cloud Scheduler sc-tick): daily runs on journey time, due timers, stalled journeys, the outbox"""
    out = await tick.run(ctx)
    return await _done(ctx, request, {"clients": out})


@router.post("/jobs/journey-reset")
async def job_reset(request: Request, ctx: InternalCtx) -> dict[str, Any]:
    """the story from its start (the paused Scheduler job sc-journey-reset, or by hand)"""
    body = await request.json() if await request.body() else {}
    client_id = (body or {}).get("client", "munchly")
    out = await reset.reset(ctx, client_id)
    return await _done(ctx, request, out)
