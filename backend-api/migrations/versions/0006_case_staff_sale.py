"""a case's staff sale (SC-86): the distributor sells the plan's staff-sale line at the godown and records what sold,
so a case keeps it beside its listing, offer and donation.

Revision ID: 0006
Revises: 0005
Create Date: 2026-10-08 17:45:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("cases", sa.Column("staff", JSONB(), nullable=True), schema="sc")


def downgrade() -> None:
    op.drop_column("cases", "staff", schema="sc")
