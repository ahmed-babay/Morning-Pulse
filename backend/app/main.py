from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.health import router as health_router
from app.api.v1.router import router as v1_router
from app.briefing.provider import ProviderSupport
from app.briefing.service import BriefingService
from app.chat.service import ChatService
from app.core.cache import AsyncTTLCache
from app.core.config import Settings, get_settings
from app.core.errors import install_exception_handlers
from app.core.http import http_client_lifespan
from app.core.logging import configure_logging
from app.core.middleware import RateLimitMiddleware, RequestIdMiddleware, SecurityHeadersMiddleware
from app.github.service import GitHubService
from app.weather.client import OpenMeteoClient
from app.weather.schemas import LocationSearchResult, Weather
from app.weather.service import WeatherService


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        async with http_client_lifespan(app_settings.http) as http:
            application.state.http = http
            application.state.briefing_service = BriefingService(
                http,
                app_settings.data,
                AsyncTTLCache[object](
                    max_size=256,
                    ttl_seconds=app_settings.data.cache_ttl_seconds,
                    stale_seconds=app_settings.data.cache_stale_seconds,
                ),
            )
            application.state.weather_service = WeatherService(
                OpenMeteoClient(http, app_settings.weather),
                AsyncTTLCache[Weather](
                    max_size=256,
                    ttl_seconds=app_settings.weather.cache_ttl_seconds,
                    stale_seconds=app_settings.weather.cache_stale_seconds,
                ),
                AsyncTTLCache[list[LocationSearchResult]](
                    max_size=128,
                    ttl_seconds=app_settings.weather.search_cache_ttl_seconds,
                    stale_seconds=app_settings.weather.cache_stale_seconds,
                ),
            )
            application.state.github_service = GitHubService(
                ProviderSupport(
                    http,
                    AsyncTTLCache[object](
                        max_size=16,
                        ttl_seconds=app_settings.github.cache_ttl_seconds,
                        stale_seconds=app_settings.github.cache_stale_seconds,
                    ),
                ),
                app_settings.github,
            )
            application.state.chat_service = ChatService(
                ProviderSupport(http, AsyncTTLCache[object](max_size=1, ttl_seconds=0)),
                app_settings.chat,
            )
            yield

    configure_logging(app_settings.log_level)
    application = FastAPI(
        title=app_settings.app_name,
        debug=app_settings.debug,
        version="0.1.0",
        lifespan=lifespan,
    )
    application.dependency_overrides[get_settings] = lambda: app_settings
    install_exception_handlers(application)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Accept", "Content-Type", "X-Client-ID", "X-Request-ID"],
    )
    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(RateLimitMiddleware, settings=app_settings.rate_limit)
    application.add_middleware(RequestIdMiddleware)
    application.include_router(health_router)
    application.include_router(v1_router, prefix=app_settings.api_v1_prefix)
    return application


app = create_app()
