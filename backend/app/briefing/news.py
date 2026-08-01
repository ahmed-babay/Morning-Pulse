import asyncio
import hashlib
import re
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse
from xml.etree import ElementTree

import httpx
from pydantic import HttpUrl, ValidationError

from app.briefing.provider import ProviderSupport
from app.briefing.schemas import NewsBrief, NewsItem
from app.core.config import DataProviderSettings
from app.core.errors import ApiError

_FEEDS: dict[str, tuple[str, ...]] = {
    "world": ("https://feeds.bbci.co.uk/news/world/rss.xml",),
    "technology": ("https://feeds.arstechnica.com/arstechnica/technology-lab",),
    "science": ("https://www.nasa.gov/news-release/feed/",),
    "business": ("https://feeds.bbci.co.uk/news/business/rss.xml",),
}
_HTML = re.compile(r"<[^>]+>")
_MEDIA_NS = "{http://search.yahoo.com/mrss/}"


class NewsService:
    def __init__(self, provider: ProviderSupport, settings: DataProviderSettings) -> None:
        self._provider = provider
        self._max_feed_bytes = settings.max_feed_bytes

    async def get(self, category: str, limit: int) -> NewsBrief:
        feeds = _FEEDS.get(category)
        if feeds is None:
            raise ApiError(422, "unsupported_category", "Unknown news category")

        async def load() -> NewsBrief:
            results = await asyncio.gather(
                *(self._feed(url, category) for url in feeds),
                return_exceptions=True,
            )
            items: list[NewsItem] = []
            for result in results:
                if not isinstance(result, BaseException):
                    items.extend(result)
            if not items and results:
                raise ApiError(
                    502,
                    "news_provider_error",
                    "News feeds are temporarily unavailable",
                )
            deduped = {item.id: item for item in items}
            ordered = sorted(
                deduped.values(),
                key=lambda item: item.published_at or datetime.min.replace(tzinfo=UTC),
                reverse=True,
            )
            return NewsBrief(items=ordered[:limit])

        return await self._provider.cached(f"news:{category}:{limit}", load)

    async def _feed(self, url: str, category: str) -> list[NewsItem]:
        try:
            response = await self._provider.http.get(
                url,
                headers={"Accept": "application/rss+xml"},
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise ApiError(
                502,
                "news_provider_error",
                "A news feed is unavailable",
            ) from exc
        content = response.content
        if len(content) > self._max_feed_bytes or b"<!DOCTYPE" in content.upper():
            raise ApiError(502, "unsafe_feed", "A news feed was rejected")
        try:
            root = ElementTree.fromstring(content)
        except ElementTree.ParseError as exc:
            raise ApiError(502, "invalid_feed", "A news feed was invalid") from exc
        source = _text(root.find(".//channel/title")) or urlparse(url).hostname or "Publisher"
        return _items(root, source, category)


def _items(
    root: ElementTree.Element,
    source: str,
    category: str,
) -> list[NewsItem]:
    items: list[NewsItem] = []
    for node in root.findall(".//item")[:30]:
        title = _text(node.find("title"))
        link = _text(node.find("link"))
        if not title or not link or urlparse(link).scheme != "https":
            continue
        identity = hashlib.sha256(f"{title.casefold()}|{link}".encode()).hexdigest()[:20]
        try:
            items.append(
                NewsItem(
                    id=identity,
                    title=title,
                    url=HttpUrl(link),
                    source=source,
                    category=category,
                    published_at=_feed_date(_text(node.find("pubDate"))),
                    summary=_clean(_text(node.find("description")))[:280],
                    image=_image(node),
                )
            )
        except ValidationError:
            continue
    return items


def _image(node: ElementTree.Element) -> HttpUrl | None:
    thumbnail = node.find(f"{_MEDIA_NS}thumbnail")
    if thumbnail is not None:
        url = _safe_https_url(thumbnail.get("url"))
        if url is not None:
            return url

    content = node.find(f"{_MEDIA_NS}content")
    if content is not None:
        nested = content.find(f"{_MEDIA_NS}thumbnail")
        if nested is not None:
            url = _safe_https_url(nested.get("url"))
            if url is not None:
                return url
        if (content.get("type") or "").startswith("image"):
            url = _safe_https_url(content.get("url"))
            if url is not None:
                return url

    enclosure = node.find("enclosure")
    if enclosure is not None and (enclosure.get("type") or "").startswith("image"):
        return _safe_https_url(enclosure.get("url"))

    return None


def _safe_https_url(value: str | None) -> HttpUrl | None:
    if not value or urlparse(value).scheme != "https":
        return None
    try:
        return HttpUrl(value)
    except ValidationError:
        return None


def _text(node: ElementTree.Element | None) -> str:
    return "".join(node.itertext()).strip() if node is not None else ""


def _clean(value: str) -> str:
    return " ".join(_HTML.sub(" ", value).split())


def _feed_date(value: str) -> datetime | None:
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
        return parsed.replace(tzinfo=parsed.tzinfo or UTC)
    except (TypeError, ValueError):
        return None
