"""People as the platform knows them: one user per person, found by email or mobile number, with their Firebase
account when they have one (identity.py)."""

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain.rules import e164
from sc_api.services.context import Ctx


async def find(ctx: Ctx, *, email: str | None = None, phone: str | None = None) -> m.User | None:
    if email:
        return (
            await ctx.session.execute(select(m.User).where(m.User.email == email.strip().lower()))
        ).scalar_one_or_none()
    if phone:
        return (await ctx.session.execute(select(m.User).where(m.User.phone_e164 == e164(phone)))).scalar_one_or_none()
    return None


async def get_or_create(ctx: Ctx, *, email: str | None = None, phone: str | None = None) -> m.User:
    email = email.strip().lower() if email else None
    phone = e164(phone) if phone else None
    user = await find(ctx, email=email) if email else await find(ctx, phone=phone)
    if user is None:
        user = m.User(email=email, phone_e164=phone, created_at=ctx.clock.now(), password_state="none")
        ctx.session.add(user)
        await ctx.session.flush()
    elif phone and not user.phone_e164:
        user.phone_e164 = phone
    return user


async def ensure_account(ctx: Ctx, user: m.User, name: str, *, uid: str | None = None, reset: bool = False) -> None:
    """a Firebase account for someone with an email address, on the default password; nothing for a phone-only
    partner (phone sign-in comes with the workspace app)"""
    if not user.email:
        return
    made, on_default = await ctx.identity.ensure_account(user.email, name, uid=uid, reset=reset)
    if user.firebase_uid != made:
        user.firebase_uid = made
    if on_default:
        user.password_state = "default"
    elif user.password_state == "none":
        user.password_state = "own"  # the address already had an account, whose password is its owner's
