from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.chat.schemas import ChatRequest
from app.chat.service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])


def service(request: Request) -> ChatService:
    return request.app.state.chat_service  # type: ignore[no-any-return]


@router.post("")
async def chat(request: Request, body: ChatRequest) -> StreamingResponse:
    stream = await service(request).stream_reply(body)
    return StreamingResponse(stream, media_type="text/plain")
