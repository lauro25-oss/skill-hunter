import uuid
import enum
from sqlalchemy import Column, String, Text, Float, Enum as SAEnum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class VagaStatus(str, enum.Enum):
    aberta    = "aberta"
    fechada   = "fechada"
    arquivada = "arquivada"


class Vaga(Base):
    __tablename__ = "vagas"

    id                   = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo               = Column(String(255), nullable=False)
    descricao            = Column(Text)
    status               = Column(SAEnum(VagaStatus, name="vaga_status"), default=VagaStatus.aberta, nullable=False)
    skills_obrigatorias  = Column(JSONB, default=list, nullable=False, server_default="[]")
    anos_experiencia_min = Column(Float, nullable=True)
    criado_em            = Column(DateTime(timezone=True), server_default=func.now())
