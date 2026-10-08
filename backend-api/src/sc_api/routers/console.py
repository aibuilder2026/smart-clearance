"""The staff console's routes (frontend/api/src/console/http.ts). Every change commits with its audit line, then
answers the client as it now stands."""

from typing import Annotated

from fastapi import APIRouter, Query, Request, Response

from sc_api.deps import Public, SigningIn, StaffCtx
from sc_api.schemas import (
    AgentPatch,
    AuditEntry,
    BatchGates,
    BatchPage,
    BatchQuery,
    ClientOut,
    ConsoleConfig,
    Dashboard,
    DemoRequest,
    ExportArrivedInput,
    ExportUploadInput,
    InviteInput,
    JourneyOut,
    JourneyResetInput,
    NewClientInput,
    OverrideInput,
    Overview,
    PersonPatch,
    PlanPatch,
    ProfileInput,
    RulesInput,
    Shape,
    SkuGatesInput,
    Staff,
    StaffInviteInput,
    UploadLinkOut,
)
from sc_api.services import agents, audit, clients, dashboard, exports, people, presenter, site, staff, supply
from sc_api.services.context import Ctx
from sc_api.services.journey import controls as journey_controls
from sc_api.services.journey import events as journey_events

router = APIRouter(prefix="/v1", tags=["console"])
C = "/console/clients/{client_id}"


async def _changed(ctx: Ctx, client_id: str) -> ClientOut:
    await ctx.session.commit()
    return await presenter.client_out(ctx, client_id)


def _read(ctx: Ctx) -> None:
    ctx.require("console.read", "Your role can't see the console.")


# --- before sign-in --------------------------------------------------------------------------------------------


@router.get("/console/config", response_model=ConsoleConfig, summary="How the console describes the platform")
async def config(ctx: Public) -> ConsoleConfig:
    return ConsoleConfig(**ctx.ref.config, staff_email_domain=ctx.settings.staff_email_domain)


# --- the session -----------------------------------------------------------------------------------------------


@router.post("/console/session", response_model=Staff, summary="Sign in: the bearer token's staff member")
async def sign_in(signing_in: SigningIn) -> Staff:
    _, signed_in = signing_in
    return signed_in.staff


@router.get("/console/session", response_model=Staff, summary="Who is signed in (401 when nobody is)")
async def me(request: Request, ctx: StaffCtx) -> Staff:
    return request.state.staff


@router.delete("/console/session", status_code=204, summary="Sign out (the browser signs out of Firebase)")
async def sign_out() -> Response:
    return Response(status_code=204)


# --- reading ---------------------------------------------------------------------------------------------------


@router.get("/console/overview", response_model=Overview)
async def overview(ctx: StaffCtx) -> Overview:
    _read(ctx)
    return await presenter.overview(ctx)


@router.get("/console/dashboard", response_model=Dashboard, summary="The platform's figures over a range of days")
async def overview_dashboard(ctx: StaffCtx, days: int = 30, client: str | None = None) -> Dashboard:
    return await dashboard.dashboard(ctx, days, client)


@router.get("/console/batches", response_model=BatchPage, summary="Every client's batches, a page at a time")
async def batch_page(ctx: StaffCtx, query: Annotated[BatchQuery, Query()]) -> BatchPage:
    return await dashboard.batches(ctx, query)


@router.get("/console/clients", response_model=list[ClientOut])
async def list_clients(ctx: StaffCtx) -> list[ClientOut]:
    _read(ctx)
    return [await presenter.client_out(ctx, cid) for cid in await presenter.client_ids(ctx)]


@router.get(C, response_model=ClientOut)
async def get_client(client_id: str, ctx: StaffCtx) -> ClientOut:
    _read(ctx)
    return await presenter.client_out(ctx, client_id)


@router.get("/console/staff", response_model=list[Staff])
async def list_staff(ctx: StaffCtx) -> list[Staff]:
    _read(ctx)
    return await staff.list_staff(ctx)


@router.get("/console/audit", response_model=list[AuditEntry], summary="The audit log, newest first")
async def audit_log(ctx: StaffCtx, client: str | None = None) -> list[AuditEntry]:
    _read(ctx)
    return await audit.entries(ctx, client)


@router.get("/demo-requests", response_model=list[DemoRequest], summary="Book a demo's requests, newest first")
async def demo_requests(ctx: StaffCtx) -> list[DemoRequest]:
    _read(ctx)
    return await site.demo_requests(ctx)


