"""The console's Overview as a dashboard (SC-48): the platform's figures over a range of days, and every client's
batches a page at a time, filtered, sorted and counted on the server.

Every figure is an aggregate over batches, agent_runs and clients at the moment it is read; nothing is stored for it.

- A batch's recovery counts on the day it closed, or, while it is still open past Settle, on the day it was flagged.
- A batch is in flight from the moment it is flagged until it closes; it waits for a yes at Approve, the sixth stop.
- Days are India's days, from the clock (the hydrate CLI's and the tests' clocks are simulated).
"""

from collections import Counter
from datetime import date, datetime, time, timedelta

from sqlalchemy import Date, case, cast, func, literal_column, or_, select

from sc_api import models as m
from sc_api.domain.clock import IST
from sc_api.domain.display import day_month, hhmm
from sc_api.errors import ApiError
from sc_api.schemas import BatchCounts, BatchPage, BatchQuery, BatchRow, Dashboard, DayFigures, Waiting
from sc_api.services.context import Ctx

APPROVE = 5  # the stop where a person says yes (0-based, as stage_current)
STOPS = 9
RANGES = (7, 30, 90)
SIZES = (8, 16, 32)


def _start(d: date) -> datetime:
    return datetime.combine(d, time(0), IST)


# India's date of a timestamp; the zone is a literal, so a GROUP BY sees the same expression as the SELECT
def _ist_day(col):
    return cast(func.timezone(literal_column("'Asia/Kolkata'"), col), Date)


