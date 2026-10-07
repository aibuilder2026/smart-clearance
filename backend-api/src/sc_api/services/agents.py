"""A client's agents: their autonomy, whether they are on, their settings (checked against the console's own setting
fields), running one now, pausing them all; and the runs the agents record."""

import re
from datetime import datetime
from typing import Any

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain.mirrors import MIRRORED, stored
from sc_api.domain.rules import show_value
from sc_api.errors import ApiError, not_found
from sc_api.schemas import AgentPatch
from sc_api.services import audit
from sc_api.services.context import Ctx
from sc_api.services.presenter import lock_client, mirrored_settings

TIME = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
NOTHING_NEW = "ran on request; nothing new"


def _agent(ctx: Ctx, agent_id: str) -> dict[str, Any]:
    a = ctx.ref.agent(agent_id)
    if a is None:
        raise not_found("agent")
    return a


async def _row(ctx: Ctx, client_id: str, agent_id: str) -> m.ClientAgent:
    row = await ctx.session.get(m.ClientAgent, (client_id, agent_id), with_for_update=True)
    if row is None:
        raise not_found("agent")
    return row


async def _person_name(ctx: Ctx, client_id: str, ref: Any) -> str:
    if not ref:
        return "nobody"
    p = await ctx.session.get(m.ClientMember, (client_id, ref))
    return p.name if p else "nobody"


def _check(field: dict[str, Any], value: Any, current: Any, agent_name: str) -> str | None:
    """what is wrong with a setting's new value, if anything"""
    label, t = field["label"], field["type"]
    if field.get("locked") and value != current:
        return f"{label}: {field['locked']}."
    if t == "time" and not (isinstance(value, str) and TIME.match(value)):
        return f"{label}: a time such as 08:30."
    if t in ("number", "money", "stepper"):
        if isinstance(value, bool) or not isinstance(value, int | float):
            return f"{label}: a number."
        if ("min" in field and value < field["min"]) or ("max" in field and value > field["max"]):
            unit = f" {field['unit']}" if field.get("unit") else ""
            return f"{label}: {field['min']} to {field['max']}{unit}."
        if t == "stepper" and not float(value).is_integer():
            return f"{label}: a whole number."
    if t == "switch" and not isinstance(value, bool):
        return f"{label}: on or off."
    if t == "select" and value not in field.get("options", []):
        return f"{label}: one of {', '.join(field['options'])}."
    if t == "approver" and value is not None and not isinstance(value, str):
        return f"{label}: one of the client's people."
    return None


async def update(ctx: Ctx, client_id: str, agent_id: str, patch: AgentPatch) -> None:
    """Autonomy, on or off, and settings: each change its own audit line, in that order (the prototype's)."""
    ctx.require("clients.configure", "Your role can't change a client's agents.")
    c = await lock_client(ctx, client_id)
    a = _agent(ctx, agent_id)
    row = await _row(ctx, client_id, agent_id)
    if patch.autonomy is not None and patch.autonomy != row.autonomy:
        if a["gate"]:
            raise ApiError(422, "The approval step always asks a person; it has no autonomy to set.")
        was, row.autonomy = row.autonomy, patch.autonomy
        await audit.record(
            ctx,
            c.id,
            "agent.autonomy",
            f"Set the {a['name']} agent to {ctx.ref.level(patch.autonomy)} for {c.name} (was {ctx.ref.level(was)})",
            {"agent": agent_id, "from": was, "to": patch.autonomy},
        )
    if patch.on is not None and patch.on != row.on:
        if a["gate"]:
            raise ApiError(422, "The approval step is always on: a person approves every plan.")
        row.on = patch.on
        await audit.record(
            ctx,
            c.id,
            "agent.on" if patch.on else "agent.off",
            f"{'Switched on' if patch.on else 'Switched off'} the {a['name']} agent for {c.name}",
            {"agent": agent_id},
        )
    if patch.settings is not None:
        fields = ctx.ref.fields(agent_id)
        known = {f["key"] for f in fields}
        unknown = sorted(set(patch.settings) - known)
        if unknown:
            raise ApiError(422, f"The {a['name']} agent has no setting called {unknown[0]}.")
        current = mirrored_settings(c, agent_id, row.settings)
        nxt = {**current, **patch.settings}
        changes: list[str] = []
        for f in fields:
            key = f["key"]
            if nxt.get(key) == current.get(key) and type(nxt.get(key)) is type(current.get(key)):
                continue
            if problem := _check(f, nxt.get(key), current.get(key), a["name"]):
                raise ApiError(422, problem, {key: problem})
            if f["type"] == "approver":
                await _approver_ok(ctx, c, nxt.get(key))
                was_name = await _person_name(ctx, c.id, current.get(key))
                changes.append(f"approver {was_name} to {await _person_name(ctx, c.id, nxt.get(key))}")
            else:
                name = f.get("short") or f["label"].lower()
                changes.append(f"{name} {show_value(f, current.get(key))} to {show_value(f, nxt.get(key))}")
        if changes:
            for key, column in MIRRORED.get(agent_id, {}).items():
                setattr(c, column, nxt[key])
            row.settings = stored(agent_id, {k: nxt[k] for k in known if k in nxt})
            await audit.record(
                ctx,
                c.id,
                "agent.settings",
                f"Changed the {a['name']} agent for {c.name}: {'; '.join(changes)}",
                {"agent": agent_id, "settings": {k: nxt[k] for k in known if k in nxt}},
            )


