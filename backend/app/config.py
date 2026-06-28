from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Banco de dados (Railway PostgreSQL)
    database_url: str

    # IA — Groq (gratuito)
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"

    # Aplicação
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


settings = Settings()
