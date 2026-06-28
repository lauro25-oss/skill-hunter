"""lgpd: campo anonimizado em candidates

Revision ID: 0007
Revises: 0006
Create Date: 2026-06-28
"""
from alembic import op
import sqlalchemy as sa

revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = [c["name"] for c in inspector.get_columns("candidates")]

    if "anonimizado" not in cols:
        op.add_column(
            "candidates",
            sa.Column("anonimizado", sa.Boolean(), nullable=False, server_default="false"),
        )


def downgrade():
    op.drop_column("candidates", "anonimizado")
