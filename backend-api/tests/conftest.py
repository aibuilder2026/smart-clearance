"""The suite runs against a real PostgreSQL database (smart_clearance_test), migrated from scratch as sc_migrator, with
the reference data and Munchly Foods' story imported once, through the services. The clock stands still at the story's
"today" (6 Oct 2026, noon in India), so the story reads exactly as design3 seeds it.

Each test runs inside a transaction that is rolled back, as sc_api (the API's own login, with its own privileges).
Firebase is the in-memory FakeIdentity: the suite never reaches Google.

Configuration (scripts/test.sh sets it; CI sets it for its service container):
  DB_HOST, DB_PORT, DB_NAME=smart_clearance_test, DB_USER=sc_api, DB_PASSWORD or DB_PASSWORD_SECRET
  TEST_MIGRATOR_PASSWORD or TEST_MIGRATOR_PASSWORD_SECRET (the sc_migrator login)
"""

import asyncio
import os
from collections.abc import AsyncIterator
from datetime import datetime

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, async_sessionmaker

os.environ.setdefault("SC_ENV", "test")
os.environ.setdefault("IDENTITY", "fake")
os.environ.setdefault("DB_NAME", "smart_clearance_test")
os.environ.setdefault("STAFF_EMAIL_DOMAIN", "smartclearance.example")

from sc_api.cloud import Cloud, FakeMessenger, FakePublisher, FakeStorage
from sc_api.db import dispose, make_engine
from sc_api.domain.clock import IST, FixedClock, Ids
from sc_api.identity import FakeIdentity, synthetic_uid
from sc_api.main import create_app
from sc_api.services import reference
from sc_api.services.context import SYSTEM, Ctx
from sc_api.settings import Settings

STORY_NOON = datetime(2026, 10, 6, 12, 0, tzinfo=IST)
STAFF_DOMAIN = "smartclearance.example"
NEHA = f"neha.kulkarni@{STAFF_DOMAIN}"
SAMEER = f"sameer.rao@{STAFF_DOMAIN}"


def settings(**overrides) -> Settings:
    live = {
        "cloud": "fake",
        "events_env": "test",
        "photos_bucket": "photos-test",
        "docs_bucket": "docs-test",
        "exports_bucket": "exports-test",
        "stream_max_seconds": 1,
        "stream_heartbeat_seconds": 1,
    }
    return Settings(sc_env="test", identity="fake", **{**live, **overrides})


def migrator_settings() -> Settings:
    return settings(
        db_user=os.environ.get("TEST_MIGRATOR_USER", "sc_migrator"),
        db_password=os.environ.get("TEST_MIGRATOR_PASSWORD"),
        db_password_secret=os.environ.get("TEST_MIGRATOR_PASSWORD_SECRET"),
    )


def token(email: str) -> dict[str, str]:
    return {"Authorization": f"Bearer fake:{synthetic_uid(email)}"}


@pytest.fixture(scope="session")
def identity() -> FakeIdentity:
    return FakeIdentity()


@pytest.fixture(scope="session")
async def engine(identity: FakeIdentity) -> AsyncIterator[AsyncEngine]:
    """a fresh schema, the reference data, and Munchly Foods' story; then the API's own login"""
    from alembic import command
    from alembic.config import Config

    from sc_api.cli import admin
    from sc_api.cli.story import Story

    m = migrator_settings()
    owner = await make_engine(m)
    async with owner.begin() as conn:
        await conn.execute(text("SET ROLE sc_owner"))
        await conn.execute(text("DROP SCHEMA IF EXISTS sc CASCADE"))
    await dispose(owner)
    saved = {k: os.environ.get(k) for k in ("DB_USER", "DB_PASSWORD", "DB_PASSWORD_SECRET")}
    os.environ["DB_USER"] = m.db_user
    for k, v in (("DB_PASSWORD", m.db_password), ("DB_PASSWORD_SECRET", m.db_password_secret)):
        if v:
            os.environ[k] = v
        else:
            os.environ.pop(k, None)
    from sc_api.settings import get_settings

    get_settings.cache_clear()
    try:
        # Alembic's env.py runs its own event loop, so it gets a thread of its own
        await asyncio.to_thread(command.upgrade, Config(str(admin._alembic_ini())), "head")
        await admin.load_reference()
    finally:
        for k, v in saved.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
        get_settings.cache_clear()

    app_engine = await make_engine(settings())
    async with app_engine.connect() as conn:
        session = async_sessionmaker(bind=conn, expire_on_commit=False)()
        ctx = Ctx(
            session=session,
            actor=SYSTEM,
            clock=FixedClock(STORY_NOON),
            ids=Ids(),
            identity=identity,
            settings=settings(),
            ref=await reference.read(session),
        )
        await Story(ctx).run()
        await session.commit()
        await conn.commit()
    yield app_engine
    await dispose(app_engine)


@pytest.fixture
async def conn(engine: AsyncEngine) -> AsyncIterator[AsyncConnection]:
    async with engine.connect() as c:
        tx = await c.begin()
        try:
            yield c
        finally:
            await tx.rollback()


@pytest.fixture
def clock() -> FixedClock:
    return FixedClock(STORY_NOON)


@pytest.fixture
def cloud() -> Cloud:
    """Pub/Sub, Cloud Storage and FCM, in memory: what the suite's journey published, stored and pushed"""
    return Cloud(FakePublisher(), FakeStorage(), FakeMessenger())


@pytest.fixture
async def ctx(conn: AsyncConnection, identity: FakeIdentity, clock: FixedClock, cloud: Cloud) -> Ctx:
    session = async_sessionmaker(bind=conn, expire_on_commit=False, join_transaction_mode="create_savepoint")()
    return Ctx(
        session=session,
        actor=SYSTEM,
        clock=clock,
        ids=Ids(),
        identity=identity,
        settings=settings(),
        ref=await reference.read(session),
        cloud=cloud,
    )


@pytest.fixture
async def api(conn: AsyncConnection, engine: AsyncEngine, identity: FakeIdentity, clock: FixedClock, cloud: Cloud):
    app = create_app(settings(), engine=engine, identity=identity, clock=clock, cloud_services=cloud)
    app.state.engine = engine
    app.state.sessions = async_sessionmaker(
        bind=conn, expire_on_commit=False, autoflush=False, join_transaction_mode="create_savepoint"
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture
def neha() -> dict[str, str]:
    return token(NEHA)


@pytest.fixture
def sameer() -> dict[str, str]:
    return token(SAMEER)


@pytest.fixture
async def munchly(ctx: Ctx):
    """Munchly's live workspace (cli/live.py), with its journey at day 0"""
    from sc_api.cli import live

    out = await live.build(ctx)
    await ctx.session.commit()
    return out
