"""Munchly Foods' live workspace (SC-66), built on what the story import (story.py) made for the console: the world the
workspace app and the agents need (reference/journey.json, which frontend/scripts/seed.mjs writes from design3), and
then a journey from its start (services/journey/reset.py).

- Every member signs in with email and password: Munchly's people on munchly.example, everyone outside Munchly
  (distributors, all 38 kiranas on Rakesh Traders' beat, the Raipur buyer, the food banks) on google.example. Each
  gets a Firebase account on the default password, with a deterministic uid; nothing is mailed.
- SKUs gain their economics, distributors their godowns and territories; the kiranas, the buyer and the food banks are
  rows of their own; the papers are numbered from the story's own numbers.
"""

from typing import Any

from sqlalchemy import select

from sc_api import models as m
from sc_api.identity import synthetic_uid
from sc_api.services import people, users
from sc_api.services.context import Ctx
from sc_api.services.journey import reset
from sc_api.services.reference import load

PROVIDER = people.EMAIL_AND_PASSWORD


async def build(ctx: Ctx, client_id: str = "munchly") -> dict[str, Any]:
    j = load("journey.json")
    c = await ctx.session.get(m.Client, client_id, with_for_update=True)
    if c is None:
        raise SystemExit(f"live: there is no client {client_id}; import the story first")
    w = j["workspace"]
    c.email_domain = j["domains"]["staff"]
    # the console's sign-in methods (SignInMethod); the workspace's own, with their icons, are in workspace_doc
    c.sign_in = [{k: s[k] for k in ("id", "title", "who", "rule")} | {"on": True} for s in w["signIn"]]
    c.workspace_doc = {
        **(c.workspace_doc or {}),
        "platform": j["platform"],
        "signIn": w["signIn"],
        "outside": w["outside"],
        "profile": w["profile"],
        "since": w["since"],
        "plan": w["plan"],
        "shortName": "Clearance",
        "setup": {k: v for k, v in j["setup"].items() if k != "partners"}
        | {"partners": [{"id": _slug(p["name"]), **p} for p in j["setup"]["partners"]]},
        "roles": j["roles"],
        "stages": j["stages"],
        "gstin": j["client"]["gstin"],
        "fssai": j["client"]["fssai"],
        # what the workspace says about its client, beside what the console holds
        "client": {k: j["client"][k] for k in ("listed", "revenue", "shortDatedPerQuarter", "destroyedToday")},
        # what the sign-in and the invite form suggest typing: an address on each of the workspace's two domains
        "hint": f"name@{j['domains']['staff']}",
        "invite": {"name": w["invite"]["name"], "contact": f"{_slug(w['invite']['name'])}@{j['domains']['partners']}"},
        "market": j["market"],
        # a synthetic workspace offers the story's people on its sign-in (their address; the password is handed over)
        "accounts": [
            {"group": g["group"], "note": g["note"], "people": [{"id": i, "does": does} for i, does in g["ids"]]}
            for g in j["explore"]
        ],
        "moments": {k: v for k, v in j["moments"].items()} | {"donation": _donation_rules(j["moments"]["donation"])},
        "quarter": j["quarter"],
        "synthetic": True,
        "heroRef": next(b["id"] for b in j["batches"] if b.get("hero")),
        "story": {"shelf": j["shelf"]},
    }
    for i in j["integrations"]:
        row = await ctx.session.get(m.ClientIntegration, (client_id, i["id"]))
        if row is None:
            ctx.session.add(
                m.ClientIntegration(client_id=client_id, **{k: i[k] for k in ("id", "name", "kind", "status", "note")})
            )
        else:
            row.name, row.kind, row.status, row.note = i["name"], i["kind"], i["status"], i["note"]
    for old in ("sso",):  # Google sign-in is gone: email and password only
        row = await ctx.session.get(m.ClientIntegration, (client_id, old))
        if row is not None:
            row.status, row.note = "mock", "Not used: everyone signs in with email and password"

    for x in j["skus"].values():
        s = await ctx.session.get(m.Sku, (client_id, x["id"]))
        if s is None:
            continue
        s.category, s.hsn, s.cost, s.per_carton = x["category"], x["hsn"], x["cost"], x["perCarton"]
        s.dp, s.itc_per_unit, s.kg_per_unit, s.img = x.get("dp"), x.get("itcPerUnit"), x["kgPerUnit"], x["img"]

    for x in j["distributors"].values():
        d = await ctx.session.get(m.Distributor, (client_id, x["id"]))
        if d is None:
            continue
        d.short, d.godown, d.address, d.gstin = x["short"], x["godown"], x.get("address"), x.get("gstin")
        d.cluster, d.territory, d.pins, d.state = x["cluster"], x["territory"], x["pins"], x["state"]
        d.upi = x.get("upi")
        if x.get("staffCap") is not None:
            d.staff_cap = x["staffCap"]

    await _members(ctx, c, j)

    b = j["buyer"]
    await _partner(
        ctx,
        client_id,
        b["id"],
        "buyer",
        b["name"],
        b["short"],
        b["city"],
        {k: b[k] for k in ("state", "stateCode", "address", "gstin", "kind")},
        _member_of(j, b["id"]),
    )
    for p in j["setup"]["partners"]:
        pid = _slug(p["name"])
        await _partner(
            ctx,
            client_id,
            pid,
            "foodbank",
            p["name"],
            p["name"],
            None,
            {k: p[k] for k in ("minDays", "minUnits", "logistics", "paper")},
            _member_of(j, pid),
        )

    # each distributor's own cluster: Rakesh Traders' in Nagpur, Lakshmi Agencies' in Hyderabad (SC-86)
    for k in j["kiranas"]:
        row = await ctx.session.get(m.Kirana, (client_id, k["id"]))
        if row is None:
            row = m.Kirana(
                client_id=client_id,
                id=k["id"],
                distributor_id=k["distributor"],
                name=k["name"],
                area=k["area"],
                pincode=k["pincode"],
                sales_14d=int(k["sales14"]),
                member_ref=k["member"],
            )
            ctx.session.add(row)
        else:
            row.name, row.area, row.pincode, row.sales_14d = k["name"], k["area"], k["pincode"], int(k["sales14"])
            row.distributor_id, row.member_ref = k["distributor"], k["member"]

    for kind, n in j["numbers"].items():
        row = await ctx.session.get(m.DocumentNumber, (client_id, kind))
        if row is None:
            ctx.session.add(
                m.DocumentNumber(client_id=client_id, kind=kind, prefix=n["prefix"], next=n["next"], width=n["width"])
            )
    c.floors = None
    await ctx.session.flush()
    started = await reset.reset(ctx, client_id)
    members = (
        (await ctx.session.execute(select(m.ClientMember).where(m.ClientMember.client_id == client_id))).scalars().all()
    )
    return {"members": len(members), "kiranas": len(j["kiranas"]), **started}


