"""A client's workspace (SC-66): the routes the workspace app calls, under /v1/workspaces/{ws}
(frontend/api/src/types/workspace.ts). A member signs in with Firebase (email and password, as the console does); every
route but the public one needs their ID token. Every change commits with its audit line, publishes its events, and
answers where the member's stream now stands, with the batch's case when one changed."""

import asyncio
import json
from collections.abc import AsyncIterator
from dataclasses import replace
from datetime import timedelta
from typing import Any, Literal

from fastapi import APIRouter, Query, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import Field
from sqlalchemy.dialects.postgresql import insert as pg_insert

from sc_api import models as m
from sc_api.deps import MemberCtx, MemberSigningIn, Public
from sc_api.domain import journey as J
from sc_api.errors import ApiError
from sc_api.schemas import Shape
from sc_api.services.context import Ctx
from sc_api.services.journey import admin, steps, views, world
from sc_api.services.journey import events as ev
from sc_api.services.journey.outbox import drain

router = APIRouter(prefix="/v1/workspaces/{ws}", tags=["workspace"])
CASE = "/cases/{ref}"


class UploadInput(Shape):
    content_type: str = Field(max_length=100)
    bytes: int = Field(gt=0)
    file_name: str | None = Field(default=None, max_length=200)


class ApproveInput(Shape):
    device: Literal["phone", "desktop"] = "desktop"


class OrderInput(Shape):
    units: int = Field(gt=0, le=10000)


class BidInput(Shape):
    price: float = Field(gt=0, le=100000)


class MessageInput(Shape):
    text: str = Field(max_length=steps.MESSAGE_MAX)


class DispatchInput(Shape):
    kind: Literal["truck", "van"]


class StaffSaleInput(Shape):
    sold: int = Field(ge=0, le=100000)


class PauseInput(Shape):
    paused: bool


class ReadInput(Shape):
    ids: list[str] | None = None
    all: bool = False


class InviteInput(Shape):
    name: str = Field(max_length=120)
    email: str = Field(max_length=200)
    role: str = Field(max_length=40)
    org: str | None = Field(default=None, max_length=120)


class MemberPatch(Shape):
    status: Literal["active", "deactivated"] | None = None
    role: str | None = Field(default=None, max_length=40)


class DeviceInput(Shape):
    token: str = Field(max_length=4096)
    user_agent: str = Field(default="", max_length=300)


def _member(request: Request):
    return request.state.member


IDEMPOTENCY_KEY_MAX = 100


async def _replay(ctx: Ctx, request: Request, ws: str, ref: str | None = None) -> dict[str, Any] | None:
    """a change whose Idempotency-Key this member has already used answers as it stands now, without acting again.
    The key is written in the change's own transaction: a change that fails frees it for the retry, and a retry racing
    the first waits on its row, then replays"""
    key = request.headers.get("idempotency-key")
    if not key:
        return None
    if len(key) > IDEMPOTENCY_KEY_MAX:
        raise ApiError(422, "The Idempotency-Key is too long.", {"idempotencyKey": f"At most {IDEMPOTENCY_KEY_MAX}."})
    row = {
        "client_id": ws,
        "member_ref": _member(request).ref,
        "key": key,
        "route": f"{request.method} {request.url.path}",
        "ref": ref,
        "created_wall": ctx.clock.now(),
    }
    done = await ctx.session.execute(
        pg_insert(m.IdempotencyKey).values(**row).on_conflict_do_nothing().returning(m.IdempotencyKey.route)
    )
    if done.first() is not None:
        return None
    seen = await ctx.session.get(m.IdempotencyKey, (ws, row["member_ref"], key))
    if seen is not None and seen.route != row["route"]:
        raise ApiError(422, "This Idempotency-Key was used for another change.")
    return await _done(ctx, request, ws, ref)


async def _done(ctx: Ctx, request: Request, ws: str, ref: str | None = None) -> dict[str, Any]:
    """commit the change, send its events, and answer where the member's stream stands (and the case, if one changed)"""
    await ctx.session.commit()
    state = request.app.state
    if getattr(state, "cloud", None) is not None:
        await drain(state.sessions, state.cloud.publisher, ctx.clock.now())
    c = await world.client(ctx, ws)
    case = await views.case_detail(ctx, ws, ref, _member(request)) if ref else None
    return {"seq": c.stream_seq, "case": case}


# --- before sign-in --------------------------------------------------------------------------------------------------


