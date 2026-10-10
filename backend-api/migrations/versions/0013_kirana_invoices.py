"""each kirana order's tax invoice (SC-153): the distributor bills a shop's scheme order as it is booked, numbered in
his own sales series. The order keeps its invoice (its number, day and figures) and the PDF the Paperwork agent lays
out of it.

Revision ID: 0013
Revises: 0012
Create Date: 2026-10-11 09:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0013"
down_revision: str | None = "0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("case_orders", sa.Column("invoice", postgresql.JSONB(), nullable=True), schema="sc")


def downgrade() -> None:
    op.drop_column("case_orders", "invoice", schema="sc")
