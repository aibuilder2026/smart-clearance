"""The money rules, ported from design3/core/money.js (SC-71): every figure the workspace shows is worked out here,
from the journey map's rules (docs/dobara-journey-map.html v4.1, "Channels" and "Money and tax, worked through").

It is a faithful port, figure for figure. tests/test_money.py holds it to money.js's own answers, which
frontend/scripts/seed.mjs writes into reference/money.json with their inputs. What that takes:

- JavaScript's arithmetic. Math.round takes halves toward +infinity (`js_round`), a zero divisor gives Infinity or NaN
  (`_div`), a missing field reads as NaN (`_num`), and sums add left to right (Python's sum() compensates).
- Outputs are dicts with money.js's own keys (camelCase), so the API can return them as they are, through `jsonable`:
  JSON.stringify writes Infinity and NaN as null, and so does it.
- A client's own values (disposal, EPR, van, token, floors, the scheme, the reserve and so on) come in as `rules`,
  which defaults to `RULES`; `rules_with` lays a client's values over the defaults. The Watcher can judge a batch by
  SC-47's effective gates: `assess(..., gates=...)` takes a gate list, or `domain.gates.Effective`.
- Formatting is en-IN's, by hand rather than from the OS locale: Indian digit grouping (12,34,567), and ICU's
  rounding, which rounds the shortest decimal that reads back as the number (1.005 → "1.01"), unlike toFixed, which
  rounds the exact binary value (1.005 → "1.00").
"""

import math
from collections.abc import Mapping, Sequence
from datetime import UTC, date, datetime
from decimal import ROUND_HALF_UP, Context, Decimal
from typing import Any

from sc_api.domain.gates import Effective
from sc_api.domain.gates import checks as gate_checks

Obj = Mapping[str, Any]

RULES: dict[str, Any] = {
    "projectionStopDays": 7,  # retailers will not take stock in the last week
    "gates": {
        "blinkit": {"label": "Blinkit", "minDays": 90},
        "zepto": {"label": "Zepto", "pctLife": 0.6},
        "instamart": {"label": "Instamart", "pctLife": 0.6},
    },
    "disposalPerUnit": 1.5,  # indicative, editable in setup
    "eprPerKg": 6,  # indicative, editable in setup
    "co2PerKg": 2.5,  # indicative
    "vanPerUnit": 0.5,  # kirana delivery; a planning assumption, editable in setup
    "listingFee": 100,  # ExpireSoon, after the first five free listings (Rakesh has used his)
    "foodbankHandlingPerUnit": 0.5,
    "tokenPct": 0.15,  # ExpireSoon bid token
    # scheme volume on top of normal sales; no shop over 4x its own 14-day sales
    "kiranaWindowDays": 14,
    "kiranaUplift": 3.5,
    "shopCapTimes": 4,
    "scheme": {"buy": 10, "free": 2},  # a kirana pays the pack price for 10 and gets 2 free
    "staffCap": 50,  # a staff sale at the distributor's godown, unless the godown sets its own cap
    "returnWindowDays": 20,  # scheme packs can go back to the distributor until 20 days before best-before
    "floors": {"snacks": 0.35, "biscuits": 0.35, "staples": 0.40, "beverages": 0.30, "personal-care": 0.40},
    "ewayThreshold": 50000,
    "negotiation": {"reservePerUnit": 13.5, "counterPctOfAsk": 0.95},
}

# the exits for a distributor's stock. Discount D2C is only for a manufacturer's own warehouse stock, so it is not here.
CHANNELS: list[dict[str, Any]] = [
    {
        "id": "expiresoon",
        "name": "ExpireSoon listing",
        "short": "ExpireSoon",
        "minDays": 30,
        "need": "30+ days",
        "pricePct": 0.5,
        "unlimited": True,
        "clears": "5–9 days",
        "icon": "shopping-bag",
    },
    {
        "id": "kirana",
        "name": "Kirana cluster push",
        "short": "Kirana cluster",
        "minDays": 20,
        "need": "20+ days",
        "pricePct": 0.6,
        "clears": "10–14 days",
        "icon": "store",
    },
    {
        "id": "staff",
        "name": "Staff sale",
        "short": "Staff sale",
        "minDays": 0,
        "need": "until best-before",
        "pricePct": 0.4,
        "clears": "2–3 days",
        "icon": "users",
    },
    {
        "id": "foodbank",
        "name": "Food bank donation",
        "short": "Food bank",
        "minDays": 15,
        "need": "15+ days, food",
        "pricePct": 0,
        "unlimited": True,
        "clears": "1–2 days",
        "icon": "heart-handshake",
        "foodOnly": True,
    },
    {
        "id": "writeoff",
        "name": "Write-off (destroy)",
        "short": "Write-off",
        "minDays": 0,
        "need": "—",
        "pricePct": 0,
        "unlimited": True,
        "clears": "—",
        "icon": "trash-2",
        "baseline": True,
    },
]

GATE_LABELS = {"blinkit": "Blinkit", "zepto": "Zepto", "instamart": "Instamart"}
DAY = 86400000

# --- JavaScript's numbers


