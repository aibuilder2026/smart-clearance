"""The ledger (SC-124): every batch the workspace has cleared, read from the ledger Impact posted and the papers it
carries, and the periods those batches fall in: each quarter of the Indian financial year, from the first batch
cleared to today's, and each year so far. Every figure and total is worked out here, from what each batch came to
(money.realised); the screens only show it. The operator and the admin read it (`report.read`)."""

from collections import Counter
from datetime import date, datetime, timedelta
from typing import Any

from sc_api import models as m
from sc_api.domain import journey as J
from sc_api.domain import money
from sc_api.domain.clock import IST

# each batch's figures, summed over a period
FIGURES = (
    "net",
    "swing",
    "pnl",
    "writeOff",
    "itcKept",
    "itcReversed",
    "kg",
    "co2",
    "meals",
    "units",
    "sold",
    "donated",
    "godown",
    "destroyed",
    "resoldKg",
    "donatedKg",
    "destroyedKg",
    "packResoldKg",
    "packDonatedKg",
    "packDestroyedKg",
    "credit",
    "support",
)
SOLD = ("kirana", "expiresoon", "staff")
# the mix, by the packs each channel took; what none took and was destroyed is the write-off
MIX = {
    "kirana": "Kirana scheme",
    "expiresoon": "ExpireSoon",
    "staff": "Staff sale",
    "foodbank": "Food bank",
    "writeoff": "Destroyed",
}
MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
MONTH_NAMES = (
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
)
FOOD = "Food waste: packaged food past quick-commerce gates"
PLASTIC = "Plastic packaging (EPR)"


def _day(at: datetime | str) -> date:
    when = datetime.fromisoformat(at) if isinstance(at, str) else at
    return when.astimezone(IST).date()


def outcome(godown: int, donated: int) -> str:
    """how a batch came out: packs left at the godown when it expired, a donation, or sold through"""
    return "leftover" if godown else "donation" if donated else "sold"


def row(case: m.Case, sku: dict[str, Any], dist: m.Distributor) -> dict[str, Any]:
    """a cleared batch as the ledger reads it: its posted figures, what each channel took, and its papers"""
    L = case.ledger or {}
    lines = [ln for ln in L.get("lines", []) if ln.get("id") != "writeoff"]
    took = {ln["id"]: int(ln.get("units", 0)) for ln in lines}
    sold = sum(took.get(k, 0) for k in SOLD)
    donated = took.get("foodbank", 0)
    godown = int(L.get("godown", 0))
    destroyed = int(L.get("destroyed", 0))
    kg_unit = float(sku["kgPerUnit"])
    pack = float(sku.get("packKg") or 0)
    docs = {d["id"]: d for d in case.docs or []}
    expiry = L.get("expiry") or {}
    figures = {
        "net": L.get("net", 0),
        "swing": L.get("swing", 0),
        "pnl": L.get("pnl", 0),
        "writeOff": ((case.plan or {}).get("writeOff") or {}).get("total", 0),
        "itcKept": L.get("itc", 0),
        "itcReversed": L.get("itcReversed", 0),
        "kg": L.get("kg", 0),
        "co2": L.get("co2", 0),
        "meals": L.get("meals", 0),
        "units": (case.plan or {}).get("units", sold + donated + godown),
        "sold": sold,
        "donated": donated,
        "godown": godown,
        "destroyed": destroyed,
        "resoldKg": money.r2(sold * kg_unit),
        "donatedKg": money.r2(donated * kg_unit),
        "destroyedKg": money.r2(destroyed * kg_unit),
        # the plastic packaging on those packs (SC-125): it goes where its pack goes
        "packResoldKg": money.r2(sold * pack),
        "packDonatedKg": money.r2(donated * pack),
        "packDestroyedKg": money.r2(destroyed * pack),
        "credit": expiry.get("credit", 0) if expiry.get("policy") != "none" else 0,
        "support": (docs.get("support") or {}).get("amount", 0),
    }
    papers = [
        {
            "id": d["id"],
            "type": d.get("type", ""),
            "no": d.get("no", ""),
            "status": d.get("status", ""),
            "date": d.get("date"),
            "amount": d.get("total", d.get("amount")),
            "pdf": bool(d.get("pdf")),
        }
        for d in case.docs or []
    ]
    reviewed = case.reviewed or None
    return money.jsonable(
        {
            "ref": case.batch_ref,
            "sku": sku["id"],
            "name": sku["name"],
            "img": sku["img"],
            "distributor": dist.id,
            "distributorName": dist.name,
            "city": dist.city,
            "flagged": _day(case.opened_at).isoformat(),
            "cleared": _day(L["at"]).isoformat(),
            "outcome": outcome(godown, donated),
            "history": bool(case.history),
            "figures": figures,
            "lines": [
                {k: ln.get(k) for k in ("id", "short", "units", "price", "gross")} for ln in lines if ln.get("units")
            ],
            "papers": papers,
            "reviewed": {"by": reviewed.get("by", ""), "at": reviewed.get("at")} if reviewed else None,
        }
    )


