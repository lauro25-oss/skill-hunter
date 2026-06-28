from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.schemas.candidate import ExperienciaItem


class PortalCreate(BaseModel):
    label:       str
    vaga_origem: Optional[str] = None


class PortalOut(BaseModel):
    id:          UUID
    token:       str
    label:       str
    vaga_origem: Optional[str]
    ativo:       bool
    criado_em:   datetime

    model_config = {"from_attributes": True}


class CandidatePortalOut(BaseModel):
    id:               UUID
    nome:             str
    cargo_atual:      Optional[str]
    localizacao:      Optional[str]
    anos_experiencia: Optional[float]
    hard_skills:      list[str]
    experiencias:     list[ExperienciaItem]
    resumo_ia:        Optional[str]
    score_aderencia:  Optional[float]
    aprovado_cliente: Optional[bool]   # None=pendente True=aprovado False=reprovado

    model_config = {"from_attributes": True}


class VotePayload(BaseModel):
    aprovado: bool
