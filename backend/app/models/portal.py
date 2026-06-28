import secrets
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class PortalLink(Base):
    __tablename__ = "portal_links"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token       = Column(String(64), unique=True, index=True, nullable=False, default=lambda: secrets.token_urlsafe(32))
    label       = Column(String(255), nullable=False)
    vaga_origem = Column(String(255), nullable=True)
    ativo       = Column(Boolean, default=True, nullable=False)
    criado_em   = Column(DateTime(timezone=True), server_default=func.now())