def js_round(x: float) -> Any:
    """Math.round: the nearest integer, halves toward +infinity (Python's round() takes halves to even). NaN and the
    infinities stay as they are."""
    if isinstance(x, int):
        return x
    if not math.isfinite(x):
        return x
    f = math.floor(x)
    return f + 1 if x - f >= 0.5 else f


def r2(n: float) -> float:
    """to the paisa, as money.js rounds: Math.round(n * 100) / 100"""
    return js_round(n * 100) / 100


def _div(a: float, b: float) -> float:
    """JavaScript's /: a zero divisor gives Infinity, or NaN for 0 / 0, where Python raises"""
    if b == 0:
        if a == 0 or a != a:
            return math.nan
        return math.copysign(math.inf, a) * math.copysign(1.0, b)
    return a / b


def _num(v: Any) -> Any:
    """a field JavaScript would read as undefined (or null, in a value that came back through JSON) does arithmetic
    as NaN"""
    return math.nan if v is None else v


def _get(o: Obj, key: str) -> Any:
    return _num(o.get(key))


def _nan(v: Any) -> bool:
    return isinstance(v, float) and v != v


def _max(*xs: float) -> Any:
    """Math.max: NaN if any argument is NaN"""
    return math.nan if any(_nan(x) for x in xs) else max(xs)


def _min(*xs: float) -> Any:
    return math.nan if any(_nan(x) for x in xs) else min(xs)


def _truthy(v: Any) -> bool:
    """a value as JavaScript's `if` reads it: 0, NaN, "", null and undefined are false"""
    return bool(v) and not _nan(v)


def _total(rows: Sequence[Obj], key: str) -> Any:
    """reduce((t, r) => t + r[key], 0): left to right, as JavaScript adds"""
    t: Any = 0
    for r in rows:
        t = t + r[key]
    return t


def js_str(x: Any) -> str:
    """String(number), as a template literal prints one: 58, 0.9, 1e+21, NaN"""
    if isinstance(x, bool):
        return "true" if x else "false"
    if isinstance(x, int):
        if abs(x) < 2**53:
            return str(x)
        x = float(x)
    if math.isnan(x):
        return "NaN"
    if math.isinf(x):
        return "Infinity" if x > 0 else "-Infinity"
    if x == 0:
        return "0"
    t = Decimal(repr(abs(x))).as_tuple()
    digits = "".join(map(str, t.digits))
    n = len(digits) + int(t.exponent)  # the value is 0.<digits> x 10^n
    digits = digits.rstrip("0")
    k = len(digits)
    sign = "-" if x < 0 else ""
    if k <= n <= 21:
        return sign + digits + "0" * (n - k)
    if 0 < n <= 21:
        return sign + digits[:n] + "." + digits[n:]
    if -6 < n <= 0:
        return sign + "0." + "0" * -n + digits
    e = n - 1
    return sign + digits[0] + ("." + digits[1:] if k > 1 else "") + "e" + ("+" if e >= 0 else "-") + str(abs(e))


_CTX = Context(prec=1000, rounding=ROUND_HALF_UP)


def to_fixed(x: float, places: int) -> str:
    """Number.prototype.toFixed: the exact binary value, rounded half up (1.005 → "1.00", 0.125 → "0.13")"""
    x = float(x)
    if not math.isfinite(x) or abs(x) >= 1e21:
        return js_str(x)
    d = Decimal(abs(x)).quantize(Decimal(1).scaleb(-places), context=_CTX)
    return ("-" if x < 0 else "") + f"{d:f}"


def _group(whole: str) -> str:
    """Indian digit grouping: the last three digits, then twos (12,34,56,789)"""
    if len(whole) <= 3:
        return whole
    head, tail = whole[:-3], whole[-3:]
    pairs: list[str] = []
    while len(head) > 2:
        pairs.insert(0, head[-2:])
        head = head[:-2]
    return ",".join([head, *pairs, tail])


def to_locale(x: float, *, min_fd: int = 0, max_fd: int = 3) -> str:
    """Number.prototype.toLocaleString("en-IN", { minimumFractionDigits, maximumFractionDigits }), as ICU does it: the
    shortest decimal that reads back as the number, rounded half away from zero, grouped 12,34,567. Negative zero
    keeps its sign ("-0")."""
    x = float(x)
    if math.isnan(x):
        return "NaN"
    neg = x < 0 or (x == 0 and math.copysign(1.0, x) < 0)
    if math.isinf(x):
        return ("-" if neg else "") + "∞"
    d = Decimal(repr(abs(x))).quantize(Decimal(1).scaleb(-max_fd), context=_CTX)
    whole, _, frac = f"{d:f}".partition(".")
    frac = frac.rstrip("0").ljust(min_fd, "0")
    return ("-" if neg else "") + _group(whole) + ("." + frac if frac else "")


def jsonable(v: Any) -> Any:
    """a result as JSON.stringify writes it: Infinity and NaN as null, and whole numbers without a decimal point, so the
    API sends exactly what money.js would"""
    if isinstance(v, float):
        if not math.isfinite(v):
            return None
        return int(v) if v.is_integer() else v
    if isinstance(v, Mapping):
        return {k: jsonable(x) for k, x in v.items()}
    if isinstance(v, list | tuple):
        return [jsonable(x) for x in v]
    return v


