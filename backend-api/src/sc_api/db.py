"""The database: one PostgreSQL database, smart_clearance, schema sc.

- Locally: a DSN to the Docker Postgres, as the login sc_api (or sc_migrator for migrations). The password comes
  from Secret Manager, or DB_PASSWORD for a throwaway database.
- On Cloud Run: the Cloud SQL Python Connector with IAM database authentication; no password exists.

Every engine traces its SQL statements (tracing.py): each one is a span in the request's trace.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy import URL
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from sc_api import tracing
from sc_api.settings import Settings, get_settings

SCHEMA = "sc"
# each Cloud SQL engine's connector, closed with it
_connectors: dict[int, object] = {}


def db_password(settings: Settings) -> str | None:
    if settings.db_password:
        return settings.db_password
    if settings.db_password_secret:
        from sc_api.gcp import secret

        return secret(settings.db_password_secret)
    return None


async def make_engine(
    settings: Settings | None = None,
    *,
    user: str | None = None,
    pool_size: int | None = None,
    max_overflow: int | None = None,
) -> AsyncEngine:
    s = settings or get_settings()
    pool = {
        "pool_size": s.db_pool_size if pool_size is None else pool_size,
        "max_overflow": s.db_max_overflow if max_overflow is None else max_overflow,
    }
    connect_args = {"server_settings": {"search_path": SCHEMA, "application_name": "backend-api"}}
    if s.db_mode == "cloudsql":
        from google.cloud.sql.connector import create_async_connector

        from sc_api.gcp import credentials

        if not s.db_instance:
            raise RuntimeError("DB_MODE=cloudsql needs DB_INSTANCE (project:region:instance)")
        connector = await create_async_connector(refresh_strategy="lazy", credentials=credentials())

        async def creator():
            return await connector.connect_async(
                s.db_instance,
                "asyncpg",
                user=user or s.db_user,
                db=s.db_name,
                enable_iam_auth=True,
                **connect_args,
            )

        engine = create_async_engine("postgresql+asyncpg://", async_creator=creator, **pool)
        _connectors[id(engine)] = connector
        tracing.instrument_engine(engine)
        return engine
    url = URL.create(
        "postgresql+asyncpg",
        username=user or s.db_user,
        password=db_password(s),
        host=s.db_host,
        port=s.db_port,
        database=s.db_name,
    )
    engine = create_async_engine(url, pool_pre_ping=True, connect_args=connect_args, **pool)
    tracing.instrument_engine(engine)
    return engine


async def dispose(engine: AsyncEngine) -> None:
    connector = _connectors.pop(id(engine), None)
    await engine.dispose()
    if connector is not None:
        await connector.close_async()


def sessions(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False, autoflush=False)


@asynccontextmanager
async def engine_scope(settings: Settings | None = None, *, user: str | None = None) -> AsyncIterator[AsyncEngine]:
    engine = await make_engine(settings, user=user)
    try:
        yield engine
    finally:
        await dispose(engine)
