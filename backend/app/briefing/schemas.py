from datetime import date, datetime

from pydantic import BaseModel, HttpUrl


class PricePoint(BaseModel):
    timestamp: datetime
    value: float


class CryptoAsset(BaseModel):
    id: str
    symbol: str
    name: str
    image: HttpUrl | None = None
    price_usd: float
    change_24h: float
    market_cap: float
    sparkline: list[float]


class CryptoBrief(BaseModel):
    assets: list[CryptoAsset]
    top_gainers: list[CryptoAsset]
    attribution: str = "CoinGecko"


class StockAsset(BaseModel):
    id: str
    symbol: str
    name: str
    image: HttpUrl | None = None
    price_usd: float
    change_pct: float
    sparkline: list[float]


class StockBrief(BaseModel):
    assets: list[StockAsset]
    top_gainers: list[StockAsset]
    top_losers: list[StockAsset]
    attribution: str = "Yahoo Finance"


class CurrencyRate(BaseModel):
    code: str
    rate: float


class CurrencyBrief(BaseModel):
    base: str
    date: date
    rates: list[CurrencyRate]
    history: dict[str, dict[str, float]]
    supported: list[str]
    attribution: str = "Frankfurter / European Central Bank"


class NewsItem(BaseModel):
    id: str
    title: str
    url: HttpUrl
    source: str
    category: str
    published_at: datetime | None = None
    summary: str = ""
    image: HttpUrl | None = None


class NewsBrief(BaseModel):
    items: list[NewsItem]
    attribution: str = "Curated publisher RSS feeds"


class Holiday(BaseModel):
    date: date
    local_name: str
    name: str
    country_code: str
    global_holiday: bool


class HolidayBrief(BaseModel):
    holidays: list[Holiday]
    attribution: str = "Nager.Date"


class WorldEvent(BaseModel):
    id: str
    kind: str
    title: str
    occurred_at: datetime | None = None
    url: HttpUrl | None = None
    latitude: float | None = None
    longitude: float | None = None
    magnitude: float | None = None


class Launch(BaseModel):
    id: str
    name: str
    status: str
    window_start: datetime
    image: HttpUrl | None = None
    webcast: HttpUrl | None = None
    location: str = ""


class Apod(BaseModel):
    title: str
    explanation: str
    date: date
    media_type: str
    url: HttpUrl
    thumbnail_url: HttpUrl | None = None
    copyright: str | None = None


class WorldBrief(BaseModel):
    events: list[WorldEvent]
    launches: list[Launch]
    apod: list[Apod]
    attribution: list[str] = [
        "USGS",
        "NASA EONET",
        "Launch Library 2",
        "NASA APOD",
    ]
