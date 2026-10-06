"""The audit log: one line for every change, in the acting person's name and in the words the prototype writes
(frontend/api/src/console/mock.ts). Lines are written in the same transaction as the change they describe."""

from datetime import datetime
from typing import Any

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain.display import audit_at
from sc_api.schemas import AuditEntry
from sc_api.services.context import Actor, Ctx


async def record(
    ctx: Ctx,
    client_id: str | None,
    action: str,
    text: str,
    details: dict[str, Any] | None = None,
    *,
    at: datetime | None = None,
    actor: Actor | None = None,
) -> None:
    who = actor or ctx.actor
    ctx.session.add(
        m.AuditEntry(
            at=at or ctx.clock.now(),
            actor_user_id=who.user_id,
            actor_name=who.name,
            client_id=client_id,
            action=action,
            text=text,
            details=details or {},
        )
    )
    await ctx.session.flush()


async def entries(ctx: Ctx, client_id: str | None = None, limit: int = 500) -> list[AuditEntry]:
    """newest first; lines written in one call (one moment) keep the order they were written in"""
    q = select(m.AuditEntry).order_by(m.AuditEntry.at.desc(), m.AuditEntry.id.desc()).limit(limit)
    if client_id:
        q = q.where(m.AuditEntry.client_id == client_id)
    rows = (await ctx.session.execute(q)).scalars().all()
    today = ctx.clock.today()
    return [
        AuditEntry(id=f"a{r.id}", at=audit_at(r.at, today), who=r.actor_name, client=r.client_id, text=r.text)
        for r in rows
    ]
