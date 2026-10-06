"""The synthetic world: built through the services, readable through the API, and the same for the same seed."""

from dataclasses import replace

from sqlalchemy import func, select

from sc_api import models as m
from sc_api.cli.synth import SyntheticIdentity, World
from sc_api.domain.clock import FixedClock, SeededIds
from sc_api.services import presenter

C = "/v1/console/clients"


async def build(ctx, seed: int) -> list[str]:
    world = World(
        replace(ctx, clock=FixedClock(ctx.clock.now()), ids=SeededIds(seed), identity=SyntheticIdentity(ctx.identity)),
        seed=seed,
        days=10,
    )
    await world.make_staff(2)
    for n in range(3):
        await world.client(n, 3, live=n != 2)
    ids = await presenter.client_ids(ctx)
    return [cid for cid in ids if cid != "munchly"]


async def test_a_world_through_the_services(ctx, api, neha):
    made = await build(ctx, seed=11)
    assert len(made) == 3
    clients = (await api.get(C, headers=neha)).json()
    assert len(clients) == 4
    for c in clients:
        if c["id"] == "munchly":
            continue
        assert c["emailDomain"].endswith(".example")
        assert c["people"] and c["distributors"] and c["skus"]
        assert all(p["email"].endswith(".example") for p in c["people"] if p["email"])
    live = [c for c in clients if c["id"] != "munchly" and c["status"] == "live"]
    assert len(live) == 2 and all(c["since"] for c in live)
    lines = (await api.get("/v1/console/audit", headers=neha)).json()
    assert any(line["text"].startswith("Set up ") and line["client"] in made for line in lines)
    requests = (await api.get("/v1/demo-requests", headers=neha)).json()
    assert {r["client"] for r in requests if r["status"] == "set up"} >= set(made)
    accounts = (await ctx.session.execute(select(func.count()).where(m.User.firebase_uid.like("syn-%")))).scalar_one()
    assert accounts > 10


async def test_the_same_seed_builds_the_same_world(engine, identity):
    from sqlalchemy.ext.asyncio import async_sessionmaker

    from sc_api.services import reference
    from sc_api.services.context import SYSTEM, Ctx
    from tests.conftest import STORY_NOON, settings

    async def once() -> list:
        async with engine.connect() as conn:
            tx = await conn.begin()
            session = async_sessionmaker(bind=conn, expire_on_commit=False, join_transaction_mode="create_savepoint")()
            ctx = Ctx(
                session=session,
                actor=SYSTEM,
                clock=FixedClock(STORY_NOON),
                ids=SeededIds(5),
                identity=identity,
                settings=settings(),
                ref=await reference.read(session),
            )
            made = await build(ctx, seed=5)
            names = (
                await session.execute(
                    select(m.Client.name, m.ClientMember.name)
                    .join(m.ClientMember, m.ClientMember.client_id == m.Client.id)
                    .where(m.Client.id.in_(made))
                    .order_by(m.Client.id, m.ClientMember.ref)
                )
            ).all()
            await tx.rollback()
            return [tuple(r) for r in names]

    first, second = await once(), await once()
    assert first and first == second
