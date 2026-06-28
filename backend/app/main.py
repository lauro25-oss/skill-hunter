from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.services.elastic import ensure_index
from app.routers import candidates, search, vagas, portal, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    try:
        await ensure_index()
    except Exception as e:
        print(f"[WARN] Não foi possível criar índice FTS: {e}")

    yield

    # ── Shutdown ─────────────────────────────────────────────
    await engine.dispose()


app = FastAPI(
    title="ATS — Sistema de Rastreamento de Candidatos",
    description="API para gestão de currículos, busca inteligente e triagem de candidatos.",
    version="1.0.0",
    lifespan=lifespan,
)

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


@app.get("/health", tags=["Sistema"])
async def health():
    return {"status": "ok", "environment": settings.environment}
