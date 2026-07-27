import asyncio
import logging
from collections import OrderedDict, deque
from collections.abc import Awaitable, Callable
from math import ceil
from time import monotonic, perf_counter
from typing import Final

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import RateLimitSettings
from app.core.errors import ErrorDetail, ErrorEnvelope
from app.core.request_context import get_request_id, reset_request_id, set_request_id

Dispatch = Callable[[Request], Awaitable[Response]]
REQUEST_ID_HEADER: Final = "X-Request-ID"
logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Dispatch) -> Response:
        response = await call_next(request)
        response.headers.update(
            {
                "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
                "Cross-Origin-Opener-Policy": "same-origin",
                "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
                "Referrer-Policy": "no-referrer",
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
            }
        )
        return response


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Dispatch) -> Response:
        token = set_request_id(request.headers.get(REQUEST_ID_HEADER))
        started_at = perf_counter()
        try:
            try:
                response = await call_next(request)
            except Exception:
                logger.exception(
                    "Unhandled request error",
                    extra={"method": request.method, "path": request.url.path},
                )
                envelope = ErrorEnvelope(
                    error=ErrorDetail(
                        code="internal_error",
                        message="An unexpected error occurred",
                    ),
                    request_id=get_request_id(),
                )
                response = JSONResponse(status_code=500, content=envelope.model_dump())
            response.headers[REQUEST_ID_HEADER] = get_request_id()
            logger.info(
                "Request completed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": round((perf_counter() - started_at) * 1000, 2),
                },
            )
            return response
        finally:
            reset_request_id(token)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: object, *, settings: RateLimitSettings) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self._settings = settings
        self._requests: OrderedDict[str, deque[float]] = OrderedDict()
        self._lock = asyncio.Lock()

    async def dispatch(self, request: Request, call_next: Dispatch) -> Response:
        if not self._settings.enabled:
            return await call_next(request)

        now = monotonic()
        key = self._client_key(request)
        allowed, remaining, reset = await self._consume(key, now)
        headers = {
            "X-RateLimit-Limit": str(self._settings.requests),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(max(0, ceil(reset - now))),
        }
        if not allowed:
            headers["Retry-After"] = str(max(1, ceil(reset - now)))
            envelope = ErrorEnvelope(
                error=ErrorDetail(
                    code="rate_limit_exceeded",
                    message="Too many requests",
                ),
                request_id=get_request_id(),
            )
            return JSONResponse(status_code=429, content=envelope.model_dump(), headers=headers)

        response = await call_next(request)
        response.headers.update(headers)
        return response

    async def _consume(self, key: str, now: float) -> tuple[bool, int, float]:
        cutoff = now - self._settings.window_seconds
        async with self._lock:
            bucket = self._requests.setdefault(key, deque())
            self._requests.move_to_end(key)
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            reset = (
                bucket[0] + self._settings.window_seconds
                if bucket
                else now + self._settings.window_seconds
            )
            if len(bucket) >= self._settings.requests:
                return False, 0, reset

            bucket.append(now)
            reset = bucket[0] + self._settings.window_seconds
            while len(self._requests) > self._settings.max_clients:
                self._requests.popitem(last=False)
            return True, self._settings.requests - len(bucket), reset

    def _client_key(self, request: Request) -> str:
        client_id = request.headers.get(self._settings.client_id_header)
        if client_id:
            return f"client:{client_id[:128]}"
        host = request.client.host if request.client else "unknown"
        return f"ip:{host}"
