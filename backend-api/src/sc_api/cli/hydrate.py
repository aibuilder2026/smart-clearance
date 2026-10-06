"""sc-hydrate: a working world in an empty database, through the API's own services (scripts/hydrate.sh runs it).

  sc-hydrate [--seed N] [--clients N] [--staff N] [--days N] [--no-demo-story]
      Munchly Foods (design3's story), then the platform's staff and N generated clients, from their demo requests
      to live, over the last N days. Every user with an email address gets a Firebase account on the default
      password, with a deterministic uid; nothing is mailed.
  sc-hydrate --tick
      today's agent runs for every live client, so the console's day is today

It refuses a database that already has clients (scripts/hydrate.sh --reset rebuilds it), and any environment but
local unless --allow-env names it.
"""

import argparse
import asyncio
from datetime import UTC, datetime

from sqlalchemy import func, select

from sc_api import models as m
from sc_api.cli.story import Story
from sc_api.cli.synth import SyntheticIdentity, World
from sc_api.db import engine_scope, sessions
from sc_api.domain.clock import FixedClock, SeededIds
from sc_api.identity import provider
from sc_api.services import reference
from sc_api.services.context import SYSTEM, Ctx
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
        if args.tick:
            print(f"sc-hydrate: today's runs for {await world.tick()} live client(s)")
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


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(prog="sc-hydrate", description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    p.add_argument("--seed", type=int, default=7)
    p.add_argument("--clients", type=int, default=6)
    p.add_argument("--staff", type=int, default=4, help="staff invited besides the founding Super admin")
    p.add_argument("--days", type=int, default=14)
    p.add_argument("--no-demo-story", action="store_true")
    p.add_argument("--tick", action="store_true")
    p.add_argument("--allow-env", help="hydrate an environment other than local (named, to be sure)")
    args = p.parse_args(argv)
    env = get_settings().sc_env
    if env != "local" and args.allow_env != env:
        raise SystemExit(f"sc-hydrate: SC_ENV is {env}; pass --allow-env {env} to hydrate it")
    if args.days < 6 or args.clients < 0:
        raise SystemExit("sc-hydrate: --days is at least 6")
    asyncio.run(run(args))
