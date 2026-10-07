"""What a laptop's backend runs for itself (SC-66), since nothing in the cloud can reach it: its own tick every
TICK_SECONDS (Cloud Scheduler calls /internal/jobs/tick in the cloud), and the Notifier pulling its environment's
`local.notify.api` subscription (Pub/Sub pushes to /internal/pubsub/notify in the cloud). Both use the real services,
as sc-api-local: no emulator."""

import asyncio
import json
import logging
from contextlib import suppress

from fastapi import FastAPI

from sc_api.services.context import SYSTEM, Ctx
from sc_api.services.journey import notifier, tick
from sc_api.services.journey.outbox import drain
from sc_api.services.reference import read

log = logging.getLogger("sc_api.local")


async def _ctx(app: FastAPI, session) -> Ctx:
    s = app.state
    return Ctx(
        session=session,
        actor=SYSTEM,
        clock=s.clock,
        ids=s.ids,
        identity=s.identity,
        settings=s.settings,
        ref=await read(session),
        cloud=s.cloud,
    )


async def ticker(app: FastAPI) -> None:
    every = app.state.settings.tick_seconds
    while True:
        await asyncio.sleep(every)
        try:
            async with app.state.sessions() as session:
                await tick.run(await _ctx(app, session))
                await session.commit()
            await drain(app.state.sessions, app.state.cloud.publisher, app.state.clock.now())
        except Exception:
            log.exception("local tick failed")


def notify_puller(app: FastAPI, loop: asyncio.AbstractEventLoop):
    """streams local.notify.api; each message's push runs on the app's own loop"""
    from google.cloud import pubsub_v1

    from sc_api.gcp import credentials

    settings = app.state.settings
    subscriber = pubsub_v1.SubscriberClient(credentials=credentials())
    path = subscriber.subscription_path(settings.google_cloud_project, f"{settings.events_env}.notify.api")

    async def handle(notification_id: int) -> None:
        async with app.state.sessions() as session:
            await notifier.push(await _ctx(app, session), app.state.cloud.messenger, notification_id)
            await session.commit()

    def callback(message) -> None:
        try:
            payload = json.loads(message.data)
            asyncio.run_coroutine_threadsafe(handle(int(payload["notification"])), loop).result(timeout=60)
            message.ack()
        except Exception:
            log.exception("local Notifier failed on %s", message.message_id)
            message.nack()

    return subscriber.subscribe(path, callback=callback)


async def start(app: FastAPI) -> list:
    """the tasks and streams to stop on shutdown"""
    running: list = []
    s = app.state.settings
    if s.tick_seconds > 0:
        running.append(asyncio.create_task(ticker(app), name="local tick"))
    if s.notify_mode == "pull" and s.cloud == "google":
        running.append(notify_puller(app, asyncio.get_running_loop()))
    return running


async def stop(running: list) -> None:
    for r in running:
        if isinstance(r, asyncio.Task):
            r.cancel()
            with suppress(asyncio.CancelledError, Exception):
                await r
        else:
            with suppress(Exception):
                r.cancel()
