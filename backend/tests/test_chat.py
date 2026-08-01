from typing import Literal

import httpx
import pytest
from pydantic import SecretStr

from app.briefing.provider import ProviderSupport
from app.chat.schemas import ChatMessage, ChatRequest
from app.chat.service import ChatService
from app.core.cache import AsyncTTLCache
from app.core.config import ChatSettings, HttpClientSettings
from app.core.errors import ApiError
from app.core.http import build_http_client


@pytest.fixture
def anyio_backend() -> Literal["asyncio"]:
    return "asyncio"


def service_with(handler: httpx.AsyncBaseTransport, api_key: str | None) -> ChatService:
    http = build_http_client(HttpClientSettings(retry_attempts=1), transport=handler)
    provider = ProviderSupport(http, AsyncTTLCache[object](max_size=1, ttl_seconds=0))
    settings = ChatSettings(gemini_api_key=SecretStr(api_key) if api_key else None)
    return ChatService(provider, settings)


@pytest.mark.anyio
async def test_stream_reply_requires_an_api_key() -> None:
    service = service_with(httpx.MockTransport(lambda _r: httpx.Response(200, content=b"")), None)

    with pytest.raises(ApiError) as excinfo:
        await service.stream_reply(ChatRequest(messages=[ChatMessage(role="user", content="hi")]))

    assert excinfo.value.code == "chat_not_configured"


@pytest.mark.anyio
async def test_stream_reply_rejects_an_oversized_conversation() -> None:
    http = build_http_client(HttpClientSettings(retry_attempts=1))
    provider = ProviderSupport(http, AsyncTTLCache[object](max_size=1, ttl_seconds=0))
    service = ChatService(provider, ChatSettings(gemini_api_key=SecretStr("key"), max_messages=1))

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
async def test_stream_reply_yields_text_deltas() -> None:
    sse_body = (
        b'data: {"candidates": [{"content": {"parts": [{"text": "Hello"}]}}]}\n\n'
        b'data: {"candidates": [{"content": {"parts": [{"text": ", world!"}]}}]}\n\n'
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-goog-api-key"] == "key"
        assert request.url.params["alt"] == "sse"
        return httpx.Response(200, content=sse_body)

    service = service_with(httpx.MockTransport(handler), "key")

    stream = await service.stream_reply(
        ChatRequest(messages=[ChatMessage(role="user", content="Hi")])
    )
    chunks = [chunk async for chunk in stream]

    assert "".join(chunks) == "Hello, world!"
