import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class CandidateComment(Base):
    __tablename__ = "candidate_comments"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    texto        = Column(Text, nullable=False)
    criado_em    = Column(DateTime, default=datetime.utcnow, nullable=False)
