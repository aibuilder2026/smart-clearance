"""A batch's journey as a state machine: its phases, which of the nine stages is active, and which agent's step comes
next. design3's flow.js is the original (reference/flow.json holds its steps); this is the same journey with the
partners' moves left to the partners: nothing here acts for a person, so the journey waits at each person's step.

The stages, 0-based as the console counts them (services/supply.py STOP_AGENT):
  0 connect · 1 detect · 2 verify · 3 value · 4 decide · 5 approve · 6 execute · 7 settle · 8 report · 9 cleared
"""

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

from sc_api.domain.clock import IST

PHASES = (
    "watching",
    "at-risk",
    "verified",
    "valued",
    "planned",
    "approved",
    "executing",
    "dispatched",
    "settled",
    "cleared",
)
STAGES = ("connect", "detect", "verify", "value", "decide", "approve", "execute", "settle", "report")

# the Pub/Sub topics (each environment's names are prefixed: prod.batch.at_risk, local.batch.at_risk)
AT_RISK = "batch.at_risk"
OFFER_RECEIVED = "offer.received"
DEAL_CLOSED = "deal.closed"
STEP = "journey.step"
NOTIFY = "notify"

# what each journey.step event asks the agents to do
DECIDE = "decide"  # Vision reads the photo, then the Valuer and the Router
VALUE = "value"  # the Valuer and the Router, after a verified label (or no photo needed)
ROUTE = "route"  # the Router alone
EXECUTE = "execute"  # the Lister, Outreach and Donation, once a plan is approved
SETTLE = "settle"  # Paperwork, once the buyer's truck is loaded
DUE = "agent.due"  # a daily run: the Data agent at 08:30, the Watcher at 09:00 (journey time)
TIMER = "timer"  # an offer closing, an unsold lot closing, the report
RUN_NOW = "agent.run_now"  # the console's Run now
RESET = "journey.reset"
RECEIPT = "receipt"  # Paperwork lays out the food bank's receipt as a PDF, once it has collected (SC-110)


@dataclass(frozen=True)
class Event:
    """a message for the agents: its topic, its body, and the key that keeps one batch's events in order"""

    topic: str
    payload: dict[str, Any]
    ordering_key: str = ""


def stage_of(case: dict[str, Any], *, setup_confirmed: bool, permission: bool) -> int:
    """which stage is active for a case, as flow.js stageOf: 0-8, or 9 once cleared"""
    if not setup_confirmed or not permission:
        return 0
    phase = case["phase"]
    photo = case.get("photo") or {}
    if phase == "watching":
        return 1
    if phase == "at-risk" and photo.get("status") not in ("verified", "skipped"):
        return 2
    if phase in ("at-risk", "verified"):
        return 3
    if phase == "valued":
        return 4
    if phase == "planned":
        return 5
    if phase == "approved":
        return 6
    if phase == "executing":
        return 7 if case.get("award") and offer_done(case) else 6
    if phase == "dispatched":
        return 7
    if phase == "settled":
        return 8 if (case.get("van") or {}).get("status") == "done" else 7
    return 9


def offer_done(case: dict[str, Any]) -> bool:
    """whether the kirana scheme is over: closed, or there was none in the plan"""
    offer = case.get("offer")
    if offer is None:
        plan = case.get("plan") or {}
        return not any(ln["id"] == "kirana" for ln in plan.get("lines", []))
    return offer.get("status") == "closed"


def needs(case: dict[str, Any], channel: str) -> bool:
    plan = case.get("plan") or {}
    return any(ln["id"] == channel and ln["units"] > 0 for ln in plan.get("lines", []))


def line_done(case: dict[str, Any], channel: str) -> bool:
    """whether a plan line has run its course (SC-86): the buyer's truck loaded or the lot ended unsold, the kirana
    scheme closed, the staff sale recorded, the donation collected or declined. A write-off waits for nothing, and on
    expiry day (SC-94) every line has run its course."""
    if case.get("expiredAt"):
        return True
    if channel == "expiresoon":
        return (case.get("truck") or {}).get("status") == "dispatched" or (case.get("listing") or {}).get(
            "status"
        ) == "ended"
    if channel == "kirana":
        return (case.get("offer") or {}).get("status") == "closed"
    if channel == "staff":
        return (case.get("staff") or {}).get("status") == "recorded"
    if channel == "foodbank":
        return (case.get("donation") or {}).get("status") in ("collected", "declined")
    return True


def lines_done(case: dict[str, Any]) -> bool:
    """every line of the plan has run its course: the papers can follow"""
    plan = case.get("plan") or {}
    return bool(plan) and all(line_done(case, ln["id"]) for ln in plan.get("lines", []) if ln["units"] > 0)