@router.get("", summary="What the sign-in page and the installed app show (no sign-in needed)")
async def workspace(ws: str, ctx: Public) -> dict[str, Any]:
    c = await world.client(ctx, ws)
    platform = (c.workspace_doc or {}).get(
        "platform", {"name": "Smart-Clearance", "domain": ctx.settings.workspace_domain}
    )
    return views.public(c, platform, await views.sign_in_accounts(ctx, c))


# --- the session -------------------------------------------------------------------------------------------------


@router.post("/session", summary="Sign in: the bearer token's member (an invited one becomes active)")
async def sign_in(request: Request, ctx: MemberSigningIn) -> dict[str, Any]:
    cm = _member(request)
    user = await ctx.session.get(m.User, cm.user_id)
    return views.member_out(cm, user)


@router.get("/session", summary="Who is signed in (401 when nobody is; 403 for someone not in this workspace)")
async def me(request: Request, ctx: MemberCtx) -> dict[str, Any]:
    cm = _member(request)
    user = await ctx.session.get(m.User, cm.user_id)
    return views.member_out(cm, user)


@router.delete("/session", status_code=204, summary="Sign out (the browser signs out of Firebase)")
async def sign_out() -> Response:
    return Response(status_code=204)


# --- reading -----------------------------------------------------------------------------------------------------


@router.get("/snapshot", summary="Everything the member's screens need, cut to their role")
async def snapshot(ws: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    return await views.snapshot(ctx, ws, _member(request))


@router.get(CASE, summary="One batch's journey, cut to the member's role")
async def case(ws: str, ref: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    return await views.case_detail(ctx, ws, ref, _member(request))


@router.get("/ledger", summary="The ledger: every batch cleared, by quarter and year")
async def ledger(ws: str, ctx: MemberCtx) -> dict[str, Any]:
    ctx.require("report.read", "Your role can't see the ledger.")
    return await views.ledger(ctx, ws)


@router.get("/audit", summary="The workspace's audit log, newest first, a page at a time")
async def audit_log(ws: str, ctx: MemberCtx, before: str | None = None) -> dict[str, Any]:
    ctx.require("ws.audit", "Your role can't read the audit log.")
    return await views.audit_page(ctx, ws, before)


@router.get("/documents/{ref}/{doc}", summary="A 5-minute link to a document's PDF")
async def document(ws: str, ref: str, doc: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    ctx.require("docs.read", "Your role can't see the papers.")
    detail = await views.case_detail(ctx, ws, ref, _member(request))
    rcpt = (detail.get("donation") or {}).get("receipt") or {}
    ready = any(d["id"] == doc and d["pdf"] for d in detail["docs"]) or (doc == "receipt" and rcpt.get("pdf"))
    if not ready:
        raise ApiError(404, "That paper has no PDF yet.")
    name = await views.document_object(ctx, ws, ref, doc)
    assert ctx.cloud is not None and ctx.settings.docs_bucket and name
    url = ctx.cloud.storage.signed_get(ctx.settings.docs_bucket, name)
    return {"url": url, "expiresAt": (ctx.clock.now() + timedelta(minutes=5)).isoformat()}


# --- setting up --------------------------------------------------------------------------------------------------


@router.post("/setup/exports", summary="A signed link to upload a stock export for the Data agent")
async def upload_export(ws: str, data: UploadInput, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    ctx.require("setup.upload", "Your role can't upload stock exports.")
    if data.bytes > 20 * 1024 * 1024:
        raise ApiError(422, "An export must be under 20 MB.", {"bytes": "Under 20 MB."})
    assert ctx.cloud is not None and ctx.settings.exports_bucket
    eid = ctx.ids.new("ex", 10)
    name = f"{ws}/uploads/{eid}.csv"
    link = ctx.cloud.storage.signed_put(ctx.settings.exports_bucket, name, data.content_type or "text/csv")
    return {
        "id": eid,
        "url": link.url,
        "headers": link.headers,
        "expiresAt": (ctx.clock.now() + timedelta(minutes=10)).isoformat(),
    }


@router.post("/setup/exports/{export_id}", summary="The export has arrived: the Data agent maps and loads it")
async def export_uploaded(ws: str, export_id: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws)) is not None:
        return replay
    ctx.require("setup.upload", "Your role can't upload stock exports.")
    assert ctx.cloud is not None and ctx.settings.exports_bucket
    name = f"{ws}/uploads/{export_id}.csv"
    if not await ctx.cloud.storage.size(ctx.settings.exports_bucket, name):
        raise ApiError(422, "The export has not arrived yet. Upload it again.")
    await ev.publish(
        ctx,
        J.Event(
            J.STEP, {"type": "export.uploaded", "client": ws, "file": f"gs://{ctx.settings.exports_bucket}/{name}"}, ws
        ),
    )
    return await _done(ctx, request, ws)


@router.post("/setup/confirm", summary="Confirm the Data agent's mapping and the guardrails (stage 1)")
async def confirm_setup(ws: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws)) is not None:
        return replay
    await steps.confirm_setup(ctx, ws)
    return await _done(ctx, request, ws)


@router.post("/permission", summary="A distributor's one-time permission for the agents to act in its name")
async def permit(ws: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws)) is not None:
        return replay
    await steps.permit(ctx, ws)
    return await _done(ctx, request, ws)


@router.patch("/permission", summary="Pause or resume the agents in the distributor's name")
async def pause(ws: str, data: PauseInput, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws)) is not None:
        return replay
    await steps.pause(ctx, ws, data.paused)
    return await _done(ctx, request, ws)


