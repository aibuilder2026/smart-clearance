"""The sync's reading of the schema (SC-136, cli/sync.py): every table of schema sc but Alembic's, each after the tables
it refers to by a key checked at once (a deferrable key is checked at commit), so a copy in that order never breaks a
foreign key; and the truncate guards it lifts for its transaction
(the audit log's), which must be found, or the TRUNCATE is refused."""

import asyncpg
from sqlalchemy.ext.asyncio import AsyncEngine

from sc_api.cli import sync
from sc_api.db import db_password

from .conftest import migrator_settings


async def _connect() -> asyncpg.Connection:
    s = migrator_settings()
    return await asyncpg.connect(
        host=s.db_host, port=s.db_port, user=s.db_user, password=db_password(s), database=s.db_name
    )


async def test_the_tables_come_parents_first_without_alembic(engine: AsyncEngine):
    conn = await _connect()
    try:
        order = await sync.tables(conn)
        assert "alembic_version" not in order and "audit_log" in order and "cases" in order
        refs = await conn.fetch(
            """
            SELECT child.relname AS child, parent.relname AS parent FROM pg_constraint k
            JOIN pg_class child ON child.oid = k.conrelid JOIN pg_class parent ON parent.oid = k.confrelid
            JOIN pg_namespace n ON n.oid = child.relnamespace
            WHERE k.contype = 'f' AND NOT k.condeferrable AND n.nspname = 'sc' AND child.oid <> parent.oid
            """
        )
        assert refs, "the schema has foreign keys to order by"
        for r in refs:
            assert order.index(r["parent"]) < order.index(r["child"]), f"{r['parent']} before {r['child']}"
        total = await conn.fetchval(
            "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
            "WHERE n.nspname = 'sc' AND c.relkind IN ('r', 'p') AND NOT c.relispartition"
        )
        assert len(order) == total - 1  # every table but Alembic's
    finally:
        await conn.close()


async def test_it_finds_the_audit_logs_truncate_guard(engine: AsyncEngine):
    conn = await _connect()
    try:
        assert ("audit_log", "audit_log_no_truncate") in await sync.truncate_guards(conn)
    finally:
        await conn.close()


def test_the_report_marks_a_table_that_differs():
    out = sync.table_report(["cases", "clients"], {"cases": 3, "clients": 7}, {"cases": 1, "clients": 7})
    lines = out.splitlines()
    assert lines[1].endswith("←") and not lines[2].endswith("←")
    assert lines[-1].split()[-2:] == ["10", "8"]