async def dashboard(ctx: Ctx, days: int, client: str | None = None) -> Dashboard:
    ctx.require("console.read", "Your role can't see the console.")
    if days not in RANGES:
        raise ApiError(422, f"Show {', '.join(map(str, RANGES[:-1]))} or {RANGES[-1]} days.")
    s, B = ctx.session, m.Batch
    now, today = ctx.clock.now(), ctx.clock.today()
    first = today - timedelta(days=days - 1)
    start, end, before = _start(first), _start(today + timedelta(days=1)), _start(first - timedelta(days=days))
    mine = [B.client_id == client] if client else []
    when = func.coalesce(B.closed_at, B.opened_at)

    # recovered, a day at a time, and the range before it
    recovered = {
        d: float(v)
        for d, v in (
            await s.execute(
                select(_ist_day(when), func.sum(B.recovered))
                .where(B.recovered > 0, when >= start, when < end, *mine)
                .group_by(_ist_day(when))
            )
        ).all()
    }
    before_total = (
        await s.execute(
            select(func.coalesce(func.sum(B.recovered), 0)).where(B.recovered > 0, when >= before, when < start, *mine)
        )
    ).scalar_one()
    closed = {
        d: (int(n), int(u))
        for d, n, u in (
            await s.execute(
                select(_ist_day(B.closed_at), func.count(), func.coalesce(func.sum(B.units), 0))
                .where(B.closed_at >= start, B.closed_at < end, *mine)
                .group_by(_ist_day(B.closed_at))
            )
        ).all()
    }
    runs = Counter(
        {
            d: int(n)
            for d, n in (
                await s.execute(
                    select(_ist_day(m.AgentRun.ran_at), func.count())
                    .where(
                        m.AgentRun.ran_at >= start,
                        m.AgentRun.ran_at < end,
                        *([m.AgentRun.client_id == client] if client else []),
                    )
                    .group_by(_ist_day(m.AgentRun.ran_at))
                )
            ).all()
        }
    )

    # in flight at the end of each day, from when each batch was flagged and closed
    spans = (
        await s.execute(
            select(B.opened_at, B.closed_at).where(
                B.opened_at < end, or_(B.closed_at.is_(None), B.closed_at >= start), *mine
            )
        )
    ).all()
    range_days = [first + timedelta(days=i) for i in range(days)]
    in_flight_series = []
    for d in range_days:
        cut = _start(d + timedelta(days=1)) if d < today else now
        in_flight_series.append(sum(1 for o, c in spans if o <= cut and (c is None or c > cut)))

    open_rows = (
        await s.execute(select(B.client_id, B.stage_current, B.opened_at).where(B.closed_at.is_(None), *mine))
    ).all()
    by_stop = [0] * STOPS
    for _, stage, _ in open_rows:
        by_stop[min(stage, STOPS - 1)] += 1
    waiting = sorted((o, c) for c, stage, o in open_rows if stage == APPROVE)
    oldest = None
    if waiting:
        at, cid = waiting[0]
        c = await s.get(m.Client, cid)
        oldest = Waiting(hours=int((now - at).total_seconds() // 3600), client=c.name if c else cid)

    return Dashboard(
        read_at=now.astimezone(IST).strftime("%H:%M:%S"),
        days=days,
        recovered=round(sum(recovered.values()), 2),
        recovered_before=round(float(before_total), 2),
        by_day=[
            DayFigures(
                date=d.isoformat(),
                label=day_month(d),
                recovered=round(recovered.get(d, 0.0), 2),
                closed=closed.get(d, (0, 0))[0],
                units=closed.get(d, (0, 0))[1],
                runs=runs.get(d, 0),
            )
            for d in range_days
        ],
        in_flight=len(open_rows),
        in_flight_clients=len({c for c, _, _ in open_rows}),
        in_flight_series=in_flight_series,
        waiting=len(waiting),
        **({"oldest_waiting": oldest} if oldest else {}),
        runs_today=runs.get(today, 0),
        by_stop=by_stop,
    )


async def batches(ctx: Ctx, q: BatchQuery) -> BatchPage:
    """every client's batches, one page at a time: in flight (the ones waiting for a yes first, then the fewest days
    left), waiting for a yes, or closed; by client, stop and a search over the batch, its product and distributor"""
    ctx.require("console.read", "Your role can't see the console.")
    if q.size not in SIZES:
        raise ApiError(422, f"Show {', '.join(map(str, SIZES[:-1]))} or {SIZES[-1]} rows a page.")
    s, B, S, D = ctx.session, m.Batch, m.Sku, m.Distributor
    today = ctx.clock.today()
    base = (
        select(B, S, D)
        .join(S, (S.client_id == B.client_id) & (S.id == B.sku_id))
        .join(D, (D.client_id == B.client_id) & (D.id == B.distributor_id))
    )
    narrow = []
    if q.client:
        narrow.append(B.client_id == q.client)
    if q.q and q.q.strip():
        like = f"%{q.q.strip().replace('%', '').replace('_', '')}%"
        narrow.append(or_(B.ref.ilike(like), S.name.ilike(like), D.name.ilike(like), D.city.ilike(like)))
    status = {
        "in-flight": [B.closed_at.is_(None)],
        "waiting": [B.closed_at.is_(None), B.stage_current == APPROVE],
        "closed": [B.closed_at.is_not(None)],
    }
    where = [*narrow, *status[q.status]]
    if q.stop is not None and q.status != "closed":
        where.append(B.stage_current == q.stop)

    counts = {}
    for key, cond in status.items():
        counts[key] = (
            await s.execute(
                select(func.count())
                .select_from(B)
                .join(S, (S.client_id == B.client_id) & (S.id == B.sku_id))
                .join(D, (D.client_id == B.client_id) & (D.id == B.distributor_id))
                .where(*narrow, *cond)
            )
        ).scalar_one()
    total = (
        await s.execute(
            select(func.count())
            .select_from(B)
            .join(S, (S.client_id == B.client_id) & (S.id == B.sku_id))
            .join(D, (D.client_id == B.client_id) & (D.id == B.distributor_id))
            .where(*where)
        )
    ).scalar_one()

    value = case((B.recovered > 0, B.recovered), else_=B.units * S.mrp)
    updated = func.greatest(B.opened_at, func.coalesce(B.gate_at, B.opened_at), func.coalesce(B.closed_at, B.opened_at))
    asc = q.dir == "asc"
    key = {
        "stop": B.stage_current,
        "days": B.best_before,
        "units": B.units,
        "value": value,
        "updated": updated,
    }.get(q.sort)
    if key is None:  # priority: the ones waiting for a yes first, then the fewest days left
        order = [case((B.stage_current == APPROVE, 0), else_=1), B.best_before.asc().nulls_last(), B.seq]
    else:
        order = [key.asc().nulls_last() if asc else key.desc().nulls_last(), B.seq]
    page = max(1, q.page)
    rows = (await s.execute(base.where(*where).order_by(*order).limit(q.size).offset((page - 1) * q.size))).all()

    def label(at: datetime) -> str:
        return hhmm(at) if at.astimezone(IST).date() == today else day_month(at.astimezone(IST).date())

    return BatchPage(
        rows=[
            BatchRow(
                client=b.client_id,
                ref=b.ref,
                product=x.name,
                distributor=d.name,
                city=d.city,
                stage=b.stage_current,
                done=b.stage_done,
                units=b.units,
                value=round(float(b.recovered if b.recovered > 0 else b.units * x.mrp), 2),
                value_kind="recovered" if b.recovered > 0 or b.closed_at else "mrp",
                updated=label(max(t for t in (b.opened_at, b.gate_at, b.closed_at) if t is not None)),
                closed=b.closed_at is not None,
                **({"days_left": (b.best_before - today).days} if b.best_before else {}),
                **({"outcome": b.outcome} if b.outcome else {}),
            )
            for b, x, d in rows
        ],
        total=int(total),
        page=page,
        size=q.size,
        counts=BatchCounts(in_flight=counts["in-flight"], waiting=counts["waiting"], closed=counts["closed"]),
    )
