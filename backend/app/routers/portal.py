import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.portal import PortalLink
from app.models.candidate import Candidate
from app.schemas.portal import PortalCreate, PortalOut, CandidatePortalOut, VotePayload
from app.auth import get_current_user
from app.services.email import enviar_email_shortlist_criada

router = APIRouter(tags=["Portal do Cliente"])


# ── Admin: gerenciar portais ─────────────────────────────────

@router.get("/portals", response_model=list[PortalOut], dependencies=[Depends(get_current_user)])
async def list_portals(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PortalLink).order_by(PortalLink.criado_em.desc()))
    return result.scalars().all()


@router.post("/portals", response_model=PortalOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_user)])
async def create_portal(payload: PortalCreate, db: AsyncSession = Depends(get_db)):
    portal = PortalLink(id=uuid.uuid4(), **payload.model_dump())
    db.add(portal)
    await db.commit()
    await db.refresh(portal)

    # Conta candidatos na shortlist para incluir no e-mail
    try:
        q = select(func.count(Candidate.id)).where(Candidate.em_shortlist == True)
        if portal.vaga_origem:
            q = q.where(Candidate.vaga_origem == portal.vaga_origem)
        total_res = await db.execute(q)
        total = total_res.scalar() or 0
        await enviar_email_shortlist_criada(portal.label, total, portal.token)
    except Exception:
        pass

    return portal


@router.delete("/portals/{portal_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_user)])
async def delete_portal(portal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PortalLink).where(PortalLink.id == portal_id))
    portal = result.scalar_one_or_none()
    if not portal:
        raise HTTPException(404, "Portal não encontrado.")
    await db.delete(portal)
    await db.commit()


# ── Público: visualizar shortlist ────────────────────────────

@router.get("/portal/{token}", response_model=dict)
async def get_portal_public(token: str, db: AsyncSession = Depends(get_db)):
    portal = await _get_portal(token, db)

    query = select(Candidate).where(Candidate.em_shortlist == True)
    if portal.vaga_origem:
        query = query.where(Candidate.vaga_origem == portal.vaga_origem)
    query = query.order_by(Candidate.score_aderencia.desc().nullslast())

    result    = await db.execute(query)
    candidates = result.scalars().all()

    return {
        "portal": PortalOut.model_validate(portal),
        "candidates": [CandidatePortalOut.model_validate(c) for c in candidates],
    }


# ── Público: aprovar / reprovar ──────────────────────────────

@router.patch("/portal/{token}/candidates/{candidate_id}/vote", response_model=CandidatePortalOut)
async def vote_candidate(
    token: str,
    candidate_id: uuid.UUID,
    payload: VotePayload,
    db: AsyncSession = Depends(get_db),
):
    await _get_portal(token, db)

    result = await db.execute(
        select(Candidate).where(Candidate.id == candidate_id, Candidate.em_shortlist == True)
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(404, "Candidato não encontrado na shortlist.")

    candidate.aprovado_cliente = payload.aprovado
    await db.commit()
    await db.refresh(candidate)
    return CandidatePortalOut.model_validate(candidate)


# ── Helper ───────────────────────────────────────────────────

async def _get_portal(token: str, db: AsyncSession) -> PortalLink:
    result = await db.execute(
        select(PortalLink).where(PortalLink.token == token, PortalLink.ativo == True)
    )
    portal = result.scalar_one_or_none()
    if not portal:
        raise HTTPException(404, "Link de portal inválido ou expirado.")
    return portal
