"""backend-api: the landing page's, the staff console's and the client workspaces' API (uvicorn sc_api.main:app)."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncEngine
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from sc_api import errors, local, logs, tracing
from sc_api.cloud import Cloud, cloud
from sc_api.db import dispose, make_engine, sessions
from sc_api.domain.clock import Clock, Ids
from sc_api.identity import IdentityProvider, callers, provider
from sc_api.routers import console, internal, public, workspace
from sc_api.settings import Settings, get_settings
from sc_api.stream import Hub


class Headers:
    """no-store on the console's and the workspaces' answers, nosniff on all. Plain ASGI, so a server-sent event stream
    passes through unbuffered (Starlette's BaseHTTPMiddleware would hold it)"""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        path = scope.get("path", "")

        async def send_with(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                if path.startswith(("/v1/console", "/v1/demo-requests", "/v1/workspaces/", "/internal")):
                    headers.setdefault("Cache-Control", "no-store")
                headers.setdefault("X-Content-Type-Options", "nosniff")
            await send(message)

        await self.app(scope, receive, send_with)


def create_app(
    settings: Settings | None = None,
    *,
    engine: AsyncEngine | None = None,
    identity: IdentityProvider | None = None,
    clock: Clock | None = None,
    ids: Ids | None = None,
    cloud_services: Cloud | None = None,
) -> FastAPI:
    settings = settings or get_settings()
    logs.configure(settings)
    tracer_provider = tracing.setup(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        own = engine is None
        app.state.engine = engine or await make_engine(settings)
        app.state.sessions = sessions(app.state.engine)
        running = await local.start(app)
        try:
            yield
        finally:
            await local.stop(running)
            await app.state.hub.stop()
            if own:
                await dispose(app.state.engine)
            tracing.flush()

    app = FastAPI(
        title="Smart-Clearance platform API",
        version="1.0.0",
        summary="The landing page's, the staff console's and the workspaces' backend (frontend/api is its contract)",
        lifespan=lifespan,
        docs_url="/docs" if settings.sc_env != "prod" else None,
        redoc_url=None,
    )
    app.state.settings = settings
    app.state.identity = identity or provider(settings)
    app.state.callers = callers(settings)
    app.state.cloud = cloud_services or cloud(settings, app.state.identity)
    app.state.hub = Hub(settings)
    app.state.clock = clock or Clock()
    app.state.ids = ids or Ids()
    app.state.limiter = public.limiter
    errors.install(app)

    app.add_middleware(Headers)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
        # traceparent: the apps start each call's trace (SC-57); idempotency-key and last-event-id: the workspace's
        # retried changes and its event stream resuming (SC-66)
        allow_headers=["authorization", "content-type", "accept", "traceparent", "idempotency-key", "last-event-id"],
        allow_credentials=False,
        max_age=600,
    )
    app.include_router(public.router)
    app.include_router(console.router)
    app.include_router(workspace.router)
    app.include_router(internal.router)
    tracing.instrument_app(app, tracer_provider)
    return app


def __getattr__(name: str):
    # `uvicorn sc_api.main:app` builds the app on first use, so importing this module needs no configuration
    if name == "app":
        return create_app()
    raise AttributeError(name)
