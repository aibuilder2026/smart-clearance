"""Outreach (execute and settle): the kirana scheme, and the day-7 shelf check.

- **The offer** (`journey.step {type: execute}`): Gemini Flash writes the scheme's offer in Hindi, English and Marathi,
  each opening with a `{shop}` placeholder for the shop's name; `POST …/offer {words: {hi, en, mr}}`. backend-api sends
  it to the distributor's kiranas, each capped at four times its own 14-day sales. The scheme's pack price goes into
  BigQuery's `channel_prices` (source `offer`).
- **The shelf check** (`journey.step {type: timer, kind: shelf.due}`): the salesman's counts are loaded into BigQuery's
  `shelf_counts` (as the Data agent loads any export), the batch's latest count for each shop is read back, and
  `POST …/shelf-check {counts: [{kirana, left}]}`; backend-api picks the one shop to collect from.
"""

import json
import logging
import re
from typing import Any

from google.genai import types
from pydantic import BaseModel, Field

from sc_agents import checks, fmt
from sc_agents.agents import step
from sc_agents.agents.common import line
from sc_agents.backend import case_path
from sc_agents.models import COPY, writer
from sc_agents.runs import RunCtx

log = logging.getLogger("sc_agents.outreach")
AGENT = "outreach"
SCOPE = "outreach"
WORDS_MAX = 220
LANGUAGES = ("hi", "en", "mr")


class Offer(BaseModel):
    # every field required: Gemini's structured output may leave out a property the schema does not require (SC-77)
    hi: str = Field(description="the offer in Hindi, in Devanagari")
    en: str = Field(description="the offer in English")
    mr: str = Field(description="the offer in Marathi, in Devanagari")


def due(state: dict[str, Any]) -> bool:
    case = state.get("case") or {}
    return (
        (state.get("settings") or {}).get("on", {}).get(AGENT, True)
        and case.get("phase") in ("approved", "executing")
        and line(state, "kirana") is not None
        and not case.get("offer")
        and not case["distributor"].get("paused")
    )


def facts(case: dict[str, Any], settings: dict[str, Any]) -> dict[str, Any]:
    sku, dist, batch = case["sku"], case["distributor"], case["batch"]
    scheme = settings.get("scheme") or {"buy": 10, "free": 2}
    return {
        "brand": sku.get("brand"),
        "product": sku.get("name"),
        "scheme": {"buyPackets": int(scheme["buy"]), "freePackets": int(scheme["free"])},
        "bestBefore": fmt.day(batch.get("bestBefore")),
        "offerLastsHours": int(settings.get("offerWindowHours") or 48),
        "distributor": dist.get("name"),
        "firstLanguage": "hi" if settings.get("language") == "hi" else "en",
    }


def allowed(f: dict[str, Any]) -> list[float]:
    pool = [float(f["scheme"]["buyPackets"]), float(f["scheme"]["freePackets"]), float(f["offerLastsHours"])]
    for v in (f["product"], f["bestBefore"]):
        pool += checks.figures(str(v or ""))
    return pool


def check(words: dict[str, Any], f: dict[str, Any]) -> dict[str, str]:
    """the languages whose words pass: the {shop} placeholder kept, short enough for a push, only the offer's figures"""
    pool = allowed(f)
    out = {}
    for lang in LANGUAGES:
        text = re.sub(r"\s+", " ", str(words.get(lang) or "")).strip()
        if text and "{shop}" in text and len(text) <= WORDS_MAX and checks.check_numbers(text, pool):
            out[lang] = text
    return out


def _parts(state: dict[str, Any]) -> list[types.Part]:
    return [types.Part(text="THE OFFER (facts):\n" + json.dumps(state["outreach_facts"], ensure_ascii=False, indent=1))]


async def _prepare(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    rc.run(AGENT)
    return {"outreach_facts": facts(state["case"], state.get("settings") or {})}


async def _report(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    run = rc.run(AGENT)
    words = check(state.get("outreach_words") or {}, state["outreach_facts"])
    if len(words) < len(LANGUAGES):
        run.fell_back("offer words left out")
    out = await rc.report(AGENT, case_path(rc.msg.client, rc.msg.ref or "", "offer"), {"words": words})
    if not out.get("noop"):
        await _price(rc, state)
    return {}


async def _price(rc: RunCtx, state: dict[str, Any]) -> None:
    """the scheme's pack price, for the Valuer's history"""
    kl, case = line(state, "kirana"), state["case"]
    if kl is None:
        return
    mrp = float(case["sku"].get("mrp") or 0)
    today = (state.get("settings") or {}).get("today")
    row = {
        "client_id": rc.msg.client,
        "sku_id": case["sku"]["id"],
        "channel": "kirana",
        "batch_ref": case["ref"],
        "priced_on": today,
        "price_per_unit": float(kl["price"]),
        "pct_of_mrp": round(float(kl["price"]) / mrp, 4) if mrp else None,
        "source": "offer",
        "recorded_at": rc.deps.clock().isoformat(),
    }
    try:
        await rc.deps.warehouse.insert("channel_prices", [row], [f"offer:{rc.msg.client}:{case['ref']}"])
    except Exception as e:
        log.warning("outreach: the scheme's price was not recorded: %s", e)


def offer(rc: RunCtx) -> list:
    ready = lambda s: due(s) and "outreach_facts" in s  # noqa: E731
    return [
        step(rc, "outreach_prepare", _prepare, agent=AGENT, scope=SCOPE, when=due),
        writer(
            rc,
            name="outreach_write",
            agent=AGENT,
            tier="flash",
            prompt_name="outreach",
            schema=Offer,
            output_key="outreach_words",
            parts=_parts,
            temperature=COPY,
            scope=SCOPE,
            when=ready,
        ),
        step(rc, "outreach_report", _report, agent=AGENT, scope=SCOPE, when=ready),
    ]


# --- the day-7 shelf check --------------------------------------------------------------------------------------------


async def _shelf(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    from sc_agents.agents import data

    rc.run(AGENT)
    files = [f for f in rc.msg.payload.get("files") or [] if isinstance(f, str)]
    await data.load_files(rc, files, kinds=("shelf",))
    counts = await rc.deps.warehouse.shelf_counts(rc.msg.client, rc.msg.ref or "")
    await rc.report(AGENT, case_path(rc.msg.client, rc.msg.ref or "", "shelf-check"), {"counts": counts})
    return {}


def shelf_check(rc: RunCtx) -> list:
    return [step(rc, "outreach_shelf", _shelf, agent=AGENT)]
