"""One message, one run (SC-72): the message's pipeline, run to the end with ADK's Runner on a fresh in-memory session
(scratch for this run alone: backend-api is the system of record), under the trace the message was published in.

The outcome tells Pub/Sub what to do: done or noop (acknowledge), failed (acknowledge: trying again cannot help), or a
`Transient` error (redeliver; after five attempts the message goes to the dead letter). Each agent's run goes into
BigQuery's agent_runs; that log's failures only log.
"""

import json
import logging
from typing import Any, Literal

from google.adk.agents.run_config import RunConfig
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from sc_agents import tracing
from sc_agents.errors import Permanent, Stale, Transient
from sc_agents.events import Message
from sc_agents.pipelines import build
from sc_agents.runs import Deps, RunCtx

log = logging.getLogger("sc_agents.dispatch")
APP = "sc_agents"
Outcome = Literal["done", "noop", "failed"]


async def run_pipeline(rc: RunCtx, pipeline: Any) -> None:
    sessions = InMemorySessionService()
    runner = Runner(app_name=APP, agent=pipeline, session_service=sessions)
    m = rc.msg
    session = await sessions.create_session(
        app_name=APP, user_id=m.client, state={"client": m.client, "ref": m.ref, "event": m.type}
    )
    start = types.Content(role="user", parts=[types.Part(text=json.dumps({"event": m.type, **m.payload}))])
    config = RunConfig(max_llm_calls=rc.settings.model_calls_per_run)
    async for _ in runner.run_async(user_id=m.client, session_id=session.id, new_message=start, run_config=config):
        pass


async def handle(msg: Message, deps: Deps, *, rc_out: list[RunCtx] | None = None) -> Outcome:
    """runs a message's pipeline; raises Transient when Pub/Sub should deliver it again"""
    with tracing.continue_from(
        msg.traceparent,
        f"agents {msg.type}",
        **{"sc.client": msg.client, "sc.ref": msg.ref or "", "sc.event_id": msg.event_id, "sc.attempt": msg.attempt},
    ):
        here = tracing.current()
        rc = RunCtx(msg=msg, deps=deps, trace_id=here.trace_id if here else None)
        if rc_out is not None:
            rc_out.append(rc)
        pipeline = build(rc)
        if pipeline is None:
            log.info("%s %s: nothing for the agents to do", msg.topic, msg.type)
            return "noop"
        outcome: Outcome = "done"
        try:
            await run_pipeline(rc, pipeline)
        except Stale as e:
            log.info("%s for %s: the journey has moved on (%s)", msg.type, msg.ref, e)
            outcome = "noop"
        except Permanent as e:
            log.error("%s for %s failed, and trying again cannot help: %s", msg.type, msg.ref, e)
            _fail(rc, str(e))
            outcome = "failed"
        except Transient as e:
            log.warning("%s for %s: %s (attempt %s)", msg.type, msg.ref, e, msg.attempt)
            _fail(rc, str(e))
            raise
        except Exception as e:  # a bug, or a service down in an unexpected way: worth another delivery
            log.exception("%s for %s failed (attempt %s)", msg.type, msg.ref, msg.attempt)
            _fail(rc, f"{type(e).__name__}: {e}")
            raise Transient(str(e)) from e
        finally:
            await record(rc)
        if outcome == "done" and all(r.status == "noop" for r in rc.runs.values()):
            outcome = "noop"  # no agent acted: a redelivery, a journey that moved on, or an agent switched off
        return outcome


def _fail(rc: RunCtx, why: str) -> None:
    for r in rc.runs.values():
        if r.status != "noop":
            r.status = "failed"
            r.note = (r.note + "; " if r.note else "") + why[:200]


def bq_agent(agent: str, step: str) -> str:
    """agent_runs names Donation as itself (backend-api's catalog does not)"""
    return "donation" if step == "donation" else agent


async def record(rc: RunCtx) -> None:
    """each agent's run into BigQuery's agent_runs, and a log line; failures here only log"""
    now = rc.deps.clock()
    rows, ids = [], []
    for r in rc.runs.values():
        ended = r.ended_at or now
        rows.append(
            {
                "run_id": r.run_id,
                "client_id": rc.msg.client,
                "agent_id": bq_agent(r.agent, r.step),
                "batch_ref": r.batch_ref,
                "event_type": rc.msg.type,
                "event_id": rc.msg.event_id,
                "started_at": r.started_at.isoformat(),
                "ended_at": ended.isoformat(),
                "status": r.final_status,
                "model": r.model,
                "tokens_in": r.tokens_in or None,
                "tokens_out": r.tokens_out or None,
                "latency_ms": r.latency_ms or None,
                "fallback": r.fallback,
                "trace_id": rc.trace_id,
            }
        )
        ids.append(f"{r.run_id}:{r.final_status}")
        log.info(
            "run %s: %s on %s %s, %s%s",
            r.run_id,
            bq_agent(r.agent, r.step),
            rc.msg.type,
            rc.msg.ref or rc.msg.client,
            r.final_status,
            f" ({r.note})" if r.note else "",
        )
    if not rows or not rc.settings.run_log:
        return
    try:
        await rc.deps.warehouse.insert("agent_runs", rows, ids)
    except Exception as e:
        log.warning("agent_runs: %s run(s) not logged: %s", len(rows), e)
