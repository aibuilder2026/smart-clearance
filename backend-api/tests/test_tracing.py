"""SC-57: one trace ties a request's spans, its log lines and its audit rows together. The apps start each call's trace
(a W3C traceparent), Cloud Run keeps it, and the API continues it."""

import json
import logging
import secrets

import pytest
from httpx import ASGITransport, AsyncClient
from opentelemetry import trace
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from opentelemetry.sdk.trace.sampling import Decision
from opentelemetry.trace import NonRecordingSpan, SpanContext, SpanKind, TraceFlags, format_span_id, format_trace_id
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker

from sc_api import logs, tracing
from sc_api.main import create_app
from sc_api.services import audit
from tests.conftest import settings

C = "/v1/console/clients"


@pytest.fixture(scope="session")
def exporter() -> InMemorySpanExporter:
    spans = InMemorySpanExporter()
    tracing.setup(settings()).add_span_processor(SimpleSpanProcessor(spans))
    return spans


@pytest.fixture
def spans(exporter: InMemorySpanExporter) -> InMemorySpanExporter:
    exporter.clear()
    return exporter


def caller(sampled: bool = True) -> tuple[str, str, dict[str, str]]:
    """a trace the caller started: its trace id, its span id, and the header that carries them"""
    trace_id, span_id = secrets.token_hex(16), secrets.token_hex(8)
    return trace_id, span_id, {"traceparent": f"00-{trace_id}-{span_id}-{'01' if sampled else '00'}"}


async def test_a_request_continues_the_callers_trace(api, neha, spans):
    trace_id, span_id, header = caller()
    assert (await api.get(f"{C}/munchly", headers=neha | header)).status_code == 200
    done = spans.get_finished_spans()
    assert done and {format_trace_id(s.context.trace_id) for s in done} == {trace_id}
    server = next(s for s in done if s.kind == SpanKind.SERVER)
    assert server.name == "GET /v1/console/clients/{client_id}"
    assert format_span_id(server.parent.span_id) == span_id and server.parent.is_remote
    # the sign-in check and the SQL statements are spans of their own, under the route's
    names = [s.name for s in done]
    assert "verify ID token" in names
    sql = [s for s in done if s.attributes.get("db.system") == "postgresql"]
    assert sql and all(s.parent.span_id in {x.context.span_id for x in done} for s in sql)


async def test_the_health_checks_are_not_traced(api, spans):
    assert (await api.get("/healthz")).status_code == 200
    assert spans.get_finished_spans() == ()


async def test_an_audit_line_keeps_its_requests_trace(api, conn, neha):
    trace_id, _, header = caller()
    r = await api.patch(f"{C}/munchly/agents/outreach", json={"on": False}, headers=neha | header)
    assert r.status_code == 200
    row = (await conn.execute(text("SELECT text, details FROM sc.audit_log ORDER BY id DESC LIMIT 1"))).one()
    assert row.text == "Switched off the Outreach agent for Munchly Foods"
    assert row.details == {"agent": "outreach", "trace": trace_id}  # beside what the change itself records


async def test_an_audit_line_outside_a_request_has_no_trace(ctx, conn):
    await audit.record(ctx, None, "test", "A line from the hydrate CLI")
    details = (await conn.execute(text("SELECT details FROM sc.audit_log ORDER BY id DESC LIMIT 1"))).scalar_one()
    assert details == {}


async def test_a_log_line_carries_the_requests_trace(conn, engine, identity, clock, spans):
    """the crash handler's line, the one an operator most needs, is written inside the request's span"""
    app = create_app(settings(google_cloud_project="sc-test"), engine=engine, identity=identity, clock=clock)
    app.state.sessions = async_sessionmaker(bind=conn, expire_on_commit=False, join_transaction_mode="create_savepoint")

    @app.get("/v1/test/crash")
    async def crash():
        raise RuntimeError("no such godown")

    lines: list[dict] = []

    class Sink(logging.Handler):
        def emit(self, record):
            lines.append(json.loads(self.format(record)))

    sink = Sink()
    sink.setFormatter(logs.CloudJson("sc-test"))
    logging.getLogger("sc_api").addHandler(sink)
    trace_id, _, header = caller()
    try:
        transport = ASGITransport(app=app, raise_app_exceptions=False)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            assert (await client.get("/v1/test/crash", headers=header)).status_code == 500
    finally:
        logging.getLogger("sc_api").removeHandler(sink)
    line = next(x for x in lines if x["message"].startswith("unhandled error on GET /v1/test/crash"))
    assert line["logging.googleapis.com/trace"] == f"projects/sc-test/traces/{trace_id}"
    assert line["logging.googleapis.com/trace_sampled"] is True
    server = next(s for s in spans.get_finished_spans() if s.name == "GET /v1/test/crash")
    assert line["logging.googleapis.com/spanId"] == format_span_id(server.context.span_id)


def test_a_line_outside_any_trace_has_no_trace_fields():
    record = logging.LogRecord("sc_api.x", logging.INFO, "x.py", 1, "starting", (), None)
    line = json.loads(logs.CloudJson("sc-test").format(record))
    assert not any(k.startswith("logging.googleapis.com/trace") or k.endswith("spanId") for k in line)


def test_a_line_inside_a_span_has_its_trace():
    record = logging.LogRecord("sc_api.x", logging.INFO, "x.py", 1, "working", (), None)
    with trace.get_tracer("test").start_as_current_span("work") as span:
        line = json.loads(logs.CloudJson("sc-test").format(record))
        here = span.get_span_context()
    assert line["logging.googleapis.com/trace"] == f"projects/sc-test/traces/{format_trace_id(here.trace_id)}"
    assert line["logging.googleapis.com/spanId"] == format_span_id(here.span_id)


def _decide(rate: float, *, parent_sampled: bool | None, trace_id: int) -> Decision:
    parent = None
    if parent_sampled is not None:
        flags = TraceFlags(TraceFlags.SAMPLED if parent_sampled else TraceFlags.DEFAULT)
        remote = SpanContext(trace_id=trace_id, span_id=1, is_remote=True, trace_flags=flags)
        parent = trace.set_span_in_context(NonRecordingSpan(remote))
    return tracing.sampler(rate).should_sample(parent, trace_id, "GET /x").decision


def test_sampling_keeps_cloud_runs_yes_and_takes_a_share_of_the_rest():
    low, high = 1, (1 << 64) - 1  # TraceIdRatioBased compares the trace id's low 64 bits with the rate
    assert _decide(0.0, parent_sampled=True, trace_id=high) == Decision.RECORD_AND_SAMPLE
    assert _decide(0.25, parent_sampled=False, trace_id=low) == Decision.RECORD_AND_SAMPLE
    assert _decide(0.25, parent_sampled=False, trace_id=high) == Decision.DROP
    assert _decide(0.25, parent_sampled=None, trace_id=low) == Decision.RECORD_AND_SAMPLE
    assert _decide(0.25, parent_sampled=None, trace_id=high) == Decision.DROP


async def test_the_apps_may_send_a_traceparent(api):
    r = await api.options(
        "/v1/console/session",
        headers={
            "Origin": "http://localhost:5174",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,traceparent",
        },
    )
    assert r.status_code == 200 and "traceparent" in r.headers["access-control-allow-headers"].lower()
