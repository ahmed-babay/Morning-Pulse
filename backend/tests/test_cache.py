import asyncio
from typing import Literal

import pytest

from app.core.cache import AsyncTTLCache


@pytest.fixture
def anyio_backend() -> Literal["asyncio"]:
    return "asyncio"


@pytest.mark.anyio
async def test_cache_expires_and_evicts_least_recently_used() -> None:
    now = 0.0
    cache = AsyncTTLCache[str](max_size=2, ttl_seconds=5, clock=lambda: now)
    await cache.set("a", "one")
    await cache.set("b", "two")
    assert await cache.get("a") == "one"
    await cache.set("c", "three")

    assert await cache.get("b") is None
    now = 6.0
    assert await cache.get("a") is None


@pytest.mark.anyio
async def test_cache_coalesces_loads_and_serves_stale_on_error() -> None:
    now = 0.0
    calls = 0
    cache = AsyncTTLCache[str](
        max_size=2,
        ttl_seconds=1,
        stale_seconds=10,
        clock=lambda: now,
    )

    async def load() -> str:
        nonlocal calls
        calls += 1
        await asyncio.sleep(0)
        return "value"

    results = await asyncio.gather(*(cache.get_or_load("key", load) for _ in range(5)))
    assert results == ["value"] * 5
    assert calls == 1

    now = 2.0

    async def fail() -> str:
        raise RuntimeError("provider unavailable")

    assert await cache.get_or_load("key", fail) == "value"
