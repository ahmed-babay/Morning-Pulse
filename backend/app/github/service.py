from typing import Any

from pydantic import HttpUrl

from app.briefing.provider import ProviderSupport, as_dict, as_list
from app.core.config import GitHubSettings
from app.core.errors import ApiError
from app.github.schemas import GitHubBrief, GitHubNotification

_WEB_PATH = {
    "Issue": "issues",
    "PullRequest": "pull",
    "Commit": "commit",
    "Release": "releases",
    "Discussion": "discussions",
}


class GitHubService:
    def __init__(self, provider: ProviderSupport, settings: GitHubSettings) -> None:
        self._provider = provider
        self._settings = settings

    async def notifications(self) -> GitHubBrief:
        token = self._settings.token
        if token is None:
            raise ApiError(
                424,
                "github_not_configured",
                "Connect a GitHub token to see notifications",
            )

        async def load() -> GitHubBrief:
            payload = await self._provider.json(
                "GitHub",
                f"{self._settings.api_url}/notifications",
                params={"per_page": 20},
                headers={
                    "Authorization": f"Bearer {token.get_secret_value()}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )
            items = [_notification(item) for item in as_list(payload)]
            return GitHubBrief(
                notifications=items,
                unread_count=sum(1 for item in items if item.unread),
            )

        return await self._provider.cached("github:notifications", load)


def _notification(item: dict[str, Any]) -> GitHubNotification:
    subject = as_dict(item.get("subject"))
    repository = as_dict(item.get("repository"))
    subject_type = str(subject.get("type", ""))
    return GitHubNotification(
        id=str(item["id"]),
        unread=bool(item.get("unread", False)),
        reason=str(item.get("reason", "")),
        title=str(subject.get("title", "")),
        type=subject_type,
        repository=str(repository.get("full_name", "")),
        updated_at=item["updated_at"],
        url=_web_url(subject_type, subject.get("url"), repository.get("html_url")),
    )


def _web_url(subject_type: str, api_url: object, repo_html_url: object) -> HttpUrl | None:
    if not isinstance(api_url, str) or not isinstance(repo_html_url, str):
        return None
    identifier = api_url.rstrip("/").rsplit("/", 1)[-1]
    path = _WEB_PATH.get(subject_type)
    if path is None:
        return HttpUrl(repo_html_url)
    return HttpUrl(f"{repo_html_url}/{path}/{identifier}")
