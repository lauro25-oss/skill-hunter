"""add vaga requirements

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = [c["name"] for c in inspector.get_columns("vagas")]
    if "skills_obrigatorias" not in existing_cols:
        op.add_column('vagas', sa.Column('skills_obrigatorias', JSONB, nullable=False, server_default='[]'))
    if "anos_experiencia_min" not in existing_cols:
        op.add_column('vagas', sa.Column('anos_experiencia_min', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('vagas', 'anos_experiencia_min')
    op.drop_column('vagas', 'skills_obrigatorias')
