"""a case's expiry day (SC-94): when the journey was taken to its end as it stood, by Report now or the report's own
timer at best-before. Every plan line not yet run then counts as done, with nothing taken.

Revision ID: 0008
Revises: 0007
Create Date: 2026-10-08 21:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("cases", sa.Column("expired_at", sa.DateTime(timezone=True), nullable=True), schema="sc")


def downgrade() -> None:
    op.drop_column("cases", "expired_at", schema="sc")
