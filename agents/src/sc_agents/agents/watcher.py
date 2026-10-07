"""The Watcher (detect), every journey morning at 09:00 (and on Run now): how fast each open batch sells, from
BigQuery's secondary sales, for backend-api to judge against the quick-commerce gates.

For each batch, the mean units a day its distributor sold of its SKU over the last 28 days of the loaded history
(journey dates), shared between the distributor's batches of that SKU in proportion to their own recorded rates. A
batch with no history keeps its own rate. `POST /internal/clients/{c}/detect {checked, distributors, batches}`:
backend-api flags the batches at risk (money.py's assess) and opens their cases. No model: the figures are the
judgement."""

import logging
from collections import defaultdict
from typing import Any

from sc_agents.agents import step
from sc_agents.errors import Transient
from sc_agents.runs import RunCtx

log = logging.getLogger("sc_agents.watcher")
AGENT = "watcher"
WINDOW = 28


def rates(batches: list[dict[str, Any]], means: dict[tuple[str, str], float]) -> list[dict[str, Any]]:
    """each batch's units a day: its distributor's sales of its SKU, shared by the batches' own rates"""
    groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for b in batches:
        groups[(b["distributor"], b["sku"])].append(b)
    out = []
    for key, group in groups.items():
        own = [float(b.get("sellPerDay") or 0) for b in group]
        mean = means.get(key)
        for b, rate in zip(group, own, strict=True):
            if mean is None or mean <= 0:
                spd = rate
            else:
                share = rate / sum(own) if sum(own) > 0 else 1 / len(group)
                spd = mean * share
            out.append({"ref": b["id"], "sellPerDay": round(spd, 2)})
    return out


async def _watch(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    rc.run(AGENT)
    world = await rc.deps.backend.batches(rc.msg.client)
    batches = world.get("batches") or []
    try:
        means = await rc.deps.warehouse.sales_means(rc.msg.client, window=WINDOW)
    except Exception as e:
        raise Transient(f"BigQuery: {e}") from e
    if not means:
        log.info("watcher: no sales history loaded for %s; each batch keeps its own rate", rc.msg.client)
    body = {
        "checked": len(batches),
        "distributors": len(world.get("distributors") or {}),
        "batches": rates(batches, means),
    }
    await rc.report(AGENT, f"/internal/clients/{rc.msg.client}/detect", body)
    return {}


def detect(rc: RunCtx) -> list:
    return [step(rc, "watcher_detect", _watch, agent=AGENT)]
