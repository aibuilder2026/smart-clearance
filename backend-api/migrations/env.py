"""Alembic's environment: migrations run as the schema's owner (SET ROLE sc_owner), so every object belongs to
sc_owner whichever login runs them (sc_migrator locally, sc-migrator's IAM user on Cloud SQL)."""

import asyncio

from alembic import context
from sqlalchemy import text
from sqlalchemy.engine import Connection

from sc_api.db import SCHEMA, dispose, make_engine
from sc_api.models import Base

target_metadata = Base.metadata


def run(connection: Connection) -> None:
    connection.execute(text("SET ROLE sc_owner"))
    connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA} AUTHORIZATION sc_owner"))
    connection.commit()
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        version_table_schema=SCHEMA,
        include_schemas=False,
        compare_type=True,
        include_name=lambda name, type_, parent: not (type_ == "table" and name == "alembic_version"),
    )
    with context.begin_transaction():
        context.run_migrations()


async def main() -> None:
    engine = await make_engine()
    try:
        async with engine.connect() as connection:
            await connection.run_sync(run)
            await connection.commit()
    finally:
        await dispose(engine)


if context.is_offline_mode():
    raise SystemExit("offline migrations are not used: run scripts/migrate.sh")
asyncio.run(main())