def _donation_rules(d: dict[str, Any]) -> dict[str, Any]:
    """the food bank's pickup: the hour the Donation agent proposes, the slots it may move to, and the story's spot"""
    return {k: d[k] for k in ("time", "slots", "spots")}


def _slug(name: str) -> str:
    import re

    return re.sub(r"[^a-z0-9]+", "-", name.lower().replace("&", " ")).strip("-")


def _member_of(j: dict[str, Any], org: str) -> str | None:
    return next((ref for ref, o in j["org"].items() if o == org), None)


async def _partner(
    ctx: Ctx,
    client_id: str,
    pid: str,
    kind: str,
    name: str,
    short: str,
    city: str | None,
    details: dict[str, Any],
    member_ref: str | None,
) -> None:
    row = await ctx.session.get(m.Partner, (client_id, pid))
    if row is None:
        ctx.session.add(
            m.Partner(
                client_id=client_id,
                id=pid,
                kind=kind,
                name=name,
                short=short,
                city=city,
                details=details,
                member_ref=member_ref,
            )
        )
    else:
        row.name, row.short, row.city, row.details, row.member_ref = name, short, city, details, member_ref


async def _members(ctx: Ctx, c: m.Client, j: dict[str, Any]) -> None:
    """every member on email and password, with their workspace role and what they stand for"""
    staff_domain, partner_domain = j["domains"]["staff"], j["domains"]["partners"]
    for x in j["members"]:
        login = x["login"].lower()
        assert login.endswith((f"@{staff_domain}", f"@{partner_domain}")), login
        cm = await ctx.session.get(m.ClientMember, (c.id, x["id"]), with_for_update=True)
        member_class = "external" if x["kind"] == "external" else ("staff" if x["kind"] == "staff" else "partner")
        if cm is None:
            cm = await people.add(
                ctx,
                c,
                people.MemberSpec(
                    ref=x["id"],
                    name=x["name"],
                    org=x["org"],
                    role_label=j["roles"].get(x["role"], x["role"]),
                    kind=j["roles"].get(x["role"], x["role"]),
                    access=x["access"],
                    member_class=member_class,
                    provider=PROVIDER,
                    status=x["status"],
                    email=login,
                    workspace_role=x["role"],
                    img=x.get("img"),
                    joined_at=ctx.clock.now() if x["status"] != "invited" else None,
                ),
                uid=synthetic_uid(login),
                reset=True,
            )
        else:
            user = await ctx.session.get(m.User, cm.user_id, with_for_update=True)
            assert user is not None
            if user.email != login:
                clash = await users.find(ctx, email=login)
                if clash is not None and clash.id != user.id:
                    raise SystemExit(f"live: {login} already belongs to someone else")
                user.email = login
            await users.ensure_account(ctx, user, x["name"], uid=synthetic_uid(login), reset=True)
            cm.workspace_role, cm.access_role_id, cm.member_class = x["role"], x["access"], member_class
            cm.org = x["org"]  # the story's import may have named a partner's member by the person (SC-92)
            cm.provider = PROVIDER
            if x["status"] == "deactivated":
                cm.status = "deactivated"
        cm.org_ref = j["org"].get(x["id"])
        cm.lang, cm.city, cm.invited_by_name = x.get("lang"), x.get("city"), x.get("invitedBy")
        if x.get("img"):
            cm.img = x["img"]
    await ctx.session.flush()
