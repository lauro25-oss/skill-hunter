from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.vaga import VagaStatus


class VagaCreate(BaseModel):
    titulo:               str
    descricao:            Optional[str] = None
    status:               VagaStatus = VagaStatus.aberta
    skills_obrigatorias:  list[str] = []
    anos_experiencia_min: Optional[float] = None


class VagaUpdate(BaseModel):
    titulo:               Optional[str] = None
    descricao:            Optional[str] = None
    status:               Optional[VagaStatus] = None
    skills_obrigatorias:  Optional[list[str]] = None
    anos_experiencia_min: Optional[float] = None


class VagaOut(BaseModel):
    id:                   UUID
    titulo:               str
    descricao:            Optional[str]
    status:               VagaStatus
    skills_obrigatorias:  list[str] = []
    anos_experiencia_min: Optional[float] = None
    criado_em:            datetime
    total_candidatos:     int = 0

    model_config = {"from_attributes": True}
