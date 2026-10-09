"""a client's history (SC-123): the batches it cleared before its journey began, built through the journey's own
steps. A history batch and its case stay in view whenever the journey starts again, and Reset journey leaves them be.

Revision ID: 0009
Revises: 0008
Create Date: 2026-10-09 16:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for table in ("cases", "batches"):
        op.add_column(table, sa.Column("history", sa.Boolean(), nullable=False, server_default=sa.false()), schema="sc")


def downgrade() -> None:
    for table in ("cases", "batches"):
        op.drop_column(table, "history", schema="sc")
