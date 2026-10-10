"""Production's database replaced with local's (SC-136): every table of schema sc, so the app on Cloud Run reads the
dataset a local backend reads.

- Local: the Docker Postgres, as sc_migrator (scripts/lib.sh as_migrator), its password from Secret Manager by
  reference, read in memory and never printed.
- Production: Cloud SQL through the Python connector, as sc-migrator by IAM database authentication. The operator
  acts as sc-migrator in code (impersonated credentials), which infra/prod allows only until data_sync_until.
- `plan` reads both sides and changes nothing: the schema versions, which must match, each table's rows, and what
  local still has to send (unpublished events, pending timers), which production would otherwise act on.
- `apply` replaces production's tables in one transaction, as sc_owner: the truncate guards (the audit log's) lifted,
  every table truncated, each table copied from local in its foreign keys' order, the sequences set to local's, the
  guards back, and every table's rows checked against local's before it commits. Anything amiss rolls it all back.

scripts/sync.sh runs it, with the backup before and the buckets and BigQuery after.
"""

import argparse
import asyncio
import io
import os
import sys
from dataclasses import dataclass

import asyncpg

from sc_api.db import SCHEMA, db_password
from sc_api.settings import get_settings

SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]
# Alembic's own table: the schema versions must already match, and it is not data
KEEP = {"alembic_version"}


@dataclass
class Prod:
    instance: str
    user: str
    principal: str


def prod_settings() -> Prod:
    missing = [k for k in ("SYNC_PROD_INSTANCE", "SYNC_PROD_USER", "SYNC_PROD_SA") if not os.environ.get(k)]
    if missing:
        raise SystemExit(f"sc-sync: needs {', '.join(missing)} (scripts/sync.sh sets them)")
    return Prod(os.environ["SYNC_PROD_INSTANCE"], os.environ["SYNC_PROD_USER"], os.environ["SYNC_PROD_SA"])


async def local_connection() -> asyncpg.Connection:
    s = get_settings()
    return await asyncpg.connect(
        host=s.db_host, port=s.db_port, user=s.db_user, password=db_password(s), database=s.db_name
    )


async def prod_connection(p: Prod):
    """production, as sc-migrator: the operator's own credentials, impersonating it in code"""
    import google.auth
    from google.auth import impersonated_credentials
    from google.cloud.sql.connector import create_async_connector

    source, _ = google.auth.default(scopes=SCOPES)
    creds = impersonated_credentials.Credentials(
        source_credentials=source, target_principal=p.principal, target_scopes=SCOPES, lifetime=3600
    )
    connector = await create_async_connector(refresh_strategy="lazy", credentials=creds)
    conn = await connector.connect_async(p.instance, "asyncpg", user=p.user, db="smart_clearance", enable_iam_auth=True)
    return connector, conn


async def target():
    """what is replaced: production, or (SYNC_REHEARSAL_DB, scripts/sync.sh --rehearse) a scratch local database, to
    rehearse the same transaction first. Returns the connector to close (None locally) and the connection"""
    rehearsal = os.environ.get("SYNC_REHEARSAL_DB")
    if rehearsal:
        s = get_settings()
        conn = await asyncpg.connect(
            host=s.db_host, port=s.db_port, user=s.db_user, password=db_password(s), database=rehearsal
        )
        return None, conn
    return await prod_connection(prod_settings())


async def tables(conn: asyncpg.Connection) -> list[str]:
    """schema sc's tables, parents before the tables that refer to them. A deferrable key is checked at commit (the
    copy defers them), so it does not order them: clients' approver, a member of the client, is one"""
    rows = await conn.fetch(
        """
        SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = $1 AND c.relkind IN ('r', 'p') AND NOT c.relispartition ORDER BY 1
        """,
        SCHEMA,
    )
    names = [r["relname"] for r in rows if r["relname"] not in KEEP]
    refs = await conn.fetch(
        """
        SELECT child.relname AS child, parent.relname AS parent FROM pg_constraint k
        JOIN pg_class child ON child.oid = k.conrelid JOIN pg_class parent ON parent.oid = k.confrelid
        JOIN pg_namespace n ON n.oid = child.relnamespace
        WHERE k.contype = 'f' AND NOT k.condeferrable AND n.nspname = $1 AND child.oid <> parent.oid
        """,
        SCHEMA,
    )
    needs = {t: {r["parent"] for r in refs if r["child"] == t and r["parent"] in names} for t in names}
    order: list[str] = []
    while needs:
        ready = sorted(t for t, ps in needs.items() if ps <= set(order))
        if not ready:
            raise SystemExit(f"sc-sync: foreign keys go round in a circle among {', '.join(sorted(needs))}")
        order += ready
        for t in ready:
            del needs[t]
    return order


async def columns(conn: asyncpg.Connection, table: str) -> list[str]:
    """a table's columns that take a value (a generated column is worked out again)"""
    rows = await conn.fetch(
        """
        SELECT a.attname FROM pg_attribute a WHERE a.attrelid = ($1 || '.' || $2)::regclass AND a.attnum > 0
        AND NOT a.attisdropped AND a.attgenerated = '' ORDER BY a.attnum
        """,
        SCHEMA,
        table,
    )
    return [r["attname"] for r in rows]


async def counts(conn: asyncpg.Connection, names: list[str]) -> dict[str, int]:
    # the tables' names come from the catalog (tables()), never from input
    return {t: await conn.fetchval(f'SELECT count(*) FROM {SCHEMA}."{t}"') for t in names}  # noqa: S608


