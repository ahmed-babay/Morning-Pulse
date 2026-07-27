from typing import Literal

import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from app.briefing.service import BriefingService
from app.core.cache import AsyncTTLCache
from app.core.config import DataProviderSettings, HttpClientSettings, RateLimitSettings, Settings
from app.core.http import HttpClient, build_http_client
from app.main import create_app


@pytest.fixture
def anyio_backend() -> Literal["asyncio"]:
    return "asyncio"


def service_with(handler: httpx.AsyncBaseTransport) -> tuple[BriefingService, HttpClient]:
    http = build_http_client(HttpClientSettings(retry_attempts=1), transport=handler)
    return (
        BriefingService(
            http,
            DataProviderSettings(),
            AsyncTTLCache[object](max_size=16, ttl_seconds=600, stale_seconds=600),
        ),
        http,
    )


@pytest.mark.anyio
async def test_crypto_is_normalized_and_cached() -> None:
    calls = 0

    async def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(
            200,
            json=[
                {
                    "id": "bitcoin",
                    "symbol": "btc",
                    "name": "Bitcoin",
                    "current_price": 100_000,
                    "price_change_percentage_24h": 2.5,
                    "market_cap": 2_000_000,
                    "sparkline_in_7d": {"price": [90_000, 95_000, 100_000]},
                }
            ],
        )

    service, http = service_with(httpx.MockTransport(handler))
    try:
        first = await service.crypto()
        second = await service.crypto()
    finally:
        await http.aclose()

    assert first == second
    assert first.assets[0].symbol == "BTC"
    assert first.top_gainers[0].change_24h == 2.5
    assert calls == 2


@pytest.mark.anyio
async def test_rss_rejects_doctype_without_exposing_content() -> None:
    transport = httpx.MockTransport(
        lambda _request: httpx.Response(200, content=b"<!DOCTYPE foo><rss />")
    )
    service, http = service_with(transport)
    try:
        with pytest.raises(Exception, match="unavailable"):
            await service.news("world", 5)
    finally:
        await http.aclose()


@pytest.mark.anyio
async def test_briefing_endpoint_uses_normalized_envelope() -> None:
    async def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json=[
                {
                    "id": "ethereum",
                    "symbol": "eth",
                    "name": "Ethereum",
                    "current_price": 5000,
                    "price_change_percentage_24h": 1,
                    "market_cap": 100,
                    "sparkline_in_7d": {"price": [4900, 5000]},
                }
            ],
        )

    service, http = service_with(httpx.MockTransport(handler))
    app = create_app(Settings(rate_limit=RateLimitSettings(enabled=False)))
    app.state.briefing_service = service
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/crypto")
    await http.aclose()

    assert response.status_code == 200
    assert response.json()["data"]["assets"][0]["symbol"] == "ETH"
    assert response.headers["x-content-type-options"] == "nosniff"
