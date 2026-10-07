"""The live stream's wake-up (SC-66): one Postgres connection per process LISTENs on `sc_stream`, where every change
NOTIFYs "<client>:<seq>" as it commits, and wakes the members' streams waiting on that client. A stream then reads its
own rows (services/journey/views.events_after), so nothing but a number travels here.

On db-f1-micro's 25 connections: the API's pool is 3 + 2 an instance, plus this one listener. Without a listener (the
test suite, or while it reconnects) a waiting stream wakes every two seconds and reads again.
"""

import asyncio
import logging
from contextlib import suppress

from sc_api.settings import Settings

log = logging.getLogger("sc_api.stream")
POLL = 2.0


class Hub:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.latest: dict[str, int] = {}
        self.waiters: dict[str, set[asyncio.Event]] = {}
        self.listening = False
        self._task: asyncio.Task | None = None

    def start(self) -> None:
        if self._task is None and self.settings.sc_env != "test":
            self._task = asyncio.create_task(self._listen(), name="sc_stream listener")

    async def stop(self) -> None:
        if self._task is not None:
            self._task.cancel()
            with suppress(asyncio.CancelledError, Exception):
                await self._task
            self._task = None

    def _heard(self, _conn, _pid, _channel, payload: str) -> None:
        client, _, seq = payload.rpartition(":")
        if not seq.isdigit():
            return
        self.latest[client] = max(self.latest.get(client, 0), int(seq))
        for event in self.waiters.get(client, ()):
            event.set()

    async def _listen(self) -> None:
        from sc_api.db import dispose, make_engine

        while True:
            engine = None
            try:
                engine = await make_engine(self.settings, pool_size=1, max_overflow=0)
                async with engine.connect() as conn:
                    raw = await conn.get_raw_connection()
                    pg = raw.driver_connection
                    await pg.add_listener("sc_stream", self._heard)
                    self.listening = True
                    while True:  # a dropped connection shows here, and is opened again
                        await asyncio.sleep(30)
                        await pg.execute("SELECT 1")
            except asyncio.CancelledError:
                raise
            except Exception as e:
                log.warning("sc_stream listener lost (%s); listening again in 5 s", e)
            finally:
                self.listening = False
                if engine is not None:
                    with suppress(Exception):
                        await dispose(engine)
            await asyncio.sleep(5)

    async def wait(self, client: str, seq: int, *, timeout: float) -> bool:  # noqa: ASYNC109
        """whether anything after `seq` happened in the client's stream within `timeout` seconds (without a listener:
        True after a short poll, so the caller reads again)"""
        self.start()
        if timeout <= 0:
            return False
        if self.latest.get(client, 0) > seq:
            return True
        if not self.listening:
            await asyncio.sleep(min(timeout, POLL))
            return True
        event = asyncio.Event()
        self.waiters.setdefault(client, set()).add(event)
        try:
            await asyncio.wait_for(event.wait(), timeout)
            return True
        except TimeoutError:
            return False
        finally:
            self.waiters[client].discard(event)
