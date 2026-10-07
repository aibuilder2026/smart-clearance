"""Donation (execute): books the plan's food-bank line with the first partner that takes it. No model: backend-api picks
the partner by its minimum days and units. Donation is not in the agent catalog, so its run reports as Outreach (its
event key keeps its own step, `<eventId>:donation`, so it never collides with Outreach's offer)."""

from typing import Any

from sc_agents.agents import step
from sc_agents.agents.common import line
from sc_agents.backend import case_path
from sc_agents.runs import RunCtx

AGENT, STEP = "outreach", "donation"


def due(state: dict[str, Any]) -> bool:
    case = state.get("case") or {}
    return (
        (state.get("settings") or {}).get("on", {}).get(AGENT, True)
        and case.get("phase") in ("approved", "executing")
        and line(state, "foodbank") is not None
        and not case.get("donation")
    )


async def _book(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    rc.run(AGENT, STEP)
    await rc.report(STEP, case_path(rc.msg.client, rc.msg.ref or "", "donation"), {})
    return {}


def donation(rc: RunCtx) -> list:
    return [step(rc, "donation_book", _book, agent=AGENT, key=STEP, scope=STEP, when=due)]
