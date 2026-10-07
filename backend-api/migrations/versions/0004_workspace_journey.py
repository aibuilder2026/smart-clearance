"""the workspace's live journey (SC-66): Munchly's world, each batch's case, the client's clock, and the stream

- The world: SKU economics, distributors' details and their permission's pause, batches' manufacturing dates and
  sell-through, the shops on each distributor's beat (kiranas), the buyer and food banks (partners), document numbers,
  and the client's money rules (floors, the van, disposal, EPR, the kirana uplift, approval taps).
- The clock: a client's journey time runs anchor + wall time elapsed x (1440 / speed) minutes a day. `day_minutes` is
  the console's setting (1 to 1440; 1440 is real time); `clock_speed` is what runs now (the setting while a case is
  open, else real time). Every change of speed re-anchors at the moment, so journey time never jumps.
- A case is one batch's journey, from the Watcher's flag to the report: its phase, the photo, the valuation, the plan,
  the approval, the listing, the offer, the award, dispatches, documents, the shelf check, the ledger. Orders, bids,
  chat messages and photos are rows of their own. Timers fire on journey time.
- The stream: what each member's live view hears, in one per-client sequence (stream rows point at the feed entry or
  notification they carry). Postgres NOTIFY on `sc_stream` wakes the API's listeners when a change commits.
- The outbox: each change's Pub/Sub messages, written in its transaction and published after it commits.
- Devices: members' FCM tokens. Agent runs gain the run's id, the event it answered, its trace, model and status.
- Nothing in a journey is deleted: a reset closes a case and opens another. Only devices (a member unregistering) and
  published outbox rows may be.

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-07 20:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TS = sa.DateTime(timezone=True)
MONEY = sa.Numeric(12, 2)
JSONB = postgresql.JSONB()
S = "sc"

# the journey's tables: the API reads and adds to them, and updates a case as it moves; it never deletes
APPEND = ("cases", "case_orders", "case_bids", "case_messages", "case_photos", "timers", "feed_events", "notifications")


def _col(table: str, name: str, kind, **kw) -> None:
    op.add_column(table, sa.Column(name, kind, **kw), schema=S)


def upgrade() -> None:
    # --- the world ------------------------------------------------------------------------------------------------
    for name, kind in (
        ("category", sa.Text()),
        ("hsn", sa.Text()),
        ("dp", MONEY),
        ("cost", MONEY),
        ("itc_per_unit", MONEY),
        ("per_carton", sa.Integer()),
        ("kg_per_unit", sa.Numeric(8, 4)),
        ("img", sa.Text()),
    ):
        _col("skus", name, kind, nullable=True)

    for name, kind in (
        ("short", sa.Text()),
        ("godown", sa.Text()),
        ("address", sa.Text()),
        ("gstin", sa.Text()),
        ("cluster", sa.Text()),
        ("territory", sa.Text()),
        ("pins", sa.Text()),
        ("permission_by", sa.Text()),
    ):
        _col("distributors", name, kind, nullable=True)
    _col("distributors", "permission_paused", sa.Boolean(), nullable=False, server_default=sa.false())

    _col("batches", "mfg", sa.Date(), nullable=True)
    _col("batches", "sell_per_day", sa.Numeric(10, 2), nullable=True)
    _col("batches", "shelf", sa.Text(), nullable=True)

    for name, kind in (
        ("org_ref", sa.Text()),
        ("lang", sa.Text()),
        ("city", sa.Text()),
        ("invited_by_name", sa.Text()),
    ):
        _col("client_members", name, kind, nullable=True)

    _col("clients", "day_minutes", sa.Integer(), nullable=False, server_default="1440")
    _col("clients", "clock_speed", sa.Integer(), nullable=False, server_default="1440")
    _col("clients", "clock_anchor_wall", TS, nullable=True)
    _col("clients", "clock_anchor_journey", TS, nullable=True)
    _col("clients", "journey_day0", sa.Date(), nullable=True)
    _col("clients", "stream_seq", sa.BigInteger(), nullable=False, server_default="0")
    _col("clients", "setup_mapped", sa.Integer(), nullable=False, server_default="0")
    _col("clients", "setup_confirmed_at", TS, nullable=True)
    _col("clients", "setup_confirmed_by", sa.Text(), nullable=True)
    _col("clients", "last_import", JSONB, nullable=True)
    _col("clients", "last_watch", JSONB, nullable=True)
    # the client's money rules that had no column yet (the rest are columns or agent settings: domain/mirrors.py)
    _col("clients", "floors", JSONB, nullable=True)
    _col("clients", "approval_taps", sa.Integer(), nullable=False, server_default="10")
    _col("clients", "disposal_per_unit", MONEY, nullable=False, server_default="1.5")
    _col("clients", "epr_per_kg", MONEY, nullable=False, server_default="6")
    _col("clients", "kirana_uplift", sa.Numeric(6, 2), nullable=False, server_default="3.5")
    _col("clients", "van_per_unit", MONEY, nullable=False, server_default="0.5")
    # the workspace's own words: the profile cards, the setup's guardrails, who signs in where
    _col("clients", "workspace_doc", JSONB, nullable=True)
    op.create_check_constraint(op.f("ck_clients_day_minutes"), "clients", "day_minutes between 1 and 1440", schema=S)
    op.create_check_constraint(op.f("ck_clients_clock_speed"), "clients", "clock_speed between 1 and 1440", schema=S)

    # workspace roles (operator, distributor, retailer …) carry the workspace's permissions, beside the access levels
    op.create_check_constraint(
        op.f("ck_roles_scope"), "roles", "scope in ('platform','workspace','workspace-role')", schema=S
    )

    op.create_table(
        "kiranas",
        sa.Column("client_id", sa.Text(), sa.ForeignKey("sc.clients.id"), primary_key=True),
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("distributor_id", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("area", sa.Text(), nullable=False),
        sa.Column("pincode", sa.Text(), nullable=False),
        sa.Column("sales_14d", sa.Integer(), nullable=False),
        sa.Column("member_ref", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["client_id", "distributor_id"], ["sc.distributors.client_id", "sc.distributors.id"]),
        schema=S,
    )
    op.create_table(
        "partners",
        sa.Column("client_id", sa.Text(), sa.ForeignKey("sc.clients.id"), primary_key=True),
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("kind", sa.Text(), sa.CheckConstraint("kind in ('buyer','foodbank')", name="kind"), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("short", sa.Text(), nullable=False),
        sa.Column("city", sa.Text(), nullable=True),
        sa.Column("details", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("member_ref", sa.Text(), nullable=True),
        schema=S,
    )
    op.create_table(
        "document_numbers",
        sa.Column("client_id", sa.Text(), sa.ForeignKey("sc.clients.id"), primary_key=True),
        sa.Column("kind", sa.Text(), primary_key=True),
        sa.Column("prefix", sa.Text(), nullable=False),
        sa.Column("next", sa.Integer(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        schema=S,
    )

    # --- the journey ----------------------------------------------------------------------------------------------
    op.create_table(
        "cases",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("client_id", sa.Text(), sa.ForeignKey("sc.clients.id"), nullable=False),
        sa.Column("batch_ref", sa.Text(), nullable=False),
        sa.Column("sku_id", sa.Text(), nullable=False),
        sa.Column("distributor_id", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Text(),
            sa.CheckConstraint("status in ('open','cleared','reset')", name="status"),
            nullable=False,
        ),
        sa.Column("phase", sa.Text(), nullable=False),
        sa.Column("stage", sa.Integer(), nullable=False),
        sa.Column("opened_at", TS, nullable=False),
        sa.Column("opened_wall", TS, nullable=False),
        sa.Column("closed_at", TS, nullable=True),
        sa.Column("assess", JSONB, nullable=False),
        sa.Column("photo", JSONB, nullable=False, server_default=sa.text("""'{"status":"none"}'::jsonb""")),
        sa.Column("valuation", JSONB, nullable=True),
        sa.Column("plan", JSONB, nullable=True),
        sa.Column("approval", JSONB, nullable=True),
        sa.Column("listing", JSONB, nullable=True),
        sa.Column("offer", JSONB, nullable=True),
        sa.Column("award", JSONB, nullable=True),
        sa.Column("truck", JSONB, nullable=True),
        sa.Column("van", JSONB, nullable=True),
        sa.Column("docs", JSONB, nullable=True),
        sa.Column("invoice_issued_at", TS, nullable=True),
        sa.Column("reviewed", JSONB, nullable=True),
        sa.Column("shelf", JSONB, nullable=True),
        sa.Column("ledger", JSONB, nullable=True),
        sa.Column("donation", JSONB, nullable=True),
        sa.Column("escalated", JSONB, nullable=True),
        sa.Column("updated_wall", TS, nullable=False),
        sa.Column("seq", sa.BigInteger(), sa.Identity(always=True), nullable=False, unique=True),
        sa.ForeignKeyConstraint(["client_id", "batch_ref"], ["sc.batches.client_id", "sc.batches.ref"]),
        schema=S,
    )
    op.create_index(
        "uq_cases_open_batch",
        "cases",
        ["client_id", "batch_ref"],
        unique=True,
        schema=S,
        postgresql_where=sa.text("status = 'open'"),
    )
    op.create_table(
        "case_orders",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), primary_key=True),
        sa.Column("case_id", sa.Text(), sa.ForeignKey("sc.cases.id"), nullable=False),
        sa.Column("kirana_id", sa.Text(), nullable=False),
        sa.Column("units", sa.Integer(), sa.CheckConstraint("units > 0", name="units"), nullable=False),
        sa.Column("at", TS, nullable=False),
        sa.Column("wall", TS, nullable=False),
        sa.Column("member_ref", sa.Text(), nullable=True),
        sa.UniqueConstraint("case_id", "kirana_id"),
        schema=S,
    )
    op.create_table(
        "case_bids",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("case_id", sa.Text(), sa.ForeignKey("sc.cases.id"), nullable=False),
        sa.Column("price", MONEY, nullable=False),
        sa.Column("at", TS, nullable=False),
        sa.Column("wall", TS, nullable=False),
        sa.Column("by_ref", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Text(),
            sa.CheckConstraint("status in ('placed','countered','accepted','declined')", name="status"),
            nullable=False,
        ),
        sa.Column("counter", MONEY, nullable=True),
        sa.Column("answered_at", TS, nullable=True),
        sa.Column("seq", sa.BigInteger(), sa.Identity(always=True), nullable=False, unique=True),
        schema=S,
    )
    op.create_table(
        "case_messages",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), primary_key=True),
        sa.Column("case_id", sa.Text(), sa.ForeignKey("sc.cases.id"), nullable=False),
        sa.Column(
            "sender", sa.Text(), sa.CheckConstraint("sender in ('buyer','agent')", name="sender"), nullable=False
        ),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("at", TS, nullable=False),
        sa.Column("wall", TS, nullable=False),
        sa.Column("by_ref", sa.Text(), nullable=True),
        sa.Column("answered", sa.Boolean(), nullable=False, server_default=sa.false()),
        schema=S,
    )
    op.create_table(
        "case_photos",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("case_id", sa.Text(), sa.ForeignKey("sc.cases.id"), nullable=False),
        sa.Column("object", sa.Text(), nullable=False),
        sa.Column("content_type", sa.Text(), nullable=False),
        sa.Column("bytes", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Text(),
            sa.CheckConstraint("status in ('uploading','sent','read','rejected')", name="status"),
            nullable=False,
        ),
        sa.Column("by_ref", sa.Text(), nullable=False),
        sa.Column("created_wall", TS, nullable=False),
        sa.Column("sent_at", TS, nullable=True),
        schema=S,
    )
    op.create_table(
        "timers",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), primary_key=True),
        sa.Column("client_id", sa.Text(), sa.ForeignKey("sc.clients.id"), nullable=False),
        sa.Column("case_id", sa.Text(), sa.ForeignKey("sc.cases.id"), nullable=True),
        sa.Column("kind", sa.Text(), nullable=False),
        sa.Column("due_at", TS, nullable=False),
        sa.Column("due_wall", TS, nullable=False),
        sa.Column("fired_wall", TS, nullable=True),
        sa.Column("payload", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        schema=S,
    )
    op.create_index("ix_timers_due", "timers", ["due_wall"], schema=S, postgresql_where=sa.text("fired_wall IS NULL"))

    # --- the stream -----------------------------------------------------------------------------------------------
    op.create_table(
        "feed_events",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), primary_key=True),
        sa.Column("client_id", sa.Text(), sa.ForeignKey("sc.clients.id"), nullable=False),
        sa.Column("case_id", sa.Text(), sa.ForeignKey("sc.cases.id"), nullable=True),
        sa.Column("key", sa.Text(), nullable=False),
        sa.Column("stage", sa.Text(), nullable=False),
        sa.Column("agent", sa.Text(), nullable=True),
        sa.Column("person", sa.Text(), nullable=True),
        sa.Column("icon", sa.Text(), nullable=True),
        sa.Column("at", TS, nullable=False),
        sa.Column("wall", TS, nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("calls", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("human", sa.Boolean(), nullable=False, server_default=sa.false()),
        schema=S,
    )
    op.create_index("ix_feed_events_case", "feed_events", ["case_id", "id"], schema=S)
    op.create_table(
        "notifications",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), primary_key=True),
        sa.Column("client_id", sa.Text(), sa.ForeignKey("sc.clients.id"), nullable=False),
        sa.Column("member_ref", sa.Text(), nullable=False),
        sa.Column("case_id", sa.Text(), sa.ForeignKey("sc.cases.id"), nullable=True),
        sa.Column("key", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("en", sa.Text(), nullable=True),
        sa.Column("hindi", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("link", sa.Text(), nullable=True),
        sa.Column("at", TS, nullable=False),
        sa.Column("wall", TS, nullable=False),
        sa.Column("read_wall", TS, nullable=True),
        sa.Column(
            "push_status",
            sa.Text(),
            sa.CheckConstraint("push_status in ('none','pending','sent','failed')", name="push_status"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("pushed_wall", TS, nullable=True),
        sa.Column("push_error", sa.Text(), nullable=True),
        schema=S,
    )
    op.create_index("ix_notifications_member", "notifications", ["client_id", "member_ref", "id"], schema=S)
    op.create_table(
        "stream",
        sa.Column("client_id", sa.Text(), sa.ForeignKey("sc.clients.id"), primary_key=True),
        sa.Column("seq", sa.BigInteger(), primary_key=True),
        sa.Column("kind", sa.Text(), nullable=False),
        sa.Column("ref", sa.Text(), nullable=True),
        # the members who hear it; null: everyone in the workspace
        sa.Column("audience", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("feed_id", sa.BigInteger(), sa.ForeignKey("sc.feed_events.id"), nullable=True),
        sa.Column("notification_id", sa.BigInteger(), sa.ForeignKey("sc.notifications.id"), nullable=True),
        sa.Column("wall", TS, nullable=False),
        schema=S,
    )
    op.create_table(
        "devices",
        sa.Column("token", sa.Text(), primary_key=True),
        sa.Column("user_id", postgresql.UUID(), sa.ForeignKey("sc.users.id"), nullable=False),
        sa.Column("client_id", sa.Text(), sa.ForeignKey("sc.clients.id"), nullable=False),
        sa.Column("user_agent", sa.Text(), nullable=False),
        sa.Column("created_wall", TS, nullable=False),
        sa.Column("last_seen_wall", TS, nullable=False),
        schema=S,
    )
    op.create_index("ix_devices_user", "devices", ["user_id"], schema=S)
    op.create_table(
        "outbox",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), primary_key=True),
        sa.Column("topic", sa.Text(), nullable=False),
        sa.Column("ordering_key", sa.Text(), nullable=False, server_default=""),
        sa.Column("attributes", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("payload", JSONB, nullable=False),
        sa.Column("created_wall", TS, nullable=False),
        sa.Column("published_wall", TS, nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=True),
        schema=S,
    )
    op.create_index("ix_outbox_pending", "outbox", ["id"], schema=S, postgresql_where=sa.text("published_wall IS NULL"))

    for name, kind in (
        ("run_id", sa.Text()),
        ("event_key", sa.Text()),
        ("case_id", sa.Text()),
        ("trace_id", sa.Text()),
        ("status", sa.Text()),
        ("model", sa.Text()),
        ("fallback", sa.Boolean()),
        ("latency_ms", sa.Integer()),
        ("corrected", sa.Boolean()),
    ):
        _col("agent_runs", name, kind, nullable=True)
    op.create_unique_constraint(op.f("uq_agent_runs_event_key"), "agent_runs", ["event_key"], schema=S)
    op.create_unique_constraint(op.f("uq_agent_runs_run_id"), "agent_runs", ["run_id"], schema=S)

    # --- privileges: the default privileges gave sc_app everything; take deletion back from the journey -------------
    op.execute(f"REVOKE DELETE, TRUNCATE ON {', '.join(f'{S}.{t}' for t in APPEND)} FROM sc_app")
    op.execute(f"REVOKE DELETE, TRUNCATE ON {S}.stream, {S}.kiranas, {S}.partners, {S}.document_numbers FROM sc_app")


def downgrade() -> None:
    op.drop_constraint(op.f("uq_agent_runs_run_id"), "agent_runs", schema=S, type_="unique")
    op.drop_constraint(op.f("uq_agent_runs_event_key"), "agent_runs", schema=S, type_="unique")
    for name in (
        "corrected",
        "latency_ms",
        "fallback",
        "model",
        "status",
        "trace_id",
        "case_id",
        "event_key",
        "run_id",
    ):
        op.drop_column("agent_runs", name, schema=S)
    for t in (
        "outbox",
        "devices",
        "stream",
        "notifications",
        "feed_events",
        "timers",
        "case_photos",
        "case_messages",
        "case_bids",
        "case_orders",
        "cases",
        "document_numbers",
        "partners",
        "kiranas",
    ):
        op.drop_table(t, schema=S)
    op.drop_constraint(op.f("ck_roles_scope"), "roles", schema=S, type_="check")
    op.drop_constraint(op.f("ck_clients_clock_speed"), "clients", schema=S, type_="check")
    op.drop_constraint(op.f("ck_clients_day_minutes"), "clients", schema=S, type_="check")
    for name in (
        "workspace_doc",
        "van_per_unit",
        "kirana_uplift",
        "epr_per_kg",
        "disposal_per_unit",
        "approval_taps",
        "floors",
        "last_watch",
        "last_import",
        "setup_confirmed_by",
        "setup_confirmed_at",
        "setup_mapped",
        "stream_seq",
        "journey_day0",
        "clock_anchor_journey",
        "clock_anchor_wall",
        "clock_speed",
        "day_minutes",
    ):
        op.drop_column("clients", name, schema=S)
    for name in ("invited_by_name", "city", "lang", "org_ref"):
        op.drop_column("client_members", name, schema=S)
    for name in ("shelf", "sell_per_day", "mfg"):
        op.drop_column("batches", name, schema=S)
    op.drop_column("distributors", "permission_paused", schema=S)
    for name in ("permission_by", "pins", "territory", "cluster", "gstin", "address", "godown", "short"):
        op.drop_column("distributors", name, schema=S)
    for name in ("img", "kg_per_unit", "per_carton", "itc_per_unit", "cost", "dp", "hsn", "category"):
        op.drop_column("skus", name, schema=S)
