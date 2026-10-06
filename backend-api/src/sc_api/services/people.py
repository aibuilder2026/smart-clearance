"""A client's people: invitations (each made a Firebase account on the default password; nothing is mailed), their
access, deactivation, and renewing an invitation."""

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain.rules import PHONE_INPUT, invite_error, is_email
from sc_api.errors import ApiError, not_found
from sc_api.schemas import InviteInput, PersonPatch
from sc_api.services import audit, users
from sc_api.services.context import Ctx
from sc_api.services.presenter import ACCESS, lock_client

EMAIL_AND_PASSWORD = "Email and password"
PHONE_AND_CODE = "Phone and code"
ACCESS_ID = {v: k for k, v in ACCESS.items()}


@dataclass
class MemberSpec:
    ref: str
    name: str
    org: str
    role_label: str
    kind: str
    access: str  # approver | admin | member | partner
    member_class: str  # staff | partner | external
    provider: str
    status: str = "invited"
    email: str | None = None
    phone: str | None = None
    workspace_role: str | None = None
    img: str | None = None
    invited_at: datetime | None = None
    joined_at: datetime | None = None


async def add(
    ctx: Ctx, c: m.Client, spec: MemberSpec, *, uid: str | None = None, reset: bool = False
) -> m.ClientMember:
    """a person in the client's workspace, and their Firebase account if they have an email address"""
    user = await users.get_or_create(ctx, email=spec.email or None, phone=spec.phone or None)
    existing = (
        await ctx.session.execute(
            select(m.ClientMember).where(m.ClientMember.client_id == c.id, m.ClientMember.user_id == user.id)
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ApiError(
            422,
            f"{existing.name} is already in {c.name}'s workspace.",
            {"contact": f"{existing.name} is already in {c.name}'s workspace."},
        )
    if spec.member_class != "external":  # a marketplace buyer never signs in to a workspace
        await users.ensure_account(ctx, user, spec.name, uid=uid, reset=reset)
    now = ctx.clock.now()
    member = m.ClientMember(
        client_id=c.id,
        ref=spec.ref,
        user_id=user.id,
        name=spec.name,
        org=spec.org,
        role_label=spec.role_label,
        kind=spec.kind,
        access_role_id=spec.access,
        workspace_role=spec.workspace_role,
        member_class=spec.member_class,
        provider=spec.provider,
        status=spec.status,
        img=spec.img,
        invited_at=spec.invited_at or now,
        joined_at=spec.joined_at or (now if spec.status == "active" else None),
    )
    ctx.session.add(member)
    if spec.status == "invited":
        ctx.session.add(
            m.Invitation(user_id=user.id, client_id=c.id, kind="member", created_at=now, created_by=ctx.actor.user_id)
        )
    await ctx.session.flush()
    return member


async def _member(ctx: Ctx, client_id: str, ref: str) -> m.ClientMember:
    member = await ctx.session.get(m.ClientMember, (client_id, ref), with_for_update=True)
    if member is None or member.member_class == "external":
        raise not_found("person")
    return member


async def invite(ctx: Ctx, client_id: str, data: InviteInput) -> None:
    ctx.require("clients.people", "Your role can't invite a client's people.")
    c = await lock_client(ctx, client_id)
    problem = invite_error(data.name, data.contact, data.access, c.name, c.email_domain)
    if problem:
        raise ApiError(422, problem, {"contact": problem} if data.name.strip() else {"name": problem})
    contact = data.contact.strip()
    phone = bool(PHONE_INPUT.match(contact)) and not is_email(contact)
    name = data.name.strip()
    partner = data.access == "Partner"
    await add(
        ctx,
        c,
        MemberSpec(
            ref=ctx.ids.new("p"),
            name=name,
            org=name if partner else c.name,
            role_label="Partner" if partner else "Staff",
            kind=data.access,
            access=ACCESS_ID[data.access],
            member_class="partner" if partner else "staff",
            provider=PHONE_AND_CODE if phone else EMAIL_AND_PASSWORD,
            email=None if phone else contact,
            phone=contact if phone else None,
        ),
    )
    await audit.record(ctx, c.id, "person.invite", f"Invited {name} as {data.access}", {"access": data.access})


async def update(ctx: Ctx, client_id: str, ref: str, patch: PersonPatch) -> None:
    ctx.require("clients.people", "Your role can't change a client's people.")
    c = await lock_client(ctx, client_id)
    p = await _member(ctx, client_id, ref)
    approver = c.approver_ref == p.ref
    if patch.status is not None:
        target = "deactivated" if patch.status == "deactivated" else ("active" if p.joined_at else "invited")
        if target == "deactivated" and approver:
            raise ApiError(
                422, f"{p.name} approves {c.name}'s plans. Choose another approver on the Approval agent first."
            )
        if target != p.status:
            was, p.status = p.status, target
            verb = "Deactivated" if target == "deactivated" else "Reactivated"
            await audit.record(
                ctx, c.id, "person.status", f"{verb} {p.name}", {"person": p.ref, "from": was, "to": target}
            )
    if patch.access is not None:
        access = ACCESS_ID[patch.access]
        if access != p.access_role_id:
            if approver and access == "partner":
                raise ApiError(422, f"{p.name} approves {c.name}'s plans. Choose another approver first.")
            was, p.access_role_id = p.access_role_id, access
            await audit.record(
                ctx,
                c.id,
                "person.access",
                f"Gave {p.name} {patch.access} access",
                {"person": p.ref, "from": ACCESS[was], "to": patch.access},
            )


async def resend(ctx: Ctx, client_id: str, ref: str) -> None:
    """Renew an invitation: the account goes back to the default password, for the operator to hand over again."""
    ctx.require("clients.people", "Your role can't renew invitations.")
    await lock_client(ctx, client_id)
    p = await _member(ctx, client_id, ref)
    if p.status != "invited":
        raise ApiError(422, f"{p.name} has already joined.")
    user = await ctx.session.get(m.User, p.user_id)
    assert user is not None
    if user.firebase_uid:
        await ctx.identity.reset_to_default(user.firebase_uid)
        user.password_state = "default"
    ctx.session.add(
        m.Invitation(
            user_id=user.id,
            client_id=client_id,
            kind="member",
            created_at=ctx.clock.now(),
            created_by=ctx.actor.user_id,
        )
    )


async def accept(ctx: Ctx, client_id: str, ref: str) -> None:
    """someone taking up their invitation: their first sign-in to the workspace (the workspace app will call this;
    until it exists, hydrate does)"""
    p = await _member(ctx, client_id, ref)
    if p.status != "invited":
        return
    now = ctx.clock.now()
    p.status, p.joined_at = "active", now
    invitation = (
        await ctx.session.execute(
            select(m.Invitation)
            .where(m.Invitation.user_id == p.user_id, m.Invitation.client_id == client_id)
            .where(m.Invitation.accepted_at.is_(None))
            .order_by(m.Invitation.id.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if invitation:
        invitation.accepted_at = now
    user = await ctx.session.get(m.User, p.user_id)
    if user is not None:
        user.last_sign_in_at = now
    await ctx.session.flush()
