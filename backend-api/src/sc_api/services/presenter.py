"""How the console reads a client, its overview and its people: the contract's JSON, built from the database.

Each fact is stored once. Where the contract shows it twice (the client's gates and the Watcher's settings, its
approver and the Approval agent's, its staff-sale cap and the staff exit's), it is written into both places here.
"""

from datetime import date, datetime, time, timedelta
from typing import Any

from sqlalchemy import func, select

from sc_api import models as m
from sc_api.domain.clock import IST
from sc_api.domain.display import agent_last, day_month_year, hhmm, phone_display
from sc_api.domain.mirrors import MIRRORED
from sc_api.domain.rules import exits_for
from sc_api.errors import not_found
from sc_api.schemas import (
    AgentConfig,
    Attention,
    AttentionAction,
    ClientOut,
    ClientPerson,
    DistributorOut,
    ExitState,
    Gates,
    Integration,
    Mark,
    Overview,
    Profile,
    Rules,
    Run,
    SignInMethod,
    SkuGates,
    SkuOut,
    Track,
)
from sc_api.services.context import Ctx

ACCESS = {"approver": "Approver", "admin": "Admin", "member": "Member", "partner": "Partner"}


def profile_of(c: m.Client) -> dict[str, str]:
    return {"route": c.route, "owner": c.owner, "expiry": c.expiry}


def mirrored_settings(c: m.Client, agent_id: str, settings: dict[str, Any]) -> dict[str, Any]:
    """an agent's settings with the client's own facts written in"""
    return {**settings, **{key: getattr(c, column) for key, column in MIRRORED.get(agent_id, {}).items()}}


def exit_states(c: m.Client, on: dict[str, bool]) -> dict[str, ExitState]:
    derived = exits_for(profile_of(c), c.staff_cap)
    out: dict[str, ExitState] = {}
    for exit_id, d in derived.items():
        state = ExitState(on=on.get(exit_id, d["on"]))
        if "cap" in d:
            state.cap = c.staff_cap
        if "locked" in d:
            state.locked = d["locked"]
        out[exit_id] = state
    return out


async def lock_client(ctx: Ctx, client_id: str) -> m.Client:
    """a client, locked for the rest of the transaction so a change and its audit line see one state"""
    c = (
        await ctx.session.execute(select(m.Client).where(m.Client.id == client_id).with_for_update())
    ).scalar_one_or_none()
    if c is None:
        raise not_found("client")
    return c


async def agent_rows(ctx: Ctx, client_id: str) -> dict[str, m.ClientAgent]:
    rows = (await ctx.session.execute(select(m.ClientAgent).where(m.ClientAgent.client_id == client_id))).scalars()
    return {r.agent_id: r for r in rows}


async def people(ctx: Ctx, client_id: str, *, include_external: bool = False) -> list[tuple[m.ClientMember, m.User]]:
    q = (
        select(m.ClientMember, m.User)
        .join(m.User, m.User.id == m.ClientMember.user_id)
        .where(m.ClientMember.client_id == client_id)
        .order_by(m.ClientMember.seq)
    )
    if not include_external:
        q = q.where(m.ClientMember.member_class != "external")
    return [(cm, u) for cm, u in (await ctx.session.execute(q)).all()]


def person_out(cm: m.ClientMember, u: m.User) -> ClientPerson:
    return ClientPerson(
        id=cm.ref,
        name=cm.name,
        org=cm.org,
        role=cm.role_label,
        kind=cm.kind,
        access=ACCESS[cm.access_role_id],
        provider=cm.provider,
        status=cm.status,
        img=cm.img,
        email=u.email or "",
        phone=phone_display(u.phone_e164),
    )


def sku_gates(x: m.Sku) -> SkuGates:
    """an SKU's own gates: each value it has, the rest left out for the client's default"""
    own = (("blinkit_days", x.gate_blinkit_days), ("qcom_pct", x.gate_qcom_pct))
    return SkuGates(**{k: v for k, v in own if v is not None})


