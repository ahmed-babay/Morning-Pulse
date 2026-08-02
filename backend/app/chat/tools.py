from datetime import date
from typing import Any

from app.briefing.schemas import (
    CryptoBrief,
    CurrencyBrief,
    HolidayBrief,
    NewsBrief,
    StockBrief,
    WorldBrief,
)
from app.briefing.service import BriefingService, currency_window
from app.chat.schemas import ChatLocation
from app.core.errors import ApiError
from app.weather.schemas import Weather
from app.weather.service import WeatherService

_NEWS_CATEGORIES = {"world", "technology", "science", "business"}

TOOLS: list[dict[str, Any]] = [
    {
        "functionDeclarations": [
            {
                "name": "get_crypto_markets",
                "description": (
                    "Get current cryptocurrency prices and 24h change for Bitcoin, "
                    "Ethereum, Solana, and Cardano."
                ),
                "parameters": {"type": "object", "properties": {}},
            },
            {
                "name": "get_stock_market",
                "description": (
                    "Get current stock prices for a watchlist of large-cap US stocks, "
                    "plus today's top gainers and losers."
                ),
                "parameters": {"type": "object", "properties": {}},
            },
            {
                "name": "get_currency_rates",
                "description": "Get current foreign exchange rates against a base currency.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "base": {
                            "type": "string",
                            "description": "3-letter currency code, e.g. USD",
                        }
                    },
                },
            },
            {
                "name": "get_news",
                "description": "Get today's top news headlines for a category.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "category": {
                            "type": "string",
                            "enum": sorted(_NEWS_CATEGORIES),
                        }
                    },
                },
            },
            {
                "name": "get_world_events",
                "description": (
                    "Get recent significant earthquakes and natural events, plus "
                    "upcoming rocket launches."
                ),
                "parameters": {"type": "object", "properties": {}},
            },
            {
                "name": "get_holidays",
                "description": "Get this year's public holidays for a country.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "country": {
                            "type": "string",
                            "description": "2-letter country code, e.g. US",
                        }
                    },
                },
            },
            {
                "name": "get_weather",
                "description": "Get the current weather forecast for the user's saved location.",
                "parameters": {"type": "object", "properties": {}},
            },
        ]
    }
]


class ToolExecutor:
    def __init__(
        self,
        briefing: BriefingService,
        weather: WeatherService,
        location: ChatLocation | None,
    ) -> None:
        self._briefing = briefing
        self._weather = weather
        self._location = location

    async def call(self, name: str, args: dict[str, Any]) -> dict[str, Any]:
        try:
            return await self._dispatch(name, args)
        except ApiError as exc:
            return {"error": exc.message}

    async def _dispatch(self, name: str, args: dict[str, Any]) -> dict[str, Any]:
        if name == "get_crypto_markets":
            return _summarize_crypto(await self._briefing.crypto())
        if name == "get_stock_market":
            return _summarize_stocks(await self._briefing.stocks())
        if name == "get_currency_rates":
            base = str(args.get("base") or "USD").upper()
            start, end = currency_window(1)
            symbols = [code for code in ("EUR", "GBP", "JPY", "CAD", "EGP") if code != base]
            brief = await self._briefing.currencies(base, symbols, start, end)
            return _summarize_currencies(brief)
        if name == "get_news":
            category = str(args.get("category") or "world")
            if category not in _NEWS_CATEGORIES:
                category = "world"
            return _summarize_news(await self._briefing.news(category, 8))
        if name == "get_world_events":
            return _summarize_world(await self._briefing.world())
        if name == "get_holidays":
            country = str(args.get("country") or "US").upper()
            return _summarize_holidays(await self._briefing.holidays(country, date.today().year))
        if name == "get_weather":
            if self._location is None:
                return {"error": "The user hasn't set a location in the app."}
            weather = await self._weather.get_weather(
                self._location.latitude,
                self._location.longitude,
                name=self._location.name,
            )
            return _summarize_weather(weather)
        return {"error": f"Unknown tool: {name}"}


def _summarize_crypto(brief: CryptoBrief) -> dict[str, Any]:
    return {
        "assets": [
            {
                "symbol": asset.symbol,
                "name": asset.name,
                "price_usd": asset.price_usd,
                "change_24h_pct": round(asset.change_24h, 2),
            }
            for asset in brief.assets
        ],
        "top_gainer": (
            {
                "name": brief.top_gainers[0].name,
                "change_24h_pct": round(brief.top_gainers[0].change_24h, 2),
            }
            if brief.top_gainers
            else None
        ),
    }


def _summarize_stocks(brief: StockBrief) -> dict[str, Any]:
    def compact(assets: list[Any]) -> list[dict[str, Any]]:
        return [
            {
                "symbol": asset.symbol,
                "name": asset.name,
                "price_usd": asset.price_usd,
                "change_pct": round(asset.change_pct, 2),
            }
            for asset in assets
        ]

    return {
        "watchlist": compact(brief.assets),
        "top_gainers": compact(brief.top_gainers),
        "top_losers": compact(brief.top_losers),
    }


def _summarize_currencies(brief: CurrencyBrief) -> dict[str, Any]:
    return {
        "base": brief.base,
        "date": brief.date.isoformat(),
        "rates": [{"code": rate.code, "rate": rate.rate} for rate in brief.rates],
    }


def _summarize_news(brief: NewsBrief) -> dict[str, Any]:
    return {
        "headlines": [
            {
                "title": item.title,
                "source": item.source,
                "summary": item.summary,
                "url": str(item.url),
            }
            for item in brief.items
        ]
    }


def _summarize_world(brief: WorldBrief) -> dict[str, Any]:
    return {
        "events": [
            {"kind": event.kind, "title": event.title, "magnitude": event.magnitude}
            for event in brief.events[:8]
        ],
        "upcoming_launches": [
            {
                "name": launch.name,
                "status": launch.status,
                "window_start": launch.window_start.isoformat(),
                "location": launch.location,
            }
            for launch in brief.launches
        ],
    }


def _summarize_holidays(brief: HolidayBrief) -> dict[str, Any]:
    return {
        "holidays": [
            {
                "date": holiday.date.isoformat(),
                "name": holiday.name,
                "local_name": holiday.local_name,
            }
            for holiday in brief.holidays[:15]
        ]
    }


def _summarize_weather(weather: Weather) -> dict[str, Any]:
    return {
        "location": weather.location.name,
        "temperature_c": weather.current.temperature,
        "feels_like_c": weather.current.apparent_temperature,
        "condition": weather.current.condition,
        "humidity_pct": weather.current.humidity,
        "wind_speed_kmh": weather.current.wind_speed,
        "today_high_c": weather.today.temperature_max,
        "today_low_c": weather.today.temperature_min,
    }
