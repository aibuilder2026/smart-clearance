"""Figures written as the apps and backend-api write them (money.js's fmt): rupees rounded with Indian grouping
(₹21,770), to the paisa where a price is (₹14.20), dates as 18 Nov 2026."""

import math
import re
from datetime import date
from typing import Any


def group(n: int) -> str:
    """Indian grouping: 1234567 → 12,34,567"""
    s = str(abs(n))
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        parts = []
        while len(head) > 2:
            parts.insert(0, head[-2:])
            head = head[:-2]
        if head:
            parts.insert(0, head)
        s = ",".join([*parts, tail])
    return ("-" if n < 0 else "") + s


def inr(v: Any) -> str:
    """₹21,770: rounded to the rupee"""
    if v is None:
        return "—"
    x = float(v)
    n = math.floor(abs(x) + 0.5)
    return ("−" if x < 0 else "") + f"₹{group(n)}"


def inr2(v: Any) -> str:
    """₹14.20: to the paisa"""
    if v is None:
        return "—"
    x = float(v)
    whole = math.floor(abs(x))
    frac = round((abs(x) - whole) * 100)
    if frac == 100:
        whole, frac = whole + 1, 0
    return ("−" if x < 0 else "") + f"₹{group(whole)}.{frac:02d}"


def price(v: Any) -> str:
    """₹18 for a whole rupee, ₹14.20 otherwise (copy.price)"""
    x = float(v)
    return f"₹{x:.0f}" if x.is_integer() else inr2(x)


def num(v: Any) -> str:
    if v is None:
        return "—"
    x = float(v)
    return group(int(x)) if x.is_integer() else f"{x:,.2f}"


def day(v: Any) -> str:
    """2026-11-18 → 18 Nov 2026"""
    if not v:
        return ""
    d = date.fromisoformat(str(v)[:10])
    return f"{d.day} {d:%b} {d.year}"


def base(name: str) -> str:
    """Masala Chips 150 g → Masala Chips (copy.base): the pack size is a figure a reply may not quote"""
    return re.sub(r"\s+\d+(\.\d+)?\s*(g|ml|kg|l)$", "", name or "")


def fiscal_quarter(d: date) -> str:
    """India's financial year starts in April: 7 Oct 2026 is FY27 Q3"""
    fy = d.year + 1 if d.month >= 4 else d.year
    q = (d.month - 4) % 12 // 3 + 1
    return f"FY{fy % 100:02d} Q{q}"
