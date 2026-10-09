"""The platform's database: one PostgreSQL database, schema sc.

- Reference data (plans, agents, exits, connectors, roles and permissions, and the console's config and the
  showcase as documents) is loaded at migrate time from src/sc_api/reference/, generated from design3.
- People are users (one per person: their Firebase account, email, phone), with a staff membership for the console
  and client memberships for the workspaces.
- A client's settings live in typed columns, each fact once. The agents' settings that mirror them are written into
  the JSON the console reads by the presenter (services/presenter.py).
- The audit log is append-only: the app's role may only insert and read it, and triggers refuse the rest.
"""

import uuid
from datetime import date, datetime
from typing import Any, ClassVar

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Identity,
    Index,
    Integer,
    MetaData,
    Numeric,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy import text as sql
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from sc_api.db import SCHEMA

NAMING = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_N_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

TS = DateTime(timezone=True)
MONEY = Numeric(12, 2, asdecimal=False)


class Base(DeclarativeBase):
    metadata = MetaData(schema=SCHEMA, naming_convention=NAMING)
    type_annotation_map: ClassVar = {dict[str, Any]: JSONB, list[Any]: JSONB}


def seq() -> Mapped[int]:
    """insertion order, which the console lists things in"""
    return mapped_column(BigInteger, Identity(always=True), nullable=False, unique=True)


# --- reference data -----------------------------------------------------------------------------------------------


class Plan(Base):
    __tablename__ = "plans"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer)
    scope: Mapped[list[Any]] = mapped_column(JSONB)


class Agent(Base):
    __tablename__ = "agents"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    stage: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(Text)
    model: Mapped[str | None] = mapped_column(Text)
    job: Mapped[str] = mapped_column(Text)
    is_gate: Mapped[bool] = mapped_column(Boolean)
    position: Mapped[int] = mapped_column(Integer)


class Connector(Base):
    __tablename__ = "connectors"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(Text)
    note: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, CheckConstraint("status in ('ok','mock','soon')", name="status"))
    position: Mapped[int] = mapped_column(Integer)


class Exit(Base):
    __tablename__ = "exits"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer)


class Role(Base):
    """platform roles (console staff) and workspace access levels (a client's people)"""

    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("scope", "name"),)
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    # platform: console staff; workspace: a client's access levels; workspace-role: what a member does there (SC-66)
    scope: Mapped[str] = mapped_column(
        Text, CheckConstraint("scope in ('platform','workspace','workspace-role')", name="scope")
    )
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    team: Mapped[str | None] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer)


class Permission(Base):
    __tablename__ = "permissions"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    description: Mapped[str] = mapped_column(Text)


class RolePermission(Base):
    __tablename__ = "role_permissions"
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id: Mapped[str] = mapped_column(ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)


class Document(Base):
    """versioned JSON the API serves as it is: the console's config, the landing page's showcase"""

    __tablename__ = "documents"
    key: Mapped[str] = mapped_column(Text, primary_key=True)
    version: Mapped[str] = mapped_column(Text)
    value: Mapped[dict[str, Any]] = mapped_column(JSONB)
    updated_at: Mapped[datetime] = mapped_column(TS, server_default=func.now())


# --- people -------------------------------------------------------------------------------------------------------


class User(Base):
    """one person: their Firebase account, and how they are reached"""

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("email = lower(email)", name="email_lower"),
        CheckConstraint("phone_e164 ~ '^\\+[0-9]{8,15}$'", name="phone_e164"),
        CheckConstraint("password_state in ('default','own','none')", name="password_state"),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sql("gen_random_uuid()"))
    firebase_uid: Mapped[str | None] = mapped_column(Text, unique=True)
    email: Mapped[str | None] = mapped_column(Text, unique=True)
    phone_e164: Mapped[str | None] = mapped_column(Text, unique=True)
    password_state: Mapped[str] = mapped_column(Text, server_default="none")
    created_at: Mapped[datetime] = mapped_column(TS)
    last_sign_in_at: Mapped[datetime | None] = mapped_column(TS)


