"""add experiencias column

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "candidates",
        sa.Column("experiencias", JSONB, nullable=True, server_default="[]"),
    )


def downgrade():
    op.drop_column("candidates", "experiencias")
