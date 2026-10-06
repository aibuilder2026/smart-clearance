"""How times read in the console, in India's time, exactly as the prototype writes them.

A fixed month table, not locale formatting: Node's en-IN prints "Sept", the prototype's seed "Sep".
"""

from datetime import date, datetime

from sc_api.domain.clock import IST

MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


def _local(at: datetime) -> datetime:
    return at.astimezone(IST)


def hhmm(at: datetime) -> str:
    """09:40"""
    t = _local(at)
    return f"{t.hour:02d}:{t.minute:02d}"


def day_month(d: date) -> str:
    """1 Oct"""
    return f"{d.day} {MONTHS[d.month - 1]}"


def day_month_year(d: date) -> str:
    """1 Oct 2026: when a client went live"""
    return f"{day_month(d)} {d.year}"


def audit_at(at: datetime, today: date) -> str:
    """Today, 09:40, or 30 Sep, 17:05"""
    t = _local(at)
    return f"Today, {hhmm(t)}" if t.date() == today else f"{day_month(t.date())}, {hhmm(t)}"


def request_at(at: datetime) -> str:
    """4 Oct, 11:20 am: when a demo request came in"""
    t = _local(at)
    h = t.hour % 12 or 12
    return f"{day_month(t.date())}, {h:02d}:{t.minute:02d} {'am' if t.hour < 12 else 'pm'}"


def agent_last(at: datetime | None, note: str | None, today: date) -> str | None:
    """09:40 today · Priya approved MF-2410-118, or 1 Oct · countered ₹14.20 on ES-24117; a note alone when the agent
    hasn't run ("not run yet")"""
    if at is None:
        return note
    t = _local(at)
    when = f"{hhmm(t)} today" if t.date() == today else day_month(t.date())
    return f"{when} · {note}" if note else when


def phone_display(e164: str | None) -> str:
    """+919823044118 → +91 98230 44118"""
    if not e164:
        return ""
    if e164.startswith("+91") and len(e164) == 13:
        d = e164[3:]
        return f"+91 {d[:5]} {d[5:]}"
    return e164
