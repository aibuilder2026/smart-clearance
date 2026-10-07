"""The workspace's own administration (SC-66): its admin invites members and changes their roles, the guardrails are
set, members mark their inbox read, and register their browsers for push. Each change writes its audit line in the
member's name, in the prototype's words (design3/screens/admin.jsx)."""

import re
from typing import Any

from sqlalchemy import delete, select

from sc_api import models as m
from sc_api.domain.rules import is_email
from sc_api.errors import ApiError, not_found
from sc_api.services import audit, people
from sc_api.services.context import Ctx
from sc_api.services.journey import events as ev
from sc_api.services.journey import world
from sc_api.services.presenter import lock_client

ROLE_ACCESS = {
    "operator": "member",
    "finance": "member",
    "sustainability": "member",
    "admin": "admin",
    "distributor": "partner",
    "retailer": "partner",
    "buyer": "partner",
    "foodbank": "partner",
}
TIME = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def _me(ctx: Ctx) -> str:
    assert ctx.actor.member_ref
    return ctx.actor.member_ref


async def invite(ctx: Ctx, client_id: str, data: dict[str, Any]) -> None:
    """a member invited to the workspace: a Firebase account on the default password (nothing is mailed). Munchly's
    own people use its address; partners, any other"""
    ctx.require("ws.members", "Only the workspace's admin invites people.")
    c = await lock_client(ctx, client_id)
    name, email, role = (data.get("name") or "").strip(), (data.get("email") or "").strip().lower(), data.get("role")
    if not name:
        raise ApiError(422, "Give the person's name.", {"name": "A name."})
    if role not in ROLE_ACCESS:
        raise ApiError(422, "Choose a role.", {"role": "A role."})
    if not is_email(email):
        raise ApiError(422, "Give an email address.", {"email": "An email address."})
    staff = ROLE_ACCESS[role] != "partner"
    domain = email.rsplit("@", 1)[-1]
    if staff and domain != c.email_domain:
        raise ApiError(
            422, f"{c.short}'s own people use their @{c.email_domain} address.", {"email": f"@{c.email_domain}"}
        )
    if not staff and domain == c.email_domain:
        raise ApiError(
            422, f"Partners use their own address, not @{c.email_domain}.", {"email": "A partner's address."}
        )
    roles = (c.workspace_doc or {}).get("roles", {})
    org = (data.get("org") or "").strip() or (c.short if staff else name)
    me = await world.member(ctx, client_id, _me(ctx))
    await people.add(
        ctx,
        c,
        people.MemberSpec(
            ref=ctx.ids.new("p"),
            name=name,
            org=org,
            role_label=roles.get(role, role),
            kind=roles.get(role, role),
            access=ROLE_ACCESS[role],
            member_class="staff" if staff else "partner",
            provider=people.EMAIL_AND_PASSWORD,
            email=email,
            workspace_role=role,
        ),
    )
    added = (
        (
            await ctx.session.execute(
                select(m.ClientMember).where(m.ClientMember.client_id == client_id).order_by(m.ClientMember.seq.desc())
            )
        )
        .scalars()
        .first()
    )
    if added is not None:
        added.invited_by_name = me.org if not staff else me.name
    await audit.record(
        ctx,
        c.id,
        "member.invite",
        f"invited {name} as {roles.get(role, role).lower()}",
        {"member": _me(ctx), "target": email},
    )
    await ev.changed(ctx, c)


async def update(ctx: Ctx, client_id: str, ref: str, patch: dict[str, Any]) -> None:
    ctx.require("ws.members", "Only the workspace's admin changes people.")
    c = await lock_client(ctx, client_id)
    p = await ctx.session.get(m.ClientMember, (client_id, ref), with_for_update=True)
    if p is None:
        raise not_found("member")
    roles = (c.workspace_doc or {}).get("roles", {})
    status = patch.get("status")
    if status is not None and status != p.status:
        if status == "deactivated":
            if c.approver_ref == p.ref:
                raise ApiError(422, f"{p.name} approves {c.name}'s plans. Choose another approver first.")
            if p.ref == _me(ctx):
                raise ApiError(422, "You cannot deactivate yourself.")
            p.status = "deactivated"
        elif status == "active":
            p.status = "active" if p.joined_at else "invited"
        else:
            raise ApiError(422, "A member is active or deactivated.")
        verb = "deactivated" if p.status == "deactivated" else "reactivated"
        await audit.record(ctx, c.id, "member.status", f"{verb} {p.name}", {"member": _me(ctx), "target": p.org})
    role = patch.get("role")
    if role is not None and role != p.workspace_role:
        if role not in ROLE_ACCESS or (ROLE_ACCESS[role] == "partner") != (p.member_class != "staff"):
            raise ApiError(422, "That role is not open to this member.", {"role": "Another role."})
        p.workspace_role = role
        await audit.record(
            ctx,
            c.id,
            "member.role",
            f"made {p.name} {roles.get(role, role).lower()}",
            {"member": _me(ctx), "target": p.org},
        )
    await ev.changed(ctx, c)


