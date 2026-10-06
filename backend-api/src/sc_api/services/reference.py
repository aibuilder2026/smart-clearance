"""The platform's reference data: what it offers every client (plans, agents, connectors, exits), its roles and
permissions, and the documents the API serves as they are (the console's config, the landing page's showcase).

It is loaded at migrate time from src/sc_api/reference/, which frontend/scripts/seed.mjs writes from design3 (and
rbac.json, written by hand), so an empty production database has it too. The API only reads it.
"""

import hashlib
import json
from dataclasses import dataclass
from functools import cache
from importlib import resources
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from sc_api import models as m


@cache
def load(name: str) -> Any:
    return json.loads(resources.files("sc_api.reference").joinpath(name).read_text("utf-8"))


def _version(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()[:16]


async def _upsert(session: AsyncSession, model: type[m.Base], rows: list[dict[str, Any]], key: list[str]) -> None:
    if not rows:
        return
    stmt = insert(model).values(rows)
    stmt = stmt.on_conflict_do_update(index_elements=key, set_={c: stmt.excluded[c] for c in rows[0] if c not in key})
    await session.execute(stmt)


async def install(session: AsyncSession) -> dict[str, int]:
    """Upsert the reference data (as the schema's owner). Rows the files no longer name are left alone: clients may
    still point at them."""
    catalog = load("catalog.json")
    config = load("console.json")["config"]
    rbac = load("rbac.json")
    await _upsert(
        session,
        m.Plan,
        [
            {"id": p["id"], "name": p["name"], "position": i, "scope": p["scope"]}
            for i, p in enumerate(catalog["plans"])
        ],
        ["id"],
    )
    await _upsert(
        session,
        m.Agent,
        [
            {
                "id": a["id"],
                "name": a["name"],
                "stage": a["stage"],
                "icon": a["icon"],
                "model": a.get("model"),
                "job": a["job"],
                "is_gate": a["gate"],
                "position": i,
            }
            for i, a in enumerate(catalog["agents"])
        ],
        ["id"],
    )
    await _upsert(
        session,
        m.Connector,
        [
            {**{k: c[k] for k in ("id", "name", "kind", "icon", "note", "status")}, "position": i}
            for i, c in enumerate(catalog["connectors"])
        ],
        ["id"],
    )
    await _upsert(
        session,
        m.Exit,
        [{"id": e["id"], "name": e["name"], "icon": e["icon"], "position": i} for i, e in enumerate(config["exits"])],
        ["id"],
    )
    await _upsert(session, m.Permission, rbac["permissions"], ["id"])
    await _upsert(
        session,
        m.Role,
        [
            {
                "id": r["id"],
                "scope": r["scope"],
                "name": r["name"],
                "description": r["description"],
                "team": r.get("team"),
                "position": i,
            }
            for i, r in enumerate(rbac["roles"])
        ],
        ["id"],
    )
    await session.execute(delete(m.RolePermission))
    grants = [{"role_id": r["id"], "permission_id": p} for r in rbac["roles"] for p in r["permissions"]]
    if grants:
        await session.execute(insert(m.RolePermission).values(grants))
    documents = {"console-config": config, "showcase": load("showcase.json")}
    await _upsert(
        session,
        m.Document,
        [{"key": k, "version": _version(v), "value": v} for k, v in documents.items()],
        ["key"],
    )
    return {
        "plans": len(catalog["plans"]),
        "agents": len(catalog["agents"]),
        "connectors": len(catalog["connectors"]),
        "exits": len(config["exits"]),
        "roles": len(rbac["roles"]),
        "permissions": len(rbac["permissions"]),
        "documents": len(documents),
    }


@dataclass(frozen=True)
class Reference:
    """What the services read on every call, from the database: small, and loaded once per request."""

    config: dict[str, Any]
    agents: list[dict[str, Any]]
    plans: list[dict[str, Any]]
    exits: list[dict[str, Any]]

    def agent(self, agent_id: str) -> dict[str, Any] | None:
        return next((a for a in self.agents if a["id"] == agent_id), None)

    def plan_name(self, plan_id: str) -> str:
        return next((p["name"] for p in self.plans if p["id"] == plan_id), plan_id)

    def level(self, autonomy: str) -> str:
        return next((x["label"] for x in self.config["autonomy"] if x["id"] == autonomy), autonomy)

    def fields(self, agent_id: str) -> list[dict[str, Any]]:
        return self.config["fields"].get(agent_id, [])

    def opt_label(self, question: str, option: str) -> str:
        return next((o["label"] for o in self.config["profile"][question]["options"] if o["id"] == option), option)

    @property
    def defaults(self) -> dict[str, Any]:
        return self.config["defaults"]


async def read(session: AsyncSession) -> Reference:
    config = (await session.execute(select(m.Document.value).where(m.Document.key == "console-config"))).scalar_one()
    agents = (await session.execute(select(m.Agent).order_by(m.Agent.position))).scalars().all()
    plans = (await session.execute(select(m.Plan).order_by(m.Plan.position))).scalars().all()
    exits = (await session.execute(select(m.Exit).order_by(m.Exit.position))).scalars().all()
    return Reference(
        config=config,
        agents=[
            {
                "id": a.id,
                "name": a.name,
                "stage": a.stage,
                "icon": a.icon,
                "model": a.model,
                "job": a.job,
                "gate": a.is_gate,
            }
            for a in agents
        ],
        plans=[{"id": p.id, "name": p.name, "scope": p.scope} for p in plans],
        exits=[{"id": e.id, "name": e.name, "icon": e.icon} for e in exits],
    )