class StaffMember(Base):
    """a member of the platform's own staff, who signs in to the console"""

    __tablename__ = "staff_members"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    ref: Mapped[str] = mapped_column(Text, unique=True)
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id"))
    name: Mapped[str] = mapped_column(Text)
    short: Mapped[str] = mapped_column(Text)
    team: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, CheckConstraint("status in ('invited','active')", name="status"))
    invited_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    invited_at: Mapped[datetime] = mapped_column(TS)
    activated_at: Mapped[datetime | None] = mapped_column(TS)
    seq: Mapped[int] = seq()


class Client(Base):
    """a client: a manufacturer with its own workspace at <id>.<workspace domain>"""

    __tablename__ = "clients"
    __table_args__ = (
        CheckConstraint("status in ('setting-up','live')", name="status"),
        CheckConstraint("route in ('distributors','modern-trade','own')", name="route"),
        CheckConstraint("owner in ('distributor','manufacturer')", name="owner"),
        CheckConstraint("expiry in ('full-credit','price-support','none')", name="expiry"),
        CheckConstraint("gate_blinkit_days between 30 and 180", name="gate_blinkit_days"),
        CheckConstraint("gate_qcom_pct between 30 and 90", name="gate_qcom_pct"),
        CheckConstraint("return_window_days between 7 and 45", name="return_window_days"),
        CheckConstraint("staff_cap between 0 and 1000", name="staff_cap"),
        CheckConstraint("offer_window_hours between 1 and 168", name="offer_window_hours"),
        CheckConstraint("email_domain = lower(email_domain)", name="email_domain_lower"),
        ForeignKeyConstraint(
            ["id", "approver_ref"],
            ["client_members.client_id", "client_members.ref"],
            name="fk_clients_approver",
            deferrable=True,
            initially="DEFERRED",
            use_alter=True,
        ),
    )
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    short: Mapped[str] = mapped_column(Text)
    legal_name: Mapped[str] = mapped_column(Text)
    city: Mapped[str] = mapped_column(Text)
    industry: Mapped[str] = mapped_column(Text)
    domain: Mapped[str] = mapped_column(Text, unique=True)
    email_domain: Mapped[str] = mapped_column(Text)
    mark: Mapped[dict[str, Any]] = mapped_column(JSONB)
    plan_id: Mapped[str] = mapped_column(ForeignKey("plans.id"))
    status: Mapped[str] = mapped_column(Text)
    live_since: Mapped[date | None] = mapped_column(Date)
    region: Mapped[str] = mapped_column(Text)
    route: Mapped[str] = mapped_column(Text)
    owner: Mapped[str] = mapped_column(Text)
    expiry: Mapped[str] = mapped_column(Text)
    gate_blinkit_days: Mapped[int] = mapped_column(Integer)
    gate_qcom_pct: Mapped[int] = mapped_column(Integer)
    return_window_days: Mapped[int] = mapped_column(Integer)
    territory_guard: Mapped[bool] = mapped_column(Boolean)
    approver_ref: Mapped[str | None] = mapped_column(Text)
    staff_cap: Mapped[int] = mapped_column(Integer)
    offer_window_hours: Mapped[int] = mapped_column(Integer)
    hindi_offers: Mapped[bool] = mapped_column(Boolean)
    require_photo: Mapped[bool] = mapped_column(Boolean)
    sign_in: Mapped[list[Any]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(TS)
    # the journey clock (SC-66, domain/clock.py): journey time = anchor + wall time elapsed x 1440 / clock_speed
    day_minutes: Mapped[int] = mapped_column(Integer, server_default="1440")
    clock_speed: Mapped[int] = mapped_column(Integer, server_default="1440")
    clock_anchor_wall: Mapped[datetime | None] = mapped_column(TS)
    clock_anchor_journey: Mapped[datetime | None] = mapped_column(TS)
    journey_day0: Mapped[date | None] = mapped_column(Date)
    stream_seq: Mapped[int] = mapped_column(BigInteger, server_default="0")
    setup_mapped: Mapped[int] = mapped_column(Integer, server_default="0")
    setup_confirmed_at: Mapped[datetime | None] = mapped_column(TS)
    setup_confirmed_by: Mapped[str | None] = mapped_column(Text)
    last_import: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    last_watch: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    floors: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    approval_taps: Mapped[int] = mapped_column(Integer, server_default="10")
    disposal_per_unit: Mapped[float] = mapped_column(MONEY, server_default="1.5")
    epr_per_kg: Mapped[float] = mapped_column(MONEY, server_default="6")
    kirana_uplift: Mapped[float] = mapped_column(Numeric(6, 2, asdecimal=False), server_default="3.5")
    van_per_unit: Mapped[float] = mapped_column(MONEY, server_default="0.5")
    workspace_doc: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    seq: Mapped[int] = seq()


class ClientMember(Base):
    """a person in a client's workspace: its staff, its partners (distributors, kiranas, food banks) and, outside the
    workspace, its marketplace buyers"""

    __tablename__ = "client_members"
    __table_args__ = (
        UniqueConstraint("client_id", "user_id"),
        CheckConstraint("status in ('invited','active','deactivated')", name="status"),
        CheckConstraint("member_class in ('staff','partner','external')", name="member_class"),
    )
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), primary_key=True)
    ref: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(Text)
    org: Mapped[str] = mapped_column(Text)
    role_label: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(Text)
    access_role_id: Mapped[str] = mapped_column(ForeignKey("roles.id"))
    workspace_role: Mapped[str | None] = mapped_column(Text)
    member_class: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    img: Mapped[str | None] = mapped_column(Text)
    invited_at: Mapped[datetime] = mapped_column(TS)
    joined_at: Mapped[datetime | None] = mapped_column(TS)
    # what the member stands for in the workspace: a distributor's, kirana's, buyer's or food bank's id (SC-66)
    org_ref: Mapped[str | None] = mapped_column(Text)
    lang: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(Text)
    invited_by_name: Mapped[str | None] = mapped_column(Text)
    seq: Mapped[int] = seq()


