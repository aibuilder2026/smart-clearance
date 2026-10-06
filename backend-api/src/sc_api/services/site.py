"""The landing page's calls: the catalog and showcase it tells its story with, Find your workspace, and Book a demo."""

from sqlalchemy import select

from sc_api import models as m
from sc_api.domain.display import request_at
from sc_api.domain.rules import digits, e164, is_email
from sc_api.errors import ApiError
from sc_api.schemas import (
    AgentDef,
    Catalog,
    ConnectorDef,
    DemoRequest,
    DemoRequestInput,
    Mark,
    PlanTier,
    WorkspaceMatch,
    WorkspaceSummary,
)
from sc_api.services.context import Ctx


async def catalog(ctx: Ctx) -> Catalog:
    connectors = (await ctx.session.execute(select(m.Connector).order_by(m.Connector.position))).scalars()
    return Catalog(
        agents=[
            AgentDef(
                **{k: v for k, v in a.items() if k != "model" or v is not None},
            )
            for a in ctx.ref.agents
        ],
        connectors=[
            ConnectorDef(id=c.id, name=c.name, kind=c.kind, icon=c.icon, note=c.note, status=c.status)
            for c in connectors
        ],
        plans=[PlanTier(**p) for p in ctx.ref.plans],
    )


async def document(ctx: Ctx, key: str) -> dict:
    return (await ctx.session.execute(select(m.Document.value).where(m.Document.key == key))).scalar_one()


def _summary(c: m.Client) -> WorkspaceSummary:
    return WorkspaceSummary(
        id=c.id,
        name=c.name,
        short=c.short,
        domain=c.domain,
        email_domain=c.email_domain,
        mark=Mark.model_validate(c.mark),
    )


async def lookup(ctx: Ctx, query: str) -> list[WorkspaceMatch]:
    """Find your workspace: the workspaces a person belongs to, or, for an address at a client's own domain, that
    client's. It names the workspace only, never the person's role or whether they were deactivated, and a
    marketplace buyer (outside every workspace) finds nothing."""
    t = query.strip()
    email = is_email(t)
    if not email and len(digits(t)) != 10:
        raise ApiError(422, "Enter an email address, or a 10-digit mobile number.")
    user_q = select(m.User.id).where(m.User.email == t.lower() if email else m.User.phone_e164 == e164(t))
    clients = (
        (
            await ctx.session.execute(
                select(m.Client)
                .join(m.ClientMember, m.ClientMember.client_id == m.Client.id)
                .where(m.ClientMember.user_id.in_(user_q), m.ClientMember.member_class != "external")
                .order_by(m.Client.seq)
            )
        )
        .scalars()
        .unique()
        .all()
    )
    if not clients and email:
        domain = t.lower().rsplit("@", 1)[1]
        clients = (
            (await ctx.session.execute(select(m.Client).where(m.Client.email_domain == domain).order_by(m.Client.seq)))
            .scalars()
            .all()
        )
    return [WorkspaceMatch(workspace=_summary(c), value=t) for c in clients]


def demo_request_errors(data: DemoRequestInput) -> dict[str, str]:
    e: dict[str, str] = {}
    if not data.name.strip():
        e["name"] = "Enter your name."
    if not data.company.strip():
        e["company"] = "Enter your company's name."
    if not is_email(data.email):
        e["email"] = "Enter a work email address, like name@company.in."
    return e


def _request_out(r: m.DemoRequest) -> DemoRequest:
    out = DemoRequest(
        id=r.id,
        at=request_at(r.created_at),
        name=r.name,
        company=r.company,
        email=r.email,
        makes=r.makes,
        plan=r.plan,
        note=r.note,
        status=r.status,
    )
    if r.client_id:
        out.client = r.client_id
    return out


async def request_demo(ctx: Ctx, data: DemoRequestInput) -> DemoRequest:
    fields = demo_request_errors(data)
    if fields:
        raise ApiError(422, "Check the highlighted fields.", fields)
    r = m.DemoRequest(
        id=ctx.ids.new("rq"),
        created_at=ctx.clock.now(),
        name=data.name.strip(),
        company=data.company.strip(),
        email=data.email.strip().lower(),
        makes=data.makes,
        plan=data.plan or None,
        note=data.note.strip(),
        status="new",
    )
    ctx.session.add(r)
    await ctx.session.flush()
    return _request_out(r)


async def demo_requests(ctx: Ctx) -> list[DemoRequest]:
    """newest first"""
    rows = (
        await ctx.session.execute(
            select(m.DemoRequest).order_by(m.DemoRequest.created_at.desc(), m.DemoRequest.seq.desc())
        )
    ).scalars()
    return [_request_out(r) for r in rows]
