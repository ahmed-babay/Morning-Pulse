from typing import Literal

import httpx
import pytest

from app.core.config import HttpClientSettings
from app.core.http import build_http_client


@pytest.fixture
def anyio_backend() -> Literal["asyncio"]:
    return "asyncio"


@pytest.mark.anyio
async def test_get_retries_retryable_responses() -> None:
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        status = 503 if calls < 3 else 200
        return httpx.Response(status, json={"ok": True}, request=request)

    settings = HttpClientSettings(retry_attempts=3, retry_backoff_seconds=0)
    client = build_http_client(settings, transport=httpx.MockTransport(handler))
    try:
        response = await client.get("https://provider.test/value")
    finally:
        await client.aclose()

    assert response.status_code == 200
    assert calls == 3


@pytest.mark.anyio
async def test_non_retryable_response_is_not_retried() -> None:
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(400, request=request)

    settings = HttpClientSettings(retry_attempts=3, retry_backoff_seconds=0)
    client = build_http_client(settings, transport=httpx.MockTransport(handler))
    try:
        response = await client.get("https://provider.test/value")
    finally:
        await client.aclose()

    assert response.status_code == 400
    assert calls == 1
