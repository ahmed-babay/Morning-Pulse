import httpx
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.core.config import WeatherSettings
from app.core.errors import ApiError
from app.core.http import HttpClient


class GeocodingResult(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    country: str = ""
    admin1: str | None = None
    timezone: str = "UTC"


class GeocodingResponse(BaseModel):
    results: list[GeocodingResult] = []


class CurrentData(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    time: str
    temperature: float = Field(alias="temperature_2m")
    apparent_temperature: float
    humidity: int = Field(alias="relative_humidity_2m")
    wind_speed: float = Field(alias="wind_speed_10m")
    weather_code: int
    is_day: int


class HourlyData(BaseModel):
    time: list[str]
    temperature_2m: list[float]
    weather_code: list[int]
    precipitation_probability: list[int]


class DailyData(BaseModel):
    time: list[str]
    temperature_2m_max: list[float]
    temperature_2m_min: list[float]
    sunrise: list[str]
    sunset: list[str]


class ForecastResponse(BaseModel):
    latitude: float
    longitude: float
    timezone: str
    current: CurrentData
    hourly: HourlyData
    daily: DailyData


class OpenMeteoClient:
    def __init__(self, http: HttpClient, settings: WeatherSettings) -> None:
        self._http = http
        self._settings = settings

    async def search(self, query: str, *, limit: int = 6) -> GeocodingResponse:
        return await self._get_model(
            self._settings.geocoding_url,
            GeocodingResponse,
            {"name": query, "count": limit, "language": "en", "format": "json"},
        )

    async def forecast(self, latitude: float, longitude: float) -> ForecastResponse:
        params: dict[str, str | int | float] = {
            "latitude": latitude,
            "longitude": longitude,
            "timezone": "auto",
            "forecast_days": 2,
            "temperature_unit": "celsius",
            "wind_speed_unit": "kmh",
            "current": (
                "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,"
                "weather_code,wind_speed_10m"
            ),
            "hourly": "temperature_2m,weather_code,precipitation_probability",
            "daily": "temperature_2m_max,temperature_2m_min,sunrise,sunset",
        }
        return await self._get_model(self._settings.forecast_url, ForecastResponse, params)

    async def _get_model[ModelT: BaseModel](
        self,
        url: str,
        model_type: type[ModelT],
        params: dict[str, str | int | float],
    ) -> ModelT:
        try:
            response = await self._http.get(url, params=params)
            response.raise_for_status()
            return model_type.model_validate(response.json())
        except httpx.TimeoutException as exc:
            raise ApiError(504, "weather_provider_timeout", "Weather provider timed out") from exc
        except (httpx.HTTPError, ValidationError, ValueError) as exc:
            raise ApiError(
                502,
                "weather_provider_error",
                "Weather provider returned an invalid response",
            ) from exc