# --- changes ---------------------------------------------------------------------------------------------------


@router.post("/console/clients", response_model=ClientOut, status_code=201)
async def create_client(data: NewClientInput, ctx: StaffCtx) -> ClientOut:
    return await _changed(ctx, await clients.create(ctx, data))


@router.patch(C, response_model=ClientOut, summary="Change the plan")
async def set_plan(client_id: str, data: PlanPatch, ctx: StaffCtx) -> ClientOut:
    await clients.set_plan(ctx, client_id, data.plan)
    return await _changed(ctx, client_id)


@router.post(C + "/go-live", response_model=ClientOut)
async def go_live(client_id: str, ctx: StaffCtx) -> ClientOut:
    await clients.go_live(ctx, client_id)
    return await _changed(ctx, client_id)


@router.put(C + "/profile", response_model=ClientOut)
async def save_profile(client_id: str, data: ProfileInput, ctx: StaffCtx) -> ClientOut:
    await clients.save_profile(ctx, client_id, data)
    return await _changed(ctx, client_id)


@router.put(C + "/rules", response_model=ClientOut)
async def save_rules(client_id: str, data: RulesInput, ctx: StaffCtx) -> ClientOut:
    await clients.save_rules(ctx, client_id, data)
    return await _changed(ctx, client_id)


class ClockInput(Shape):
    day_minutes: int


@router.put(C + "/clock", response_model=ClientOut, summary="How long a journey day lasts while a batch is at risk")
async def set_clock(client_id: str, data: ClockInput, ctx: StaffCtx) -> ClientOut:
    await journey_events.set_day_minutes(ctx, client_id, data.day_minutes)
    return await _changed(ctx, client_id)


@router.post(C + "/agents/pause", response_model=ClientOut)
async def pause(client_id: str, ctx: StaffCtx) -> ClientOut:
    await agents.set_all(ctx, client_id, False)
    return await _changed(ctx, client_id)


@router.post(C + "/agents/resume", response_model=ClientOut)
async def resume(client_id: str, ctx: StaffCtx) -> ClientOut:
    await agents.set_all(ctx, client_id, True)
    return await _changed(ctx, client_id)


@router.patch(C + "/agents/{agent_id}", response_model=ClientOut)
async def update_agent(client_id: str, agent_id: str, data: AgentPatch, ctx: StaffCtx) -> ClientOut:
    await agents.update(ctx, client_id, agent_id, data)
    return await _changed(ctx, client_id)


@router.post(C + "/agents/{agent_id}/runs", response_model=ClientOut)
async def run_agent(client_id: str, agent_id: str, request: Request, ctx: StaffCtx) -> ClientOut:
    await agents.run_now(ctx, client_id, agent_id)
    out = await _changed(ctx, client_id)
    if (cloud := getattr(request.app.state, "cloud", None)) is not None:  # the run's event, to the agents (SC-66)
        from sc_api.services.journey.outbox import drain

        await drain(request.app.state.sessions, cloud.publisher, ctx.clock.now())
    return out


# --- a client's journey, driven from the console (SC-79) -----------------------------------------------------------


async def _drain(request: Request, ctx: Ctx) -> None:
    """what a change published goes to the agents now, as Run now's does, rather than at the next tick"""
    if (cloud := getattr(request.app.state, "cloud", None)) is not None:
        from sc_api.services.journey.outbox import drain

        await drain(request.app.state.sessions, cloud.publisher, ctx.clock.now())


@router.get(C + "/journey", response_model=JourneyOut, summary="A client's scheduled runs and journey timers")
async def journey(client_id: str, ctx: StaffCtx) -> JourneyOut:
    _read(ctx)
    return JourneyOut.model_validate(await journey_controls.schedule(ctx, client_id))


@router.post(C + "/journey/triggers/{trigger_id}", response_model=JourneyOut, summary="Fire a daily run or a timer now")
async def fire_trigger(client_id: str, trigger_id: str, request: Request, ctx: StaffCtx) -> JourneyOut:
    await journey_controls.fire(ctx, client_id, trigger_id)
    await ctx.session.commit()
    await _drain(request, ctx)
    return JourneyOut.model_validate(await journey_controls.schedule(ctx, client_id))


