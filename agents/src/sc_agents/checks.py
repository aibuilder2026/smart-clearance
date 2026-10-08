"""The checks a model's words must pass before they are sent, the same as backend-api holds them to
(backend-api/src/sc_api/domain/copy.py `check_numbers` and `reply_ok`), plus the agents' own: no reserve, nothing
internal, length limits. Words that fail are left out of the report, so backend-api's template stands in, and the run
says it fell back."""

import math
import re
from datetime import date, datetime
from typing import Any

FIGURE = re.compile(r"(?<![\w.])(\d[\d,]*(?:\.\d+)?)")
RUPEES = re.compile(r"(?:₹|\bRs\.?|\bINR)\s*(\d[\d,]*(?:\.\d+)?)", re.IGNORECASE)
MONTHS = {
    m: i for i, m in enumerate(("jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"), 1)
}
_MON = r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?"
DATES = re.compile(
    rf"\b\d{{1,2}}\s+{_MON}(?:,?\s+\d{{2,4}})?\b|\b{_MON}\s+\d{{1,2}}(?:,?\s+\d{{2,4}})?\b"
    r"|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
    re.IGNORECASE,
)


def _num(raw: str) -> float | None:
    try:
        return round(float(raw.replace(",", "").rstrip(".")), 2)
    except ValueError:
        return None


def figures(text: str) -> list[float]:
    """every figure written in a text, as a number"""
    return [n for n in (_num(r) for r in FIGURE.findall(text)) if n is not None]


def rupees(text: str) -> list[float]:
    """every amount written as money (₹5, Rs 12, INR 30)"""
    return [n for n in (_num(r) for r in RUPEES.findall(text)) if n is not None]


def _pool(allowed: list[float]) -> set[float]:
    return {round(float(a), 2) for a in allowed} | {float(math.floor(float(a) + 0.5)) for a in allowed}


def check_numbers(text: str, allowed: list[float]) -> bool:
    """whether every figure in a text is one of the computed ones, to the paisa or rounded to the rupee. Small whole
    counting numbers (under 10) are not figures (backend-api's rule), except as money: ₹5 is a price, and must be one
    of the computed ones (the agents' rule, stricter than backend-api's)"""
    pool = _pool(allowed)
    if not all(n in pool for n in rupees(text)):
        return False
    return all(n in pool or (n < 10 and float(n).is_integer()) for n in figures(text))


def foreign(text: str, allowed: list[float]) -> list[float]:
    """the figures a text quotes that are not among the allowed ones"""
    pool = _pool(allowed)
    money = set(rupees(text))
    return [n for n in figures(text) if not (n in pool or (n < 10 and float(n).is_integer() and n not in money))]


def states_price(text: str, price: float) -> bool:
    return f"{price:.2f}" in text or (float(price).is_integer() and f"₹{price:.0f}" in text)


def undated(text: str) -> str:
    """a text with its dates set aside (18 Nov 2026, Nov 18, 2026-11-18, 18/11/26): a date's day is not a price"""
    return DATES.sub(" ", text)


def shows(text: str, value: float) -> bool:
    """whether a text quotes a figure (the reserve, say) in any of the ways it could be written; a best-before of 18 Nov
    does not quote a reserve of ₹18 (the first live eval run, SC-77)"""
    text = undated(text)
    return any(abs(n - value) < 0.005 for n in figures(text)) or f"{value:.2f}" in text


def reply_ok(text: str, *, decided: float, others: list[float], reserve: float | None) -> bool:
    """a reply to a bid states the decided price, quotes no figure but the lot's own, never the reserve"""
    if not states_price(text, decided):
        return False
    if reserve is not None and reserve != decided and shows(text, reserve):
        return False
    return check_numbers(text, [decided, *others])


def iso_date(value: Any) -> str | None:
    """a label's date as ISO (2026-11-18), from what a model writes: 18/11/2026, 18-11-26, 18 Nov 2026, Nov 18 2026"""
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    try:
        return date.fromisoformat(s[:10]).isoformat()
    except ValueError:
        pass
    m = re.fullmatch(r"(\d{1,2})[/.\- ](\d{1,2})[/.\- ](\d{2,4})", s)
    if m:
        d, mo, y = (int(x) for x in m.groups())
        y = y + 2000 if y < 100 else y
        return _make(y, mo, d)
    m = re.fullmatch(r"(\d{1,2})[\s/.\-]*([A-Za-z]{3})[A-Za-z]*\.?,?[\s/.\-]*(\d{2,4})", s)
    if m and m.group(2).lower() in MONTHS:
        y = int(m.group(3))
        return _make(y + 2000 if y < 100 else y, MONTHS[m.group(2).lower()], int(m.group(1)))
    m = re.fullmatch(r"([A-Za-z]{3})[A-Za-z]*\.?[\s/.\-]*(\d{1,2}),?[\s/.\-]*(\d{2,4})", s)
    if m and m.group(1).lower() in MONTHS:
        y = int(m.group(3))
        return _make(y + 2000 if y < 100 else y, MONTHS[m.group(1).lower()], int(m.group(2)))
    return None


def _make(y: int, m: int, d: int) -> str | None:
    try:
        return datetime(y, m, d).date().isoformat()
    except ValueError:
        return None


def batch_no(value: Any) -> str | None:
    """a batch number as the DMS writes it: upper case, no spaces (MF-2409-117)"""
    if value is None:
        return None
    s = re.sub(r"\s+", "", str(value)).upper().strip(".:")
    return s or None


def money(value: Any) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, int | float):
        return float(value)
    m = re.search(r"\d[\d,]*(?:\.\d+)?", str(value))
    return float(m.group(0).replace(",", "")) if m else None


def quoted(text: str) -> str:
    """untrusted text (a buyer's message) as data for a prompt: its delimiters cannot be forged"""
    return text.replace("<<<", "‹‹‹").replace(">>>", "›››").strip()
