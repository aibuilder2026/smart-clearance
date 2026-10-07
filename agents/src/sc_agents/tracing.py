"""Tracing, as backend-api's tracing.py (SC-57): one trace ties a run's spans, its log lines, its reports and its
agent_runs row together.

- A Pub/Sub message carries the trace backend-api published it in, as its `traceparent` attribute; each run
  continues it (`continue_from`), so a batch's journey reads as one thread from the person's tap to the agent's report.
- Spans: the run, ADK's own (the agents and each model call: ADK traces through the global tracer provider), every
  HTTP call to backend-api (httpx, which also sends the trace on), and the Google clients' calls (requests: BigQuery
  jobs, Cloud Storage, Vertex AI's token refreshes). BigQuery's client adds its own job spans.
- Sampling: a message whose trace was sampled is always traced; of the rest, TRACE_SAMPLE_RATE.
- TRACE_EXPORT=otlp sends the sampled spans to Cloud Trace through the Telemetry API's OTLP endpoint, as the
  service's own account (roles/telemetry.tracesWriter, infra/prod agents.tf). Otherwise spans are made, never sent.
- Each run's trace id goes in its reports (`run.traceId`) and its agent_runs row; log lines carry it (logs.py).
"""

import os
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass

from opentelemetry import trace
from opentelemetry.context import Context
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.trace.sampling import ParentBased, Sampler, TraceIdRatioBased
from opentelemetry.trace import SpanKind, format_span_id, format_trace_id
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

from sc_agents.settings import Settings

TELEMETRY_ENDPOINT = "telemetry.googleapis.com:443"
UNTRACED = "/healthz,/readyz"

tracer = trace.get_tracer("sc_agents")
_provider: TracerProvider | None = None
_propagator = TraceContextTextMapPropagator()


@dataclass(frozen=True)
class Trace:
    trace_id: str  # 32 hex digits
    span_id: str  # 16 hex digits
    sampled: bool

    @property
    def traceparent(self) -> str:
        return f"00-{self.trace_id}-{self.span_id}-{'01' if self.sampled else '00'}"


def current() -> Trace | None:
    here = trace.get_current_span().get_span_context()
    if not here.is_valid:
        return None
    return Trace(format_trace_id(here.trace_id), format_span_id(here.span_id), here.trace_flags.sampled)


def sampler(rate: float) -> Sampler:
    share = TraceIdRatioBased(rate)
    return ParentBased(root=share, remote_parent_not_sampled=share)


def _exporter():
    """OTLP over gRPC to the Telemetry API, signed with the service's credentials (sc-agents, or sc-agents-local)"""
    import grpc
    from google.auth.transport.grpc import AuthMetadataPlugin
    from google.auth.transport.requests import Request
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

    from sc_agents.gcp import credentials

    signed = grpc.composite_channel_credentials(
        grpc.ssl_channel_credentials(),
        grpc.metadata_call_credentials(AuthMetadataPlugin(credentials=credentials(), request=Request())),
    )
    return OTLPSpanExporter(endpoint=TELEMETRY_ENDPOINT, credentials=signed)


def setup(settings: Settings) -> TracerProvider:
    """the process's tracer provider: ADK, httpx and the Google clients all trace through it"""
    global _provider
    if _provider is None:
        resource = Resource.create(
            {
                "service.name": os.environ.get("K_SERVICE", "agents"),
                "service.version": os.environ.get("K_REVISION", "local"),
                "deployment.environment.name": settings.agents_env,
                "gcp.project_id": settings.google_cloud_project,
            }
        )
        provider = TracerProvider(resource=resource, sampler=sampler(settings.trace_sample_rate))
        if settings.trace_export == "otlp":
            provider.add_span_processor(BatchSpanProcessor(_exporter()))
        trace.set_tracer_provider(provider)
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
        from opentelemetry.instrumentation.requests import RequestsInstrumentor

        HTTPXClientInstrumentor().instrument(tracer_provider=provider)
        RequestsInstrumentor().instrument(tracer_provider=provider)
        _provider = provider
    return _provider


def parent_of(traceparent: str | None) -> Context | None:
    """the context a message was published in, from its traceparent attribute"""
    if not traceparent:
        return None
    return _propagator.extract({"traceparent": traceparent})


@contextmanager
def continue_from(traceparent: str | None, name: str, **attributes) -> Iterator[trace.Span]:
    """a consumer span for one message, under the trace it was published in (or a new trace)"""
    with tracer.start_as_current_span(
        name, context=parent_of(traceparent), kind=SpanKind.CONSUMER, attributes=attributes
    ) as span:
        yield span


def inject(headers: dict[str, str]) -> dict[str, str]:
    """the current trace as a traceparent header, for backend-api"""
    _propagator.inject(headers)
    return headers


def flush() -> None:
    if _provider is not None:
        _provider.force_flush()
