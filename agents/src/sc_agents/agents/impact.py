"""Impact (report): once the return window has closed, `POST …/report` posts the ledger and clears the batch
(backend-api works out every figure: what each exit recovered, the kilos kept out of landfill, CO2e, meals). Impact
appends one `impact_ledger` row per exit to BigQuery, for the BRSR report. Gemini Flash may write the BRSR narrative
(IMPACT_NARRATIVE=true); it is logged, not sent back yet."""

import json
import logging
from datetime import date
from typing import Any

from google.genai import types
from pydantic import BaseModel, Field

from sc_agents import checks, fmt
from sc_agents.agents import halt, step
from sc_agents.agents.common import ist_day, load_case
from sc_agents.backend import case_path
from sc_agents.models import STRUCTURED, writer
from sc_agents.runs import RunCtx

log = logging.getLogger("sc_agents.impact")
AGENT = "impact"


class Narrative(BaseModel):
    # every field required: Gemini's structured output may leave out a property the schema does not require (SC-77)
    narrative: str = Field(description="the batch's BRSR narrative")


def _on(state: dict[str, Any]) -> bool:
    return (state.get("settings") or {}).get("on", {}).get(AGENT, True)


def rows(client: str, case: dict[str, Any], ledger: dict[str, Any], *, journey: str, recorded: str) -> list[dict]:
    """the ledger, one row per exit: what it recovered (ExpireSoon at its awarded price) and kept from landfill"""
    closed = ist_day(ledger.get("at") or recorded) or recorded[:10]
    kg_per_unit = float(case["sku"].get("kgPerUnit") or 0)
    total_kg, total_co2 = float(ledger.get("kg") or 0), float(ledger.get("co2") or 0)
    per_unit_writeoff = float(case.get("writeOffPerUnit") or 0)
    delta = float((ledger.get("actual") or {}).get("delta") or 0)
    out = []
    for ln in ledger.get("lines") or []:
        units = int(ln["units"])
        kg = round(units * kg_per_unit, 3) if ln["id"] != "writeoff" else 0.0
        recovered = float(ln.get("net") or 0) - (delta if ln["id"] == "expiresoon" else 0)
        out.append(
            {
                "client_id": client,
                "journey_id": journey,
                "batch_ref": case["ref"],
                "sku_id": case["sku"]["id"],
                "channel": ln["id"],
                "units": units,
                "kg": kg,
                "co2e_kg": round(total_co2 * kg / total_kg, 3) if total_kg else 0.0,
                "meals": int(ledger.get("meals") or 0) if ln["id"] == "foodbank" else 0,
                "recovered_inr": round(recovered, 2),
                "write_off_avoided_inr": round(units * per_unit_writeoff, 2) if ln["id"] != "writeoff" else 0.0,
                "closed_on": closed,
                "quarter": fmt.fiscal_quarter(date.fromisoformat(closed)),
                "recorded_at": recorded,
            }
        )
    return out


async def _report(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    rc.run(AGENT)
    case = state["case"]
    out = await rc.report(AGENT, case_path(rc.msg.client, rc.msg.ref or "", "report"), {})
    if out.get("noop") or not out.get("ledger"):
        return halt()
    ledger = out["ledger"]
    settings = state.get("settings") or {}
    journey = f"{rc.msg.client}:{settings.get('day0') or ''}"
    found = rows(rc.msg.client, case, ledger, journey=journey, recorded=rc.deps.clock().isoformat())
    ids = [f"ledger:{r['journey_id']}:{r['batch_ref']}:{r['channel']}" for r in found]
    try:
        await rc.deps.warehouse.insert("impact_ledger", found, ids)
    except Exception as e:  # the ledger is posted on the case; BigQuery's copy is retried by row id next time
        log.error("impact: the ledger rows for %s did not reach BigQuery: %s", case["ref"], e)
        rc.run(AGENT).note = "ledger rows not written"
    return {"ledger": ledger}


def _parts(state: dict[str, Any]) -> list[types.Part]:
    ledger, case = state["ledger"], state["case"]
    facts = {
        "product": f"{case['sku'].get('brand', '')} {case['sku'].get('name', '')}".strip(),
        "recovered": fmt.inr(ledger.get("net")),
        "keptFromLandfill": f"{fmt.num(round(float(ledger.get('kg') or 0)))} kg",
        "co2eAvoided": f"{fmt.num(round(float(ledger.get('co2') or 0)))} kg",
        "meals": ledger.get("meals"),
        "exits": [f"{ln.get('short') or ln['id']}: {fmt.num(ln['units'])} units" for ln in ledger.get("lines") or []],
    }
    return [types.Part(text="THE CLEARED BATCH (facts):\n" + json.dumps(facts, ensure_ascii=False, indent=1))]


async def _narrative(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    text = " ".join(str((state.get("impact_narrative") or {}).get("narrative") or "").split())
    ledger = state["ledger"]
    pool = [float(ledger.get("net") or 0), round(float(ledger.get("kg") or 0)), round(float(ledger.get("co2") or 0))]
    pool += [float(ledger.get("meals") or 0)] + [float(ln["units"]) for ln in ledger.get("lines") or []]
    if text and checks.check_numbers(text, pool):
        log.info("impact: BRSR narrative for %s: %s", rc.msg.ref, text)
    elif text:
        rc.run(AGENT).fell_back("narrative left out")
    return {}


def report(rc: RunCtx) -> list:
    agents = [
        load_case(rc, agent=AGENT),
        step(rc, "impact_report", _report, agent=AGENT, when=_on),
    ]
    if rc.settings.impact_narrative:
        ready = lambda s: _on(s) and "ledger" in s  # noqa: E731
        agents += [
            writer(
                rc,
                name="impact_narrative",
                agent=AGENT,
                tier="flash",
                prompt_name="impact_brsr",
                schema=Narrative,
                output_key="impact_narrative",
                parts=_parts,
                temperature=STRUCTURED,
                when=ready,
            ),
            step(rc, "impact_narrative_log", _narrative, agent=AGENT, when=ready),
        ]
    return agents
