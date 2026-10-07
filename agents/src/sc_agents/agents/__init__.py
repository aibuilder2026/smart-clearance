"""The agents, one module each. Each builds the ADK agents for its part of a pipeline: deterministic steps (`Step`, a
custom `BaseAgent`) that read backend-api, BigQuery and Cloud Storage and report, around the writers (models.py) that
call Gemini. backend-api computes every figure; an agent brings only what it read or wrote."""

import logging
from collections.abc import AsyncGenerator, Awaitable, Callable
from typing import Any

from google.adk.agents import BaseAgent
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event, EventActions

from sc_agents.errors import Stale
from sc_agents.models import halted
from sc_agents.runs import RunCtx

log = logging.getLogger("sc_agents.agents")

StepFn = Callable[[RunCtx, dict[str, Any]], Awaitable[dict[str, Any] | None]]


class Step(BaseAgent):
    """a deterministic step: reads or reports over plain HTTP (and BigQuery, Cloud Storage), no model. Its function
    returns what it adds to the run's state. backend-api's 404 or 409 (the journey moved on) ends the pipeline's part
    (its scope) quietly, with the agent's run a noop."""

    rc: Any
    fn: Any
    agent: str = ""
    step: str = ""
    scope: str = ""
    when: Any = None

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event]:
        state = dict(ctx.session.state)
        if halted(state, self.scope) or (self.when is not None and not self.when(state)):
            return
        try:
            delta = await self.fn(self.rc, state) or {}
        except Stale as e:
            log.info("%s: %s", self.name, e)
            if self.agent:
                self.rc.run(self.agent, self.step or self.agent).status = "noop"
            delta = {f"halt:{self.scope}" if self.scope else "halt": True}
        yield Event(author=self.name, invocation_id=ctx.invocation_id, actions=EventActions(state_delta=delta))


def step(rc: RunCtx, name: str, fn: StepFn, *, agent: str = "", key: str = "", scope: str = "", when=None) -> Step:
    return Step(name=name, rc=rc, fn=fn, agent=agent, step=key or agent, scope=scope, when=when)


def halt(scope: str = "") -> dict[str, Any]:
    return {f"halt:{scope}" if scope else "halt": True}
