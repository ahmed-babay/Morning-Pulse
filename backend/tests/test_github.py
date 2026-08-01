from typing import Literal

import httpx
import pytest
from pydantic import SecretStr

from app.briefing.provider import ProviderSupport
from app.core.cache import AsyncTTLCache
from app.core.config import GitHubSettings, HttpClientSettings
from app.core.errors import ApiError
from app.core.http import build_http_client
from app.github.service import GitHubService


@pytest.fixture
def anyio_backend() -> Literal["asyncio"]:
    return "asyncio"


def service_with(handler: httpx.AsyncBaseTransport, token: str | None) -> GitHubService:
    http = build_http_client(HttpClientSettings(retry_attempts=1), transport=handler)
    provider = ProviderSupport(http, AsyncTTLCache[object](max_size=16, ttl_seconds=600))
    settings = GitHubSettings(token=SecretStr(token) if token else None)
    return GitHubService(provider, settings)


@pytest.mark.anyio
async def test_notifications_requires_a_token() -> None:
    service = service_with(httpx.MockTransport(lambda _r: httpx.Response(200, json=[])), None)

    with pytest.raises(ApiError) as excinfo:
        await service.notifications()

    assert excinfo.value.code == "github_not_configured"


@pytest.mark.anyio
async def test_notifications_normalizes_payload_and_builds_web_urls() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["authorization"] == "Bearer secret-token"
        return httpx.Response(
            200,
            json=[
                {
                    "id": "1",
                    "unread": True,
                    "reason": "review_requested",
                    "updated_at": "2026-07-27T20:00:00Z",
                    "subject": {
                        "title": "Fix flaky test",
                        "type": "PullRequest",
                        "url": "https://api.github.com/repos/octo/repo/pulls/42",
                    },
                    "repository": {
                        "full_name": "octo/repo",
                        "html_url": "https://github.com/octo/repo",
                    },
                }
            ],
        )

    service = service_with(httpx.MockTransport(handler), "secret-token")

    result = await service.notifications()

    assert result.unread_count == 1
    notification = result.notifications[0]
    assert notification.title == "Fix flaky test"
    assert str(notification.url) == "https://github.com/octo/repo/pull/42"


@pytest.mark.anyio
async def test_trending_works_without_a_token() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert "authorization" not in request.headers
        assert "created:>" in request.url.params["q"]
        return httpx.Response(
            200,
            json={
                "items": [
                    {
                        "id": 1,
                        "name": "hot-repo",
                        "full_name": "octo/hot-repo",
                        "description": "A very hot repo",
                        "html_url": "https://github.com/octo/hot-repo",
                        "stargazers_count": 4200,
                        "language": "Rust",
                        "owner": {"avatar_url": "https://avatars.example.com/octo.png"},
                    }
                ]
            },
        )

    service = service_with(httpx.MockTransport(handler), None)

    result = await service.trending()

    assert len(result.repositories) == 1
    repo = result.repositories[0]
    assert repo.full_name == "octo/hot-repo"
    assert repo.stars == 4200
    assert repo.language == "Rust"
