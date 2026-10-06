"""quick-commerce gates per SKU, with a per-batch override (SC-47)

- skus gain their own gates; empty keeps the client's default.
- batches gain their best-before date, an override of either gate with its reason, who and when, and the gates they
  were judged by once closed.
- sc.batch_gates is what the agents read: every open batch's gates (its override, else its SKU's, else the client's
  default, value by value), where each came from, its days left in India's time, and pass or fail at Blinkit, Zepto
  and Instamart. Blinkit wants days left; Zepto and Instamart a share of the SKU's life left, passed when
  days x 100 >= share x life. The API applies the same rule (domain/gates.py), and a test holds the two together.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-06 18:40:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

VIEW = """
CREATE VIEW sc.batch_gates WITH (security_invoker = true) AS
WITH g AS (
  SELECT b.client_id, b.ref, b.sku_id, b.distributor_id, b.units, b.best_before, s.life_days,
         coalesce(b.gate_blinkit_days, s.gate_blinkit_days, c.gate_blinkit_days) AS blinkit_days,
         CASE WHEN b.gate_blinkit_days IS NOT NULL THEN 'override'
              WHEN s.gate_blinkit_days IS NOT NULL THEN 'sku' ELSE 'default' END AS blinkit_source,
         coalesce(b.gate_qcom_pct, s.gate_qcom_pct, c.gate_qcom_pct) AS qcom_pct,
         CASE WHEN b.gate_qcom_pct IS NOT NULL THEN 'override'
              WHEN s.gate_qcom_pct IS NOT NULL THEN 'sku' ELSE 'default' END AS qcom_source,
         b.best_before - (now() AT TIME ZONE 'Asia/Kolkata')::date AS days_left,
         b.gate_reason AS override_reason
    FROM sc.batches b
    JOIN sc.skus s ON s.client_id = b.client_id AND s.id = b.sku_id
    JOIN sc.clients c ON c.id = b.client_id
   WHERE b.closed_at IS NULL
)
SELECT client_id, ref, sku_id, distributor_id, units, best_before, life_days, days_left,
       floor(days_left * 100.0 / life_days)::int AS life_left_pct,
       blinkit_days, blinkit_source, days_left >= blinkit_days AS blinkit_pass,
       qcom_pct, qcom_source, days_left * 100 >= qcom_pct * life_days AS qcom_pass,
       override_reason
  FROM g
"""


def upgrade() -> None:
    op.add_column("skus", sa.Column("gate_blinkit_days", sa.Integer(), nullable=True), schema="sc")
    op.add_column("skus", sa.Column("gate_qcom_pct", sa.Integer(), nullable=True), schema="sc")
    op.create_check_constraint(
        op.f("ck_skus_gate_blinkit_days"), "skus", "gate_blinkit_days between 30 and 180", schema="sc"
    )
    op.create_check_constraint(op.f("ck_skus_gate_qcom_pct"), "skus", "gate_qcom_pct between 30 and 90", schema="sc")
    for name, kind in (
        ("best_before", sa.Date()),
        ("gate_blinkit_days", sa.Integer()),
        ("gate_qcom_pct", sa.Integer()),
        ("gate_reason", sa.Text()),
        ("gate_by_user_id", postgresql.UUID()),
        ("gate_by_name", sa.Text()),
        ("gate_at", sa.DateTime(timezone=True)),
        ("judged_blinkit_days", sa.Integer()),
        ("judged_qcom_pct", sa.Integer()),
    ):
        op.add_column("batches", sa.Column(name, kind, nullable=True), schema="sc")
    op.create_foreign_key(
        op.f("fk_batches_gate_by_user_id_users"),
        "batches",
        "users",
        ["gate_by_user_id"],
        ["id"],
        source_schema="sc",
        referent_schema="sc",
    )
    op.create_check_constraint(
        op.f("ck_batches_gate_blinkit_days"), "batches", "gate_blinkit_days between 7 and 180", schema="sc"
    )
    op.create_check_constraint(
        op.f("ck_batches_gate_qcom_pct"), "batches", "gate_qcom_pct between 5 and 90", schema="sc"
    )
    op.create_check_constraint(
        op.f("ck_batches_gate_reason"),
        "batches",
        "(gate_blinkit_days is null and gate_qcom_pct is null) = (gate_reason is null)",
        schema="sc",
    )
    op.execute(VIEW)
    # the agents' view: sc_app reads it, through its own rights on the tables (security_invoker)
    op.execute("GRANT SELECT ON sc.batch_gates TO sc_app")


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS sc.batch_gates")
    for name in ("gate_reason", "gate_qcom_pct", "gate_blinkit_days"):
        op.drop_constraint(op.f(f"ck_batches_{name}"), "batches", schema="sc", type_="check")
    op.drop_constraint(op.f("fk_batches_gate_by_user_id_users"), "batches", schema="sc", type_="foreignkey")
    for name in (
        "judged_qcom_pct",
        "judged_blinkit_days",
        "gate_at",
        "gate_by_name",
        "gate_by_user_id",
        "gate_reason",
        "gate_qcom_pct",
        "gate_blinkit_days",
        "best_before",
    ):
        op.drop_column("batches", name, schema="sc")
    for name in ("gate_qcom_pct", "gate_blinkit_days"):
        op.drop_constraint(op.f(f"ck_skus_{name}"), "skus", schema="sc", type_="check")
        op.drop_column("skus", name, schema="sc")
