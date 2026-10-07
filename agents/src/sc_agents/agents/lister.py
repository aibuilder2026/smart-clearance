"""The Lister (execute): lists the ExpireSoon lot in the distributor's name once the plan is approved. Gemini Flash
writes the listing's title and description from the lot's public facts; backend-api posts it at the plan's price with
the reserve, which the Lister never sees. `POST …/listing {title, description}`; backend-api's template stands in for
words that fail the checks."""

import json
import re
from typing import Any

from google.genai import types
from pydantic import BaseModel

from sc_agents import checks, fmt
from sc_agents.agents import step
from sc_agents.agents.common import line
from sc_agents.backend import case_path
from sc_agents.models import STRUCTURED, writer
from sc_agents.runs import RunCtx

AGENT = "lister"
SCOPE = "lister"
TITLE_MAX, DESCRIPTION_MAX = 100, 500


class Listing(BaseModel):
    title: str | None = None
    description: str | None = None


def due(state: dict[str, Any]) -> bool:
    case = state.get("case") or {}
    return (
        (state.get("settings") or {}).get("on", {}).get(AGENT, True)
        and case.get("phase") in ("approved", "executing")
        and line(state, "expiresoon") is not None
        and not case.get("listing")
        and not case["distributor"].get("paused")
    )


def facts(case: dict[str, Any], es: dict[str, Any]) -> dict[str, Any]:
    sku, dist, batch = case["sku"], case["distributor"], case["batch"]
    return {
        "brand": sku.get("brand"),
        "product": sku.get("name"),
        "category": sku.get("category"),
        "packs": es["units"],
        "askingPricePerPack": fmt.price(es["price"]),
        "mrpPerPack": fmt.price(sku.get("mrp") or 0),
        "batch": case.get("ref"),
        "bestBefore": fmt.day(batch.get("bestBefore")),
        "seller": dist.get("name"),
        "stockAt": dist.get("godown") or dist.get("city"),
        "city": dist.get("city"),
        "dispatch": "within 24 hours of the balance",
    }


def allowed(f: dict[str, Any]) -> list[float]:
    pool = [float(f["packs"]), 24.0]
    for v in (f["askingPricePerPack"], f["mrpPerPack"], f["product"], f["batch"], f["bestBefore"]):
        pool += checks.figures(str(v or ""))
    return pool


def tidy(text: Any) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def check(listing: dict[str, Any], f: dict[str, Any]) -> dict[str, str] | None:
    title, description = tidy(listing.get("title")), tidy(listing.get("description"))
    pool = allowed(f)
    if not title or not description or len(title) > TITLE_MAX or len(description) > DESCRIPTION_MAX:
        return None
    if not (checks.check_numbers(title, pool) and checks.check_numbers(description, pool)):
        return None
    return {"title": title, "description": description}


def _parts(state: dict[str, Any]) -> list[types.Part]:
    f = state["lister_facts"]
    return [types.Part(text="THE LOT (public facts):\n" + json.dumps(f, ensure_ascii=False, indent=1))]


async def _prepare(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    rc.run(AGENT)
    return {"lister_facts": facts(state["case"], line(state, "expiresoon") or {})}


async def _report(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    run = rc.run(AGENT)
    words = check(state.get("lister_words") or {}, state["lister_facts"])
    if words is None:
        run.fell_back("listing words left out")
    await rc.report(AGENT, case_path(rc.msg.client, rc.msg.ref or "", "listing"), words or {})
    return {}


def lister(rc: RunCtx) -> list:
    ready = lambda s: due(s) and "lister_facts" in s  # noqa: E731
    return [
        step(rc, "lister_prepare", _prepare, agent=AGENT, scope=SCOPE, when=due),
        writer(
            rc,
            name="lister_write",
            agent=AGENT,
            tier="flash",
            prompt_name="lister",
            schema=Listing,
            output_key="lister_words",
            parts=_parts,
            temperature=STRUCTURED,
            scope=SCOPE,
            when=ready,
        ),
        step(rc, "lister_report", _report, agent=AGENT, scope=SCOPE, when=ready),
    ]
