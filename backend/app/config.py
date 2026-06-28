import os
from pydantic import BaseModel


class Settings(BaseModel):
    database_url: str
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"
    environment: str = "development"
    cors_origins: str = "http://localhost:5173"

    @property
    def async_database_url(self) -> str:
        return self.database_url.replace(
            "postgresql://", "postgresql+asyncpg://"
        ).replace(
            "postgres://", "postgresql+asyncpg://"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings(
    database_url=os.environ.get("DATABASE_URL", ""),
    groq_api_key=os.environ.get("GROQ_API_KEY", ""),
    groq_model=os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant"),
    environment=os.environ.get("ENVIRONMENT", "development"),
    cors_origins=os.environ.get("CORS_ORIGINS", "http://localhost:5173"),
)
