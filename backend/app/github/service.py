from datetime import date, timedelta
from typing import Any

from pydantic import HttpUrl

from app.briefing.provider import ProviderSupport, as_dict, as_list
from app.core.config import GitHubSettings
from app.core.errors import ApiError
from app.github.schemas import GitHubBrief, GitHubNotification, TrendingBrief, TrendingRepo

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

    async def trending(self) -> TrendingBrief:
        async def load() -> TrendingBrief:
            headers = {
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            }
            token = self._settings.token
            if token is not None:
                headers["Authorization"] = f"Bearer {token.get_secret_value()}"

            since = date.today() - timedelta(days=7)
            payload = await self._provider.json(
                "GitHub",
                f"{self._settings.api_url}/search/repositories",
                params={
                    "q": f"created:>{since.isoformat()}",
                    "sort": "stars",
                    "order": "desc",
                    "per_page": 10,
                },
                headers=headers,
            )
            items = as_list(as_dict(payload).get("items"))
            return TrendingBrief(repositories=[_trending_repo(item) for item in items])

        return await self._provider.cached("github:trending", load)


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


def _trending_repo(item: dict[str, Any]) -> TrendingRepo:
    owner = as_dict(item.get("owner"))
    avatar = owner.get("avatar_url")
    return TrendingRepo(
        id=int(item["id"]),
        name=str(item.get("name", "")),
        full_name=str(item.get("full_name", "")),
        description=str(item.get("description") or ""),
        url=HttpUrl(str(item["html_url"])),
        stars=int(item.get("stargazers_count") or 0),
        language=item.get("language"),
        owner_avatar=HttpUrl(str(avatar)) if isinstance(avatar, str) else None,
    )


def _web_url(subject_type: str, api_url: object, repo_html_url: object) -> HttpUrl | None:
    if not isinstance(api_url, str) or not isinstance(repo_html_url, str):
        return None
    identifier = api_url.rstrip("/").rsplit("/", 1)[-1]
    path = _WEB_PATH.get(subject_type)
    if path is None:
        return HttpUrl(repo_html_url)
    return HttpUrl(f"{repo_html_url}/{path}/{identifier}")
