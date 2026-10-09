"""What a signed-in member sees (frontend/api/src/types/workspace.ts): who they are, the workspace's snapshot, a batch's
case, the quarter, the audit log, and their stream. Everything is cut to their role here, on the server:

- Munchly's own people (operator, finance, sustainability, admin) see every batch and the figures;
- a distributor sees his own batches' journeys, without Munchly's P&L;
- a kirana sees the scheme offered to its shop, and its own order;
- the buyer sees the lots listed for him (never the reserve), his bids, the chat, and his award;
- a food bank sees the donations booked with it.
"""

from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import or_, select

from sc_api import models as m
from sc_api.domain import copy, money
from sc_api.domain import journey as J
from sc_api.domain.clock import IST
from sc_api.errors import ApiError, not_found
from sc_api.services.context import Actor, Ctx
from sc_api.services.journey import events as ev
from sc_api.services.journey import ledger as ledger_
from sc_api.services.journey import world

STAFF_ROLES = world.STAFF_ROLES
ACCESS_LABEL = {"approver": "Approver", "admin": "Admin", "member": "Member", "partner": "Partner"}
NOT_A_MEMBER = "This account is not a member of this workspace."
EVENTS_PAGE = 200


# --- who is signed in -----------------------------------------------------------------------------------------------


async def signed_in(ctx: Ctx, client_id: str, uid: str, *, activate: bool = False) -> tuple[Actor, m.ClientMember]:
    """the member a Firebase account is in this workspace. An invited member becomes active on their first sign-in
    (POST /session); a deactivated one, console staff, or another client's member gets 403"""
    row = (
        await ctx.session.execute(
            select(m.ClientMember, m.User)
            .join(m.User, m.User.id == m.ClientMember.user_id)
            .where(m.ClientMember.client_id == client_id, m.User.firebase_uid == uid)
        )
    ).first()
    if row is None:
        raise ApiError(403, NOT_A_MEMBER)
    cm, user = row
    if cm.status == "deactivated" or (cm.member_class == "external" and cm.workspace_role != "buyer"):
        raise ApiError(403, NOT_A_MEMBER)
    if cm.status == "invited":
        if not activate:
            raise ApiError(401, "Sign in again.")
        from sc_api.services import people

        await people.accept(ctx, client_id, cm.ref)
    if activate:
        user.last_sign_in_at = ctx.clock.now()
    perms = await _permissions(ctx, cm.workspace_role)
    actor = Actor(
        name=cm.name,
        user_id=cm.user_id,
        role=cm.workspace_role,
        permissions=frozenset(perms),
        member_ref=cm.ref,
        client_id=client_id,
    )
    return actor, cm


async def _permissions(ctx: Ctx, role: str | None) -> list[str]:
    if not role:
        return []
    q = select(m.RolePermission.permission_id).where(m.RolePermission.role_id == f"ws-{role}")
    return list((await ctx.session.execute(q)).scalars())


def staff(cm: m.ClientMember) -> bool:
    return cm.workspace_role in STAFF_ROLES


def member_out(cm: m.ClientMember, u: m.User, *, me: m.ClientMember | None = None) -> dict[str, Any]:
    show_email = me is None or me.ref == cm.ref or me.workspace_role == "admin" or staff(me)
    return {
        "id": cm.ref,
        "name": cm.name,
        "short": cm.name.split(" ")[0] if cm.member_class == "staff" else cm.name,
        "org": cm.org,
        "role": cm.workspace_role or "operator",
        "access": cm.access_role_id,
        "kind": cm.member_class,
        "status": cm.status,
        "email": (u.email or "") if show_email else "",
        "img": cm.img,
        "city": cm.city,
        "lang": cm.lang,
        "invitedBy": cm.invited_by_name,
        "orgRef": cm.org_ref,
        "title": cm.role_label,
        "lastSeen": u.last_sign_in_at.isoformat() if u.last_sign_in_at else None,
    }


# --- the snapshot ---------------------------------------------------------------------------------------------------


def _iso(at: datetime | None) -> str | None:
    return at.astimezone(IST).isoformat() if at else None


def clock_out(ctx: Ctx, c: m.Client) -> dict[str, Any]:
    now = ev.now(ctx, c)
    day0 = c.journey_day0
    return {
        "now": _iso(now),
        "dayMinutes": c.day_minutes,
        "compressed": c.clock_speed < 1440,
        "journey": None,
        "day0": day0.isoformat() if day0 else None,
        "day": (now.astimezone(IST).date() - day0).days if day0 else None,
    }


def _workspace(c: m.Client) -> dict[str, Any]:
    doc = c.workspace_doc or {}
    return {
        "id": c.id,
        "name": c.name,
        "short": c.short,
        "domain": c.domain,
        "mark": c.mark,
        "since": doc.get("since", c.live_since.isoformat() if c.live_since else ""),
        "plan": doc.get("plan", c.plan_id),
        "region": c.region,
        "signIn": doc.get("signIn", c.sign_in),
        "outside": doc.get("outside", ""),
        "profile": doc.get("profile", []),
        "emailDomain": c.email_domain,
        "hint": doc.get("hint", f"name@{c.email_domain}"),
        "invite": doc.get("invite", {"name": "", "contact": ""}),
    }


