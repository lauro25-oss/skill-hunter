from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.candidate import CandidateStatus


class ExperienciaItem(BaseModel):
    cargo: str
    area: str
    anos: float


class CandidateBase(BaseModel):
    nome: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    localizacao: Optional[str] = None
    cargo_atual: Optional[str] = None
    anos_experiencia: Optional[float] = None
    experiencias: list[ExperienciaItem] = []
    hard_skills: list[str] = []
    resumo_ia: Optional[str] = None
    vaga_origem: Optional[str] = None
    notas: Optional[str] = None
    tags: list[str] = []
    empresa_contratada: Optional[str] = None
    data_contratacao: Optional[datetime] = None


class CandidateCreate(CandidateBase):
    pass


class CandidateUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    localizacao: Optional[str] = None
    cargo_atual: Optional[str] = None
    anos_experiencia: Optional[float] = None
    hard_skills: Optional[list[str]] = None
    resumo_ia: Optional[str] = None
    vaga_origem: Optional[str] = None
    status: Optional[CandidateStatus] = None
    score_aderencia: Optional[float] = None
    notas: Optional[str] = None
    tags: Optional[list[str]] = None
    empresa_contratada: Optional[str] = None
    data_contratacao: Optional[datetime] = None
    em_shortlist: Optional[bool] = None


class CandidateOut(CandidateBase):
    id: UUID
    status: CandidateStatus
    score_aderencia: Optional[float] = None
    gcs_url: Optional[str] = None
    nome_arquivo: Optional[str] = None
    em_shortlist: bool
    aprovado_cliente: Optional[bool] = None
    criado_em: datetime
    atualizado_em: datetime

    model_config = {"from_attributes": True}


class CandidateListItem(BaseModel):
    id: UUID
    nome: str
    cargo_atual: Optional[str]
    localizacao: Optional[str]
    anos_experiencia: Optional[float]
    hard_skills: list[str]
    status: CandidateStatus
    score_aderencia: Optional[float]
    em_shortlist: bool
    aprovado_cliente: Optional[bool] = None
    criado_em: datetime

    model_config = {"from_attributes": True}


class SearchQuery(BaseModel):
    q: str = Field("", description="Busca textual booleana")
    status: Optional[CandidateStatus] = None
    localizacao: Optional[str] = None
    anos_experiencia_min: Optional[float] = None
    anos_experiencia_max: Optional[float] = None
    hard_skills: list[str] = []
    tags: list[str] = []
    vaga_origem: Optional[str] = None
    em_shortlist: Optional[bool] = None
    aprovado_cliente_filter: Optional[str] = None  # 'aprovado' | 'reprovado' | 'pendente'
    order_by: str = Field("criado_em", description="criado_em | score | nome | anos_experiencia")
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=5000)


class SearchResult(BaseModel):
    total: int
    page: int
    per_page: int
    results: list[CandidateListItem]


class CommentCreate(BaseModel):
    texto: str = Field(..., min_length=1, max_length=2000)


class CommentOut(BaseModel):
    id: UUID
    candidate_id: UUID
    texto: str
    criado_em: datetime

    model_config = {"from_attributes": True}
