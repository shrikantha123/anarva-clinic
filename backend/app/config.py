"""Environment-based settings. Secrets come from the environment / .env only."""
import secrets
from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]
SITE_DIR = ROOT / "site"
DIST_DIR = ROOT / "dist"
APP_BASE = "/hair-loss-assessment"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")

    environment: str = Field("development", validation_alias=AliasChoices("ENVIRONMENT", "NODE_ENV"))
    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-2.5-flash"
    ai_timeout_seconds: float = Field(60, gt=0)
    ai_max_attempts: int = Field(2, ge=1, le=5)
    supabase_url: str | None = None
    supabase_service_role_key: SecretStr | None = None
    doctor_username: str | None = None
    doctor_password: SecretStr | None = None
    # Signs doctor session cookies. Set it explicitly when running several instances.
    secret_key: SecretStr = Field(default_factory=lambda: SecretStr(secrets.token_urlsafe(32)))

    @property
    def production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
