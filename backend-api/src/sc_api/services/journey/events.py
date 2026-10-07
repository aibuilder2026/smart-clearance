"""What a change in the journey sends out, all in the change's own transaction:

- the client's journey clock, sped up while a case is open (domain/clock.py JourneyClock);
- the timeline (feed_events) and members' inboxes (notifications);
- the stream: one per-client sequence that each member's live view reads (SSE or polling), cut by audience; a NOTIFY
  on `sc_stream` wakes the listeners once the transaction commits;
- the outbox: Pub/Sub messages for the agents and the Notifier, published after the commit (services/journey/outbox.py).
"""

from datetime import datetime
from typing import Any

from sqlalchemy import func, select, update

from sc_api import models as m
from sc_api import tracing
from sc_api.domain.clock import DAY_MINUTES, JourneyClock
from sc_api.domain.journey import NOTIFY, Event
from sc_api.services.context import Ctx

# who hears a stream row: a member's ref, everyone of Munchly's own staff, an organisation's members, or a role
STAFF = "@staff"


def org(ref: str) -> str:
    return f"@org:{ref}"


def role(name: str) -> str:
    return f"@role:{name}"


def audience_of(cm: m.ClientMember) -> list[str]:
    """the tokens a member hears"""
    out = [cm.ref, role(cm.workspace_role or "")]
    if cm.member_class == "staff":
        out.append(STAFF)
    if cm.org_ref:
        out.append(org(cm.org_ref))
    return out


# --- the clock ------------------------------------------------------------------------------------------------------


def clock_of(c: m.Client) -> JourneyClock:
    if c.clock_anchor_wall is None or c.clock_anchor_journey is None:
        return JourneyClock(anchor_wall=c.created_at, anchor_journey=c.created_at, speed=DAY_MINUTES)
    return JourneyClock(anchor_wall=c.clock_anchor_wall, anchor_journey=c.clock_anchor_journey, speed=c.clock_speed)


def now(ctx: Ctx, c: m.Client) -> datetime:
    """the journey time now"""
    return clock_of(c).at(ctx.clock.now())


def wall_of(c: m.Client, at: datetime) -> datetime:
    return clock_of(c).wall_of(at)


async def set_speed(ctx: Ctx, c: m.Client, speed: int) -> None:
    """runs the client's clock at a new speed from this moment, and moves the timers' wall times with it"""
    if speed == c.clock_speed and c.clock_anchor_wall is not None:
        return
    wall = ctx.clock.now()
    k = clock_of(c).reanchored(wall, speed)
    c.clock_anchor_wall, c.clock_anchor_journey, c.clock_speed = k.anchor_wall, k.anchor_journey, k.speed
    timers = (
        await ctx.session.execute(select(m.Timer).where(m.Timer.client_id == c.id, m.Timer.fired_wall.is_(None)))
    ).scalars()
    for t in timers:
        t.due_wall = max(wall, k.wall_of(t.due_at))
    await ctx.session.flush()


async def apply_speed(ctx: Ctx, c: m.Client) -> None:
    """the console's day length while a case is open, real time otherwise"""
    open_ = (
        await ctx.session.execute(
            select(func.count()).select_from(m.Case).where(m.Case.client_id == c.id, m.Case.status == "open")
        )
    ).scalar_one()
    await set_speed(ctx, c, c.day_minutes if open_ else DAY_MINUTES)


async def start_at(ctx: Ctx, c: m.Client, at: datetime) -> None:
    """a journey starting at `at` (journey time) now: the clock jumps forward to it, never back"""
    wall = ctx.clock.now()
    current = clock_of(c).at(wall)
    target = max(at, current)
    c.clock_anchor_wall, c.clock_anchor_journey = wall, target
    c.clock_speed = c.clock_speed or DAY_MINUTES
    await ctx.session.flush()


async def timer(ctx: Ctx, c: m.Client, kind: str, due_at: datetime, *, case: m.Case | None = None, **payload) -> None:
    ctx.session.add(
        m.Timer(
            client_id=c.id,
            case_id=case.id if case else None,
            kind=kind,
            due_at=due_at,
            due_wall=max(ctx.clock.now(), wall_of(c, due_at)),
            payload=payload,
        )
    )
    await ctx.session.flush()


# --- the stream -----------------------------------------------------------------------------------------------------


async def emit(
    ctx: Ctx,
    c: m.Client,
    kind: str,
    *,
    ref: str | None = None,
    audience: list[str] | None = None,
    feed_id: int | None = None,
    notification_id: int | None = None,
) -> int:
    """a row on the client's stream, and a NOTIFY that wakes its listeners when the transaction commits"""
    c.stream_seq = (c.stream_seq or 0) + 1
    seq = c.stream_seq
    ctx.session.add(
        m.StreamRow(
            client_id=c.id,
            seq=seq,
            kind=kind,
            ref=ref,
            audience=audience,
            feed_id=feed_id,
            notification_id=notification_id,
            wall=ctx.clock.now(),
        )
    )
    await ctx.session.flush()
    await ctx.session.execute(select(func.pg_notify("sc_stream", f"{c.id}:{seq}")))
    return seq


