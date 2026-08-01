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


class WeatherSettings(BaseModel):
    forecast_url: str = "https://api.open-meteo.com/v1/forecast"
    geocoding_url: str = "https://geocoding-api.open-meteo.com/v1/search"
    cache_ttl_seconds: int = Field(default=600, ge=0)
    cache_stale_seconds: int = Field(default=3600, ge=0)
    search_cache_ttl_seconds: int = Field(default=86400, ge=0)


class DataProviderSettings(BaseModel):
    coingecko_url: str = "https://api.coingecko.com/api/v3"
    frankfurter_url: str = "https://api.frankfurter.dev/v1"
    nager_url: str = "https://date.nager.at/api/v3"
    usgs_url: str = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary"
    eonet_url: str = "https://eonet.gsfc.nasa.gov/api/v3"
    launches_url: str = "https://ll.thespacedevs.com/2.3.0"
    apod_url: str = "https://api.nasa.gov/planetary/apod"
    yahoo_finance_url: str = "https://query1.finance.yahoo.com"
    nasa_api_key: str = "DEMO_KEY"
    cache_ttl_seconds: int = Field(default=900, ge=0)
    cache_stale_seconds: int = Field(default=3600, ge=0)
    max_feed_bytes: int = Field(default=1_000_000, ge=1024)


class GitHubSettings(BaseModel):
    token: SecretStr | None = Field(default=None, repr=False)
    api_url: str = "https://api.github.com"
    cache_ttl_seconds: int = Field(default=60, ge=0)
    cache_stale_seconds: int = Field(default=600, ge=0)


class Settings(BaseSettings):
    app_name: str = "Morning Pulse API"
    environment: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:5173"]
    log_level: str = "INFO"
    http: HttpClientSettings = HttpClientSettings()
    rate_limit: RateLimitSettings = RateLimitSettings()
    weather: WeatherSettings = WeatherSettings()
    data: DataProviderSettings = DataProviderSettings()
    github: GitHubSettings = GitHubSettings()
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
