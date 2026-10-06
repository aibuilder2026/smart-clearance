"""The platform's rules, ported from frontend/api/src/console/platform.ts (itself a port of design3/core/platform.js):
what a supply-chain profile switches on, how far each preset lets the agents go, how a setting reads in the audit log,
and what the setup flow and the invitations accept. tests/test_rules.py checks them against fixtures that
frontend/scripts/seed.mjs computes by running platform.js itself.
"""

import re
import unicodedata
from collections.abc import Callable, Mapping
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_INPUT = re.compile(r"^[+\d\s]{10,}$")
SLUG = re.compile(r"^[a-z0-9-]{2,24}$")
DOMAIN = re.compile(r"^[a-z0-9-]+(\.[a-z0-9-]+)+$")
# workspace addresses kept for the platform itself
RESERVED_SLUGS = frozenset({"www", "api", "app", "admin", "console", "auth", "mail", "status", "docs", "help"})


def is_email(v: str | None) -> bool:
    return bool(EMAIL.match((v or "").strip()))


def digits(v: str | None) -> str:
    """the ten digits of an Indian mobile number: "+91 98230 44118" → "9823044118" """
    d = re.sub(r"\D", "", v or "")
    return d[2:] if len(d) == 12 and d.startswith("91") else d


def e164(v: str) -> str:
    """an Indian mobile number as stored: +919823044118"""
    return "+91" + digits(v)


# --- JavaScript's way of printing numbers, so the audit log reads exactly as the prototype's


def js_str(v: Any) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def to_fixed(v: Any, places: int) -> str:
    """Number.prototype.toFixed: the nearest decimal, ties away from zero"""
    q = Decimal(1).scaleb(-places)
    return str(Decimal(float(v)).quantize(q, rounding=ROUND_HALF_UP))


def money(v: Any) -> str:
    """a per-pack price: "₹13.50" """
    return "₹" + to_fixed(v, 2)


def show_value(field: Mapping[str, Any], v: Any) -> str:
    """how a setting's value reads in the audit log"""
    t = field.get("type")
    if t == "money":
        return money(v)
    if t == "switch":
        return "on" if v else "off"
    if t == "number" and field.get("key") == "confidence":
        return to_fixed(v, 2)
    unit = field.get("unit")
    return f"{js_str(v)} {unit}" if unit else js_str(v)


def exits_for(profile: Mapping[str, str], staff_cap: int) -> dict[str, dict[str, Any]]:
    """the exits a profile allows: D2C only for the manufacturer's own stock, kiranas unless it sells only to modern
    trade"""
    own = profile["owner"] == "manufacturer" or profile["route"] == "own"
    return {
        "expiresoon": {"on": True},
        "kirana": {"on": profile["route"] != "modern-trade"},
        "staff": {"on": True, "cap": staff_cap},
        "foodbank": {"on": True},
        "d2c": {"on": own, "locked": None if own else "Only for the manufacturer's own stock"},
    }


def slug(name: str | None) -> str:
    """a workspace address from a company's name: "Kesari Foods Pvt" → "kesari" """
    s = unicodedata.normalize("NFKD", (name or "").lower())
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"^-+|-+$", "", s)
    s = re.sub(r"-(foods?|ltd|limited|pvt|private|india)$", "", s)
    return s[:24] or "client"


PRESET_AUTONOMY: dict[str, dict[str, str]] = {
    "cautious": {"data": "act", "watcher": "act"},
    "standard": {"vision": "ask", "negotiator": "ask", "paperwork": "ask"},
    "trusted": {"negotiator": "ask", "paperwork": "ask"},
}


def agent_defaults(
    preset: str, agents: list[Mapping[str, Any]], d: Mapping[str, Any], approver: str | None = None
) -> dict[str, dict[str, Any]]:
    """each agent as a new client starts with it: the preset decides autonomy; the approval gate is always on"""
    auto = PRESET_AUTONOMY.get(preset, {})
    base = "suggest" if preset == "cautious" else "act"
    settings = {
        "data": {"time": "08:30", "backfillDays": 90},
        "watcher": {"time": "09:00", "blinkitDays": d["gates"]["blinkitDays"], "qcomPct": d["gates"]["qcomPct"]},
        "vision": {"confidence": 0.9},
        "valuer": {"indicative": True},
        "router": {"objective": "Most money recovered"},
        "gate": {"approver": approver},
        "lister": {"reserve": d["reserve"], "territoryGuard": True},
        "outreach": {"language": "Hindi first", "scheme": "2 free with every 10"},
        "negotiator": {"floor": d["reserve"], "counters": 2, "tokenPct": d["tokenPct"]},
        "paperwork": {"draftsOnly": True},
        "impact": {"returnWindowDays": d["returnWindowDays"]},
    }
    return {
        a["id"]: {
            "on": True,
            "autonomy": "gate" if a["gate"] else auto.get(a["id"], base),
            "settings": dict(settings[a["id"]]),
            "last": None,
            "next": None,
        }
        for a in agents
    }


def invite_error(name: str, contact: str, access: str, client_name: str, email_domain: str) -> str | None:
    """what an invitation to a client's workspace must carry, or the problem with it"""
    contact = contact.strip()
    phone = bool(PHONE_INPUT.match(contact))
    email = is_email(contact)
    if not name.strip():
        return "Enter a name."
    if not phone and not email:
        return "Enter a work email address or a mobile number."
    if email and access != "Partner" and not contact.lower().endswith("@" + email_domain):
        return f"{client_name} staff need a {email_domain} address. Partners can use any address or a phone number."
    return None


def staff_invite_error(name: str, email: str, staff_domain: str) -> str | None:
    """what an invitation to the console must carry, or the problem with it"""
    if not name.strip():
        return "Enter a name."
    if not re.match(rf"^[^\s@]+@{re.escape(staff_domain)}$", email.strip(), re.IGNORECASE):
        return f"Staff use a {staff_domain} address."
    return None


def setup_errors(f: Mapping[str, Any], taken: Callable[[str], bool], workspace_domain: str) -> list[str | None]:
    """the setup flow's seven steps, and the problem with each one's answers (None when it is fine)"""
    domain = f["emailDomain"].strip().lower()
    domain_ok = bool(DOMAIN.match(domain))
    admin_email = f["adminEmail"].strip().lower()
    admin_ok = bool(f["adminName"].strip()) and is_email(f["adminEmail"]) and admin_email.endswith("@" + domain)
    s = f["slug"]
    step2 = (
        "Use 2 to 24 lowercase letters, digits or hyphens."
        if not SLUG.match(s)
        else f"{s}.{workspace_domain} is reserved for the platform."
        if s in RESERVED_SLUGS
        else f"{s}.{workspace_domain} is taken."
        if taken(s)
        else "Enter the domain its staff email from, such as kesari.in."
        if not domain_ok
        else "Keep at least one way to sign in."
        if not (f["signGoogle"] or f["signPhone"])
        else None
    )
    admin_hint = "@" + f["emailDomain"] if f["emailDomain"] else "company"
    return [
        "Enter the company's name."
        if not f["name"].strip()
        else "Enter its home city."
        if not f["city"].strip()
        else None,
        step2,
        None,
        None if any(x.get("on") for x in f["exits"].values()) else "Keep at least one exit on.",
        None,
        None if admin_ok else f"Enter the admin's name and a {admin_hint} address.",
        None,
    ]