async def version(conn: asyncpg.Connection) -> str:
    return await conn.fetchval(f"SELECT string_agg(version_num, ',') FROM {SCHEMA}.alembic_version")  # noqa: S608


async def sequences(conn: asyncpg.Connection) -> list[str]:
    rows = await conn.fetch(
        "SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
        "WHERE n.nspname = $1 AND c.relkind = 'S' ORDER BY 1",
        SCHEMA,
    )
    return [r["relname"] for r in rows]


async def truncate_guards(conn: asyncpg.Connection) -> list[tuple[str, str]]:
    """the user triggers that refuse a TRUNCATE (the audit log's append-only guard)"""
    rows = await conn.fetch(
        """
        SELECT c.relname, t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = $1 AND NOT t.tgisinternal AND (t.tgtype & 32) <> 0 ORDER BY 1, 2
        """,
        SCHEMA,
    )
    return [(r["relname"], r["tgname"]) for r in rows]


async def compare(local: asyncpg.Connection, prod: asyncpg.Connection) -> tuple[list[str], dict, dict]:
    """both sides' versions, tables and columns must match; returns the tables in order and both sides' counts"""
    lv, pv = await version(local), await version(prod)
    if lv != pv:
        raise SystemExit(f"sc-sync: local is at schema {lv} and production at {pv}: migrate first")
    order = await tables(local)
    theirs = await tables(prod)
    if set(order) != set(theirs):
        raise SystemExit(
            f"sc-sync: the tables differ: only local {sorted(set(order) - set(theirs))}, "
            f"only production {sorted(set(theirs) - set(order))}"
        )
    for t in order:
        if await columns(local, t) != await columns(prod, t):
            raise SystemExit(f"sc-sync: {t}'s columns differ between local and production")
    return order, await counts(local, order), await counts(prod, order)


def table_report(order: list[str], here: dict, there: dict, *, after: str = "production") -> str:
    width = max(len(t) for t in order)
    lines = [f"{'table'.ljust(width)}  {'local':>7}  {after:>10}"]
    for t in order:
        mark = "" if here[t] == there[t] else "  ←"
        lines.append(f"{t.ljust(width)}  {here[t]:>7}  {there[t]:>10}{mark}")
    lines.append(f"{'rows'.ljust(width)}  {sum(here.values()):>7}  {sum(there.values()):>10}")
    return "\n".join(lines)


async def unsent(local: asyncpg.Connection) -> tuple[int, int]:
    """what local has still to do, which production would do on copying: events not published, timers not fired"""
    events = await local.fetchval(f"SELECT count(*) FROM {SCHEMA}.outbox WHERE published_wall IS NULL")  # noqa: S608
    timers = await local.fetchval(f"SELECT count(*) FROM {SCHEMA}.timers WHERE fired_wall IS NULL")  # noqa: S608
    return events, timers


async def plan() -> None:
    local = await local_connection()
    connector, prod = await target()
    try:
        order, here, there = await compare(local, prod)
        events, timers = await unsent(local)
        print(f"schema: both at {await version(local)}")
        print(f"local still to send: {events} events, {timers} timers")
        print(table_report(order, here, there))
    finally:
        await local.close()
        await prod.close()
        if connector is not None:
            await connector.close_async()


async def apply() -> None:
    local = await local_connection()
    connector, prod = await target()
    try:
        order, here, _ = await compare(local, prod)
        events, timers = await unsent(local)
        if events or timers:
            raise SystemExit(
                f"sc-sync: local has {events} events to publish and {timers} timers to fire, which production would "
                "act on: let the local worker and tick finish first"
            )
        guards = await truncate_guards(prod)
        seqs = await sequences(local)
        async with prod.transaction():
            await prod.execute("SET LOCAL ROLE sc_owner")
            await prod.execute("SET CONSTRAINTS ALL DEFERRED")  # the deferrable keys, checked at commit
            for table, trigger in guards:
                await prod.execute(f'ALTER TABLE {SCHEMA}."{table}" DISABLE TRIGGER "{trigger}"')
            await prod.execute("TRUNCATE " + ", ".join(f'{SCHEMA}."{t}"' for t in order))
            for t in order:
                cols = await columns(local, t)
                buf = io.BytesIO()
                await local.copy_from_table(t, schema_name=SCHEMA, columns=cols, output=buf, format="binary")
                buf.seek(0)
                await prod.copy_to_table(t, schema_name=SCHEMA, columns=cols, source=buf, format="binary")
            for s in seqs:
                last, called = await local.fetchrow(f'SELECT last_value, is_called FROM {SCHEMA}."{s}"')  # noqa: S608
                await prod.execute("SELECT setval($1, $2, $3)", f"{SCHEMA}.{s}", last, called)
            for table, trigger in guards:
                await prod.execute(f'ALTER TABLE {SCHEMA}."{table}" ENABLE TRIGGER "{trigger}"')
            there = await counts(prod, order)
            if there != here:
                raise SystemExit("sc-sync: production's rows do not match local's after the copy; rolled back\n")
        print(f"replaced {len(order)} tables, {sum(here.values())} rows, {len(seqs)} sequences; guards back on")
        print(table_report(order, here, there))
    finally:
        await local.close()
        await prod.close()
        if connector is not None:
            await connector.close_async()


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(prog="sc-sync", description=__doc__.split("\n\n")[0])
    ap.add_argument("what", choices=["plan", "apply"])
    a = ap.parse_args(argv)
    asyncio.run(plan() if a.what == "plan" else apply())
    sys.stdout.flush()


if __name__ == "__main__":
    main()
