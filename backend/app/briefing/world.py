import asyncio
from datetime import UTC, date, datetime, timedelta
from typing import Any

from pydantic import ValidationError

from app.briefing.provider import ProviderSupport, as_dict, as_list
from app.briefing.schemas import Apod, Launch, WorldBrief, WorldEvent
from app.core.config import DataProviderSettings


class WorldService:
    def __init__(self, provider: ProviderSupport, settings: DataProviderSettings) -> None:
        self._provider = provider
        self._settings = settings

    async def get(self) -> WorldBrief:
        async def load() -> WorldBrief:
            results: list[Any] = list(
                await asyncio.gather(
                    self._provider.json(
                        "USGS",
                        f"{self._settings.usgs_url}/all_day.geojson",
                    ),
                    self._provider.json(
                        "NASA EONET",
                        f"{self._settings.eonet_url}/events",
                        params={"status": "open", "limit": 10},
                    ),
                    self._provider.json(
                        "Launch Library 2",
                        f"{self._settings.launches_url}/launches/upcoming/",
                        params={"limit": 5, "mode": "normal"},
                    ),
                    self._provider.json(
                        "NASA APOD",
                        self._settings.apod_url,
                        params={
                            "api_key": self._settings.nasa_api_key,
                            "thumbs": "true",
                            "start_date": (date.today() - timedelta(days=9)).isoformat(),
                            "end_date": date.today().isoformat(),
                        },
                    ),
                    return_exceptions=True,
                )
            )
            earthquake, eonet, launches, apod = results
            return WorldBrief(
                events=(_earthquakes(earthquake) + _eonet(eonet))[:20],
                launches=_launches(launches),
                apod=_apod(apod),
            )

        return await self._provider.cached("world", load)


def _earthquakes(payload: object) -> list[WorldEvent]:
    if isinstance(payload, BaseException):
        return []
    events: list[WorldEvent] = []
    for feature in as_list(as_dict(payload).get("features"))[:10]:
        properties = as_dict(feature.get("properties"))
        coordinates = as_list(as_dict(feature.get("geometry")).get("coordinates"))
        timestamp = properties.get("time")
        events.append(
            WorldEvent(
                id=f"usgs:{feature.get('id')}",
                kind="earthquake",
                title=str(properties.get("title", "Earthquake")),
                occurred_at=datetime.fromtimestamp(float(timestamp) / 1000, UTC)
                if timestamp
                else None,
                url=properties.get("url"),
                longitude=float(coordinates[0]) if len(coordinates) > 1 else None,
                latitude=float(coordinates[1]) if len(coordinates) > 1 else None,
                magnitude=float(properties["mag"]) if properties.get("mag") is not None else None,
            )
        )
    return events


def _eonet(payload: object) -> list[WorldEvent]:
    if isinstance(payload, BaseException):
        return []
    return [
        WorldEvent(
            id=f"eonet:{item.get('id')}",
            kind="natural-event",
            title=str(item.get("title", "Natural event")),
            url=item.get("link"),
        )
        for item in as_list(as_dict(payload).get("events"))[:10]
    ]


def _launches(payload: object) -> list[Launch]:
    if isinstance(payload, BaseException):
        return []
    launches: list[Launch] = []
    for item in as_list(as_dict(payload).get("results"))[:5]:
        pad = as_dict(item.get("pad"))
        location = as_dict(pad.get("location"))
        image = item.get("image")
        image_url = as_dict(image).get("image_url") if isinstance(image, dict) else image
        vid_urls = item.get("vidURLs")
        webcast = (
            as_dict(vid_urls[0]).get("url") if isinstance(vid_urls, list) and vid_urls else None
        )
        try:
            launches.append(
                Launch(
                    id=str(item["id"]),
                    name=str(item["name"]),
                    status=str(as_dict(item.get("status")).get("name", "Scheduled")),
                    window_start=datetime.fromisoformat(
                        str(item["window_start"]).replace("Z", "+00:00")
                    ),
                    image=image_url,
                    webcast=webcast,
                    location=str(location.get("name") or pad.get("name") or ""),
                )
            )
        except (KeyError, ValidationError, ValueError):
            continue
    return launches


def _apod(payload: object) -> list[Apod]:
    if isinstance(payload, BaseException):
        return []
    entries = as_list(payload)
    gallery: list[Apod] = []
    for data in (as_dict(item) for item in entries):
        try:
            gallery.append(
                Apod(
                    title=str(data["title"]),
                    explanation=str(data["explanation"]),
                    date=date.fromisoformat(str(data["date"])),
                    media_type=str(data["media_type"]),
                    url=data["url"],
                    thumbnail_url=data.get("thumbnail_url"),
                    copyright=data.get("copyright"),
                )
            )
        except (KeyError, ValidationError, ValueError):
            continue
    gallery.sort(key=lambda item: item.date, reverse=True)
    return gallery
