"""Request tracing (SC-57): one trace ties a request's spans, its log lines and its audit rows together.

- Cloud Run hands every request in with a W3C traceparent: its own trace, or the one the browser started (frontend/api's
  transport sends one with every call), which it keeps. The API's spans continue that trace.
- The spans: FastAPI's server span for each route (the health checks left out), one for each SQL statement, one for
  each sign-in check, with the HTTP calls Firebase makes under it.
- Sampling: a request Cloud Run sampled (at most one every ten seconds an instance) is always traced, so the API's
  spans join Cloud Run's own; of the rest, TRACE_SAMPLE_RATE, chosen by trace id. Unsampled requests still have their
  trace id, so their log lines and audit rows are tied together all the same.
- TRACE_EXPORT=otlp (Cloud Run, infra/prod/run.tf) sends the sampled spans to Cloud Trace through the Telemetry API's
  OTLP endpoint, as the service's own account (roles/telemetry.tracesWriter). Otherwise spans are made, never sent.
- The log lines (logs.py) and audit rows (services/audit.py) read the request's trace with current().
"""

import os
from dataclasses import dataclass

from fastapi import FastAPI
from opentelemetry import metrics, trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.sqlalchemy.engine import EngineTracer
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.trace.sampling import ParentBased, Sampler, TraceIdRatioBased
from opentelemetry.trace import format_span_id, format_trace_id
from sqlalchemy.ext.asyncio import AsyncEngine

from sc_api.settings import Settings

TELEMETRY_ENDPOINT = "telemetry.googleapis.com:443"
UNTRACED = "/healthz,/readyz"  # Cloud Run's probes and the uptime check

tracer = trace.get_tracer("sc_api")
_provider: TracerProvider | None = None


@dataclass(frozen=True)
class Trace:
    trace_id: str  # 32 hex digits
    span_id: str  # 16 hex digits
    sampled: bool


def current() -> Trace | None:
    """the trace and span the code is running in, if any: every request has one"""
    here = trace.get_current_span().get_span_context()
    if not here.is_valid:
        return None
    return Trace(format_trace_id(here.trace_id), format_span_id(here.span_id), here.trace_flags.sampled)


def sampler(rate: float) -> Sampler:
    """a parent's yes is kept (Cloud Run's sampled requests); a request nobody sampled yet is traced at `rate`"""
    share = TraceIdRatioBased(rate)
    return ParentBased(root=share, remote_parent_not_sampled=share)


def _exporter():
    """OTLP over gRPC to the Telemetry API, signed with the service's credentials (sc-api, or sc-api-local)"""
    import grpc
    from google.auth.transport.grpc import AuthMetadataPlugin
    from google.auth.transport.requests import Request
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

    from sc_api.gcp import credentials

    signed = grpc.composite_channel_credentials(
        grpc.ssl_channel_credentials(),
        grpc.metadata_call_credentials(AuthMetadataPlugin(credentials=credentials(), request=Request())),
    )
    return OTLPSpanExporter(endpoint=TELEMETRY_ENDPOINT, credentials=signed)


def setup(settings: Settings) -> TracerProvider:
    """the process's tracer provider, made by the first app built in it (the test suite builds many)"""
    global _provider
    if _provider is None:
        resource = Resource.create(
            {
                "service.name": os.environ.get("K_SERVICE", "backend-api"),
                "service.version": os.environ.get("K_REVISION", "local"),
                "deployment.environment.name": settings.sc_env,
                "gcp.project_id": settings.google_cloud_project,
            }
        )
        provider = TracerProvider(resource=resource, sampler=sampler(settings.trace_sample_rate))
        if settings.trace_export == "otlp":
            provider.add_span_processor(BatchSpanProcessor(_exporter()))
        trace.set_tracer_provider(provider)
        # Firebase's Admin SDK and google-auth make their HTTP calls with requests
        RequestsInstrumentor().instrument(tracer_provider=provider)
        _provider = provider
    return _provider


def instrument_app(app: FastAPI, provider: TracerProvider) -> None:
    FastAPIInstrumentor.instrument_app(
        app, tracer_provider=provider, excluded_urls=UNTRACED, exclude_spans=["receive", "send"]
    )


def instrument_engine(engine: AsyncEngine) -> None:
    """a span for each SQL statement the engine runs. SQLAlchemyInstrumentor instruments one engine a process, so each
    engine gets its own EngineTracer instead; its connection-pool counter goes to a meter nobody reads."""
    pool = metrics.get_meter("sc_api").create_up_down_counter("db.client.connections.usage")
    EngineTracer(tracer, engine.sync_engine, pool)


def flush() -> None:
    """send what is waiting before the process stops. Cloud Run gives an instance CPU only while it serves (cpu_idle),
    so a batch may wait for the next request; its SIGTERM ends the app's lifespan, which sends the rest."""
    if _provider is not None:
        _provider.force_flush()
