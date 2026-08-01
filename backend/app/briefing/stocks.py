import asyncio
from typing import Any

from pydantic import HttpUrl

from app.briefing.provider import ProviderSupport, as_dict, as_list
from app.briefing.schemas import StockAsset, StockBrief
from app.core.config import DataProviderSettings

_SYMBOLS: dict[str, str] = {
    "AAPL": "Apple",
    "MSFT": "Microsoft",
    "GOOGL": "Alphabet",
    "AMZN": "Amazon",
    "NVDA": "NVIDIA",
    "META": "Meta Platforms",
    "TSLA": "Tesla",
    "JPM": "JPMorgan Chase",
    "V": "Visa",
    "WMT": "Walmart",
    "UNH": "UnitedHealth",
    "XOM": "Exxon Mobil",
    "MA": "Mastercard",
    "PG": "Procter & Gamble",
    "JNJ": "Johnson & Johnson",
    "HD": "Home Depot",
    "COST": "Costco",
    "ORCL": "Oracle",
    "NFLX": "Netflix",
    "AMD": "AMD",
    "ADBE": "Adobe",
    "CRM": "Salesforce",
    "BAC": "Bank of America",
    "KO": "Coca-Cola",
    "PEP": "PepsiCo",
}
# Yahoo's spark endpoint rejects batches larger than ~20 symbols.
_CHUNK_SIZE = 18
_LOGO_URL = "https://financialmodelingprep.com/image-stock/{symbol}.png"


class StockService:
    def __init__(self, provider: ProviderSupport, settings: DataProviderSettings) -> None:
        self._provider = provider
        self._base_url = settings.yahoo_finance_url

    async def get(self) -> StockBrief:
        async def load() -> StockBrief:
            symbols = list(_SYMBOLS)
            chunks = [symbols[i : i + _CHUNK_SIZE] for i in range(0, len(symbols), _CHUNK_SIZE)]
            payloads = await asyncio.gather(*(self._spark(chunk) for chunk in chunks))

            assets: list[StockAsset] = []
            for payload in payloads:
                for symbol, entry in as_dict(payload).items():
                    asset = _asset(symbol, as_dict(entry))
                    if asset is not None:
                        assets.append(asset)
            assets.sort(key=lambda item: item.symbol)

            ranked = sorted(assets, key=lambda item: item.change_pct, reverse=True)
            return StockBrief(
                assets=assets,
                top_gainers=ranked[:5],
                top_losers=list(reversed(ranked[-5:])),
            )

        return await self._provider.cached("stocks", load)

    async def _spark(self, symbols: list[str]) -> Any:
        return await self._provider.json(
            "Yahoo Finance",
            f"{self._base_url}/v8/finance/spark",
            params={"symbols": ",".join(symbols), "range": "1d", "interval": "15m"},
        )


def _asset(symbol: str, entry: dict[str, Any]) -> StockAsset | None:
    name = _SYMBOLS.get(symbol)
    closes = [float(value) for value in as_list(entry.get("close")) if value is not None]
    previous_close = entry.get("previousClose") or entry.get("chartPreviousClose")
    if name is None or not closes or not previous_close:
        return None
    price = closes[-1]
    change_pct = (price - float(previous_close)) / float(previous_close) * 100
    return StockAsset(
        id=symbol.lower(),
        symbol=symbol,
        name=name,
        image=HttpUrl(_LOGO_URL.format(symbol=symbol)),
        price_usd=price,
        change_pct=change_pct,
        sparkline=closes,
    )