def rules_with(overrides: Obj | None = None) -> dict[str, Any]:
    """RULES with a client's own values laid over them; the nested groups (gates, floors, scheme, negotiation) merge
    key by key"""

    def merge(base: Obj, over: Obj) -> dict[str, Any]:
        out = dict(base)
        for k, v in over.items():
            b = base.get(k)
            out[k] = merge(b, v) if isinstance(v, Mapping) and isinstance(b, Mapping) else v
        return out

    return merge(RULES, overrides or {})


# --- the rules


def _ms(v: Any) -> float:
    """Date.parse: a date alone is UTC midnight"""
    d = v if isinstance(v, datetime) else datetime.fromisoformat(v.isoformat() if isinstance(v, date) else v)
    if d.tzinfo is None:
        d = d.replace(tzinfo=UTC)
    return d.timestamp() * 1000


def life_of(batch: Obj | None, sku: Obj) -> Any:
    """a batch's own shelf life, from the dates on its label when it has them"""
    if batch and batch.get("mfg") and batch.get("bestBefore"):
        return js_round((_ms(batch["bestBefore"]) - _ms(batch["mfg"])) / DAY)
    return _get(sku, "lifeDays")


def itc_of(sku: Obj) -> Any:
    """input GST in each pack, from the cost sheet; reversed if the pack is destroyed or given away"""
    if sku.get("itcPerUnit") is not None:
        return sku["itcPerUnit"]
    return r2(_get(sku, "cost") * _get(sku, "gst"))


def gates(batch: Obj, sku: Obj, *, rules: Obj = RULES) -> list[dict[str, Any]]:
    """the quick-commerce gates by money.js's rule: Blinkit by days left, Zepto and Instamart by a share of the batch's
    life, rounded to days. `rules["gates"]` may be a client's own."""
    return _gates(batch, sku, rules)


def _gates(batch: Obj, sku: Obj, rules: Obj) -> list[dict[str, Any]]:
    life = life_of(batch, sku)
    has = _get(batch, "daysLeft")
    out = []
    for gid, g in rules["gates"].items():
        if g.get("minDays") is not None:
            need = g["minDays"]
            rule = f"needs {js_str(need)}+ days"
        else:
            need = js_round(life * g["pctLife"])
            pct = js_str(js_round(g["pctLife"] * 100))
            rule = f"needs {pct}% of a {js_str(life)}-day life ({js_str(need)} days)"
        label = g.get("label") or GATE_LABELS.get(gid, gid)
        out.append({"id": gid, "app": label, "need": need, "has": has, "pass": has >= need, "rule": rule})
    return out


