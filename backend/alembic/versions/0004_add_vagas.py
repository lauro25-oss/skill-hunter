"""add vagas table

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE TYPE vaga_status AS ENUM ('aberta', 'fechada', 'arquivada')")
    op.create_table(
        "vagas",
        sa.Column("id",        UUID(as_uuid=True), primary_key=True),
        sa.Column("titulo",    sa.String(255),      nullable=False),
        sa.Column("descricao", sa.Text(),           nullable=True),
        sa.Column("status",    sa.Enum("aberta", "fechada", "arquivada", name="vaga_status"),
                  nullable=False, server_default="aberta"),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("vagas")
    op.execute("DROP TYPE vaga_status")