async def client_out(ctx: Ctx, client_id: str) -> ClientOut:
    c = await ctx.session.get(m.Client, client_id, populate_existing=True)
    if c is None:
        raise not_found("client")
    s = ctx.session
    today = ctx.clock.today()
    agents = await agent_rows(ctx, client_id)
    exits_on = {
        r.exit_id: r.on
        for r in (await s.execute(select(m.ClientExit).where(m.ClientExit.client_id == client_id))).scalars()
    }
    distributors = (
        await s.execute(select(m.Distributor).where(m.Distributor.client_id == client_id).order_by(m.Distributor.seq))
    ).scalars()
    skus = (await s.execute(select(m.Sku).where(m.Sku.client_id == client_id).order_by(m.Sku.seq))).scalars()
    integrations = (
        await s.execute(
            select(m.ClientIntegration)
            .where(m.ClientIntegration.client_id == client_id)
            .order_by(m.ClientIntegration.seq)
        )
    ).scalars()
    count, recovered = (
        await s.execute(
            select(func.count(), func.coalesce(func.sum(m.Batch.recovered), 0)).where(m.Batch.client_id == client_id)
        )
    ).one()
    agent_json: dict[str, AgentConfig] = {}
    for a in ctx.ref.agents:
        row = agents.get(a["id"])
        if row is None:
            continue
        agent_json[a["id"]] = AgentConfig(
            on=row.on,
            autonomy=row.autonomy,
            settings=mirrored_settings(c, a["id"], row.settings),
            last=agent_last(row.last_run_at, row.last_note, today),
            next=row.next_note,
        )
    lister = agent_json.get("lister")
    negotiator = agent_json.get("negotiator")
    outreach = agent_json.get("outreach")
    d = ctx.ref.defaults
    rules = Rules(
        reserve=float(lister.settings["reserve"]) if lister else d["reserve"],
        scheme=str(outreach.settings["scheme"]) if outreach else d["scheme"],
        staff_cap=c.staff_cap,
        token_pct=int(negotiator.settings["tokenPct"]) if negotiator else d["tokenPct"],
        offer_window_hours=c.offer_window_hours,
        hindi_offers=c.hindi_offers,
        require_photo=c.require_photo,
    )
    return ClientOut(
        id=c.id,
        name=c.name,
        legal=c.legal_name,
        city=c.city,
        industry=c.industry,
        domain=c.domain,
        email_domain=c.email_domain,
        mark=Mark.model_validate(c.mark),
        plan=c.plan_id,
        status=c.status,
        since=day_month_year(c.live_since) if c.live_since else None,
        region=c.region,
        profile=Profile.model_validate(profile_of(c)),
        gates=Gates(blinkit_days=c.gate_blinkit_days, qcom_pct=c.gate_qcom_pct),
        territory_guard=c.territory_guard,
        return_window_days=c.return_window_days,
        exits=exit_states(c, exits_on),
        rules=rules,
        sign_in=[SignInMethod.model_validate(x) for x in c.sign_in],
        distributors=[
            DistributorOut(
                id=x.id,
                name=x.name,
                city=x.city,
                kiranas=x.kiranas,
                staff_cap=x.staff_cap,
                permission=x.permission,
                **({"state": x.state} if x.state else {}),
            )
            for x in distributors
        ],
        skus=[
            SkuOut(
                id=x.id,
                code=x.code,
                brand=x.brand,
                name=x.name,
                mrp=x.mrp,
                gst=x.gst,
                life_days=x.life_days,
                gates=sku_gates(x),
            )
            for x in skus
        ],
        people=[person_out(cm, u) for cm, u in await people(ctx, client_id)],
        integrations=[
            Integration(id=x.id, name=x.name, kind=x.kind, status=x.status, note=x.note) for x in integrations
        ],
        recovered=float(recovered),
        batches=int(count),
        approver=c.approver_ref,
        agents=agent_json,
    )


