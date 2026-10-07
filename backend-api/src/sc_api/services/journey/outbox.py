"""Publishing the outbox: each change writes its Pub/Sub messages in its own transaction (events.publish), and once it
has committed they are sent here. Whatever fails stays in the outbox, and the tick sends it again; a message can so
arrive twice, and every consumer acts once on its event id."""

import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from sc_api import models as m
from sc_api.cloud import Publisher

log = logging.getLogger("sc_api.outbox")


async def drain(
    sessions: async_sessionmaker[AsyncSession], publisher: Publisher, now: datetime, *, limit: int = 200
) -> int:
    """sends what is waiting, oldest first, in its own transaction; returns how many went"""
    sent = 0
    async with sessions() as session:
        rows = (
            await session.execute(
                select(m.Outbox)
                .where(m.Outbox.published_wall.is_(None))
                .order_by(m.Outbox.id)
                .limit(limit)
                .with_for_update(skip_locked=True)
            )
        ).scalars()
        held: set[str] = set()  # ordering keys whose earlier message failed: the rest wait, to stay in order
        for row in rows:
            if row.ordering_key and row.ordering_key in held:
                continue
            row.attempts += 1
            try:
                await publisher.publish(
                    row.topic, row.payload, ordering_key=row.ordering_key, attributes=dict(row.attributes or {})
                )
            except Exception as e:  # kept for the next drain
                row.last_error = f"{type(e).__name__}: {e}"[:500]
                log.warning("outbox %s to %s failed (attempt %s): %s", row.id, row.topic, row.attempts, e)
                if row.ordering_key:
                    held.add(row.ordering_key)
                continue
            row.published_wall, row.last_error = now, None
            sent += 1
        await session.commit()
    return sent