class Invitation(Base):
    """each time someone was invited, or their invitation renewed (their account set back to the default password)"""

    __tablename__ = "invitations"
    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    client_id: Mapped[str | None] = mapped_column(ForeignKey("clients.id"))
    kind: Mapped[str] = mapped_column(Text, CheckConstraint("kind in ('staff','member')", name="kind"))
    created_at: Mapped[datetime] = mapped_column(TS)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    accepted_at: Mapped[datetime | None] = mapped_column(TS)


# --- a client's configuration -------------------------------------------------------------------------------------


class ClientExit(Base):
    __tablename__ = "client_exits"
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), primary_key=True)
    exit_id: Mapped[str] = mapped_column(ForeignKey("exits.id"), primary_key=True)
    on: Mapped[bool] = mapped_column(Boolean)


class ClientAgent(Base):
    __tablename__ = "client_agents"
    __table_args__ = (CheckConstraint("autonomy in ('suggest','ask','act','gate')", name="autonomy"),)
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), primary_key=True)
    agent_id: Mapped[str] = mapped_column(ForeignKey("agents.id"), primary_key=True)
    on: Mapped[bool] = mapped_column(Boolean)
    autonomy: Mapped[str] = mapped_column(Text)
    settings: Mapped[dict[str, Any]] = mapped_column(JSONB)
    last_run_at: Mapped[datetime | None] = mapped_column(TS)
    last_note: Mapped[str | None] = mapped_column(Text)
    next_note: Mapped[str | None] = mapped_column(Text)


