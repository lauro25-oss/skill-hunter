import uuid
import enum
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Text, Enum, Boolean,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database import Base


class CandidateStatus(str, enum.Enum):
    novo          = "novo"
    em_triagem    = "em_triagem"
    shortlist     = "shortlist"
    aprovado      = "aprovado"
    rejeitado     = "rejeitado"
    contratado    = "contratado"


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ── Dados extraídos pelo LLM ────────────────────────────
    nome               = Column(String(255), nullable=False, index=True)
    email              = Column(String(255), index=True)
    telefone           = Column(String(50))
    localizacao        = Column(String(255), index=True)
    cargo_atual        = Column(String(255), index=True)
    anos_experiencia   = Column(Float)                  # total de anos (soma de todas as áreas)
    experiencias       = Column(JSONB, default=list)   # [{"cargo": "...", "area": "...", "anos": 3.0}]
    hard_skills        = Column(JSONB, default=list)   # ["Python", "SQL", ...]
    resumo_ia          = Column(Text)
    texto_bruto        = Column(Text)                  # texto completo do CV

    # ── Vaga / Processo ─────────────────────────────────────
    vaga_origem        = Column(String(255), index=True)
    status             = Column(
                            Enum(CandidateStatus),
                            default=CandidateStatus.novo,
                            index=True,
                        )
    score_aderencia    = Column(Float)                 # 0–100

    # ── Armazenamento ───────────────────────────────────────
    gcs_url            = Column(String(1024))          # blob_id (referência interna)
    arquivo_base64     = Column(Text)                  # arquivo armazenado em base64
    nome_arquivo       = Column(String(512))

    # ── Anotações internas ──────────────────────────────────
    notas              = Column(Text)
    tags               = Column(JSONB, default=list)   # tags livres da equipe

    # ── Histórico de colocação ──────────────────────────────
    empresa_contratada = Column(String(255))
    data_contratacao   = Column(DateTime(timezone=True))

    # ── Shortlist (Portal do Cliente) ───────────────────────
    em_shortlist       = Column(Boolean, default=False, index=True)
    shortlist_token    = Column(String(64), index=True, unique=True, nullable=True)
    aprovado_cliente   = Column(Boolean, nullable=True)  # None = pendente

    # ── LGPD ────────────────────────────────────────────────
    anonimizado        = Column(Boolean, default=False, nullable=False, server_default="false")

    # ── Metadados ───────────────────────────────────────────
    criado_em          = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em      = Column(
                            DateTime(timezone=True),
                            server_default=func.now(),
                            onupdate=func.now(),
                        )
