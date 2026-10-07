"""idempotency keys (SC-73): a member's change carries a key, so a retry after a lost answer never acts twice; the tick
deletes keys older than a day.

A database that ran SC-73's own 0004 before this migration existed already has the table; it is made only where it is
missing.

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-07 23:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TS = sa.DateTime(timezone=True)
S = "sc"


def upgrade() -> None:
    if sa.inspect(op.get_bind()).has_table("idempotency_keys", schema=S):
        return
    op.create_table(
        "idempotency_keys",
        sa.Column("client_id", sa.Text(), sa.ForeignKey("sc.clients.id"), primary_key=True),
        sa.Column("member_ref", sa.Text(), primary_key=True),
        sa.Column("key", sa.Text(), primary_key=True),
        sa.Column("route", sa.Text(), nullable=False),
        sa.Column("ref", sa.Text(), nullable=True),
        sa.Column("created_wall", TS, nullable=False),
        schema=S,
    )
    op.create_index("ix_idempotency_keys_created", "idempotency_keys", ["created_wall"], schema=S)


def downgrade() -> None:
    op.drop_index("ix_idempotency_keys_created", "idempotency_keys", schema=S)
    op.drop_table("idempotency_keys", schema=S)
