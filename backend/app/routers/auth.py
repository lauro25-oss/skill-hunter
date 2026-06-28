import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.auth import ADMIN_USER, ADMIN_PASS, create_token, hash_password, verify_password
from app.database import get_db
from app.models.auth_models import PasswordResetToken, AdminSettings
from app.services.email import enviar_email_reset_senha

router = APIRouter(prefix="/auth", tags=["Auth"])
limiter = Limiter(key_func=get_remote_address)


class LoginPayload(BaseModel):
    username: str
    password: str


class ForgotPasswordPayload(BaseModel):
    username: str


class ResetPasswordPayload(BaseModel):
    token: str
    new_password: str


@router.post("/login")
@limiter.limit("10/minute")
async def login(
    request: Request,
    payload: LoginPayload,
    db: AsyncSession = Depends(get_db),
):
    if payload.username != ADMIN_USER:
        raise HTTPException(401, "Usuário ou senha incorretos")

    result = await db.execute(select(AdminSettings).where(AdminSettings.id == 1))
    settings = result.scalar_one_or_none()

    if settings and settings.password_hash:
        valid = verify_password(payload.password, settings.password_hash)
    else:
        valid = payload.password == ADMIN_PASS

    if not valid:
        raise HTTPException(401, "Usuário ou senha incorretos")

    return {"token": create_token(payload.username)}


@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(
    request: Request,
    payload: ForgotPasswordPayload,
    db: AsyncSession = Depends(get_db),
):
    _SAFE = {"ok": True, "mensagem": "Se o usuário existir, um link de redefinição foi enviado."}

    if payload.username != ADMIN_USER:
        return _SAFE

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=2)

    db.add(PasswordResetToken(token=token, expires_at=expires_at))
    await db.commit()

    try:
        await enviar_email_reset_senha(token)
    except Exception:
        pass

    return _SAFE


@router.post("/reset-password")
@limiter.limit("10/minute")
async def reset_password(
    request: Request,
    payload: ResetPasswordPayload,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token == payload.token,
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        )
    )
    token_obj = result.scalar_one_or_none()
    if not token_obj:
        raise HTTPException(400, "Token inválido ou expirado.")

    if len(payload.new_password) < 6:
        raise HTTPException(400, "A senha deve ter pelo menos 6 caracteres.")

    settings_result = await db.execute(select(AdminSettings).where(AdminSettings.id == 1))
    settings = settings_result.scalar_one_or_none()

    new_hash = hash_password(payload.new_password)

    if settings:
        settings.password_hash = new_hash
    else:
        db.add(AdminSettings(id=1, password_hash=new_hash))

    token_obj.used = True
    await db.commit()

    return {"ok": True, "mensagem": "Senha atualizada com sucesso."}
