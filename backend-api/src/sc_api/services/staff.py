"""The platform's own staff: who may sign in to the console, and with which role."""

import uuid
from dataclasses import dataclass

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain.rules import staff_invite_error
from sc_api.errors import ApiError
from sc_api.identity import CANNOT_SIGN_IN
from sc_api.schemas import Staff, StaffInviteInput
from sc_api.services import audit, users
from sc_api.services.context import Actor, Ctx

EMAIL_AND_PASSWORD = "Email and password"
NOT_SET_UP = "not set up yet"


@dataclass(frozen=True)
class StaffSpec:
    """a staff member as the import or a bootstrap knows them"""

    name: str
    email: str
    role: str  # "Super admin", …
    ref: str | None = None
    short: str | None = None
    team: str | None = None
    active: bool = False


async def _role(ctx: Ctx, name: str) -> m.Role:
    role = (
        await ctx.session.execute(select(m.Role).where(m.Role.scope == "platform", m.Role.name == name))
    ).scalar_one_or_none()
    if role is None:
        raise ApiError(422, f"{name} is not a console role.", {"role": "Choose a role."})
    return role


def present(s: m.StaffMember, user: m.User, role: m.Role) -> Staff:
    return Staff(
        id=s.ref,
        name=s.name,
        short=s.short,
        role=role.name,
        team=s.team,
        email=user.email or "",
        passkey=EMAIL_AND_PASSWORD if s.status == "active" else NOT_SET_UP,
        status=s.status,
    )


async def list_staff(ctx: Ctx) -> list[Staff]:
    rows = (
        await ctx.session.execute(
            select(m.StaffMember, m.User, m.Role)
            .join(m.User, m.User.id == m.StaffMember.user_id)
            .join(m.Role, m.Role.id == m.StaffMember.role_id)
            .order_by(m.StaffMember.seq)
        )
    ).all()
    return [present(s, u, r) for s, u, r in rows]


async def add(ctx: Ctx, spec: StaffSpec, *, uid: str | None = None, reset: bool = False) -> Staff:
    """a staff member and their Firebase account, on the default password. Invited, until they first sign in."""
    email = spec.email.strip().lower()
    role = await _role(ctx, spec.role)
    user = await users.get_or_create(ctx, email=email)
    if (await ctx.session.get(m.StaffMember, user.id)) is not None:
        raise ApiError(422, f"{email} is already on the console's staff.", {"email": "Already on the staff."})
    await users.ensure_account(ctx, user, spec.name.strip(), uid=uid, reset=reset)
    now = ctx.clock.now()
    name = spec.name.strip()
    member = m.StaffMember(
        user_id=user.id,
        ref=spec.ref or ctx.ids.new("st"),
        role_id=role.id,
        name=name,
        short=spec.short or name.split(" ")[0],
        team=spec.team or role.team or "Platform",
        status="active" if spec.active else "invited",
        invited_by=ctx.actor.user_id,
        invited_at=now,
        activated_at=now if spec.active else None,
    )
    ctx.session.add(member)
    ctx.session.add(m.Invitation(user_id=user.id, kind="staff", created_at=now, created_by=ctx.actor.user_id))
    await ctx.session.flush()
    return present(member, user, role)


async def invite(ctx: Ctx, data: StaffInviteInput) -> Staff:
    """Invite a colleague to the console: a Super admin's call."""
    ctx.require("staff.invite", "Only a Super admin can invite staff.")
    problem = staff_invite_error(data.name, data.email, ctx.settings.staff_email_domain)
    if problem:
        raise ApiError(422, problem, {"email": problem} if data.name.strip() else {"name": problem})
    staff = await add(ctx, StaffSpec(name=data.name, email=data.email, role=data.role))
    await audit.record(ctx, None, "staff.invite", f"Invited {staff.name} to the console as {data.role}")
    return staff


@dataclass(frozen=True)
class SignedIn:
    staff: Staff
    actor: Actor


async def by_uid(ctx: Ctx, uid: str, *, activate: bool = False) -> SignedIn:
    """the staff member a Firebase account belongs to. An invited member becomes active on their first sign-in
    (activate=True, from POST /v1/console/session); anyone else may not sign in."""
    row = (
        await ctx.session.execute(
            select(m.StaffMember, m.User, m.Role)
            .join(m.User, m.User.id == m.StaffMember.user_id)
            .join(m.Role, m.Role.id == m.StaffMember.role_id)
            .where(m.User.firebase_uid == uid)
        )
    ).one_or_none()
    if row is None:
        raise ApiError(401, CANNOT_SIGN_IN)
    s, user, role = row
    if s.status != "active":
        if not activate:
            raise ApiError(401, CANNOT_SIGN_IN)
        now = ctx.clock.now()
        s.status = "active"
        s.activated_at = now
        invitation = (
            await ctx.session.execute(
                select(m.Invitation)
                .where(
                    m.Invitation.user_id == user.id, m.Invitation.kind == "staff", m.Invitation.accepted_at.is_(None)
                )
                .order_by(m.Invitation.id.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        if invitation:
            invitation.accepted_at = now
    if activate:
        user.last_sign_in_at = ctx.clock.now()
    permissions = (
        await ctx.session.execute(select(m.RolePermission.permission_id).where(m.RolePermission.role_id == role.id))
    ).scalars()
    actor = Actor(name=s.name, user_id=user.id, staff_ref=s.ref, role=role.name, permissions=frozenset(permissions))
    return SignedIn(staff=present(s, user, role), actor=actor)


async def actor_for(ctx: Ctx, user_id: uuid.UUID) -> Actor:
    """a staff member as an actor, for the hydrate CLI's simulated changes"""
    s = await ctx.session.get(m.StaffMember, user_id)
    if s is None:
        raise LookupError(user_id)
    user = await ctx.session.get(m.User, user_id)
    assert user is not None and user.firebase_uid
    return (
        (await by_uid(ctx, user.firebase_uid, activate=False)).actor
        if s.status == "active"
        else Actor(name=s.name, user_id=user_id, staff_ref=s.ref)
    )
