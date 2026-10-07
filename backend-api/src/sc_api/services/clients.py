"""Clients: setting one up (the console's New client flow, or an import), its plan, going live, its supply-chain
profile, and its channels and rules. Every change writes its audit line, in the prototype's words."""

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain.clock import DAY_MINUTES
from sc_api.domain.mirrors import MIRRORED, RULES_FROM_AGENTS, stored
from sc_api.domain.rules import agent_defaults, exits_for, js_str, setup_errors
from sc_api.errors import ApiError
from sc_api.schemas import NewClientInput, ProfileInput, RulesInput
from sc_api.services import audit, people
from sc_api.services.context import Ctx
from sc_api.services.presenter import exit_states, lock_client, mirrored_settings, profile_of

RULE_LABEL = {
    "staffCap": "staff sale cap",
    "offerWindowHours": "offer window hours",
    "hindiOffers": "Hindi offers",
    "requirePhoto": "label photo first",
}


@dataclass
class ClientSpec:
    """a client as it is inserted: by the New client flow, or by an import (the hydrate CLI)"""

    id: str
    name: str
    city: str
    industry: str
    email_domain: str
    mark: dict[str, str]
    plan: str
    profile: dict[str, str]
    exits_on: dict[str, bool]
    sign_in: list[dict[str, Any]]
    short: str | None = None
    legal: str | None = None
    status: str = "setting-up"
    live_since: date | None = None
    region: str = "India"
    gates: dict[str, int] | None = None
    return_window_days: int | None = None
    territory_guard: bool = True
    staff_cap: int | None = None
    offer_window_hours: int | None = None
    hindi_offers: bool = True
    require_photo: bool = True
    day_minutes: int = DAY_MINUTES  # the length of a journey day (SC-68): a client starts in real time
    agents: dict[str, dict[str, Any]] = field(default_factory=dict)


def _profile_label(ctx: Ctx, profile: dict[str, str]) -> str:
    label = {q: ctx.ref.opt_label(q, profile[q]).lower() for q in ("route", "owner", "expiry")}
    return f"{label['route']}, {label['owner']} owns the stock, {label['expiry']}"


def _locked_on(profile: dict[str, str], exits: dict[str, bool], staff_cap: int) -> str | None:
    """the refusal for an exit switched on that the profile doesn't allow, if any"""
    for exit_id, d in exits_for(profile, staff_cap).items():
        if d.get("locked") and exits.get(exit_id):
            return str(d["locked"]) + "."
    return None


async def insert(ctx: Ctx, spec: ClientSpec, *, created_at: datetime | None = None) -> m.Client:
    d = ctx.ref.defaults
    c = m.Client(
        id=spec.id,
        name=spec.name,
        short=spec.short or spec.name.split(" ")[0],
        legal_name=spec.legal or spec.name,
        city=spec.city,
        industry=spec.industry,
        domain=f"{spec.id}.{ctx.settings.workspace_domain}",
        email_domain=spec.email_domain.lower(),
        mark=spec.mark,
        plan_id=spec.plan,
        status=spec.status,
        live_since=spec.live_since,
        region=spec.region,
        route=spec.profile["route"],
        owner=spec.profile["owner"],
        expiry=spec.profile["expiry"],
        gate_blinkit_days=(spec.gates or d["gates"])["blinkitDays"],
        gate_qcom_pct=(spec.gates or d["gates"])["qcomPct"],
        return_window_days=spec.return_window_days or d["returnWindowDays"],
        territory_guard=spec.territory_guard,
        approver_ref=None,
        staff_cap=spec.staff_cap if spec.staff_cap is not None else d["staffCap"],
        offer_window_hours=spec.offer_window_hours or d["offerWindowHours"],
        hindi_offers=spec.hindi_offers,
        require_photo=spec.require_photo,
        day_minutes=spec.day_minutes,
        sign_in=spec.sign_in,
        created_at=created_at or ctx.clock.now(),
    )
    ctx.session.add(c)
    await ctx.session.flush()
    derived = exits_for(spec.profile, c.staff_cap)
    for exit_def in ctx.ref.exits:
        on = (
            derived[exit_def["id"]]["on"]
            if derived[exit_def["id"]].get("locked")
            else spec.exits_on.get(exit_def["id"], derived[exit_def["id"]]["on"])
        )
        ctx.session.add(m.ClientExit(client_id=c.id, exit_id=exit_def["id"], on=on))
    for agent_id, cfg in spec.agents.items():
        ctx.session.add(
            m.ClientAgent(
                client_id=c.id,
                agent_id=agent_id,
                on=cfg["on"],
                autonomy=cfg["autonomy"],
                settings=stored(agent_id, cfg["settings"]),
                last_run_at=cfg.get("last_run_at"),
                last_note=cfg.get("last"),
                next_note=cfg.get("next"),
            )
        )
        for key, column in MIRRORED.get(agent_id, {}).items():
            if key in cfg["settings"] and column != "approver_ref":
                setattr(c, column, cfg["settings"][key])
    await ctx.session.flush()
    return c


