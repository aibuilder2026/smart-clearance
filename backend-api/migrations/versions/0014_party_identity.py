"""every party's identity on its GST papers (SC-148): a distributor keeps his PAN, state code, FSSAI licence, e-mail and
bank (the tax invoice he issues names them) beside his GSTIN and address. Munchly's own identity is in its
workspace_doc, and the buyer's in its partner details, so neither needs a column.

Revision ID: 0014
Revises: 0013
Create Date: 2026-10-10 21:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0014"
down_revision: str | None = "0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "distributors",
        sa.Column("details", postgresql.JSONB(), server_default=sa.text("'{}'::jsonb"), nullable=False),
        schema="sc",
    )


def downgrade() -> None:
    op.drop_column("distributors", "details", schema="sc")