async def sign_in_accounts(ctx: Ctx, c: m.Client) -> list[dict[str, Any]]:
    """the people a synthetic workspace offers on its sign-in, by where they stand: their name, role and address,
    never a password (the default one is handed over apart). A real client's workspace offers none"""
    doc = c.workspace_doc or {}
    if not doc.get("synthetic") or not doc.get("accounts"):
        return []
    people = {cm.ref: (cm, u) for cm, u in await world.members(ctx, c.id)}
    out = []
    for g in doc["accounts"]:
        found = [(people[p["id"]], p["does"]) for p in g["people"] if p["id"] in people]
        rows = [
            {
                "id": cm.ref,
                "name": cm.name,
                "role": cm.workspace_role or "operator",
                "title": cm.role_label,
                "img": cm.img,
                "email": u.email or "",
                "does": does,
            }
            for (cm, u), does in found
            if cm.status != "deactivated" and u.email
        ]
        if rows:
            # the group's sign-in domain (the prototype's own note names its Google and phone sign-ins)
            domains = sorted({"@" + r["email"].split("@", 1)[1] for r in rows})
            out.append({"group": g["group"], "note": " · ".join(domains), "people": rows})
    return out


def public(c: m.Client, platform: dict[str, str], accounts: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """GET /v1/workspaces/{ws}: what the sign-in page and the installed app show"""
    doc = c.workspace_doc or {}
    return {
        "accounts": accounts or [],
        "id": c.id,
        "name": c.name,
        "short": c.short,
        "domain": c.domain,
        "mark": c.mark,
        "platform": platform,
        "signIn": doc.get("signIn", c.sign_in),
        "emailDomain": c.email_domain,
        "hint": doc.get("hint", f"name@{c.email_domain}"),
        "manifest": {
            "name": f"{c.short} · {platform['name']}",
            "shortName": doc.get("shortName", "Clearance"),
            "description": f"{c.short}'s short-dated stock, routed by {platform['name']}'s agents",
            "themeColor": "#167a52",
            "backgroundColor": "#ffffff",
        },
    }


def _phase(case: m.Case | None) -> str | None:
    return case.phase if case else None


def journey_from(c: m.Client | None) -> datetime | None:
    """when the client's journey was last started again (wall time): the cases opened before it belong to an earlier
    journey, kept in the record but no longer shown (SC-81)"""
    at = ((c.workspace_doc if c else None) or {}).get("journeyFrom")
    return datetime.fromisoformat(at) if at else None


async def _open_cases(ctx: Ctx, client_id: str) -> dict[str, m.Case]:
    q = select(m.Case).where(m.Case.client_id == client_id)
    since = journey_from(await ctx.session.get(m.Client, client_id))
    if since is not None:  # this journey's cases, and the client's history (SC-123)
        q = q.where(or_(m.Case.opened_wall >= since, m.Case.history.is_(True)))
    rows = (await ctx.session.execute(q.order_by(m.Case.seq.desc()))).scalars()
    out: dict[str, m.Case] = {}
    for case in rows:  # the latest case of each batch in this journey: open, or the last one closed
        out.setdefault(case.batch_ref, case)
    return out


async def cases_in_view(ctx: Ctx, client_id: str) -> dict[str, m.Case]:
    """each batch's case in view: this journey's, open or the last one closed, and the client's history"""
    return await _open_cases(ctx, client_id)


async def latest_case(ctx: Ctx, client_id: str, ref: str) -> m.Case | None:
    """a batch's case in the client's current journey: open, or the last one closed"""
    return (await _open_cases(ctx, client_id)).get(ref)


def visible(cm: m.ClientMember, case: m.Case) -> bool:
    if staff(cm):
        return True
    role = cm.workspace_role
    if role == "distributor":
        return cm.org_ref == case.distributor_id
    if role == "retailer":
        return bool(case.offer and cm.org_ref in (case.offer.get("caps") or {}))
    if role == "buyer":
        return bool(case.listing)
    if role == "foodbank":
        return bool(case.donation and case.donation.get("partner") == cm.org_ref)
    return False


async def snapshot(ctx: Ctx, client_id: str, cm: m.ClientMember) -> dict[str, Any]:
    c = await world.client(ctx, client_id)
    agents = await world.agent_settings(ctx, client_id)
    rules = world.money_rules(c, agents)
    today = ev.now(ctx, c).astimezone(IST).date()
    skus = await world.skus(ctx, client_id)
    dists = await world.distributors(ctx, client_id)
    people = await world.members(ctx, client_id)
    cases = await _open_cases(ctx, client_id)
    mine = staff(cm)
    me_user = next(u for p, u in people if p.ref == cm.ref)

    batches = []
    if mine or cm.workspace_role == "distributor":
        rows = (
            await ctx.session.execute(
                select(m.Batch)
                # a batch an earlier journey's upload brought, closed at the reset, is not the workspace's (SC-88)
                .where(
                    m.Batch.client_id == client_id,
                    m.Batch.best_before.is_not(None),
                    m.Batch.outcome.is_distinct_from("reset"),
                )
                .order_by(m.Batch.seq)
            )
        ).scalars()
        for b in rows:
            if not mine and b.distributor_id != cm.org_ref:
                continue
            d, x = dists[b.distributor_id], skus[b.sku_id]
            bo = world.batch_obj(b, d, today)
            a = money.assess(bo, world.sku_obj(x), gates=world.effective_gates(c, x, b), rules=rules)
            batches.append({**_batch_out(bo), "assess": money.jsonable(a), "phase": _phase(cases.get(b.ref))})

    summaries = []
    for ref, case in cases.items():
        # the client's history is in the ledger and on Batches, not among the batches in a journey (SC-121)
        if case.status == "reset" or case.history or not visible(cm, case):
            continue
        summaries.append(
            {
                "ref": ref,
                "sku": case.sku_id,
                "distributor": case.distributor_id,
                "phase": case.phase,
                "stage": case.stage,
                "urgency": float(case.assess.get("urgency") or 0),
                "atRisk": int(case.assess.get("atRisk") or 0),
                "net": float(case.plan["net"]) if case.plan and mine else None,
                "updatedAt": _iso(case.updated_wall),
                # the packs going to a food bank, booked or planned, for those who see the donation
                "donation": _donated(case, mine or cm.workspace_role == "foodbank"),
                "open": case.status == "open",
            }
        )
    summaries.sort(key=lambda s: (not s.pop("open"), -s["urgency"]))

    kiranas = []
    if mine or cm.workspace_role == "distributor":
        for k in await world.kiranas(ctx, client_id):
            if mine or k.distributor_id == cm.org_ref:
                kiranas.append(
                    {
                        "id": k.id,
                        "name": k.name,
                        "area": k.area,
                        "pincode": k.pincode,
                        "distributor": k.distributor_id,
                        "member": k.member_ref,
                    }
                )

    buyer = None
    for p in await world.partners(ctx, client_id, "buyer"):
        buyer = {"id": p.id, "name": p.name, "short": p.short, "city": p.city or "", **_buyer_details(p)}
        break

    # the member's inbox in this journey: the pushes an earlier one sent stay in the record, not on the screens (SC-88)
    nq = (
        select(m.Notification, m.Case.batch_ref)
        .outerjoin(m.Case, m.Case.id == m.Notification.case_id)
        .where(m.Notification.client_id == client_id, m.Notification.member_ref == cm.ref)
    )
    if (since := journey_from(c)) is not None:
        nq = nq.where(m.Notification.wall >= since)
    notes = (await ctx.session.execute(nq.order_by(m.Notification.id.desc()).limit(100))).all()

    doc = c.workspace_doc or {}
    # which distributor each kirana's account answers to, so a distributor sees his beat and a kirana its distributor
    beat = {k.id: k.distributor_id for k in await world.kiranas(ctx, client_id)}
    return {
        "seq": c.stream_seq,
        "me": member_out(cm, me_user),
        "clock": clock_out(ctx, c),
        "platform": doc.get("platform", {"name": "Smart-Clearance", "domain": ctx.settings.workspace_domain}),
        "workspace": _workspace(c),
        "client": {
            "name": c.legal_name,
            "short": c.short,
            "city": c.city,
            "gstin": doc.get("gstin", ""),
            "fssai": doc.get("fssai", ""),
            # the client as its profile states it; its SKUs and distributors as the workspace holds them
            "listed": (doc.get("client") or {}).get("listed", ""),
            "revenue": (doc.get("client") or {}).get("revenue", ""),
            "shortDatedPerQuarter": (doc.get("client") or {}).get("shortDatedPerQuarter", 0),
            "destroyedToday": (doc.get("client") or {}).get("destroyedToday", 0),
            "skus": len(skus),
            "distributors": len(dists),
            "kiranas": (doc.get("client") or {}).get("kiranas", len(kiranas)),
        },
        "market": doc.get("market", {"dispatchHours": 0, "balanceHours": 0, "minOrder": 0, "lots": []}),
        "roles": doc.get("roles", {}),
        "members": [
            member_out(p, u, me=cm) for p, u in people if mine or cm.workspace_role == "admin" or _peer(cm, p, beat)
        ],
        "skus": {k: world.sku_obj(x) for k, x in skus.items()},
        "distributors": {k: world.dist_obj(d) for k, d in dists.items()},
        "buyer": buyer if mine or cm.workspace_role in ("buyer", "distributor") else None,
        "kiranas": kiranas,
        "stages": doc.get("stages", []),
        "channels": [
            {k: ch[k] for k in ("id", "name", "short", "minDays", "need", "pricePct", "clears", "icon")}
            for ch in money.CHANNELS
        ],
        "rules": world.ws_rules(c, agents),
        "moneyRules": money.jsonable(rules),
        "integrations": await _integrations(ctx, c),
        "setup": _setup(c, doc),
        "watch": c.last_watch,
        "batches": batches,
        "cases": summaries,
        "notifications": [notification_out(n, ref) for n, ref in notes],
    }


def _donated(case: m.Case, sees: bool) -> int | None:
    """the packs of a batch going to a food bank: the booked donation's, else the plan's food-bank line"""
    if not sees:
        return None
    if case.donation:
        return None if case.donation.get("status") == "declined" else int(case.donation["units"])
    line = next((x for x in (case.plan or {}).get("lines", []) if x.get("id") == "foodbank"), None)
    return int(line["units"]) if line and line.get("units") else None


def _peer(me: m.ClientMember, other: m.ClientMember, beat: dict[str, str]) -> bool:
    """whom a partner may see: themselves, the client's own people, their own organisation's people, the kiranas on a
    distributor's beat, and a kirana's distributor"""
    if other.ref == me.ref or other.member_class == "staff":
        return True
    if me.org_ref is None or other.org_ref is None:
        return False
    return (
        other.org_ref == me.org_ref
        or beat.get(other.org_ref) == me.org_ref  # a kirana on my beat
        or beat.get(me.org_ref) == other.org_ref  # my distributor
    )


def _buyer_details(p: m.Partner) -> dict[str, Any]:
    d = p.details or {}
    return {k: d.get(k, "") for k in ("state", "stateCode", "address", "gstin", "kind")}


def _batch_out(bo: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": bo["id"],
        "sku": bo["sku"],
        "distributor": bo["distributor"],
        "units": bo["units"],
        "daysLeft": bo["daysLeft"],
        "sellPerDay": bo["sellPerDay"],
        "bestBefore": bo["bestBefore"],
        "mfg": bo["mfg"],
        "city": bo["city"],
        "staffCap": bo["staffCap"],
        "shelf": bo["shelf"],
    }


def _setup(c: m.Client, doc: dict[str, Any]) -> dict[str, Any]:
    setup = doc.get("setup", {})
    return {
        "minutes": setup.get("minutes", 0),
        "dms": {"source": "", "file": "", "rows": 0, "columns": [], "salesDays": 90} | setup.get("dms", {}),
        "channels": setup.get("channels", []),
        "channelNames": setup.get("channelNames", {}),
        "permissions": setup.get("permissions", {}),
        "allowList": setup.get("allowList", []),
        "brandSafety": setup.get("brandSafety", []),
        "partners": setup.get("partners", []),
        "approval": setup.get("approval", ""),
        "acts": setup.get("acts", []),
        "confirmed": c.setup_confirmed_at is not None,
        "mapped": c.setup_mapped,
        "lastImport": c.last_import,
    }


async def _integrations(ctx: Ctx, c: m.Client) -> list[dict[str, Any]]:
    rows = (
        await ctx.session.execute(
            select(m.ClientIntegration).where(m.ClientIntegration.client_id == c.id).order_by(m.ClientIntegration.seq)
        )
    ).scalars()
    return [
        {
            "id": i.id,
            "name": i.name,
            "kind": i.kind,
            "status": "mock" if i.status == "soon" else i.status,
            "note": i.note,
        }
        for i in rows
    ]


def notification_out(n: m.Notification, ref: str | None) -> dict[str, Any]:
    return {
        "id": str(n.id),
        "to": n.member_ref,
        "read": n.read_wall is not None,
        "title": n.title,
        "body": n.body,
        "at": _iso(n.at),
        "link": n.link,
        "ref": ref,
        "hindi": n.hindi,
        "en": n.en,
    }


def feed_out(f: m.FeedEvent) -> dict[str, Any]:
    return {
        "id": str(f.id),
        "key": f.key,
        "stage": f.stage,
        "agent": f.agent,
        "person": f.person,
        "icon": f.icon,
        "at": _iso(f.at),
        "text": f.text,
        "calls": f.calls or [],
        "human": f.human,
    }


# --- a case ---------------------------------------------------------------------------------------------------------


async def case_detail(ctx: Ctx, client_id: str, ref: str, cm: m.ClientMember) -> dict[str, Any]:
    c = await world.client(ctx, client_id)
    case = (await _open_cases(ctx, client_id)).get(ref)
    if case is None or case.status == "reset" or not visible(cm, case):
        raise not_found("batch in a journey")
    b = await ctx.session.get(m.Batch, (client_id, ref))
    x = await ctx.session.get(m.Sku, (client_id, case.sku_id))
    d = await ctx.session.get(m.Distributor, (client_id, case.distributor_id))
    assert b is not None and x is not None and d is not None
    agents = await world.agent_settings(ctx, client_id)
    rules = world.money_rules(c, agents)
    today = ev.now(ctx, c).astimezone(IST).date()
    bo = world.batch_obj(b, d, today)
    role, mine = cm.workspace_role, staff(cm)
    money_ok = mine

    orders = (
        (await ctx.session.execute(select(m.CaseOrder).where(m.CaseOrder.case_id == case.id).order_by(m.CaseOrder.id)))
        .scalars()
        .all()
    )
    bids = (
        (await ctx.session.execute(select(m.CaseBid).where(m.CaseBid.case_id == case.id).order_by(m.CaseBid.seq)))
        .scalars()
        .all()
    )
    chat = (
        (
            await ctx.session.execute(
                select(m.CaseMessage).where(m.CaseMessage.case_id == case.id).order_by(m.CaseMessage.id)
            )
        )
        .scalars()
        .all()
    )
    feed = (
        (await ctx.session.execute(select(m.FeedEvent).where(m.FeedEvent.case_id == case.id).order_by(m.FeedEvent.id)))
        .scalars()
        .all()
        if mine
        else []
    )

    orders_all = list(orders)
    if role == "retailer":
        orders = [o for o in orders if o.kirana_id == cm.org_ref]
    if role == "buyer":
        bids = [x_ for x_ in bids if x_.by_ref == cm.ref]
    elif role not in STAFF_ROLES and role != "distributor":
        bids, chat = [], []

    listing = dict(case.listing) if case.listing else None
    if listing is not None:
        if role == "buyer":
            listing["reserve"] = None
            listing.pop("api", None)
        if role in ("retailer", "foodbank"):
            listing = None
    photo = dict(case.photo or {})
    url = None
    if photo.get("object") and (mine or role == "distributor") and ctx.cloud and ctx.settings.photos_bucket:
        url = ctx.cloud.storage.signed_get(ctx.settings.photos_bucket, photo["object"])
    award = dict(case.award) if case.award else None
    if award and role in ("retailer", "foodbank"):
        award = None
    if award and role == "buyer" and award.get("buyerRef") != cm.ref:
        award = None

    journey = {
        "id": ref,
        "phase": case.phase,
        "photo": {
            "status": photo.get("status", "none") if photo.get("status") != "skipped" else "verified",
            "at": photo.get("at"),
            "confidence": photo.get("confidence"),
            "url": url,
            "read": photo.get("read"),
        },
        "plan": (
            {
                "status": (case.approval or {}).get("status", "proposed"),
                "at": (case.approval or {}).get("at"),
                "by": (case.approval or {}).get("by"),
                "device": (case.approval or {}).get("device"),
            }
            if case.approval
            else None
        ),
        "listing": (
            {k: listing.get(k) for k in ("id", "status", "units", "price", "reserve", "at", "title", "description")}
            if listing
            else None
        ),
        "offer": (
            {
                "status": case.offer["status"],
                "at": case.offer["at"],
                "shops": case.offer["shops"],
                "closesAt": case.offer["closesAt"],
            }
            if case.offer and role != "buyer"
            else None
        ),
        "orders": [{"id": o.kirana_id, "units": o.units, "at": _iso(o.at), "by": o.member_ref} for o in orders],
        "bids": [
            {
                "id": x_.id,
                "price": float(x_.price),
                "at": _iso(x_.at),
                "by": x_.by_ref,
                "status": x_.status,
                "counter": float(x_.counter) if x_.counter is not None else None,
            }
            for x_ in bids
        ],
        "chat": [{"id": str(q.id), "from": q.sender, "text": q.text, "at": _iso(q.at)} for q in chat],
        "award": (
            {k: award.get(k) for k in ("units", "price", "gross", "token", "balance", "at", "buyer", "status")}
            if award
            else None
        ),
        "van": {
            "status": (case.van or {}).get("status", "idle"),
            "done": (case.van or {}).get("done", 0),
            "at": (case.van or {}).get("at"),
        },
        "truck": {"status": (case.truck or {}).get("status", "idle"), "at": (case.truck or {}).get("at")},
        "staff": (
            {
                "status": case.staff["status"],
                "units": case.staff["units"],
                "price": case.staff["price"],
                "godown": case.staff.get("godown", ""),
                "at": case.staff.get("at"),
                "sold": case.staff.get("sold"),
                "left": case.staff.get("left"),
                "recordedAt": case.staff.get("recordedAt"),
            }
            if case.staff and (mine or role == "distributor")
            else None
        ),
        "docs": [{"id": d_["id"], "status": d_["status"]} for d_ in case.docs] if case.docs else None,
        "invoiceIssued": case.invoice_issued_at is not None,
        "posted": case.ledger is not None,
        "reviewed": case.reviewed is not None,
    }

    plan = None
    if money_ok and case.plan:
        plan = dict(case.plan)
        if case.valuation:
            notes = {r["id"]: r.get("note") for r in case.valuation["rows"]}
            plan["rows"] = [{**r, "note": notes.get(r["id"])} for r in plan["rows"]]
        else:
            plan["rows"] = [{**r, "note": None} for r in plan["rows"]]

    # what destroying the packs at risk would cost, from the Watcher's assessment: known from Detect on, before the
    # Valuer has priced the batch (SC-99), for those who may see Munchly's figures
    write_off = (
        money.jsonable(money.write_off(case.assess["atRisk"], world.sku_obj(x), rules=rules))
        if money_ok and case.assess
        else None
    )

    counter = None
    if listing and bids and (mine or role in ("distributor", "buyer")):
        last = bids[-1]
        if last.counter is not None:
            reserve = float((case.listing or {}).get("reserve") or 0)
            counter = {"action": "counter", "price": float(last.counter), "below": float(last.price) < reserve}
    award_price = float(case.award["price"]) if case.award else None
    # what the finished lines took (SC-86): the actual figures and the credit note follow what happened, and what no
    # channel took is left at the godown
    lines_state = {"offer": case.offer, "award": case.award, "listing": case.listing}
    lines_state |= {"staff": case.staff, "donation": case.donation}
    done = J.done_units(lines_state, sum(o.units for o in orders_all))
    real = money.realised(case.plan, world.sku_obj(x), done, None, c.expiry, rules=rules) if case.plan else None
    settled = case.phase in ("dispatched", "settled", "cleared")
    es = copy.line(case.plan or {}, "expiresoon")
    actual = None
    if money_ok and real is not None and (award_price is not None or settled):
        actual = money.jsonable(
            money.actual_net(real, award_price if award_price is not None else es["price"] if es else 0)
        )
    support = support_plan = claim = None
    if case.plan and (money_ok or role == "distributor"):
        so = world.sku_obj(x)
        support_plan = money.jsonable(money.price_support(case.plan, so, rules=rules))
        if award_price is not None or settled:
            support = money.jsonable(money.price_support(real, so, award_price, rules=rules))
        claim = money.jsonable(money.expiry_claim(case.plan["units"], so, rules=rules)) if money_ok else None
    realised_out = (
        {"lines": [{"id": ln["id"], "units": ln["units"]} for ln in real["lines"]], "godown": real["godown"]}
        if real is not None and done and (mine or role == "distributor")
        else None
    )

    docs = []
    if case.docs and (mine or role in ("distributor", "foodbank")):
        for d_ in case.docs:
            if role == "distributor" and d_["id"] not in ("invoice", "eway", "support", "expiry"):
                continue
            if role == "foodbank" and d_["id"] != "receipt":  # a food bank sees its own receipt (SC-110)
                continue
            docs.append(
                {
                    **{
                        k: d_.get(k)
                        for k in (
                            "id",
                            "type",
                            "owner",
                            "no",
                            "status",
                            "amount",
                            "note",
                            "taxable",
                            "igst",
                            "roundOff",
                            "total",
                            "units",
                            "price",
                            "gstPct",
                            "exact",
                            "date",
                        )
                    },
                    # the expiry paper's settlement, and the GST memo's reversal on expiry day (SC-94)
                    **{k: d_[k] for k in ("policy", "destroyedBy", "disposal", "epr", "itc", "reversed") if k in d_},
                    # the food bank's receipt (SC-110)
                    **{k: d_[k] for k in RECEIPT_FIELDS if k in d_},
                    "pdf": bool(d_.get("pdf")),
                }
            )

    kiranas = []
    if case.offer and (mine or role == "distributor" or role == "retailer"):
        caps = case.offer.get("caps") or {}
        ordered = {o.kirana_id: o for o in orders}
        for k in await world.kiranas(ctx, client_id, case.distributor_id):
            if k.id not in caps or (role == "retailer" and k.id != cm.org_ref):
                continue
            o = ordered.get(k.id)
            kiranas.append(
                {
                    "id": k.id,
                    "name": k.name,
                    "area": k.area,
                    "cap": caps[k.id],
                    "units": o.units if o else 0,
                    "at": _iso(o.at) if o else None,
                    "member": k.member_ref,
                }
            )

    # the pushes the screens show: a member's own; staff see each the journey sent (the first of each kind), and a
    # distributor also the offer his kiranas got
    q = select(m.Notification).where(m.Notification.case_id == case.id).order_by(m.Notification.id)
    if not mine:
        beat_members = (
            [k.member_ref for k in await world.kiranas(ctx, client_id, case.distributor_id) if k.member_ref]
            if role == "distributor"
            else []
        )
        q = q.where(m.Notification.member_ref.in_([cm.ref, *beat_members]))
    push: dict[str, dict[str, Any]] = {}
    for n in (await ctx.session.execute(q)).scalars():
        if n.key in push and n.member_ref != cm.ref:
            continue
        push[n.key] = {
            "to": n.member_ref,
            "at": _iso(n.at),
            "title": n.title,
            "body": n.body,
            "hindi": n.hindi,
            "en": n.en,
        }

    donation = dict(case.donation) if case.donation and (mine or role == "foodbank") else None
    # the plan's split, without Munchly's figures: the whole of it for the distributor holding the batch, a partner's
    # own line for the others (a kirana the scheme's, the buyer the lot's, a food bank its donation)
    own = {"retailer": "kirana", "buyer": "expiresoon", "foodbank": "foodbank"}.get(role or "")
    split = (
        [
            {k: ln.get(k) for k in ("id", "name", "short", "units", "price", "packPrice", "charged", "cartons")}
            for ln in case.plan.get("lines", [])
            if mine or role == "distributor" or ln.get("id") == own
        ]
        if case.plan and case.phase not in ("watching", "at-risk", "verified", "valued")
        else None
    )
    batch = {**_batch_out(bo), "assess": case.assess, "phase": case.phase}
    return {
        "seq": c.stream_seq,
        "ref": ref,
        "batch": batch,
        "sku": world.sku_obj(x),
        "distributor": world.dist_obj(d),
        "journey": journey,
        "feed": [feed_out(f) for f in feed],
        "plan": plan,
        "writeOff": write_off,
        # the ledger Impact posted, as the Finance & ESG ledger reads it (SC-124), for those who see Munchly's figures
        "ledger": ledger_.row(case, world.sku_obj(x), d) if money_ok and case.ledger else None,
        "counter": counter,
        # the buyer's bill reads the award's invoice from the moment the lot is won, before the papers (SC-96)
        "award": (
            {
                **{k: case.award[k] for k in ("units", "price", "gross", "token", "balance")},
                "invoice": money.jsonable(money.invoice(case.award["units"], case.award["price"], world.sku_obj(x))),
            }
            if award
            else None
        ),
        "actual": actual,
        "support": support,
        "supportPlan": support_plan,
        "realised": realised_out,
        "claim": claim,
        "docs": docs,
        # expiry day's settlement of the packs left at the godown, once the report has run (SC-94)
        "expiry": (case.ledger or {}).get("expiry") if case.ledger and (mine or role == "distributor") else None,
        "kiranas": kiranas,
        "offered": int((case.offer or {}).get("shops", 0)),
        "donation": (
            {
                "status": donation["status"],
                "partner": donation.get("partnerName"),
                "units": donation["units"],
                "pickupAt": donation.get("pickupAt"),
                "slots": donation.get("slots", []),
                "spot": donation.get("spot"),
                "from": donation.get("from") or d.godown or d.city,
                "at": donation.get("at") or donation.get("declinedAt"),
                "confirmedAt": donation.get("confirmedAt"),
                "collectedAt": donation.get("collectedAt"),
                "reply": donation.get("reply"),
                "reason": donation.get("reason"),
                # the food bank's receipt, issued as it collected (SC-110)
                "receipt": receipt_out(donation.get("receipt")),
            }
            if donation
            else None
        ),
        "returnBy": (b.best_before - timedelta(days=c.return_window_days)).isoformat() if b.best_before else None,
        "push": push,
        "split": split,
        "moments": _moments(c, case, d, listing),
    }


def _moments(c: m.Client, case: m.Case, d: m.Distributor, listing: dict[str, Any] | None) -> dict[str, Any]:
    """the journey's moments its screens state, as facts on the journey clock: the case's day 0, how soon a plan follows
    the label, when the distributor was asked for his permission, the listing's address, and the van round that
    takes the scheme's orders (the morning after the scheme closed and the papers were drafted, SC-97)"""
    rules = (c.workspace_doc or {}).get("moments") or {}
    van = J.van_leaves(case.offer, case.docs, world.van_time(c))
    leaves = van.isoformat() if van else None
    url = rules.get("listingUrl")
    return {
        "day0": _iso(case.opened_at),
        "planMinutes": int(rules.get("planMinutes", 20)),
        "permissionAskedAt": _iso(c.setup_confirmed_at),
        "listingUrl": url.replace("{id}", listing["id"]) if url and listing and listing.get("id") else None,
        "van": {
            "leavesAt": leaves,
            "depot": d.godown or d.city,
            "doneAt": (case.van or {}).get("at"),
        },
    }


# --- the ledger and the audit log ------------------------------------------------------------------------------------


async def _all(ctx: Ctx, model: Any, client_id: str) -> list[Any]:
    return list((await ctx.session.execute(select(model).where(model.client_id == client_id))).scalars())


async def ledger(ctx: Ctx, client_id: str) -> dict[str, Any]:
    """the Finance & ESG ledger (SC-124): every batch cleared in view (the client's history and this journey's), as
    its posted ledger, the periods they fall in with their totals, and the batches still out"""
    c = await world.client(ctx, client_id)
    cases = await _open_cases(ctx, client_id)
    skus = {x.id: world.sku_obj(x) for x in await _all(ctx, m.Sku, client_id)}
    dists = {d.id: d for d in await _all(ctx, m.Distributor, client_id)}
    cleared, out = [], []
    for case in cases.values():
        if case.status == "reset":
            continue
        sku, dist = skus[case.sku_id], dists[case.distributor_id]
        if case.status == "cleared" and case.ledger:
            cleared.append(ledger_.row(case, sku, dist))
        elif case.status != "cleared":
            out.append(ledger_.open_row(case, sku, dist))
    cleared.sort(key=lambda r: (r["cleared"], r["ref"]))
    out.sort(key=lambda r: (r["flagged"], r["ref"]))
    today = ev.now(ctx, c).astimezone(IST).date()
    return {
        "since": _workspace(c)["since"],
        "today": today.isoformat(),
        "co2PerKg": money.RULES["co2PerKg"],
        "periods": ledger_.periods(cleared, today),
        "batches": cleared,
        "inFlight": out,
    }


async def audit_page(ctx: Ctx, client_id: str, before: str | None, limit: int = 100) -> dict[str, Any]:
    q = select(m.AuditEntry).where(m.AuditEntry.client_id == client_id).order_by(m.AuditEntry.id.desc()).limit(limit)
    if before:
        q = q.where(m.AuditEntry.id < int(before))
    rows = (await ctx.session.execute(q)).scalars().all()
    out = []
    for r in rows:
        d = r.details or {}
        out.append(
            {
                "id": str(r.id),
                "who": d.get("member") or r.actor_name,
                "what": r.text,
                "target": d.get("target", ""),
                "at": _iso(r.at),
            }
        )
    return {"rows": out, "before": str(rows[-1].id) if len(rows) == limit else None}


# --- the stream -----------------------------------------------------------------------------------------------------


def tokens(cm: m.ClientMember) -> list[str]:
    return ev.audience_of(cm)


async def events_after(
    ctx: Ctx, client_id: str, hear: list[str], after: int, limit: int = EVENTS_PAGE
) -> dict[str, Any]:
    """the member's stream after a position (`hear`: the audience tokens they hear, events.audience_of): what the SSE
    stream sends one by one, and the polling fallback"""
    c = await world.client(ctx, client_id)
    oldest = (
        await ctx.session.execute(
            select(m.StreamRow.seq).where(m.StreamRow.client_id == client_id).order_by(m.StreamRow.seq).limit(1)
        )
    ).scalar_one_or_none()
    reset = after > c.stream_seq or (oldest is not None and after < oldest - 1)
    q = (
        select(m.StreamRow, m.FeedEvent, m.Notification)
        .outerjoin(m.FeedEvent, m.FeedEvent.id == m.StreamRow.feed_id)
        .outerjoin(m.Notification, m.Notification.id == m.StreamRow.notification_id)
        .where(
            m.StreamRow.client_id == client_id,
            m.StreamRow.seq > (0 if reset else after),
            or_(m.StreamRow.audience.is_(None), m.StreamRow.audience.overlap(hear)),
        )
        .order_by(m.StreamRow.seq)
        .limit(limit)
    )
    events = []
    for row, f, n in (await ctx.session.execute(q)).all():
        events.append(
            {
                "seq": row.seq,
                "type": row.kind,
                "wall": _iso(row.wall),
                "ref": row.ref,
                "feed": feed_out(f) if f else None,
                "notification": notification_out(n, row.ref) if n else None,
            }
        )
    return {"seq": c.stream_seq, "events": [] if reset else events, "reset": reset}


async def document_object(ctx: Ctx, client_id: str, ref: str, doc: str) -> str | None:
    """where a document's PDF is, in the docs bucket; the food bank's receipt has its PDF before the pack (SC-110)"""
    case = (await _open_cases(ctx, client_id)).get(ref)
    if case is None:
        return None
    rcpt = (case.donation or {}).get("receipt") or {}
    if doc == "receipt" and rcpt.get("pdf"):
        return rcpt["pdf"]
    return next((d.get("pdf") for d in case.docs or [] if d["id"] == doc), None)


# the food bank's receipt beyond a paper's own fields (SC-110, money.receipt)
RECEIPT_FIELDS = (
    *("paper", "stamp", "kg", "meals", "mealsRule", "value", "csr"),
    *("at", "by", "donor", "fssai", "via", "from", "spot"),
)


def receipt_out(r: dict[str, Any] | None) -> dict[str, Any] | None:
    """the food bank's receipt as the screens read it: a paper, with whether its PDF is ready"""
    if not r:
        return None
    keys = ("id", "type", "owner", "no", "status", "amount", "note", "units", "date", *RECEIPT_FIELDS)
    return {**{k: r.get(k) for k in keys}, "pdf": bool(r.get("pdf"))}
