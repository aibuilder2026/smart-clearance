"""The agents on a laptop (agents/scripts/dev.sh): nothing on the internet can push to a laptop, so the worker pulls the
local environment's subscriptions, `local.agents.batch.at_risk`, `.offer.received`, `.deal.closed` and
`.journey.step` (infra/prod events.tf), as sc-agents-local, with no emulator. Each subscription hands over one message
at a time (ordered by batch), which runs the same `handle()` as the Cloud Run service: acknowledged when it is done or
there was nothing to do, nacked on a transient failure so Pub/Sub delivers it again (after five attempts it goes to
local.dead-letter)."""

import asyncio
import logging
import signal
from contextlib import suppress

from sc_agents.dispatch import handle
from sc_agents.errors import Transient
from sc_agents.events import TOPICS, BadMessage, from_pull
from sc_agents.runs import Deps

log = logging.getLogger("sc_agents.worker")
RUN_LIMIT = 590  # under the subscriptions' 600 s ack deadline


def subscriptions(env: str) -> list[str]:
    return [f"{env}.agents.{t}" for t in TOPICS]


def callback_for(deps: Deps, subscription: str, loop: asyncio.AbstractEventLoop):
    def callback(message) -> None:
        try:
            msg = from_pull(message, subscription)
        except BadMessage as e:
            log.error("%s: a message the agents cannot read, acknowledged: %s", subscription, e)
            message.ack()
            return
        try:
            outcome = asyncio.run_coroutine_threadsafe(handle(msg, deps), loop).result(timeout=RUN_LIMIT)
        except Transient:
            message.nack()
            return
        except Exception:
            log.exception("%s: %s failed", subscription, msg.event_id)
            message.nack()
            return
        log.info("%s: %s %s", subscription, msg.type, outcome)
        message.ack()

    return callback


async def run(deps: Deps) -> None:
    from google.cloud import pubsub_v1

    from sc_agents.gcp import credentials

    settings = deps.settings
    subscriber = pubsub_v1.SubscriberClient(credentials=credentials())
    loop = asyncio.get_running_loop()
    flow = pubsub_v1.types.FlowControl(max_messages=1)
    streams = []
    for name in subscriptions(settings.agents_env):
        path = subscriber.subscription_path(settings.google_cloud_project, name)
        streams.append(subscriber.subscribe(path, callback=callback_for(deps, name, loop), flow_control=flow))
        log.info("pulling %s", name)
    stop = asyncio.Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        with suppress(NotImplementedError):
            loop.add_signal_handler(sig, stop.set)
    try:
        await stop.wait()
    finally:
        for s in streams:
            s.cancel()
        subscriber.close()
        await deps.backend.aclose()


def main() -> None:
    from sc_agents import tracing
    from sc_agents.wiring import deps

    d = deps()
    log.info(
        "agents worker: %s, models %s (%s, %s), API %s",
        d.settings.agents_env,
        d.settings.model_tier,
        d.settings.model_pro,
        d.settings.model_flash,
        d.settings.api_base,
    )
    try:
        asyncio.run(run(d))
    finally:
        tracing.flush()


if __name__ == "__main__":
    main()
