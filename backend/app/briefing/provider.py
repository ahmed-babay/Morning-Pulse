from collections.abc import Awaitable, Callable, Mapping
from typing import Any, cast

import httpx

from app.core.cache import AsyncTTLCache
from app.core.errors import ApiError
from app.core.http import HttpClient


class ProviderSupport:
    """Shared transport, error normalization, and stale-on-error cache."""

    def __init__(self, http: HttpClient, cache: AsyncTTLCache[Any]) -> None:
        self.http = http
        self.cache = cache

    async def cached[T](self, key: str, loader: Callable[[], Awaitable[T]]) -> T:
        return cast(T, await self.cache.get_or_load(key, loader))

    async def json(
        self,
        provider: str,
        url: str,
        *,
        params: Mapping[str, str | int] | None = None,
    ) -> Any:
        try:
            response = await self.http.get(
                url,
                params=params,
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise ApiError(
                502,
                "provider_error",
                f"{provider} is temporarily unavailable",
            ) from exc


def as_dict(value: object) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def as_list(value: object) -> list[Any]:
    return value if isinstance(value, list) else []
