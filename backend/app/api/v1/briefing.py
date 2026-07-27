from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query, Request

from app.briefing.schemas import (
    Apod,
    CryptoBrief,
    CurrencyBrief,
    HolidayBrief,
    Launch,
    NewsBrief,
    WorldBrief,
)
from app.briefing.service import BriefingService, currency_window
from app.core.errors import DataEnvelope
from app.core.request_context import get_request_id

router = APIRouter(tags=["briefing"])


def service(request: Request) -> BriefingService:
    return request.app.state.briefing_service  # type: ignore[no-any-return]


@router.get("/crypto", response_model=DataEnvelope[CryptoBrief])
async def crypto(request: Request) -> DataEnvelope[CryptoBrief]:
    return DataEnvelope(data=await service(request).crypto(), request_id=get_request_id())


@router.get("/currencies", response_model=DataEnvelope[CurrencyBrief])
async def currencies(
    request: Request,
    base: Annotated[str, Query(pattern=r"^[A-Za-z]{3}$")] = "USD",
    symbols: Annotated[str, Query(max_length=80)] = "EUR,GBP,JPY,CAD,EGP",
    days: Annotated[int, Query(ge=1, le=90)] = 14,
) -> DataEnvelope[CurrencyBrief]:
    start, end = currency_window(days)
    data = await service(request).currencies(base, symbols.split(","), start, end)
    return DataEnvelope(data=data, request_id=get_request_id())


@router.get("/news", response_model=DataEnvelope[NewsBrief])
async def news(
    request: Request,
    category: Annotated[str, Query(pattern=r"^(world|technology|science|business)$")] = "world",
    limit: Annotated[int, Query(ge=1, le=30)] = 12,
) -> DataEnvelope[NewsBrief]:
    return DataEnvelope(
        data=await service(request).news(category, limit),
        request_id=get_request_id(),
    )


@router.get("/holidays", response_model=DataEnvelope[HolidayBrief])
async def holidays(
    request: Request,
    country: Annotated[str, Query(pattern=r"^[A-Za-z]{2}$")] = "EG",
    year: Annotated[int, Query(ge=1970, le=2100)] = date.today().year,
) -> DataEnvelope[HolidayBrief]:
    return DataEnvelope(
        data=await service(request).holidays(country, year),
        request_id=get_request_id(),
    )


@router.get("/world", response_model=DataEnvelope[WorldBrief])
async def world(request: Request) -> DataEnvelope[WorldBrief]:
    return DataEnvelope(data=await service(request).world(), request_id=get_request_id())


@router.get("/world/launches", response_model=DataEnvelope[list[Launch]])
async def launches(request: Request) -> DataEnvelope[list[Launch]]:
    return DataEnvelope(
        data=(await service(request).world()).launches,
        request_id=get_request_id(),
    )


@router.get("/world/apod", response_model=DataEnvelope[Apod | None])
async def apod(request: Request) -> DataEnvelope[Apod | None]:
    return DataEnvelope(
        data=(await service(request).world()).apod,
        request_id=get_request_id(),
    )
