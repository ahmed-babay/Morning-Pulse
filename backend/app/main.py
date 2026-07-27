from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.health import router as health_router
from app.api.v1.router import router as v1_router
from app.core.config import Settings, get_settings
from app.core.errors import install_exception_handlers
from app.core.http import http_client_lifespan
from app.core.logging import configure_logging
from app.core.middleware import RateLimitMiddleware, RequestIdMiddleware


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        async with http_client_lifespan(app_settings.http) as http:
            application.state.http = http
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
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(RateLimitMiddleware, settings=app_settings.rate_limit)
    application.add_middleware(RequestIdMiddleware)
    application.include_router(health_router)
    application.include_router(v1_router, prefix=app_settings.api_v1_prefix)
    return application


app = create_app()