async def save_rules(ctx: Ctx, client_id: str, r: dict[str, Any]) -> None:
    """the guardrails, each fact where it lives: client columns, the Watcher's time and the Negotiator's token"""
    ctx.require("ws.rules", "Your role can't change the guardrails.")
    c = await lock_client(ctx, client_id)
    agents = await world.agent_settings(ctx, client_id)
    current = world.ws_rules(c, agents)
    errors: dict[str, str] = {}

    def num(key: str, lo: float, hi: float) -> float | None:
        v = r.get(key, current[key])
        if isinstance(v, bool) or not isinstance(v, int | float) or not lo <= v <= hi:
            errors[key] = f"{lo:g} to {hi:g}."
            return None
        return v

    if not isinstance(r.get("watchTime", current["watchTime"]), str) or not TIME.match(
        r.get("watchTime", current["watchTime"])
    ):
        errors["watchTime"] = "A time such as 09:00."
    floors = r.get("floors", current["floors"])
    if not isinstance(floors, dict) or not all(isinstance(v, int | float) and 0 <= v <= 90 for v in floors.values()):
        errors["floors"] = "Each floor is 0 to 90% of MRP."
    values = {
        "approvalTaps": num("approvalTaps", 0, 100),
        "offerWindowHours": num("offerWindowHours", 1, 168),
        "tokenPct": num("tokenPct", 5, 30),
        "disposalPerUnit": num("disposalPerUnit", 0, 100),
        "eprPerKg": num("eprPerKg", 0, 100),
        "returnWindowDays": num("returnWindowDays", 7, 45),
        "kiranaUplift": num("kiranaUplift", 1, 10),
        "vanPerUnit": num("vanPerUnit", 0, 20),
    }
    if errors:
        raise ApiError(422, "Check the highlighted guardrails.", errors)
    changes = [k for k in current if k in r and r[k] != current[k]]
    if not changes:
        return
    c.approval_taps = int(values["approvalTaps"])  # type: ignore[arg-type]
    c.offer_window_hours = int(values["offerWindowHours"])  # type: ignore[arg-type]
    c.disposal_per_unit, c.epr_per_kg = values["disposalPerUnit"], values["eprPerKg"]  # type: ignore[assignment]
    c.return_window_days = int(values["returnWindowDays"])  # type: ignore[arg-type]
    c.kirana_uplift, c.van_per_unit = values["kiranaUplift"], values["vanPerUnit"]  # type: ignore[assignment]
    c.floors = {k: int(v) for k, v in floors.items()}
    c.hindi_offers = bool(r.get("hindiOffers", current["hindiOffers"]))
    c.require_photo = bool(r.get("requirePhoto", current["requirePhoto"]))
    c.territory_guard = bool(r.get("territoryGuard", current["territoryGuard"]))
    for agent_id, key, value in (
        ("watcher", "time", r.get("watchTime", current["watchTime"])),
        ("negotiator", "tokenPct", values["tokenPct"]),
    ):
        row = await ctx.session.get(m.ClientAgent, (client_id, agent_id), with_for_update=True)
        if row is not None:
            row.settings = {**(row.settings or {}), key: value}
    await audit.record(
        ctx,
        c.id,
        "rules.save",
        f"changed the guardrails: {', '.join(changes)}",
        {"member": _me(ctx), "target": "Guardrails", "changes": {k: r[k] for k in changes}},
    )
    await ev.changed(ctx, c)


async def mark_read(ctx: Ctx, client_id: str, ids: list[str] | None) -> None:
    c = await lock_client(ctx, client_id)
    n = await ev.mark_read(ctx, client_id, _me(ctx), [int(i) for i in ids] if ids is not None else None)
    if n:
        await ev.emit(ctx, c, "workspace", audience=[_me(ctx)])


async def register_device(ctx: Ctx, client_id: str, token: str, user_agent: str) -> None:
    if not token or len(token) > 4096:
        raise ApiError(422, "A device token.", {"token": "A device token."})
    assert ctx.actor.user_id is not None
    now = ctx.clock.now()
    row = await ctx.session.get(m.Device, token, with_for_update=True)
    if row is None:
        ctx.session.add(
            m.Device(
                token=token,
                user_id=ctx.actor.user_id,
                client_id=client_id,
                user_agent=user_agent[:300],
                created_wall=now,
                last_seen_wall=now,
            )
        )
        await audit.record(
            ctx,
            client_id,
            "device.register",
            "turned on push on a device",
            {"member": _me(ctx), "target": user_agent[:120]},
        )
    else:
        row.user_id, row.client_id, row.last_seen_wall = ctx.actor.user_id, client_id, now
    await ctx.session.flush()


async def unregister_device(ctx: Ctx, client_id: str, token: str) -> None:
    assert ctx.actor.user_id is not None
    result = await ctx.session.execute(
        delete(m.Device).where(m.Device.token == token, m.Device.user_id == ctx.actor.user_id)
    )
    if result.rowcount:
        await audit.record(ctx, client_id, "device.unregister", "turned off push on a device", {"member": _me(ctx)})
