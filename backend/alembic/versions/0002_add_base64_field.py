"""add arquivo_base64 column

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-27
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "candidates",
        sa.Column("arquivo_base64", sa.Text(), nullable=True),
    )


def downgrade():
    op.drop_column("candidates", "arquivo_base64")
