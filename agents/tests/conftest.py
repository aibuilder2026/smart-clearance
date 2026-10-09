"""The agents' test suite: no network and no live model. backend-api is an httpx MockTransport that records every
request and answers as backend-api's /internal routes would for the story's batch (tests/fixtures/story.json, from
backend-api's own reference data); BigQuery and Cloud Storage are in-memory fakes; the models are the stub tier,
replaying recordings (src/sc_agents/recordings/, or a test's own)."""

import copy
import json
from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Any

import httpx
import pytest
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from sc_agents.backend import Backend
from sc_agents.dispatch import handle
from sc_agents.events import Message
from sc_agents.gcp import FixedToken
from sc_agents.models import ModelTier, Recordings
from sc_agents.runs import Deps, RunCtx
from sc_agents.settings import Settings

STORY = json.loads((Path(__file__).parent / "fixtures" / "story.json").read_text(encoding="utf-8"))
HERO = "MF-2409-117"
MANGO = "MF-2410-118"
RESERVE = 13.5
C = "/internal/clients/munchly"
CASE = f"{C}/cases/{HERO}"
PHOTO = f"munchly/{HERO}/ph0000000001"

SPANS = InMemorySpanExporter()
_provider = TracerProvider()
_provider.add_span_processor(SimpleSpanProcessor(SPANS))
trace.set_tracer_provider(_provider)


# --- backend-api, as the agents see it --------------------------------------------------------------------------------


def agents_settings(**off: bool) -> dict[str, Any]:
    """GET /internal/clients/munchly/agents: it carries the reserve (the Lister's and the Negotiator's settings, the money
    rules), which the agents must never pass on to a model"""
    ids = ["data", "watcher", "vision", "valuer", "router", "lister", "outreach", "negotiator", "paperwork", "impact"]
    agents = {a: {"on": not off.get(a, False), "autonomy": "act", "model": "Gemini Flash"} for a in ids}
    agents["lister"].update(reserve=RESERVE, territoryGuard=True)
    agents["negotiator"].update(floor=RESERVE, counters=2, tokenPct=15)
    agents["vision"].update(confidence=0.9)
    return {
        "client": "munchly",
        "agents": agents,
        "rules": {"scheme": {"buy": 10, "free": 2}, "negotiation": {"reservePerUnit": RESERVE}, "kiranaWindowDays": 14},
        "clock": {"now": "2026-10-02T03:35:00+00:00", "day0": "2026-10-02", "day": 0, "dayMinutes": 1440},
        "setupConfirmed": True,
        "language": "hi",
        "offerWindowHours": 48,
    }


def dist(did: str = "rakesh") -> dict[str, Any]:
    return {**STORY["distributors"][did], "permission": {"by": did, "at": "2026-10-02T08:10:00+05:30", "paused": False}}


# the receipt Feeding India issues as it collects the Mango Drink (SC-110: design3 data.js MANGO_RECEIPT), as
# backend-api's case detail gives it, and the same paper as India FoodBanking Network's acknowledgement
RECEIPT = {
    "id": "receipt",
    "type": "Donation receipt",
    "owner": "Feeding India",
    "no": "FI/HYD/26-27/0417",
    "status": "generated",
    "amount": 0,
    "note": "Issued in the app by Feeding India as the packs were collected: the donor's evidence for BRSR Principle 6, "
    "not a tax certificate.",
    "units": 58,
    "date": "2026-10-06",
    "paper": "In-app receipt",
    "stamp": "RECEIVED",
    "kg": 12.47,
    "meals": 58,
    "mealsRule": "a meal for each pack served, indicative",
    "value": None,
    "csr": None,
    "at": "10:00",
    "by": "Meera",
    "donor": "Munchly Foods Ltd",
    "fssai": "10019022001234",
    "via": "Lakshmi Agencies",
    "from": "Begum Bazaar godown, Hyderabad",
    "spot": "the Charminar hunger spot",
    "pdf": False,
}
ACKNOWLEDGEMENT = {
    **RECEIPT,
    "type": "Donation acknowledgement",
    "owner": "India FoodBanking Network",
    "no": "IFBN/ACK/26-27/0112",
    "paper": "Donation acknowledgement (CSR / 80G, indicative)",
    "stamp": "ACKNOWLEDGED",
    "meals": 31,
    "mealsRule": "a meal for every 400 g of food, indicative",
    "value": 638,
    "csr": "Schedule VII (i), eradicating hunger",
    "note": "An acknowledgement for the donor's CSR records, indicative. Section 80G covers gifts of money, so this is "
    "not a tax certificate.",
}

LISTING = {"id": "ES-24117", "status": "live", "units": 772, "price": 15, "reserve": RESERVE, "at": "2026-10-03"}


