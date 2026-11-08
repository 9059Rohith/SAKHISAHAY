from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_SECRET = "development-only-" * 5


class Settings(BaseSettings):
    """Environment-only server settings, with fail-closed production validation."""

    model_config = SettingsConfigDict(
        env_file=(Path(__file__).resolve().parents[2] / ".env", ".env"),
        extra="ignore",
    )
    app_name: str = "SAKHISAHAY"
    app_env: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    secret_key: str = DEV_SECRET
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "sakhisahay"
    mongodb_max_pool_size: int = 30
    mongodb_min_pool_size: int = 0
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    allowed_hosts: str = "localhost,127.0.0.1,testserver,*.vercel.app"
    frontend_url: str = "http://localhost:5173"
    rate_limit_enabled: bool = True
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = ""
    first_admin_email: str = ""
    first_admin_password: str = ""
    log_level: str = "INFO"
    git_sha: str = "development"
    build_time: str = "local"

    @model_validator(mode="after")
    def production_guards(self):
        if self.app_env == "production":
            if self.secret_key == DEV_SECRET or len(self.secret_key) < 64:
                raise ValueError("Production SECRET_KEY must be a random value of 64+ characters")
            if self.debug or "*" in self.origins:
                raise ValueError("Production requires DEBUG=false and explicit CORS origins")
            if not self.frontend_url.startswith("https://"):
                raise ValueError("Production FRONTEND_URL must use HTTPS")
        return self

    @property
    def origins(self) -> list[str]:
        return [s.strip() for s in self.cors_origins.split(",") if s.strip()]

    @property
    def secure_cookies(self) -> bool:
        return self.app_env == "production"
