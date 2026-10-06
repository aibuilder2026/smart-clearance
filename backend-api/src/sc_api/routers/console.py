"""The staff console's routes (frontend/api/src/console/http.ts). Every change commits with its audit line, then
answers the client as it now stands."""

from fastapi import APIRouter, Request, Response

from sc_api.deps import Public, SigningIn, StaffCtx
from sc_api.schemas import (
    AgentPatch,
    AuditEntry,
    ClientOut,
    ConsoleConfig,
    DemoRequest,
    InviteInput,
    NewClientInput,
    Overview,
    PersonPatch,
    PlanPatch,
    ProfileInput,
    RulesInput,
    Staff,
    StaffInviteInput,
)
from sc_api.services import agents, audit, clients, people, presenter, site, staff, supply
from sc_api.services.context import Ctx

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
async def run_agent(client_id: str, agent_id: str, ctx: StaffCtx) -> ClientOut:
    await agents.run_now(ctx, client_id, agent_id)
    return await _changed(ctx, client_id)


@router.post(C + "/distributors/{distributor_id}/reminders", status_code=204)
async def remind(client_id: str, distributor_id: str, ctx: StaffCtx) -> Response:
    await supply.remind(ctx, client_id, distributor_id)
    await ctx.session.commit()
    return Response(status_code=204)


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
