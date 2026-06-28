"""add arquivo_s3_key to candidates

Revision ID: 0009
Revises: 0008
Create Date: 2026-06-28
"""
from alembic import op
import sqlalchemy as sa

revision = '0009'
down_revision = '0008'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = [c["name"] for c in inspector.get_columns("candidates")]

    if "arquivo_s3_key" not in cols:
        op.add_column(
            "candidates",
            sa.Column("arquivo_s3_key", sa.String(512), nullable=True),
        )


def downgrade():
    op.drop_column("candidates", "arquivo_s3_key")
