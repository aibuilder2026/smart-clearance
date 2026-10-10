"""the apps' addresses on Firebase Hosting's own domain (SC-150): a client's workspace moves from
<client>.smartclearance.com to <client>-smartclearance.web.app, and the platform's domain the workspace shows from
smartclearance.com to smartclearance.web.app. Staff email addresses are not addresses of the apps, and stay.

Revision ID: 0013
Revises: 0012
Create Date: 2026-10-10 18:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0013"
down_revision: str | None = "0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _move(old_sub: str, new_sub: str, old_platform: str, new_platform: str) -> None:
    op.get_bind().execute(
        sa.text("update sc.clients set domain = replace(domain, :old, :new) where domain like :like"),
        {"old": old_sub, "new": new_sub, "like": "%" + old_sub},
    )
    op.get_bind().execute(
        sa.text(
            "update sc.clients"
            " set workspace_doc = jsonb_set(workspace_doc, '{platform,domain}', to_jsonb(cast(:new as text)))"
            " where workspace_doc #>> '{platform,domain}' = :old"
        ),
        {"old": old_platform, "new": new_platform},
    )


def upgrade() -> None:
    _move(".smartclearance.com", "-smartclearance.web.app", "smartclearance.com", "smartclearance.web.app")


def downgrade() -> None:
    _move("-smartclearance.web.app", ".smartclearance.com", "smartclearance.web.app", "smartclearance.com")
