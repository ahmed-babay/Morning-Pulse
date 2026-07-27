from functools import lru_cache

from pydantic import BaseModel, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class HttpClientSettings(BaseModel):
    connect_timeout_seconds: float = Field(default=2.0, gt=0)
    read_timeout_seconds: float = Field(default=5.0, gt=0)
    write_timeout_seconds: float = Field(default=5.0, gt=0)
    pool_timeout_seconds: float = Field(default=2.0, gt=0)
    max_connections: int = Field(default=100, gt=0)
    max_keepalive_connections: int = Field(default=20, ge=0)
    retry_attempts: int = Field(default=3, ge=1, le=10)
    retry_backoff_seconds: float = Field(default=0.1, ge=0)


class RateLimitSettings(BaseModel):
    enabled: bool = True
    requests: int = Field(default=120, gt=0)
    window_seconds: int = Field(default=60, gt=0)
    max_clients: int = Field(default=10_000, gt=0)
    client_id_header: str = "X-Client-ID"


class ProviderSettings(BaseModel):
    base_url: str = ""
    api_key: SecretStr | None = Field(default=None, repr=False)


class Settings(BaseSettings):
    app_name: str = "Morning Pulse API"
    environment: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:5173"]
    log_level: str = "INFO"
    http: HttpClientSettings = HttpClientSettings()
    rate_limit: RateLimitSettings = RateLimitSettings()
    providers: dict[str, ProviderSettings] = {}

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
