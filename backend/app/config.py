"""Environment-based settings. Secrets come from the environment / .env only."""
import secrets
from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]
SITE_DIR = ROOT / "frontend" / "site"
DIST_DIR = ROOT / "dist"
APP_BASE = "/hair-loss-assessment"


def _default_gmail_client_secrets_file() -> Path:
    candidates = sorted((ROOT / "secrets").glob("client_secret*.json"))
    if len(candidates) == 1:
        return candidates[0]
    return ROOT / "secrets" / "client_secret.json"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(ROOT / ".env", ROOT / ".env.gmail"), extra="ignore")

    environment: str = Field("development", validation_alias=AliasChoices("ENVIRONMENT", "NODE_ENV"))
    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-2.5-flash"
    ai_timeout_seconds: float = Field(75, gt=0)
    ai_max_attempts: int = Field(3, ge=1, le=5)
    supabase_url: str | None = None
    supabase_service_role_key: SecretStr | None = None
    doctor_username: str | None = None
    doctor_password: SecretStr | None = None
    gmail_notification_email: str = "anarvaclinic8@gmail.com"
    gmail_sender_email: str = "anarvaclinic8@gmail.com"
    app_public_url: str = "https://www.anarvaclinic.com/hair-loss-assessment/"
    gmail_client_secrets_file: Path = Field(default_factory=_default_gmail_client_secrets_file)
    gmail_token_json: str | None = None
    gmail_token_file: Path = ROOT / "secrets" / "gmail-token.json"
    gmail_oauth_port: int = Field(8765, ge=1024, le=65535)
    # Signs doctor session cookies. Set it explicitly when running several instances.
    secret_key: SecretStr = Field(default_factory=lambda: SecretStr(secrets.token_urlsafe(32)))

    @field_validator("gmail_client_secrets_file", "gmail_token_file", mode="before")
    @classmethod
    def _resolve_gmail_paths(cls, value):
        path = Path(value)
        return path if path.is_absolute() else ROOT / path

    @property
    def production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
