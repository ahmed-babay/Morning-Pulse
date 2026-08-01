from app.briefing.provider import ProviderSupport, as_dict, as_list
from app.chat.schemas import ChatReply, ChatRequest
from app.core.config import ChatSettings
from app.core.errors import ApiError

_SYSTEM_INSTRUCTION = (
    "You are the assistant embedded in Morning Pulse, a personal morning briefing "
    "dashboard covering weather, crypto, stocks, currencies, news, and events. "
    "Be concise and helpful."
)


class ChatService:
    def __init__(self, provider: ProviderSupport, settings: ChatSettings) -> None:
        self._provider = provider
        self._settings = settings

    async def reply(self, request: ChatRequest) -> ChatReply:
        api_key = self._settings.gemini_api_key
        if api_key is None:
            raise ApiError(424, "chat_not_configured", "Connect a Gemini API key to enable chat")
        if not request.messages:
            raise ApiError(422, "empty_conversation", "Send at least one message")
        if len(request.messages) > self._settings.max_messages:
            raise ApiError(422, "conversation_too_long", "Conversation is too long")
        for message in request.messages:
            if len(message.content) > self._settings.max_message_chars:
                raise ApiError(422, "message_too_long", "A message is too long")

        contents = [
            {
                "role": "model" if message.role == "assistant" else "user",
                "parts": [{"text": message.content}],
            }
            for message in request.messages
        ]
        payload = await self._provider.post_json(
            "Gemini",
            f"{self._settings.gemini_url}/models/{self._settings.gemini_model}:generateContent",
            json_body={
                "contents": contents,
                "systemInstruction": {"parts": [{"text": _SYSTEM_INSTRUCTION}]},
            },
            headers={"x-goog-api-key": api_key.get_secret_value()},
        )
        text = _extract_text(payload)
        if text is None:
            raise ApiError(502, "chat_provider_error", "Chat is temporarily unavailable")
        return ChatReply(reply=text, model=self._settings.gemini_model)


def _extract_text(payload: object) -> str | None:
    candidates = as_list(as_dict(payload).get("candidates"))
    if not candidates:
        return None
    content = as_dict(as_dict(candidates[0]).get("content"))
    parts = as_list(content.get("parts"))
    if not parts:
        return None
    text = as_dict(parts[0]).get("text")
    return text if isinstance(text, str) else None