def case(
    *,
    phase: str = "at-risk",
    photo: str = "reading",
    listing: dict | None = None,
    offer: dict | None = None,
    donation: dict | None = None,
    chat: list | None = None,
    award: dict | None = None,
    docs: list | None = None,
    which: str = "hero",
) -> dict[str, Any]:
    """GET …/cases/{ref}: the case as Munchly's operator sees it, with what the agents need beside it"""
    s = STORY[which]
    b = s["batch"]
    planned = phase not in ("at-risk", "verified", "valued")
    return {
        "seq": 1,
        "ref": b["id"],
        "batch": {**b, "assess": STORY["hero"]["assess"], "phase": phase},
        "sku": s["sku"],
        "distributor": dist(b["distributor"]),
        "journey": {
            "id": b["id"],
            "phase": phase,
            "photo": {"status": photo, "at": None, "confidence": None, "url": None, "read": None},
            "listing": listing,
            "offer": offer,
            "chat": chat or [],
            "award": award,
            "orders": [],
            "bids": [],
        },
        "plan": copy.deepcopy(s["plan"]) if planned else None,
        "donation": donation,
        "docs": [],
        "photoObject": PHOTO if photo in ("reading", "verified", "requested") else None,
        "photosBucket": "photos-test",
        "docsBucket": "docs-test",
        "valuation": None,
        "language": "hi",
        "listingApi": {"request": {"reserve": RESERVE, "price": 15, "units": 772}} if listing else None,
        "docsFull": docs,
    }


def valuation_preview() -> dict[str, Any]:
    h = STORY["hero"]
    return {"daysLeft": 47, "units": 1360, "sku": h["sku"], "rows": h["plan"]["rows"], "city": "Nagpur"}


def plan_preview() -> dict[str, Any]:
    return {"plan": STORY["hero"]["plan"], "offered": 38, "windowDays": 14, "city": "Nagpur"}


def internal_batches() -> dict[str, Any]:
    skus = STORY["skus"]
    return {
        "client": "munchly",
        "day": "2026-10-02",
        "distributors": {
            d: {"permission": d != "rakesh", "paused": False, "name": STORY["distributors"][d]["name"]}
            for d in STORY["distributors"]
        },
        "skus": {k: {"code": v["code"], "name": v["name"]} for k, v in skus.items()},
        "batches": [{**b, "skuCode": skus[b["sku"]]["code"]} for b in STORY["batches"]],
    }


class FakeBackend:
    """backend-api's /internal routes in memory: each route's answer (a body, a (status, body) pair, or a function of
    the request's body), and every request the agents sent"""

    def __init__(self):
        self.calls: list[tuple[str, str, Any]] = []
        self.headers: list[dict[str, str]] = []
        self.routes: dict[tuple[str, str], Any] = {
            ("GET", f"{C}/agents"): agents_settings(),
            ("GET", f"{C}/batches"): internal_batches(),
            ("GET", CASE): case(),
            ("GET", f"{CASE}/valuation-preview"): valuation_preview(),
            ("GET", f"{CASE}/plan-preview"): plan_preview(),
            ("POST", f"{CASE}/photo-read"): {"ok": True, "result": True},
        }

    def __setitem__(self, key: tuple[str, str], value: Any) -> None:
        self.routes[key] = value

    def handler(self, request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content) if request.content else None
        self.calls.append((request.method, request.url.path, body))
        self.headers.append(dict(request.headers))
        answer = self.routes.get((request.method, request.url.path))
        if answer is None:
            answer = {"ok": True} if request.method in ("POST", "PATCH") else (404, {"message": "Not found."})
        if callable(answer):
            answer = answer(body)
        if isinstance(answer, list) and answer and isinstance(answer[0], tuple):
            answer = answer.pop(0)  # a sequence of answers, one a call
        status, payload = answer if isinstance(answer, tuple) else (200, answer)
        return httpx.Response(status, json=payload)

    def reports(self) -> list[tuple[str, str, Any]]:
        """what the agents wrote: every POST and PATCH, in order"""
        return [(m, p.removeprefix(C), b) for m, p, b in self.calls if m in ("POST", "PATCH")]

    def report(self, tail: str) -> Any:
        hits = [b for m, p, b in self.calls if m in ("POST", "PATCH") and p.endswith(tail)]
        assert hits, f"no report to …{tail}: {[p for _, p, _ in self.calls]}"
        return hits[-1]


# --- BigQuery and Cloud Storage ----------------------------------------------------------------------------------------


