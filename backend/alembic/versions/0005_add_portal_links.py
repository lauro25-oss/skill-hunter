"""add portal_links table

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "portal_links",
        sa.Column("id",          UUID(as_uuid=True), primary_key=True),
        sa.Column("token",       sa.String(64),  nullable=False, unique=True),
        sa.Column("label",       sa.String(255), nullable=False),
        sa.Column("vaga_origem", sa.String(255), nullable=True),
        sa.Column("ativo",       sa.Boolean(),   nullable=False, server_default="true"),
        sa.Column("criado_em",   sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_portal_links_token", "portal_links", ["token"])


def downgrade():
    op.drop_index("ix_portal_links_token", "portal_links")
    op.drop_table("portal_links")
