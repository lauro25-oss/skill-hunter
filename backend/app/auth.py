import os
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

SECRET_KEY  = os.getenv("JWT_SECRET",       "skill-hunter-dev-secret-2024-change-me")
ADMIN_USER  = os.getenv("ADMIN_USERNAME",   "admin")
ADMIN_PASS  = os.getenv("ADMIN_PASSWORD",   "skill2024")
ALGORITHM   = "HS256"
EXPIRE_DAYS = 7

_security = HTTPBearer(auto_error=False)


def create_token(username: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=EXPIRE_DAYS)
    return jwt.encode({"sub": username, "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_security),
) -> str:
    if not credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token de acesso necessário")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub", "")
        if not username:
            raise ValueError
        return username
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido ou expirado")