def effective_gates(batch: Obj, sku: Obj, e: Effective) -> list[dict[str, Any]]:
    """the gates in money.js's shape for SC-47's effective gates (domain/gates.py: the batch's override, else the SKU's,
    else the client's default). Each passes or fails exactly as the console and sc.batch_gates decide: Blinkit by days
    left, Zepto and Instamart when days x 100 >= share x the SKU's life. `need` is the fewest days that pass."""
    life = sku["lifeDays"]
    days = batch["daysLeft"]
    passed = {c["app"]: c["pass"] for c in gate_checks(e, days_left=days, life_days=life)}
    qcom_need = -(-e.qcom_pct * life // 100)
    out = []
    for gid, label in GATE_LABELS.items():
        if gid == "blinkit":
            need, rule = e.blinkit_days, f"needs {e.blinkit_days}+ days"
        else:
            need, rule = qcom_need, f"needs {e.qcom_pct}% of a {life}-day life ({qcom_need} days)"
        out.append({"id": gid, "app": label, "need": need, "has": days, "pass": passed[gid], "rule": rule})
    return out


def assess(
    batch: Obj, sku: Obj, *, gates: Sequence[Obj] | Effective | None = None, rules: Obj = RULES
) -> dict[str, Any]:
    """the Watcher's reading of a batch: what will sell before retailers stop taking it, what is at risk, and whether
    the quick-commerce gates leave it blocked. `gates` is the batch's gate list (or SC-47's effective gates, which
    `effective_gates` turns into one); without it, money.js's own."""
    if gates is None:
        g = _gates(batch, sku, rules)
    elif isinstance(gates, Effective):
        g = effective_gates(batch, sku, gates)
    else:
        g = [dict(x) for x in gates]
    life = life_of(batch, sku)
    days_left = _get(batch, "daysLeft")
    units = _get(batch, "units")
    usable_days = _max(0, days_left - rules["projectionStopDays"])
    will_sell = _min(units, _get(batch, "sellPerDay") * usable_days)
    at_risk = units - will_sell
    blocked = all(not x["pass"] for x in g)
    status = "at-risk" if at_risk > 0 and blocked else "gated" if any(not x["pass"] for x in g) else "safe"
    return {
        "gates": g,
        "life": life,
        "usableDays": usable_days,
        "willSell": will_sell,
        "atRisk": at_risk,
        "atRiskMRP": at_risk * _get(sku, "mrp"),
        "blocked": blocked,
        "status": status,
        "lifeUsedPct": js_round((1 - _div(days_left, life)) * 100),
        "urgency": _max(0, _min(1, 1 - _div(days_left, life))),
    }


def write_off(units: float, sku: Obj, *, rules: Obj = RULES) -> dict[str, Any]:
    """what destroying costs, per the journey map: stock at cost + input credit reversed + disposal + EPR on the
    kilos"""
    stock = units * _get(sku, "cost")
    itc = r2(units * itc_of(sku))
    disposal = units * rules["disposalPerUnit"]
    kg = r2(units * _get(sku, "kgPerUnit"))
    epr = r2(kg * rules["eprPerKg"])
    total = r2(stock + itc + disposal + epr)
    return {
        "units": units,
        "stock": stock,
        "itc": itc,
        "itcPerUnit": itc_of(sku),
        "disposal": disposal,
        "kg": kg,
        "epr": epr,
        "total": total,
        "perUnit": r2(_div(total, units)),
    }


def channel_table(
    batch: Obj, sku: Obj, units: float, *, floors: Obj | None = None, rules: Obj = RULES
) -> list[dict[str, Any]]:
    """each exit for the batch: its price, its costs and lost input credit per pack, what it nets, how much it can
    take, and whether the batch may go there. `floors` (a client's price floors by category) defaults to
    `rules["floors"]`."""
    wo = write_off(units, sku, rules=rules)
    sell = _get(batch, "sellPerDay")
    days_left = _get(batch, "daysLeft")
    floors = rules["floors"] if floors is None else floors
    scheme = rules["scheme"]
    rows = []
    for c in CHANNELS:
        baseline = bool(c.get("baseline"))
        price = r2(_get(sku, "mrp") * c["pricePct"])
        cost_per_unit: Any = 0
        itc_loss: Any = 0
        capacity: Any = math.inf
        reason = ""
        name = c["name"]
        pack_price = None
        if c["id"] == "kirana":
            cost_per_unit = rules["vanPerUnit"]
            capacity = js_round(sell * rules["kiranaWindowDays"] * rules["kiranaUplift"])
            pack_price = r2(price * (scheme["buy"] + scheme["free"]) / scheme["buy"])
        if c["id"] == "staff":
            capacity = batch.get("staffCap") or rules["staffCap"]
            if batch.get("city"):
                name = f"{batch['city']} staff sale"
        # a donation is a gift: handling, and the input credit on it is reversed (s.17(5)(h), and 17(5)(fa) for CSR)
        if c["id"] == "foodbank":
            cost_per_unit = rules["foodbankHandlingPerUnit"]
            itc_loss = itc_of(sku)
        net = -wo["perUnit"] if baseline else r2(price - cost_per_unit - itc_loss)
        eligible = True
        if not baseline and days_left < c["minDays"]:
            eligible = False
            reason = f"needs {js_str(c['minDays'])}+ days, has {js_str(days_left)}"
        if c.get("foodOnly") and sku.get("category") == "personal-care":
            eligible = False
            reason = "personal care never goes to food banks"
        floor = floors.get(sku.get("category")) or 0.35
        if not baseline and c["id"] != "foodbank" and c["pricePct"] < floor:
            eligible = False
            reason = f"below the {js_str(js_round(floor * 100))}% floor"
        rows.append(
            {
                **c,
                "name": name,
                "price": price,
                "packPrice": pack_price,
                "pricePctLabel": f"{js_str(js_round(c['pricePct'] * 100))}%" if _truthy(c["pricePct"]) else "—",
                "costPerUnit": cost_per_unit,
                "itcLoss": itc_loss,
                "net": net,
                "capacity": capacity,
                "eligible": eligible,
                "reason": reason,
                "itc": "reversed" if c["id"] == "foodbank" or baseline else "retained",
            }
        )
    return rows


def _by_net(rows: Sequence[Obj]) -> list[Obj]:
    """the best-paying first; Array.prototype.sort is stable, as sorted() is, so ties keep their order"""
    return sorted(rows, key=lambda r: -r["net"])


def allocate(rows: Sequence[Obj], units: float) -> list[dict[str, Any]]:
    """fill the best-paying channel to its capacity, then the next; food bank before write-off"""
    order = _by_net([r for r in rows if r["eligible"] and not r.get("baseline")])
    left = units
    out: list[dict[str, Any]] = []
    for r in order:
        if left <= 0:
            break
        # a capacity that came back through JSON as null was Infinity
        cap = math.inf if r["capacity"] is None else r["capacity"]
        take = _min(left, cap)
        if take > 0:
            out.append({"id": r["id"], "units": take})
            left -= take
    if left > 0:
        out.append({"id": "writeoff", "units": left})
    return out


def _line(r: Obj, units: float, sku: Obj, rules: Obj) -> dict[str, Any]:
    """one exit's line of a plan: its units at the channel's price, less its costs and any input credit lost"""
    baseline = bool(r.get("baseline"))
    gross = 0 if baseline else r2(units * r["price"])
    cost = r2(units * r["costPerUnit"])
    if r["id"] == "expiresoon":
        cost = r2(cost + rules["listingFee"])
    itc_loss = 0 if baseline else r2(units * r["itcLoss"])
    # the scheme: kiranas are charged for 10 of every 12 packets at the pack price
    scheme = rules["scheme"]
    charged = js_round(units * scheme["buy"] / (scheme["buy"] + scheme["free"])) if _truthy(r["packPrice"]) else units
    return {
        "id": r["id"],
        "name": r["name"],
        "short": r["short"],
        "units": units,
        "price": r["price"],
        "packPrice": r["packPrice"],
        "charged": charged,
        "gross": gross,
        "cost": cost,
        "itcLoss": itc_loss,
        "net": r2(gross - cost - itc_loss),
        "cartons": _div(units, _get(sku, "perCarton")),
    }


def plan(batch: Obj, sku: Obj, *, floors: Obj | None = None, rules: Obj = RULES) -> dict[str, Any]:
    """the Router's split of what is at risk across the exits, with its money: gross, costs, net, the write-off it
    avoids, the P&L reading, the input credit kept and reversed, and the kilos and CO2e kept out of landfill"""
    a = assess(batch, sku, rules=rules)
    units = a["atRisk"]
    rows = channel_table(batch, sku, units, floors=floors, rules=rules)
    alloc = allocate(rows, units)
    lines = [_line(next(y for y in rows if y["id"] == x["id"]), x["units"], sku, rules) for x in alloc]
    gross = r2(_total(lines, "gross"))
    costs = r2(_total(lines, "cost"))
    itc_loss = r2(_total(lines, "itcLoss"))
    net = r2(gross - costs - itc_loss)
    wo = write_off(units, sku, rules=rules)
    leftover = _total([ln for ln in lines if ln["id"] == "writeoff"], "units")
    sold_units = _total([ln for ln in lines if ln["id"] not in ("foodbank", "writeoff")], "units")
    donated = _total([ln for ln in lines if ln["id"] == "foodbank"], "units")
    # the P&L reading: the stock leaves the books at cost either way, so it is counted once on each side
    cost_each = _get(sku, "cost")
    book_cost = r2(units * cost_each)
    leftover_cost = r2(leftover * (wo["perUnit"] - cost_each)) if _truthy(leftover) else 0
    pnl = r2(net - book_cost - leftover_cost)
    unlimited = [
        r for r in rows if r["eligible"] and r.get("unlimited") and not r.get("baseline") and r["id"] != "foodbank"
    ]
    best = _by_net(unlimited)[0] if unlimited else None
    alt = None
    if best is not None:
        fee = rules["listingFee"] if best["id"] == "expiresoon" else 0
        alt = {
            "id": best["id"],
            "short": best["short"],
            "label": f"all {to_locale(units)} to {best['short']}",
            "net": r2(units * best["price"] - units * best["costPerUnit"] - fee),
        }
    kg = r2((units - leftover) * _get(sku, "kgPerUnit"))
    itc = itc_of(sku)
    return {
        "batch": batch.get("id"),
        "units": units,
        "rows": rows,
        "lines": lines,
        "gross": gross,
        "costs": costs,
        "itcLoss": itc_loss,
        "net": net,
        "pctMRP": js_round(_div(net, units * _get(sku, "mrp")) * 100),
        "writeOff": wo,
        "bookCost": book_cost,
        "pnl": pnl,
        "swing": r2(pnl + wo["total"]),
        "cashAvoided": r2(wo["total"] - wo["stock"]),
        "itcRetained": r2(sold_units * itc),
        "itcReversed": r2((donated + leftover) * itc),
        "disposalAvoided": r2(wo["disposal"] + wo["epr"]),
        "alt": alt,
        "kg": kg,
        "co2": r2(kg * rules["co2PerKg"]),
        "meals": meals_of(donated, sku),
        "soldUnits": sold_units,
        "donated": donated,
        "leftover": leftover,
    }


def meals_of(units: float, sku: Obj, rule: Obj | None = None) -> Any:
    """the meals a donation makes, by the food bank's own rule (SC-110, data.js SETUP.partners): a meal for every so
    many packs served, or for every so many kilos of food; without a rule, a pack a meal"""
    if rule and _truthy(rule.get("kg")):
        return math.floor(r2(units * _get(sku, "kgPerUnit")) / rule["kg"])
    return math.floor(units / ((rule or {}).get("packs") or 1))


def realised(
    p: Obj,
    sku: Obj,
    done: Mapping[str, float] | None,
    meals_rule: Obj | None = None,
    policy: str = "full-credit",
    *,
    rules: Obj = RULES,
) -> dict[str, Any]:
    """what a plan came to once its lines were done (SC-86): each line on the units its channel actually took (`done`:
    ordered by kiranas, awarded on ExpireSoon, sold to staff, collected by the food bank; a channel not in `done` took
    what was planned). What no channel took is left at the godown: nothing recovered, and it still faces the
    write-off. A plan done as planned comes back as it was. Its meals are counted by the rule of the food bank that
    collected (`meals_rule`, SC-110). The packs left at the godown follow the client's expiry `policy` (SC-122): under
    full credit they come back and the client destroys them, so their input credit is reversed and their disposal is
    the client's; otherwise the distributor destroys his own stock, and the client keeps its credit and avoids the
    disposal."""

    def took(ln: Obj) -> Any:
        if ln["id"] != "writeoff" and done and done.get(ln["id"]) is not None:
            return max(0, done[ln["id"]])
        return ln["units"]

    if all(took(ln) == ln["units"] for ln in p["lines"]):
        return {**p, "godown": 0, "destroyed": p["leftover"], "meals": meals_of(p["donated"], sku, meals_rule)}
    lines = [
        ln
        if took(ln) == ln["units"]
        else _line(next(r for r in p["rows"] if r["id"] == ln["id"]), took(ln), sku, rules)
        for ln in p["lines"]
    ]

    def units(keep: Any) -> Any:
        return _total([ln for ln in lines if keep(ln)], "units")

    gross = r2(_total(lines, "gross"))
    costs = r2(_total(lines, "cost"))
    itc_loss = r2(_total(lines, "itcLoss"))
    net = r2(gross - costs - itc_loss)
    godown = _max(0, p["units"] - units(lambda ln: True))
    sold_units = units(lambda ln: ln["id"] not in ("foodbank", "writeoff"))
    donated = units(lambda ln: ln["id"] == "foodbank")
    left = p["leftover"] + godown
    wo = p["writeOff"]
    left_cost = r2(left * (wo["perUnit"] - _get(sku, "cost"))) if _truthy(left) else 0
    pnl = r2(net - p["bookCost"] - left_cost)
    kg = r2((p["units"] - left) * _get(sku, "kgPerUnit"))
    itc = itc_of(sku)
    # what the client itself destroys: the plan's own write-off, and under full credit the packs that came back
    ours = policy == "full-credit"
    destroyed = p["leftover"] + (godown if ours else 0)
    spared = p["units"] - destroyed
    return {
        **p,
        "lines": lines,
        "gross": gross,
        "costs": costs,
        "itcLoss": itc_loss,
        "net": net,
        "pctMRP": js_round(_div(net, p["units"] * _get(sku, "mrp")) * 100),
        "pnl": pnl,
        "swing": r2(pnl + wo["total"]),
        "itcRetained": r2((sold_units + (0 if ours else godown)) * itc),
        "itcReversed": r2((donated + destroyed) * itc),
        "cashAvoided": r2(wo["total"] - wo["stock"] - destroyed * (wo["perUnit"] - _get(sku, "cost"))),
        "disposalAvoided": r2(
            spared * rules["disposalPerUnit"] + r2(spared * _get(sku, "kgPerUnit")) * rules["eprPerKg"]
        ),
        "kg": kg,
        "co2": r2(kg * rules["co2PerKg"]),
        "meals": meals_of(donated, sku, meals_rule),
        "soldUnits": sold_units,
        "donated": donated,
        "godown": godown,
        "destroyed": destroyed,
    }


def counter(ask: float, bid: float, *, rules: Obj = RULES) -> dict[str, Any]:
    """the Negotiator's answer to a bid: accept it, or counter at 95% of the ask (to the 10 paise below), never under
    the reserve"""
    n = rules["negotiation"]
    if bid >= ask:
        return {"action": "accept", "price": bid}
    # the reserve is the client's, a price a pack; on a lot asking less than it, the counter is the ask (SC-122)
    reserve = _min(n["reservePerUnit"], ask)
    price = _max(reserve, math.floor(ask * n["counterPctOfAsk"] * 10) / 10)
    if bid >= price:
        return {"action": "accept", "price": bid}
    return {"action": "counter", "price": price, "below": bid < reserve}


def award(units: float, price: float, *, rules: Obj = RULES) -> dict[str, Any]:
    """the ExpireSoon award: the bid's gross, the token paid up front, and the balance"""
    gross = r2(units * price)
    token = js_round(gross * rules["tokenPct"])
    return {"units": units, "price": price, "gross": gross, "token": token, "balance": r2(gross - token)}


def invoice(units: float, price: float, sku: Obj) -> dict[str, Any]:
    """the buyer's tax invoice for an ExpireSoon award, as the papers draft it (documents): the taxable value, the IGST
    rounded to the rupee (CGST s.170), its rate, the round-off line and the total. The buyer's bill shows it from the
    award on, before Paperwork has drafted the paper (SC-96)."""
    taxable = r2(units * price)
    igst = js_round(taxable * _get(sku, "gst"))
    exact = r2(taxable + igst)
    total = js_round(exact)
    return {
        "taxable": taxable,
        "igst": igst,
        "gstPct": js_round(_get(sku, "gst") * 100),
        "roundOff": r2(total - exact),
        "total": total,
    }


def actual_net(p: Obj, award_price: float) -> dict[str, Any]:
    """the plan's net once the ExpireSoon lot is awarded at its price"""
    es = next((ln for ln in p["lines"] if ln["id"] == "expiresoon"), None)
    if es is None:
        return {"net": p["net"], "delta": 0, "swing": p["swing"], "pnl": p["pnl"]}
    delta = r2(es["units"] * (es["price"] - award_price))
    return {
        "net": r2(p["net"] - delta),
        "delta": delta,
        "swing": r2(p["swing"] - delta),
        "pnl": r2(p["pnl"] - delta),
        "esPlanned": es["gross"],
        "esActual": r2(es["units"] * award_price),
    }


def price_support(p: Obj, sku: Obj, award_price: float | None = None, *, rules: Obj = RULES) -> dict[str, Any]:
    """the manufacturer's price-support credit note to the distributor who owns the stock: the gap between what he paid
    and what each channel fetched, plus the van and listing fee he paid, so he ends whole. A financial note, no GST
    adjustment. An SKU without a dealer price (`dp`) gives NaN, as in money.js."""
    dp = _get(sku, "dp")
    rows = []
    for ln in p["lines"]:
        if ln["id"] == "writeoff" or not ln["units"] > 0:
            continue
        price = award_price if ln["id"] == "expiresoon" and award_price is not None else ln["price"]
        rows.append(
            {
                "id": ln["id"],
                "short": ln["short"],
                "units": ln["units"],
                "price": price,
                "gap": r2(dp - price),
                "amount": r2(ln["units"] * (dp - price)),
            }
        )
    gap = r2(_total(rows, "amount"))
    paid = [ln for ln in p["lines"] if ln["id"] in ("kirana", "expiresoon")]
    van = r2(_total([ln for ln in paid if ln["id"] == "kirana"], "cost"))
    fee = rules["listingFee"] if any(ln["id"] == "expiresoon" for ln in paid) else 0
    return {"rows": rows, "gap": gap, "van": van, "fee": fee, "total": r2(gap + van + fee)}


def expiry_settlement(units: float, sku: Obj, policy: str, *, rules: Obj = RULES) -> dict[str, Any]:
    """the packs left at the godown on expiry day, settled by the client's expiry policy (SC-94; money.js
    expirySettlement). Full credit: they come back for the dealer price, and the client destroys them, paying disposal
    and EPR and reversing the GST credit. Price support: the client pays the distributor the gap to what he paid (they
    fetched nothing, so the dealer price), and he destroys them. No returns: the distributor's loss"""
    wo = write_off(units, sku, rules=rules)
    dp = _get(sku, "dp")
    credit: Any = 0 if policy == "none" or not units else (None if dp is None or _nan(dp) else r2(units * dp))
    ours = policy == "full-credit" and units > 0
    disposal, epr, itc = (wo["disposal"], wo["epr"], wo["itc"]) if ours else (0, 0, 0)
    return {
        "policy": policy,
        "units": units,
        "credit": credit,
        "destroyedBy": ("client" if ours else "distributor") if units else None,
        "kg": wo["kg"],
        "disposal": disposal,
        "epr": epr,
        "itc": itc,
        "total": r2((credit or 0) + disposal + epr + itc),
    }


def expiry_claim(units: float, sku: Obj, *, rules: Obj = RULES) -> dict[str, Any]:
    """what the distributor would claim at expiry, and what destroying it then costs the manufacturer on top"""
    wo = write_off(units, sku, rules=rules)
    credit = r2(units * _get(sku, "dp"))
    return {
        "units": units,
        "credit": credit,
        "disposal": wo["disposal"],
        "epr": wo["epr"],
        "itc": wo["itc"],
        "total": r2(credit + wo["disposal"] + wo["epr"] + wo["itc"]),
    }


def receipt(units: float, sku: Obj, partner: Obj, facts: Obj) -> dict[str, Any]:
    """the food bank's receipt for the packs it collected (SC-110), in its own form (data.js SETUP.partners: Feeding
    India's in-app receipt, India FoodBanking Network's acknowledgement): the packs, their weight and the meals by its
    own rule, and on a CSR acknowledgement their value at the donor's cost (indicative). `facts` are the collection's:
    the number from the food bank's series, the day (ISO) and the time, who collected, the donor and its FSSAI licence,
    the distributor it came through and from where, and where it is served"""
    r = partner["receipt"]
    return {
        "id": "receipt",
        "type": r["title"],
        "owner": partner["name"],
        "no": facts["no"],
        "status": "generated",
        "amount": 0,
        "paper": partner["paper"],
        "stamp": r["stamp"],
        "units": units,
        "kg": r2(units * _get(sku, "kgPerUnit")),
        "meals": meals_of(units, sku, partner["meals"]),
        "mealsRule": partner["meals"]["rule"],
        "value": r2(units * _get(sku, "cost")) if _truthy(r.get("csr")) else None,
        "csr": r.get("csr") or None,
        "date": facts.get("date"),
        "at": facts.get("at"),
        "by": facts.get("by"),
        "donor": facts.get("donor"),
        "fssai": facts.get("fssai"),
        "via": facts.get("via"),
        "from": facts.get("from"),
        "spot": facts.get("spot"),
        "note": r["note"],
    }


def documents(
    p: Obj,
    sku: Obj,
    aw: Obj | None,
    support: Obj,
    parties: Obj,
    rcpt: Obj | None = None,
    *,
    numbers: Mapping[str, str],
    rules: Obj = RULES,
) -> list[dict[str, Any]]:
    """the batch's paperwork: the buyer's tax invoice and the e-way bill check (once ExpireSoon is awarded), the
    price-support credit note, the ITC memo, the FSSAI checklist, the food bank's receipt for a donated batch (SC-110)
    and the destruction certificate. money.js numbers the story's invoice and credit note itself; here they are
    `numbers["invoice"]` and `numbers["support"]`."""
    es = next((ln for ln in p["lines"] if ln["id"] == "expiresoon"), None)
    seller, client = parties["seller"], parties["client"]
    docs: list[dict[str, Any]] = []
    if es is not None and aw:
        # tax is rounded to the rupee (CGST s.170); the invoice total takes a round-off line
        inv = invoice(aw["units"], aw["price"], sku)
        total = inv["total"]
        docs.append(
            {
                "id": "invoice",
                "type": "Tax invoice",
                "owner": seller["name"],
                "no": numbers["invoice"],
                "status": "drafted",
                "amount": total,
                "taxable": inv["taxable"],
                "igst": inv["igst"],
                "roundOff": inv["roundOff"],
                "total": total,
                "units": aw["units"],
                "price": aw["price"],
                "from": seller,
                "to": parties["buyer"],
                "hsn": sku.get("hsn"),
                "gstPct": inv["gstPct"],
                "note": f"Drafted for {seller.get('short') or seller['name']} to issue from Tally.",
            }
        )
        threshold = rules["ewayThreshold"]
        docs.append(
            {
                "id": "eway",
                "type": "E-way bill check",
                "owner": seller["name"],
                "no": p["batch"],
                "status": "not required" if total < threshold else "generated",
                "amount": total,
                "note": f"The consignment is ₹{to_locale(total)} with GST, "
                f"under the ₹{to_locale(threshold)} threshold. Checked again if the dispatch is split.",
            }
        )
    exact = _num(support["total"])
    total = js_round(exact)
    docs.append(
        {
            "id": "support",
            "type": "Price-support credit note",
            "owner": client["short"],
            "no": numbers["support"],
            "status": "generated",
            "amount": total,
            "exact": exact,
            "roundOff": r2(total - exact),
            "rows": support["rows"],
            "van": support["van"],
            "fee": support["fee"],
            "note": f"{client['short']} to {seller['name']}: a financial credit note, no GST adjustment.",
        }
    )
    # the credit kept on what was sold under tax invoices, and reversed on what was given away or destroyed (SC-122)
    away = p["donated"] + (p["destroyed"] if p.get("destroyed") is not None else p["leftover"])
    docs.append(
        {
            "id": "itc",
            "type": "GST ITC memo",
            "owner": client["short"],
            "no": "s.17(5)(h)",
            "status": "generated",
            "amount": p["itcRetained"],
            "reversed": p.get("itcReversed") or 0,
            "units": p["soldUnits"],
            "away": away,
            "note": (
                f"Kept on the {to_locale(p['soldUnits'])} packs sold under tax invoices; reversed under Section "
                f"17(5)(h) on the {to_locale(away)} given away or destroyed, in GSTR-3B Table 4(B)(1)."
                if _truthy(p.get("itcReversed"))
                else "Goods supplied under tax invoices, so the Section 17(5)(h) reversal does not apply."
            ),
        }
    )
    donated = p["donated"]
    # the packs the client destroys: the plan's write-off, and under full credit those left at the godown (SC-122)
    destroyed = p["destroyed"] if p.get("destroyed") is not None else p["leftover"]
    docs.append(
        {
            "id": "fssai",
            "type": "FSSAI surplus-food checklist",
            "owner": client["short"],
            "no": f"{js_str(donated)} units" if _truthy(donated) else "no donation",
            "status": "generated" if _truthy(donated) else "not required",
            "amount": 0,
        }
    )
    if rcpt:
        docs.append(dict(rcpt))
    docs.append(
        {
            "id": "destruction",
            "type": "Destruction certificate",
            "owner": client["short"],
            "no": f"{js_str(destroyed)} units" if _truthy(destroyed) else "0 units left",
            "status": "generated" if _truthy(destroyed) else "not required",
            "amount": 0,
            "units": destroyed,
        }
    )
    return docs


# --- formatting: Indian digit grouping, rupees, lakhs

# en-IN's short months, as ICU (CLDR 48) writes them: "Sept", not "Sep"
MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec")


def _day(iso: str) -> date:
    return date.fromisoformat(iso)


class _Fmt:
    """money.js's fmt"""

    @staticmethod
    def num(n: float) -> str:
        r = js_round(n)
        # Math.round(-0.4) is -0, which toLocaleString writes as "-0"
        neg_zero = r == 0 and (n < 0 or (n == 0 and math.copysign(1.0, n) < 0))
        return to_locale(-0.0 if neg_zero else r)

    @staticmethod
    def inr(n: float) -> str:
        return ("−₹" if n < 0 else "₹") + to_locale(js_round(abs(n)))

    @staticmethod
    def inr2(n: float) -> str:
        return ("−₹" if n < 0 else "₹") + to_locale(abs(n), min_fd=2, max_fd=2)

    @staticmethod
    def signed(n: float) -> str:
        return ("−₹" if n < 0 else "+₹") + to_locale(js_round(abs(n)))

    @staticmethod
    def rate(n: float) -> str:
        return "₹" + to_fixed(n, 2)

    @staticmethod
    def lakh(n: float) -> str:
        return "₹" + to_locale(n / 100000, max_fd=1) + " L"

    @staticmethod
    def kg(n: float) -> str:
        return to_locale(n / 1000, max_fd=2) + " t" if n >= 1000 else to_locale(n, max_fd=1) + " kg"

    @staticmethod
    def pct(n: float) -> str:
        return js_str(js_round(n * 100)) + "%"

    @staticmethod
    def date(iso: str) -> str:
        d = _day(iso)
        return f"{d.day} {MONTHS[d.month - 1]} {d.year}"

    @staticmethod
    def day(iso: str) -> str:
        d = _day(iso)
        return f"{d.day} {MONTHS[d.month - 1]}"


fmt = _Fmt()