def open_row(case: m.Case, sku: dict[str, Any], dist: m.Distributor) -> dict[str, Any]:
    """a batch still out: where its journey is"""
    return {
        "ref": case.batch_ref,
        "sku": sku["id"],
        "name": sku["name"],
        "img": sku["img"],
        "distributor": dist.id,
        "distributorName": dist.name,
        "city": dist.city,
        "flagged": _day(case.opened_at).isoformat(),
        "phase": case.phase,
        "stage": J.STAGES[min(case.stage, len(J.STAGES) - 1)],
    }


# --- the periods ----------------------------------------------------------------------------------------------------


def fy_of(d: date) -> int:
    """the financial year a day falls in, by the year it ends (1 Apr 2026 to 31 Mar 2027 is FY27)"""
    return d.year + 1 if d.month >= 4 else d.year


def quarter_of(d: date) -> int:
    return (d.month - 4) % 12 // 3 + 1


def quarter_span(fy: int, q: int) -> tuple[date, date]:
    month = (4, 7, 10, 1)[q - 1]
    start = date(fy - 1 if q < 4 else fy, month, 1)
    nxt = date(start.year + (start.month + 3 > 12), (start.month + 2) % 12 + 1, 1)
    return start, nxt - timedelta(days=1)


def totals(rows: list[dict[str, Any]]) -> dict[str, Any]:
    out: dict[str, Any] = {k: money.r2(sum(r["figures"][k] for r in rows)) for k in FIGURES}
    for k in ("meals", "units", "sold", "donated", "godown", "destroyed"):
        out[k] = int(out[k])
    out["co2"] = money.r2(out["kg"] * money.RULES["co2PerKg"])  # CO₂e is the kilos kept out of landfill × the factor
    papers = [p for r in rows for p in r["papers"] if p["status"] != "not required"]
    count = Counter(p["id"] for p in papers)
    out.update(
        {
            "batches": len(rows),
            "outcomes": {k: sum(r["outcome"] == k for r in rows) for k in ("sold", "leftover", "donation")},
            "invoices": count["invoice"],
            "creditNotes": count["support"] + count["expiry"],
            "receipts": count["receipt"],
            "reviewed": sum(1 for r in rows if r["reviewed"]),
        }
    )
    return out


def _mix(rows: list[dict[str, Any]]) -> list[list[Any]]:
    """the share of the packs each channel took, in whole percent that add up to 100 (the largest remainders)"""
    took: Counter[str] = Counter()
    for r in rows:
        for ln in r["lines"]:
            took[ln["id"]] += int(ln["units"] or 0)
        took["writeoff"] += r["figures"]["destroyed"]
    whole = sum(took.values())
    if not whole:
        return []
    exact = {k: took[k] * 100 / whole for k in MIX if took[k]}
    pct = {k: int(v) for k, v in exact.items()}
    for k in sorted(exact, key=lambda k: exact[k] - pct[k], reverse=True)[: 100 - sum(pct.values())]:
        pct[k] += 1
    return [[k, pct[k]] for k in MIX if k in pct]


def _evidence(rows: list[dict[str, Any]], t: dict[str, Any]) -> str:
    orders = sum(ln["units"] for r in rows for ln in r["lines"] if ln["id"] == "kirana")
    listings = sum(1 for r in rows if any(ln["id"] == "expiresoon" for ln in r["lines"]))
    destroyed = sum(1 for r in rows if r["figures"]["destroyed"])
    parts = [
        f"{t['invoices']} tax invoices" if t["invoices"] else "",
        f"{listings} ExpireSoon listings" if listings else "",
        f"kirana order logs for {money.fmt.num(orders)} packs" if orders else "",
        f"{t['receipts']} food-bank receipts" if t["receipts"] else "",
        f"{destroyed} destruction certificates" if destroyed else "",
    ]
    return ", ".join(p for p in parts if p)


