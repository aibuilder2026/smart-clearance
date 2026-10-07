"""The deterministic checks each eval case is scored by: what can be decided without a judge (field accuracy, figures
outside the computed ones, the reserve, length limits, the facts a text must hold). Each returns its scores (0 or 1,
or a count) and the problems found; the pass marks over a whole set are in run.py."""

import re
from typing import Any

from sc_agents import checks
from sc_agents.agents import data, lister, outreach, router, valuer, vision

FIELDS = ("batch", "mfg", "bestBefore", "mrp")
INTERNAL = re.compile(r"\b(reserve|floor|minimum price|lowest price|write[- ]?off|loss|margin|cost price)\b", re.I)


def _accepts(truth: dict[str, Any], field: str) -> list[Any]:
    """what a field may be read as: its truth, or (where the print itself is ambiguous) a list of readings"""
    t = truth.get(field)
    return list(t) if isinstance(t, list) else [t]


def score_vision(case: dict[str, Any], out: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    read = vision.tidy(out) if out else vision.tidy({})
    truth, expect = case["truth"], case["expect"]
    right = {f: read.get(f) in _accepts(truth, f) for f in FIELDS}
    wrong = [f for f in FIELDS if read.get(f) is not None and read.get(f) not in _accepts(truth, f)]
    confident = read["confidence"] >= 0.9
    problems = []
    if expect == "exact":
        ok = all(right.values())
    elif expect in ("no-date", "no-batch"):
        field = "bestBefore" if expect == "no-date" else "batch"
        ok = read.get(field) is None and not confident and not wrong
    else:  # unreadable
        ok = not confident and not wrong
    if wrong:
        problems.append(f"wrong {', '.join(f'{f}={read.get(f)!r}' for f in wrong)}")
    if confident and wrong:
        problems.append("a confident wrong read")
    return {
        "fields": sum(right.values()) / len(FIELDS),
        "exact": int(all(right.values())),
        "confidentWrong": int(confident and bool(wrong)),
        "confidence": read["confidence"],
        "pass": int(ok),
    }, problems


def _canon(columns: dict[str, str]) -> dict[str, str]:
    """a distributor by its id or its name is one column: the loader reads either (data.World)"""
    return {("distributor" if t in data.DISTRIBUTOR else t): s for t, s in columns.items()}


def score_data(case: dict[str, Any], out: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    expect = case["expect"]
    m = next(iter(out.get("files") or []), {}) if out else {}
    columns = _canon({t: s for t, s in (m.get("columns") or {}).items() if s in case["header"]})
    wanted = _canon(expect["columns"])
    missing = {"distributor" if t in data.DISTRIBUTOR else t for t in expect["missing"]}
    problems = []
    if m.get("kind") != expect["kind"]:
        problems.append(f"kind {m.get('kind')!r}, not {expect['kind']!r}")
    for t, s in wanted.items():
        if columns.get(t) != s:
            problems.append(f"{t} → {columns.get(t)!r}, not {s!r}")
    for t, s in columns.items():
        if t not in wanted:
            problems.append(f"{s!r} mapped to {t}" + (", which the file does not have" if t in missing else ""))
    flagged = set(m.get("unknown") or [])
    unflagged = [u for u in expect["unknown"] if u not in flagged and u not in columns.values()]
    if unflagged:
        problems.append(f"not flagged: {', '.join(unflagged)}")
    required = [t for t in data.REQUIRED[expect["kind"]] if t in wanted]
    return {
        "kind": int(m.get("kind") == expect["kind"]),
        "requiredMapped": sum(1 for t in required if columns.get(t) == wanted[t]) / max(1, len(required)),
        "unknownFlagged": int(not unflagged),
        "noInvented": int(not any(t in columns for t in missing)),
        "pass": int(not problems),
    }, problems


def score_valuer(case: dict[str, Any], out: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    f = valuer.facts(case["preview"], case["history"])
    notes = valuer.as_map((out or {}).get("notes"))
    kept, dropped = valuer.keep(notes, f)
    ids = [c["id"] for c in f["channels"]]
    problems = []
    if dropped:
        problems.append(f"left out: {', '.join(dropped)}")
    missing = [i for i in ids if i not in kept]
    if missing:
        problems.append(f"no note for {', '.join(missing)}")
    foreign = sorted({n for v in notes.values() for n in checks.foreign(str(v), valuer.allowed(f))})
    return {
        "everyChannel": int(not missing),
        "noForeignFigure": int(not foreign),
        "pass": int(not problems),
    }, problems + ([f"figures outside the table: {foreign}"] if foreign else [])


def score_router(case: dict[str, Any], out: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    preview = case["preview"]
    allowed = [v for _, v, _ in router.quotable(preview)]
    text = " ".join(str((out or {}).get("explanation") or "").split())
    problems = []
    if not router.check(text, allowed):
        problems.append(f"fails the figures check: {checks.foreign(text, allowed)}" if text else "no explanation")
    words = {
        "kirana": "kirana",
        "expiresoon": "expiresoon",
        "staff": "staff",
        "foodbank": "food bank",
        "writeoff": "writ",
    }
    lines = preview["plan"]["lines"]
    unnamed = [
        ln["id"]
        for ln in lines
        if words.get(ln["id"], ln["id"]) not in text.lower().replace("expire soon", "expiresoon")
    ]
    if unnamed:
        problems.append(f"does not name {', '.join(unnamed)}")
    return {
        "figures": int(router.check(text, allowed)),
        "namesTheSplit": int(not unnamed),
        "length": len(text),
        "pass": int(not problems),
    }, problems


def score_lister(case: dict[str, Any], out: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    from sc_agents.evals.harness import lot_case

    f = lister.facts(lot_case(case["case"]), case["line"])
    words = lister.check(out or {}, f)
    text = f"{(out or {}).get('title', '')} {(out or {}).get('description', '')}"
    problems = []
    if words is None:
        problems.append("fails the length or figures check")
    if checks.shows(text, case["reserve"]):
        problems.append("quotes the reserve")
    if INTERNAL.search(text):
        problems.append(f"internal words: {INTERNAL.search(text).group(0)}")
    for fact in (str(f["packs"]), f["city"], f["bestBefore"]):
        if fact and fact not in text:
            problems.append(f"leaves out {fact}")
    return {
        "checks": int(words is not None),
        "nothingInternal": int(not INTERNAL.search(text)),
        "pass": int(not problems),
    }, problems


def score_outreach(case: dict[str, Any], out: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    from sc_agents.evals.harness import lot_case

    f = outreach.facts(lot_case(case["case"]), case["settings"])
    kept = outreach.check(out or {}, f)
    problems = [f"{lang} fails the checks" for lang in outreach.LANGUAGES if lang not in kept]
    scheme = f["scheme"]
    for lang, text in kept.items():
        if str(scheme["buyPackets"]) not in text or str(scheme["freePackets"]) not in text:
            problems.append(f"{lang} leaves out the scheme")
        if str(f["offerLastsHours"]) not in text:
            problems.append(f"{lang} leaves out the hours")
        if INTERNAL.search(text) or "₹" in text:
            problems.append(f"{lang} quotes money or internal words")
    devanagari = all(re.search(r"[ऀ-ॿ]", kept.get(lang, "")) for lang in ("hi", "mr") if lang in kept)
    if not devanagari:
        problems.append("Hindi or Marathi not in Devanagari")
    return {"languages": len(kept) / 3, "pass": int(not problems)}, problems


def score_negotiator(
    case: dict[str, Any], out: dict[str, Any], state: dict[str, Any]
) -> tuple[dict[str, Any], list[str]]:
    text = " ".join(str((out or {}).get("reply") or "").split())
    problems = []
    # a price the reply may state gives nothing away when it happens to be the reserve: money.counter can decide the
    # reserve itself (backend-api's reply_ok holds the same), so it leaks only as a figure the reply may not quote
    may = [state["bid_decided"], *state["bid_others"]] if case["type"] == "bid" else state["chat_allowed"]
    leaked = checks.shows(text, case["reserve"]) and not any(abs(p - case["reserve"]) < 0.005 for p in may)
    if leaked:
        problems.append("the reserve leaked")
    if case["type"] == "bid":
        ok = checks.reply_ok(text, decided=state["bid_decided"], others=state["bid_others"], reserve=case["reserve"])
        other_prices = [
            n
            for n in checks.rupees(text)
            if abs(n - state["bid_decided"]) > 0.005 and abs(n - state["bid_others"][0]) > 0.005
        ]
    else:
        ok = checks.check_numbers(text, state["chat_allowed"])
        other_prices = [n for n in checks.rupees(text) if abs(n - state["chat_allowed"][0]) > 0.005]
    if not text:
        problems.append("no reply")
    elif not ok:
        pool = state.get("chat_allowed") or [state["bid_decided"], *state["bid_others"]]
        problems.append(f"fails the reply check: {checks.foreign(text, pool)}")
    if other_prices:
        problems.append(f"names another price: {other_prices}")
    return {
        "reserveKept": int(not leaked),
        "onlyTheDecidedPrice": int(not other_prices),
        "checks": int(ok),
        "pass": int(not problems),
    }, problems


def score(set_name: str, case: dict[str, Any], out: dict[str, Any], state: dict[str, Any]) -> tuple[dict, list[str]]:
    if set_name == "vision":
        return score_vision(case, out)
    if set_name == "data":
        return score_data(case, out)
    if set_name == "valuer":
        return score_valuer(case, out)
    if set_name == "router":
        return score_router(case, out)
    if set_name == "lister":
        return score_lister(case, out)
    if set_name == "outreach":
        return score_outreach(case, out)
    if set_name == "negotiator":
        return score_negotiator(case, out, state)
    raise ValueError(set_name)
