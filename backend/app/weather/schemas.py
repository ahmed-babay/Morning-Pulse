from datetime import datetime

from pydantic import BaseModel, Field


class Location(BaseModel):
    name: str
    country: str
    admin_area: str | None = None
    latitude: float
    longitude: float
    timezone: str


class CurrentWeather(BaseModel):
    temperature: float
    apparent_temperature: float
    humidity: int
    wind_speed: float
    weather_code: int
    condition: str
    is_day: bool
    observed_at: datetime


class HourlyWeather(BaseModel):
    time: datetime
    temperature: float
    weather_code: int
    precipitation_probability: int


class DailyWeather(BaseModel):
    date: str
    temperature_max: float
    temperature_min: float
    sunrise: datetime
    sunset: datetime


class Weather(BaseModel):
    location: Location
    current: CurrentWeather
    hourly: list[HourlyWeather]
    today: DailyWeather
    temperature_unit: str = "°C"
    wind_speed_unit: str = "km/h"
    fetched_at: datetime
    stale: bool = False


class LocationSearchResult(BaseModel):
    id: int
    name: str
    country: str
    admin_area: str | None = None
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    timezone: str