class Distributor(Base):
    __tablename__ = "distributors"
    __table_args__ = (CheckConstraint("permission in ('given','not-yet')", name="permission"),)
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), primary_key=True)
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    city: Mapped[str] = mapped_column(Text)
    state: Mapped[str | None] = mapped_column(Text)
    kiranas: Mapped[int] = mapped_column(Integer)
    staff_cap: Mapped[int | None] = mapped_column(Integer)
    permission: Mapped[str] = mapped_column(Text)
    permission_given_at: Mapped[datetime | None] = mapped_column(TS)
    export_expected_at: Mapped[datetime | None] = mapped_column(TS)
    export_arrived_at: Mapped[datetime | None] = mapped_column(TS)
    short: Mapped[str | None] = mapped_column(Text)
    godown: Mapped[str | None] = mapped_column(Text)
    address: Mapped[str | None] = mapped_column(Text)
    gstin: Mapped[str | None] = mapped_column(Text)
    cluster: Mapped[str | None] = mapped_column(Text)
    territory: Mapped[str | None] = mapped_column(Text)
    pins: Mapped[str | None] = mapped_column(Text)
    # where its staff pay at a staff sale (SC-87)
    upi: Mapped[str | None] = mapped_column(Text)
    # the member who gave the permission, and whether he has paused it (the agents then act in his name no more)
    permission_by: Mapped[str | None] = mapped_column(Text)
    permission_paused: Mapped[bool] = mapped_column(Boolean, server_default=sql("false"))
    seq: Mapped[int] = seq()


class Sku(Base):
    """a product a client makes. Its quick-commerce gates are its own when set, else the client's default (SC-47)"""

    __tablename__ = "skus"
    __table_args__ = (
        CheckConstraint("mrp > 0", name="mrp"),
        CheckConstraint("gst >= 0 and gst < 1", name="gst"),
        CheckConstraint("life_days > 0", name="life_days"),
        CheckConstraint("gate_blinkit_days between 30 and 180", name="gate_blinkit_days"),
        CheckConstraint("gate_qcom_pct between 30 and 90", name="gate_qcom_pct"),
    )
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), primary_key=True)
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    brand: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    mrp: Mapped[float] = mapped_column(MONEY)
    gst: Mapped[float] = mapped_column(Numeric(5, 4, asdecimal=False))
    life_days: Mapped[int] = mapped_column(Integer)
    gate_blinkit_days: Mapped[int | None] = mapped_column(Integer)
    gate_qcom_pct: Mapped[int | None] = mapped_column(Integer)
    # its economics, for the money rules (SC-66)
    category: Mapped[str | None] = mapped_column(Text)
    hsn: Mapped[str | None] = mapped_column(Text)
    dp: Mapped[float | None] = mapped_column(MONEY)
    cost: Mapped[float | None] = mapped_column(MONEY)
    itc_per_unit: Mapped[float | None] = mapped_column(MONEY)
    per_carton: Mapped[int | None] = mapped_column(Integer)
    kg_per_unit: Mapped[float | None] = mapped_column(Numeric(8, 4, asdecimal=False))
    # the plastic packaging on a pack, in kg (SC-125)
    pack_kg: Mapped[float | None] = mapped_column(Numeric(8, 4, asdecimal=False))
    img: Mapped[str | None] = mapped_column(Text)
    seq: Mapped[int] = seq()


class ClientIntegration(Base):
    __tablename__ = "client_integrations"
    __table_args__ = (CheckConstraint("status in ('ok','mock','soon','waiting')", name="status"),)
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), primary_key=True)
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    note: Mapped[str] = mapped_column(Text)
    seq: Mapped[int] = seq()


# --- what happens -------------------------------------------------------------------------------------------------


class DemoRequest(Base):
    """Book a demo, from the landing page; the console sets a client up from it"""

    __tablename__ = "demo_requests"
    __table_args__ = (CheckConstraint("status in ('new','set up')", name="status"),)
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(TS)
    name: Mapped[str] = mapped_column(Text)
    company: Mapped[str] = mapped_column(Text)
    email: Mapped[str] = mapped_column(Text)
    makes: Mapped[str] = mapped_column(Text)
    plan: Mapped[str | None] = mapped_column(Text)  # a plan's name, as the landing page sends it
    note: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    client_id: Mapped[str | None] = mapped_column(ForeignKey("clients.id"))
    seq: Mapped[int] = seq()


