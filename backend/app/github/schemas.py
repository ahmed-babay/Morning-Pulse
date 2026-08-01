from datetime import datetime

from pydantic import BaseModel, HttpUrl


class GitHubNotification(BaseModel):
    id: str
    unread: bool
    reason: str
    title: str
    type: str
    repository: str
    updated_at: datetime
    url: HttpUrl | None = None


class GitHubBrief(BaseModel):
    notifications: list[GitHubNotification]
    unread_count: int
    attribution: str = "GitHub"


class TrendingRepo(BaseModel):
    id: int
    name: str
    full_name: str
    description: str = ""
    url: HttpUrl
    stars: int
    language: str | None = None
    owner_avatar: HttpUrl | None = None


class TrendingBrief(BaseModel):
    repositories: list[TrendingRepo]
    attribution: str = "GitHub"
