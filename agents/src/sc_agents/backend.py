"""backend-api's /internal routes (backend-api/src/sc_api/routers/internal.py): what the agents read, and where they
report. Every call carries a Google ID token minted for INTERNAL_AUDIENCE (gcp.py) and the run's trace (traceparent);
a 5xx or a dropped connection is tried again, twice, before the run gives up for Pub/Sub to redeliver.

backend-api is the system of record: it works out every figure and writes every change. An agent reads the facts
here, brings its words (a label read, notes, an explanation, a listing, an offer, a reply), and reports; each report
names the event it answered (`run.eventKey`), so a redelivered event finds its run recorded and does nothing
(`{"noop": true}`).
"""

import asyncio
import logging
from typing import Any

import httpx

from sc_agents import tracing
from sc_agents.errors import Permanent, Stale, Transient
from sc_agents.gcp import Tokens

log = logging.getLogger("sc_agents.backend")


class Backend:
    def __init__(
        self,
        base: str,
        tokens: Tokens,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
        timeout: float = 30.0,
        retries: int = 3,
        backoff: float = 0.5,
    ):
        self.tokens = tokens
        self.retries = max(1, retries)
        self.backoff = backoff
        self.client = httpx.AsyncClient(base_url=base.rstrip("/"), transport=transport, timeout=timeout)

    async def aclose(self) -> None:
        await self.client.aclose()

    async def _call(self, method: str, path: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
        last: Exception | None = None
        for attempt in range(self.retries):
            if attempt:
                await asyncio.sleep(self.backoff * 2 ** (attempt - 1))
            headers = tracing.inject({"Authorization": f"Bearer {await self.tokens.token()}"})
            try:
                r = await self.client.request(method, path, json=body, headers=headers)
            except httpx.TransportError as e:
                last = e
                log.warning("backend-api %s %s: %s (attempt %s)", method, path, e, attempt + 1)
                continue
            if r.status_code >= 500:
                last = Transient(f"backend-api {method} {path}: {r.status_code}")
                log.warning("backend-api %s %s answered %s (attempt %s)", method, path, r.status_code, attempt + 1)
                continue
            if r.status_code in (404, 409):
                raise Stale(f"{method} {path}: {r.status_code} {_message(r)}")
            if r.status_code in (401, 403, 429):
                # a token or a grant not in place yet, or a limit: worth another delivery, then the dead letter
                raise Transient(f"{method} {path}: {r.status_code} {_message(r)}")
            if r.status_code >= 400:
                raise Permanent(f"{method} {path}: {r.status_code} {_message(r)}")
            return r.json() if r.content else {}
        raise Transient(f"backend-api {method} {path} failed after {self.retries} attempts: {last}") from last

    async def get(self, path: str) -> dict[str, Any]:
        return await self._call("GET", path)

    async def post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        return await self._call("POST", path, body)

    async def patch(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        return await self._call("PATCH", path, body)

    # --- what the agents read ----------------------------------------------------------------------------------------

    async def agents(self, client: str) -> dict[str, Any]:
        return await self.get(f"/internal/clients/{client}/agents")

    async def batches(self, client: str) -> dict[str, Any]:
        return await self.get(f"/internal/clients/{client}/batches")

    async def case(self, client: str, ref: str) -> dict[str, Any]:
        return await self.get(case_path(client, ref))

    async def valuation_preview(self, client: str, ref: str) -> dict[str, Any]:
        return await self.get(case_path(client, ref, "valuation-preview"))

    async def plan_preview(self, client: str, ref: str) -> dict[str, Any]:
        return await self.get(case_path(client, ref, "plan-preview"))

    async def bid_preview(self, client: str, ref: str, bid: str) -> dict[str, Any]:
        return await self.get(case_path(client, ref, f"bids/{bid}/preview"))


def case_path(client: str, ref: str, tail: str = "") -> str:
    return f"/internal/clients/{client}/cases/{ref}" + (f"/{tail}" if tail else "")


def _message(r: httpx.Response) -> str:
    try:
        body = r.json()
    except ValueError:
        return r.text[:200]
    if isinstance(body, dict):
        return str(body.get("message") or body.get("detail") or body)[:200]
    return str(body)[:200]
