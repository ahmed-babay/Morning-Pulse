from fastapi import APIRouter, Request

from app.core.errors import DataEnvelope
from app.core.request_context import get_request_id
from app.github.schemas import GitHubBrief, TrendingBrief
from app.github.service import GitHubService

router = APIRouter(prefix="/github", tags=["github"])


def service(request: Request) -> GitHubService:
    return request.app.state.github_service  # type: ignore[no-any-return]


@router.get("/notifications", response_model=DataEnvelope[GitHubBrief])
async def notifications(request: Request) -> DataEnvelope[GitHubBrief]:
    return DataEnvelope(data=await service(request).notifications(), request_id=get_request_id())


@router.get("/trending", response_model=DataEnvelope[TrendingBrief])
async def trending(request: Request) -> DataEnvelope[TrendingBrief]:
    return DataEnvelope(data=await service(request).trending(), request_id=get_request_id())
