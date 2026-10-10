"""the packs a closed batch destroyed (SC-149): what no channel took, destroyed at the distributor's godown or by the
client. The console's Overview counts the food closed batches kept out of landfill and destroyed, in kilos by each SKU's
kilos a pack. A batch a journey closed takes what its latest cleared case's ledger destroyed; any other batch closed
before this reads 0 until the next hydrate. An SKU without its kilos a pack takes them from the pack size its name ends
with ("Toor Dal 1 kg", "Lemon Drink 250 ml", "Rusk 4 x 75 g"; a millilitre as a gram), as synth.py's _kg reads it.

Revision ID: 0012
Revises: 0011
Create Date: 2026-10-10 20:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0012"
down_revision: str | None = "0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        r"""
        update sc.skus s set kg_per_unit = round(
            coalesce(x.m[1], '1')::numeric * x.m[2]::numeric / case when x.m[3] in ('kg', 'l') then 1 else 1000 end, 4)
        from (
            select client_id, id, regexp_match(lower(name), '(?:(\d+) x )?(\d+(?:\.\d+)?) (g|ml|kg|l)$') as m
            from sc.skus where kg_per_unit is null
        ) x
        where s.client_id = x.client_id and s.id = x.id and x.m is not null
        """
    )
    op.add_column("batches", sa.Column("destroyed", sa.Integer(), server_default="0", nullable=False), schema="sc")
    op.execute(
        """
        update sc.batches b set destroyed = least(b.units, x.gone)
        from (
            select distinct on (client_id, batch_ref) client_id, batch_ref,
                coalesce((ledger->>'destroyed')::numeric, 0)::int
                    + coalesce((ledger->>'atGodown')::numeric, 0)::int as gone
            from sc.cases
            where status = 'cleared' and ledger is not null
            order by client_id, batch_ref, closed_at desc nulls last
        ) x
        where b.client_id = x.client_id and b.ref = x.batch_ref and b.closed_at is not null
        """
    )
    op.create_check_constraint(op.f("ck_batches_destroyed"), "batches", "destroyed between 0 and units", schema="sc")


def downgrade() -> None:
    op.drop_constraint(op.f("ck_batches_destroyed"), "batches", schema="sc", type_="check")
    op.drop_column("batches", "destroyed", schema="sc")
