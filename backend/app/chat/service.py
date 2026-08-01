import json
from collections.abc import AsyncIterator
from typing import Any

from pydantic import SecretStr

from app.briefing.provider import ProviderSupport, as_dict, as_list
from app.chat.schemas import ChatRequest
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

    async def stream_reply(self, request: ChatRequest) -> AsyncIterator[str]:
        """Validate synchronously, then return an unstarted generator to stream.

        Keeping validation outside the generator body means an invalid request
        raises ApiError before any StreamingResponse (and its 200 status) is
        committed to the client.
        """
        api_key = self._validate(request)
        contents = [
            {
                "role": "model" if message.role == "assistant" else "user",
                "parts": [{"text": message.content}],
            }
            for message in request.messages
        ]
        return self._stream(contents, api_key)

    def _validate(self, request: ChatRequest) -> SecretStr:
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
        return api_key

    async def _stream(
        self, contents: list[dict[str, Any]], api_key: SecretStr
    ) -> AsyncIterator[str]:
        model = self._settings.gemini_model
        url = f"{self._settings.gemini_url}/models/{model}:streamGenerateContent"
        headers = {
            "x-goog-api-key": api_key.get_secret_value(),
            "Content-Type": "application/json",
        }
        body = {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": _SYSTEM_INSTRUCTION}]},
            # Gemini's default "thinking" budget adds ~15-20s of silent reasoning
            # before the first visible token. This app doesn't need deep
            # reasoning for a briefing assistant, so keep it minimal for a
            # responsive stream.
            "generationConfig": {"thinkingConfig": {"thinkingLevel": "minimal"}},
        }
        async with self._provider.http.stream(
            "POST", url, params={"alt": "sse"}, json=body, headers=headers
        ) as response:
            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                try:
                    payload = json.loads(line[len("data: ") :])
                except ValueError:
                    continue
                text = _extract_text(payload)
                if text:
                    yield text


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
