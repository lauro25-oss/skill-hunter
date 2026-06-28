from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db

from app.schemas.candidate import SearchQuery, SearchResult, CandidateListItem
from app.services.elastic import search_candidates
from app.auth import get_current_user
from uuid import UUID
from datetime import datetime

router = APIRouter(
    prefix="/search",
    tags=["Busca"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=SearchResult)
async def search(query: SearchQuery):
    """
    Busca por texto livre e filtros. Usa PostgreSQL Full-Text Search.

    Exemplos de query:
      - "Python React"
      - "gerente coordenador"
      - "machine learning"
    """
    filters = {
        "status":                   query.status,
        "localizacao":              query.localizacao,
        "hard_skills":              query.hard_skills or None,
        "tags":                     query.tags or None,
        "vaga_origem":              query.vaga_origem,
        "anos_experiencia_min":     query.anos_experiencia_min,
        "anos_experiencia_max":     query.anos_experiencia_max,
        "em_shortlist":             query.em_shortlist,
        "aprovado_cliente_filter":  query.aprovado_cliente_filter,
    }
    filters = {k: v for k, v in filters.items() if v is not None}

    response = await search_candidates(
        q=query.q,
        filters=filters,
        page=query.page,
        per_page=query.per_page,
        order_by=query.order_by,
    )

    total = response["hits"]["total"]["value"]
    hits  = response["hits"]["hits"]

    results = [
        CandidateListItem(
            id=UUID(h["_source"]["id"]),
            nome=h["_source"].get("nome", ""),
            cargo_atual=h["_source"].get("cargo_atual"),
            localizacao=h["_source"].get("localizacao"),
            anos_experiencia=h["_source"].get("anos_experiencia"),
            hard_skills=h["_source"].get("hard_skills") or [],
            status=h["_source"].get("status", "novo"),
            score_aderencia=h["_source"].get("score_aderencia"),
            em_shortlist=h["_source"].get("em_shortlist", False),
            aprovado_cliente=h["_source"].get("aprovado_cliente"),
            criado_em=h["_source"].get("criado_em") or datetime.utcnow(),
        )
        for h in hits
    ]

    return SearchResult(
        total=total,
        page=query.page,
        per_page=query.per_page,
        results=results,
    )
