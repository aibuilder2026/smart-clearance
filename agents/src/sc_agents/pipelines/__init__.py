"""Which ADK pipeline answers which event (SC-72). Each message runs one pipeline for one batch (or one client's daily
job), built for that message and run once: a `SequentialAgent` where a step needs the last one's result, a
`ParallelAgent` where it does not. Every pipeline starts by reading the client's agent settings (an agent switched off
in the console does nothing; the journey waits, and backend-api's tick sends the event again later).

| Event | Pipeline |
| --- | --- |
| `batch.at_risk` | Vision asks for the label photo |
| `journey.step decide` | Vision reads the photo → the Valuer → the Router |
| `journey.step value` | the Valuer → the Router |
| `journey.step route` | the Router |
| `journey.step execute` | the Lister ‖ Outreach's offer ‖ Donation |
| `offer.received {bid}` | the Negotiator answers the bid |
| `offer.received {message}` | the Negotiator answers the question |
| `deal.closed` | the awarded price into BigQuery's channel_prices |
| `journey.step settle` | Paperwork |
| `journey.step receipt` | Paperwork lays out the food bank's receipt (SC-110) |
| `journey.step destruction` | Vision checks the evidence of packs destroyed at the godown (SC-139) |
| `journey.step timer report.due` | Impact |
| `journey.step agent.due data`, `export.uploaded` | the Data agent |
| `journey.step agent.due watcher` | the Watcher |
| `journey.step agent.run_now` | the Data agent's or the Watcher's daily job (others: nothing to run) |
| `journey.reset` | nothing: backend-api has done it |
"""

import logging
from typing import Any

from google.adk.agents import BaseAgent, ParallelAgent, SequentialAgent

from sc_agents.agents import data, donation, impact, lister, negotiator, outreach, paperwork, router, valuer, vision
from sc_agents.agents import watcher as watcher_agent
from sc_agents.agents.common import load_case, load_settings
from sc_agents.agents.deal import deal
from sc_agents.runs import RunCtx

log = logging.getLogger("sc_agents.pipelines")


def _seq(name: str, *parts: Any) -> SequentialAgent:
    agents: list[BaseAgent] = []
    for p in parts:
        agents.extend(p if isinstance(p, list) else [p])
    return SequentialAgent(name=name, sub_agents=agents)


def build(rc: RunCtx) -> BaseAgent | None:
    """the pipeline for a message, or None when there is nothing for the agents to do"""
    m = rc.msg
    settings = load_settings(rc)
    if m.topic == "batch.at_risk":
        return _seq("at_risk", settings, vision.ask(rc))
    if m.topic == "offer.received":
        if m.payload.get("bid"):
            return _seq("bid", settings, negotiator.bid(rc))
        if m.payload.get("message") is not None:
            return _seq("question", settings, negotiator.question(rc))
        return None
    if m.topic == "deal.closed":
        return _seq("deal_closed", deal(rc))
    kind = m.type
    if kind == "decide":
        return _seq("decide", settings, load_case(rc), vision.read(rc), valuer.value(rc), router.route(rc))
    if kind == "value":
        return _seq("value", settings, load_case(rc), valuer.value(rc), router.route(rc))
    if kind == "route":
        return _seq("route", settings, load_case(rc), router.route(rc))
    if kind == "execute":
        branches = ParallelAgent(
            name="execute_branches",
            sub_agents=[
                _seq("lister_branch", lister.lister(rc)),
                _seq("outreach_branch", outreach.offer(rc)),
                _seq("donation_branch", donation.donation(rc)),
            ],
        )
        return _seq("execute", settings, load_case(rc), branches)
    if kind == "settle":
        return _seq("settle", settings, paperwork.settle(rc))
    if kind == "receipt":
        return _seq("receipt", settings, paperwork.receipt(rc))
    if kind == "destruction":
        return _seq("destruction", settings, load_case(rc), vision.destruction(rc))
    if kind == "timer":
        timer = m.payload.get("kind")
        if timer == "report.due":
            return _seq("report", settings, impact.report(rc))
        return None
    if kind == "export.uploaded":
        return _seq("connect", settings, data.connect(rc))
    if kind in ("agent.due", "agent.run_now"):
        agent = m.payload.get("agent")
        if agent == "data":
            return _seq("connect", settings, data.connect(rc))
        if agent == "watcher":
            return _seq("detect", settings, watcher_agent.detect(rc))
        log.info("%s for %s: no daily job to run", kind, agent)
        return None
    if kind == "journey.reset":
        return None
    log.warning("an event the agents do not know: %s %s", m.topic, kind)
    return None
