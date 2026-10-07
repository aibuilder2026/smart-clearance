"""The Router (decide): the split across exits is backend-api's (money.py's allocate and plan); Gemini Pro explains it
in plain words for the approver, quoting only the plan's own figures.

`GET …/plan-preview` → the model writes `{explanation}` from the figures it may quote (the same list backend-api checks
the words against, `copy.check_numbers`) → `POST …/plan {explanation}`. Words that quote anything else are left out,
and backend-api's template explains the plan instead."""

import json
from typing import Any

from google.genai import types
from pydantic import BaseModel, Field

from sc_agents import checks, fmt
from sc_agents.agents import halt, step
from sc_agents.backend import case_path
from sc_agents.models import STRUCTURED, writer
from sc_agents.runs import RunCtx

AGENT = "router"
EXPLANATION_MAX = 600


class Explanation(BaseModel):
    # every field required: Gemini's structured output may leave out a property the schema does not require (SC-77)
    explanation: str = Field(description="why the plan splits the batch as it does, in two or three sentences")


def due(state: dict[str, Any]) -> bool:
    case = state.get("case") or {}
    return (state.get("settings") or {}).get("on", {}).get(AGENT, True) and case.get("phase") == "valued"


def quotable(preview: dict[str, Any]) -> list[tuple[str, float, str]]:
    """the figures the explanation may quote, as backend-api checks them: (what it is, value, as written)"""
    p = preview["plan"]
    out = [
        ("net recovered by the plan", p["net"], fmt.inr(p["net"])),
        ("swing against writing the batch off", p["swing"], fmt.inr(p["swing"])),
        ("units at risk", p["units"], fmt.num(p["units"])),
        ("P&L against the book cost", p["pnl"], fmt.inr(p["pnl"])),
        ("GST input credit kept", p["itcRetained"], fmt.inr(p["itcRetained"])),
        ("what writing the batch off would cost", p["writeOff"]["total"], fmt.inr(p["writeOff"]["total"])),
    ]
    for ln in p["lines"]:
        name = ln.get("short") or ln["id"]
        out += [
            (f"{name}: units", ln["units"], fmt.num(ln["units"])),
            (f"{name}: price a unit", ln["price"], fmt.price(ln["price"])),
            (f"{name}: net", ln["net"], fmt.inr(ln["net"])),
            (f"{name}: gross", ln["gross"], fmt.inr(ln["gross"])),
        ]
    for r in p["rows"]:
        if not any(x[0] == f"{r.get('short') or r['id']}: price a unit" for x in out):
            out.append((f"{r.get('short') or r['id']}: price a unit", r["price"], fmt.price(r["price"])))
    out.append(("kirana window, days", preview["windowDays"], str(preview["windowDays"])))
    if preview.get("offered"):
        out.append(("kiranas the scheme goes to", preview["offered"], str(preview["offered"])))
    # a negative figure cannot be quoted (it would be written without its sign), so it is not offered
    return [x for x in out if float(x[1]) >= 0]


def facts(preview: dict[str, Any]) -> dict[str, Any]:
    p = preview["plan"]
    used = {ln["id"] for ln in p["lines"]}
    return {
        "city": preview.get("city"),
        "split": [
            {"exit": ln.get("short") or ln["id"], "units": fmt.num(ln["units"]), "price": fmt.price(ln["price"])}
            for ln in p["lines"]
        ],
        "exitsNotUsed": [
            {"exit": r.get("short") or r["id"], "eligible": bool(r.get("eligible")), "why not": r.get("reason") or ""}
            for r in p["rows"]
            if r["id"] not in used and not r.get("baseline")
        ],
        "figuresYouMayQuote": [f"{label}: {written}" for label, _, written in quotable(preview)],
    }


async def _fetch(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    rc.run(AGENT)
    preview = await rc.deps.backend.plan_preview(rc.msg.client, rc.msg.ref or "")
    return {"router_facts": facts(preview), "router_allowed": [v for _, v, _ in quotable(preview)]}


def _parts(state: dict[str, Any]) -> list[types.Part]:
    return [types.Part(text="THE PLAN (computed):\n" + json.dumps(state["router_facts"], ensure_ascii=False, indent=1))]


def check(text: str, allowed: list[float]) -> bool:
    return bool(text) and len(text) <= EXPLANATION_MAX and checks.check_numbers(text, allowed)


async def _report(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    run = rc.run(AGENT)
    text = " ".join(str((state.get("router_text") or {}).get("explanation") or "").split())
    body: dict[str, Any] = {}
    if check(text, state["router_allowed"]):
        body["explanation"] = text
    else:
        run.fell_back("explanation left out" if text else "no explanation")
    out = await rc.report(AGENT, case_path(rc.msg.client, rc.msg.ref or "", "plan"), body)
    if out.get("noop"):
        return halt()
    return {"case": {**state["case"], "phase": "planned"}}


def route(rc: RunCtx) -> list:
    return [
        step(rc, "router_fetch", _fetch, agent=AGENT, when=due),
        writer(
            rc,
            name="router_write",
            agent=AGENT,
            tier="pro",
            prompt_name="router",
            schema=Explanation,
            output_key="router_text",
            parts=_parts,
            temperature=STRUCTURED,
            when=lambda s: due(s) and "router_facts" in s,
        ),
        step(rc, "router_report", _report, agent=AGENT, when=lambda s: due(s) and "router_facts" in s),
    ]
