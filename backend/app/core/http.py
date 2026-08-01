import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import httpx

from app.core.config import HttpClientSettings

_RETRYABLE_STATUS_CODES = frozenset({429, 500, 502, 503, 504})


class HttpClient:
    """Application-scoped HTTP client with conservative retries."""

    def __init__(self, client: httpx.AsyncClient, settings: HttpClientSettings) -> None:
        self._client = client
        self._settings = settings

    async def get(self, url: str, **kwargs: Any) -> httpx.Response:
        return await self._request("GET", url, **kwargs)

    async def post(self, url: str, **kwargs: Any) -> httpx.Response:
        return await self._request("POST", url, **kwargs)

    async def _request(self, method: str, url: str, **kwargs: Any) -> httpx.Response:
        attempts = self._settings.retry_attempts
        for attempt in range(attempts):
            try:
                response = await self._client.request(method, url, **kwargs)
            except (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout):
                if attempt + 1 == attempts:
                    raise
            else:
                if response.status_code not in _RETRYABLE_STATUS_CODES or attempt + 1 == attempts:
                    return response
                await response.aclose()
            await asyncio.sleep(self._backoff(attempt))
        raise RuntimeError("retry loop exhausted")

    async def aclose(self) -> None:
        await self._client.aclose()

    def _backoff(self, attempt: int) -> float:
        return float(self._settings.retry_backoff_seconds * (2**attempt))


def build_http_client(
    settings: HttpClientSettings, *, transport: httpx.AsyncBaseTransport | None = None
) -> HttpClient:
    timeout = httpx.Timeout(
        connect=settings.connect_timeout_seconds,
        read=settings.read_timeout_seconds,
        write=settings.write_timeout_seconds,
        pool=settings.pool_timeout_seconds,
    )
    limits = httpx.Limits(
        max_connections=settings.max_connections,
        max_keepalive_connections=settings.max_keepalive_connections,
    )
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        )
    }
    client = httpx.AsyncClient(timeout=timeout, limits=limits, headers=headers, transport=transport)
    return HttpClient(client, settings)


@asynccontextmanager
async def http_client_lifespan(
    settings: HttpClientSettings,
) -> AsyncIterator[HttpClient]:
    client = build_http_client(settings)
    try:
        yield client
    finally:
        await client.aclose()
