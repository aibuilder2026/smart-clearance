"""a SKU's plastic packaging, in kg a pack (SC-125): BRSR Principle 6's plastic packaging row counts it, going where its
pack goes. Fictional and indicative, from the story's SKUs.

Revision ID: 0010
Revises: 0009
Create Date: 2026-10-09 18:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("skus", sa.Column("pack_kg", sa.Numeric(8, 4, asdecimal=False)), schema="sc")


def downgrade() -> None:
    op.drop_column("skus", "pack_kg", schema="sc")
