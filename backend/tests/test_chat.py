import json
from typing import Literal

import httpx
import pytest
from pydantic import SecretStr

from app.briefing.provider import ProviderSupport
from app.briefing.service import BriefingService
from app.chat.schemas import ChatLocation, ChatMessage, ChatRequest
from app.chat.service import ChatService
from app.chat.tools import ToolExecutor
from app.core.cache import AsyncTTLCache
from app.core.config import (
    ChatSettings,
    DataProviderSettings,
    HttpClientSettings,
    WeatherSettings,
)
from app.core.errors import ApiError
from app.core.http import HttpClient, build_http_client
from app.weather.client import OpenMeteoClient
from app.weather.schemas import LocationSearchResult, Weather
from app.weather.service import WeatherService


@pytest.fixture
def anyio_backend() -> Literal["asyncio"]:
    return "asyncio"


def service_with(handler: httpx.AsyncBaseTransport, api_key: str | None) -> ChatService:
    http = build_http_client(HttpClientSettings(retry_attempts=1), transport=handler)
    return _service(http, api_key)


def _service(http: HttpClient, api_key: str | None) -> ChatService:
    provider = ProviderSupport(http, AsyncTTLCache[object](max_size=1, ttl_seconds=0))
    settings = ChatSettings(gemini_api_key=SecretStr(api_key) if api_key else None)
    briefing = BriefingService(
        http,
        DataProviderSettings(),
        AsyncTTLCache[object](max_size=16, ttl_seconds=600),
    )
    weather = WeatherService(
        OpenMeteoClient(http, WeatherSettings()),
        AsyncTTLCache[Weather](max_size=16, ttl_seconds=600),
        AsyncTTLCache[list[LocationSearchResult]](max_size=16, ttl_seconds=600),
    )
    return ChatService(provider, settings, briefing, weather)


def sse(*payloads: dict[str, object]) -> bytes:
    return b"".join(f"data: {json.dumps(payload)}\n\n".encode() for payload in payloads)


@pytest.mark.anyio
async def test_stream_reply_requires_an_api_key() -> None:
    service = service_with(httpx.MockTransport(lambda _r: httpx.Response(200, content=b"")), None)

    with pytest.raises(ApiError) as excinfo:
        await service.stream_reply(ChatRequest(messages=[ChatMessage(role="user", content="hi")]))

    assert excinfo.value.code == "chat_not_configured"


@pytest.mark.anyio
async def test_stream_reply_rejects_an_oversized_conversation() -> None:
    http = build_http_client(HttpClientSettings(retry_attempts=1))
    service = _service(http, "key")
    service._settings = ChatSettings(gemini_api_key=SecretStr("key"), max_messages=1)

    with pytest.raises(ApiError) as excinfo:
        await service.stream_reply(
            ChatRequest(
                messages=[
                    ChatMessage(role="user", content="one"),
                    ChatMessage(role="user", content="two"),
                ]
            )
        )

    assert excinfo.value.code == "conversation_too_long"


@pytest.mark.anyio
async def test_stream_reply_yields_text_deltas_without_tools() -> None:
    body = sse(
        {"candidates": [{"content": {"parts": [{"text": "Hello"}]}}]},
        {"candidates": [{"content": {"parts": [{"text": ", world!"}]}}]},
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-goog-api-key"] == "key"
        assert request.url.params["alt"] == "sse"
        return httpx.Response(200, content=body)

    service = service_with(httpx.MockTransport(handler), "key")

    stream = await service.stream_reply(
        ChatRequest(messages=[ChatMessage(role="user", content="Hi")])
    )
    chunks = [chunk async for chunk in stream]

    assert "".join(chunks) == "Hello, world!"


@pytest.mark.anyio
async def test_stream_reply_calls_a_tool_and_grounds_the_final_answer() -> None:
    function_call_body = sse(
        {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "functionCall": {
                                    "name": "get_crypto_markets",
                                    "args": {},
                                    "id": "c1",
                                },
                                "thoughtSignature": "sig-123",
                            }
                        ]
                    }
                }
            ]
        }
    )
    final_answer_body = sse(
        {"candidates": [{"content": {"parts": [{"text": "Bitcoin is at $64,888."}]}}]},
    )
    crypto_payload = [
        {
            "id": "bitcoin",
            "symbol": "btc",
            "name": "Bitcoin",
            "current_price": 64888,
            "price_change_percentage_24h": 0.4,
            "market_cap": 1_000_000,
            "sparkline_in_7d": {"price": [64000, 64500, 64888]},
        }
    ]

    call_count = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        if "generativelanguage" in request.url.host:
            call_count += 1
            if call_count == 1:
                return httpx.Response(200, content=function_call_body)
            body = json.loads(request.content)
            function_response = body["contents"][-1]["parts"][0]["functionResponse"]
            assert function_response["name"] == "get_crypto_markets"
            assert function_response["id"] == "c1"
            assert function_response["response"]["assets"][0]["symbol"] == "BTC"
            # the model's function-call turn must be echoed back verbatim
            model_turn = body["contents"][-2]
            assert model_turn["parts"][0]["thoughtSignature"] == "sig-123"
            return httpx.Response(200, content=final_answer_body)
        if "coingecko" in request.url.host:
            return httpx.Response(200, json=crypto_payload)
        raise AssertionError(f"unexpected request to {request.url}")

    service = service_with(httpx.MockTransport(handler), "key")

    stream = await service.stream_reply(
        ChatRequest(messages=[ChatMessage(role="user", content="What's bitcoin at?")])
    )
    chunks = [chunk async for chunk in stream]

    assert "".join(chunks) == "Bitcoin is at $64,888."
    assert call_count == 2


@pytest.mark.anyio
async def test_get_weather_tool_reports_when_no_location_is_set() -> None:
    http = build_http_client(HttpClientSettings(retry_attempts=1))
    service = _service(http, "key")
    executor = ToolExecutor(service._briefing, service._weather, None)

    result = await executor.call("get_weather", {})

    assert "error" in result


@pytest.mark.anyio
async def test_get_weather_tool_uses_the_provided_location() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "latitude": 30.0,
                "longitude": 31.0,
                "timezone": "Africa/Cairo",
                "current": {
                    "time": "2026-08-02T10:00",
                    "temperature_2m": 30.0,
                    "apparent_temperature": 32.0,
                    "relative_humidity_2m": 40,
                    "wind_speed_10m": 10.0,
                    "weather_code": 0,
                    "is_day": 1,
                },
                "hourly": {
                    "time": ["2026-08-02T10:00"],
                    "temperature_2m": [30.0],
                    "weather_code": [0],
                    "precipitation_probability": [0],
                },
                "daily": {
                    "time": ["2026-08-02"],
                    "temperature_2m_max": [34.0],
                    "temperature_2m_min": [24.0],
                    "sunrise": ["2026-08-02T05:00"],
                    "sunset": ["2026-08-02T19:00"],
                },
            },
        )

    http = build_http_client(
        HttpClientSettings(retry_attempts=1), transport=httpx.MockTransport(handler)
    )
    service = _service(http, "key")
    location = ChatLocation(latitude=30.0, longitude=31.0, name="Cairo")
    executor = ToolExecutor(service._briefing, service._weather, location)

    result = await executor.call("get_weather", {})

    assert result["location"] == "Cairo"
    assert result["temperature_c"] == 30.0