class FakeWarehouse:
    def __init__(self):
        self.tables: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self.ids: set[str] = set()
        self.fail: set[str] = set()  # tables whose writes fail

    async def loaded(self, table: str, source_file: str) -> bool:
        return any(r.get("source_file") == source_file for r in self.tables[table])

    async def load(self, table: str, rows: list[dict[str, Any]]) -> int:
        if table in self.fail:
            raise RuntimeError(f"{table} is unavailable")
        self.tables[table].extend(copy.deepcopy(rows))
        return len(rows)

    async def insert(self, table: str, rows: list[dict[str, Any]], row_ids: list[str] | None = None) -> None:
        if table in self.fail:
            raise RuntimeError(f"{table} is unavailable")
        for i, r in enumerate(rows):
            rid = f"{table}:{row_ids[i]}" if row_ids else None
            if rid and rid in self.ids:
                continue
            if rid:
                self.ids.add(rid)
            self.tables[table].append(copy.deepcopy(r))

    async def price_history(self, client: str, sku: str, *, days: int = 90) -> list[dict[str, Any]]:
        rows = [r for r in self.tables["channel_prices"] if r["client_id"] == client and r["sku_id"] == sku]
        out = []
        for ch in sorted({r["channel"] for r in rows}):
            rs = sorted((r for r in rows if r["channel"] == ch), key=lambda r: r["priced_on"])
            out.append(
                {
                    "channel": ch,
                    "n": len(rs),
                    "avgPrice": round(sum(r["price_per_unit"] for r in rs) / len(rs), 2),
                    "avgPctOfMrp": None,
                    "lastOn": rs[-1]["priced_on"],
                    "lastPrice": rs[-1]["price_per_unit"],
                }
            )
        return out

    async def sales_means(
        self, client: str, *, window: int = 28, until: str | None = None
    ) -> dict[tuple[str, str], float]:
        latest: dict[tuple, dict] = {}
        for r in self.tables["secondary_sales"]:
            if r["client_id"] == client and (until is None or r["sale_date"] <= until):
                latest[(r["distributor_id"], r["pincode"], r["sku_id"], r["sale_date"])] = r
        if not latest:
            return {}
        days = [date.fromisoformat(k[3]) for k in latest]
        last, first = max(days), min(days)
        start = max(first, last - timedelta(days=window - 1))
        span = (last - start).days + 1
        sums: dict[tuple[str, str], int] = defaultdict(int)
        for (d, _, s, day), r in latest.items():
            if date.fromisoformat(day) > last - timedelta(days=window):
                sums[(d, s)] += r["units"]
        return {k: v / span for k, v in sums.items()}

    async def sales_days(self, client: str) -> int:
        return len({r["sale_date"] for r in self.tables["secondary_sales"] if r["client_id"] == client})

    async def files_loaded(self, client: str) -> set[str]:
        return {
            r["source_file"]
            for t in ("stock_snapshots", "secondary_sales")
            for r in self.tables[t]
            if r["client_id"] == client and r.get("source_file")
        }


class FakeStore:
    def __init__(self):
        self.objects: dict[tuple[str, str], bytes] = {}

    async def read(self, bucket: str, name: str) -> bytes:
        if (bucket, name) not in self.objects:
            raise FileNotFoundError(f"gs://{bucket}/{name}")
        return self.objects[(bucket, name)]

    async def write(self, bucket: str, name: str, data: bytes, content_type: str) -> None:
        self.objects[(bucket, name)] = data

    async def list(self, bucket: str, prefix: str) -> list[str]:
        return sorted(n for b, n in self.objects if b == bucket and n.startswith(prefix))


JPEG = b"\xff\xd8\xff\xe0" + b"label photo" * 20


def fake_pdf(page: str) -> bytes:
    return b"%PDF-1.7 fake\n" + page.encode()


# --- the fixtures -----------------------------------------------------------------------------------------------------


@pytest.fixture
def settings() -> Settings:
    return Settings(
        _env_file=None,
        agents_env="test",
        google_cloud_project="test-project",
        api_base="http://backend.test",
        model_tier="stub",
        photos_bucket="photos-test",
        docs_bucket="docs-test",
        exports_bucket="exports-test",
        bq_dataset="smartclearance_test",
    )


@pytest.fixture
def backend() -> FakeBackend:
    return FakeBackend()


@pytest.fixture
def warehouse() -> FakeWarehouse:
    return FakeWarehouse()


@pytest.fixture
def store() -> FakeStore:
    s = FakeStore()
    s.objects[("photos-test", PHOTO)] = JPEG
    return s


@pytest.fixture
def recordings() -> Recordings:
    return Recordings(copy.deepcopy(Recordings.load().data))


@pytest.fixture
def deps(settings, backend, warehouse, store, recordings) -> Deps:
    return Deps(
        settings=settings,
        backend=Backend(
            settings.api_base, FixedToken(), transport=httpx.MockTransport(backend.handler), retries=3, backoff=0
        ),
        models=ModelTier(settings, recordings),
        warehouse=warehouse,
        store=store,
        render_pdf=fake_pdf,
        clock=lambda: datetime(2026, 10, 2, 4, 0, tzinfo=UTC),
    )


def message(topic: str, payload: dict[str, Any], *, event_id: str = "ev_1", attempt: int = 1, traceparent=None):
    return Message(
        topic=topic,
        payload={"client": "munchly", **payload, "eventId": event_id},
        event_id=event_id,
        traceparent=traceparent,
        attempt=attempt,
        message_id=f"m-{event_id}",
    )


@pytest.fixture
def run(deps):
    """handles a message as the service does: (outcome, the run's context)"""

    async def go(msg: Message) -> tuple[str, RunCtx]:
        out: list[RunCtx] = []
        outcome = await handle(msg, deps, rc_out=out)
        return outcome, out[0]

    return go
