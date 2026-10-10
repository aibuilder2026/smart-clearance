"""A batch's record (SC-142): every step of its case, as the operator's Record tab reads it beside the batch's photos.

The agents' runs come from the case's feed (each in the agent's words); each person's decision from the audit log, in
their name, as it keeps it (frontend/api/src/types/workspace.ts WsRecord). The shops' orders, one audit line a shop,
fold into one row that holds them. A person's step is a yes when only a person at the client could let it happen: the
plan's approval, the papers' review, the destruction's approval.

The feed keeps both clocks (the journey's time and the wall time); the audit log keeps the wall time only. So the
case's lines are the batch's from the moment the case opened (wall time) until the batch's next case opens, the steps
are put in the order they happened by wall time, and each person's step is placed on the journey's clock between the
feed's moments around it (a compressed day, or a day length changed mid-journey, keeps them where they fell)."""

from bisect import bisect_right
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import or_, select

from sc_api import models as m
from sc_api.domain import money
from sc_api.errors import not_found
from sc_api.services.context import Ctx
from sc_api.services.journey import events as ev
from sc_api.services.journey import views, world
from sc_api.services.journey.partners import _local

YES = ("plan.approve", "docs.review", "destruction.approve")
# the platform's own lines (the ledger posted) are Impact's run, already in the feed
SYSTEM = "Smart-Clearance"
ORDER = "offer.order"


async def _orgs(ctx: Ctx, client_id: str) -> dict[str, tuple[str | None, str | None]]:
    """each member's ref: their id and the organisation they act for (the client, a distributor, a shop, a partner)"""
    c = await world.client(ctx, client_id)
    dists = await world.distributors(ctx, client_id)
    shops = {k.id: k.name for k in await world.kiranas(ctx, client_id)}
    partners = {p.id: p.name for p in await world.partners(ctx, client_id)}
    out: dict[str, tuple[str | None, str | None]] = {}
    for cm, _ in await world.members(ctx, client_id):
        role, org = cm.workspace_role, cm.org_ref
        if role == "distributor":
            name = dists[org].name if org in dists else None
        elif role == "retailer":
            name = shops.get(org or "")
        elif role in ("foodbank", "buyer"):
            name = partners.get(org or "")
        else:
            name = c.name
        out[cm.ref] = (cm.ref, name)
    return out


def _on_journey(points: list[tuple[datetime, datetime]], wall: datetime) -> datetime:
    """the journey's time at a wall time, between the feed's moments around it (wall time, journey time); before the
    first, real time"""
    i = bisect_right([p[0] for p in points], wall)
    if i == 0:
        w, j = points[0]
        return j - (w - wall)
    w0, j0 = points[i - 1]
    if i == len(points) or points[i][0] == w0:
        return j0 + (wall - w0)
    w1, j1 = points[i]
    return j0 + (j1 - j0) * ((wall - w0) / (w1 - w0))


async def record(ctx: Ctx, client_id: str, ref: str) -> dict[str, Any]:
    """the batch's case in view (this journey's, or the client's history): its steps, oldest first"""
    case = await views.latest_case(ctx, client_id, ref)
    if case is None or case.status == "reset":
        raise not_found("batch")
    c = await world.client(ctx, client_id)
    # the batch's next case, if it was flagged again: its lines are that case's
    after = (
        await ctx.session.execute(
            select(m.Case.opened_wall)
            .where(m.Case.client_id == client_id, m.Case.batch_ref == ref, m.Case.opened_wall > case.opened_wall)
            .order_by(m.Case.opened_wall)
            .limit(1)
        )
    ).scalar()
    feed = (
        (await ctx.session.execute(select(m.FeedEvent).where(m.FeedEvent.case_id == case.id).order_by(m.FeedEvent.id)))
        .scalars()
        .all()
    )
    q = select(m.AuditEntry).where(
        m.AuditEntry.client_id == client_id,
        # the batch's lines: most name it as their batch, the label photo's as its target
        or_(m.AuditEntry.details["batch"].astext == ref, m.AuditEntry.details["target"].astext == ref),
        m.AuditEntry.at >= case.opened_wall,
    )
    if after is not None:
        q = q.where(m.AuditEntry.at < after)
    lines = (await ctx.session.execute(q.order_by(m.AuditEntry.at, m.AuditEntry.id))).scalars().all()
    orgs = await _orgs(ctx, client_id)
    d = await ctx.session.get(m.Distributor, (client_id, case.distributor_id))

    # the journey's clock as the client's feed kept it around the case, and as it stands now
    lo = case.opened_wall - timedelta(days=1)
    hi = (lines[-1].at if lines else case.opened_wall) + timedelta(days=1)
    clock = (
        await ctx.session.execute(
            select(m.FeedEvent.wall, m.FeedEvent.at)
            .where(m.FeedEvent.client_id == client_id, m.FeedEvent.wall >= lo, m.FeedEvent.wall <= hi)
            .order_by(m.FeedEvent.wall, m.FeedEvent.id)
        )
    ).all()
    wall = ctx.clock.now()
    points = sorted([(w, j) for w, j in clock] + [(wall, ev.clock_of(c).at(wall))], key=lambda p: p[0])

    rows: list[tuple[datetime, int, dict[str, Any]]] = []
    for i, f in enumerate(feed):
        if not f.agent:
            continue  # a person's step: the audit log has it, in their name
        who = {"kind": "agent", "id": f.agent.lower().removesuffix(" agent"), "name": f.agent, "org": None}
        rows.append((f.wall, i, {"key": f.key, "at": _local(f.at), "who": who, "text": f.text, "yes": False}))

    group: dict[str, Any] | None = None
    for j, a in enumerate(lines):
        if a.actor_name == SYSTEM:
            continue
        at = _local(_on_journey(points, a.at))
        member = (a.details or {}).get("member")
        mid, org = orgs.get(member or "", (member, None))
        who = {"kind": "person", "id": mid, "name": a.actor_name, "org": org}
        if a.action == ORDER:
            item = {"who": who, "text": a.text, "at": at}
            if group is None:
                group = {"key": ORDER, "at": at, "who": {}, "text": "", "yes": False, "items": []}
                rows.append((a.at, len(feed) + j, group))
            group["items"].append(item)
            continue
        target = (a.details or {}).get("target")
        text = f"{a.text} · {target}" if target and target != ref else a.text
        rows.append(
            (a.at, len(feed) + j, {"key": a.action, "at": at, "who": who, "text": text, "yes": a.action in YES})
        )
    if group is not None:
        n = len(group["items"])
        packets = sum(
            int(x["text"].split()[1])
            for x in group["items"]
            if x["text"].split()[1:2] and x["text"].split()[1].isdigit()
        )
        scheme = f"{d.name}' scheme" if d and d.name.endswith("s") else f"{d.name}'s scheme" if d else None
        group["who"] = {"kind": "person", "id": None, "name": f"{n} {'kirana' if n == 1 else 'kiranas'}", "org": scheme}
        group["text"] = f"ordered {money.fmt.num(packets)} packets" if packets else f"{n} orders"

    rows.sort(key=lambda r: (r[0], r[1]))
    return {"ref": ref, "steps": [r[2] for r in rows]}
