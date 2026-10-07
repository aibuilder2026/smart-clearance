"""The Valuer (value): every exit priced by the rules, with a short note on each from Gemini Pro.

`GET …/valuation-preview` is the channel table backend-api will save (domain/money.py); BigQuery's `channel_prices`
holds what was paid lately for the SKU (awards and schemes). Gemini Pro writes one note per channel from those facts
alone, `{notes: {channelId: text}}`; a note that quotes a figure outside them is left out. Then
`POST …/valuation {notes}`."""

import json
import logging
from typing import Any

from google.genai import types
from pydantic import BaseModel

from sc_agents import checks, fmt
from sc_agents.agents import halt, step
from sc_agents.backend import case_path
from sc_agents.models import STRUCTURED, writer
from sc_agents.runs import RunCtx

log = logging.getLogger("sc_agents.valuer")
AGENT = "valuer"
NOTE_MAX = 160


class Notes(BaseModel):
    notes: dict[str, str] | None = None


def due(state: dict[str, Any]) -> bool:
    case = state.get("case") or {}
    on = (state.get("settings") or {}).get("on", {}).get(AGENT, True)
    verified = case.get("phase") == "verified" or (case.get("phase") == "at-risk" and case.get("photo") == "verified")
    return on and verified


def facts(preview: dict[str, Any], history: list[dict[str, Any]]) -> dict[str, Any]:
    """what the Valuer's model is told: the table as computed, and recent prices"""
    sku = preview.get("sku") or {}
    return {
        "batch": {
            "product": f"{sku.get('brand', '')} {sku.get('name', '')}".strip(),
            "category": sku.get("category"),
            "mrp": fmt.price(sku.get("mrp", 0)),
            "daysLeft": preview.get("daysLeft"),
            "unitsAtRisk": preview.get("units"),
            "city": preview.get("city"),
        },
        "channels": [
            {
                "id": r["id"],
                "name": r.get("name"),
                "eligible": bool(r.get("eligible")),
                "reason": r.get("reason") or "",
                "needs": r.get("need"),
                "clears": r.get("clears"),
                "price": fmt.price(r.get("price", 0)),
                "priceOfMrp": r.get("pricePctLabel"),
                "packPrice": fmt.price(r["packPrice"]) if r.get("packPrice") is not None else None,
                "netPerUnit": fmt.inr2(r.get("net", 0)),
                "capacity": r.get("capacity") if r.get("capacity") is not None else "unlimited",
                "gstCredit": r.get("itc"),
            }
            for r in preview.get("rows") or []
        ],
        "recentPrices": [
            {
                "channel": h["channel"],
                "sales": h["n"],
                "averagePrice": fmt.inr2(h["avgPrice"]),
                "lastPrice": fmt.inr2(h["lastPrice"]),
                "lastOn": fmt.day(h.get("lastOn")),
            }
            for h in history
        ],
    }


def allowed(f: dict[str, Any]) -> list[float]:
    """every figure the facts hold, which the notes may quote"""
    out: list[float] = []

    def walk(v: Any) -> None:
        if isinstance(v, bool):
            return
        if isinstance(v, int | float):
            out.append(abs(float(v)))
        elif isinstance(v, str):
            out.extend(checks.figures(v))
        elif isinstance(v, dict):
            for x in v.values():
                walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)

    walk(f)
    return out


async def _fetch(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    rc.run(AGENT)
    preview = await rc.deps.backend.valuation_preview(rc.msg.client, rc.msg.ref or "")
    sku = (preview.get("sku") or {}).get("id") or state["case"]["sku"]["id"]
    try:
        history = await rc.deps.warehouse.price_history(rc.msg.client, sku)
    except Exception as e:  # the notes can do without the history
        log.warning("valuer: no price history for %s: %s", sku, e)
        history = []
    return {"valuer_facts": facts(preview, history)}


def _parts(state: dict[str, Any]) -> list[types.Part]:
    return [
        types.Part(
            text="FACTS (computed; quote figures only as written here):\n"
            + json.dumps(state["valuer_facts"], ensure_ascii=False, indent=1)
        )
    ]


def keep(notes: dict[str, Any], f: dict[str, Any]) -> tuple[dict[str, str], list[str]]:
    """the notes that pass: a known channel, under the length, no figure outside the facts; and the ones dropped"""
    ids = {c["id"] for c in f["channels"]}
    pool = allowed(f)
    kept, dropped = {}, []
    for k, v in (notes or {}).items():
        text = " ".join(str(v).split())
        if k in ids and text and len(text) <= NOTE_MAX and checks.check_numbers(text, pool):
            kept[k] = text
        else:
            dropped.append(k)
    return kept, dropped


async def _report(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    run = rc.run(AGENT)
    f = state["valuer_facts"]
    kept, dropped = keep((state.get("valuer_notes") or {}).get("notes") or {}, f)
    if dropped or not kept:
        run.fell_back("notes left out" if dropped else "no notes")
    out = await rc.report(AGENT, case_path(rc.msg.client, rc.msg.ref or "", "valuation"), {"notes": kept})
    if out.get("noop"):
        return halt()
    return {"case": {**state["case"], "phase": "valued"}}


def value(rc: RunCtx) -> list:
    return [
        step(rc, "valuer_fetch", _fetch, agent=AGENT, when=due),
        writer(
            rc,
            name="valuer_write",
            agent=AGENT,
            tier="pro",
            prompt_name="valuer",
            schema=Notes,
            output_key="valuer_notes",
            parts=_parts,
            temperature=STRUCTURED,
            when=lambda s: due(s) and "valuer_facts" in s,
        ),
        step(rc, "valuer_report", _report, agent=AGENT, when=lambda s: due(s) and "valuer_facts" in s),
    ]