class AgentRun(Base):
    __tablename__ = "agent_runs"
    __table_args__ = (Index(None, "ran_at"),)
    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"))
    agent_id: Mapped[str] = mapped_column(ForeignKey("agents.id"))
    ran_at: Mapped[datetime] = mapped_column(TS)
    text: Mapped[str] = mapped_column(Text)
    # a live agent's run (SC-66): the event it answered (unique, so a redelivery acts once), its trace and model
    run_id: Mapped[str | None] = mapped_column(Text, unique=True)
    event_key: Mapped[str | None] = mapped_column(Text, unique=True)
    case_id: Mapped[str | None] = mapped_column(Text)
    trace_id: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str | None] = mapped_column(Text)
    model: Mapped[str | None] = mapped_column(Text)
    fallback: Mapped[bool | None] = mapped_column(Boolean)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    corrected: Mapped[bool | None] = mapped_column(Boolean)


class Batch(Base):
    """a batch the agents work: open while it moves through the nine stages, closed with what it recovered.

    Its quick-commerce gates may be overridden for it alone, with the reason, who and when (SC-47); empty values keep
    its SKU's. When it closes, the gates it was judged by are kept (judged_*). Agents read every open batch's gates
    from the view sc.batch_gates. stage_at is when it reached the stop it is at (SC-49).
    """

    __tablename__ = "batches"
    __table_args__ = (
        CheckConstraint("stage_done between 0 and 9 and stage_current between 0 and 9", name="stages"),
        CheckConstraint("gate_blinkit_days between 7 and 180", name="gate_blinkit_days"),
        CheckConstraint("gate_qcom_pct between 5 and 90", name="gate_qcom_pct"),
        CheckConstraint(
            "(gate_blinkit_days is null and gate_qcom_pct is null) = (gate_reason is null)", name="gate_reason"
        ),
        ForeignKeyConstraint(["client_id", "sku_id"], ["skus.client_id", "skus.id"]),
        ForeignKeyConstraint(["client_id", "distributor_id"], ["distributors.client_id", "distributors.id"]),
        Index(
            "ix_batches_open_stage_at",
            "stage_current",
            sql("stage_at DESC"),
            postgresql_where=sql("closed_at IS NULL"),
        ),
    )
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), primary_key=True)
    ref: Mapped[str] = mapped_column(Text, primary_key=True)
    sku_id: Mapped[str] = mapped_column(Text)
    distributor_id: Mapped[str] = mapped_column(Text)
    units: Mapped[int] = mapped_column(Integer)
    stage_done: Mapped[int] = mapped_column(Integer)
    stage_current: Mapped[int] = mapped_column(Integer)
    note: Mapped[str | None] = mapped_column(Text)
    money: Mapped[float | None] = mapped_column(MONEY)
    split: Mapped[str | None] = mapped_column(Text)
    recovered: Mapped[float] = mapped_column(MONEY, server_default="0")
    opened_at: Mapped[datetime] = mapped_column(TS)
    # when it reached the stop it is at (SC-49): stamped as it opens, moves on and closes
    stage_at: Mapped[datetime] = mapped_column(TS)
    closed_at: Mapped[datetime | None] = mapped_column(TS)
    outcome: Mapped[str | None] = mapped_column(Text)
    best_before: Mapped[date | None] = mapped_column(Date)
    gate_blinkit_days: Mapped[int | None] = mapped_column(Integer)
    gate_qcom_pct: Mapped[int | None] = mapped_column(Integer)
    gate_reason: Mapped[str | None] = mapped_column(Text)
    gate_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    gate_by_name: Mapped[str | None] = mapped_column(Text)
    gate_at: Mapped[datetime | None] = mapped_column(TS)
    judged_blinkit_days: Mapped[int | None] = mapped_column(Integer)
    judged_qcom_pct: Mapped[int | None] = mapped_column(Integer)
    # from the stock export and the label (SC-66): when it was made, how fast it sells, where it sits
    mfg: Mapped[date | None] = mapped_column(Date)
    sell_per_day: Mapped[float | None] = mapped_column(Numeric(10, 2, asdecimal=False))
    shelf: Mapped[str | None] = mapped_column(Text)
    # a batch of the client's history (SC-123): Reset journey leaves it be
    history: Mapped[bool] = mapped_column(Boolean, server_default=sql("false"))
    seq: Mapped[int] = seq()


