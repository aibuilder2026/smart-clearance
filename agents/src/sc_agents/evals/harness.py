"""One eval case through one writer: the same LlmAgent, prompt, schema, callbacks and checks the pipeline uses, given
the case's facts as the pipeline's earlier steps would have put them in the run's state, run alone with ADK's Runner.
"""

import copy
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from google.adk.agents import SequentialAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from sc_agents.agents import data, lister, negotiator, outreach, router, valuer, vision
from sc_agents.agents.common import cut_case
from sc_agents.events import Message
from sc_agents.runs import Deps, RunCtx

EVALS = Path(__file__).resolve().parents[3] / "evals"


@dataclass(frozen=True)
class Spec:
    """an eval set: the pipeline that holds its writer, the writer's name and output, and the agent it reports as"""

    set: str
    agent: str
    pipeline: Any
    writer: str
    output: str
    prompt: str
    tier: str


SPECS = {
    "vision": Spec("vision", "vision", vision.read, "vision_read", "vision_read", "vision", "flash"),
    "data": Spec("data", "data", data.connect, "data_map", "data_map", "data_map", "flash"),
    "valuer": Spec("valuer", "valuer", valuer.value, "valuer_write", "valuer_notes", "valuer", "pro"),
    "router": Spec("router", "router", router.route, "router_write", "router_text", "router", "pro"),
    "lister": Spec("lister", "lister", lister.lister, "lister_write", "lister_words", "lister", "flash"),
    "outreach": Spec("outreach", "outreach", outreach.offer, "outreach_write", "outreach_words", "outreach", "flash"),
    "negotiator_bid": Spec(
        "negotiator", "negotiator", negotiator.bid, "negotiator_bid", "bid_reply", "negotiator_bid", "pro"
    ),
    "negotiator_chat": Spec(
        "negotiator", "negotiator", negotiator.question, "negotiator_chat", "chat_reply", "negotiator_chat", "flash"
    ),
}


def load(name: str) -> list[dict[str, Any]]:
    return [json.loads(x) for x in (EVALS / name / "cases.jsonl").read_text(encoding="utf-8").splitlines() if x.strip()]


def spec_of(set_name: str, case: dict[str, Any]) -> Spec:
    if set_name == "negotiator":
        return SPECS["negotiator_bid" if case["type"] == "bid" else "negotiator_chat"]
    return SPECS[set_name]


def lot_case(c: dict[str, Any]) -> dict[str, Any]:
    """a lot as the agents' cut case holds it"""
    return cut_case(
        {
            "ref": c.get("ref", "MF-2409-117"),
            "sku": c["sku"],
            "distributor": c["distributor"],
            "batch": c["batch"],
            "journey": {"listing": c.get("listing"), "chat": c.get("chat") or []},
        }
    )


def prepare(set_name: str, case: dict[str, Any], rc: RunCtx) -> dict[str, Any]:
    """the run's state the writer reads, as the pipeline's earlier steps make it"""
    if set_name == "vision":
        data_ = (EVALS / "vision" / case["image"]).read_bytes()
        rc.blobs["photo"] = (data_, vision.mime_of(data_))
        return {"photo": case["id"]}
    if set_name == "data":
        return {"data_unknown": [{"file": case["file"], "header": case["header"], "sample": case["sample"]}]}
    if set_name == "valuer":
        return {"valuer_facts": valuer.facts(case["preview"], case["history"])}
    if set_name == "router":
        return {"router_facts": router.facts(case["preview"])}
    if set_name == "lister":
        return {"lister_facts": lister.facts(lot_case(case["case"]), case["line"])}
    if set_name == "outreach":
        return {"outreach_facts": outreach.facts(lot_case(case["case"]), case["settings"])}
    if set_name == "negotiator":
        lot = lot_case({**case["lot"], "chat": case.get("chat")})
        if case["type"] == "bid":
            return negotiator.bid_state(case["preview"], negotiator.lot_of(lot))
        return negotiator.chat_state(lot, lot["chat"], case["at"])
    raise ValueError(set_name)


async def run_case(set_name: str, case: dict[str, Any], deps: Deps) -> tuple[dict[str, Any], RunCtx, dict[str, Any]]:
    """the writer's output for a case (empty when it fell back), the run, and the state it was given"""
    spec = spec_of(set_name, case)
    msg = Message(topic="eval", payload={"client": "eval", "ref": case["id"]}, event_id=f"eval:{case['id']}")
    rc = RunCtx(msg=msg, deps=deps)
    state = prepare(set_name, case, rc)
    w = next(a for a in spec.pipeline(rc) if a.name == spec.writer)
    w.when = None  # the pipeline's guard reads the case; here the writer always runs
    w.scope = ""
    root = SequentialAgent(name=f"eval_{spec.writer}", sub_agents=[w])
    sessions = InMemorySessionService()
    runner = Runner(app_name="sc_agents_eval", agent=root, session_service=sessions)
    session = await sessions.create_session(app_name="sc_agents_eval", user_id="eval", state=copy.deepcopy(state))
    start = types.Content(role="user", parts=[types.Part(text="eval")])
    async for _ in runner.run_async(user_id="eval", session_id=session.id, new_message=start):
        pass
    session = await sessions.get_session(app_name="sc_agents_eval", user_id="eval", session_id=session.id)
    assert session is not None
    return dict(session.state.get(spec.output) or {}), rc, state
