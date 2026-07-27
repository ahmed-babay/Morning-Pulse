import json
from typing import Literal

import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.cache import AsyncTTLCache
from app.core.config import HttpClientSettings, RateLimitSettings, Settings, WeatherSettings
from app.core.http import HttpClient, build_http_client
from app.main import create_app
from app.weather.client import OpenMeteoClient
from app.weather.schemas import LocationSearchResult, Weather
from app.weather.service import WeatherService


@pytest.fixture
def anyio_backend() -> Literal["asyncio"]:
    return "asyncio"


def forecast_payload() -> dict[str, object]:
    times = [f"2026-07-27T{hour:02d}:00" for hour in range(8, 20)]
    return {
        "latitude": 30.05,
        "longitude": 31.25,
        "timezone": "Africa/Cairo",
        "current": {
            "time": "2026-07-27T08:00",
            "temperature_2m": 28.4,
            "relative_humidity_2m": 51,
            "apparent_temperature": 29.2,
            "is_day": 1,
            "weather_code": 0,
            "wind_speed_10m": 12.6,
        },
        "hourly": {
            "time": times,
            "temperature_2m": [28.0 + index for index in range(12)],
            "weather_code": [0] * 12,
            "precipitation_probability": [0] * 12,
        },
        "daily": {
            "time": ["2026-07-27", "2026-07-28"],
            "temperature_2m_max": [36.0, 37.0],
            "temperature_2m_min": [24.0, 25.0],
            "sunrise": ["2026-07-27T06:11", "2026-07-28T06:12"],
            "sunset": ["2026-07-27T19:50", "2026-07-28T19:49"],
        },
    }


def make_service(handler: httpx.AsyncBaseTransport) -> tuple[WeatherService, HttpClient]:
    http = build_http_client(HttpClientSettings(retry_attempts=1), transport=handler)
    service = WeatherService(
        OpenMeteoClient(http, WeatherSettings()),
        AsyncTTLCache[Weather](max_size=8, ttl_seconds=600, stale_seconds=3600),
        AsyncTTLCache[list[LocationSearchResult]](max_size=8, ttl_seconds=600, stale_seconds=3600),
    )
    return service, http


@pytest.mark.anyio
async def test_weather_endpoint_normalizes_open_meteo_response() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["timezone"] == "auto"
        return httpx.Response(200, json=forecast_payload())

    service, http = make_service(httpx.MockTransport(handler))
    app = create_app(Settings(rate_limit=RateLimitSettings(enabled=False)))
    app.state.weather_service = service

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/weather",
            params={"latitude": 30.05, "longitude": 31.25, "name": "Cairo", "country": "Egypt"},
        )
    await http.aclose()

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["location"]["name"] == "Cairo"
    assert data["current"]["condition"] == "Clear sky"
    assert data["current"]["humidity"] == 51
    assert len(data["hourly"]) == 12
    assert data["today"]["sunrise"] == "2026-07-27T06:11:00"


@pytest.mark.anyio
async def test_location_search_is_typed_and_cached() -> None:
    calls = 0

    async def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(
            200,
            json={
                "results": [
                    {
                        "id": 360630,
                        "name": "Cairo",
                        "latitude": 30.0626,
                        "longitude": 31.2497,
                        "country": "Egypt",
                        "admin1": "Cairo",
                        "timezone": "Africa/Cairo",
                    }
                ]
            },
        )

    service, http = make_service(httpx.MockTransport(handler))
    try:
        first = await service.search("Cairo")
        second = await service.search("Cairo")
    finally:
        await http.aclose()

    assert first == second
    assert first[0].timezone == "Africa/Cairo"
    assert calls == 1


@pytest.mark.anyio
async def test_provider_failure_uses_normalized_error() -> None:
    transport = httpx.MockTransport(lambda _request: httpx.Response(503, text="unavailable"))
    service, http = make_service(transport)
    app = create_app(Settings(rate_limit=RateLimitSettings(enabled=False)))
    app.state.weather_service = service

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/weather", params={"latitude": 30.05, "longitude": 31.25}
        )
    await http.aclose()

    assert response.status_code == 502
    assert response.json()["error"]["code"] == "weather_provider_error"
    assert "unavailable" not in json.dumps(response.json())
