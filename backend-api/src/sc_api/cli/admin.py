"""sc-admin: the operator's commands.

sc-admin migrate                     the schema (Alembic) and the reference data; on Cloud SQL, the roles and grants
                                     first (the Cloud Run migrate job runs this)
sc-admin load-reference              the reference data only
sc-admin staff-add NAME EMAIL ROLE   a staff member, on the default password (the first Super admin, say)
sc-admin reset-passwords --still-default | --email EMAIL
                                     put accounts back on the default password (after a rotation, or a lost one)
"""

import argparse
import asyncio
import sys
from pathlib import Path

from sqlalchemy import select, text

from sc_api import models as m
from sc_api.db import engine_scope, sessions
from sc_api.domain.clock import Clock, Ids
from sc_api.identity import provider
from sc_api.services import reference, staff
from sc_api.services.context import SYSTEM, Ctx
from sc_api.settings import get_settings

ROOT = Path(__file__).resolve().parents[3]


def _alembic_ini() -> Path:
    for candidate in (Path.cwd() / "alembic.ini", ROOT / "alembic.ini"):
        if candidate.exists():
            return candidate
    raise SystemExit("sc-admin: alembic.ini not found (run from backend-api/)")


async def _cloud_roles() -> None:
    """On Cloud SQL, where there is no superuser login: the group roles, and the IAM users' memberships. The
    migrator's IAM user holds cloudsqlsuperuser (infra/prod/sql.tf)."""
    s = get_settings()
    roles_sql = (ROOT / "db" / "roles.sql").read_text()
    async with engine_scope(s) as engine, engine.begin() as conn:
        await conn.execute(text(roles_sql))
        await conn.execute(text(f'GRANT sc_owner TO "{s.db_user}"'))
        if s.db_app_user:
            await conn.execute(text(f'GRANT sc_app TO "{s.db_app_user}"'))
        await conn.execute(text(f'GRANT CONNECT, CREATE, TEMPORARY ON DATABASE "{s.db_name}" TO sc_owner'))
        await conn.execute(text(f'GRANT CONNECT ON DATABASE "{s.db_name}" TO sc_app'))


async def load_reference() -> dict[str, int]:
    async with engine_scope() as engine, sessions(engine)() as session, session.begin():
        await session.execute(text("SET LOCAL ROLE sc_owner"))
        return await reference.install(session)


async def reset_schema() -> None:
    s = get_settings()
    if s.sc_env != "local":
        raise SystemExit(f"sc-admin reset-schema: refused, SC_ENV is {s.sc_env} (local only)")
    async with engine_scope(s) as engine, engine.begin() as conn:
        await conn.execute(text("SET ROLE sc_owner"))
        await conn.execute(text("DROP SCHEMA IF EXISTS sc CASCADE"))
    print("reset-schema: dropped schema sc")


def migrate() -> None:
    from alembic import command
    from alembic.config import Config

    if get_settings().db_mode == "cloudsql":
        asyncio.run(_cloud_roles())
    command.upgrade(Config(str(_alembic_ini())), "head")
    counts = asyncio.run(load_reference())
    print("reference data:", ", ".join(f"{v} {k}" for k, v in counts.items()))


async def _ctx_run(fn) -> None:
    settings = get_settings()
    async with engine_scope(settings) as engine, sessions(engine)() as session:
        ctx = Ctx(
            session=session,
            actor=SYSTEM,
            clock=Clock(),
            ids=Ids(),
            identity=provider(settings),
            settings=settings,
            ref=await reference.read(session),
        )
        await fn(ctx)
        await session.commit()


async def staff_add(name: str, email: str, role: str) -> None:
    async def run(ctx: Ctx) -> None:
        s = await staff.add(ctx, staff.StaffSpec(name=name, email=email, role=role))
        print(f"staff: {s.name} <{s.email}>, {s.role}, invited; signs in with the default password")

    await _ctx_run(run)


async def reset_passwords(still_default: bool, email: str | None) -> None:
    async def run(ctx: Ctx) -> None:
        q = select(m.User).where(m.User.firebase_uid.is_not(None))
        q = q.where(m.User.email == email.lower()) if email else q.where(m.User.password_state == "default")
        users = (await ctx.session.execute(q)).scalars().all()
        for u in users:
            assert u.firebase_uid
            await ctx.identity.reset_to_default(u.firebase_uid)
            u.password_state = "default"
        print(f"reset-passwords: {len(users)} account(s) on the default password")

    if not (still_default or email):
        raise SystemExit("sc-admin reset-passwords: --still-default or --email EMAIL")
    await _ctx_run(run)


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(prog="sc-admin", description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("migrate")
    sub.add_parser("load-reference")
    rs = sub.add_parser("reset-schema")
    rs.add_argument("--yes", action="store_true", required=True)
    a = sub.add_parser("staff-add")
    a.add_argument("name")
    a.add_argument("email")
    a.add_argument("role", choices=["Super admin", "Platform engineer", "Support"])
    r = sub.add_parser("reset-passwords")
    r.add_argument("--still-default", action="store_true")
    r.add_argument("--email")
    args = p.parse_args(argv)
    if args.command == "migrate":
        migrate()
    elif args.command == "reset-schema":
        asyncio.run(reset_schema())
    elif args.command == "load-reference":
        print(asyncio.run(load_reference()))
    elif args.command == "staff-add":
        asyncio.run(staff_add(args.name, args.email, args.role))
    elif args.command == "reset-passwords":
        asyncio.run(reset_passwords(args.still_default, args.email))
    return None


if __name__ == "__main__":
    sys.exit(main())
