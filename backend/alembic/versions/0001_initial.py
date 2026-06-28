"""initial — tabela candidates

Revision ID: 0001
Revises:
Create Date: 2026-06-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "candidates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),

        # Dados extraídos pelo LLM
        sa.Column("nome",             sa.String(255), nullable=False),
        sa.Column("email",            sa.String(255), nullable=True),
        sa.Column("telefone",         sa.String(50),  nullable=True),
        sa.Column("localizacao",      sa.String(255), nullable=True),
        sa.Column("cargo_atual",      sa.String(255), nullable=True),
        sa.Column("anos_experiencia", sa.Float(),     nullable=True),
        sa.Column("hard_skills",      JSONB,          nullable=True, server_default="[]"),
        sa.Column("resumo_ia",        sa.Text(),      nullable=True),
        sa.Column("texto_bruto",      sa.Text(),      nullable=True),

        # Vaga / Processo
        sa.Column("vaga_origem",      sa.String(255), nullable=True),
        sa.Column("status",
                  sa.Enum("novo", "em_triagem", "shortlist", "aprovado",
                           "rejeitado", "contratado", name="candidatestatus"),
                  nullable=False, server_default="novo"),
        sa.Column("score_aderencia",  sa.Float(), nullable=True),

        # Armazenamento GCS
        sa.Column("gcs_url",          sa.String(1024), nullable=True),
        sa.Column("nome_arquivo",     sa.String(512),  nullable=True),

        # Anotações internas
        sa.Column("notas",            sa.Text(),  nullable=True),
        sa.Column("tags",             JSONB,      nullable=True, server_default="[]"),

        # Histórico de colocação
        sa.Column("empresa_contratada", sa.String(255),              nullable=True),
        sa.Column("data_contratacao",   sa.DateTime(timezone=True),  nullable=True),

        # Shortlist
        sa.Column("em_shortlist",      sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("shortlist_token",   sa.String(64), nullable=True, unique=True),
        sa.Column("aprovado_cliente",  sa.Boolean(), nullable=True),

        # Metadados
        sa.Column("criado_em",    sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("atualizado_em", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Índices para buscas frequentes
    op.create_index("ix_candidates_nome",        "candidates", ["nome"])
    op.create_index("ix_candidates_email",       "candidates", ["email"])
    op.create_index("ix_candidates_status",      "candidates", ["status"])
    op.create_index("ix_candidates_localizacao", "candidates", ["localizacao"])
    op.create_index("ix_candidates_vaga_origem", "candidates", ["vaga_origem"])
    op.create_index("ix_candidates_em_shortlist","candidates", ["em_shortlist"])
    op.create_index("ix_candidates_shortlist_token", "candidates", ["shortlist_token"])


def downgrade():
    op.drop_table("candidates")
    op.execute("DROP TYPE IF EXISTS candidatestatus")