# --- a batch's journey -------------------------------------------------------------------------------------------


@router.post(CASE + "/photos", summary="A signed link for the batch's label photo")
async def upload_photo(ws: str, ref: str, data: UploadInput, ctx: MemberCtx) -> dict[str, Any]:
    link = await steps.photo_upload(ctx, ws, ref, data.content_type, data.bytes)
    await ctx.session.commit()
    return link


@router.post(CASE + "/photos/{photo_id}", summary="The label photo has been sent: Vision reads it")
async def photo_sent(ws: str, ref: str, photo_id: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    await steps.photo_sent(ctx, ws, ref, photo_id)
    return await _done(ctx, request, ws, ref)


@router.post(CASE + "/approval", summary="Approve the plan: the one tap")
async def approve(ws: str, ref: str, data: ApproveInput, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    await steps.approve(ctx, ws, ref, data.device)
    return await _done(ctx, request, ws, ref)


@router.post(CASE + "/orders", summary="A kirana orders under the scheme")
async def order(ws: str, ref: str, data: OrderInput, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    await steps.order(ctx, ws, ref, data.units)
    return await _done(ctx, request, ws, ref)


@router.post(CASE + "/bids", summary="The buyer bids on the lot")
async def bid(ws: str, ref: str, data: BidInput, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    await steps.bid(ctx, ws, ref, data.price)
    return await _done(ctx, request, ws, ref)


@router.post(CASE + "/messages", summary="The buyer writes to the seller (the Negotiator answers)")
async def message(ws: str, ref: str, data: MessageInput, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    await steps.message(ctx, ws, ref, data.text)
    return await _done(ctx, request, ws, ref)


@router.post(CASE + "/bids/{bid_id}/accept", summary="The buyer takes the counter and pays the token")
async def accept(ws: str, ref: str, bid_id: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    await steps.accept(ctx, ws, ref, bid_id)
    return await _done(ctx, request, ws, ref)


@router.post(CASE + "/donation/confirm", summary="The food bank confirms the pickup")
async def confirm_pickup(ws: str, ref: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    await steps.confirm_pickup(ctx, ws, ref)
    return await _done(ctx, request, ws, ref)


@router.post(CASE + "/donation/collect", summary="The food bank collects")
async def collect(ws: str, ref: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    await steps.collect(ctx, ws, ref)
    return await _done(ctx, request, ws, ref)


@router.post(CASE + "/donation/decline", summary="The food bank turns the pickup down")
async def decline_donation(ws: str, ref: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    await steps.decline_donation(ctx, ws, ref)
    return await _done(ctx, request, ws, ref)


@router.post(CASE + "/staff-sale", summary="The distributor records the staff sale at the godown")
async def staff_sale(ws: str, ref: str, data: StaffSaleInput, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    await steps.staff_sale(ctx, ws, ref, data.sold)
    return await _done(ctx, request, ws, ref)


@router.post(CASE + "/dispatches", summary="The buyer's truck loaded, or the van round run")
async def dispatch(ws: str, ref: str, data: DispatchInput, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    await steps.dispatch(ctx, ws, ref, data.kind)
    return await _done(ctx, request, ws, ref)


@router.post(CASE + "/documents/{doc}/issue", summary="The distributor issues his invoice from Tally")
async def issue_invoice(ws: str, ref: str, doc: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    if doc != "invoice":
        raise ApiError(422, "Only the invoice is issued by the distributor.")
    await steps.issue_invoice(ctx, ws, ref)
    return await _done(ctx, request, ws, ref)


@router.post(CASE + "/review", summary="The operator has reviewed the papers")
async def review(ws: str, ref: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws, ref)) is not None:
        return replay
    await steps.review(ctx, ws, ref)
    return await _done(ctx, request, ws, ref)


# --- the inbox, people, guardrails and devices ---------------------------------------------------------------------


@router.post("/notifications/read", summary="Mark notifications read: some, or all")
async def mark_read(ws: str, data: ReadInput, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws)) is not None:
        return replay
    await admin.mark_read(ctx, ws, None if data.all else (data.ids or []))
    return await _done(ctx, request, ws)


@router.post("/members", summary="Invite a member (a Firebase account on the default password; nothing is mailed)")
async def invite(ws: str, data: InviteInput, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws)) is not None:
        return replay
    await admin.invite(ctx, ws, data.model_dump(by_alias=True))
    return await _done(ctx, request, ws)


@router.patch("/members/{ref}", summary="Deactivate or reactivate a member, or change their role")
async def update_member(ws: str, ref: str, data: MemberPatch, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws)) is not None:
        return replay
    await admin.update(ctx, ws, ref, data.model_dump(exclude_none=True))
    return await _done(ctx, request, ws)


@router.put("/rules", summary="The workspace's guardrails")
async def save_rules(ws: str, request: Request, ctx: MemberCtx) -> dict[str, Any]:
    if (replay := await _replay(ctx, request, ws)) is not None:
        return replay
    body = await request.json()
    if not isinstance(body, dict):
        raise ApiError(422, "The guardrails, as an object.")
    await admin.save_rules(ctx, ws, body)
    return await _done(ctx, request, ws)


@router.post("/devices", status_code=204, summary="Register this browser for push (its FCM token)")
async def register_device(ws: str, data: DeviceInput, ctx: MemberCtx) -> Response:
    await admin.register_device(ctx, ws, data.token, data.user_agent)
    await ctx.session.commit()
    return Response(status_code=204)


@router.delete("/devices/{token}", status_code=204, summary="Stop pushes to this browser")
async def unregister_device(ws: str, token: str, ctx: MemberCtx) -> Response:
    await admin.unregister_device(ctx, ws, token)
    await ctx.session.commit()
    return Response(status_code=204)


# --- live updates ------------------------------------------------------------------------------------------------


@router.get("/events", summary="The member's stream after a position: the polling fallback (waits up to `wait` s)")
async def events(
    ws: str,
    request: Request,
    ctx: MemberCtx,
    after: int = Query(0, ge=0),
    wait: int = Query(0, ge=0, le=25),
) -> dict[str, Any]:
    hear = views.tokens(_member(request))
    page = await views.events_after(ctx, ws, hear, after)
    if page["events"] or page["reset"] or not wait:
        return page
    hub = request.app.state.hub
    await ctx.session.rollback()  # the connection goes back to the pool while waiting
    await hub.wait(ws, page["seq"], timeout=wait)
    async with request.app.state.sessions() as session:
        return await views.events_after(replace(ctx, session=session), ws, hear, after)


@router.get("/events/stream", summary="Server-sent events: the member's stream, live")
async def stream(
    ws: str,
    request: Request,
    ctx: MemberCtx,
    after: int | None = Query(None, ge=0),
) -> StreamingResponse:
    hear = views.tokens(_member(request))
    last = request.headers.get("last-event-id")
    position = int(last) if last and last.isdigit() else (after or 0)
    settings, hub, sessions = request.app.state.settings, request.app.state.hub, request.app.state.sessions
    await ctx.session.rollback()

    async def frames() -> AsyncIterator[str]:
        nonlocal position
        loop = asyncio.get_running_loop()
        ends = loop.time() + settings.stream_max_seconds
        yield f"retry: 3000\n: connected at {position}\n\n"
        while loop.time() < ends and not await request.is_disconnected():
            async with sessions() as session:
                page = await views.events_after(replace(ctx, session=session), ws, hear, position)
            if page["reset"]:
                position = page["seq"]
                yield f"id: {position}\nevent: reset\ndata: {json.dumps({'seq': position})}\n\n"
                continue
            for e in page["events"]:
                position = e["seq"]
                yield f"id: {position}\nevent: {e['type']}\ndata: {json.dumps(e, separators=(',', ':'))}\n\n"
            if len(page["events"]) >= views.EVENTS_PAGE:
                continue  # more to send at once
            # rows for other members' ears are passed over
            position = max(position, page["seq"])
            if page["events"]:
                continue
            woke = await hub.wait(ws, page["seq"], timeout=min(settings.stream_heartbeat_seconds, ends - loop.time()))
            if not woke:
                yield ": keep-alive\n\n"
        yield "event: end\ndata: {}\n\n"

    return StreamingResponse(
        frames(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )
