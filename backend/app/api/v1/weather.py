from typing import Annotated

from fastapi import APIRouter, Query, Request

from app.core.errors import DataEnvelope
from app.core.request_context import get_request_id
from app.weather.schemas import LocationSearchResult, Weather
from app.weather.service import WeatherService

router = APIRouter(prefix="/weather", tags=["weather"])


def get_weather_service(request: Request) -> WeatherService:
    return request.app.state.weather_service  # type: ignore[no-any-return]


@router.get("", response_model=DataEnvelope[Weather])
async def weather(
    request: Request,
    latitude: Annotated[float, Query(ge=-90, le=90)],
    longitude: Annotated[float, Query(ge=-180, le=180)],
    name: Annotated[str, Query(min_length=1, max_length=100)] = "Your location",
    country: Annotated[str, Query(max_length=100)] = "",
) -> DataEnvelope[Weather]:
    data = await get_weather_service(request).get_weather(
        latitude, longitude, name=name, country=country
    )
    return DataEnvelope(data=data, request_id=get_request_id())


@router.get("/search", response_model=DataEnvelope[list[LocationSearchResult]])
async def search_locations(
    request: Request,
    query: Annotated[str, Query(min_length=2, max_length=80)],
) -> DataEnvelope[list[LocationSearchResult]]:
    data = await get_weather_service(request).search(query.strip())
    return DataEnvelope(data=data, request_id=get_request_id())
