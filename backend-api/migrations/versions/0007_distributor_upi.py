"""a distributor's UPI address (SC-87): where its staff pay at a staff sale, shown beside the sale's count on the
distributor's Today.

Revision ID: 0007
Revises: 0006
Create Date: 2026-10-08 19:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("distributors", sa.Column("upi", sa.Text(), nullable=True), schema="sc")


def downgrade() -> None:
    op.drop_column("distributors", "upi", schema="sc")