async def _approver_ok(ctx: Ctx, c: m.Client, ref: Any) -> None:
    if ref is None:
        raise ApiError(422, "Every plan needs an approver: choose one of the client's people.")
    p = await ctx.session.get(m.ClientMember, (c.id, ref))
    if p is None or p.status != "active" or p.access_role_id not in ("approver", "admin", "member"):
        message = f"The approver is one of {c.name}'s own people, active in its workspace."
        raise ApiError(422, message, {"approver": message})


async def record_run(
    ctx: Ctx,
    client_id: str,
    agent_id: str,
    text: str,
    *,
    at: datetime | None = None,
    last: str | None = None,
    touch_agent: bool = True,
) -> None:
    """an agent's run: the line Overview shows, and the agent's last run (`last` is the note under the agent, when it
    says more than the run's line)"""
    when = at or ctx.clock.now()
    ctx.session.add(m.AgentRun(client_id=client_id, agent_id=agent_id, ran_at=when, text=text))
    if touch_agent:
        row = await _row(ctx, client_id, agent_id)
        row.last_run_at, row.last_note = when, last or text
    await ctx.session.flush()


async def run_now(ctx: Ctx, client_id: str, agent_id: str) -> None:
    ctx.require("clients.configure", "Your role can't run a client's agents.")
    c = await lock_client(ctx, client_id)
    a = _agent(ctx, agent_id)
    if c.journey_day0 is not None:  # a client running live journeys: the real agent runs, and records its own run
        from sc_api.domain import journey
        from sc_api.services.journey import events

        await events.publish(
            ctx, journey.Event(journey.STEP, {"type": journey.RUN_NOW, "client": c.id, "agent": agent_id}, c.id)
        )
    else:
        await record_run(ctx, client_id, agent_id, NOTHING_NEW)
    await audit.record(ctx, c.id, "agent.run", f"Ran the {a['name']} agent now for {c.name}", {"agent": agent_id})


async def set_all(ctx: Ctx, client_id: str, on: bool) -> None:
    """Pause or resume every agent; the approval step stays on."""
    ctx.require("clients.configure", "Your role can't pause or resume a client's agents.")
    c = await lock_client(ctx, client_id)
    gates = {a["id"] for a in ctx.ref.agents if a["gate"]}
    for row in (await ctx.session.execute(select(m.ClientAgent).where(m.ClientAgent.client_id == c.id))).scalars():
        if row.agent_id not in gates:
            row.on = on
    await audit.record(
        ctx,
        c.id,
        "agents.resume" if on else "agents.pause",
        f"Resumed every agent for {c.name}" if on else f"Paused every agent for {c.name}",
    )
