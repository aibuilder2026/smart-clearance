"""A partner's own history (SC-130): the batches a distributor, a kirana or a food bank took part in, each as its pages
read it (design3/core/ledger.js partners), cut to the partner's part.

Each batch is its facts: when each step happened (the case's own stamps, and the feed's for the photo sent and the
papers drafted), the plan and what each line took, the deal, the papers. The screens work out the moments, the money,
the offers and the pickups from them (core's partners.ts, held to ledger.js); this sends only what the partner may
see. A distributor reads every batch of his: the plan, what each line took, the price support, his papers and copies of
the food bank's receipt and the destruction certificate; a kirana, every scheme that came to its shop, with its own
order or Not this time; a food bank, every donation to it, with its receipt."""

from datetime import date, datetime
from typing import Any

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain import money
from sc_api.domain.clock import IST
from sc_api.services.context import Ctx
from sc_api.services.journey import ledger as ledger_
from sc_api.services.journey import views, world

PARTNERS = ("distributor", "retailer", "foodbank")
# the distributor's papers, then copies of what concerns his packs (the client's ITC memo and FSSAI checklist stay its)
DIST_DOCS = ("invoice", "eway", "support", "expiry", "receipt", "destruction")
# the steps the feed stamps: Vision asking for the photo, the photo sent, the papers drafted
FEED_STEPS = {"ask": "ask", "photo": "photo", "papers": "papers"}


def _local(at: datetime | str | None) -> str | None:
    """a time in the client's zone, to the minute (2026-08-27T12:10)"""
    if not at:
        return None
    when = datetime.fromisoformat(at) if isinstance(at, str) else at
    return when.astimezone(IST).strftime("%Y-%m-%dT%H:%M")


def _day(at: datetime | str) -> date:
    when = datetime.fromisoformat(at) if isinstance(at, str) else at
    return when.astimezone(IST).date()


def steps_of(case: m.Case, orders: list[m.CaseOrder], feed: dict[str, datetime]) -> list[dict[str, str]]:
    """when each step of a batch happened, as design3's history stamps them (data.js HISTORY_AT)"""
    out: list[tuple[str, str]] = []

    def add(step: str, at: datetime | str | None) -> None:
        if (t := _local(at)) is not None:
            out.append((step, t))

    photo, approval, offer = case.photo or {}, case.approval or {}, case.offer or {}
    d, staff, truck, van = case.donation or {}, case.staff or {}, case.truck or {}, case.van or {}
    add("detect", case.opened_at)
    add("ask", feed.get("ask"))
    add("photo", feed.get("photo"))
    add("read", photo.get("at") if photo.get("status") == "verified" else None)
    add("approve", approval.get("at") if approval.get("status") == "approved" else None)
    add("listing", (case.listing or {}).get("at"))
    add("offer", offer.get("at"))
    add("donation", d.get("at"))
    add("pickup", d.get("confirmedAt"))
    add("orders", min((o.at for o in orders), default=None))  # the kiranas' orders, from the first
    add("accept", (case.award or {}).get("at"))
    add("collect", d.get("collectedAt"))
    # the scheme closing on its own clock; a scheme that filled closed with its last order
    if offer.get("status") == "closed" and int(offer.get("ordered", 0)) < int(offer.get("units", 0)):
        add("closeOffer", offer.get("closedAt"))
    add("staff", staff.get("recordedAt"))
    add("truck", truck.get("at") if truck.get("status") == "dispatched" else None)
    add("papers", feed.get("papers"))
    add("invoice", case.invoice_issued_at)
    add("van", van.get("at") if van.get("status") == "done" else None)
    add("review", (case.reviewed or {}).get("at"))
    add("report", (case.ledger or {}).get("at"))
    out.sort(key=lambda x: x[1])
    return [{"step": s, "at": t} for s, t in out]


def _line(ln: dict[str, Any]) -> dict[str, Any]:
    return {k: ln.get(k) for k in ("id", "short", "units", "price", "packPrice")}


