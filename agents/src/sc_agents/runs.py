"""One message's work: the services it uses (Deps), and each agent's run in it (AgentRun), which goes into the
agent's report to backend-api (`run`) and into BigQuery's agent_runs."""

import secrets
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sc_agents.events import Message
from sc_agents.settings import Settings

if TYPE_CHECKING:
    from sc_agents.backend import Backend
    from sc_agents.models import ModelTier
    from sc_agents.tools.bigquery import Warehouse
    from sc_agents.tools.storage import Store


def now() -> datetime:
    return datetime.now(UTC)


@dataclass
class Deps:
    """what a run reaches: backend-api, the models, BigQuery, Cloud Storage and the PDF renderer"""

    settings: Settings
    backend: "Backend"
    models: "ModelTier"
    warehouse: "Warehouse"
    store: "Store"
    render_pdf: Callable[[str], bytes]
    clock: Callable[[], datetime] = now


@dataclass
class AgentRun:
    """an agent's run on one event: what its report says it was, and its agent_runs row"""

    agent: str  # the catalog's id (data, watcher, vision, valuer, router, lister, outreach, negotiator, …)
    step: str  # the event key's suffix: the agent's id, or the step's own (Donation reports as outreach)
    run_id: str
    started_at: datetime
    batch_ref: str | None = None
    ended_at: datetime | None = None
    status: str = "done"  # done, noop, failed or fallback
    model: str | None = None
    fallback: bool | None = None
    calls: int = 0
    tokens_in: int = 0
    tokens_out: int = 0
    latency_ms: int = 0
    note: str = ""

    def fell_back(self, why: str = "") -> None:
        self.fallback = True
        if why and why not in self.note:
            self.note = f"{self.note}; {why}" if self.note else why

    @property
    def final_status(self) -> str:
        if self.status in ("noop", "failed"):
            return self.status
        return "fallback" if self.fallback else "done"


@dataclass
class RunCtx:
    """one message's work: its event, its services, and each agent's run in it"""

    msg: Message
    deps: Deps
    trace_id: str | None = None
    runs: dict[str, AgentRun] = field(default_factory=dict)
    model_calls: int = 0
    # every model request as sent (its system text and parts), for the tests and the eval's trajectory check
    requests: list[dict[str, Any]] = field(default_factory=list)
    # what the run did, in order: each model call and each report, for the trajectory check
    trajectory: list[str] = field(default_factory=list)
    # what a step hands a writer that is not state (a label photo's bytes)
    blobs: dict[str, Any] = field(default_factory=dict)

    @property
    def settings(self) -> Settings:
        return self.deps.settings

    def run(self, agent: str, step: str | None = None) -> AgentRun:
        step = step or agent
        if step not in self.runs:
            self.runs[step] = AgentRun(
                agent=agent,
                step=step,
                run_id=f"run_{secrets.token_hex(6)}",
                started_at=self.deps.clock(),
                batch_ref=self.msg.ref,
            )
        return self.runs[step]

    def body(self, step: str) -> dict[str, Any]:
        """the `run` a report carries: backend-api acts once per eventKey"""
        r = self.runs[step]
        out: dict[str, Any] = {"agent": r.agent, "eventKey": self.msg.key(r.step), "runId": r.run_id}
        if self.trace_id:
            out["traceId"] = self.trace_id
        if r.model is not None:
            out["model"] = r.model
            out["fallback"] = bool(r.fallback)
            out["latencyMs"] = r.latency_ms
        elif r.fallback:
            out["fallback"] = True
        return out

    async def report(self, step: str, path: str, body: dict[str, Any], *, method: str = "POST") -> dict[str, Any]:
        """an agent's report: its result and its run; a redelivered event's answer is {"noop": true}"""
        self.trajectory.append(f"{method} {path.split('/cases/', 1)[-1] if '/cases/' in path else path}")
        payload = {**body, "run": self.body(step)}
        backend = self.deps.backend
        out = await (backend.post(path, payload) if method == "POST" else backend.patch(path, payload))
        r = self.runs[step]
        if out.get("noop"):
            r.status = "noop"
        r.ended_at = self.deps.clock()
        return out
