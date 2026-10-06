"""The landing page's routes (frontend/api/src/site.ts), public and needing no sign-in."""

from fastapi import APIRouter, Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import text

from sc_api.deps import Public
from sc_api.schemas import Catalog, DemoRequest, DemoRequestInput, LookupInput, WorkspaceMatch
from sc_api.services import site
from sc_api.settings import get_settings

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()
CACHEABLE = "public, max-age=300"


@router.get("/healthz", include_in_schema=False)
async def healthz() -> dict:
    return {"ok": True}


@router.get("/readyz", include_in_schema=False)
async def readyz(ctx: Public) -> dict:
    await ctx.session.execute(text("select 1"))
    return {"ok": True}


@router.get("/v1/site/showcase", tags=["site"], summary="One illustrative batch, every figure worked out")
async def showcase(ctx: Public, response: Response) -> dict:
    response.headers["Cache-Control"] = CACHEABLE
    return await site.document(ctx, "showcase")


@router.get("/v1/platform/catalog", tags=["site"], response_model=Catalog, summary="What the platform offers")
async def catalog(ctx: Public, response: Response) -> Catalog:
    response.headers["Cache-Control"] = CACHEABLE
    return await site.catalog(ctx)


@router.post(
    "/v1/workspaces/lookup",
    tags=["site"],
    response_model=list[WorkspaceMatch],
    summary="Find your workspace, by email or mobile number (a POST, so the identifier never reaches a URL or log)",
)
@limiter.limit(lambda: get_settings().lookup_rate)
async def lookup(request: Request, data: LookupInput, ctx: Public) -> list[WorkspaceMatch]:
    return await site.lookup(ctx, data.query)


@router.post("/v1/demo-requests", tags=["site"], response_model=DemoRequest, status_code=201, summary="Book a demo")
@limiter.limit("5/minute")
async def request_demo(request: Request, data: DemoRequestInput, ctx: Public) -> DemoRequest:
    out = await site.request_demo(ctx, data)
    await ctx.session.commit()
    return out
