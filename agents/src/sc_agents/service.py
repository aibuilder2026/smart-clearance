"""The agents service on Cloud Run (infra phase B, SC-74): Pub/Sub pushes each message to `POST /pubsub`, signed as
sc-invoker (Cloud Run checks the OIDC token: the service lets only that account in). The pipeline runs to its end
inside the request:

- 204 when it is done, or there was nothing to do (a redelivered event, a journey that has moved on), or it failed in
  a way another delivery cannot fix;
- 503 on a transient failure, so Pub/Sub delivers it again (backing off 10 s to 10 min); after five attempts it goes
  to the environment's dead letter;
- 204 too for a message whose payload cannot be read (it never will be), logged as an error;
- 400 for a body that is not a Pub/Sub push at all.

`GET /healthz` is the process; `GET /readyz` checks that both models resolve on Vertex AI (unless MODEL_TIER=stub),
reading their metadata, never generating.
"""

import logging
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from sc_agents import tracing
from sc_agents.dispatch import handle
from sc_agents.errors import Transient
from sc_agents.events import BadMessage, NotAPush, from_push
from sc_agents.runs import Deps

log = logging.getLogger("sc_agents.service")
READY_FOR = 600  # a passing model check is kept for ten minutes


def create_app(deps: Deps | None = None) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        if app.state.deps is None:
            from sc_agents.wiring import deps as real

            app.state.deps = real()
        yield
        await app.state.deps.backend.aclose()
        tracing.flush()

    app = FastAPI(title="Smart-Clearance agents", lifespan=lifespan, docs_url=None, redoc_url=None)
    app.state.deps = deps
    app.state.ready_at = 0.0
    if deps is None:  # the real service traces its routes; the tests' apps need not
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        FastAPIInstrumentor.instrument_app(app, excluded_urls=tracing.UNTRACED, exclude_spans=["receive", "send"])

    @app.post("/pubsub")
    async def pubsub(request: Request) -> Response:
        try:
            envelope: Any = await request.json()
            msg = from_push(envelope)
        except BadMessage as e:
            log.error("a message the agents cannot read, acknowledged: %s", e)
            return Response(status_code=204, headers={"X-Outcome": "unreadable"})
        except (NotAPush, ValueError) as e:
            return JSONResponse({"error": str(e)}, status_code=400)
        try:
            outcome = await handle(msg, request.app.state.deps)
        except Transient as e:
            return JSONResponse({"error": str(e), "retry": True}, status_code=503)
        return Response(status_code=204, headers={"X-Outcome": outcome})

    @app.get("/healthz")
    async def healthz() -> dict[str, Any]:
        return {"ok": True}

    @app.get("/readyz")
    async def readyz(request: Request) -> Response:
        d: Deps = request.app.state.deps
        if d.models.stub:
            return JSONResponse({"ok": True, "models": "stub"})
        if time.monotonic() - request.app.state.ready_at < READY_FOR:
            return JSONResponse({"ok": True})
        problems = await d.models.check()
        if problems:
            return JSONResponse({"ok": False, "models": problems}, status_code=503)
        request.app.state.ready_at = time.monotonic()
        return JSONResponse({"ok": True, "models": {"pro": d.settings.model_pro, "flash": d.settings.model_flash}})

    return app


app = create_app()