@router.post(C + "/journey/reset", response_model=JourneyOut, summary="Start a client's journey again from day 0")
async def reset_journey(client_id: str, data: JourneyResetInput, request: Request, ctx: StaffCtx) -> JourneyOut:
    await journey_controls.reset(ctx, client_id, data.day_minutes)
    await ctx.session.commit()
    await _drain(request, ctx)
    return JourneyOut.model_validate(await journey_controls.schedule(ctx, client_id))


# --- a client's stock export, set up by staff (SC-84) -----------------------------------------------------------------


@router.post(C + "/exports", response_model=UploadLinkOut, summary="A signed link to upload a client's stock export")
async def export_link(client_id: str, data: ExportUploadInput, ctx: StaffCtx) -> UploadLinkOut:
    return UploadLinkOut.model_validate(await exports.upload_link(ctx, client_id, data.content_type, data.bytes))


@router.post(
    C + "/exports/{export_id}",
    response_model=ClientOut,
    summary="The export has arrived: the Data agent maps and loads it",
)
async def export_arrived(
    client_id: str, export_id: str, data: ExportArrivedInput, request: Request, ctx: StaffCtx
) -> ClientOut:
    await exports.arrived(ctx, client_id, export_id, data.file_name)
    await ctx.session.commit()
    await _drain(request, ctx)
    return await presenter.client_out(ctx, client_id)


@router.post(C + "/distributors/{distributor_id}/reminders", status_code=204)
async def remind(client_id: str, distributor_id: str, ctx: StaffCtx) -> Response:
    await supply.remind(ctx, client_id, distributor_id)
    await ctx.session.commit()
    return Response(status_code=204)


# --- quick-commerce gates per SKU, with a per-batch override (SC-47) ----------------------------------------------


@router.get(C + "/batches", response_model=list[BatchGates], summary="A client's open batches and their gates")
async def client_batches(client_id: str, ctx: StaffCtx, sku: str | None = None) -> list[BatchGates]:
    _read(ctx)
    return await supply.client_batches(ctx, client_id, sku)


@router.put(C + "/skus/{sku_id}/gates", response_model=ClientOut, summary="An SKU's own gates, or null for the default")
async def save_sku_gates(client_id: str, sku_id: str, data: SkuGatesInput, ctx: StaffCtx) -> ClientOut:
    await supply.set_sku_gates(ctx, client_id, sku_id, data.gates)
    return await _changed(ctx, client_id)


@router.put(C + "/batches/{ref}/override", response_model=ClientOut, summary="Override a batch's gates, with why")
async def override_batch(client_id: str, ref: str, data: OverrideInput, ctx: StaffCtx) -> ClientOut:
    await supply.override_batch(ctx, client_id, ref, data)
    return await _changed(ctx, client_id)


@router.delete(C + "/batches/{ref}/override", response_model=ClientOut, summary="Put a batch back on its SKU's gates")
async def clear_override(client_id: str, ref: str, ctx: StaffCtx) -> ClientOut:
    await supply.clear_override(ctx, client_id, ref)
    return await _changed(ctx, client_id)


@router.post(C + "/integrations/dms/requests", response_model=ClientOut)
async def first_export(client_id: str, ctx: StaffCtx) -> ClientOut:
    await supply.request_first_export(ctx, client_id)
    return await _changed(ctx, client_id)


@router.post(C + "/people", response_model=ClientOut)
async def invite_person(client_id: str, data: InviteInput, ctx: StaffCtx) -> ClientOut:
    await people.invite(ctx, client_id, data)
    return await _changed(ctx, client_id)


@router.patch(C + "/people/{person}", response_model=ClientOut)
async def update_person(client_id: str, person: str, data: PersonPatch, ctx: StaffCtx) -> ClientOut:
    await people.update(ctx, client_id, person, data)
    return await _changed(ctx, client_id)


@router.post(C + "/people/{person}/invitations", status_code=204)
async def resend_invite(client_id: str, person: str, ctx: StaffCtx) -> Response:
    await people.resend(ctx, client_id, person)
    await ctx.session.commit()
    return Response(status_code=204)


@router.post("/console/staff", response_model=Staff, status_code=201)
async def invite_staff(data: StaffInviteInput, ctx: StaffCtx) -> Staff:
    out = await staff.invite(ctx, data)
    await ctx.session.commit()
    return out
