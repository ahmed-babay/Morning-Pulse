from datetime import date

from app.briefing.provider import ProviderSupport, as_list
from app.briefing.schemas import Holiday, HolidayBrief
from app.core.config import DataProviderSettings


class HolidayService:
    def __init__(self, provider: ProviderSupport, settings: DataProviderSettings) -> None:
        self._provider = provider
        self._base_url = settings.nager_url

    async def get(self, country: str, year: int) -> HolidayBrief:
        country = country.upper()

        async def load() -> HolidayBrief:
            payload = await self._provider.json(
                "Nager.Date",
                f"{self._base_url}/PublicHolidays/{year}/{country}",
            )
            return HolidayBrief(
                holidays=[
                    Holiday(
                        date=date.fromisoformat(str(item["date"])),
                        local_name=str(item["localName"]),
                        name=str(item["name"]),
                        country_code=str(item["countryCode"]),
                        global_holiday=bool(item.get("global", True)),
                    )
                    for item in as_list(payload)
                ]
            )

        return await self._provider.cached(f"holidays:{country}:{year}", load)
