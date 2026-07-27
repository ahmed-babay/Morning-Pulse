from typing import Literal

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend() -> Literal["asyncio"]:
    return "asyncio"


@pytest.mark.anyio
async def test_health_endpoints() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        root_response = await client.get("/health")
        versioned_response = await client.get("/api/v1/health")

    assert root_response.status_code == 200
    assert root_response.json()["status"] == "ok"
    assert versioned_response.status_code == 200
    assert versioned_response.json() == {
        "status": "ok",
        "service": "Morning Pulse API",
        "environment": "development",
    }
