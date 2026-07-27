import json
import logging
from datetime import UTC, datetime
from typing import Any

from app.core.request_context import get_request_id

_STANDARD_RECORD_FIELDS = set(logging.makeLogRecord({}).__dict__) | {"message", "asctime"}
_REDACTED_FIELDS = frozenset(
    {"authorization", "cookie", "password", "secret", "token", "api_key", "apikey"}
)


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": get_request_id(),
        }
        extras = {
            key: value
            for key, value in record.__dict__.items()
            if key not in _STANDARD_RECORD_FIELDS and not _is_sensitive(key)
        }
        if extras:
            payload["context"] = extras
        if record.exc_info:
            payload["exception"] = (
                record.exc_info[0].__name__ if record.exc_info[0] else "Exception"
            )
        return json.dumps(payload, default=str, separators=(",", ":"))


def configure_logging(level: str) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level.upper())


def _is_sensitive(key: str) -> bool:
    normalized = key.lower().replace("-", "_")
    return any(field in normalized for field in _REDACTED_FIELDS)
