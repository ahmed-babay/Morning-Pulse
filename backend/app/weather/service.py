from datetime import UTC, datetime

from app.core.cache import AsyncTTLCache
from app.core.errors import ApiError
from app.weather.client import ForecastResponse, OpenMeteoClient
from app.weather.schemas import (
    CurrentWeather,
    DailyWeather,
    HourlyWeather,
    Location,
    LocationSearchResult,
    Weather,
)

_CONDITIONS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    56: "Freezing drizzle",
    57: "Freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with hail",
}


class WeatherService:
    def __init__(
        self,
        client: OpenMeteoClient,
        weather_cache: AsyncTTLCache[Weather],
        search_cache: AsyncTTLCache[list[LocationSearchResult]],
    ) -> None:
        self._client = client
        self._weather_cache = weather_cache
        self._search_cache = search_cache

    async def get_weather(
        self,
        latitude: float,
        longitude: float,
        *,
        name: str = "Your location",
        country: str = "",
    ) -> Weather:
        key = f"{latitude:.3f}:{longitude:.3f}"
        fresh = await self._weather_cache.get(key)
        if fresh is not None:
            return fresh.model_copy(
                update={
                    "location": fresh.location.model_copy(update={"name": name, "country": country})
                }
            )

        try:
            forecast = await self._client.forecast(latitude, longitude)
            weather = self._normalize(forecast, name=name, country=country)
        except ApiError:
            stale = await self._weather_cache.get(key, allow_stale=True)
            if stale is None:
                raise
            return stale.model_copy(update={"stale": True})
        except (IndexError, ValueError) as exc:
            stale = await self._weather_cache.get(key, allow_stale=True)
            if stale is not None:
                return stale.model_copy(update={"stale": True})
            raise ApiError(
                502,
                "weather_provider_error",
                "Weather provider returned an invalid response",
            ) from exc

        await self._weather_cache.set(key, weather)
        return weather

    async def search(self, query: str) -> list[LocationSearchResult]:
        key = query.casefold().strip()

        async def load() -> list[LocationSearchResult]:
            response = await self._client.search(query)
            return [
                LocationSearchResult(
                    id=item.id,
                    name=item.name,
                    country=item.country,
                    admin_area=item.admin1,
                    latitude=item.latitude,
                    longitude=item.longitude,
                    timezone=item.timezone,
                )
                for item in response.results
            ]

        return await self._search_cache.get_or_load(key, load)

    def _normalize(self, data: ForecastResponse, *, name: str, country: str) -> Weather:
        hourly = [
            HourlyWeather(
                time=datetime.fromisoformat(time),
                temperature=temperature,
                weather_code=code,
                precipitation_probability=precipitation,
            )
            for time, temperature, code, precipitation in zip(
                data.hourly.time,
                data.hourly.temperature_2m,
                data.hourly.weather_code,
                data.hourly.precipitation_probability,
                strict=True,
            )
            if time >= data.current.time
        ][:12]
        return Weather(
            location=Location(
                name=name,
                country=country,
                latitude=data.latitude,
                longitude=data.longitude,
                timezone=data.timezone,
            ),
            current=CurrentWeather(
                temperature=data.current.temperature,
                apparent_temperature=data.current.apparent_temperature,
                humidity=data.current.humidity,
                wind_speed=data.current.wind_speed,
                weather_code=data.current.weather_code,
                condition=_CONDITIONS.get(data.current.weather_code, "Variable conditions"),
                is_day=bool(data.current.is_day),
                observed_at=datetime.fromisoformat(data.current.time),
            ),
            hourly=hourly,
            today=DailyWeather(
                date=data.daily.time[0],
                temperature_max=data.daily.temperature_2m_max[0],
                temperature_min=data.daily.temperature_2m_min[0],
                sunrise=datetime.fromisoformat(data.daily.sunrise[0]),
                sunset=datetime.fromisoformat(data.daily.sunset[0]),
            ),
            fetched_at=datetime.now(UTC),
        )
