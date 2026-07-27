import asyncio
from datetime import date, timedelta

from app.briefing.provider import ProviderSupport, as_dict
from app.briefing.schemas import CurrencyBrief, CurrencyRate
from app.core.config import DataProviderSettings


class CurrencyService:
    def __init__(self, provider: ProviderSupport, settings: DataProviderSettings) -> None:
        self._provider = provider
        self._base_url = settings.frankfurter_url

    async def get(
        self,
        base: str,
        symbols: list[str],
        start: date,
        end: date,
    ) -> CurrencyBrief:
        base = base.upper()
        symbols = sorted({item.upper() for item in symbols if item.upper() != base})
        key = f"currencies:{base}:{','.join(symbols)}:{start}:{end}"

        async def load() -> CurrencyBrief:
            params = {"from": base, "to": ",".join(symbols)}
            latest, history, supported = await asyncio.gather(
                self._provider.json(
                    "Frankfurter",
                    f"{self._base_url}/latest",
                    params=params,
                ),
                self._provider.json(
                    "Frankfurter",
                    f"{self._base_url}/{start}..{end}",
                    params=params,
                ),
                self._provider.json("Frankfurter", f"{self._base_url}/currencies"),
            )
            latest_map = as_dict(as_dict(latest).get("rates"))
            history_map = {
                str(day): {str(code): float(value) for code, value in as_dict(rates).items()}
                for day, rates in as_dict(as_dict(history).get("rates")).items()
            }
            return CurrencyBrief(
                base=base,
                date=date.fromisoformat(str(as_dict(latest)["date"])),
                rates=[
                    CurrencyRate(code=str(code), rate=float(value))
                    for code, value in latest_map.items()
                ],
                history=history_map,
                supported=sorted(str(code) for code in as_dict(supported)),
            )

        return await self._provider.cached(key, load)


def currency_window(days: int) -> tuple[date, date]:
    end = date.today()
    return end - timedelta(days=days), end
