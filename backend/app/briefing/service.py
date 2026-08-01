from datetime import date
from typing import Any

from app.briefing.crypto import CryptoService
from app.briefing.currencies import CurrencyService, currency_window
from app.briefing.holidays import HolidayService
from app.briefing.news import NewsService
from app.briefing.provider import ProviderSupport
from app.briefing.schemas import (
    CryptoBrief,
    CurrencyBrief,
    HolidayBrief,
    NewsBrief,
    StockBrief,
    WorldBrief,
)
from app.briefing.stocks import StockService
from app.briefing.world import WorldService
from app.core.cache import AsyncTTLCache
from app.core.config import DataProviderSettings
from app.core.http import HttpClient

__all__ = ["BriefingService", "currency_window"]


class BriefingService:
    """Thin API-facing facade over focused provider domains."""

    def __init__(
        self,
        http: HttpClient,
        settings: DataProviderSettings,
        cache: AsyncTTLCache[Any],
    ) -> None:
        provider = ProviderSupport(http, cache)
        self._crypto = CryptoService(provider, settings)
        self._stocks = StockService(provider, settings)
        self._currencies = CurrencyService(provider, settings)
        self._news = NewsService(provider, settings)
        self._holidays = HolidayService(provider, settings)
        self._world = WorldService(provider, settings)

    async def crypto(self) -> CryptoBrief:
        return await self._crypto.get()

    async def stocks(self) -> StockBrief:
        return await self._stocks.get()

    async def currencies(
        self,
        base: str,
        symbols: list[str],
        start: date,
        end: date,
    ) -> CurrencyBrief:
        return await self._currencies.get(base, symbols, start, end)

    async def news(self, category: str, limit: int) -> NewsBrief:
        return await self._news.get(category, limit)

    async def holidays(self, country: str, year: int) -> HolidayBrief:
        return await self._holidays.get(country, year)

    async def world(self) -> WorldBrief:
        return await self._world.get()