async def _taken(ctx: Ctx, slug: str) -> bool:
    domain = f"{slug}.{ctx.settings.workspace_domain}"
    found = await ctx.session.execute(select(m.Client.id).where((m.Client.id == slug) | (m.Client.domain == domain)))
    return found.first() is not None


async def create(ctx: Ctx, data: NewClientInput) -> str:
    """The New client flow: the client, its workspace address, its exits and agents from its profile and preset, its
    admin invited (on the default password), and the demo request it came from marked set up."""
    ctx.require("clients.create", "Your role can't set up clients.")
    answers = data.model_dump(by_alias=True, mode="json")
    taken = await _taken(ctx, data.slug)
    problem = next((p for p in setup_errors(answers, lambda _: taken, ctx.settings.workspace_domain) if p), None)
    if problem:
        raise ApiError(422, problem)
    if not any(p["id"] == data.plan for p in ctx.ref.plans):
        raise ApiError(422, "Choose one of the plans.")
    profile = data.profile.model_dump()
    exits_on = {k: v.on for k, v in data.exits.items()}
    if problem := _locked_on(profile, exits_on, ctx.ref.defaults["staffCap"]):
        raise ApiError(422, problem)
    request = None
    if data.request:
        request = await ctx.session.get(m.DemoRequest, data.request, with_for_update=True)
        if request is None:
            raise ApiError(422, "That demo request is not there any more.")
        if request.status != "new":
            raise ApiError(422, f"{request.company}'s demo request has already been set up.")

    name = data.name.strip()
    domain = data.email_domain.strip().lower()
    admin_ref = f"admin-{data.slug}"
    agents = agent_defaults(data.preset, ctx.ref.agents, ctx.ref.defaults, admin_ref)
    for cfg in agents.values():
        cfg["last"], cfg["next"] = "not run yet", "after the first stock export"
    c = await insert(
        ctx,
        ClientSpec(
            id=data.slug,
            name=name,
            city=data.city.strip(),
            industry=data.industry,
            email_domain=domain,
            mark={"from": data.colour, "to": data.colour, "ink": "#ffffff"},
            plan=data.plan,
            profile=profile,
            exits_on=exits_on,
            sign_in=[
                {
                    "id": "google",
                    "title": "Google Workspace",
                    "who": f"{name} staff",
                    "rule": f"{domain} accounts only",
                    "on": data.sign_google,
                },
                {
                    "id": "phone",
                    "title": "Mobile number and a one-time code",
                    "who": "Distributors and kirana owners",
                    "rule": "Numbers the client or its distributors invite",
                    "on": data.sign_phone,
                },
            ],
            agents=agents,
        ),
    )
    admin = await people.add(
        ctx,
        c,
        people.MemberSpec(
            ref=admin_ref,
            name=data.admin_name.strip(),
            email=data.admin_email,
            org=name,
            role_label="Workspace admin",
            kind="Workspace admin",
            access="admin",
            member_class="staff",
            workspace_role="admin",
            provider=people.EMAIL_AND_PASSWORD,
            status="invited",
        ),
    )
    c.approver_ref = admin.ref
    if request is not None:
        request.status, request.client_id = "set up", c.id
    await audit.record(
        ctx,
        c.id,
        "client.create",
        f"Set up {name} from its supply-chain profile: {_profile_label(ctx, profile)}; invited {admin.name} as admin",
        {"request": data.request, "preset": data.preset, "plan": data.plan},
    )
    return c.id


async def set_plan(ctx: Ctx, client_id: str, plan: str) -> None:
    ctx.require("clients.commercial", "Only a Super admin can change a client's plan.")
    c = await lock_client(ctx, client_id)
    if not any(p["id"] == plan for p in ctx.ref.plans):
        raise ApiError(422, "Choose one of the plans.", {"plan": "Choose one of the plans."})
    if plan == c.plan_id:
        return
    was = c.plan_id
    c.plan_id = plan
    await audit.record(
        ctx,
        c.id,
        "client.plan",
        f"Moved {c.name} from {ctx.ref.plan_name(was)} to {ctx.ref.plan_name(plan)}",
        {"from": was, "to": plan},
    )


async def go_live(ctx: Ctx, client_id: str) -> None:
    ctx.require("clients.commercial", "Only a Super admin can take a client live.")
    c = await lock_client(ctx, client_id)
    if c.status == "live":
        raise ApiError(422, f"{c.name} is already live.")
    c.status = "live"
    c.live_since = ctx.clock.today()
    await audit.record(ctx, c.id, "client.live", f"Moved {c.name} to Live on the {ctx.ref.plan_name(c.plan_id)} plan")


def _within(value: int, agent_id: str, key: str, ctx: Ctx, field_name: str) -> None:
    f = next(x for x in ctx.ref.fields(agent_id) if x["key"] == key)
    if not (f["min"] <= value <= f["max"]):
        message = f"{f['label']} {f['min']} to {f['max']} {f.get('unit', '')}".strip() + "."
        raise ApiError(422, message, {field_name: message})


