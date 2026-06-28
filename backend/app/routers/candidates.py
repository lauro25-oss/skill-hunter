import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.candidate import Candidate, CandidateStatus
from app.schemas.candidate import CandidateOut, CandidateUpdate
from app.services import parser, storage
from app.services.score import calcular_score
from app.auth import get_current_user

router = APIRouter(
    prefix="/candidates",
    tags=["Candidatos"],
    dependencies=[Depends(get_current_user)],
)

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
CONTENT_TYPE_MAP = {
    "application/pdf": "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_SIZE_MB = 10


# ── Upload em lote ───────────────────────────────────────────

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_curriculos(
    files: list[UploadFile] = File(..., description="PDFs ou DOCX dos candidatos"),
    vaga_origem: str | None = Query(None, description="Nome da vaga para rastreamento"),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload em lote de currículos.
    Cada arquivo é processado independentemente — falhas parciais não cancelam o lote.

    Retorna: { "criados": [...], "erros": [...] }
    """
    criados = []
    erros   = []

    for file in files:
        try:
            if file.content_type not in ALLOWED_TYPES:
                erros.append({"arquivo": file.filename, "erro": "Formato inválido. Use PDF ou DOCX."})
                continue

            file_bytes = await file.read()
            if len(file_bytes) > MAX_SIZE_MB * 1024 * 1024:
                erros.append({"arquivo": file.filename, "erro": f"Arquivo excede {MAX_SIZE_MB} MB."})
                continue

            # 1. Parsing + LLM
            data = await parser.parse_curriculum(file_bytes, file.filename)

            # 2. Score
            score = calcular_score(data)

            # 3. Encode para base64
            blob_id, b64_data = await storage.upload_file(
                file_bytes, file.filename, file.content_type or "application/pdf"
            )

            # 4. Persiste no PostgreSQL
            candidate = Candidate(
                id=uuid.uuid4(),
                nome=data["nome"],
                email=data.get("email"),
                telefone=data.get("telefone"),
                localizacao=data.get("localizacao"),
                cargo_atual=data.get("cargo_atual"),
                anos_experiencia=data.get("anos_experiencia"),
                experiencias=data.get("experiencias", []),
                hard_skills=data.get("hard_skills", []),
                resumo_ia=data.get("resumo_ia"),
                texto_bruto=data.get("texto_bruto"),
                vaga_origem=vaga_origem,
                gcs_url=blob_id,
                arquivo_base64=b64_data,
                nome_arquivo=file.filename,
                score_aderencia=score,
            )
            db.add(candidate)
            await db.commit()
            await db.refresh(candidate)
            criados.append(CandidateOut.model_validate(candidate))

        except Exception as exc:
            await db.rollback()
            erros.append({"arquivo": file.filename, "erro": str(exc)})

    return {"criados": criados, "erros": erros}


# ── Stats ────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total_result = await db.execute(select(func.count(Candidate.id)))
    total = total_result.scalar() or 0

    rows = await db.execute(
        select(Candidate.status, func.count(Candidate.id)).group_by(Candidate.status)
    )
    counts = {row[0].value: row[1] for row in rows}

    score_result = await db.execute(
        select(func.avg(Candidate.score_aderencia)).where(Candidate.score_aderencia.isnot(None))
    )
    score_avg = round(float(score_result.scalar() or 0), 1)

    vagas_rows = await db.execute(
        select(Candidate.vaga_origem, func.count(Candidate.id))
        .where(Candidate.vaga_origem.isnot(None))
        .group_by(Candidate.vaga_origem)
        .order_by(func.count(Candidate.id).desc())
        .limit(6)
    )
    top_vagas = [{"vaga": r[0], "total": r[1]} for r in vagas_rows]

    approval_rows = await db.execute(
        select(Candidate.aprovado_cliente, func.count(Candidate.id))
        .where(Candidate.em_shortlist == True)
        .group_by(Candidate.aprovado_cliente)
    )
    approval = {"aprovado": 0, "reprovado": 0, "pendente": 0}
    for val, cnt in approval_rows:
        if val is True:
            approval["aprovado"] = cnt
        elif val is False:
            approval["reprovado"] = cnt
        else:
            approval["pendente"] = cnt

    return {
        "total":      total,
        "novo":       counts.get("novo", 0),
        "em_triagem": counts.get("em_triagem", 0),
        "shortlist":  counts.get("shortlist", 0),
        "aprovado":   counts.get("aprovado", 0),
        "rejeitado":  counts.get("rejeitado", 0),
        "contratado": counts.get("contratado", 0),
        "score_avg":  score_avg,
        "top_vagas":  top_vagas,
        "aprovacao":  approval,
    }


# ── GET único ────────────────────────────────────────────────

@router.get("/{candidate_id}", response_model=CandidateOut)
async def get_candidate(candidate_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    c = await _get_or_404(candidate_id, db)
    return CandidateOut.model_validate(c)


# ── Data URL do CV ───────────────────────────────────────────

@router.get("/{candidate_id}/cv-url")
async def get_cv_url(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retorna uma data URL (base64) para visualizar/baixar o CV original no browser."""
    c = await _get_or_404(candidate_id, db)
    if not c.arquivo_base64:
        raise HTTPException(404, "Este candidato não possui arquivo armazenado.")

    ext = (c.nome_arquivo or "").lower()
    if ext.endswith(".docx"):
        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        content_type = "application/pdf"

    url = await storage.generate_signed_url(c.arquivo_base64, content_type)
    return {"url": url}


# ── Re-parsear CV existente ──────────────────────────────────

@router.post("/{candidate_id}/reparse", response_model=CandidateOut)
async def reparse_candidate(candidate_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Re-processa o currículo armazenado com o LLM."""
    c = await _get_or_404(candidate_id, db)
    if not c.arquivo_base64 or not c.nome_arquivo:
        raise HTTPException(400, "Candidato sem arquivo armazenado para re-parsear.")

    file_bytes = storage.decode_file(c.arquivo_base64)
    data  = await parser.parse_curriculum(file_bytes, c.nome_arquivo)
    score = calcular_score(data)

    c.nome             = data["nome"]             or c.nome
    c.email            = data.get("email")        or c.email
    c.telefone         = data.get("telefone")     or c.telefone
    c.localizacao      = data.get("localizacao")  or c.localizacao
    c.cargo_atual      = data.get("cargo_atual")  or c.cargo_atual
    c.anos_experiencia = data.get("anos_experiencia") or c.anos_experiencia
    c.hard_skills      = data.get("hard_skills")  or c.hard_skills
    c.resumo_ia        = data.get("resumo_ia")    or c.resumo_ia
    c.texto_bruto      = data.get("texto_bruto")  or c.texto_bruto
    c.score_aderencia  = score

    await db.commit()
    await db.refresh(c)
    return CandidateOut.model_validate(c)


# ── PATCH ────────────────────────────────────────────────────

@router.patch("/{candidate_id}", response_model=CandidateOut)
async def update_candidate(
    candidate_id: uuid.UUID,
    payload: CandidateUpdate,
    db: AsyncSession = Depends(get_db),
):
    c = await _get_or_404(candidate_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(c, field, value)
    await db.commit()
    await db.refresh(c)
    return CandidateOut.model_validate(c)


# ── DELETE ───────────────────────────────────────────────────

@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(candidate_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    c = await _get_or_404(candidate_id, db)
    await db.delete(c)
    await db.commit()


# ── Helper ───────────────────────────────────────────────────

async def _get_or_404(candidate_id: uuid.UUID, db: AsyncSession) -> Candidate:
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Candidato não encontrado.")
    return c
