from typing import TypeVar

import httpx
from pydantic import BaseModel

from app.core.config import ProviderSettings
from app.core.errors import ApiError
from app.core.http import HttpClient

ModelT = TypeVar("ModelT", bound=BaseModel)


class ProviderClient:
    """Typed helper for future external data providers."""

    provider_name = "provider"

    def __init__(self, http: HttpClient, settings: ProviderSettings) -> None:
        self._http = http
        self._settings = settings

    async def get_model(
        self,
        path: str,
        model_type: type[ModelT],
        *,
        params: dict[str, str | int | float] | None = None,
    ) -> ModelT:
        if not self._settings.base_url:
            raise ApiError(503, "provider_not_configured", f"{self.provider_name} is unavailable")

        try:
            response = await self._http.get(
                f"{self._settings.base_url.rstrip('/')}/{path.lstrip('/')}",
                params=params,
                headers=self._auth_headers(),
            )
            response.raise_for_status()
            return model_type.model_validate(response.json())
        except (httpx.HTTPError, ValueError) as exc:
            raise ApiError(
                502,
                "provider_error",
                f"{self.provider_name} returned an invalid response",
            ) from exc

    def _auth_headers(self) -> dict[str, str]:
        if self._settings.api_key is None:
            return {}
        return {"Authorization": f"Bearer {self._settings.api_key.get_secret_value()}"}
