from fastapi import APIRouter, Request

from app.chat.schemas import ChatReply, ChatRequest
from app.chat.service import ChatService
from app.core.errors import DataEnvelope
from app.core.request_context import get_request_id

router = APIRouter(prefix="/chat", tags=["chat"])


def service(request: Request) -> ChatService:
    return request.app.state.chat_service  # type: ignore[no-any-return]


@router.post("", response_model=DataEnvelope[ChatReply])
async def chat(request: Request, body: ChatRequest) -> DataEnvelope[ChatReply]:
    return DataEnvelope(data=await service(request).reply(body), request_id=get_request_id())