class AuditEntry(Base):
    """who changed what, and when: append-only"""

    __tablename__ = "audit_log"
    __table_args__ = (Index(None, "client_id", "id"),)
    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    at: Mapped[datetime] = mapped_column(TS)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    actor_name: Mapped[str] = mapped_column(Text)
    client_id: Mapped[str | None] = mapped_column(ForeignKey("clients.id"))
    action: Mapped[str] = mapped_column(Text)
    text: Mapped[str] = mapped_column(Text)
    details: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=sql("'{}'::jsonb"))


# --- the live workspace (SC-66) -----------------------------------------------------------------------------------


class Kirana(Base):
    """a shop on a distributor's beat: its pincode, and its own 14-day sales, which cap a scheme order"""

    __tablename__ = "kiranas"
    __table_args__ = (
        ForeignKeyConstraint(["client_id", "distributor_id"], ["distributors.client_id", "distributors.id"]),
    )
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), primary_key=True)
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    distributor_id: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    area: Mapped[str] = mapped_column(Text)
    pincode: Mapped[str] = mapped_column(Text)
    sales_14d: Mapped[int] = mapped_column(Integer)
    member_ref: Mapped[str | None] = mapped_column(Text)


class Partner(Base):
    """a buyer (the marketplace's) or a food bank the client works with; its details as the papers need them"""

    __tablename__ = "partners"
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), primary_key=True)
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    kind: Mapped[str] = mapped_column(Text, CheckConstraint("kind in ('buyer','foodbank')", name="kind"))
    name: Mapped[str] = mapped_column(Text)
    short: Mapped[str] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(Text)
    details: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=sql("'{}'::jsonb"))
    member_ref: Mapped[str | None] = mapped_column(Text)


class DocumentNumber(Base):
    """the next number of each kind of paper a client issues (invoice, credit note, listing)"""

    __tablename__ = "document_numbers"
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), primary_key=True)
    kind: Mapped[str] = mapped_column(Text, primary_key=True)
    prefix: Mapped[str] = mapped_column(Text)
    next: Mapped[int] = mapped_column(Integer)
    width: Mapped[int] = mapped_column(Integer)


class Case(Base):
    """one batch's journey, from the Watcher's flag to the report (domain/journey.py). Times are journey time; the
    *_wall ones are wall time"""

    __tablename__ = "cases"
    __table_args__ = (
        CheckConstraint("status in ('open','cleared','reset')", name="status"),
        ForeignKeyConstraint(["client_id", "batch_ref"], ["batches.client_id", "batches.ref"]),
        Index("uq_cases_open_batch", "client_id", "batch_ref", unique=True, postgresql_where=sql("status = 'open'")),
    )
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"))
    batch_ref: Mapped[str] = mapped_column(Text)
    sku_id: Mapped[str] = mapped_column(Text)
    distributor_id: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    phase: Mapped[str] = mapped_column(Text)
    stage: Mapped[int] = mapped_column(Integer)
    opened_at: Mapped[datetime] = mapped_column(TS)
    opened_wall: Mapped[datetime] = mapped_column(TS)
    closed_at: Mapped[datetime | None] = mapped_column(TS)
    assess: Mapped[dict[str, Any]] = mapped_column(JSONB)
    photo: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=sql("""'{"status":"none"}'::jsonb"""))
    valuation: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    plan: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    approval: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    listing: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    offer: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    award: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    truck: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    van: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    docs: Mapped[list[Any] | None] = mapped_column(JSONB)
    invoice_issued_at: Mapped[datetime | None] = mapped_column(TS)
    reviewed: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    ledger: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    donation: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    # the plan's staff sale at the distributor's godown, once approved (SC-86): open, then recorded with what sold
    staff: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    # expiry day (SC-94): every plan line not yet run then counts as done, with nothing taken
    expired_at: Mapped[datetime | None] = mapped_column(TS)
    # a case of the client's history (SC-123): in view whenever the journey starts again
    history: Mapped[bool] = mapped_column(Boolean, server_default=sql("false"))
    escalated: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    updated_wall: Mapped[datetime] = mapped_column(TS)
    seq: Mapped[int] = seq()


