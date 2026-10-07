"""What each request runs with: a database session (committed by the route once its change is made), the clock and
ids, Firebase, and who is asking.

- Public routes (the landing page's, and the console's config and catalog) ignore any token they are sent.
- Console routes need a Firebase ID token of an active staff member; otherwise 401, which the console reads as
  signed out. The token check is a span of its own in the request's trace (SC-57): once a minute per account it
  reaches Firebase.
"""

import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from sc_api import tracing
from sc_api.errors import ApiError
from sc_api.identity import Verified
from sc_api.services import reference, staff
from sc_api.services.context import SYSTEM, Actor, Ctx

bearer = HTTPBearer(auto_error=False)
VISITOR = Actor(name="Visitor")
REFERENCE_TTL = 60.0


async def _reference(request: Request, session) -> reference.Reference:
    """the reference data, read at most once a minute per process: it only changes when migrations run"""
    state = request.app.state
    cached = getattr(state, "reference", None)
    if cached and time.monotonic() - cached[0] < REFERENCE_TTL:
        return cached[1]
    ref = await reference.read(session)
    state.reference = (time.monotonic(), ref)
    return ref


@asynccontextmanager
async def _ctx(request: Request, actor: Actor) -> AsyncIterator[Ctx]:
    state = request.app.state
    async with state.sessions() as session:
        try:
            yield Ctx(
                session=session,
                actor=actor,
                clock=state.clock,
                ids=state.ids,
                identity=state.identity,
                settings=state.settings,
                ref=await _reference(request, session),
                cloud=getattr(state, "cloud", None),
            )
        except BaseException:
            await session.rollback()
            raise


async def public_ctx(request: Request) -> AsyncIterator[Ctx]:
    async with _ctx(request, VISITOR) as ctx:
        yield ctx


def _token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise ApiError(401, "Sign in to the console first.")
    return credentials.credentials


async def _verified(request: Request, credentials: HTTPAuthorizationCredentials | None) -> Verified:
    token = _token(credentials)
    with tracing.tracer.start_as_current_span("verify ID token"):
        return await request.app.state.identity.verify(token)


async def staff_ctx(
    request: Request, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> AsyncIterator[Ctx]:
    verified = await _verified(request, credentials)
    async with _ctx(request, VISITOR) as ctx:
        signed_in = await staff.by_uid(ctx, verified.uid)
        request.state.staff = signed_in.staff
        yield ctx.acting_as(signed_in.actor)


async def signing_in_ctx(
    request: Request, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> AsyncIterator[tuple[Ctx, staff.SignedIn]]:
    """POST /v1/console/session: the first sign-in of an invited staff member makes them active"""
    verified = await _verified(request, credentials)
    async with _ctx(request, VISITOR) as ctx:
        signed_in = await staff.by_uid(ctx, verified.uid, activate=True)
        await ctx.session.commit()
        yield ctx.acting_as(signed_in.actor), signed_in


# --- a workspace's members (SC-66) ----------------------------------------------------------------------------------


async def member_ctx(
    request: Request, ws: str, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> AsyncIterator[Ctx]:
    """a signed-in member of workspace `ws` (the path's): a Firebase ID token of an active member, or 403"""
    from sc_api.services.journey import views

    verified = await _verified(request, credentials)
    async with _ctx(request, VISITOR) as ctx:
        actor, member = await views.signed_in(ctx, ws, verified.uid)
        request.state.member = member
        yield ctx.acting_as(actor)


async def member_signing_in_ctx(
    request: Request, ws: str, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> AsyncIterator[Ctx]:
    """POST /v1/workspaces/{ws}/session: an invited member's first sign-in makes them active"""
    from sc_api.services.journey import views

    verified = await _verified(request, credentials)
    async with _ctx(request, VISITOR) as ctx:
        actor, member = await views.signed_in(ctx, ws, verified.uid, activate=True)
        await ctx.session.commit()
        request.state.member = member
        yield ctx.acting_as(actor)


async def internal_ctx(
    request: Request, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> AsyncIterator[Ctx]:
    """an /internal route's caller: an agent, Pub/Sub's push or Cloud Scheduler, by its Google ID token"""
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise ApiError(401, "A Google ID token is needed.")
    with tracing.tracer.start_as_current_span("verify caller"):
        request.state.caller = await request.app.state.callers.verify(credentials.credentials)
    async with _ctx(request, SYSTEM) as ctx:
        yield ctx


Public = Annotated[Ctx, Depends(public_ctx)]
StaffCtx = Annotated[Ctx, Depends(staff_ctx)]
SigningIn = Annotated[tuple[Ctx, staff.SignedIn], Depends(signing_in_ctx)]
MemberCtx = Annotated[Ctx, Depends(member_ctx)]
MemberSigningIn = Annotated[Ctx, Depends(member_signing_in_ctx)]
InternalCtx = Annotated[Ctx, Depends(internal_ctx)]
