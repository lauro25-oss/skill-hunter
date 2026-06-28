from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.auth import ADMIN_USER, ADMIN_PASS, create_token

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginPayload(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(payload: LoginPayload):
    if payload.username != ADMIN_USER or payload.password != ADMIN_PASS:
        raise HTTPException(401, "Usuário ou senha incorretos")
    return {"token": create_token(payload.username)}