class CaseOrder(Base):
    __tablename__ = "case_orders"
    __table_args__ = (UniqueConstraint("case_id", "kirana_id"), CheckConstraint("units > 0", name="units"))
    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"))
    kirana_id: Mapped[str] = mapped_column(Text)
    units: Mapped[int] = mapped_column(Integer)
    at: Mapped[datetime] = mapped_column(TS)
    wall: Mapped[datetime] = mapped_column(TS)
    member_ref: Mapped[str | None] = mapped_column(Text)


class CaseBid(Base):
    __tablename__ = "case_bids"
    __table_args__ = (CheckConstraint("status in ('placed','countered','accepted','declined')", name="status"),)
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"))
    price: Mapped[float] = mapped_column(MONEY)
    at: Mapped[datetime] = mapped_column(TS)
    wall: Mapped[datetime] = mapped_column(TS)
    by_ref: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    counter: Mapped[float | None] = mapped_column(MONEY)
    answered_at: Mapped[datetime | None] = mapped_column(TS)
    seq: Mapped[int] = seq()


class CaseMessage(Base):
    __tablename__ = "case_messages"
    __table_args__ = (CheckConstraint("sender in ('buyer','agent')", name="sender"),)
    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"))
    sender: Mapped[str] = mapped_column(Text)
    text: Mapped[str] = mapped_column(Text)
    at: Mapped[datetime] = mapped_column(TS)
    wall: Mapped[datetime] = mapped_column(TS)
    by_ref: Mapped[str | None] = mapped_column(Text)
    answered: Mapped[bool] = mapped_column(Boolean, server_default=sql("false"))


class CasePhoto(Base):
    __tablename__ = "case_photos"
    __table_args__ = (CheckConstraint("status in ('uploading','sent','read','rejected')", name="status"),)
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"))
    object: Mapped[str] = mapped_column(Text)
    content_type: Mapped[str] = mapped_column(Text)
    bytes: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(Text)
    by_ref: Mapped[str] = mapped_column(Text)
    created_wall: Mapped[datetime] = mapped_column(TS)
    sent_at: Mapped[datetime | None] = mapped_column(TS)


class Timer(Base):
    """something due on journey time: an offer closing, an unsold lot closing, the report"""

    __tablename__ = "timers"
    __table_args__ = (Index("ix_timers_due", "due_wall", postgresql_where=sql("fired_wall IS NULL")),)
    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"))
    case_id: Mapped[str | None] = mapped_column(ForeignKey("cases.id"))
    kind: Mapped[str] = mapped_column(Text)
    due_at: Mapped[datetime] = mapped_column(TS)
    due_wall: Mapped[datetime] = mapped_column(TS)
    fired_wall: Mapped[datetime | None] = mapped_column(TS)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=sql("'{}'::jsonb"))


