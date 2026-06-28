from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.auth import ADMIN_USER, ADMIN_PASS, create_token

router = APIRouter(prefix="/auth", tags=["Auth"])
limiter = Limiter(key_func=get_remote_address)


class LoginPayload(BaseModel):
    username: str
    password: str


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, payload: LoginPayload):
    if payload.username != ADMIN_USER or payload.password != ADMIN_PASS:
        raise HTTPException(401, "Usuário ou senha incorretos")
    return {"token": create_token(payload.username)}