async def changed(ctx: Ctx, c: m.Client, ref: str | None = None) -> int:
    """a batch's case changed (`ref`), or the workspace's own data: the views read it again"""
    return await emit(ctx, c, "case" if ref else "workspace", ref=ref)


async def feed(
    ctx: Ctx,
    c: m.Client,
    case: m.Case | None,
    key: str,
    stage: str,
    text: str,
    *,
    calls: list[Any] | None = None,
    agent: str | None = None,
    person: str | None = None,
    icon: str | None = None,
    human: bool = False,
    at: datetime | None = None,
) -> m.FeedEvent:
    """an entry in the agents' timeline, which Munchly's own staff see"""
    row = m.FeedEvent(
        client_id=c.id,
        case_id=case.id if case else None,
        key=key,
        stage=stage,
        agent=agent,
        person=person,
        icon=icon,
        at=at or now(ctx, c),
        wall=ctx.clock.now(),
        text=text,
        calls=calls or [],
        human=human,
    )
    ctx.session.add(row)
    await ctx.session.flush()
    await emit(ctx, c, "feed", ref=case.batch_ref if case else None, audience=[STAFF], feed_id=row.id)
    return row


async def notify(
    ctx: Ctx,
    c: m.Client,
    member_ref: str,
    key: str,
    *,
    title: str,
    body: str,
    en: str | None = None,
    hindi: bool = False,
    link: str | None = None,
    case: m.Case | None = None,
) -> m.Notification:
    """an item in a member's inbox, on their stream, and a message for the Notifier to push to their devices"""
    row = m.Notification(
        client_id=c.id,
        member_ref=member_ref,
        case_id=case.id if case else None,
        key=key,
        title=title,
        body=body,
        en=en,
        hindi=hindi,
        link=link,
        at=now(ctx, c),
        wall=ctx.clock.now(),
        push_status="pending",
    )
    ctx.session.add(row)
    await ctx.session.flush()
    await emit(
        ctx, c, "notification", ref=case.batch_ref if case else None, audience=[member_ref], notification_id=row.id
    )
    await publish(ctx, Event(NOTIFY, {"client": c.id, "notification": row.id}, ""))
    return row


async def notify_all(ctx: Ctx, c: m.Client, refs: list[str], key: str, **kw) -> None:
    for ref in dict.fromkeys(refs):
        await notify(ctx, c, ref, key, **kw)


# --- the outbox -----------------------------------------------------------------------------------------------------


async def publish(ctx: Ctx, event: Event) -> None:
    """a Pub/Sub message, sent once this transaction commits. Its event id makes a redelivery recognisable, and the
    request's trace travels with it"""
    attributes = {"event_id": ctx.ids.new("ev", 12)}
    if (here := tracing.current()) is not None:
        attributes["traceparent"] = f"00-{here.trace_id}-{here.span_id}-{'01' if here.sampled else '00'}"
    ctx.session.add(
        m.Outbox(
            topic=f"{ctx.settings.events_env}.{event.topic}",
            ordering_key=event.ordering_key,
            attributes=attributes,
            payload={**event.payload, "eventId": attributes["event_id"]},
            created_wall=ctx.clock.now(),
        )
    )
    await ctx.session.flush()


async def mark_read(ctx: Ctx, client_id: str, member_ref: str, ids: list[int] | None) -> int:
    q = (
        update(m.Notification)
        .where(
            m.Notification.client_id == client_id,
            m.Notification.member_ref == member_ref,
            m.Notification.read_wall.is_(None),
        )
        .values(read_wall=ctx.clock.now())
    )
    if ids is not None:
        q = q.where(m.Notification.id.in_(ids))
    result = await ctx.session.execute(q)
    return result.rowcount or 0


async def set_day_minutes(ctx: Ctx, client_id: str, minutes: int) -> None:
    """the console's setting: how many minutes of wall time a journey day lasts while a batch is at risk (1 to 1440;
    1440 is real time). The clock re-anchors at once, so no journey time is skipped"""
    from sc_api.errors import ApiError
    from sc_api.services import audit
    from sc_api.services.presenter import lock_client

    ctx.require("clients.configure", "Your role can't change a client's clock.")
    if not 1 <= minutes <= DAY_MINUTES:
        raise ApiError(422, "A journey day lasts 1 to 1,440 minutes.", {"dayMinutes": "1 to 1,440 minutes."})
    c = await lock_client(ctx, client_id)
    if c.day_minutes == minutes:
        return
    was, c.day_minutes = c.day_minutes, minutes
    await apply_speed(ctx, c)
    if c.clock_speed != DAY_MINUTES:  # a case is open: the new speed applies now
        await set_speed(ctx, c, minutes)
    words = {DAY_MINUTES: "real time"}
    await audit.record(
        ctx,
        c.id,
        "client.clock",
        f"Set {c.name}'s journey day to {words.get(minutes, f'{minutes} minutes')} "
        f"(was {words.get(was, f'{was} minutes')})",
        {"from": was, "to": minutes},
    )
    await changed(ctx, c)
