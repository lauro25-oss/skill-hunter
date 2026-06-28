"""
PostgreSQL Full-Text Search — substitui Elasticsearch.
Mantém a mesma interface pública para não alterar os routers.
"""
from sqlalchemy import text
from app.database import engine


async def ensure_index():
    """Cria índice GIN para FTS se não existir (executado no startup)."""
    sql = text("""
        CREATE INDEX IF NOT EXISTS idx_candidates_fts
        ON candidates
        USING GIN (
            to_tsvector('portuguese',
                coalesce(nome,       '') || ' ' ||
                coalesce(cargo_atual,'') || ' ' ||
                coalesce(resumo_ia,  '') || ' ' ||
                coalesce(texto_bruto,'') || ' ' ||
                coalesce(localizacao,'')
            )
        )
    """)
    async with engine.begin() as conn:
        await conn.execute(sql)


async def close_es():
    """No-op — sem cliente externo para fechar."""
    pass


async def index_candidate(candidate: dict):
    """No-op — PostgreSQL FTS consulta os dados diretamente da tabela."""
    pass


async def delete_candidate(candidate_id: str):
    """No-op — exclusão do registro já remove do índice automaticamente."""
    pass


# ── Mapeamento de ordenação ───────────────────────────────────

SORT_COLUMNS: dict[str, str] = {
    "score":            "score_aderencia DESC NULLS LAST, criado_em DESC",
    "nome":             "nome ASC",
    "anos_experiencia": "anos_experiencia DESC NULLS LAST, criado_em DESC",
    "criado_em":        "criado_em DESC",
}


# ── Busca principal ───────────────────────────────────────────

async def search_candidates(
    q: str = "",
    filters: dict | None = None,
    page: int = 1,
    per_page: int = 20,
    order_by: str = "criado_em",
) -> dict:
    """
    Busca com PostgreSQL FTS + filtros estruturados.
    Retorna o mesmo formato usado pelo router de busca:
      {"hits": {"total": {"value": N}, "hits": [{"_source": {...}}, ...]}}
    """
    filters = filters or {}
    conditions: list[str] = []
    params: dict = {}

    # ── Busca textual ─────────────────────────────────────────
    FTS_VECTOR = (
        "to_tsvector('portuguese', "
        "coalesce(nome,'') || ' ' || coalesce(cargo_atual,'') || ' ' || "
        "coalesce(resumo_ia,'') || ' ' || coalesce(texto_bruto,'') || ' ' || "
        "coalesce(localizacao,''))"
    )
    if q:
        conditions.append(f"{FTS_VECTOR} @@ plainto_tsquery('portuguese', :q)")
        params["q"] = q

    # ── Filtros estruturados ──────────────────────────────────
    if filters.get("status"):
        conditions.append("status::text = :status")
        params["status"] = filters["status"]

    if filters.get("localizacao"):
        conditions.append("localizacao ILIKE :localizacao")
        params["localizacao"] = f"%{filters['localizacao']}%"

    if filters.get("vaga_origem"):
        conditions.append("vaga_origem = :vaga_origem")
        params["vaga_origem"] = filters["vaga_origem"]

    if filters.get("hard_skills"):
        skill_parts = []
        for i, skill in enumerate(filters["hard_skills"]):
            key = f"skill_{i}"
            skill_parts.append(f"jsonb_exists(hard_skills, :{key})")
            params[key] = skill
        conditions.append("(" + " OR ".join(skill_parts) + ")")

    if filters.get("tags"):
        tag_parts = []
        for i, tag in enumerate(filters["tags"]):
            key = f"tag_{i}"
            tag_parts.append(f"jsonb_exists(tags, :{key})")
            params[key] = tag
        conditions.append("(" + " OR ".join(tag_parts) + ")")

    if filters.get("anos_experiencia_min") is not None:
        conditions.append("anos_experiencia >= :anos_min")
        params["anos_min"] = filters["anos_experiencia_min"]

    if filters.get("anos_experiencia_max") is not None:
        conditions.append("anos_experiencia <= :anos_max")
        params["anos_max"] = filters["anos_experiencia_max"]

    if filters.get("em_shortlist") is not None:
        conditions.append("em_shortlist = :em_shortlist")
        params["em_shortlist"] = filters["em_shortlist"]

    aprov = filters.get("aprovado_cliente_filter")
    if aprov == "aprovado":
        conditions.append("aprovado_cliente = true")
    elif aprov == "reprovado":
        conditions.append("aprovado_cliente = false")
    elif aprov == "pendente":
        conditions.append("aprovado_cliente IS NULL AND em_shortlist = true")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    # ── Ordenação ─────────────────────────────────────────────
    if q:
        # Busca textual: relevância primeiro
        sort_sql = (
            f"ORDER BY ts_rank({FTS_VECTOR}, plainto_tsquery('portuguese', :q)) DESC,"
            " criado_em DESC"
        )
    else:
        col = SORT_COLUMNS.get(order_by, "criado_em DESC")
        sort_sql = f"ORDER BY {col}"

    params["limit"]  = per_page
    params["offset"] = (page - 1) * per_page

    count_sql = text(f"SELECT COUNT(*) FROM candidates {where}")
    data_sql  = text(f"""
        SELECT
            id::text, nome, email, localizacao, cargo_atual,
            anos_experiencia, hard_skills, resumo_ia, texto_bruto,
            vaga_origem, status::text, score_aderencia, tags,
            em_shortlist, aprovado_cliente, criado_em
        FROM candidates
        {where}
        {sort_sql}
        LIMIT :limit OFFSET :offset
    """)

    async with engine.connect() as conn:
        total = (await conn.execute(count_sql, params)).scalar() or 0
        rows  = (await conn.execute(data_sql, params)).mappings().all()

    return {
        "hits": {
            "total": {"value": total},
            "hits":  [{"_source": dict(r)} for r in rows],
        }
    }
