"""A deal closed (deal.closed {ref, price}): the price the buyer accepted on ExpireSoon goes into BigQuery's
`channel_prices` (source `award`), so the Valuer's next notes on the SKU know what the lot fetched. Recorded as the
Negotiator's run; nothing is reported to backend-api, which has already recorded the award."""

from typing import Any

from sc_agents.agents import step
from sc_agents.agents.common import cut_case, ist_day, journey_today
from sc_agents.errors import Transient
from sc_agents.runs import RunCtx

AGENT = "negotiator"
STEP = "negotiator:award"


async def _record(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    run = rc.run(AGENT, STEP)
    case = cut_case(await rc.deps.backend.case(rc.msg.client, rc.msg.ref or ""))
    price = float(rc.msg.payload["price"])
    mrp = float(case["sku"].get("mrp") or 0)
    award = case.get("award") or {}
    row = {
        "client_id": rc.msg.client,
        "sku_id": case["sku"]["id"],
        "channel": "expiresoon",
        "batch_ref": case["ref"],
        "priced_on": ist_day(award.get("at")) or journey_today(None),
        "price_per_unit": price,
        "pct_of_mrp": round(price / mrp, 4) if mrp else None,
        "source": "award",
        "recorded_at": rc.deps.clock().isoformat(),
    }
    try:
        await rc.deps.warehouse.insert("channel_prices", [row], [f"award:{rc.msg.client}:{case['ref']}:{price:.2f}"])
    except Exception as e:
        raise Transient(f"BigQuery channel_prices: {e}") from e
    run.ended_at = rc.deps.clock()
    return {}


def deal(rc: RunCtx) -> list:
    return [step(rc, "deal_record", _record, agent=AGENT, key=STEP)]
