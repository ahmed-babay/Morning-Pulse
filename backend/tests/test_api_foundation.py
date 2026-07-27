from typing import Literal
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from app.core.config import RateLimitSettings, Settings
from app.main import create_app


@pytest.fixture
def anyio_backend() -> Literal["asyncio"]:
    return "asyncio"


@pytest.mark.anyio
async def test_errors_use_normalized_envelope() -> None:
    app = create_app(Settings(rate_limit=RateLimitSettings(enabled=False)))

    @app.get("/broken")
    async def broken() -> None:
        raise HTTPException(status_code=404, detail="Missing")

    @app.get("/unexpected")
    async def unexpected() -> None:
        raise RuntimeError("sensitive upstream detail")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/broken")
        unexpected_response = await client.get("/unexpected")

    assert response.status_code == 404
    assert response.json()["error"] == {
        "code": "http_error",
        "message": "Missing",
        "details": None,
    }
    assert response.json()["request_id"] == response.headers["X-Request-ID"]
    assert unexpected_response.status_code == 500
    assert unexpected_response.json()["error"]["code"] == "internal_error"
    assert "sensitive" not in unexpected_response.text
    assert unexpected_response.json()["request_id"] == unexpected_response.headers["X-Request-ID"]


@pytest.mark.anyio
async def test_request_id_is_validated_and_propagated() -> None:
    app = create_app(Settings(rate_limit=RateLimitSettings(enabled=False)))
    transport = ASGITransport(app=app)
    supplied = str(uuid4())

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        accepted = await client.get("/health", headers={"X-Request-ID": supplied})
        replaced = await client.get("/health", headers={"X-Request-ID": "not-safe"})

    assert accepted.headers["X-Request-ID"] == supplied
    assert UUID(replaced.headers["X-Request-ID"])
    assert replaced.headers["X-Request-ID"] != "not-safe"


@pytest.mark.anyio
async def test_rate_limit_isolated_by_client_and_has_headers() -> None:
    settings = Settings(rate_limit=RateLimitSettings(requests=1, window_seconds=60, max_clients=10))
    app = create_app(settings)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        first = await client.get("/health", headers={"X-Client-ID": "one"})
        limited = await client.get("/health", headers={"X-Client-ID": "one"})
        other = await client.get("/health", headers={"X-Client-ID": "two"})

    assert first.headers["X-RateLimit-Remaining"] == "0"
    assert limited.status_code == 429
    assert limited.json()["error"]["code"] == "rate_limit_exceeded"
    assert "Retry-After" in limited.headers
    assert other.status_code == 200