def done_units(case: dict[str, Any], ordered: int) -> dict[str, float]:
    """what each finished line took, for money.realised: the kiranas' orders once the scheme closed, the lot awarded (or
    nothing, ended unsold), the staff sale as recorded, the donation once collected (or nothing, declined). A line still
    running is left out, and counts as planned."""
    out: dict[str, float] = {}
    if (case.get("offer") or {}).get("status") == "closed":
        out["kirana"] = ordered
    award, listing = case.get("award") or {}, case.get("listing") or {}
    if award.get("units") is not None:
        out["expiresoon"] = award["units"]
    elif listing.get("status") == "ended":
        out["expiresoon"] = 0
    staff = case.get("staff") or {}
    if staff.get("status") == "recorded":
        out["staff"] = staff.get("sold", 0)
    donation = case.get("donation") or {}
    if donation.get("status") == "collected":
        out["foodbank"] = donation.get("units", 0)
    elif donation.get("status") == "declined":
        out["foodbank"] = 0
    if case.get("expiredAt"):  # expiry day (SC-94): a line never run took nothing
        for ln in (case.get("plan") or {}).get("lines", []):
            if ln["id"] != "writeoff":
                out.setdefault(ln["id"], 0)
    return out


def next_agent_event(case: dict[str, Any], *, client: str, ref: str, unanswered: str | None = None) -> Event | None:
    """the event that sets the next agent step going, when the journey waits for an agent and not a person: what the
    tick sends again when a case has stalled (a lost message, an agent that was down). None when a person, a timer or
    nothing is due"""
    key = f"{client}:{ref}"
    phase = case["phase"]
    photo = (case.get("photo") or {}).get("status")

    def step(kind: str, **extra: Any) -> Event:
        return Event(STEP, {"type": kind, "client": client, "ref": ref, **extra}, key)

    if phase == "at-risk":
        if photo == "none":
            return Event(AT_RISK, {"client": client, "ref": ref}, key)
        if photo == "reading":
            return step(DECIDE)
        if photo in ("verified", "skipped"):
            return step(VALUE)
        return None
    if phase == "verified":
        return step(VALUE)
    if phase == "valued":
        return step(ROUTE)
    if phase in ("approved", "executing"):
        if unanswered:
            return Event(OFFER_RECEIVED, {"client": client, "ref": ref, **_unanswered(unanswered)}, key)
        missing = (
            (needs(case, "expiresoon") and not case.get("listing"))
            or (needs(case, "kirana") and not case.get("offer"))
            or (needs(case, "foodbank") and not case.get("donation"))
        )
        return step(EXECUTE) if missing else None
    if phase == "dispatched":
        return step(SETTLE)
    return None


def _unanswered(token: str) -> dict[str, Any]:
    kind, _, ident = token.partition(":")
    return {"bid": ident} if kind == "bid" else {"message": int(ident)}


def can(case: dict[str, Any], action: str) -> str | None:
    """why a person's step cannot be taken now (None when it can): the journey's order, as flow.js keeps it"""
    phase = case["phase"]
    photo = (case.get("photo") or {}).get("status")
    if action == "photo":
        return None if phase == "at-risk" and photo == "requested" else "No label photo is asked for now."
    if action == "approve":
        return None if phase == "planned" else "There is no plan waiting for a yes."
    if action == "order":
        offer = case.get("offer")
        return None if offer and offer.get("status") == "sent" else "The scheme is not open."
    if action in ("bid", "message"):
        listing = case.get("listing")
        return None if listing and listing.get("status") == "live" else "The listing is not open for bids."
    if action == "accept":
        listing = case.get("listing")
        return None if listing and listing.get("status") == "live" else "The listing is no longer open."
    if action == "truck":
        if not case.get("award"):
            return "No buyer has won the lot yet."
        if (case.get("truck") or {}).get("status") == "dispatched":
            return "The truck has already left."
        return None
    if action == "van":
        if phase != "settled":
            return "The van round comes once the papers are drafted."
        return None if (case.get("van") or {}).get("status") != "done" else "The van round is done."
    if action in ("invoice", "review"):
        return None if phase in ("settled", "cleared") and case.get("docs") else "The papers are not drafted yet."
    if action in ("pickup", "collect", "decline"):
        d = case.get("donation")
        if not d or d["status"] == "declined":
            return "No donation is booked."
        if action == "pickup":
            return None if d["status"] == "booked" else "The pickup is already confirmed."
        if action == "decline":
            return None if d["status"] in ("booked", "confirmed") else "The packs are already collected."
        return None if d["status"] == "confirmed" else "The pickup is not confirmed yet."
    if action == "staff":
        st = (case.get("staff") or {}).get("status")
        if st == "recorded":
            return "The staff sale is already recorded."
        return None if st == "open" else "There is no staff sale in this plan yet."
    return None


def van_leaves(
    offer: dict[str, Any] | None, docs: list[dict[str, Any]] | None, leaves: str = "07:00"
) -> datetime | None:
    """when the van round that takes the scheme's orders leaves (SC-97): at the van's hour, on the first morning after
    the scheme closed (when it filled, or when its window ran out) and after the papers were drafted, whichever is
    later, since the van runs once the batch is settled. Before the scheme closes, the morning after its window would.
    One answer for the Van route, the push that announces the round and the timeline that records it."""
    at = (offer or {}).get("closedAt") or (offer or {}).get("closesAt")
    if not at:
        return None
    h, mi = (int(x) for x in leaves.split(":"))
    closed = datetime.fromisoformat(at).astimezone(IST)
    day = closed.date() if (closed.hour, closed.minute) < (h, mi) else closed.date() + timedelta(days=1)
    drafted = [date.fromisoformat(d["date"]) for d in docs or [] if d.get("date")]
    if drafted:
        day = max(day, min(drafted) + timedelta(days=1))
    return datetime(day.year, day.month, day.day, h, mi, tzinfo=IST)
