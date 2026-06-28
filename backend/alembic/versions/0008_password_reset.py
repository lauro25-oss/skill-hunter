"""password reset tokens e admin settings

Revision ID: 0008
Revises: 0007
Create Date: 2026-06-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '0008'
down_revision = '0007'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "password_reset_tokens" not in tables:
        op.create_table(
            "password_reset_tokens",
            sa.Column("id", UUID(as_uuid=True), primary_key=True),
            sa.Column("token", sa.String(128), unique=True, nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("used", sa.Boolean(), nullable=False, server_default="false"),
        )
        op.create_index("ix_password_reset_tokens_token", "password_reset_tokens", ["token"])

    if "admin_settings" not in tables:
        op.create_table(
            "admin_settings",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("password_hash", sa.String(256), nullable=True),
        )


def downgrade():
    op.drop_table("password_reset_tokens")
    op.drop_table("admin_settings")
