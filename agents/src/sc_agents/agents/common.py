"""What every pipeline reads first: the client's agent settings, and the batch's case, cut down to what the agents
may use. Neither ever carries the Negotiator's reserve into the run's state: the agents never see it, so no model can
quote it."""

from datetime import date, datetime
from typing import Any

from sc_agents.agents import Step, step
from sc_agents.runs import RunCtx

IST_OFFSET_MIN = 330


def ist_day(at: str | None) -> str | None:
    """a journey time's day in India (2026-10-02T20:00:00+00:00 is 3 Oct there)"""
    if not at:
        return None
    from datetime import timedelta, timezone

    t = datetime.fromisoformat(at)
    if t.tzinfo is None:
        return t.date().isoformat()
    return t.astimezone(timezone(timedelta(minutes=IST_OFFSET_MIN))).date().isoformat()


def journey_today(clock: dict[str, Any] | None) -> str:
    """the client's journey day (its clock runs fast while a batch is at risk), as ISO, in India's time"""
    return ist_day((clock or {}).get("now")) or date.today().isoformat()


def settings_of(raw: dict[str, Any]) -> dict[str, Any]:
    """the client's agents as the pipelines use them: each agent on or off, the scheme, the offer language and window,
    the journey's clock. Not the money rules, which hold the reserve"""
    agents = raw.get("agents") or {}
    rules = raw.get("rules") or {}
    clock = raw.get("clock") or {}
    return {
        "on": {k: bool(v.get("on", True)) for k, v in agents.items()},
        "visionConfidence": float((agents.get("vision") or {}).get("confidence", 0.9)),
        "scheme": dict(rules.get("scheme") or {"buy": 10, "free": 2}),
        "language": raw.get("language") or "en",
        "offerWindowHours": int(raw.get("offerWindowHours") or 48),
        "today": journey_today(clock),
        "day0": clock.get("day0"),
        # when the journey was last started again (SC-88): a replay of the story's calendar is its own journey
        "journeyFrom": raw.get("journeyFrom"),
        "setupConfirmed": bool(raw.get("setupConfirmed")),
    }


async def _settings(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    return {"settings": settings_of(await rc.deps.backend.agents(rc.msg.client))}


def load_settings(rc: RunCtx) -> Step:
    return step(rc, "load_settings", _settings)


def cut_case(c: dict[str, Any]) -> dict[str, Any]:
    """a case as the agents keep it: the batch, its SKU and distributor, the plan's lines and the journey's state.
    The listing's reserve and the listing API's request (which repeats it) are left out"""
    journey = c.get("journey") or {}
    listing = dict(journey.get("listing") or {}) or None
    if listing:
        listing.pop("reserve", None)
    plan = c.get("plan") or {}
    sku = c.get("sku") or {}
    dist = c.get("distributor") or {}
    return {
        "ref": c.get("ref"),
        "phase": journey.get("phase"),
        "photo": (journey.get("photo") or {}).get("status"),
        "sku": {
            k: sku.get(k)
            for k in ("id", "code", "brand", "name", "category", "hsn", "mrp", "gst", "kgPerUnit", "perCarton")
        },
        "distributor": {
            "id": dist.get("id"),
            "name": dist.get("name"),
            "city": dist.get("city"),
            "state": dist.get("state"),
            "godown": dist.get("godown"),
            "address": dist.get("address"),
            "paused": bool((dist.get("permission") or {}).get("paused")),
            "permitted": dist.get("permission") is not None,
        },
        "batch": {k: (c.get("batch") or {}).get(k) for k in ("units", "daysLeft", "bestBefore", "mfg", "shelf")},
        "lines": [
            {k: ln.get(k) for k in ("id", "name", "short", "units", "price", "packPrice", "net", "gross")}
            for ln in plan.get("lines") or []
        ],
        "writeOffPerUnit": (plan.get("writeOff") or {}).get("perUnit"),
        "listing": listing,
        "offer": journey.get("offer"),
        "donation": c.get("donation"),
        "award": journey.get("award") or c.get("award"),
        "chat": journey.get("chat") or [],
        "docs": c.get("docsFull") or [],
        "photoObject": c.get("photoObject"),
        "photosBucket": c.get("photosBucket"),
        "docsBucket": c.get("docsBucket"),
        # packs destroyed at his godown (SC-139): where the evidence stands, for Vision's check; nothing of its figures
        "destruction": {"status": (c.get("destruction") or {}).get("status")} if c.get("destruction") else None,
    }


async def _case(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    return {"case": cut_case(await rc.deps.backend.case(rc.msg.client, rc.msg.ref or ""))}


def load_case(rc: RunCtx, *, agent: str = "", name: str = "load_case") -> Step:
    """the batch's case; when the batch has left its journey (404), the pipeline ends as a noop for `agent`"""
    return step(rc, name, _case, agent=agent)


def line(state: dict[str, Any], channel: str) -> dict[str, Any] | None:
    return next((ln for ln in (state.get("case") or {}).get("lines", []) if ln["id"] == channel and ln["units"]), None)


def on(state: dict[str, Any], agent: str) -> bool:
    return (state.get("settings") or {}).get("on", {}).get(agent, True)
