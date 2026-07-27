from typing import Any

from app.briefing.provider import ProviderSupport, as_dict, as_list
from app.briefing.schemas import CryptoAsset, CryptoBrief
from app.core.config import DataProviderSettings


class CryptoService:
    def __init__(self, provider: ProviderSupport, settings: DataProviderSettings) -> None:
        self._provider = provider
        self._base_url = settings.coingecko_url

    async def get(self) -> CryptoBrief:
        async def load() -> CryptoBrief:
            assets_payload = await self._markets(
                ids="bitcoin,ethereum",
                order="market_cap_desc",
            )
            gainers_payload = await self._markets(
                order="price_change_percentage_24h_desc",
                per_page=10,
                page=1,
            )
            assets = [_asset(item) for item in as_list(assets_payload)]
            gainers = sorted(
                (_asset(item) for item in as_list(gainers_payload)),
                key=lambda item: item.change_24h,
                reverse=True,
            )[:5]
            return CryptoBrief(assets=assets, top_gainers=gainers)

        return await self._provider.cached("crypto", load)

    async def _markets(self, **params: str | int) -> Any:
        return await self._provider.json(
            "CoinGecko",
            f"{self._base_url}/coins/markets",
            params={
                "vs_currency": "usd",
                "sparkline": "true",
                "price_change_percentage": "24h",
                **params,
            },
        )


def _asset(item: dict[str, Any]) -> CryptoAsset:
    sparkline = as_dict(item.get("sparkline_in_7d")).get("price", [])
    return CryptoAsset(
        id=str(item["id"]),
        symbol=str(item["symbol"]).upper(),
        name=str(item["name"]),
        image=item.get("image"),
        price_usd=float(item.get("current_price") or 0),
        change_24h=float(item.get("price_change_percentage_24h") or 0),
        market_cap=float(item.get("market_cap") or 0),
        sparkline=[float(value) for value in as_list(sparkline)][::6],
    )
