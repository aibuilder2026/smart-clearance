"""packs destroyed at the distributor's godown (SC-139, route B): the client's expiry policy gains "godown", the client
keeps how it has them destroyed (Vision's check, the reviewer, the reminder, the GST gross-up, the agency's charge, the
authorised agencies), and a case keeps the destruction's evidence, Vision's checks and the operator's yes. The two
photos are case_photos rows like the label photo's.

Revision ID: 0011
Revises: 0010
Create Date: 2026-10-10 12:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(op.f("ck_clients_expiry"), "clients", schema="sc", type_="check")
    op.create_check_constraint(
        op.f("ck_clients_expiry"), "clients", "expiry in ('godown','full-credit','price-support','none')", schema="sc"
    )
    op.add_column("clients", sa.Column("destruction", postgresql.JSONB()), schema="sc")
    op.add_column("cases", sa.Column("destruction", postgresql.JSONB()), schema="sc")


def downgrade() -> None:
    op.drop_column("cases", "destruction", schema="sc")
    op.drop_column("clients", "destruction", schema="sc")
    op.execute("update sc.clients set expiry = 'full-credit' where expiry = 'godown'")
    op.drop_constraint(op.f("ck_clients_expiry"), "clients", schema="sc", type_="check")
    op.create_check_constraint(
        op.f("ck_clients_expiry"), "clients", "expiry in ('full-credit','price-support','none')", schema="sc"
    )
