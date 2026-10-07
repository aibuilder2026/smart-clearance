"""sc-hydrate: a working world in an empty database, through the API's own services (scripts/hydrate.sh runs it).

  sc-hydrate [--seed N] [--clients N] [--staff N] [--days N] [--no-demo-story]
      Munchly Foods (design3's story), then the platform's staff and N generated clients, from their demo requests
      to live, over the last N days. Every user with an email address gets a Firebase account on the default
      password, with a deterministic uid; nothing is mailed.
  sc-hydrate --tick
      today's agent runs for every live client, so the console's day is today
  sc-hydrate --live-only
      Munchly's live workspace (SC-66) on a database that already holds Munchly's story, as production does since
      SC-50: its members on email and password, the kiranas, the exports, and the journey from its start. Nothing else
      in the database changes (SC-75)

It refuses a database that already has clients (scripts/hydrate.sh --reset rebuilds it), and any environment but
local unless --allow-env names it.
"""

import argparse
import asyncio
from dataclasses import replace
from datetime import UTC, datetime

from sqlalchemy import func, select

from sc_api import models as m
from sc_api.cli import live
from sc_api.cli.story import Story
from sc_api.cli.synth import SyntheticIdentity, World
from sc_api.cloud import cloud
from sc_api.db import engine_scope, sessions
from sc_api.domain.clock import FixedClock, Ids, SeededIds
from sc_api.identity import provider
from sc_api.services import reference
from sc_api.services.context import SYSTEM, Ctx
from sc_api.services.journey import reset
from sc_api.settings import get_settings


async def run(args: argparse.Namespace) -> None:
    settings = get_settings()
    async with engine_scope(settings) as engine, sessions(engine)() as session:
        ctx = Ctx(
            session=session,
            actor=SYSTEM,
            clock=FixedClock(datetime.now(UTC)),
            ids=SeededIds(args.seed),
            identity=SyntheticIdentity(provider(settings)),
            settings=settings,
            ref=await reference.read(session),
        )
        world = World(ctx, seed=args.seed, days=args.days)
        ctx = replace(ctx, cloud=cloud(settings, ctx.identity)) if settings.exports_bucket else ctx
        world.ctx = ctx
        if args.tick:
            print(f"sc-hydrate: today's runs for {await world.tick()} live client(s)")
            return
        # a journey started on a world already built takes fresh ids: the seeded ones would repeat that world's own
        if args.live_only:
            await _live_only(replace(ctx, ids=Ids()))
            return
        if args.journey_reset:
            out = await reset.reset(replace(ctx, ids=Ids()), args.journey_reset)
            await session.commit()
            await _publish(ctx)
            print(f"sc-hydrate: {args.journey_reset}'s journey starts again on {out['day0']}")
            return
        clients = (await session.execute(select(func.count()).select_from(m.Client))).scalar_one()
        if clients:
            raise SystemExit(
                f"sc-hydrate: the database already has {clients} client(s). "
                "Rebuild it with scripts/hydrate.sh --reset, or add today's runs with --tick."
            )
        if not args.no_demo_story:
            story = Story(ctx)
            await story.run()
            await session.commit()
            world.staff.extend(a for a in story.actors.values() if a.staff_ref and a.role)
            print("sc-hydrate: Munchly Foods, from design3's story")
            if not args.no_live:
                ctx.clock.set(datetime.now(UTC))  # type: ignore[attr-defined]
                out = await live.build(ctx)
                await session.commit()
                print(
                    f"sc-hydrate: Munchly's live workspace: {out['members']} members on email and password, "
                    f"{out['kiranas']} kiranas; the journey starts on {out['day0']}"
                )
        await world.make_staff(args.staff)
        for n in range(args.clients):
            await world.client(n, args.clients, live=n % 3 != 2)
        await world.new_requests(2)
        await session.commit()
        counts = {}
        for name, model in [
            ("staff", m.StaffMember),
            ("clients", m.Client),
            ("people", m.ClientMember),
            ("distributors", m.Distributor),
            ("SKUs", m.Sku),
            ("batches", m.Batch),
            ("runs", m.AgentRun),
            ("demo requests", m.DemoRequest),
            ("audit lines", m.AuditEntry),
            ("Firebase accounts", m.User),
        ]:
            q = select(func.count()).select_from(model)
            if model is m.User:
                q = q.where(m.User.firebase_uid.is_not(None))
            counts[name] = (await session.execute(q)).scalar_one()
        print("sc-hydrate:", ", ".join(f"{v} {k}" for k, v in counts.items()))
        await _publish(ctx)


async def _live_only(ctx: Ctx) -> None:
    """Munchly's live workspace on top of its story, where the story was imported before the workspace went live"""
    munchly = await ctx.session.get(m.Client, "munchly")
    if munchly is None:
        raise SystemExit("sc-hydrate: there is no Munchly Foods here; import the story first (a full hydrate)")
    if ctx.cloud is None:
        raise SystemExit("sc-hydrate: the live workspace needs its buckets and topics (EXPORTS_BUCKET, EVENTS_ENV)")
    ctx.clock.set(datetime.now(UTC))  # type: ignore[attr-defined]
    out = await live.build(ctx)
    await ctx.session.commit()
    print(
        f"sc-hydrate: Munchly's live workspace: {out['members']} members on email and password, "
        f"{out['kiranas']} kiranas; the journey starts on {out['day0']}"
    )
    await _publish(ctx)


async def _publish(ctx: Ctx) -> None:
    """the journey's first events (the backfill for the Data agent, the Mango donation), to Pub/Sub"""
    if ctx.cloud is None:
        return
    from sc_api.services.journey.outbox import drain

    sent = await drain(sessions(ctx.session.bind), ctx.cloud.publisher, datetime.now(UTC))  # type: ignore[arg-type]
    print(f"sc-hydrate: {sent} event(s) published")


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(prog="sc-hydrate", description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    p.add_argument("--seed", type=int, default=7)
    p.add_argument("--clients", type=int, default=6)
    p.add_argument("--staff", type=int, default=4, help="staff invited besides the founding Super admin")
    p.add_argument("--days", type=int, default=35)
    p.add_argument("--no-demo-story", action="store_true")
    p.add_argument("--tick", action="store_true")
    p.add_argument("--no-live", action="store_true", help="leave Munchly's live workspace out (SC-66)")
    p.add_argument("--journey-reset", metavar="CLIENT", help="start a client's live journey again (SC-66)")
    p.add_argument(
        "--live-only", action="store_true", help="Munchly's live workspace on a database that has its story (SC-75)"
    )
    p.add_argument("--allow-env", help="hydrate an environment other than local (named, to be sure)")
    args = p.parse_args(argv)
    env = get_settings().sc_env
    if env != "local" and args.allow_env != env:
        raise SystemExit(f"sc-hydrate: SC_ENV is {env}; pass --allow-env {env} to hydrate it")
    if args.days < 6 or args.clients < 0:
        raise SystemExit("sc-hydrate: --days is at least 6")
    asyncio.run(run(args))
