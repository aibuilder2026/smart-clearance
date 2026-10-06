"""when each batch reached the stop it is at (SC-49)

- batches gain stage_at, stamped by the services whenever a batch opens, moves on or closes. Overview's Agents at work
  shows the latest batches to arrive at each stop first, and marks the ones that moved since the last reading.
- Existing rows take the closing time if closed, else the opening time.
- A partial index serves the open batches at each stop, the latest first.

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-06 23:10:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("batches", sa.Column("stage_at", sa.DateTime(timezone=True), nullable=True), schema="sc")
    op.execute("UPDATE sc.batches SET stage_at = coalesce(closed_at, opened_at)")
    op.alter_column("batches", "stage_at", nullable=False, schema="sc")
    op.create_index(
        op.f("ix_batches_open_stage_at"),
        "batches",
        ["stage_current", sa.text("stage_at DESC")],
        schema="sc",
        postgresql_where=sa.text("closed_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_batches_open_stage_at"), table_name="batches", schema="sc")
    op.drop_column("batches", "stage_at", schema="sc")
