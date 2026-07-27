from contextvars import ContextVar, Token
from uuid import UUID, uuid4

_request_id: ContextVar[str] = ContextVar("request_id", default="")


def get_request_id() -> str:
    return _request_id.get() or str(uuid4())


def set_request_id(value: str | None) -> Token[str]:
    request_id = _valid_request_id(value) or str(uuid4())
    return _request_id.set(request_id)


def reset_request_id(token: Token[str]) -> None:
    _request_id.reset(token)


def _valid_request_id(value: str | None) -> str | None:
    if not value or len(value) > 64:
        return None
    try:
        return str(UUID(value))
    except ValueError:
        return None