class FeedEvent(Base):
    """an entry in the agents' timeline: an agent's step or a person's, with the agent's tool calls"""

    __tablename__ = "feed_events"
    __table_args__ = (Index("ix_feed_events_case", "case_id", "id"),)
    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"))
    case_id: Mapped[str | None] = mapped_column(ForeignKey("cases.id"))
    key: Mapped[str] = mapped_column(Text)
    stage: Mapped[str] = mapped_column(Text)
    agent: Mapped[str | None] = mapped_column(Text)
    person: Mapped[str | None] = mapped_column(Text)
    icon: Mapped[str | None] = mapped_column(Text)
    at: Mapped[datetime] = mapped_column(TS)
    wall: Mapped[datetime] = mapped_column(TS)
    text: Mapped[str] = mapped_column(Text)
    calls: Mapped[list[Any]] = mapped_column(JSONB, server_default=sql("'[]'::jsonb"))
    human: Mapped[bool] = mapped_column(Boolean, server_default=sql("false"))


class Notification(Base):
    """an item in a member's inbox, and whether its push went out"""

    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint("push_status in ('none','pending','sent','failed')", name="push_status"),
        Index("ix_notifications_member", "client_id", "member_ref", "id"),
    )
    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"))
    member_ref: Mapped[str] = mapped_column(Text)
    case_id: Mapped[str | None] = mapped_column(ForeignKey("cases.id"))
    key: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text)
    en: Mapped[str | None] = mapped_column(Text)
    hindi: Mapped[bool] = mapped_column(Boolean, server_default=sql("false"))
    link: Mapped[str | None] = mapped_column(Text)
    at: Mapped[datetime] = mapped_column(TS)
    wall: Mapped[datetime] = mapped_column(TS)
    read_wall: Mapped[datetime | None] = mapped_column(TS)
    push_status: Mapped[str] = mapped_column(Text, server_default="pending")
    pushed_wall: Mapped[datetime | None] = mapped_column(TS)
    push_error: Mapped[str | None] = mapped_column(Text)


class StreamRow(Base):
    """what each member's live view hears, in one sequence per client (services/stream.py)"""

    __tablename__ = "stream"
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), primary_key=True)
    seq: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    kind: Mapped[str] = mapped_column(Text)
    ref: Mapped[str | None] = mapped_column(Text)
    audience: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    feed_id: Mapped[int | None] = mapped_column(ForeignKey("feed_events.id"))
    notification_id: Mapped[int | None] = mapped_column(ForeignKey("notifications.id"))
    wall: Mapped[datetime] = mapped_column(TS)


class Device(Base):
    """a member's browser registered for push (its FCM token)"""

    __tablename__ = "devices"
    __table_args__ = (Index("ix_devices_user", "user_id"),)
    token: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"))
    user_agent: Mapped[str] = mapped_column(Text)
    created_wall: Mapped[datetime] = mapped_column(TS)
    last_seen_wall: Mapped[datetime] = mapped_column(TS)


class IdempotencyKey(Base):
    """a member's change, by the key its request carried: a retry with the same key answers without acting again"""

    __tablename__ = "idempotency_keys"
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), primary_key=True)
    member_ref: Mapped[str] = mapped_column(Text, primary_key=True)
    key: Mapped[str] = mapped_column(Text, primary_key=True)
    route: Mapped[str] = mapped_column(Text)
    ref: Mapped[str | None] = mapped_column(Text)
    created_wall: Mapped[datetime] = mapped_column(TS)


class Outbox(Base):
    """a Pub/Sub message, written with the change that caused it and published once that change has committed"""

    __tablename__ = "outbox"
    __table_args__ = (Index("ix_outbox_pending", "id", postgresql_where=sql("published_wall IS NULL")),)
    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    topic: Mapped[str] = mapped_column(Text)
    ordering_key: Mapped[str] = mapped_column(Text, server_default="")
    attributes: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=sql("'{}'::jsonb"))
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_wall: Mapped[datetime] = mapped_column(TS)
    published_wall: Mapped[datetime | None] = mapped_column(TS)
    attempts: Mapped[int] = mapped_column(Integer, server_default="0")
    last_error: Mapped[str | None] = mapped_column(Text)
