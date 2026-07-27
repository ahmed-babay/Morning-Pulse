import asyncio
from collections import OrderedDict
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from time import monotonic


@dataclass(frozen=True, slots=True)
class _Entry[T]:
    value: T
    expires_at: float
    stale_until: float


class AsyncTTLCache[T]:
    """Bounded TTL cache with stale-on-error and per-key request coalescing."""

    def __init__(
        self,
        *,
        max_size: int,
        ttl_seconds: float,
        stale_seconds: float = 0,
        clock: Callable[[], float] = monotonic,
    ) -> None:
        if max_size < 1 or ttl_seconds < 0 or stale_seconds < 0:
            raise ValueError("cache limits and durations must be non-negative")
        self._max_size = max_size
        self._ttl = ttl_seconds
        self._stale = stale_seconds
        self._clock = clock
        self._entries: OrderedDict[str, _Entry[T]] = OrderedDict()
        self._inflight: dict[str, asyncio.Task[T]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str, *, allow_stale: bool = False) -> T | None:
        async with self._lock:
            entry = self._entries.get(key)
            if entry is None:
                return None
            now = self._clock()
            if now <= entry.expires_at or (allow_stale and now <= entry.stale_until):
                self._entries.move_to_end(key)
                return entry.value
            if now > entry.stale_until:
                del self._entries[key]
            return None

    async def set(self, key: str, value: T) -> None:
        now = self._clock()
        async with self._lock:
            self._entries[key] = _Entry(value, now + self._ttl, now + self._ttl + self._stale)
            self._entries.move_to_end(key)
            while len(self._entries) > self._max_size:
                self._entries.popitem(last=False)

    async def get_or_load(self, key: str, loader: Callable[[], Awaitable[T]]) -> T:
        fresh = await self.get(key)
        if fresh is not None:
            return fresh

        async with self._lock:
            task = self._inflight.get(key)
            if task is None:
                task = asyncio.create_task(self._load(key, loader))
                self._inflight[key] = task
        return await asyncio.shield(task)

    async def clear(self) -> None:
        async with self._lock:
            self._entries.clear()

    async def _load(self, key: str, loader: Callable[[], Awaitable[T]]) -> T:
        try:
            value = await loader()
        except Exception:
            stale = await self.get(key, allow_stale=True)
            if stale is not None:
                return stale
            raise
        else:
            await self.set(key, value)
            return value
        finally:
            async with self._lock:
                if self._inflight.get(key) is asyncio.current_task():
                    del self._inflight[key]