def facts(
    case: m.Case,
    batch: m.Batch,
    orders: list[m.CaseOrder],
    feed: dict[str, datetime],
    cm: m.ClientMember,
    support: dict[str, Any] | None,
) -> dict[str, Any]:
    """a batch as the partner's pages read it, cut to its part"""
    role = cm.workspace_role
    dist = role == "distributor"
    L = case.ledger if case.status == "cleared" else None
    plan = case.plan or {}
    lines = [ln for ln in plan.get("lines", []) if ln.get("id") != "writeoff"]
    kl = next((ln for ln in lines if ln["id"] == "kirana" and ln.get("units")), None)
    offer = case.offer or {}
    d = case.donation or None
    # the shops' orders: a distributor's every one, a kirana its own, a food bank none
    mine = [o for o in orders if dist or (role == "retailer" and o.kirana_id == cm.org_ref)]
    took = [ln for ln in (L or {}).get("lines", []) if ln.get("id") != "writeoff"]
    godown = int((L or {}).get("godown", 0))
    donated = next((int(ln.get("units", 0)) for ln in took if ln["id"] == "foodbank"), 0)
    expiry = (L or {}).get("expiry") or {}
    docs = []
    for x in case.docs or []:
        if (dist and x["id"] in DIST_DOCS) or (role == "foodbank" and x["id"] == "receipt"):
            docs.append(views.doc_out(views.with_reversed(case, x)))
    receipt = views.receipt_out((d or {}).get("receipt")) if role in ("distributor", "foodbank") else None
    bb = batch.best_before
    flagged = _day(case.opened_at)
    return money.jsonable(
        {
            "ref": case.batch_ref,
            "sku": case.sku_id,
            "dist": case.distributor_id,
            "outcome": ledger_.outcome(godown, donated) if L else None,
            "flagged": flagged.isoformat(),
            "cleared": _day(L["at"]).isoformat() if L else None,
            "steps": steps_of(case, orders, feed),
            "batch": {"daysLeft": (bb - flagged).days if bb else 0, "bestBefore": bb.isoformat() if bb else ""},
            "plan": {
                "units": int(plan.get("units", 0)),
                "lines": [_line(ln) for ln in lines if role != "foodbank" or ln["id"] == "foodbank"],
            },
            "realised": (
                {"lines": [{k: ln.get(k) for k in ("id", "units", "gross", "price")} for ln in took], "godown": godown}
                if dist and L
                else None
            ),
            "listing": {"id": case.listing["id"]} if dist and case.listing else None,
            "offered": len(offer.get("caps") or {}) if role != "foodbank" else 0,
            "kiranas": [{"kirana": o.kirana_id, "units": o.units, "at": _local(o.at)} for o in mine],
            "kirana": (
                {"planned": int(kl["units"]), "ordered": sum(o.units for o in orders)}
                if kl and role != "foodbank"
                else None
            ),
            "offer": (
                {
                    "status": "closed" if offer.get("status") == "closed" else "open",
                    "closesAt": _local(offer.get("closesAt")),
                    "closedAt": _local(offer.get("closedAt")),
                }
                if offer and role != "foodbank"
                else None
            ),
            "declined": (
                {k: {"at": _local(v.get("at"))} for k, v in (offer.get("declined") or {}).items() if k == cm.org_ref}
                if role == "retailer"
                else {}
            ),
            "award": ({"price": case.award["price"], "token": case.award["token"]} if dist and case.award else None),
            "partner": {"name": d.get("partnerName") or d.get("partner")} if d and role != "retailer" else None,
            "donation": (
                {"units": int(d.get("units", 0)), "spot": d.get("spot", "")} if d and role != "retailer" else None
            ),
            "receipt": receipt,
            "support": (
                {k: support.get(k, 0) for k in ("total", "van", "fee")} if dist and support is not None else None
            ),
            "expiry": (
                {"units": int(expiry.get("units", 0)), "credit": expiry.get("credit", 0)}
                if dist and expiry.get("units")
                else None
            ),
            "docs": docs,
        }
    )


async def partner(ctx: Ctx, client_id: str, cm: m.ClientMember) -> dict[str, Any]:
    """what a partner reads of its own history with the client: the batches it took part in, in view (the client's
    history and this journey's), the buyer they name, and a kirana's own shop"""
    role = cm.workspace_role
    buyer = next(iter(await world.partners(ctx, client_id, "buyer")), None)
    out: dict[str, Any] = {
        "buyer": {"name": buyer.name if buyer else "", "city": (buyer.city or "") if buyer else ""},
        "shop": None,
        "cases": [],
    }
    if role not in PARTNERS:
        return out
    if role == "retailer":
        for k in await world.kiranas(ctx, client_id):
            if k.id == cm.org_ref:
                out["shop"] = {
                    "id": k.id,
                    "name": k.name,
                    "area": k.area,
                    "sales14": k.sales_14d,
                    "distributor": k.distributor_id,
                    "member": k.member_ref,
                }
    cases = [
        x
        for x in (await views.cases_in_view(ctx, client_id)).values()
        if x.status != "reset" and x.plan and views.visible(cm, x)
    ]
    if not cases:
        return out
    ids = [x.id for x in cases]
    orders: dict[str, list[m.CaseOrder]] = {i: [] for i in ids}
    for o in (await ctx.session.execute(select(m.CaseOrder).where(m.CaseOrder.case_id.in_(ids)))).scalars():
        orders[o.case_id].append(o)
    feed: dict[str, dict[str, datetime]] = {i: {} for i in ids}
    q = select(m.FeedEvent).where(m.FeedEvent.case_id.in_(ids), m.FeedEvent.key.in_(list(FEED_STEPS)))
    for e in (await ctx.session.execute(q.order_by(m.FeedEvent.id))).scalars():
        feed[e.case_id or ""].setdefault(FEED_STEPS[e.key], e.at)
    c = await world.client(ctx, client_id)
    rules = world.money_rules(c, await world.agent_settings(ctx, client_id))
    skus = await world.skus(ctx, client_id)
    for case in cases:
        batch = await ctx.session.get(m.Batch, (client_id, case.batch_ref))
        if batch is None:
            continue
        support = None
        if role == "distributor":
            support = views.support_of(case, c, skus[case.sku_id], orders[case.id], rules)
        out["cases"].append(facts(case, batch, orders[case.id], feed[case.id], cm, support))
    out["cases"].sort(key=lambda x: (x["flagged"], x["ref"]), reverse=True)
    return out
