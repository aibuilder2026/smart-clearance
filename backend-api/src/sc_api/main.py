"""backend-api: the landing page's and the staff console's API (uvicorn sc_api.main:app)."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncEngine
from starlette.middleware.base import BaseHTTPMiddleware

from sc_api import errors, logs, tracing
from sc_api.db import dispose, make_engine, sessions
from sc_api.domain.clock import Clock, Ids
from sc_api.identity import IdentityProvider, provider
from sc_api.routers import console, public
from sc_api.settings import Settings, get_settings


def create_app(
    settings: Settings | None = None,
    *,
    engine: AsyncEngine | None = None,
    identity: IdentityProvider | None = None,
    clock: Clock | None = None,
    ids: Ids | None = None,
) -> FastAPI:
    settings = settings or get_settings()
    logs.configure(settings)
    tracer_provider = tracing.setup(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        own = engine is None
        app.state.engine = engine or await make_engine(settings)
        app.state.sessions = sessions(app.state.engine)
        try:
            yield
        finally:
            if own:
                await dispose(app.state.engine)
            tracing.flush()

    app = FastAPI(
        title="Smart-Clearance platform API",
        version="1.0.0",
        summary="The landing page's and the staff console's backend (frontend/api is its contract)",
        lifespan=lifespan,
        docs_url="/docs" if settings.sc_env != "prod" else None,
        redoc_url=None,
    )
    app.state.settings = settings
    app.state.identity = identity or provider(settings)
    app.state.clock = clock or Clock()
    app.state.ids = ids or Ids()
    app.state.limiter = public.limiter
    errors.install(app)

    async def no_store(request, call_next):
        response = await call_next(request)
        if request.url.path.startswith(("/v1/console", "/v1/demo-requests")):
            response.headers.setdefault("Cache-Control", "no-store")
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        return response

    app.add_middleware(BaseHTTPMiddleware, dispatch=no_store)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
        # traceparent: the apps start each call's trace (SC-57)
        allow_headers=["authorization", "content-type", "accept", "traceparent"],
        allow_credentials=False,
        max_age=600,
    )
    app.include_router(public.router)
    app.include_router(console.router)
    tracing.instrument_app(app, tracer_provider)
    return app


def __getattr__(name: str):
    # `uvicorn sc_api.main:app` builds the app on first use, so importing this module needs no configuration
    if name == "app":
        return create_app()
    raise AttributeError(name)
