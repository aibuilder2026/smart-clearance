"""The Notifier (SC-66): a notification's push to every device its member registered, through FCM. The inbox row
already exists (written with the change that caused it), so a push that fails loses nothing: the member reads it in the
app. Pub/Sub delivers each notification's message at least once; one already pushed is not pushed again."""

from typing import Any

from sqlalchemy import delete, select

from sc_api import models as m
from sc_api.cloud import Messenger
from sc_api.services.context import Ctx


def link_of(n: m.Notification, ref: str | None, origin: str | None) -> str:
    """where the push opens the app: its screen, and the batch"""
    path = "/" + (n.link or "inbox") + (f"/{ref}" if ref else "")
    return (origin.rstrip("/") + path) if origin else path


async def push(ctx: Ctx, messenger: Messenger, notification_id: int) -> dict[str, Any]:
    n = await ctx.session.get(m.Notification, notification_id, with_for_update=True)
    if n is None or n.push_status in ("sent", "none"):
        return {"sent": 0, "skipped": True}
    cm = await ctx.session.get(m.ClientMember, (n.client_id, n.member_ref))
    if cm is None or cm.status != "active":
        n.push_status = "none"
        await ctx.session.flush()
        return {"sent": 0}
    tokens = list((await ctx.session.execute(select(m.Device.token).where(m.Device.user_id == cm.user_id))).scalars())
    if not tokens:
        n.push_status = "none"
        await ctx.session.flush()
        return {"sent": 0}
    ref = None
    if n.case_id:
        case = await ctx.session.get(m.Case, n.case_id)
        ref = case.batch_ref if case else None
    data = {
        "id": str(n.id),
        "title": n.title,
        "body": n.body,
        "link": link_of(n, ref, ctx.settings.workspace_origin),
        "ref": ref or "",
        "hindi": "1" if n.hindi else "0",
        "workspace": n.client_id,
    }
    results = await messenger.send(tokens, data)
    gone = [r.token for r in results if r.gone]
    if gone:
        await ctx.session.execute(delete(m.Device).where(m.Device.token.in_(gone)))
    sent = sum(1 for r in results if r.ok)
    n.pushed_wall = ctx.clock.now()
    n.push_status = "sent" if sent else "failed"
    n.push_error = None if sent else ", ".join(sorted({r.error or "unknown" for r in results}))[:300]
    await ctx.session.flush()
    return {"sent": sent, "gone": len(gone)}
