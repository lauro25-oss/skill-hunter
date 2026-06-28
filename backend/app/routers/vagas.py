import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.vaga import Vaga
from app.models.candidate import Candidate
from app.schemas.vaga import VagaCreate, VagaUpdate, VagaOut
from app.services.score import score_aderencia
from app.auth import get_current_user

router = APIRouter(
    prefix="/vagas",
    tags=["Vagas"],
    dependencies=[Depends(get_current_user)],
)


def _vaga_out(v: Vaga, total_candidatos: int = 0) -> VagaOut:
    return VagaOut(
        id=v.id,
        titulo=v.titulo,
        descricao=v.descricao,
        status=v.status,
        skills_obrigatorias=v.skills_obrigatorias or [],
        anos_experiencia_min=v.anos_experiencia_min,
        criado_em=v.criado_em,
        total_candidatos=total_candidatos,
    )


@router.get("", response_model=list[VagaOut])
async def list_vagas(db: AsyncSession = Depends(get_db)):
    vagas_result = await db.execute(select(Vaga).order_by(Vaga.criado_em.desc()))
    vagas = vagas_result.scalars().all()

    counts_result = await db.execute(
        select(Candidate.vaga_origem, func.count(Candidate.id)).group_by(Candidate.vaga_origem)
    )
    counts = {row[0]: row[1] for row in counts_result if row[0]}

    return [_vaga_out(v, counts.get(v.titulo, 0)) for v in vagas]


@router.post("", response_model=VagaOut, status_code=status.HTTP_201_CREATED)
async def create_vaga(payload: VagaCreate, db: AsyncSession = Depends(get_db)):
    vaga = Vaga(id=uuid.uuid4(), **payload.model_dump())
    db.add(vaga)
    await db.commit()
    await db.refresh(vaga)
    return _vaga_out(vaga)


@router.patch("/{vaga_id}", response_model=VagaOut)
async def update_vaga(vaga_id: uuid.UUID, payload: VagaUpdate, db: AsyncSession = Depends(get_db)):
    vaga = await _get_or_404(vaga_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vaga, field, value)
    await db.commit()
    await db.refresh(vaga)
    return _vaga_out(vaga)


@router.post("/{vaga_id}/recalculate", response_model=dict)
async def recalculate_scores(vaga_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Recalcula score_aderencia de todos os candidatos desta vaga."""
    vaga = await _get_or_404(vaga_id, db)

    requisitos = {
        "skills_obrigatorias":  vaga.skills_obrigatorias or [],
        "anos_experiencia_min": vaga.anos_experiencia_min,
    }

    result = await db.execute(
        select(Candidate).where(Candidate.vaga_origem == vaga.titulo)
    )
    candidates = result.scalars().all()

    for c in candidates:
        candidate_dict = {
            "hard_skills":      c.hard_skills or [],
            "anos_experiencia": c.anos_experiencia,
            "texto_bruto":      c.texto_bruto or "",
        }
        c.score_aderencia = score_aderencia(candidate_dict, requisitos)

    await db.commit()
    return {"updated": len(candidates)}


@router.delete("/{vaga_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vaga(vaga_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    vaga = await _get_or_404(vaga_id, db)
    await db.delete(vaga)
    await db.commit()


async def _get_or_404(vaga_id: uuid.UUID, db: AsyncSession) -> Vaga:
    result = await db.execute(select(Vaga).where(Vaga.id == vaga_id))
    vaga = result.scalar_one_or_none()
    if not vaga:
        raise HTTPException(404, "Vaga não encontrada.")
    return vaga
