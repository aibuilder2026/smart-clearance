"""What each request runs with: a database session (committed by the route once its change is made), the clock and
ids, Firebase, and who is asking.

- Public routes (the landing page's, and the console's config and catalog) ignore any token they are sent.
- Console routes need a Firebase ID token of an active staff member; otherwise 401, which the console reads as
  signed out.
"""

import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from sc_api.errors import ApiError
from sc_api.services import reference, staff
from sc_api.services.context import Actor, Ctx

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


async def staff_ctx(
    request: Request, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> AsyncIterator[Ctx]:
    token = _token(credentials)
    verified = await request.app.state.identity.verify(token)
    async with _ctx(request, VISITOR) as ctx:
        signed_in = await staff.by_uid(ctx, verified.uid)
        request.state.staff = signed_in.staff
        yield ctx.acting_as(signed_in.actor)


async def signing_in_ctx(
    request: Request, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> AsyncIterator[tuple[Ctx, staff.SignedIn]]:
    """POST /v1/console/session: the first sign-in of an invited staff member makes them active"""
    token = _token(credentials)
    verified = await request.app.state.identity.verify(token)
    async with _ctx(request, VISITOR) as ctx:
        signed_in = await staff.by_uid(ctx, verified.uid, activate=True)
        await ctx.session.commit()
        yield ctx.acting_as(signed_in.actor), signed_in


Public = Annotated[Ctx, Depends(public_ctx)]
StaffCtx = Annotated[Ctx, Depends(staff_ctx)]
SigningIn = Annotated[tuple[Ctx, staff.SignedIn], Depends(signing_in_ctx)]