async def save_profile(ctx: Ctx, client_id: str, data: ProfileInput) -> None:
    """The supply-chain profile: it re-derives the exits (keeping those switched off off), and sets the gates and the
    return window, which the Watcher and Impact agents work to."""
    ctx.require("clients.configure", "Your role can't change a client's supply-chain profile.")
    c = await lock_client(ctx, client_id)
    _within(data.gates.blinkit_days, "watcher", "blinkitDays", ctx, "gates")
    _within(data.gates.qcom_pct, "watcher", "qcomPct", ctx, "gates")
    _within(data.return_window_days, "impact", "returnWindowDays", ctx, "returnWindowDays")
    profile = data.profile.model_dump()
    rows = {
        r.exit_id: r
        for r in (await ctx.session.execute(select(m.ClientExit).where(m.ClientExit.client_id == c.id))).scalars()
    }
    for exit_id, d in exits_for(profile, c.staff_cap).items():
        row = rows.get(exit_id)
        on = d["on"] if d.get("locked") or row is None else row.on and d["on"]
        if row is None:
            ctx.session.add(m.ClientExit(client_id=c.id, exit_id=exit_id, on=on))
        else:
            row.on = on
    c.route, c.owner, c.expiry = profile["route"], profile["owner"], profile["expiry"]
    c.gate_blinkit_days, c.gate_qcom_pct = data.gates.blinkit_days, data.gates.qcom_pct
    c.return_window_days = data.return_window_days
    await audit.record(
        ctx,
        c.id,
        "client.profile",
        f"Changed {c.name}'s supply-chain profile: {_profile_label(ctx, profile)}",
        {
            "profile": profile,
            "gates": data.gates.model_dump(by_alias=True),
            "returnWindowDays": data.return_window_days,
        },
    )


async def save_rules(ctx: Ctx, client_id: str, data: RulesInput) -> None:
    """The channels (exits) and the rules. The reserve, token and scheme are the Lister's, Negotiator's and Outreach's
    settings: changed there, so they must come back as they are."""
    ctx.require("clients.configure", "Your role can't change a client's channels and rules.")
    c = await lock_client(ctx, client_id)
    rows = {
        r.exit_id: r
        for r in (await ctx.session.execute(select(m.ClientExit).where(m.ClientExit.client_id == c.id))).scalars()
    }
    sent_on = {k: v.on for k, v in data.exits.items()}
    if problem := _locked_on(profile_of(c), sent_on, c.staff_cap):
        raise ApiError(422, problem)
    final_on = {e["id"]: sent_on.get(e["id"], rows[e["id"]].on if e["id"] in rows else False) for e in ctx.ref.exits}
    if not any(final_on.values()):
        raise ApiError(422, "Keep at least one exit on.")
    agents = {
        r.agent_id: r
        for r in (await ctx.session.execute(select(m.ClientAgent).where(m.ClientAgent.client_id == c.id))).scalars()
    }
    rules = data.rules.model_dump(by_alias=True)
    for key, (agent_id, setting) in RULES_FROM_AGENTS.items():
        current = mirrored_settings(c, agent_id, agents[agent_id].settings).get(setting) if agent_id in agents else None
        if current is not None and rules[key] != current:
            agent = ctx.ref.agent(agent_id)
            message = f"Change the {key} on the {agent['name'] if agent else agent_id} agent."
            raise ApiError(422, message, {key: message})
    if not (0 <= data.rules.staff_cap <= 1000):
        raise ApiError(422, "A staff sale cap is 0 to 1,000 packs.", {"staffCap": "0 to 1,000 packs."})
    if not (1 <= data.rules.offer_window_hours <= 168):
        raise ApiError(422, "An offer window is 1 to 168 hours.", {"offerWindowHours": "1 to 168 hours."})

    current_exits = exit_states(c, {k: r.on for k, r in rows.items()})
    changes = [
        f"{e['name']} {'on' if final_on[e['id']] else 'off'}"
        for e in ctx.ref.exits
        if final_on[e["id"]] != current_exits[e["id"]].on
    ]
    current_rules = {
        "staffCap": c.staff_cap,
        "offerWindowHours": c.offer_window_hours,
        "hindiOffers": c.hindi_offers,
        "requirePhoto": c.require_photo,
    }
    for key, value in rules.items():
        if key in current_rules and value != current_rules[key]:
            shown = ("on" if value else "off") if isinstance(value, bool) else js_str(value)
            changes.append(f"{RULE_LABEL.get(key, key)} {shown}")
    if not changes:
        return
    for exit_id, on in final_on.items():
        if exit_id in rows:
            rows[exit_id].on = on
        else:
            ctx.session.add(m.ClientExit(client_id=c.id, exit_id=exit_id, on=on))
    c.staff_cap = data.rules.staff_cap
    c.offer_window_hours = data.rules.offer_window_hours
    c.hindi_offers = data.rules.hindi_offers
    c.require_photo = data.rules.require_photo
    await audit.record(
        ctx,
        c.id,
        "client.rules",
        f"Changed {c.name}'s channels and rules: {'; '.join(changes)}",
        {"exits": final_on, "rules": {k: rules[k] for k in current_rules}},
    )