async def client_ids(ctx: Ctx) -> list[str]:
    return list((await ctx.session.execute(select(m.Client.id).order_by(m.Client.seq))).scalars())


async def overview(ctx: Ctx) -> Overview:
    s = ctx.session
    today = ctx.clock.today()
    tracks = [
        Track(
            client=b.client_id,
            batch=b.ref,
            product=sku.name,
            distributor=dist.name,
            city=dist.city,
            done=b.stage_done,
            current=b.stage_current,
            **{k: v for k, v in (("note", b.note), ("money", b.money), ("split", b.split)) if v is not None},
        )
        for b, sku, dist in (
            await s.execute(
                select(m.Batch, m.Sku, m.Distributor)
                .join(m.Sku, (m.Sku.client_id == m.Batch.client_id) & (m.Sku.id == m.Batch.sku_id))
                .join(
                    m.Distributor,
                    (m.Distributor.client_id == m.Batch.client_id) & (m.Distributor.id == m.Batch.distributor_id),
                )
                # on the move: past the Watcher's Detect, where every batch it sees starts
                .where(m.Batch.closed_at.is_(None), m.Batch.stage_current >= 2)
                .order_by(m.Batch.seq)
            )
        ).all()
    ]
    day_start = datetime.combine(today, time(0), IST)
    runs = [
        Run(at=hhmm(r.ran_at), agent=r.agent_id, client=r.client_id, text=r.text)
        for r in (
            await s.execute(
                select(m.AgentRun)
                .where(m.AgentRun.ran_at >= day_start, m.AgentRun.ran_at < day_start + timedelta(days=1))
                .order_by(m.AgentRun.ran_at.desc(), m.AgentRun.id.desc())
            )
        ).scalars()
    ]
    attention: list[Attention] = []
    for c in (await s.execute(select(m.Client).order_by(m.Client.seq))).scalars():
        for d in (
            await s.execute(
                select(m.Distributor)
                .where(m.Distributor.client_id == c.id, m.Distributor.permission != "given")
                .order_by(m.Distributor.seq)
            )
        ).scalars():
            attention.append(
                Attention(
                    id=f"{c.id}-{d.id}",
                    client=c.id,
                    icon="hand",
                    tone="amber",
                    title=d.name,
                    text="one-time permission not given yet",
                    action=AttentionAction(kind="remind", distributor=d.id, label="Ask again"),
                )
            )
        admin = next((cm for cm, _ in await people(ctx, c.id) if cm.access_role_id == "admin"), None)
        if c.status != "live" and (admin is None or admin.status == "invited"):
            attention.append(
                Attention(
                    id=f"{c.id}-invite",
                    client=c.id,
                    icon="user-plus",
                    tone="amber",
                    title=c.name,
                    text=f"waiting for {admin.name if admin else 'its admin'} to accept the invitation",
                    action=AttentionAction(kind="open", tab="people", label="Open"),
                )
            )
        for d in (
            await s.execute(
                select(m.Distributor)
                .where(
                    m.Distributor.client_id == c.id,
                    m.Distributor.export_arrived_at.is_not(None),
                    m.Distributor.export_expected_at.is_not(None),
                )
                .order_by(m.Distributor.seq)
            )
        ).scalars():
            assert d.export_arrived_at and d.export_expected_at
            late = d.export_arrived_at - d.export_expected_at
            hours = int(late.total_seconds() // 3600)
            if _ist_date(d.export_arrived_at) == today and hours >= 1:
                attention.append(
                    Attention(
                        id=f"{c.id}-{d.id}-export",
                        client=c.id,
                        icon="file-spreadsheet",
                        tone="blue",
                        title=d.name,
                        text=f"stock export arrived {hours} h late today",
                        action=AttentionAction(kind="open", tab="supply", label="Open"),
                    )
                )
    return Overview(tracks=tracks, runs=runs, attention=attention)


def _ist_date(at: datetime) -> date:
    return at.astimezone(IST).date()