def brsr(rows: list[dict[str, Any]], t: dict[str, Any]) -> list[dict[str, Any]]:
    """BRSR Principle 6's waste rows for the period, in kilos: what was diverted from disposal (resold or donated) and
    what was destroyed when it expired at the godown, of the food and of its plastic packaging (SC-125), which goes
    where its pack goes"""
    if not rows:
        return []
    out = [
        {
            "cat": FOOD,
            "diverted": t["kg"],
            "resold": t["resoldKg"],
            "donated": t["donatedKg"],
            "disposed": t["destroyedKg"],
            "evidence": _evidence(rows, t),
        }
    ]
    if t["packResoldKg"] + t["packDonatedKg"] + t["packDestroyedKg"] > 0:
        skus = len({r["sku"] for r in rows})
        out.append(
            {
                "cat": PLASTIC,
                "diverted": money.r2(t["packResoldKg"] + t["packDonatedKg"]),
                "resold": t["packResoldKg"],
                "donated": t["packDonatedKg"],
                "disposed": t["packDestroyedKg"],
                "evidence": f"{skus} SKUs' packaging weights (indicative), on the same papers",
            }
        )
    return out


def _weeks(rows: list[dict[str, Any]], start: date) -> list[list[Any]]:
    """the quarter's 13 weeks (the last takes its odd day or two): what was recovered, and what the same batches would
    have cost to destroy"""
    out = [[f"W{i + 1}", 0.0, 0.0] for i in range(13)]
    for r in rows:
        i = min((date.fromisoformat(r["cleared"]) - start).days // 7, 12)
        out[i][1] = money.r2(out[i][1] + r["figures"]["net"])
        out[i][2] = money.r2(out[i][2] + r["figures"]["writeOff"])
    return out


def _months(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: dict[str, list[dict[str, Any]]] = {}
    for r in rows:
        out.setdefault(r["cleared"][:7], []).append(r)
    return [
        {"month": k, "label": f"{MONTH_NAMES[int(k[5:]) - 1]} {k[:4]}", "totals": totals(v)}
        for k, v in sorted(out.items())
    ]


def period(
    pid: str, label: str, long: str, start: date, end: date, rows: list[dict[str, Any]], *, current: bool, kind: str
) -> dict[str, Any]:
    inside = [r for r in rows if start.isoformat() <= r["cleared"] <= end.isoformat()]
    t = totals(inside)
    return {
        "id": pid,
        "kind": kind,
        "label": label,
        "long": long,
        "from": start.isoformat(),
        "to": end.isoformat(),
        "current": current,
        "totals": t,
        "months": _months(inside),
        "weeks": _weeks(inside, start) if kind == "quarter" else [],
        "mix": _mix(inside),
        "mixNames": MIX,
        "brsr": brsr(inside, t),
    }


def periods(rows: list[dict[str, Any]], today: date) -> list[dict[str, Any]]:
    """every quarter from the first batch cleared to today's, then each financial year so far"""
    first = min((date.fromisoformat(r["cleared"]) for r in rows), default=today)
    fy, q = fy_of(first), quarter_of(first)
    now = (fy_of(today), quarter_of(today))
    out, years = [], []
    while (fy, q) <= now:
        start, end = quarter_span(fy, q)
        current = (fy, q) == now
        span = f"{MONTHS[start.month - 1]} to {MONTHS[end.month - 1]} {end.year}"
        out.append(
            period(
                f"fy{fy % 100:02d}-q{q}",
                f"Q{q} FY{fy % 100:02d}",
                span + (" · so far" if current else ""),
                start,
                end,
                rows,
                current=current,
                kind="quarter",
            )
        )
        if fy not in years:
            years.append(fy)
        fy, q = (fy, q + 1) if q < 4 else (fy + 1, 1)
    for y in years:
        start, end = date(y - 1, 4, 1), date(y, 3, 31)
        current = y == now[0]
        name = f"FY {y - 1}-{y % 100:02d}"
        out.append(
            period(
                f"fy{y % 100:02d}",
                "This year" if current else name,
                f"{name} so far" if current else name,
                start,
                end,
                rows,
                current=current,
                kind="year",
            )
        )
    return out
