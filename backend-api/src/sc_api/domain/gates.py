"""Quick-commerce gates per SKU, with a per-batch override (SC-47), ported from design3/core/platform.js (by way of
frontend/api/src/console/platform.ts).

A batch's gates are its override, else its SKU's own, else the client's default, value by value. Blinkit wants days of
shelf life left; Zepto and Instamart a share of the SKU's life left, passed when days x 100 >= share x life. The view
sc.batch_gates applies the same rule in SQL for the agents (migration 0002). tests/test_rules.py checks these against
platform.js's own answers.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date
from typing import Any

# an SKU's own gates keep the profile's bounds; a batch's override records a deal a warehouse agreed to, so it may
# go lower
SKU_BOUNDS = {"blinkitDays": (30, 180), "qcomPct": (30, 90)}
OVERRIDE_BOUNDS = {"blinkitDays": (7, 180), "qcomPct": (5, 90)}
REASON_MAX = 200
APPS = ("blinkit", "zepto", "instamart")


@dataclass(frozen=True)
class Effective:
    blinkit_days: int
    blinkit_source: str
    qcom_pct: int
    qcom_source: str


def effective(
    client: Mapping[str, int], sku: Mapping[str, int | None], override: Mapping[str, int | None]
) -> Effective:
    """each gate from the batch's override, else the SKU's own, else the client's default"""

    def pick(key: str) -> tuple[int, str]:
        if override.get(key) is not None:
            return int(override[key]), "override"  # type: ignore[arg-type]
        if sku.get(key) is not None:
            return int(sku[key]), "sku"  # type: ignore[arg-type]
        return int(client[key]), "default"

    bl, bl_from = pick("blinkitDays")
    qc, qc_from = pick("qcomPct")
    return Effective(bl, bl_from, qc, qc_from)


def checks(e: Effective, *, days_left: int, life_days: int) -> list[dict[str, Any]]:
    """pass or fail at each app: Blinkit by days left, Zepto and Instamart by the share of life left"""
    pct = (days_left * 100) // life_days
    qcom_pass = days_left * 100 >= e.qcom_pct * life_days
    return [
        {
            "app": "blinkit",
            "need": e.blinkit_days,
            "has": days_left,
            "pass": days_left >= e.blinkit_days,
            "source": e.blinkit_source,
        },
        {"app": "zepto", "need": e.qcom_pct, "has": pct, "pass": qcom_pass, "source": e.qcom_source},
        {"app": "instamart", "need": e.qcom_pct, "has": pct, "pass": qcom_pass, "source": e.qcom_source},
    ]


def batch_gates(
    client: Mapping[str, int],
    sku: Mapping[str, Any],
    override: Mapping[str, Any] | None,
    best_before: date,
    today: date,
) -> dict[str, Any]:
    """what platform.js's batchGates answers: the batch's gates, its days left, and each app's pass or fail"""
    e = effective(client, sku.get("gates") or {}, override or {})
    days = (best_before - today).days
    return {
        "blinkitDays": e.blinkit_days,
        "qcomPct": e.qcom_pct,
        "daysLeft": days,
        "lifeDays": sku["lifeDays"],
        "checks": checks(e, days_left=days, life_days=sku["lifeDays"]),
    }


def _bad(v: Any, bounds: tuple[int, int]) -> bool:
    return isinstance(v, bool) or not isinstance(v, int) or not bounds[0] <= v <= bounds[1]


def sku_gates_error(g: Mapping[str, Any] | None) -> str | None:
    """what an SKU's own gates must be, or the problem with them (None puts it back on the client's default)"""
    if g is None:
        return None
    b, q = SKU_BOUNDS["blinkitDays"], SKU_BOUNDS["qcomPct"]
    if g.get("blinkitDays") is None and g.get("qcomPct") is None:
        return "Give the SKU at least one gate of its own, or put it back on the default."
    if g.get("blinkitDays") is not None and _bad(g["blinkitDays"], b):
        return f"Blinkit takes {b[0]} to {b[1]} days."
    if g.get("qcomPct") is not None and _bad(g["qcomPct"], q):
        return f"Zepto and Instamart take {q[0]}% to {q[1]}% of life."
    return None


def override_error(o: Mapping[str, Any]) -> str | None:
    """what a batch's override must carry, or the problem with it"""
    b, q = OVERRIDE_BOUNDS["blinkitDays"], OVERRIDE_BOUNDS["qcomPct"]
    if o.get("blinkitDays") is None and o.get("qcomPct") is None:
        return "Override at least one gate."
    if o.get("blinkitDays") is not None and _bad(o["blinkitDays"], b):
        return f"A batch's Blinkit gate is {b[0]} to {b[1]} days."
    if o.get("qcomPct") is not None and _bad(o["qcomPct"], q):
        return f"A batch's Zepto and Instamart gate is {q[0]}% to {q[1]}% of life."
    why = (o.get("reason") or "").strip()
    if not why:
        return "Say why this batch is different."
    if len(why) > REASON_MAX:
        return f"Keep the reason to {REASON_MAX} characters."
    return None


def gate_text(g: Mapping[str, Any]) -> str:
    parts = []
    if g.get("blinkitDays") is not None:
        parts.append(f"Blinkit {g['blinkitDays']}+ days")
    if g.get("qcomPct") is not None:
        parts.append(f"Zepto and Instamart {g['qcomPct']}% of life")
    return ", ".join(parts)


def possessive(name: str) -> str:
    return name + ("'" if name.lower().endswith("s") else "'s")


def sku_gates_line(client_name: str, sku_name: str, g: Mapping[str, Any] | None) -> str:
    if g:
        return f"Set {sku_name}'s quick-commerce gates: {gate_text(g)}"
    return f"Put {sku_name} back on {possessive(client_name)} default quick-commerce gates"


def override_line(ref: str, o: Mapping[str, Any]) -> str:
    return f"Overrode {ref}'s quick-commerce gates: {gate_text(o)} ({o['reason'].strip()})"


def clear_override_line(ref: str) -> str:
    return f"Removed {ref}'s quick-commerce gate override"
