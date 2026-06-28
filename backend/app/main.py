import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from app.config import settings
from app.database import engine, Base
from app.services.elastic import ensure_index
from app.routers import candidates, search, vagas, portal, auth
import app.models.auth_models  # noqa: F401 — registra tabelas no metadata

# ── Sentry ───────────────────────────────────────────────────
_sentry_dsn = os.environ.get("SENTRY_DSN", "")
if _sentry_dsn:
    sentry_sdk.init(
        dsn=_sentry_dsn,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        traces_sample_rate=0.1,
        environment=settings.environment,
    )

# ── Rate limiter ─────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    try:
        await ensure_index()
    except Exception as e:
        print(f"[WARN] Não foi possível criar índice FTS: {e}")

    yield

    await engine.dispose()


app = FastAPI(
    title="ATS — Sistema de Rastreamento de Candidatos",
    description="API para gestão de currículos, busca inteligente e triagem de candidatos.",
    version="1.0.0",
    lifespan=lifespan,
)

# Expõe o limiter no estado da app (necessário para SlowAPI)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(candidates.router)
app.include_router(search.router)
app.include_router(vagas.router)
app.include_router(portal.router)


@app.api_route("/health", methods=["GET", "HEAD"], tags=["Sistema"])
async def health():
    return {"status": "ok", "environment": settings.environment}
